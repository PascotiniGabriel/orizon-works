"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/actions/auth";
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

export default function RecuperarSenhaPage() {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  if (state?.success === true) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle
            className="text-2xl font-bold"
            style={{ color: "#0D1B2A" }}
          >
            E-mail enviado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            {state.message}
          </div>
          <Link
            href="/login"
            className="block text-center text-sm font-medium hover:underline"
            style={{ color: "#E8A020" }}
          >
            ← Voltar para o login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold" style={{ color: "#0D1B2A" }}>
          Recuperar senha
        </CardTitle>
        <CardDescription>
          Digite seu e-mail e enviaremos um link para redefinir sua senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@empresa.com"
              autoComplete="email"
              required
            />
            {state?.success === false && state.errors?.email && (
              <p className="text-sm text-destructive">
                {state.errors.email[0]}
              </p>
            )}
          </div>

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
            {pending ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: "#E8A020" }}
          >
            Voltar para login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
