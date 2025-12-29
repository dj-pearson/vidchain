// VidChain Create Checkout Session Edge Function
// Creates Stripe checkout sessions for subscriptions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

interface CheckoutRequest {
  price_id: string;
  success_url: string;
  cancel_url: string;
}

// Pricing tiers
const PRICE_IDS = {
  starter: {
    monthly: "price_starter_monthly",
    yearly: "price_starter_yearly",
  },
  professional: {
    monthly: "price_professional_monthly",
    yearly: "price_professional_yearly",
  },
  enterprise: {
    monthly: "price_enterprise_monthly",
    yearly: "price_enterprise_yearly",
  },
};

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { price_id, success_url, cancel_url }: CheckoutRequest = await req.json();

    if (!price_id) {
      throw new Error("Price ID is required");
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations!inner(stripe_customer_id)")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .single();

    if (membershipError || !membership) {
      throw new Error("You must be an organization owner to manage billing");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    let customerId = (membership.organizations as { stripe_customer_id: string }).stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || undefined,
        metadata: {
          organization_id: membership.organization_id,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", membership.organization_id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: success_url || `${req.headers.get("origin")}/settings/billing?success=true`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/settings/billing?canceled=true`,
      metadata: {
        organization_id: membership.organization_id,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          organization_id: membership.organization_id,
        },
      },
      billing_address_collection: "required",
      allow_promotion_codes: true,
    });

    return corsJsonResponse(req, {
      session_id: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return corsErrorResponse(
      req,
      error.message,
      error.message === "Unauthorized" ? 401 : 500
    );
  }
});
