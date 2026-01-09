# Feature Plan: Custom Extraction Templates

**Branch:** `feature/custom-templates`  
**Status:** 🚧 In Development  
**Do NOT merge to main without approval**

---

## 1. Feature Overview

### Problem Statement
Currently, the app:
- ❌ Only extracts 4 fixed fields
- ❌ Only works with one invoice type
- ❌ Cannot be customized by users
- ❌ Limited error handling for wrong document types

### Proposed Solution
Allow users to:
- ✅ Create custom "Templates" with their own fields
- ✅ Save multiple templates for different invoice types
- ✅ Switch between templates easily
- ✅ Describe each field to guide AI extraction
- ✅ Get smart validation when documents don't match

---

## 2. Terminology Decision

**Considered Options:**
- "Schema" - Too technical
- "Profile" - Ambiguous
- "Preset" - Implies static/unchangeable
- "Configuration" - Too generic
- **"Template"** - ✅ **CHOSEN** (intuitive, commonly understood)

**Naming Convention:**
- **Template**: A saved configuration of extraction fields
- **Field**: Individual data point to extract (e.g., "Invoice NO.")
- **Description**: Help text that guides the AI on what to extract

---

## 3. UX Design

### A. Template Management UI

**Location:** Top of main page (above upload area)

```
┌─────────────────────────────────────────────────────────┐
│ Invoice Split                                           │
├─────────────────────────────────────────────────────────┤
│ 📋 Current Template: [Travel Invoices ▼]               │
│     [+ Create New Template]                             │
├─────────────────────────────────────────────────────────┤
│ [Upload Area]                                           │
└─────────────────────────────────────────────────────────┘
```

**Dropdown Options:**
- Default: "Standard Invoice (4 fields)" ← Built-in
- User templates: "Travel Invoices", "Utilities", "Receipts", etc.
- "➕ Create New Template" at bottom

### B. Template Creation Modal

```
┌─────────────────────────────────────────────────────────┐
│ Create New Template                              [X]    │
├─────────────────────────────────────────────────────────┤
│ Template Name: [Travel Invoice           ]             │
│ Description:   [For Trip.com bookings    ]             │
│                                                         │
│ Fields to Extract:                                      │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 1. Field Name: [Booking Number]                     ││
│ │    Description: [The booking reference ID]          ││
│ │    [Remove]                                          ││
│ ├─────────────────────────────────────────────────────┤│
│ │ 2. Field Name: [Passenger Name]                     ││
│ │    Description: [Full name of traveler]             ││
│ │    [Remove]                                          ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ [+ Add Field]                                           │
│                                                         │
│              [Cancel]  [Save Template]                  │
└─────────────────────────────────────────────────────────┘
```

### C. Template Management

**Actions:**
- Create new template
- Edit existing template
- Duplicate template
- Delete template
- Set as default

**Storage:** Browser LocalStorage (templates are user-specific, not shared)

---

## 4. Technical Architecture

### A. Data Structures

```typescript
interface ExtractionField {
  id: string;              // Unique ID
  name: string;            // Display name (e.g., "Invoice NO.")
  key: string;             // JSON key (e.g., "invoiceNo")
  description: string;     // Helps AI understand what to extract
  required: boolean;       // If true, extraction fails without this field
  type: "text" | "number" | "date" | "currency"; // Data type
  validation?: string;     // Optional regex or validation rule
}

interface ExtractionTemplate {
  id: string;              // Unique template ID
  name: string;            // Template name (e.g., "Travel Invoices")
  description: string;     // What this template is for
  fields: ExtractionField[];
  documentType: string;    // Expected document type (for validation)
  createdAt: number;
  updatedAt: number;
}

// Default template (built-in, cannot be deleted)
const DEFAULT_TEMPLATE: ExtractionTemplate = {
  id: "default",
  name: "Standard Invoice",
  description: "Default invoice extraction with 4 standard fields",
  fields: [
    { id: "1", name: "Order ID", key: "orderId", description: "Order or booking reference number", required: false, type: "text" },
    { id: "2", name: "Invoice NO.", key: "invoiceNo", description: "Invoice number or ID", required: true, type: "text" },
    { id: "3", name: "Tax Invoice Date", key: "taxInvoiceDate", description: "Invoice date in YYYY-MM-DD format", required: true, type: "date" },
    { id: "4", name: "Invoice Amount", key: "invoiceAmount", description: "Total invoice amount (decimal only, no currency)", required: true, type: "currency" }
  ],
  documentType: "invoice",
  createdAt: Date.now(),
  updatedAt: Date.now()
};
```

### B. Storage Strategy

**Client-Side (LocalStorage):**
- User's custom templates
- Current selected template ID
- Template preferences

**Why LocalStorage:**
- ✅ Zero server storage (privacy guarantee)
- ✅ User-specific templates
- ✅ No authentication needed
- ✅ Fast access
- ✅ Persists across sessions

