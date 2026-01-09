# Codebase Architecture Review

**Date:** 2026-01-09  
**Branch:** `feature/custom-templates`  
**Reviewed By:** Next.js DevTools MCP + Code Analysis

---

## 📁 Current Project Structure

```
invoicesplit/
├── app/
│   ├── api/
│   │   └── extract-invoice/
│   │       └── route.ts          ✅ API endpoint
│   ├── globals.css               ✅ Styles
│   ├── layout.tsx                ✅ Root layout
│   ├── page.tsx                  ⚠️ Main page (needs refactoring)
│   └── privacy/
│       └── page.tsx              ✅ Privacy page
├── components/
│   ├── InvoiceResults.tsx        ⚠️ Old component (single invoice)
│   ├── InvoiceUpload.tsx         ✅ Upload UI
│   ├── MultiInvoiceResults.tsx   ✅ Multi-invoice results
│   ├── TemplateEditor.tsx        ✅ NEW - Template editing
│   ├── TemplateSelector.tsx      ✅ NEW - Template selection
│   └── TemplateTrainer.tsx       ✅ NEW - Training UI
├── lib/
│   ├── ai.ts                     ✅ AI client config
│   ├── templates.ts              ✅ NEW - Template system
│   └── training.ts               ✅ NEW - Training logic
└── [config files]                ✅ Standard Next.js config
```

**Status:** ✅ Well-organized, clear separation of concerns

---

## 🔍 Architecture Analysis

### ✅ **Strengths:**

1. **Clear Separation:**
   - ✅ `/lib` for business logic
   - ✅ `/components` for UI
   - ✅ `/app/api` for server endpoints
   - ✅ Types defined close to usage

2. **Type Safety:**
   - ✅ TypeScript throughout
   - ✅ Interfaces exported properly
   - ✅ No `any` types used

