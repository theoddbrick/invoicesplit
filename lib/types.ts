// Shared types across the application

/**
 * Extracted data with dynamic fields
 * Keys are determined by the template's field definitions
 */
export interface ExtractedData {
  [key: string]: string;
}

/**
 * Validation result from document type detection
 */
export interface ValidationResult {
  isValidDocument: boolean;
  confidence: number;
  warnings: string[];
  detectedType?: string;
  expectedType?: string;
  reason?: string;
}

/**
 * Successful extraction response from API
 */
export interface ExtractionResponse {
  success: true;
  invoiceData: ExtractedData;
  validation?: ValidationResult;
}

/**
 * Error response from API
 */
export interface ExtractionError {
  success?: false;
  error: string;
  validation?: Partial<ValidationResult>;
  details?: string;
}

/**
 * Processing status for batch uploads
 */
export type ProcessingStatus = "pending" | "processing" | "success" | "error";

/**
 * Result of a single file extraction (for batch processing)
 */
export interface ExtractionResult {
  fileName: string;
  status: ProcessingStatus;
  data?: ExtractedData;
  error?: string;
  validation?: ValidationResult;
}

/**
 * Progress tracking for batch processing
 */
export interface BatchProgress {
  completed: number;
  total: number;
}
