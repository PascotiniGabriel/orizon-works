import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM ?? "Orizon Works <noreply@orizonworks.com.br>";

export async function sendTokenWarningEmail(opts: {
  toEmail: string;
  companyName: string;
  tokenBalance: number;
  tokenLimit: number;
  percentRemaining: number;
}): Promise<void> {
  if (!resend) return;

  const { toEmail, companyName, tokenBalance, tokenLimit, percentRemaining } = opts;
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `⚠️ Tokens abaixo de ${percentRemaining}% — ${companyName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0A0A0A;color:#EBEBEB;border-radius:10px;overflow:hidden;border:1px solid #222">
        <div style="background:#161616;padding:20px 24px;border-bottom:1px solid #222">
          <div style="display:inline-flex;align-items:center;gap:8px">
            <div style="width:22px;height:22px;background:#10B981;border-radius:5px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#000">O</div>
            <span style="font-weight:700;font-size:15px">Orizon Works</span>
          </div>
        </div>
        <div style="padding:28px 24px">
          <p style="color:#FBBF24;font-weight:700;font-size:16px;margin:0 0 8px">⚠️ Saldo de tokens baixo</p>
          <p style="color:#888;font-size:14px;margin:0 0 20px">A empresa <strong style="color:#EBEBEB">${companyName}</strong> está com apenas <strong style="color:#FBBF24">${percentRemaining}%</strong> dos tokens restantes.</p>
          <div style="background:#1A1A1A;border-radius:8px;padding:16px;margin-bottom:20px">
            <p style="color:#555;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">Situação atual</p>
            <p style="color:#EBEBEB;font-size:24px;font-weight:700;margin:0">${fmt(tokenBalance)} <span style="font-size:14px;font-weight:400;color:#555">de ${fmt(tokenLimit)} tokens</span></p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://orizon-works-zeta.vercel.app"}/configuracoes" style="display:inline-block;background:#10B981;color:#000;font-weight:700;font-size:14px;padding:10px 22px;border-radius:6px;text-decoration:none">
            Comprar mais tokens →
          </a>
        </div>
        <div style="padding:14px 24px;border-top:1px solid #1A1A1A">
          <p style="color:#3A3A3A;font-size:12px;margin:0">Você está recebendo este e-mail porque é administrador da empresa ${companyName} na Orizon Works.</p>
        </div>
      </div>
    `,
  });
}

export async function sendTokenBlockedEmail(opts: {
  toEmail: string;
  companyName: string;
}): Promise<void> {
  if (!resend) return;

  const { toEmail, companyName } = opts;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `🚫 Tokens esgotados — ${companyName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0A0A0A;color:#EBEBEB;border-radius:10px;overflow:hidden;border:1px solid #222">
        <div style="background:#161616;padding:20px 24px;border-bottom:1px solid #222">
          <div style="display:inline-flex;align-items:center;gap:8px">
            <div style="width:22px;height:22px;background:#10B981;border-radius:5px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#000">O</div>
            <span style="font-weight:700;font-size:15px">Orizon Works</span>
          </div>
        </div>
        <div style="padding:28px 24px">
          <p style="color:#F87171;font-weight:700;font-size:16px;margin:0 0 8px">🚫 Tokens esgotados</p>
          <p style="color:#888;font-size:14px;margin:0 0 20px">A empresa <strong style="color:#EBEBEB">${companyName}</strong> ficou sem tokens. Os agentes de IA estão bloqueados até que o saldo seja recarregado.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://orizon-works-zeta.vercel.app"}/configuracoes" style="display:inline-block;background:#F87171;color:#000;font-weight:700;font-size:14px;padding:10px 22px;border-radius:6px;text-decoration:none">
            Recarregar agora →
          </a>
        </div>
        <div style="padding:14px 24px;border-top:1px solid #1A1A1A">
          <p style="color:#3A3A3A;font-size:12px;margin:0">Você está recebendo este e-mail porque é administrador da empresa ${companyName} na Orizon Works.</p>
        </div>
      </div>
    `,
  });
}
