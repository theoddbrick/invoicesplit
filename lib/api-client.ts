// Centralized API client for invoice extraction

import { ExtractionTemplate } from "./templates";
import { ExtractionResponse, ExtractionError } from "./types";

/**
 * Extract data from a PDF file using a template
 * @param file - PDF file to process
 * @param template - Extraction template with fields to extract
 * @param options - Optional parameters for extraction
 * @returns Promise with extraction response
 * @throws Error if extraction fails
 */
export async function extractDataFromPDF(
  file: File,
  template: ExtractionTemplate,
  options?: {
    enabledFields?: Set<string>;  // Subset of fields to extract
    customInstructions?: Record<string, string>;  // Field-specific instruction overrides
  }
): Promise<ExtractionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("template", JSON.stringify(template));
  
  if (options?.enabledFields) {
    formData.append("enabledFields", JSON.stringify(Array.from(options.enabledFields)));
  }
  
  if (options?.customInstructions) {
    formData.append("customInstructions", JSON.stringify(options.customInstructions));
  }

  const response = await fetch("/api/extract-invoice", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ExtractionError;
    throw new Error(error.error || "Extraction failed");
  }

  return data as ExtractionResponse;
}

/**
 * Extract data from multiple PDF files in batches
 * @param files - Array of PDF files
 * @param template - Extraction template
 * @param batchSize - Number of files to process concurrently (default: 5)
 * @param onProgress - Callback for progress updates
 * @returns Promise with array of results
 */
export async function extractDataBatch(
  files: File[],
  template: ExtractionTemplate,
  options?: {
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
    onFileComplete?: (fileName: string, result: ExtractionResponse | Error) => void;
  }
): Promise<Array<ExtractionResponse | Error>> {
  const batchSize = options?.batchSize || 5;
  const results: Array<ExtractionResponse | Error> = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, Math.min(i + batchSize, files.length));
    
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          const result = await extractDataFromPDF(file, template);
          options?.onFileComplete?.(file.name, result);
          return result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error("Unknown error");
          options?.onFileComplete?.(file.name, err);
          return err;
        }
      })
    );

    results.push(...batchResults);
    options?.onProgress?.(results.length, files.length);
  }

  return results;
}
