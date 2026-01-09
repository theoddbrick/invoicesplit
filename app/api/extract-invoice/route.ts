import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { qwenClient, MODEL_NAME } from "@/lib/ai";
import pdfParse from "pdf-parse";
import { ExtractionTemplate } from "@/lib/templates";
import { buildExtractionPrompt, buildValidationPrompt, savePromptVersion } from "@/lib/prompt-engineering";
import { ValidationResult } from "@/lib/types";

export const maxDuration = 60; // Set max duration to 60 seconds for AI processing

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
): Promise<ValidationResult> {
  try {
    const validationPrompt = buildValidationPrompt(pdfText, expectedType);

    const { text } = await generateText({
      model: qwenClient(MODEL_NAME),
      prompt: validationPrompt,
      temperature: 0.1,
      maxTokens: 200,
    });

    const parsed = JSON.parse(text.trim().replace(/```json\n?|```\n?/g, ""));
    
    return {
      isValidDocument: parsed.isValid,
      detectedType: parsed.detectedType,
      expectedType: expectedType,
      confidence: parsed.confidence,
      warnings: [],
      reason: parsed.reason
    };
  } catch (error) {
    // If validation fails, assume valid (fail open)
    console.error("Validation error:", error);
    return {
      isValidDocument: true,
      detectedType: expectedType,
      expectedType: expectedType,
      confidence: 50,
      warnings: ["Validation check failed, proceeding with extraction"]
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

    // Parse optional parameters for training mode
    const enabledFieldsJson = formData.get("enabledFields") as string | null;
    const customInstructionsJson = formData.get("customInstructions") as string | null;
    
    let enabledFields: Set<string> | undefined;
    let customInstructions: Record<string, string> | undefined;
    
    if (enabledFieldsJson) {
      try {
        const fields = JSON.parse(enabledFieldsJson) as string[];
        enabledFields = new Set(fields);
      } catch (error) {
        console.error("Failed to parse enabledFields:", error);
      }
    } else {
      // If no explicit enabledFields provided, filter based on template field's enabled property
      const explicitlyEnabledFields = template.fields
        .filter(f => f.enabled !== false) // enabled is true or undefined (default true)
        .map(f => f.key);
      
      if (explicitlyEnabledFields.length > 0) {
        enabledFields = new Set(explicitlyEnabledFields);
      }
    }
    
    if (customInstructionsJson) {
      try {
        customInstructions = JSON.parse(customInstructionsJson);
      } catch (error) {
        console.error("Failed to parse customInstructions:", error);
      }
    }

    // Validate document type
    const validation = await validateDocument(pdfText, template.documentType);
    
    if (!validation.isValidDocument && validation.confidence > 70) {
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

    // Build extraction prompt using prompt engineering system
    const { prompt, version } = buildExtractionPrompt(template, pdfText, {
      enabledFields,
      customInstructions
    });

    // Use Alibaba Cloud Model Studio (DashScope) with Qwen-Max
    const { text } = await generateText({
      model: qwenClient(MODEL_NAME),
      prompt: prompt,
      temperature: 0.1,
      maxTokens: 1000,
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
        isValidDocument: validation.isValidDocument,
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
