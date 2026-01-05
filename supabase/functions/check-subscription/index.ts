import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check local subscriptions table for admin-granted access
    const { data: localSub, error: localError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (localSub && localSub.granted_by_admin) {
      const isActive = localSub.subscription_end && new Date(localSub.subscription_end) > new Date();
      logStep("Found admin-granted subscription", { status: localSub.status, isActive });
      
      return new Response(JSON.stringify({
        subscribed: isActive,
        status: isActive ? 'admin_granted' : 'expired',
        subscriptionEnd: localSub.subscription_end,
        trialEnd: null,
        canceledAt: null,
        isAdminGranted: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe for subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({
        subscribed: false,
        status: null,
        subscriptionEnd: null,
        trialEnd: null,
        canceledAt: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    // Find active or trialing subscription
    const activeSub = subscriptions.data.find(
      (sub: { status: string }) => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSub) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({
        subscribed: false,
        status: null,
        subscriptionEnd: null,
        trialEnd: null,
        canceledAt: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionEnd = activeSub.current_period_end 
      ? new Date(activeSub.current_period_end * 1000).toISOString() 
      : null;
    const trialEnd = activeSub.trial_end 
      ? new Date(activeSub.trial_end * 1000).toISOString() 
      : null;
    const canceledAt = activeSub.canceled_at 
      ? new Date(activeSub.canceled_at * 1000).toISOString() 
      : null;

    logStep("Active subscription found", {
      subscriptionId: activeSub.id,
      status: activeSub.status,
      trialEnd,
      cancelAtPeriodEnd: activeSub.cancel_at_period_end,
    });

    // Update local subscription record
    await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        status: activeSub.status,
        subscription_end: subscriptionEnd,
        trial_end: trialEnd,
        stripe_subscription_id: activeSub.id,
        stripe_customer_id: customerId,
        canceled_at: canceledAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      subscribed: true,
      status: activeSub.status,
      subscriptionEnd,
      trialEnd,
      canceledAt,
      cancelAtPeriodEnd: activeSub.cancel_at_period_end,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
