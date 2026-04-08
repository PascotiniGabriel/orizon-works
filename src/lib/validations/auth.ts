import { z } from "zod";

export const signInSchema = z.object({
  email: z.email({ error: "E-mail inválido" }).trim(),
  password: z.string().min(1, { error: "Senha obrigatória" }),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Nome deve ter pelo menos 2 caracteres" })
    .trim(),
  email: z.email({ error: "E-mail inválido" }).trim(),
  password: z
    .string()
    .min(8, { error: "Senha deve ter pelo menos 8 caracteres" })
    .regex(/[a-zA-Z]/, { error: "Senha deve conter pelo menos uma letra" })
    .regex(/[0-9]/, { error: "Senha deve conter pelo menos um número" }),
  companyName: z
    .string()
    .min(2, { error: "Nome da empresa deve ter pelo menos 2 caracteres" })
    .trim(),
  plan: z.enum(["trial", "starter", "growth", "business"]).default("trial"),
  acceptTerms: z.literal(true, {
    error: "Você deve aceitar os termos de uso",
  }),
});

export const resetPasswordSchema = z.object({
  email: z.email({ error: "E-mail inválido" }).trim(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type ActionState =
  | { success: true; message?: string }
  | { success: false; errors?: Record<string, string[]>; message?: string }
  | undefined;
