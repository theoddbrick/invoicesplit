# New Flow Design - AI-Discovered Field Extraction

**Revolutionary Approach:** Instead of pre-defining templates, let AI discover fields from sample documents!

---

## 🎯 User Flow - Completely Redesigned

### **Phase 1: Discovery (User Intent)**
```
┌────────────────────────────────────────────────────────────┐
│ What would you like to extract from your documents?        │
├────────────────────────────────────────────────────────────┤
│ Textarea (multiline):                                      │
│ ┌────────────────────────────────────────────────────────┐│
│ │ I want to extract booking information from travel      ││
│ │ invoices, including passenger details, flight info,    ││
│ │ and payment amounts.                                   ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ Upload Sample Documents (2-100 files):                    │
│ [Drop samples or browse] 📎                               │
│                                                            │
│ Uploaded: [sample1.pdf] [sample2.pdf] [sample3.pdf]      │
│                                                            │
│              [Analyze Samples →]                          │
└────────────────────────────────────────────────────────────┘
```

### **Phase 2: AI Field Discovery**
```
Processing samples...
├─ Analyzing sample1.pdf...
├─ Analyzing sample2.pdf...
├─ Analyzing sample3.pdf...
└─ Discovering common fields...

AI DISCOVERED 8 fields across 3 samples!
```

### **Phase 3: Review & Refine Discovered Fields**
```
┌────────────────────────────────────────────────────────────────┐
│ Review Discovered Fields                    Sample 1 of 3     │
├────────────────────────────────────────────────────────────────┤
│ Document: sample1.pdf                                          │
│                                                                │
│ Fields AI Found:                                              │
│ ┌──┬────────────────┬─────────┬──────────┬─────────┐         │
│ │☑ │ Field Name     │ Value   │ Type     │ Actions │         │
│ ├──┼────────────────┼─────────┼──────────┼─────────┤         │
│ │☑ │ Booking Number │ 169329..│ text     │ [Edit]  │ ✓ Found│
│ │☑ │ Invoice Number │ TI01260.│ text     │ [Edit]  │ ✓ Found│
│ │☑ │ Date           │ 2026-01.│ date     │ [Edit]  │ ✓ Found│
│ │☑ │ Total Amount   │ 267.35  │ currency │ [Edit]  │ ✓ Found│
│ │☑ │ Passenger Name │ ONN/...│ text     │ [Edit]  │ ✓ Found│
│ │☐ │ Flight Number  │ TR904   │ text     │ [Edit]  │ ✓ Found│
│ │☑ │ Departure City │ Singap..│ text     │ [Edit]  │ ✓ Found│
│ │☐ │ Arrival City   │ Macau   │ text     │ [Edit]  │ ✓ Found│
│ └──┴────────────────┴─────────┴──────────┴─────────┘         │
│                                                                │
│ Click [Edit] to refine:                                       │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ Field: Passenger Name                                      ││
│ │ Description: Full name of the traveler                     ││
│ │ Extraction Hint: Look in "Passenger Information" section  ││
│ │ Format Rule: Text as-is                                    ││
│ │                                        [Save] [Cancel]     ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ [← Prev Sample] [Rerun This Sample] [Next Sample →]          │
└────────────────────────────────────────────────────────────────┘
```

### **Phase 4: Production Extraction**
```
Your extraction profile is ready!
8 fields configured (6 enabled, 2 disabled)

Upload documents to extract:
[Drop PDFs or browse]

Then: Standard table view (like current main branch)
With NEW options:
☑ Include headers in export
☑ Include filename in export
```

---

## 🏗️ Architecture Changes Needed

### 1. **New API Endpoint: Field Discovery**
**File:** `app/api/discover-fields/route.ts`

```typescript
POST /api/discover-fields
Body: {
  userIntent: string,           // "Extract booking info..."
  sampleFiles: File[],          // 2-100 PDFs
}

Response: {
  discoveredFields: Array<{
    suggestedName: string,      // "Booking Number"
    suggestedKey: string,       // "bookingNumber"  
    suggestedType: FieldType,   // "text"
    foundInSamples: number,     // 3 out of 3
    sampleValues: string[],     // ["123", "456", "789"]
    confidence: number          // 85%
  }>,
  samplesAnalyzed: number
}
```

