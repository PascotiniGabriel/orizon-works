"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { companies, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe/client";
import { PLANS, TRIAL_DAYS } from "@/lib/stripe/plans";
import {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  type ActionState,
} from "@/lib/validations/auth";
import { getUserCompanyInfo } from "@/lib/db/queries/company";

// ============================================================
// SIGN IN
// ============================================================

export async function signIn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      message:
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos"
          : "Erro ao fazer login. Tente novamente.",
    };
  }

  // Verificar se o onboarding foi concluído para redirecionar corretamente
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (authUser) {
    const info = await getUserCompanyInfo(authUser.id);
    if (info && !info.onboardingCompleted) {
      redirect("/onboarding");
    }
  }

  redirect("/escritorio");
}

// ============================================================
// SIGN UP
// ============================================================

export async function signUp(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    plan: formData.get("plan") ?? "trial",
    acceptTerms: formData.get("acceptTerms") === "on" ? true : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password, companyName, plan } = parsed.data;
  const planConfig = PLANS[plan];

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: name },
      email_confirm: true, // confirmar e-mail automaticamente no cadastro
    });

  if (authError || !authData.user) {
    const msg = authError?.message ?? "";
    if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("User already registered")) {
      return { success: false, message: "Este e-mail já está cadastrado." };
    }
    return { success: false, message: `Erro ao criar conta: ${msg || "erro desconhecido"}` };
  }

  const userId = authData.user.id;

  // Rastrear o que foi criado para rollback completo
  let companyId: string | null = null;
  let userInserted = false;
  let checkoutUrl: string | null = null;

  try {
    // 2. Criar customer no Stripe
    const stripeCustomer = await stripe.customers.create({
      email,
      name: companyName,
      metadata: { userId },
    });

    // 3. Calcular trial e status inicial
    const trialEnd = Math.floor(Date.now() / 1000) + TRIAL_DAYS * 86400;
    const initialStatus = "trialing";

    // 4. Criar empresa no banco
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 100);

    const [company] = await db
      .insert(companies)
      .values({
        name: companyName,
        slug: `${slug}-${userId.substring(0, 8)}`,
        plan: planConfig.priceId ? plan : "trial",
        subscriptionStatus: initialStatus,
        stripeCustomerId: stripeCustomer.id,
        stripeSubscriptionId: null,
        trialEndsAt: new Date(trialEnd * 1000),
        tokenBalance: planConfig.tokens,
        tokenLimit: planConfig.tokens,
        tokenUsed: 0,
        maxAgents: planConfig.agents,
        maxUsers: planConfig.users,
      })
      .returning();
    companyId = company.id;

    // 5. Criar usuário na tabela pública
    await db.insert(users).values({
      id: userId,
      companyId: company.id,
      email,
      fullName: name,
      role: "company_admin",
    });
    userInserted = true;

    // 6. Atualizar app_metadata com role (para uso no JWT/middleware)
    await adminSupabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: "company_admin", company_id: company.id },
    });

    // 7. Para planos pagos: criar Checkout Session no Stripe
    if (planConfig.priceId) {
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
        mode: "subscription",
        line_items: [{ price: planConfig.priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: TRIAL_DAYS,
          metadata: { company_id: company.id },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
      });
      checkoutUrl = session.url;
    }
  } catch (err) {
    // Rollback completo: remover tudo que foi criado
    if (userInserted) await db.delete(users).where(eq(users.id, userId)).catch(() => {});
    if (companyId) await db.delete(companies).where(eq(companies.id, companyId)).catch(() => {});
    await adminSupabase.auth.admin.deleteUser(userId);
    const errMsg = err instanceof Error
      ? `${err.message}${(err as any).cause?.message ? ` | ${(err as any).cause.message}` : ""}`
      : String(err);
    console.error("signUp error:", err);
    return {
      success: false,
      message: `Erro ao configurar conta: ${errMsg}`,
    };
  }

  // 8. Fazer login automático
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  // 9. Redirecionar: Checkout Stripe para planos pagos, onboarding para trial
  if (checkoutUrl) {
    redirect(checkoutUrl);
  }
  redirect("/onboarding");
}

// ============================================================
// SIGN OUT
// ============================================================

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ============================================================
// RESET PASSWORD
// ============================================================

export async function resetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/recuperar-senha/confirmar`,
    }
  );

  if (error) {
    return {
      success: false,
      message: "Erro ao enviar e-mail. Tente novamente.",
    };
  }

  return {
    success: true,
    message: "E-mail de recuperação enviado. Verifique sua caixa de entrada.",
  };
}
