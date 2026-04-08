import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = ["/", "/login", "/cadastro", "/recuperar-senha"];

// Rotas que requerem auth mas NÃO onboarding completo
const ONBOARDING_ROUTES = ["/onboarding"];

// Rotas que requerem auth + onboarding completo (qualquer usuário)
const APP_ROUTES = ["/escritorio"];

// Rotas que requerem role: company_admin ou super_admin
const ADMIN_ROUTES = ["/admin"];

// Rotas que requerem role: super_admin
const SUPER_ADMIN_ROUTES = ["/super-admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Criar response mutável para permitir set de cookies
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: não adicionar lógica entre createServerClient e getUser
  // Ver: https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.app_metadata?.role ?? "employee") as string;
  // Camada 1: briefing da empresa concluído
  const companyBriefingCompleted = user?.app_metadata?.company_briefing_completed === true;
  // Camada 2: briefing de setor concluído → onboarding totalmente completo
  const onboardingCompleted = user?.app_metadata?.onboarding_completed === true;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const isOnboardingRoute = ONBOARDING_ROUTES.some((r) =>
    pathname.startsWith(r)
  );
  const isOnboardingSetorRoute = pathname.startsWith("/onboarding/setor");
  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some((r) =>
    pathname.startsWith(r)
  );
  const isProtectedRoute =
    isAppRoute || isAdminRoute || isSuperAdminRoute || isOnboardingRoute;

  // 1. Não autenticado tentando acessar rota protegida → login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Autenticado tentando acessar login/cadastro → app
  if (user && (pathname === "/login" || pathname === "/cadastro")) {
    return NextResponse.redirect(new URL("/escritorio", request.url));
  }

  if (user) {
    // 3. Camada 1 não concluída → forçar /onboarding (empresa)
    if (!companyBriefingCompleted && isAppRoute) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // 4. Camada 1 concluída mas Camada 2 pendente + tentando acessar app → forçar /onboarding/setor
    if (companyBriefingCompleted && !onboardingCompleted && isAppRoute) {
      return NextResponse.redirect(new URL("/onboarding/setor", request.url));
    }

    // 5. Camada 1 concluída mas Camada 2 pendente + tentando acessar /onboarding (Camada 1) → redirecionar para Camada 2
    if (
      companyBriefingCompleted &&
      !onboardingCompleted &&
      isOnboardingRoute &&
      !isOnboardingSetorRoute
    ) {
      return NextResponse.redirect(new URL("/onboarding/setor", request.url));
    }

    // 6. Onboarding totalmente concluído tentando acessar /onboarding/* → app
    if (onboardingCompleted && isOnboardingRoute) {
      return NextResponse.redirect(new URL("/escritorio", request.url));
    }

    // 7. Rota /admin → requer company_admin ou super_admin
    if (isAdminRoute && role !== "company_admin" && role !== "super_admin") {
      return NextResponse.redirect(new URL("/escritorio", request.url));
    }

    // 8. Rota /super-admin → requer super_admin
    if (isSuperAdminRoute && role !== "super_admin") {
      return NextResponse.redirect(new URL("/escritorio", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Excluir arquivos estáticos e internos do Next.js
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
