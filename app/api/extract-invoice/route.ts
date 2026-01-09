import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { qwen, MODEL_NAME } from "@/lib/ai";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window === "undefined") {
  // Server-side configuration
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export const maxDuration = 60; // Set max duration to 60 seconds for AI processing

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

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

    // Use AI to extract invoice data
    const prompt = `You are an expert invoice data extractor. Analyze the following invoice text and extract these specific fields:

1. Order ID
2. Invoice NO. (Invoice Number)
3. Tax Invoice Date (in YYYY-MM-DD format)
4. Invoice Amount (total gross amount, include currency)

Invoice text:
${pdfText}

Please respond ONLY with a valid JSON object in this exact format (no additional text or markdown):
{
  "orderId": "extracted order id or booking number",
  "invoiceNo": "extracted invoice number",
  "taxInvoiceDate": "YYYY-MM-DD",
  "invoiceAmount": "amount with currency"
}

If a field cannot be found, use an empty string "". Be precise and extract exact values from the invoice.`;

    const { text } = await generateText({
      model: qwen(MODEL_NAME),
      prompt: prompt,
      temperature: 0.1,
      maxTokens: 500,
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

    return NextResponse.json({
      success: true,
      invoiceData,
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
