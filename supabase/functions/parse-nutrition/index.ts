import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealDescription } = await req.json();
    
    if (!mealDescription || typeof mealDescription !== 'string') {
      return new Response(JSON.stringify({ error: "Meal description required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a nutrition expert and food database. Analyze this meal description and estimate the nutritional content as accurately as possible.

Meal: "${mealDescription}"

Consider typical portion sizes and common preparation methods. Be realistic with estimates.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "calories": 420,
  "protein_g": 28.5,
  "carbs_g": 32.0,
  "fats_g": 18.5,
  "sugar_g": 5.0,
  "fiber_g": 4.0,
  "parsed_items": ["3 scrambled eggs", "1 slice whole wheat toast with butter"]
}

Rules:
- All numeric values should be realistic estimates
- parsed_items should break down the meal into individual food items with quantities
- Use decimal values for grams (one decimal place)
- calories should be a whole number
- If you can't parse something, still provide your best estimate`;

    console.log("Parsing nutrition for:", mealDescription);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to parse nutrition" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("No content in AI response");
      return new Response(JSON.stringify({ error: "No nutrition data generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON response, handling potential markdown code blocks
    let nutritionData;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content;
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      nutritionData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(JSON.stringify({ 
        error: "Failed to parse nutrition data",
        raw: content 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the response structure
    const result = {
      calories: Math.round(Number(nutritionData.calories) || 0),
      protein_g: Number(nutritionData.protein_g) || 0,
      carbs_g: Number(nutritionData.carbs_g) || 0,
      fats_g: Number(nutritionData.fats_g) || 0,
      sugar_g: Number(nutritionData.sugar_g) || 0,
      fiber_g: Number(nutritionData.fiber_g) || 0,
      parsed_items: Array.isArray(nutritionData.parsed_items) ? nutritionData.parsed_items : [mealDescription],
    };

    console.log("Parsed nutrition:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Parse nutrition error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
