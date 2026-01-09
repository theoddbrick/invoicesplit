// Template system for custom field extraction

export type FieldType = "text" | "number" | "date" | "currency";

export type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY/MM/DD";
export type CurrencyFormat = "decimal" | "with-symbol" | "with-code";
export type NumberFormat = "plain" | "with-commas" | "scientific";

export interface FieldFormatOptions {
  dateFormat?: DateFormat;
  currencyFormat?: CurrencyFormat;
  numberFormat?: NumberFormat;
  currencySymbol?: string;  // e.g., "$", "S$", "USD"
}

export interface ExtractionField {
  id: string;
  name: string;              // Display name (e.g., "Invoice NO.")
  key: string;               // JSON key (e.g., "invoiceNo")
  description: string;       // Helps AI understand what to extract
  required: boolean;         // If true, warn if field is empty
  type: FieldType;          // Data type for validation
  validation?: string;       // Optional regex pattern
  formatOptions?: FieldFormatOptions;  // User-configurable format preferences
  enabled?: boolean;         // If false, field is not extracted (default: true)
}

export interface ExtractionTemplate {
  id: string;
  name: string;              // Template name (e.g., "Travel Invoices")
  description: string;       // What this template is for
  fields: ExtractionField[];
  documentType: string;      // Expected document type (for validation)
  createdAt: number;
  updatedAt: number;
}

// No default template - fully user-driven discovery
// Users create profiles through AI discovery process

// LocalStorage utilities
const STORAGE_KEY_TEMPLATES = "invoicesplit_templates";
const STORAGE_KEY_ACTIVE = "invoicesplit_active_template";

export function loadTemplates(): ExtractionTemplate[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!stored) return [];
    
    const templates = JSON.parse(stored) as ExtractionTemplate[];
    return templates;
  } catch (error) {
    console.error("Failed to load templates:", error);
    return [];
  }
}

export function saveTemplates(templates: ExtractionTemplate[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    console.error("Failed to save templates:", error);
  }
}

export function getActiveTemplateId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE);
  } catch (error) {
    return null;
  }
}

export function setActiveTemplateId(templateId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, templateId);
  } catch (error) {
    console.error("Failed to set active template:", error);
  }
}

export function createNewTemplate(name: string, description: string): ExtractionTemplate {
  return {
    id: `template-${Date.now()}`,
    name,
    description,
    fields: [],
    documentType: "document",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function generateFieldKey(fieldName: string): string {
  // Convert "Invoice NO." to "invoiceNo"
  return fieldName
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/[^a-z0-9]/g, '');
}
