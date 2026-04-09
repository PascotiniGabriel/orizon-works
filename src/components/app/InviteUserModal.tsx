"use client";

import { useState, useActionState, useEffect } from "react";
import { createInvite, type InviteActionState } from "@/actions/invites";
import { X, UserPlus, Loader2, CheckCircle2 } from "lucide-react";

const INITIAL_STATE: InviteActionState = { success: false };

export function InviteUserModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createInvite, INITIAL_STATE);

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => setOpen(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: "#E8A020" }}
      >
        <UserPlus className="h-3.5 w-3.5" />
        Convidar funcionário
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">Convidar funcionário</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  O usuário receberá um e-mail com o link de acesso
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo */}
            <form action={formAction} className="p-6 space-y-4">
              {state.success ? (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Convite enviado!</p>
                    <p className="text-sm text-gray-500 mt-0.5">{state.message}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="invite-email">
                      E-mail do funcionário
                    </label>
                    <input
                      id="invite-email"
                      name="email"
                      type="email"
                      placeholder="funcionario@empresa.com"
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="invite-role">
                      Função
                    </label>
                    <select
                      id="invite-role"
                      name="role"
                      defaultValue="employee"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 bg-white"
                    >
                      <option value="employee">Funcionário</option>
                      <option value="sector_manager">Responsável de Setor</option>
                    </select>
                  </div>

                  {state.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                      {state.error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ backgroundColor: "#E8A020" }}
                    >
                      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {pending ? "Enviando..." : "Enviar convite"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