**AI Prompt for Discovery:**
```
User wants to: {userIntent}

Analyze these {N} documents and discover ALL common fields that appear.

For each field found:
1. Suggest a clear field name
2. Identify the data type
3. Note how many samples contain this field
4. Extract example values

Return as JSON array of discovered fields.
```

### 2. **Update Template System**
**Add to ExtractionField:**
```typescript
interface ExtractionField {
  // ...existing fields...
  enabled: boolean;              // NEW: Can toggle in review
  extractionHint?: string;       // NEW: Additional instruction
  formatRule?: string;           // NEW: "decimal without currency"
  foundInSamples?: number;       // NEW: Training metadata
}
```

### 3. **New Components Needed**

**A. DiscoveryWizard** (replaces TemplateEditor for new flow)
- Step 1: User intent + sample upload
- Step 2: Review discovered fields per sample
- Step 3: Refine and enable/disable
- Step 4: Save as extraction profile

**B. FieldReviewTable**
- Shows discovered fields
- Checkboxes to enable/disable
- Edit button per field
- Success rate indicators

**C. FieldEditor** (inline)
- Edit field name
- Edit description
- Edit extraction hint
- Edit format rule

**D. ProductionExtractionView** (enhanced Multi Invoice Results)
- Checkbox: Include headers
- Checkbox: Include filename
- Uses learned extraction profile

---

## 🎨 Simplified UX Flow

```
START
  ↓
┌─────────────────────────────────────────┐
│ Step 1: Tell us what you want          │
│ [Textarea] + [Upload Samples]          │
│ [Analyze →]                            │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Step 2: AI Found 8 Fields!             │
│ Review Sample 1/3:                     │
│ [Table: Fields with ☑/☐ checkboxes]   │
│ Click field → Edit inline              │
│ [Rerun] [Next Sample →]               │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Step 3: Ready! Upload documents        │
│ Using: 6 enabled fields                │
│ [Upload PDFs for extraction]           │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Step 4: Results                        │
│ [Table with data]                      │
│ ☑ Include headers                      │
│ ☑ Include filename                     │
│ [Copy] [Download CSV]                  │
└─────────────────────────────────────────┘
```

---

## 🔄 Comparison to Previous Design

**Previous (Template-Based):**
- User defines fields manually
- User creates templates
- User switches templates
- More setup required

**New (AI-Discovered):**
- AI discovers fields from samples
- User refines what AI found
- No templates needed (or auto-created)
- Faster, more intuitive

**Winner:** NEW approach! Better UX for users who don't know fields upfront.

---

## 💾 Storage Strategy (Revised)

**What to Save:**
```typescript
interface ExtractionProfile {
  id: string;
  name: string;              // Auto-generated or user-named
  userIntent: string;        // Original description
  fields: ExtractionField[]; // Discovered + refined fields
  trainingSummary: {
    samplesUsed: number;
    fieldsDiscovered: number;
    avgConfidence: number;
  };
  createdAt: number;
}
```

**LocalStorage:**
- Save extraction profiles (not "templates")
- User can reuse profiles for similar documents
- Can edit/delete profiles later

---

## ✅ Implementation Plan

### Part A: Field Discovery System
1. Create `app/api/discover-fields/route.ts`
2. AI prompt for field discovery
3. Test with MCP

### Part B: Discovery UI
4. Create `components/DiscoveryWizard.tsx`
5. Step 1: Intent + samples
6. Step 2: Review per sample
7. Step 3: Refine fields
8. Test with browser automation

### Part C: Enhanced Results
9. Update `MultiInvoiceResults.tsx`
10. Add header/filename checkboxes
11. Test copy/download with options

### Part D: Integration
12. Update `app/page.tsx` for new flow
13. Connect all pieces
14. Full end-to-end test
15. Preview build

---

## 🧪 Testing Checklist

- [ ] MCP: Zero errors after each component
- [ ] Build: Successful TypeScript compilation
- [ ] Browser: Discovery wizard opens
- [ ] Browser: Sample upload works
- [ ] API: Field discovery returns results
- [ ] Browser: Field review table displays
- [ ] Browser: Edit field inline works
- [ ] Browser: Rerun analysis works
- [ ] Browser: Production extraction works
- [ ] Browser: Header/filename checkboxes work
- [ ] Preview: Deploy and test full flow
- [ ] Preview: Verify with real documents

---

**This is a MAJOR redesign but with BETTER UX!**

Ready to implement?
