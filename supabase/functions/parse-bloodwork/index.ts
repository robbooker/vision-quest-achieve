import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Biomarker {
  name: string;
  value: number | string;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  status: 'normal' | 'low' | 'high' | 'unknown';
  category: string;
}

// Chunked base64 encoding to avoid stack overflow on large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, [...chunk]);
  }
  return btoa(binary);
}

// Call Lovable AI gateway
async function callLovableAI(
  model: string,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  maxTokens: number = 8192
): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Lovable AI error (${model}):`, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Two-stage extraction: first get raw text, then parse it
async function extractTextFromPDF(dataUrl: string): Promise<string> {
  const textExtractionPrompt = `You are analyzing a bloodwork/lab results PDF. 

Your task is simple: Extract ALL the text content you can see in this document.

Include:
- All test names and their values
- Reference ranges shown
- Dates
- Lab name
- Any headers or sections

Just output the raw text content, formatted clearly. Do NOT try to structure it as JSON yet.`;

  const rawText = await callLovableAI(
    'google/gemini-2.5-flash',
    [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: dataUrl }
          },
          {
            type: 'text',
            text: textExtractionPrompt
          }
        ]
      }
    ],
    8192
  );

  return rawText;
}

// Parse raw text into structured biomarkers
async function parseBiomarkersFromText(rawText: string): Promise<{ lab_name?: string; report_date?: string; biomarkers: Biomarker[] }> {
  const parsePrompt = `You are parsing bloodwork results from text. Extract ALL biomarkers into JSON format.

INPUT TEXT:
${rawText}

For each biomarker, provide:
- name: Exact test name
- value: The result value (number or text)
- unit: Unit of measurement
- reference_low: Lower bound of normal range (null if not shown)
- reference_high: Upper bound of normal range (null if not shown)
- status: "normal", "low", "high", or "unknown"
- category: One of: "lipid_panel", "metabolic", "cbc", "thyroid", "vitamins", "liver", "kidney", "hormones", "inflammation", "other"

Also extract lab_name and report_date (YYYY-MM-DD format) if present.

