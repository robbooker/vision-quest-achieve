import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authenticate via x-api-key header
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Validate API key using existing validate_api_key function
  const keyHash = await hashKey(apiKey);
  const { data: userId, error: keyError } = await supabase.rpc(
    "validate_api_key",
    { p_key_hash: keyHash }
  );

  if (keyError || !userId) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const { trip_name, start_date, end_date, legs } = body;
    if (!trip_name || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "trip_name, start_date, and end_date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        user_id: userId,
        destination: trip_name,
        start_date,
        end_date,
        purpose: body.purpose || "leisure",
        attendees: body.attendees || [],
        planned_activities: body.planned_activities || null,
        has_flight: (legs || []).some((l: any) => l.type === "flight"),
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Insert legs as trip_logistics
    const insertedLegs: any[] = [];
    if (Array.isArray(legs) && legs.length > 0) {
      const logisticsTypeMap: Record<string, string> = {
        flight: "flight",
        hotel: "stay",
        car: "car_rental",
        car_rental: "car_rental",
        stay: "stay",
        transportation: "transportation",
        activity: "activity",
      };

      const validTimezones = ["CT", "ET", "PT", "MT", "HT"];

      const logisticsRows = legs.map((leg: any) => {
        // Accept multiple field names for type
        const rawType = leg.type || leg.logistics_type || leg.leg_type || leg.category || "other";
        const mappedType = logisticsTypeMap[rawType] || rawType;

        return {
          trip_id: trip.id,
          user_id: userId,
          logistics_type: mappedType,
          provider_name: leg.provider || leg.provider_name || null,
          confirmation_code: leg.confirmation_code || leg.confirmation || null,
          flight_number: leg.flight_number || null,
          start_location: leg.from || leg.start_location || leg.departure_location || null,
          end_location: leg.to || leg.end_location || leg.arrival_location || null,
          start_datetime: leg.departure_datetime || leg.start_datetime || null,
          end_datetime: leg.arrival_datetime || leg.end_datetime || null,
          seat_assignment: leg.seat || leg.room || leg.seat_assignment || null,
          vehicle_type: leg.vehicle_type || null,
          contact_phone: leg.contact_phone || null,
          notes: leg.notes || null,
          timezone: validTimezones.includes(leg.timezone) ? leg.timezone : "CT",
          metadata: null,
        };
      });

      const { data: legsData, error: legsError } = await supabase
        .from("trip_logistics")
        .insert(logisticsRows)
        .select();

      if (legsError) throw legsError;
      insertedLegs.push(...(legsData || []));
    }

    const tripPayload = {
      trip,
      legs: insertedLegs,
    };

    // Webhook: POST to configured URL with x-api-key
    // Check user's profile or preferences for webhook URL, or use body override
    const webhookUrl = body.webhook_url || Deno.env.get("TRIPS_WEBHOOK_URL");
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(tripPayload),
        });
      } catch (webhookErr) {
        console.error("Webhook failed:", webhookErr);
      }
    }

    return new Response(JSON.stringify({ success: true, ...tripPayload }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("api-trips error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
