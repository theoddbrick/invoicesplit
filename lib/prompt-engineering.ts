// Prompt engineering system for dynamic field extraction

import { ExtractionTemplate, ExtractionField } from "./templates";

/**
 * Versioned prompt for tracking what works
 */
export interface PromptVersion {
  version: string;
  timestamp: number;
  templateId: string;
  prompt: string;
  enabledFields: string[];
  customInstructions?: Record<string, string>;
}

/**
 * Options for prompt generation
 */
export interface PromptOptions {
  enabledFields?: Set<string>;  // Which fields to extract (for training)
  customInstructions?: Record<string, string>;  // Field-specific instruction overrides
  includeExamples?: boolean;  // Include example values
  strictMode?: boolean;  // More strict validation
}

/**
 * Build extraction prompt from template
 * Supports field enable/disable and custom instructions per field
 */
export function buildExtractionPrompt(
  template: ExtractionTemplate,
  documentText: string,
  options?: PromptOptions
): { prompt: string; version: string } {
  // Filter to only enabled fields
  const activeFields = template.fields.filter(f => 
    !options?.enabledFields || options.enabledFields.has(f.key)
  );

  if (activeFields.length === 0) {
    throw new Error("No fields enabled for extraction");
  }

  // Build field descriptions with user-configured type hints
  const fieldDescriptions = activeFields.map((field, index) => {
    // Use custom instruction if provided (from training), otherwise use field description
    const baseDescription = options?.customInstructions?.[field.key] || field.description;
    
    let typeHint = "";
    if (field.type === "date") {
      const dateFormat = field.formatOptions?.dateFormat || "YYYY-MM-DD";
      typeHint = ` (format as ${dateFormat})`;
    } else if (field.type === "currency") {
      const currencyFormat = field.formatOptions?.currencyFormat || "decimal";
      if (currencyFormat === "decimal") {
        typeHint = " (IMPORTANT: Extract ONLY the numeric decimal value, NO currency symbols. Example: '267.35' not 'S$267.35')";
      } else if (currencyFormat === "with-symbol") {
        const symbol = field.formatOptions?.currencySymbol || "$";
        typeHint = ` (include currency symbol: ${symbol}267.35)`;
      } else if (currencyFormat === "with-code") {
        typeHint = " (include currency code: USD 267.35 or SGD 267.35)";
      }
    } else if (field.type === "number") {
      const numberFormat = field.formatOptions?.numberFormat || "plain";
      if (numberFormat === "with-commas") {
        typeHint = " (format with commas: 1,234.56)";
      } else {
        typeHint = " (extract as numeric value only)";
      }
    }
    
    const requiredMark = field.required ? " [REQUIRED]" : "";
    
    return `${index + 1}. ${field.name}${requiredMark}: ${baseDescription}${typeHint}`;
  }).join("\n");

  // Build expected JSON structure
  const jsonStructure = activeFields.reduce((acc, field) => {
    acc[field.key] = `extracted ${field.name.toLowerCase()}`;
    return acc;
  }, {} as Record<string, string>);

  // Build the prompt
  const prompt = `You are an expert document data extractor. Analyze the following ${template.documentType} text and extract these specific fields:

${fieldDescriptions}

Document text:
${documentText}

Please respond ONLY with a valid JSON object in this exact format (no additional text or markdown):
${JSON.stringify(jsonStructure, null, 2)}

CRITICAL RULES:
- For currency/amount fields: Return ONLY the decimal number (e.g., "267.35" not "S$267.35", "USD 267.35", or "SGD 267.35")
- For date fields: Use YYYY-MM-DD format
- For number fields: Extract numeric value only
- If a field cannot be found, use an empty string ""
- Be precise and extract exact values from the document
- Focus on accuracy over speed${options?.strictMode ? '\n- If unsure, return empty string rather than guessing' : ''}`;

  // Generate version ID
  const version = `v${Date.now()}-${activeFields.length}f`;

  return { prompt, version };
}

/**
 * Build document validation prompt
 */
export function buildValidationPrompt(
  documentText: string,
  expectedType: string
): string {
  return `You are a document classifier. Analyze the following text and determine:

1. Is this a valid ${expectedType}?
2. What type of document is this?
3. Confidence level (0-100)

Document text:
${documentText.substring(0, 2000)}${documentText.length > 2000 ? '...(truncated)' : ''}

Respond ONLY with valid JSON:
{
  "isValid": true or false,
  "detectedType": "invoice|receipt|statement|bill|contract|article|letter|other",
  "confidence": 0-100,
  "reason": "brief explanation if not valid"
}`;
}

/**
 * Save prompt version to history (for tracking what works)
 */
export function savePromptVersion(promptVersion: PromptVersion): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = `invoicesplit_prompt_history_${promptVersion.templateId}`;
    const history = JSON.parse(localStorage.getItem(key) || "[]") as PromptVersion[];
    
    history.push(promptVersion);
    
    // Keep last 20 versions
    if (history.length > 20) {
      history.shift();
    }
    
    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save prompt version:", error);
  }
}

/**
 * Load prompt history for a template
 */
export function loadPromptHistory(templateId: string): PromptVersion[] {
  if (typeof window === "undefined") return [];
  
  try {
    const key = `invoicesplit_prompt_history_${templateId}`;
    return JSON.parse(localStorage.getItem(key) || "[]") as PromptVersion[];
  } catch (error) {
    console.error("Failed to load prompt history:", error);
    return [];
  }
}

/**
 * Get custom instructions learned from training
 */
export function getTrainedInstructions(templateId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  
  try {
    const key = `invoicesplit_trained_instructions_${templateId}`;
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch (error) {
    return {};
  }
}

/**
 * Save trained instructions for a template
 */
export function saveTrainedInstructions(
  templateId: string,
  instructions: Record<string, string>
): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = `invoicesplit_trained_instructions_${templateId}`;
    localStorage.setItem(key, JSON.stringify(instructions));
  } catch (error) {
    console.error("Failed to save trained instructions:", error);
  }
}
