import Link from "next/link";
import {
  Users, Megaphone, TrendingUp, DollarSign, FolderOpen,
  ArrowRight, Zap, Shield, BarChart3, Bot, CheckCircle2,
} from "lucide-react";

const AGENTS = [
  { icon: Users,      label: "RH",             color: "#A78BFA", desc: "Triagem de currículos, avaliação de entrevistas, políticas e gestão de pessoas." },
  { icon: Megaphone,  label: "Marketing",       color: "#FB7185", desc: "Briefings, copy, estratégia de conteúdo e análise de campanhas." },
  { icon: TrendingUp, label: "Comercial",       color: "#60A5FA", desc: "Propostas, objeções, qualificação de leads e argumentos de venda." },
  { icon: DollarSign, label: "Financeiro",      color: "#10B981", desc: "DRE, fluxo de caixa, análise de custos e relatórios financeiros." },
  { icon: FolderOpen, label: "Administrativo",  color: "#FBBF24", desc: "Processos internos, contratos, documentação e suporte operacional." },
];

const FEATURES = [
  { icon: Bot,       title: "Agentes especializados por setor",  desc: "Cada agente entende o contexto do seu setor. Não é um chat genérico — é um especialista treinado com o briefing da sua empresa." },
  { icon: Shield,    title: "RBAC multinível",                   desc: "Admin, Responsável de Setor e Funcionário. Cada usuário acessa só o que precisa." },
  { icon: Zap,       title: "RAG — base de conhecimento",        desc: "Faça upload de PDFs, documentos e políticas. Os agentes usam esses dados para responder com precisão." },
  { icon: BarChart3, title: "Dashboard de uso e tokens",         desc: "Acompanhe consumo por agente, sessões, mensagens e histórico completo." },
];

const PLANS = [
  { name: "Trial",    price: "Grátis",   tokens: "250k tokens",    agents: "Até 5 agentes",  highlight: false },
  { name: "Starter",  price: "R$ 197",   tokens: "1,5M tokens",    agents: "1 agente ativo",  highlight: false },
  { name: "Growth",   price: "R$ 697",   tokens: "5M tokens",      agents: "3 agentes ativos",highlight: true  },
  { name: "Business", price: "R$ 1.497", tokens: "12M tokens",     agents: "5 agentes ativos",highlight: false },
];

