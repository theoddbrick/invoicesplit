# Refactoring Plan - Before New Features

**Date:** 2026-01-09  
**Branch:** `feature/custom-templates`  
**Validated By:** Next.js DevTools MCP

---

## 🔍 Architecture Review Summary

### ✅ **What's Good:**
1. Clear folder structure (app/, components/, lib/)
2. TypeScript throughout
3. Zero runtime errors (MCP validated)
4. Component separation
5. No file persistence (privacy maintained)

### ⚠️ **Critical Issues Found:**

#### **Issue 1: Type Definition Conflicts**
**Location:** `app/page.tsx`
```typescript
// PROBLEM: Hardcoded 4 fields
export type InvoiceData = {
  orderId: string;
  invoiceNo: string;
  taxInvoiceDate: string;
  invoiceAmount: string;
};
```
**Blocks:** Dynamic templates with custom fields

#### **Issue 2: No Shared Types File**
**Problem:** Types scattered across files
- `InvoiceData` in page.tsx
- `ExtractionField` in templates.ts
- `FieldExtraction` in training.ts

#### **Issue 3: API Client Logic in Page Component**
**Location:** `app/page.tsx` line 52-89
```typescript
// 40 lines of fetch logic directly in component
const formData = new FormData();
formData.append("file", file);
const response = await fetch("/api/extract-invoice", ...)
```
**Problem:** Can't reuse for training mode

#### **Issue 4: Prompt Engineering Scattered**
**Location:** `app/api/extract-invoice/route.ts`
- Prompt generation mixed with API logic
- Hard to version or A/B test
- Can't save training improvements

#### **Issue 5: No Storage Abstraction**
**Current:** Direct LocalStorage calls
**Problem:** Will need to migrate to Supabase later

---

## 🎯 Required Refactorings

### Refactor 1: Create Shared Types File
**New File:** `lib/types.ts`

```typescript
// Shared types across the application

export interface ExtractedData {
  [key: string]: string;  // Dynamic fields
}

export interface ValidationResult {
  isValidDocument: boolean;
  confidence: number;
  warnings: string[];
  detectedType?: string;
  expectedType?: string;
  reason?: string;
}

export interface ExtractionResponse {
  success: boolean;
  invoiceData: ExtractedData;
  validation?: ValidationResult;
}

export interface ExtractionError {
  error: string;
  validation?: Partial<ValidationResult>;
  details?: string;
}

export type ProcessingStatus = "pending" | "processing" | "success" | "error";

export interface ExtractionResult {
  fileName: string;
  status: ProcessingStatus;
  data?: ExtractedData;
  error?: string;
  validation?: ValidationResult;
}
```

**Changes:**
- Update `app/page.tsx` to import from types.ts
- Remove local type definitions
- Use `ExtractedData` instead of `InvoiceData`

---

### Refactor 2: Create API Client
**New File:** `lib/api-client.ts`

```typescript
import { ExtractionTemplate } from "./templates";
import { ExtractionResponse, ExtractionError, ExtractedData } from "./types";

export async function extractDataFromPDF(
  file: File,
  template: ExtractionTemplate
): Promise<ExtractionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("template", JSON.stringify(template));

  const response = await fetch("/api/extract-invoice", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error: ExtractionError = await response.json();
    throw new Error(error.error || "Extraction failed");
  }

  return await response.json();
}
```

**Benefits:**
- ✅ Reusable in training mode
- ✅ Centralized error handling
- ✅ Easy to add retry logic
- ✅ Testable independently

---

### Refactor 3: Prompt Engineering System
**New File:** `lib/prompt-engineering.ts`

