import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { qwenClient, MODEL_NAME } from "@/lib/ai";
import pdfParse from "pdf-parse";
import { ExtractionTemplate, ExtractionField } from "@/lib/templates";

export const maxDuration = 60; // Set max duration to 60 seconds for AI processing

interface DocumentValidation {
  isValid: boolean;
  detectedType: string;
  confidence: number;
  reason?: string;
}

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to Buffer for pdf-parse
    const pdfBuffer = Buffer.from(buffer);
    
    // Use pdf-parse which works better in Node.js environment
    const data = await pdfParse(pdfBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("No text content found in PDF");
    }
    
    return data.text.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function validateDocument(
  pdfText: string,
  expectedType: string
): Promise<DocumentValidation> {
  try {
    const validationPrompt = `You are a document classifier. Analyze the following text and determine:

1. Is this a valid ${expectedType}?
2. What type of document is this?
3. Confidence level (0-100)

Document text:
${pdfText.substring(0, 2000)} ${pdfText.length > 2000 ? '...(truncated)' : ''}

Respond ONLY with valid JSON:
{
  "isValid": true or false,
  "detectedType": "invoice|receipt|statement|bill|contract|article|letter|other",
  "confidence": 0-100,
  "reason": "brief explanation if not valid"
}`;

    const { text } = await generateText({
      model: qwenClient(MODEL_NAME),
      prompt: validationPrompt,
      temperature: 0.1,
      maxTokens: 200,
    });

    let validation = JSON.parse(text.trim().replace(/```json\n?|```\n?/g, ""));
    return validation;
  } catch (error) {
    // If validation fails, assume valid (fail open)
    console.error("Validation error:", error);
    return {
      isValid: true,
      detectedType: expectedType,
      confidence: 50,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const templateJson = formData.get("template") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Parse template
    let template: ExtractionTemplate;
    try {
      template = templateJson ? JSON.parse(templateJson) : null;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid template format" },
        { status: 400 }
      );
    }

    if (!template || !template.fields || template.fields.length === 0) {
      return NextResponse.json(
        { error: "Template must have at least one field" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from PDF
    const pdfText = await extractTextFromPDF(arrayBuffer);

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }

    // Validate document type
    const validation = await validateDocument(pdfText, template.documentType);
    
    if (!validation.isValid && validation.confidence > 70) {
      return NextResponse.json({
        error: "Document type mismatch",
        validation: {
          expected: template.documentType,
          detected: validation.detectedType,
          confidence: validation.confidence,
          reason: validation.reason || `This appears to be a ${validation.detectedType}, not a ${template.documentType}`
        }
      }, { status: 400 });
    }

    // Generate dynamic AI prompt based on template
    const fieldDescriptions = template.fields.map((field, index) => {
      let typeHint = "";
      if (field.type === "date") {
        typeHint = " (format as YYYY-MM-DD)";
      } else if (field.type === "currency") {
        typeHint = " (IMPORTANT: Extract ONLY the numeric decimal value, NO currency symbols)";
      } else if (field.type === "number") {
        typeHint = " (extract as numeric value only)";
      }
      
      return `${index + 1}. ${field.name}: ${field.description}${typeHint}`;
    }).join("\n");

    const jsonStructure = template.fields.reduce((acc, field) => {
      acc[field.key] = `extracted ${field.name.toLowerCase()}`;
      return acc;
    }, {} as Record<string, string>);

    const prompt = `You are an expert document data extractor. Analyze the following ${template.documentType} text and extract these specific fields:

${fieldDescriptions}

Document text:
${pdfText}

Please respond ONLY with a valid JSON object in this exact format (no additional text or markdown):
${JSON.stringify(jsonStructure, null, 2)}

CRITICAL RULES:
- For currency/amount fields: Return ONLY the decimal number (e.g., "267.35" not "S$267.35")
- For date fields: Use YYYY-MM-DD format
- For number fields: Extract numeric value only
- If a field cannot be found, use an empty string ""
- Be precise and extract exact values from the document`;

    // Use Alibaba Cloud Model Studio (DashScope) with Qwen-Max
    // The qwenClient is configured with MODEL_STUDIO_KEY/DASHSCOPE_API_KEY
    const { text } = await generateText({
      model: qwenClient(MODEL_NAME),
      prompt: prompt,
      temperature: 0.1,
      maxTokens: 1000, // Increased for better response quality
    });

    // Parse AI response
    let invoiceData;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/```json\n?/, "").replace(/```\n?$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```\n?/, "").replace(/```\n?$/, "");
      }
      
      invoiceData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      return NextResponse.json(
        { error: "Failed to parse invoice data", details: text },
        { status: 500 }
      );
    }

    // Check for missing required fields
    const warnings: string[] = [];
    template.fields.forEach(field => {
      if (field.required && (!invoiceData[field.key] || invoiceData[field.key].trim() === "")) {
        warnings.push(`Required field "${field.name}" is empty or missing`);
      }
    });

    return NextResponse.json({
      success: true,
      invoiceData,
      validation: {
        isValidDocument: validation.isValid,
        confidence: validation.confidence,
        warnings
      }
    });
  } catch (error) {
    console.error("Invoice extraction error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process invoice",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
