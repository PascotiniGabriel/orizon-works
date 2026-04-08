"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    id: "trial",
    label: "Trial grátis",
    description: "7 dias grátis, cartão obrigatório",
    badge: "Recomendado",
  },
  {
    id: "starter",
    label: "Starter",
    description: "R$ 197/mês — 1 agente, 5 usuários",
    badge: null,
  },
  {
    id: "growth",
    label: "Growth",
    description: "R$ 697/mês — 3 agentes, 15 usuários",
    badge: null,
  },
  {
    id: "business",
    label: "Business",
    description: "R$ 1.497/mês — 5 agentes, 40 usuários",
    badge: null,
  },
];

export default function CadastroPage() {
  const [state, action, pending] = useActionState(signUp, undefined);

  function fieldError(field: string) {
    if (state?.success === false && state.errors?.[field]) {
      return (
        <p className="text-sm text-destructive">{state.errors[field][0]}</p>
      );
    }
    return null;
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold" style={{ color: "#0D1B2A" }}>
          Criar conta
        </CardTitle>
        <CardDescription>
          Configure sua empresa em minutos com IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="João Silva"
              autoComplete="name"
              required
            />
            {fieldError("name")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da empresa</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Empresa Ltda"
              required
            />
            {fieldError("companyName")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail corporativo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@empresa.com"
              autoComplete="email"
              required
            />
            {fieldError("email")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
            />
            {fieldError("password")}
          </div>

          <div className="space-y-2">
            <Label>Plano</Label>
            <div className="grid grid-cols-1 gap-2">
              {PLANS.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:border-[#E8A020] transition-colors has-[:checked]:border-[#E8A020] has-[:checked]:bg-orange-50"
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    defaultChecked={plan.id === "trial"}
                    className="text-[#E8A020]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{plan.label}</span>
                      {plan.badge && (
                        <Badge
                          className="text-white text-xs"
                          style={{ backgroundColor: "#E8A020" }}
                        >
                          {plan.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {fieldError("plan")}
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              className="mt-1"
              required
            />
            <Label htmlFor="acceptTerms" className="font-normal leading-relaxed">
              Concordo com os{" "}
              <Link
                href="/termos"
                className="underline"
                style={{ color: "#E8A020" }}
                target="_blank"
              >
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link
                href="/privacidade"
                className="underline"
                style={{ color: "#E8A020" }}
                target="_blank"
              >
                Política de Privacidade
              </Link>
            </Label>
          </div>
          {fieldError("acceptTerms")}

          {state?.success === false && state.message && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full font-semibold text-white"
            style={{ backgroundColor: "#E8A020" }}
            disabled={pending}
          >
            {pending ? "Criando conta..." : "Criar conta e começar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: "#E8A020" }}
          >
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
