// Template training system

import { ExtractionTemplate } from "./templates";

export interface FieldExtraction {
  value: string;
  confidence: number;
  textPosition?: { start: number; end: number };
  source?: string; // Snippet from PDF where found
}

export interface TrainingSample {
  id: string;
  fileName: string;
  pdfText: string;
  extractedFields: Record<string, FieldExtraction>;
  userCorrections: Record<string, string>; // field.key → corrected value
  reviewed: boolean;
  overallConfidence: number;
}

export interface TrainingSession {
  templateId: string;
  samples: TrainingSample[];
  currentIndex: number;
  isComplete: boolean;
}

export interface TrainingResults {
  fieldSuccessRates: Record<string, { success: number; total: number }>;
  suggestions: TemplateSuggestion[];
  averageConfidence: number;
}

export interface TemplateSuggestion {
  fieldKey: string;
  fieldName: string;
  type: "description" | "type" | "required";
  suggestion: string;
  reason: string;
}

// Calculate training results
export function calculateTrainingResults(
  samples: TrainingSample[],
  template: ExtractionTemplate
): TrainingResults {
  const fieldSuccessRates: Record<string, { success: number; total: number }> = {};
  const suggestions: TemplateSuggestion[] = [];

  // Initialize counters
  template.fields.forEach(field => {
    fieldSuccessRates[field.key] = { success: 0, total: 0 };
  });

  // Calculate success rates
  samples.forEach(sample => {
    template.fields.forEach(field => {
      const extracted = sample.extractedFields[field.key];
      const corrected = sample.userCorrections[field.key];
      
      fieldSuccessRates[field.key].total++;
      
      // Success if:
      // 1. User marked as correct (no correction), OR
      // 2. Extraction matched user's correction
      if (!corrected || corrected === extracted?.value) {
        if (extracted && extracted.value && extracted.value.trim() !== "") {
          fieldSuccessRates[field.key].success++;
        }
      }
    });
  });

  // Generate suggestions based on low success rates
  template.fields.forEach(field => {
    const rate = fieldSuccessRates[field.key];
    const successPercent = rate.total > 0 ? (rate.success / rate.total) * 100 : 0;

    if (successPercent < 70 && rate.total >= 2) {
      suggestions.push({
        fieldKey: field.key,
        fieldName: field.name,
        type: "description",
        suggestion: `Try adding more details about where this field appears in the document`,
        reason: `Only ${successPercent.toFixed(0)}% success rate (${rate.success}/${rate.total} samples)`
      });
    }
  });

  // Calculate average confidence
  const avgConfidence = samples.reduce((sum, s) => sum + s.overallConfidence, 0) / Math.max(samples.length, 1);

  return {
    fieldSuccessRates,
    suggestions,
    averageConfidence: avgConfidence
  };
}

// Find text snippet around extracted value
export function findTextContext(fullText: string, value: string, contextChars: number = 50): string | undefined {
  if (!value || !fullText) return undefined;
  
  const index = fullText.toLowerCase().indexOf(value.toLowerCase());
  if (index === -1) return undefined;
  
  const start = Math.max(0, index - contextChars);
  const end = Math.min(fullText.length, index + value.length + contextChars);
  
  let context = fullText.substring(start, end);
  if (start > 0) context = "..." + context;
  if (end < fullText.length) context = context + "...";
  
  return context;
}
