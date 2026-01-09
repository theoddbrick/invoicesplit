// Template system for custom field extraction

export type FieldType = "text" | "number" | "date" | "currency";

export interface ExtractionField {
  id: string;
  name: string;              // Display name (e.g., "Invoice NO.")
  key: string;               // JSON key (e.g., "invoiceNo")
  description: string;       // Helps AI understand what to extract
  required: boolean;         // If true, warn if field is empty
  type: FieldType;          // Data type for validation
  validation?: string;       // Optional regex pattern
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

// Default built-in template (cannot be deleted)
export const DEFAULT_TEMPLATE: ExtractionTemplate = {
  id: "default",
  name: "Standard Invoice",
  description: "Default invoice extraction with 4 standard fields",
  fields: [
    {
      id: "field-1",
      name: "Order ID",
      key: "orderId",
      description: "Order or booking reference number",
      required: false,
      type: "text"
    },
    {
      id: "field-2",
      name: "Invoice NO.",
      key: "invoiceNo",
      description: "Invoice number or ID",
      required: true,
      type: "text"
    },
    {
      id: "field-3",
      name: "Tax Invoice Date",
      key: "taxInvoiceDate",
      description: "Invoice date in YYYY-MM-DD format",
      required: true,
      type: "date"
    },
    {
      id: "field-4",
      name: "Invoice Amount",
      key: "invoiceAmount",
      description: "Total invoice amount (decimal only, no currency symbols)",
      required: true,
      type: "currency"
    }
  ],
  documentType: "invoice",
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// LocalStorage utilities
const STORAGE_KEY_TEMPLATES = "invoicesplit_templates";
const STORAGE_KEY_ACTIVE = "invoicesplit_active_template";

export function loadTemplates(): ExtractionTemplate[] {
  if (typeof window === "undefined") return [DEFAULT_TEMPLATE];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!stored) return [DEFAULT_TEMPLATE];
    
    const templates = JSON.parse(stored) as ExtractionTemplate[];
    // Always include default template
    const hasDefault = templates.some(t => t.id === "default");
    return hasDefault ? templates : [DEFAULT_TEMPLATE, ...templates];
  } catch (error) {
    console.error("Failed to load templates:", error);
    return [DEFAULT_TEMPLATE];
  }
}

export function saveTemplates(templates: ExtractionTemplate[]): void {
  if (typeof window === "undefined") return;
  
  try {
    // Filter out default template (it's always loaded)
    const customTemplates = templates.filter(t => t.id !== "default");
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(customTemplates));
  } catch (error) {
    console.error("Failed to save templates:", error);
  }
}

export function getActiveTemplateId(): string {
  if (typeof window === "undefined") return "default";
  
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE) || "default";
  } catch (error) {
    return "default";
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
