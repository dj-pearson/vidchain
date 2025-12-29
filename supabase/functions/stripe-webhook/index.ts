// VidChain Stripe Webhook Handler
// Handles Stripe subscription events

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

// Plan limits mapping
const PLAN_LIMITS = {
  free: {
    videos_per_month: 5,
    verifications_per_month: 10,
    api_rate_limit: 100,
    storage_gb: 1,
    team_members: 1,
  },
  starter: {
    videos_per_month: 50,
    verifications_per_month: 100,
    api_rate_limit: 1000,
    storage_gb: 10,
    team_members: 3,
  },
  professional: {
    videos_per_month: 500,
    verifications_per_month: 1000,
    api_rate_limit: 10000,
    storage_gb: 100,
    team_members: 10,
  },
  enterprise: {
    videos_per_month: -1, // Unlimited
    verifications_per_month: -1,
    api_rate_limit: 100000,
    storage_gb: 1000,
    team_members: -1,
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
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify webhook signature
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature");
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Stripe webhook event:", event.type, event.id);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organization_id;

        if (organizationId && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const priceId = subscription.items.data[0]?.price.id;
          const plan = getPlanFromPriceId(priceId);

          // Update organization
          await supabase
            .from("organizations")
            .update({
              subscription_status: "active",
              subscription_plan: plan,
              stripe_subscription_id: subscription.id,
              subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              ...PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
            })
            .eq("id", organizationId);

          // Log the event
          await supabase.from("audit_logs").insert({
            action: "subscription_created",
            resource_type: "organization",
            resource_id: organizationId,
            metadata: {
              plan,
              subscription_id: subscription.id,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organization_id;

        if (organizationId) {
          const priceId = subscription.items.data[0]?.price.id;
          const plan = getPlanFromPriceId(priceId);

          await supabase
            .from("organizations")
            .update({
              subscription_status: subscription.status,
              subscription_plan: plan,
              subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              ...PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
            })
            .eq("id", organizationId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organization_id;

        if (organizationId) {
          // Downgrade to free plan
          await supabase
            .from("organizations")
            .update({
              subscription_status: "canceled",
              subscription_plan: "free",
              stripe_subscription_id: null,
              subscription_period_end: new Date().toISOString(),
              ...PLAN_LIMITS.free,
            })
            .eq("id", organizationId);

          await supabase.from("audit_logs").insert({
            action: "subscription_canceled",
            resource_type: "organization",
            resource_id: organizationId,
            metadata: {
              subscription_id: subscription.id,
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get organization by customer ID
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          // Record payment
          await supabase.from("payments").insert({
            organization_id: org.id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "succeeded",
            paid_at: new Date(invoice.status_transitions?.paid_at! * 1000).toISOString(),
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          await supabase
            .from("organizations")
            .update({ subscription_status: "past_due" })
            .eq("id", org.id);

          await supabase.from("payments").insert({
            organization_id: org.id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: "failed",
          });
        }
        break;
      }

      default:
        console.log("Unhandled Stripe event type:", event.type);
    }

    // Store webhook event
    await supabase.from("webhook_events").insert({
      provider: "stripe",
      event_type: event.type,
      event_id: event.id,
      payload: event,
    });

    return corsJsonResponse(req, { received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return corsErrorResponse(req, error.message, 500);
  }
});

// Helper to determine plan from price ID
function getPlanFromPriceId(priceId: string): string {
  if (priceId.includes("starter")) return "starter";
  if (priceId.includes("professional")) return "professional";
  if (priceId.includes("enterprise")) return "enterprise";
  return "free";
}
