import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = ["/", "/login", "/cadastro", "/recuperar-senha"];

// Rotas que requerem auth mas NÃO onboarding completo
const ONBOARDING_ROUTES = ["/onboarding"];

// Rotas que requerem auth + onboarding completo
const APP_ROUTES = ["/escritorio", "/admin", "/super-admin"];

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

  const isPublicRoute = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const isOnboardingRoute = ONBOARDING_ROUTES.some((r) =>
    pathname.startsWith(r)
  );
  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r));

  // Usuário não autenticado tentando acessar rota protegida
  if (!user && (isAppRoute || isOnboardingRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário autenticado tentando acessar login/cadastro → redirecionar para app
  if (user && (pathname === "/login" || pathname === "/cadastro")) {
    return NextResponse.redirect(new URL("/escritorio", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Excluir arquivos estáticos e internos do Next.js
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