3. **State Management:**
   - ✅ Simple `useState` (appropriate for app size)
   - ✅ Props drilling minimal
   - ✅ State colocation (state near where it's used)

4. **Component Design:**
   - ✅ Client components marked with "use client"
   - ✅ Reusable components
   - ✅ Clear props interfaces

5. **API Design:**
   - ✅ Single endpoint (appropriate)
   - ✅ FormData for file uploads
   - ✅ JSON responses
   - ✅ Error handling

---

## ⚠️ **Issues Found & Recommendations:**

### Issue 1: Type Duplication
**Problem:**
```typescript
// app/page.tsx
export type InvoiceData = {  // ← Hardcoded 4 fields
  orderId: string;
  invoiceNo: string;
  taxInvoiceDate: string;
  invoiceAmount: string;
};

// This conflicts with dynamic template fields!
```

**Recommendation:**
```typescript
// Change to generic Record type
export type InvoiceData = Record<string, string>;

// Or create a more flexible type
export interface ExtractedData {
  [key: string]: string;
}
```

**Impact:** 🔴 HIGH - Blocks dynamic field support

---

### Issue 2: Component Naming Inconsistency
**Files:**
- `InvoiceResults.tsx` - Old, single invoice (unused?)
- `MultiInvoiceResults.tsx` - Current, multiple invoices

**Recommendation:**
```typescript
// Delete unused InvoiceResults.tsx
// OR repurpose it for single-invoice training review
```

**Impact:** 🟡 MEDIUM - Code cleanup needed

---

### Issue 3: No Shared Types File
**Problem:**
- Types defined in multiple files
- `InvoiceData` in page.tsx
- `InvoiceResult` in page.tsx
- `ExtractionField` in templates.ts
- Risk of duplication as we add features

**Recommendation:**
```typescript
// Create lib/types.ts for shared types
export interface ExtractedData {
  [key: string]: string | number;
}

export interface ExtractionResult {
  fileName: string;
  status: "pending" | "processing" | "success" | "error";
  data?: ExtractedData;
  error?: string;
  validation?: ValidationResult;
}
```

**Impact:** 🟡 MEDIUM - Improves maintainability

---

### Issue 4: State Management Scaling
**Current:** Simple `useState` in main page

**Concern:** As we add:
- Template selection
- Training mode
- Field enable/disable
- Rerun analysis

**Recommendation:**
```typescript
// Consider useReducer for complex state
// OR React Context for template state
// OR Keep useState but extract to custom hook

// Option: Custom hook
function useTemplateState() {
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(DEFAULT);
  // ... centralized template logic
  return { templates, activeTemplate, ... };
}
```

**Impact:** 🟢 LOW - Can refactor incrementally

---

### Issue 5: LocalStorage Strategy Needs Documentation
**Current:** Templates in LocalStorage

**Questions:**
1. What happens if storage is cleared?
2. How to backup/restore templates?
3. Migration strategy for future Supabase?

**Recommendation:**
```typescript
// Add template export/import
exportTemplate(template): JSON string
importTemplate(json): Template

// Add version field for migrations
interface ExtractionTemplate {
  version: number;  // For future migrations
  // ... existing fields
}
```

**Impact:** 🟡 MEDIUM - Future-proofing

---

## 🏗️ Refactoring Recommendations

### Priority 1: Type System Cleanup
```typescript
// Create lib/types.ts
export interface ExtractedData {
  [key: string]: string;
}

export interface ExtractionResult {
  fileName: string;
  status: ProcessingStatus;
  data?: ExtractedData;
  error?: string;
  validation?: ValidationResult;
}

export type ProcessingStatus = "pending" | "processing" | "success" | "error";

export interface ValidationResult {
  isValidDocument: boolean;
  confidence: number;
  warnings: string[];
  detectedType?: string;
}
```

### Priority 2: Extract API Logic
```typescript
// Create lib/api-client.ts
export async function extractInvoiceData(
  file: File,
  template: ExtractionTemplate
): Promise<ExtractionResult> {
  // Centralize API calls
  // Reusable for main page AND training mode
}
```

### Priority 3: Custom Hooks
```typescript
// Create hooks/useTemplates.ts
export function useTemplates() {
  const [templates, setTemplates] = useState(loadTemplates());
  const [activeId, setActiveId] = useState(getActiveTemplateId());
  
  const activeTemplate = templates.find(t => t.id === activeId) || DEFAULT_TEMPLATE;
  
  const saveTemplate = (template: ExtractionTemplate) => {
    // ... logic
  };
  
  return { templates, activeTemplate, saveTemplate, ... };
}
```

---

## 📊 Code Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| TypeScript Coverage | 100% | 100% | ✅ |
| Linting Errors | 0 | 0 | ✅ |
| Runtime Errors (MCP) | 0 | 0 | ✅ |
| Component Reusability | Medium | High | 🟡 |
| Type Safety | Good | Excellent | 🟡 |
| Code Duplication | Low | None | ✅ |

---

## 🎯 Recommendations for New Features

### For Field Enable/Disable:
```typescript
// Add to ExtractionField
export interface ExtractionField {
  // ... existing fields
  enabled: boolean;  // NEW: Can be toggled in training
}

// Update template to track enabled fields
const activeFields = template.fields.filter(f => f.enabled);
```

### For Rerun Analysis:
```typescript
// Add to TrainingSample
export interface TrainingSample {
  // ... existing fields
  rerunCount: number;           // Track iterations
  extractionHistory: Array<{    // Keep history
    timestamp: number;
    fields: Record<string, FieldExtraction>;
    promptVersion: string;
  }>;
}
```

### For Prompt Engineering:
```typescript
// Create lib/prompt-builder.ts
export function buildExtractionPrompt(
  template: ExtractionTemplate,
  options?: {
    includeExamples?: boolean;
    strictMode?: boolean;
    fieldOverrides?: Record<string, string>; // Custom descriptions per training
  }
): string {
  // Centralized prompt generation
  // Version controlled
  // Testable
}
```

---

## 🔮 Future-Proofing for Supabase

### Current: LocalStorage
```typescript
// Session-based, browser-only
localStorage.setItem('templates', json);
```

### Future: Supabase Migration Path
```typescript
// Create abstraction layer NOW
interface TemplateStorage {
  load(): Promise<Template[]>;
  save(templates): Promise<void>;
  sync(): Promise<void>;
}

// Implement LocalStorage version
class LocalTemplateStorage implements TemplateStorage {
  // Current implementation
}

// Future: Supabase version
class SupabaseTemplateStorage implements TemplateStorage {
  // Drop-in replacement
}

// Usage:
const storage: TemplateStorage = new LocalTemplateStorage();
// Later: = new SupabaseTemplateStorage();
```

**Impact:** Makes future migration seamless

---

## ✅ Action Plan

### Before Adding New Features:

1. **Refactor Types** (15 min)
   - Create `lib/types.ts`
   - Move shared types
   - Update imports

2. **Extract API Client** (10 min)
   - Create `lib/api-client.ts`
   - Centralize fetch logic
   - Reusable for training

3. **Create Storage Abstraction** (10 min)
   - Create `lib/storage.ts`
   - Interface for template storage
   - Easy Supabase migration later

4. **Custom Hook** (10 min)
   - Create `hooks/useTemplates.ts`
   - Centralize template state
   - Cleaner page component

**Total Time:** ~45 minutes  
**Benefit:** Clean foundation for complex features

### Then Add New Features:

5. Field enable/disable in training
6. Rerun analysis capability
7. Improved prompt engineering
8. Better error handling

---

## 🎯 Recommendation

**I suggest we:**
1. ✅ **Do the 4 refactorings above FIRST**
2. ✅ Test with MCP after each
3. ✅ Then add the new training features on solid foundation

**Rationale:**
- Cleaner code = easier to maintain
- Better typed = fewer bugs
- Abstracted storage = easy Supabase migration
- Custom hooks = simpler components

**Do you approve this approach?**
- Option A: Do refactorings first (recommended)
- Option B: Add features now, refactor later
- Option C: Different approach?

---

**Awaiting your guidance!** 🎯