```typescript
import { ExtractionTemplate, ExtractionField } from "./templates";

export interface PromptVersion {
  version: string;
  timestamp: number;
  template: ExtractionTemplate;
  customInstructions?: Record<string, string>; // field.key → custom instruction
}

export function buildExtractionPrompt(
  template: ExtractionTemplate,
  options?: {
    enabledFields?: Set<string>;  // Which fields to extract
    customInstructions?: Record<string, string>;  // Field-specific overrides
    includeExamples?: boolean;
  }
): { prompt: string; version: string } {
  const activeFields = template.fields.filter(f => 
    !options?.enabledFields || options.enabledFields.has(f.key)
  );

  const fieldDescriptions = activeFields.map((field, index) => {
    const customInstruction = options?.customInstructions?.[field.key];
    const description = customInstruction || field.description;
    
    let typeHint = "";
    if (field.type === "date") {
      typeHint = " (format as YYYY-MM-DD)";
    } else if (field.type === "currency") {
      typeHint = " (ONLY numeric decimal, NO currency symbols)";
    } else if (field.type === "number") {
      typeHint = " (numeric value only)";
    }
    
    return `${index + 1}. ${field.name}: ${description}${typeHint}`;
  }).join("\n");

  const jsonStructure = activeFields.reduce((acc, field) => {
    acc[field.key] = `extracted ${field.name.toLowerCase()}`;
    return acc;
  }, {} as Record<string, string>);

  const prompt = `You are an expert document data extractor. Analyze the following ${template.documentType} text and extract these specific fields:

${fieldDescriptions}

Document text:
{{DOCUMENT_TEXT}}

Respond ONLY with valid JSON in this exact format:
${JSON.stringify(jsonStructure, null, 2)}

CRITICAL RULES:
- For currency fields: ONLY decimal numbers (e.g., "267.35" not "S$267.35")
- For date fields: Use YYYY-MM-DD format
- For number fields: Extract numeric value only
- If a field cannot be found, use empty string ""
- Be precise and extract exact values`;

  const version = `v${Date.now()}`;
  
  return { prompt, version };
}

export function savePromptVersion(
  templateId: string,
  promptVersion: PromptVersion
): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = `invoicesplit_prompt_${templateId}`;
    const history = JSON.parse(localStorage.getItem(key) || "[]");
    history.push(promptVersion);
    // Keep last 10 versions
    if (history.length > 10) history.shift();
    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save prompt version:", error);
  }
}
```

**Benefits:**
- ✅ Versioned prompts (can track what worked)
- ✅ Field-specific overrides (training improvements)
- ✅ Enable/disable fields support
- ✅ Testable prompt generation
- ✅ Easy to A/B test

---

### Refactor 4: Storage Abstraction Layer
**New File:** `lib/storage.ts`

```typescript
import { ExtractionTemplate } from "./templates";

// Abstract storage interface (future: Supabase)
export interface TemplateStorage {
  loadTemplates(): Promise<ExtractionTemplate[]>;
  saveTemplate(template: ExtractionTemplate): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  getActiveTemplateId(): Promise<string>;
  setActiveTemplateId(id: string): Promise<void>;
}

// LocalStorage implementation (current)
export class LocalTemplateStorage implements TemplateStorage {
  private readonly STORAGE_KEY = "invoicesplit_templates";
  private readonly ACTIVE_KEY = "invoicesplit_active_template";

  async loadTemplates(): Promise<ExtractionTemplate[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async saveTemplate(template: ExtractionTemplate): Promise<void> {
    const templates = await this.loadTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    
    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.loadTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  async getActiveTemplateId(): Promise<string> {
    return localStorage.getItem(this.ACTIVE_KEY) || "default";
  }

  async setActiveTemplateId(id: string): Promise<void> {
    localStorage.setItem(this.ACTIVE_KEY, id);
  }
}

// Future: Supabase implementation
export class SupabaseTemplateStorage implements TemplateStorage {
  // TODO: Implement when adding Supabase
  // Drop-in replacement, same interface
}

// Factory function
export function createTemplateStorage(): TemplateStorage {
  // For now: LocalStorage
  // Future: Check auth, return SupabaseTemplateStorage if logged in
  return new LocalTemplateStorage();
}
```

