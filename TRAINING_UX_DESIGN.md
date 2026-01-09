# Template Training Feature - UX Design

## 🎯 Goal
Allow users to "train" templates by uploading sample PDFs, reviewing extractions, and correcting errors to improve accuracy.

---

## 🎨 User Flow

### Phase 1: Initiate Training
```
Template Selector/Editor
    ↓
[Train This Template] button
    ↓
Training Mode activated
```

### Phase 2: Upload Samples
```
┌─────────────────────────────────────────────────────┐
│ Training: Travel Invoice Template                   │
├─────────────────────────────────────────────────────┤
│ Upload 3-5 sample PDFs to train this template      │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │  Drop sample invoices here                      │ │
│ │  Recommended: 3-5 similar documents             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Samples uploaded: [sample1.pdf] [sample2.pdf] [x]  │
│                                                      │
│              [Cancel] [Start Training →]            │
└─────────────────────────────────────────────────────┘
```

### Phase 3: Review & Correct
```
┌──────────────────────────────────────────────────────────────┐
│ Training Sample 1 of 3                    [Save] [Next →]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────┐  ┌──────────────────────────────┐  │
│ │ PDF Preview/Text    │  │ Extracted Fields             │  │
│ │                     │  │                              │  │
│ │ Trip.com            │  │ ✓ Booking Number            │  │
│ │ Invoice No:         │  │   1693293992852355          │  │
│ │ TI01260000000080 ← │  │   [Edit] [✓ Correct]        │  │
│ │                     │  │                              │  │
│ │ Date: 2026-01-07   │  │ ✓ Invoice Date              │  │
│ │                     │  │   2026-01-07                │  │
│ │ Total: S$267.35    │  │   [Edit] [✓ Correct]        │  │
│ │                     │  │                              │  │
│ │ ...                 │  │ ⚠ Passenger Name            │  │
│ │                     │  │   (not found)               │  │
│ │                     │  │   [Help AI Find This →]     │  │
│ │                     │  │                              │  │
│ └─────────────────────┘  │ ✓ Amount                    │  │
│                           │   267.35                    │  │
│                           │   [Edit] [✓ Correct]        │  │
│                           └──────────────────────────────┘  │
│                                                               │
│ Confidence: ●●●●○ 85%                                       │
└──────────────────────────────────────────────────────────────┘
```

### Phase 4: Improve Template
```
┌─────────────────────────────────────────────────────┐
│ Training Complete!                                   │
├─────────────────────────────────────────────────────┤
│ Results from 3 samples:                             │
│                                                      │
│ ✓ Booking Number    - 100% success (3/3)           │
│ ✓ Invoice Date      - 100% success (3/3)           │
│ ✓ Amount            - 100% success (3/3)           │
│ ⚠ Passenger Name    - 66% success (2/3)            │
│                                                      │
│ Suggested improvements:                             │
│ • Passenger Name: Update description to mention     │
│   "traveler information section"                    │
│                                                      │
│        [Keep Template As-Is] [Apply Suggestions]    │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### A. Training Mode State
```typescript
interface TrainingSample {
  id: string;
  fileName: string;
  pdfText: string;
  extractedData: Record<string, string>;
  corrections: Record<string, string>; // User corrections
  confidence: number;
  fieldMatches: Record<string, {
    value: string;
    textPosition?: { start: number; end: number };
    confidence: number;
  }>;
}

interface TrainingSession {
  templateId: string;
  samples: TrainingSample[];
  currentSampleIndex: number;
  isActive: boolean;
}
```

### B. Key Features

**1. PDF Text Preview with Highlighting**
```typescript
// Show PDF text with extracted values highlighted
function HighlightedText({ text, matches }) {
  // Render text with <mark> tags around matched values
  // Color code by field type
}
```

**2. Field Correction Interface**
```typescript
// Each field shows:
- Current extracted value
- [Edit] button → Input field
- [✓ Correct] or [✗ Wrong] buttons
- Confidence indicator
- Highlight in PDF text (if found)
```

**3. Smart Suggestions**
```typescript
// After reviewing all samples:
- Calculate success rate per field
- Suggest description improvements
- Identify common patterns
- Recommend field type changes
```

**4. Progressive Disclosure**
```
Simple Mode: Just show extracted values + edit buttons
Advanced Mode: Show text positions, confidence, patterns
```

---

## 🎨 UI Components Needed

### 1. TrainingModeButton
- Entry point from template editor
- "Train This Template" or "Improve with Samples"

### 2. TrainingSampleUpload
- Multi-file upload (3-5 recommended)
- File list with remove option
- Start training button

### 3. TrainingReviewer
- Split view: Text preview | Extracted fields
- Field-by-field review
- Edit/correct interface
- Next/Previous navigation
- Progress indicator (1 of 3)

### 4. TrainingSummary
- Success rates per field
- Suggested improvements
- Apply/discard options

### 5. FieldCorrection
- Inline edit component
- Mark as correct/incorrect
- Highlight in source text

---

## 🚀 MVP Features (Phase 1)

**Essential:**
1. ✅ Upload 3-5 sample PDFs
2. ✅ Extract fields from each
3. ✅ Show extracted values
4. ✅ Allow manual correction per field
5. ✅ Navigate between samples
6. ✅ Calculate success rates
7. ✅ Save corrections to template

**Nice-to-Have (Phase 2):**
- PDF visual preview
- Text highlighting
- Auto-suggest descriptions
- Pattern detection
- Bulk corrections

---

## 📊 UX Decisions

### Terminology
- ❌ "Training" - Too technical
- ❌ "Calibration" - Too scientific
- ✅ **"Improve with Samples"** - Clear and friendly
- ✅ **"Test & Refine"** - Action-oriented

### Flow
- **Linear progression**: Sample 1 → Sample 2 → Sample 3 → Summary
- **Non-blocking**: Can skip or go back
- **Save anytime**: Progress preserved

### Validation
- **Minimum 2 samples**: Need comparison
- **Maximum 10 samples**: Diminishing returns
- **Recommended 3-5**: Balance quality/time

---

## 🎯 Implementation Priority

### Must-Have (MVP):
1. Training mode UI
2. Sample upload interface
3. Field review with edit capability
4. Success rate calculation
5. Template improvement from corrections

### Should-Have:
6. Text preview with basic formatting
7. Confidence indicators
8. Field-by-field navigation
9. Training summary with suggestions

### Could-Have:
10. Visual PDF preview
11. Text highlighting
12. Auto-improve descriptions
13. Export training data

---

**Ready to implement! Should I proceed with MVP first?**
