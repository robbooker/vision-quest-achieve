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
      return new Response(JSON.stringify({ error: 'Invalid PDF URL format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const filePath = pathParts[1];

    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('bloodwork-pdfs')
      .download(filePath);

    if (downloadError || !pdfData) {
      console.error('Download error:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to download PDF' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert PDF to base64
    const arrayBuffer = await pdfData.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Call Gemini to parse the bloodwork PDF
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')!,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: base64Pdf,
                  },
                },
                {
                  text: `You are analyzing a bloodwork/lab results PDF. Extract ALL biomarkers from this document.

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
      "value": number or "string",
      "unit": "string",
      "reference_low": number or null,
      "reference_high": number or null,
      "status": "normal" | "low" | "high" | "unknown",
      "category": "string"
    }
  ]
}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to parse PDF with AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the JSON response
    let parsedData: { lab_name?: string; report_date?: string; biomarkers: Biomarker[] };
    try {
      // Extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw text:', rawText);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate health insights
    const insightsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')!,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Based on these bloodwork results, provide a brief health analysis:

${JSON.stringify(parsedData.biomarkers, null, 2)}

Guidelines:
1. Start with a 1-2 sentence overall summary
2. Highlight any concerning values (high or low) and explain what they might indicate
3. Note any particularly good results
4. Provide 2-3 actionable lifestyle recommendations based on the results
5. Keep the tone supportive and informative

IMPORTANT: End with this disclaimer: "This analysis is for informational purposes only and should not replace professional medical advice. Please consult with your healthcare provider about these results."

Keep the response under 400 words and use markdown formatting for readability.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    let aiInsights = '';
    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      aiInsights = insightsData.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
