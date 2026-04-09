import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { users, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// 2 milhões de tokens por pack
export const TOKEN_PACK_AMOUNT = 2_000_000;
// Valor em centavos BRL (R$79,00)
export const TOKEN_PACK_PRICE_CENTS = 7900;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Busca companyId e stripeCustomerId
  const [dbUser] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser?.companyId) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const [company] = await db
    .select({
      stripeCustomerId: companies.stripeCustomerId,
      name: companies.name,
    })
    .from(companies)
    .where(eq(companies.id, dbUser.companyId));

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const priceId = process.env.STRIPE_PRICE_TOKEN_PACK;
  if (!priceId) {
    return NextResponse.json(
      { error: "Token pack price not configured" },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: company.stripeCustomerId ?? undefined,
    customer_email: company.stripeCustomerId ? undefined : user.email ?? undefined,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      type: "token_pack",
      companyId: dbUser.companyId,
      tokens: TOKEN_PACK_AMOUNT.toString(),
    },
    success_url: `${appUrl}/configuracoes?token_pack=success`,
    cancel_url: `${appUrl}/configuracoes?token_pack=canceled`,
    payment_intent_data: {
      metadata: {
        type: "token_pack",
        companyId: dbUser.companyId,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