export default function LandingPage() {
  return (
    <div style={{ background: "#0A0A0A", color: "#EBEBEB", minHeight: "100vh", fontFamily: "var(--font-geist-sans, sans-serif)" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: "60px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "rgba(10,10,10,0.9)", backdropFilter: "blur(8px)", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "26px", height: "26px", background: "#10B981", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#000", fontSize: "13px", fontWeight: 800 }}>O</span>
          </div>
          <span style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.03em" }}>Orizon Works</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/login" style={{ height: "36px", padding: "0 18px", display: "flex", alignItems: "center", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontSize: "14px", textDecoration: "none", fontWeight: 500, transition: "border-color 0.15s" }}>
            Entrar
          </Link>
          <Link href="/cadastro" style={{ height: "36px", padding: "0 18px", display: "flex", alignItems: "center", borderRadius: "6px", background: "#10B981", color: "#000", fontSize: "14px", textDecoration: "none", fontWeight: 700 }}>
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "96px 24px 80px", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "999px", padding: "5px 14px", marginBottom: "28px" }}>
          <Zap style={{ width: "12px", height: "12px", color: "#10B981" }} fill="#10B981" />
          <span style={{ color: "#10B981", fontSize: "13px", fontWeight: 600 }}>IA empresarial para o mercado brasileiro</span>
        </div>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "20px" }}>
          Agentes de IA especializados{" "}
          <span style={{ color: "#10B981" }}>por setor</span>
          {" "}para a sua empresa
        </h1>

        <p style={{ color: "#888", fontSize: "18px", lineHeight: 1.6, marginBottom: "36px", maxWidth: "560px", margin: "0 auto 36px" }}>
          RH, Marketing, Comercial, Financeiro e Administrativo. Cada agente treinado com o contexto real da sua empresa — não um chatbot genérico.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/cadastro" style={{ display: "flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 28px", borderRadius: "8px", background: "#10B981", color: "#000", fontSize: "16px", textDecoration: "none", fontWeight: 700 }}>
            Começar com Trial grátis
            <ArrowRight style={{ width: "16px", height: "16px" }} strokeWidth={2.5} />
          </Link>
          <Link href="/login" style={{ display: "flex", alignItems: "center", height: "48px", padding: "0 28px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontSize: "16px", textDecoration: "none", fontWeight: 500 }}>
            Ver demonstração
          </Link>
        </div>
      </section>

      {/* Agents grid */}
      <section style={{ padding: "48px 24px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{ textAlign: "center", color: "#444", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "40px" }}>
          5 agentes especializados incluídos no plano
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {AGENTS.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.label} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "20px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: `${a.color}15`, border: `1px solid ${a.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <Icon style={{ width: "18px", height: "18px", color: a.color }} strokeWidth={1.75} />
                </div>
                <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, marginBottom: "6px", letterSpacing: "-0.01em" }}>{a.label}</p>
                <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.5 }}>{a.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "48px 24px 80px", background: "#0D0D0D", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: "#444", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "12px" }}>Funcionalidades</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "48px" }}>
            Construído para empresas que levam IA a sério
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: "17px", height: "17px", color: "#10B981" }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "6px" }}>{f.title}</p>
                    <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
        <p style={{ textAlign: "center", color: "#444", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "12px" }}>Planos</p>
        <h2 style={{ textAlign: "center", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "48px" }}>
          Simples, sem surpresas
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {PLANS.map((p) => (
            <div key={p.name} style={{
              background: p.highlight ? "rgba(16,185,129,0.06)" : "#111",
              border: p.highlight ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px", padding: "24px", position: "relative",
            }}>
              {p.highlight && (
                <div style={{ position: "absolute", top: "-11px", left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "#000", fontSize: "11px", fontWeight: 700, padding: "2px 12px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                  Mais popular
                </div>
              )}
              <p style={{ color: "#888", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>{p.name}</p>
              <p style={{ color: "#EBEBEB", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "4px" }}>{p.price}<span style={{ fontSize: "14px", fontWeight: 400, color: "#555" }}>{p.price !== "Grátis" ? "/mês" : ""}</span></p>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "16px 0", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[p.tokens, p.agents].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 style={{ width: "14px", height: "14px", color: "#10B981", flexShrink: 0 }} strokeWidth={2} />
                    <span style={{ color: "#888", fontSize: "13px" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/cadastro" style={{ display: "flex", justifyContent: "center", height: "38px", alignItems: "center", borderRadius: "6px", background: p.highlight ? "#10B981" : "rgba(255,255,255,0.05)", color: p.highlight ? "#000" : "#888", fontSize: "14px", textDecoration: "none", fontWeight: 600, border: p.highlight ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                Começar
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "64px 24px 96px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "16px" }}>
          Pronto para ter IA real na sua empresa?
        </h2>
        <p style={{ color: "#555", fontSize: "16px", marginBottom: "32px" }}>
          Comece grátis. Sem cartão de crédito.
        </p>
        <Link href="/cadastro" style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 32px", borderRadius: "8px", background: "#10B981", color: "#000", fontSize: "16px", textDecoration: "none", fontWeight: 700 }}>
          Criar conta grátis
          <ArrowRight style={{ width: "16px", height: "16px" }} strokeWidth={2.5} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <span style={{ color: "#3A3A3A", fontSize: "13px" }}>© 2026 Orizon Works</span>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/termos" style={{ color: "#3A3A3A", fontSize: "13px", textDecoration: "none" }}>Termos</Link>
          <Link href="/privacidade" style={{ color: "#3A3A3A", fontSize: "13px", textDecoration: "none" }}>Privacidade</Link>
          <Link href="/login" style={{ color: "#3A3A3A", fontSize: "13px", textDecoration: "none" }}>Login</Link>
        </div>
      </footer>
    </div>
  );
}