**Benefits:**
- ✅ Clean migration path to Supabase
- ✅ Testable (can mock storage)
- ✅ Async-ready (Supabase needs async)
- ✅ Single responsibility

---

### Refactor 5: Custom Hooks
**New File:** `hooks/useTemplates.ts`

```typescript
import { useState, useEffect } from "react";
import { ExtractionTemplate, DEFAULT_TEMPLATE } from "@/lib/templates";
import { createTemplateStorage } from "@/lib/storage";

export function useTemplates() {
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([DEFAULT_TEMPLATE]);
  const [activeId, setActiveId] = useState<string>("default");
  const [isLoaded, setIsLoaded] = useState(false);

  const storage = createTemplateStorage();

  // Load on mount
  useEffect(() => {
    async function load() {
      const loadedTemplates = await storage.loadTemplates();
      const loadedActiveId = await storage.getActiveTemplateId();
      
      setTemplates([DEFAULT_TEMPLATE, ...loadedTemplates]);
      setActiveId(loadedActiveId);
      setIsLoaded(true);
    }
    load();
  }, []);

  const activeTemplate = templates.find(t => t.id === activeId) || DEFAULT_TEMPLATE;

  const saveTemplate = async (template: ExtractionTemplate) => {
    await storage.saveTemplate(template);
    const updated = templates.filter(t => t.id !== template.id);
    setTemplates([...updated, template]);
  };

  const deleteTemplate = async (id: string) => {
    if (id === "default") return; // Can't delete default
    await storage.deleteTemplate(id);
    setTemplates(templates.filter(t => t.id !== id));
    if (activeId === id) {
      setActiveTemplate("default");
    }
  };

  const setActiveTemplate = async (id: string) => {
    await storage.setActiveTemplateId(id);
    setActiveId(id);
  };

  return {
    templates,
    activeTemplate,
    isLoaded,
    saveTemplate,
    deleteTemplate,
    setActiveTemplate
  };
}
```

---

## 📋 Refactoring Checklist

### Step 1: Create New Files
- [ ] `lib/types.ts` - Shared types
- [ ] `lib/api-client.ts` - API calls
- [ ] `lib/prompt-engineering.ts` - Prompt management
- [ ] `lib/storage.ts` - Storage abstraction
- [ ] `hooks/useTemplates.ts` - Template hook

### Step 2: Update Existing Files
- [ ] `app/page.tsx` - Use new types, use custom hook, use api-client
- [ ] `app/api/extract-invoice/route.ts` - Use prompt-engineering
- [ ] `lib/templates.ts` - Remove storage functions (move to storage.ts)
- [ ] `components/*` - Update imports

### Step 3: Delete Unused
- [ ] `components/InvoiceResults.tsx` - Unused, redundant

### Step 4: Test with MCP
- [ ] Run dev server
- [ ] Check for errors: `get_errors`
- [ ] Verify routes: `get_routes`
- [ ] Browser automation test

---

## 🎯 Benefits of This Refactoring

| Before | After | Impact |
|--------|-------|--------|
| Types in multiple files | Centralized in `types.ts` | ✅ Easier to maintain |
| Fetch logic in components | Centralized in `api-client.ts` | ✅ Reusable for training |
| Direct LocalStorage | Abstracted in `storage.ts` | ✅ Easy Supabase migration |
| Prompts in API route | Separate `prompt-engineering.ts` | ✅ Versionable, testable |
| Template state in page | Custom hook | ✅ Cleaner components |

---

## 🚀 New Features Enabled

After refactoring, we can easily add:

### 1. Field Enable/Disable in Training
```typescript
// In training mode
const enabledFields = new Set(selectedFieldKeys);

// Use prompt-engineering
const { prompt } = buildExtractionPrompt(template, {
  enabledFields,  // ← Easy to support!
  customInstructions: trainedInstructions
});
```

