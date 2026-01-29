
# Fix Bloodwork AI Parsing

## Problem Summary
The bloodwork PDF parsing is failing because:
1. The edge function calls Google's Gemini API directly with `GEMINI_API_KEY`, which is invalid
2. The base64 conversion crashes on large PDFs due to stack overflow

## Solution

### 1. Update Edge Function to Use Lovable AI Gateway
Switch from direct Gemini API calls to the Lovable AI proxy (like `parse-nutrition` and `journal-chat` do):

**Current (broken):**
```text
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent')
x-goog-api-key: GEMINI_API_KEY
```

**Fixed:**
```text
fetch('https://ai.gateway.lovable.dev/v1/chat/completions')
Authorization: Bearer LOVABLE_API_KEY
model: google/gemini-2.5-pro
```

### 2. Fix Large PDF Base64 Encoding
Replace the stack-overflow-prone code:

**Current (crashes on large files):**
```javascript
const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
```

**Fixed (chunked encoding):**
```javascript
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, [...chunk]);
  }
  return btoa(binary);
}
```

### 3. Two-Step AI Process
Since Lovable AI uses OpenAI-compatible API (not Gemini's native multimodal format), we need to:

1. **Step 1: Extract text from PDF** using a multimodal model that accepts base64 inline data
2. **Step 2: Parse biomarkers** from the extracted text using `gemini-2.5-pro`
3. **Step 3: Generate insights** using `gemini-2.5-flash`

### Files to Modify
| File | Change |
|------|--------|
| `supabase/functions/parse-bloodwork/index.ts` | Complete rewrite to use Lovable AI gateway |

### Where Analysis Appears After Fix
Once working, users will see:
- **Biomarker cards** grouped by category (Lipid Panel, Metabolic, etc.)
- **Reference range bars** showing where values fall
- **Status badges** (normal, high, low)
- **AI Health Insights** card with personalized analysis
- **Trends chart** when multiple reports exist

### Future Enhancement (Optional)
Add bloodwork data to the `activity_embeddings` table for semantic search, allowing queries like "when was my cholesterol high?" in the Journal Chat.
