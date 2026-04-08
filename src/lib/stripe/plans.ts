export type PlanId = "trial" | "starter" | "growth" | "business";

export const PLANS: Record<
  PlanId,
  { tokens: number; agents: number; users: number; priceId: string | null }
> = {
  trial: {
    tokens: 250_000,
    agents: 5,
    users: 999,
    priceId: null, // trial não tem price — criado via subscription com trial_period_days
  },
  starter: {
    tokens: 1_500_000,
    agents: 1,
    users: 5,
    priceId: process.env.STRIPE_PRICE_STARTER ?? null,
  },
  growth: {
    tokens: 5_000_000,
    agents: 3,
    users: 15,
    priceId: process.env.STRIPE_PRICE_GROWTH ?? null,
  },
  business: {
    tokens: 12_000_000,
    agents: 5,
    users: 40,
    priceId: process.env.STRIPE_PRICE_BUSINESS ?? null,
  },
};

export const TRIAL_DAYS = 7;
