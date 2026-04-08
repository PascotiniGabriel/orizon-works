import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { PLANS, type PlanId } from "@/lib/stripe/plans";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

// Desabilitar o body parser — Stripe precisa do raw body para verificar assinatura
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await db
          .update(companies)
          .set({
            subscriptionStatus: "canceled",
            plan: "trial",
            updatedAt: new Date(),
          })
          .where(eq(companies.stripeSubscriptionId, subscription.id));
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Resetar tokens no início de cada ciclo de cobrança
        if (invoice.billing_reason === "subscription_cycle") {
          const subscriptionId = getSubscriptionId(invoice);
          if (subscriptionId) {
            await db
              .update(companies)
              .set({ tokenUsed: 0, updatedAt: new Date() })
              .where(eq(companies.stripeSubscriptionId, subscriptionId));
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getSubscriptionId(invoice);
        if (subscriptionId) {
          await db
            .update(companies)
            .set({ subscriptionStatus: "past_due", updatedAt: new Date() })
            .where(eq(companies.stripeSubscriptionId, subscriptionId));
        }
        break;
      }

      default:
        // Ignorar eventos não tratados
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// Stripe v22: subscription ID agora está em parent.subscription_details.subscription
function getSubscriptionId(invoice: Stripe.Invoice): string | null {
  if (
    invoice.parent?.type === "subscription_details" &&
    invoice.parent.subscription_details?.subscription
  ) {
    const sub = invoice.parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  return null;
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription
): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id;

  // Mapear price ID → plano
  let plan: PlanId = "trial";
  for (const [planId, config] of Object.entries(PLANS)) {
    if (config.priceId && config.priceId === priceId) {
      plan = planId as PlanId;
      break;
    }
  }

  const planConfig = PLANS[plan];
  const status = subscription.status as
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid";

  await db
    .update(companies)
    .set({
      plan,
      subscriptionStatus: status,
      stripeSubscriptionId: subscription.id,
      tokenLimit: planConfig.tokens,
      tokenBalance: planConfig.tokens,
      maxAgents: planConfig.agents,
      maxUsers: planConfig.users,
      updatedAt: new Date(),
    })
    .where(eq(companies.stripeCustomerId, subscription.customer as string));
}