**Storage Key:**
```typescript
localStorage.getItem('invoicesplit_templates')
localStorage.getItem('invoicesplit_active_template')
```

### C. API Changes

**Updated Endpoint:**
```typescript
POST /api/extract-invoice
Body: {
  file: File,
  template: ExtractionTemplate  // Dynamic fields
}

Response: {
  success: boolean,
  invoiceData: Record<string, string>,  // Dynamic keys
  validation: {
    isValidDocument: boolean,
    confidence: number,
    warnings: string[]
  }
}
```

---

## 5. Document Validation

### A. Pre-Extraction Validation

**AI Validation Prompt:**
```
Step 1: Determine if this is a valid [documentType]
Step 2: If not, return error with document type detected
Step 3: If valid, proceed with extraction
```

### B. Validation Checks

```typescript
interface DocumentValidation {
  isValid: boolean;
  detectedType: string;     // "invoice", "receipt", "contract", "article", etc.
  confidence: number;       // 0-100
  reason?: string;          // Why it failed
}
```

### C. User Feedback

**When document doesn't match:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Document Type Mismatch                             │
├─────────────────────────────────────────────────────────┤
│ Expected: Invoice                                       │
│ Detected: News Article                                  │
│                                                         │
│ This document doesn't appear to be an invoice.         │
│ Please upload the correct document type.               │
│                                                         │
│              [Try Another File]                         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Plan

### Phase 1: Core Template System ✅ TODO
- [ ] Create template data structures
- [ ] Add LocalStorage utilities
- [ ] Create default template
- [ ] Build template selector UI
- [ ] Test with Next.js DevTools MCP

### Phase 2: Template Editor ✅ TODO
- [ ] Create template creation modal
- [ ] Add field management (add/edit/remove)
- [ ] Implement save/load from LocalStorage
- [ ] Add template list management
- [ ] Test with browser automation

### Phase 3: Dynamic Extraction ✅ TODO
- [ ] Update API to accept template parameter
- [ ] Generate dynamic AI prompt from template
- [ ] Handle variable field counts
- [ ] Return dynamic response structure
- [ ] Test with multiple templates

### Phase 4: Validation System ✅ TODO
- [ ] Add document type detection
- [ ] Implement confidence scoring
- [ ] Add pre-extraction validation
- [ ] Create validation error UI
- [ ] Test with non-invoice documents

### Phase 5: UI Polish ✅ TODO
- [ ] Template management page
- [ ] Import/export templates
- [ ] Template sharing (optional)
- [ ] Improved error messages
- [ ] Help text and tooltips

---

## 7. Testing Strategy

### A. Next.js DevTools MCP
```typescript
// Check for errors after each major change
nextjs_call({ port: 3000, toolName: "get_errors" })

// Verify routes
nextjs_call({ port: 3000, toolName: "get_routes" })

// Monitor page metadata
nextjs_call({ port: 3000, toolName: "get_page_metadata" })
```

### B. Browser Automation
```typescript
// Test template creation
browser_eval({ action: "navigate", url: "http://localhost:3000" })
browser_eval({ action: "snapshot" })
browser_eval({ action: "click", element: "Create Template button" })

// Test file upload with template
// Test validation with wrong document type
```

### C. Preview Deployments
```bash
# Deploy to Vercel preview
vercel deploy

# Test preview URL
# Get logs if issues
vercel logs <deployment-url>
```

---

## 8. Expected Outcomes

### User Stories

**Story 1: Marketing Manager**
```
As a marketing manager,
I receive invoices from multiple vendors (Trip.com, Uber, utilities),
I want to create a template for each vendor type,
So that I can quickly extract the specific fields I need.
```

**Story 2: Accountant**
```
As an accountant,
I need to extract different fields from receipts vs invoices,
I want to switch templates with one click,
So that I can process mixed documents efficiently.
```

**Story 3: Error Prevention**
```
As any user,
If I accidentally upload the wrong document type,
I want immediate feedback,
So that I don't waste time processing invalid files.
```

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Templates too complex | Low adoption | Simple UI, good defaults |
| LocalStorage cleared | Lost templates | Export/import feature |
| AI misunderstands fields | Poor extraction | Clear descriptions required |
| Template conflicts | Confusion | Clear naming, visual differentiation |
| Performance with many fields | Slow processing | Limit fields to 20 max |

---

## 10. Success Metrics

- ✅ Users can create templates in <60 seconds
- ✅ 95%+ accuracy on matching document types
- ✅ <5 seconds processing per document (same as current)
- ✅ Zero increase in privacy risk (still no storage)
- ✅ Intuitive UI (no documentation needed)

---

## 11. Next Steps

1. ✅ Branch created: `feature/custom-templates`
2. 🚧 Implement template data structures
3. 🚧 Build template selector UI
4. 🚧 Create template editor modal
5. 🚧 Add document validation
6. 🚧 Test with Next.js MCP
7. 🚧 Preview deployment testing
8. ⏳ Await approval for merge

---

**Ready to begin implementation!**