### 2. Rerun Analysis with Updated Instructions
```typescript
// Save improved instruction
const improved = {
  ...template,
  customInstructions: {
    [fieldKey]: "Look in the header section for passenger details"
  }
};

// Rerun with same file
await extractDataFromPDF(file, improved);

// Compare results
```

### 3. Training Session Persistence
```typescript
// Training state can be saved
interface TrainingSession {
  templateId: string;
  samples: TrainingSample[];
  promptVersions: PromptVersion[];  // Track what worked
  fieldInstructions: Record<string, string>;  // Learned improvements
}

// Save to storage (LocalStorage now, Supabase later)
await storage.saveTrainingSession(session);
```

---

## ⏱️ Estimated Time

| Task | Time | Priority |
|------|------|----------|
| Create lib/types.ts | 10 min | 🔴 Critical |
| Create lib/api-client.ts | 15 min | 🔴 Critical |
| Create lib/prompt-engineering.ts | 20 min | 🔴 Critical |
| Create lib/storage.ts | 20 min | 🟡 High |
| Create hooks/useTemplates.ts | 15 min | 🟡 High |
| Update page.tsx | 15 min | 🔴 Critical |
| Update components | 10 min | 🔴 Critical |
| Test with MCP | 15 min | 🔴 Critical |
| **Total** | **~2 hours** | |

---

## 🎯 Decision Point

**Option A: Refactor First (Recommended)**
1. Do all 5 refactorings
2. Test thoroughly with MCP
3. Then add new training features
4. Clean foundation = fewer bugs

**Option B: Minimal Refactor**
1. Just do types.ts and api-client.ts
2. Add training features
3. Refactor storage/prompts later
4. Faster but messier

**Option C: Feature First**
1. Add training features now
2. Accept some tech debt
3. Refactor in separate PR
4. Quickest but risky

---

## 💾 Storage Strategy for Training

### Current Session (No Supabase):

**Option 1: Transient (Recommended for MVP)**
```typescript
// Training exists only during session
// User completes training → applies to template → saves template
// Training samples not persisted
// PRO: Simple, privacy-friendly
// CON: Can't resume if browser closes
```

**Option 2: LocalStorage**
```typescript
// Save training session to LocalStorage
// Can resume later
// PRO: Persistence
// CON: Large PDFs = storage limits
```

**Option 3: Hybrid**
```typescript
// Save field improvements only (not PDF data)
interface TemplateImprovements {
  fieldInstructions: Record<string, string>;
  successRates: Record<string, number>;
  lastTrained: number;
}
// Lightweight, maintains privacy
```

**Recommendation:** Option 3 (Hybrid)
- Save learned instructions
- Don't save PDF data
- Privacy maintained
- Useful for future iterations

---

## 🔐 Privacy Impact

**All refactorings maintain privacy guarantees:**
- ✅ No file storage
- ✅ Training samples in memory only
- ✅ Only field instructions saved (text metadata)
- ✅ LocalStorage = browser-only
- ✅ Future Supabase = user accounts (isolated)

---

## ✅ Recommended Action Plan

**Phase 1: Critical Refactorings** (1 hour)
1. Create `lib/types.ts`
2. Create `lib/api-client.ts`
3. Create `lib/prompt-engineering.ts`
4. Update `app/page.tsx` to use new structure
5. Test with MCP

**Phase 2: Quality Improvements** (30 min)
6. Create `lib/storage.ts`
7. Create `hooks/useTemplates.ts`
8. Update components
9. Test with MCP

**Phase 3: New Training Features** (1-2 hours)
10. Add field enable/disable UI
11. Add rerun analysis button
12. Save training improvements
13. Test with browser automation
14. Preview deployment

**Total:** ~3-4 hours for complete, polished feature

---

## 🎯 Your Approval Needed

**Should I proceed with:**
- ✅ **Option A: Full refactoring first** (cleanest, recommended)
- ⏩ **Option B: Minimal refactor** (faster but messier)
- 🚀 **Option C: Feature first** (quickest but risky)

**Your decision will guide next steps!** 🤔