RESPOND WITH ONLY THIS JSON (no markdown, no explanation):
{"lab_name":null,"report_date":null,"biomarkers":[]}`;

  const result = await callLovableAI(
    'google/gemini-2.5-flash',
    [{ role: 'user', content: parsePrompt }],
    4096
  );

  // Try to parse the JSON
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse biomarkers JSON:', e);
    }
  }

  // If parsing fails, try to repair truncated JSON
  return repairAndParseJSON(result);
}

// Attempt to repair truncated JSON
function repairAndParseJSON(text: string): { lab_name?: string; report_date?: string; biomarkers: Biomarker[] } {
  // Find the start of JSON
  const startIndex = text.indexOf('{');
  if (startIndex === -1) {
    return { biomarkers: [] };
  }

  let jsonStr = text.substring(startIndex);
  
  // Remove markdown code blocks if present
  jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Count brackets to see if we need to close them
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let lastValidIndex = 0;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    const prevChar = i > 0 ? jsonStr[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      
      // Track the last complete object
      if (braceCount >= 0 && bracketCount >= 0) {
        lastValidIndex = i;
      }
    }
  }
  
  // Truncate to last valid position and close brackets
  jsonStr = jsonStr.substring(0, lastValidIndex + 1);
  
  // Try to find the last complete biomarker object
  const biomarkersMatch = jsonStr.match(/"biomarkers"\s*:\s*\[([\s\S]*)/);
  if (biomarkersMatch) {
    const biomarkersContent = biomarkersMatch[1];
    
    // Find all complete objects in the array
    const completeObjects: string[] = [];
    let depth = 0;
    let currentObject = '';
    let inStr = false;
    
    for (let i = 0; i < biomarkersContent.length; i++) {
      const char = biomarkersContent[i];
      const prev = i > 0 ? biomarkersContent[i - 1] : '';
      
      if (char === '"' && prev !== '\\') {
        inStr = !inStr;
      }
      
      if (!inStr) {
        if (char === '{') {
          if (depth === 0) currentObject = '';
          depth++;
        }
        if (char === '}') {
          depth--;
          if (depth === 0) {
            currentObject += char;
            try {
              JSON.parse(currentObject);
              completeObjects.push(currentObject);
            } catch {
              // Invalid object, skip
            }
            currentObject = '';
            continue;
          }
        }
      }
      
      if (depth > 0) {
        currentObject += char;
      }
    }
    
    // Rebuild valid JSON
    if (completeObjects.length > 0) {
      const repairedJson = `{"lab_name":null,"report_date":null,"biomarkers":[${completeObjects.join(',')}]}`;
      try {
        return JSON.parse(repairedJson);
      } catch {
        console.error('Failed to parse repaired JSON');
      }
    }
  }
  
  return { biomarkers: [] };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pdf_url, report_id } = await req.json();

    if (!pdf_url || !report_id) {
      return new Response(JSON.stringify({ error: 'Missing pdf_url or report_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download the PDF from storage
    const pathParts = pdf_url.split('/bloodwork-pdfs/');
    if (pathParts.length < 2) {
      console.error('Invalid PDF URL format:', pdf_url);
      return new Response(JSON.stringify({ error: 'Invalid PDF URL format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Decode URI components in case of spaces or special characters
    const filePath = decodeURIComponent(pathParts[1]);
    console.log('Downloading file from path:', filePath);

    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('bloodwork-pdfs')
      .download(filePath);

    if (downloadError || !pdfData) {
      console.error('Download error:', downloadError, 'Path:', filePath);
      return new Response(JSON.stringify({ error: 'Failed to download PDF', details: downloadError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert PDF to base64 using chunked encoding (prevents stack overflow)
    const arrayBuffer = await pdfData.arrayBuffer();
    const base64Pdf = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

    console.log('PDF downloaded, size:', arrayBuffer.byteLength, 'bytes');

    // Step 1: Extract raw text from PDF (simpler task, less likely to truncate)
    console.log('Step 1: Extracting raw text from PDF...');
    const rawText = await extractTextFromPDF(dataUrl);
    console.log('Raw text extracted, length:', rawText.length);

    if (!rawText || rawText.length < 50) {
      console.error('Failed to extract meaningful text from PDF');
      return new Response(JSON.stringify({ error: 'Could not extract text from PDF. The document may be a scanned image that requires OCR.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Parse biomarkers from the extracted text (text-only, no vision needed)
    console.log('Step 2: Parsing biomarkers from text...');
    const parsedData = await parseBiomarkersFromText(rawText);
    console.log('Parsed biomarkers count:', parsedData.biomarkers?.length || 0);

    if (!parsedData.biomarkers || parsedData.biomarkers.length === 0) {
      console.error('No biomarkers extracted from text');
      return new Response(JSON.stringify({ 
        error: 'Could not identify biomarkers in this document. Please ensure this is a lab results PDF.',
        raw_text: rawText.substring(0, 500)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Generate health insights
    console.log('Step 3: Generating health insights...');
    let aiInsights = '';
    const insightsPrompt = `Based on these bloodwork results, provide a brief health analysis:

${JSON.stringify(parsedData.biomarkers, null, 2)}

Guidelines:
1. Start with a 1-2 sentence overall summary
2. Highlight any concerning values (high or low) and explain what they might indicate
3. Note any particularly good results
4. Provide 2-3 actionable lifestyle recommendations based on the results
5. Keep the tone supportive and informative

IMPORTANT: End with this disclaimer: "This analysis is for informational purposes only and should not replace professional medical advice. Please consult with your healthcare provider about these results."

Keep the response under 400 words and use markdown formatting for readability.`;

    try {
      aiInsights = await callLovableAI(
        'google/gemini-2.5-flash',
        [{ role: 'user', content: insightsPrompt }],
        2048
      );
      console.log('Generated insights length:', aiInsights.length);
    } catch (insightError) {
      console.error('Failed to generate insights:', insightError);
      // Continue without insights - biomarkers are still valuable
    }

    // Update the report in the database
    const updateData: Record<string, unknown> = {
      biomarkers: parsedData.biomarkers,
      ai_insights: aiInsights,
      raw_text: rawText,
    };

    if (parsedData.lab_name) {
      updateData.lab_name = parsedData.lab_name;
    }
    if (parsedData.report_date) {
      updateData.report_date = parsedData.report_date;
    }

    const { error: updateError } = await supabase
      .from('bloodwork_reports')
      .update(updateData)
      .eq('id', report_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save parsed data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully parsed and saved bloodwork report');

    return new Response(
      JSON.stringify({
        success: true,
        biomarkers: parsedData.biomarkers,
        lab_name: parsedData.lab_name,
        report_date: parsedData.report_date,
        ai_insights: aiInsights,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
