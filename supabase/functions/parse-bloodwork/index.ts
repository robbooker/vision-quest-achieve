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

    // Step 1: Extract text and parse biomarkers using multimodal model
    const extractionPrompt = `You are analyzing a bloodwork/lab results PDF. Extract ALL biomarkers from this document.

For each biomarker found, provide:
1. name: The exact biomarker name (e.g., "Total Cholesterol", "Hemoglobin A1c", "Vitamin D, 25-Hydroxy")
2. value: The numeric value (or text if not numeric)
3. unit: The unit of measurement (e.g., "mg/dL", "%", "ng/mL")
4. reference_low: The lower bound of normal range (null if not provided)
5. reference_high: The upper bound of normal range (null if not provided)
6. status: "normal", "low", "high", or "unknown" based on whether the value is within reference range
7. category: One of: "lipid_panel", "metabolic", "cbc", "thyroid", "vitamins", "liver", "kidney", "hormones", "inflammation", "other"

Also extract:
- lab_name: The laboratory name (e.g., "Quest Diagnostics", "LabCorp")
- report_date: The date of the lab work in YYYY-MM-DD format

Respond ONLY with valid JSON in this exact format:
{
  "lab_name": "string or null",
  "report_date": "YYYY-MM-DD or null",
  "biomarkers": [
    {
      "name": "string",
      "value": "number or string",
      "unit": "string",
      "reference_low": "number or null",
      "reference_high": "number or null",
      "status": "normal | low | high | unknown",
      "category": "string"
    }
  ]
}`;

    // Use Gemini 3 Pro for PDF extraction (multimodal - most advanced)
    const extractionResult = await callLovableAI(
      'google/gemini-3-pro-preview',
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
              text: extractionPrompt
            }
          ]
        }
      ],
      8192
    );

    console.log('Extraction result length:', extractionResult.length);

    // Parse the JSON response
    let parsedData: { lab_name?: string; report_date?: string; biomarkers: Biomarker[] };
    try {
      // Extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = extractionResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw text:', extractionResult.substring(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsed biomarkers count:', parsedData.biomarkers?.length || 0);

    // Step 2: Generate health insights using faster model
    let aiInsights = '';
    if (parsedData.biomarkers && parsedData.biomarkers.length > 0) {
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
          'google/gemini-3-pro-preview',
          [{ role: 'user', content: insightsPrompt }],
          2048
        );
        console.log('Generated insights length:', aiInsights.length);
      } catch (insightError) {
        console.error('Failed to generate insights:', insightError);
        // Continue without insights - biomarkers are still valuable
      }
    }

    // Update the report in the database
    const updateData: Record<string, unknown> = {
      biomarkers: parsedData.biomarkers,
      ai_insights: aiInsights,
      raw_text: extractionResult,
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
