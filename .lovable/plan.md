
# Bloodwork PDF Upload and AI Analysis Feature

## Overview
Add the ability to upload bloodwork PDF lab results, parse the data using AI, store the structured biomarkers, and receive AI-generated health insights. This feature will integrate into the Physical pillar dashboard as a key health metric alongside sleep and nutrition data.

## Feature Highlights

### What You'll Get
- **PDF Upload**: Drag-and-drop or click-to-upload interface for bloodwork PDFs
- **AI-Powered Parsing**: Gemini extracts biomarkers (cholesterol, glucose, vitamin D, etc.) with reference ranges
- **Trend Tracking**: View how your biomarkers change over time across multiple lab reports
- **Health Insights**: AI-generated analysis highlighting areas of concern, improvements, and recommendations
- **Physical Pillar Integration**: Bloodwork data displayed alongside sleep and nutrition in your Physical dashboard

---

## Data Architecture

### New Database Table: `bloodwork_reports`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner reference |
| `report_date` | date | Date of the lab work |
| `lab_name` | text | Lab provider (Quest, LabCorp, etc.) |
| `pdf_url` | text | Storage URL for the original PDF |
| `raw_text` | text | Extracted text from PDF |
| `biomarkers` | jsonb | Structured array of parsed biomarkers |
| `ai_insights` | text | AI-generated health analysis |
| `created_at` | timestamp | Upload timestamp |

### Biomarker JSON Structure
```text
[
  {
    "name": "Total Cholesterol",
    "value": 195,
    "unit": "mg/dL",
    "reference_low": 100,
    "reference_high": 199,
    "status": "normal", // normal, low, high
    "category": "lipid_panel"
  },
  ...
]
```

### New Storage Bucket: `bloodwork-pdfs`
- Private bucket with RLS policies
- User can only access their own PDFs

---

## Technical Implementation

### Backend Components

**1. Storage Bucket Creation (Migration)**
- Create private `bloodwork-pdfs` bucket
- Add RLS policies for user-only access (SELECT, INSERT, DELETE)

**2. Edge Function: `parse-bloodwork`**
- Accepts PDF file as base64 or storage URL
- Uses Gemini 2.5 Pro (best for document understanding) to:
  - Extract all biomarker values, units, and reference ranges
  - Identify the lab provider and test date
  - Generate structured JSON of biomarkers
- Uses tool calling to ensure structured output
- Generates health insights as a follow-up prompt

**3. Database Table & RLS**
- Create `bloodwork_reports` table
- Add RLS policies for authenticated user access

### Frontend Components

**1. `BloodworkUploadDialog.tsx`**
- File input accepting PDF only (max 10MB)
- Date picker for lab date (auto-detected if possible)
- Optional lab name field
- Upload progress indicator
- Processing status (uploading -> parsing -> analyzing)

**2. `BloodworkCard.tsx`**
- Summary card showing latest report
- Key biomarkers at a glance (cholesterol, glucose, etc.)
- Status indicators (normal/high/low)
- Click to expand full details

**3. `BloodworkDetailSheet.tsx`**
- Full biomarker list organized by category
- Reference range visualization (bar chart showing where you fall)
- AI insights section with health recommendations
- Historical comparison if multiple reports exist

**4. `BloodworkTrendsChart.tsx`**
- Line chart for tracking biomarkers over time
- Select which biomarker to view
- Show reference range as a shaded band

### New Hook: `useBloodwork.ts`
- Fetch user's bloodwork reports
- Upload and parse mutations
- Delete report mutation

---

## User Flow

```text
1. User navigates to Physical pillar page (or Settings > Health)
2. Clicks "Upload Bloodwork" button
3. Selects PDF file from their device
4. System uploads PDF to private storage
5. Edge function parses PDF using Gemini Pro
6. AI extracts all biomarkers with values and ranges
7. AI generates personalized health insights
8. Results saved to database and displayed
9. User can view trends across multiple reports
```

---

## AI Processing Details

### PDF Parsing Prompt (Gemini 2.5 Pro)
The AI will be instructed to:
1. Extract the lab/facility name and test date
2. Identify ALL biomarkers with their exact values
3. Parse reference ranges (low-high)
4. Categorize biomarkers (lipid panel, metabolic, thyroid, vitamins, etc.)
5. Flag values outside reference ranges

### Health Insights Prompt
After parsing, a second AI call will:
- Summarize overall health status
- Highlight any concerning values with context
- Note improvements from previous reports (if available)
- Provide actionable recommendations (always with disclaimer)
- Connect findings to lifestyle factors (sleep, nutrition, exercise)

---

## Implementation Steps

### Phase 1: Database & Storage
1. Create `bloodwork-pdfs` storage bucket (migration)
2. Create `bloodwork_reports` table (migration)
3. Add RLS policies for both

### Phase 2: Edge Function
4. Create `parse-bloodwork` edge function
5. Implement PDF-to-text extraction using Gemini multimodal
6. Add structured biomarker extraction with tool calling
7. Add health insights generation

### Phase 3: Frontend - Upload
8. Create `useBloodwork.ts` hook
9. Create `BloodworkUploadDialog.tsx` component
10. Integrate upload into Physical pillar page

### Phase 4: Frontend - Display
11. Create `BloodworkCard.tsx` for summary view
12. Create `BloodworkDetailSheet.tsx` for full details
13. Create `BloodworkTrendsChart.tsx` for historical tracking
14. Add biomarker category grouping

### Phase 5: Integration
15. Add bloodwork section to Physical pillar dashboard
16. Connect to PRIMED progress tracking (optional)

---

## Security Considerations

- **Private Storage**: PDFs stored in private bucket, accessible only by owner
- **RLS Policies**: Database rows protected by user_id matching auth.uid()
- **No PHI Logging**: Sensitive health data not logged in edge functions
- **Medical Disclaimer**: UI clearly states this is for personal tracking, not medical advice

---

## File Structure

```text
src/
  components/
    bloodwork/
      BloodworkUploadDialog.tsx
      BloodworkCard.tsx
      BloodworkDetailSheet.tsx
      BloodworkTrendsChart.tsx
      BiomarkerRow.tsx
  hooks/
    useBloodwork.ts

supabase/
  functions/
    parse-bloodwork/
      index.ts
  migrations/
    XXXXXX_create_bloodwork_tables.sql
```

---

## Future Enhancements (Not in Initial Scope)
- OCR fallback for scanned/image-based PDFs
- Integration with Apple Health or Google Fit
- Doctor visit reminders based on biomarker trends
- Correlation analysis with sleep/nutrition data
