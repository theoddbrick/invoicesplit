import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { qwenClient, MODEL_NAME } from "@/lib/ai";
import pdfParse from "pdf-parse";
import { FieldType } from "@/lib/templates";

export const maxDuration = 60;

interface DiscoveredField {
  suggestedName: string;
  suggestedKey: string;
  suggestedType: FieldType;
  foundInSamples: number;
  sampleValues: Array<{ fileName: string; value: string }>;
  confidence: number;
  suggestedDescription: string;
}

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfBuffer = Buffer.from(buffer);
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

function generateFieldKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/[^a-z0-9]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userIntent = formData.get("userIntent") as string;
    const files = formData.getAll("files") as File[];

    if (!userIntent || userIntent.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a description of what you want to extract" },
        { status: 400 }
      );
    }

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: "Please upload at least 2 sample documents" },
        { status: 400 }
      );
    }

    if (files.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 files allowed" },
        { status: 400 }
      );
    }

    // Extract text from all samples (limit to first 10 for discovery)
    const samples = await Promise.all(
      files.slice(0, 10).map(async (file) => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const fullText = await extractTextFromPDF(arrayBuffer);
          return {
            fileName: file.name,
            fullText: fullText, // Keep full text for preview
            text: fullText.substring(0, 3000) // Limited text for AI analysis
          };
        } catch (error) {
          return {
            fileName: file.name,
            fullText: "",
            text: "",
            error: error instanceof Error ? error.message : "Failed to extract"
          };
        }
      })
    );

    const validSamples = samples.filter(s => s.text && s.text.length > 0);

    if (validSamples.length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from any of the sample documents" },
        { status: 400 }
      );
    }

    // Build discovery prompt
    const discoveryPrompt = `You are an expert document analyzer. The user wants to: "${userIntent}"

Analyze these ${validSamples.length} sample documents and discover ALL common data fields that should be extracted.

${validSamples.map((s, i) => `
Sample ${i + 1} (${s.fileName}):
${s.text.substring(0, 800)}
...
`).join("\n")}

For each field you discover:
1. Suggest a clear, descriptive field name
2. Identify the data type (text, number, date, or currency)
3. Count how many samples contain this field
4. Extract one example value from each sample
5. Provide a description of what this field represents
6. Estimate confidence (0-100)

Respond ONLY with valid JSON array:
[
  {
    "suggestedName": "Booking Number",
    "suggestedType": "text",
    "foundInSamples": 3,
    "sampleValues": ["123456", "789012", "345678"],
    "suggestedDescription": "The booking or reservation reference number",
    "confidence": 95
  }
]

Discover ALL fields that appear in the documents. Include:
- IDs and reference numbers
- Dates
- Names (people, companies, locations)
- Amounts and prices
- Any other relevant data points

Return 5-15 fields maximum. Focus on fields that appear in multiple samples.`;

    // Call AI for field discovery
    const { text } = await generateText({
      model: qwenClient(MODEL_NAME),
      prompt: discoveryPrompt,
      temperature: 0.2, // Slightly higher for creativity
      maxTokens: 2000,
    });

    // Parse discovered fields
    let rawFields: any[];
    try {
      const cleaned = text.trim().replace(/```json\n?|```\n?/g, "");
      rawFields = JSON.parse(cleaned);
    } catch (error) {
      console.error("Failed to parse discovery response:", text);
      return NextResponse.json(
        { error: "Failed to parse discovered fields", details: text },
        { status: 500 }
      );
    }

    // Process and enhance discovered fields
    const discoveredFields: DiscoveredField[] = rawFields.map(field => ({
      suggestedName: field.suggestedName || "Unknown Field",
      suggestedKey: generateFieldKey(field.suggestedName || "unknown"),
      suggestedType: (field.suggestedType as FieldType) || "text",
      foundInSamples: Math.min(field.foundInSamples || 1, validSamples.length),
      sampleValues: validSamples.slice(0, 3).map((s, i) => ({
        fileName: s.fileName,
        value: field.sampleValues?.[i] || ""
      })),
      confidence: Math.min(Math.max(field.confidence || 50, 0), 100),
      suggestedDescription: field.suggestedDescription || ""
    }));

    return NextResponse.json({
      success: true,
      discoveredFields,
      samplesAnalyzed: validSamples.length,
      userIntent,
      sampleTexts: validSamples.map(s => ({
        fileName: s.fileName,
        text: s.fullText || s.text
      }))
    });

  } catch (error) {
    console.error("Field discovery error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to discover fields",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
