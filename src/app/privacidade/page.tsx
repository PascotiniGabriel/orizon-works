import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Orizon Works",
  description: "Política de privacidade e proteção de dados da plataforma Orizon Works (LGPD).",
};

export default function PrivacidadePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111111",
        color: "#EBEBEB",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0 24px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/login"
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#10B981",
            textDecoration: "none",
            letterSpacing: "-0.3px",
          }}
        >
          Orizon Works
        </Link>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#888" }}>
          <Link href="/termos" style={{ color: "#888", textDecoration: "none" }}>
            Termos de Uso
          </Link>
          <Link href="/privacidade" style={{ color: "#EBEBEB", textDecoration: "none" }}>
            Privacidade
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1
          style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px", color: "#EBEBEB" }}
        >
          Política de Privacidade
        </h1>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "40px" }}>
          Última atualização: abril de 2025 · Em conformidade com a LGPD (Lei nº 13.709/2018)
        </p>

        <Section title="1. Controlador dos Dados">
          A Orizon Works é responsável pelo tratamento dos dados pessoais coletados por meio desta
          plataforma. Para questões relacionadas à privacidade e proteção de dados, entre em contato
          pelo e-mail: <span style={{ color: "#10B981" }}>privacidade@orizonworks.com.br</span>
        </Section>

        <Section title="2. Dados que Coletamos">
          Coletamos as seguintes categorias de dados:
          <ul style={{ marginTop: "10px", paddingLeft: "20px", lineHeight: "1.9" }}>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Dados de cadastro:</strong> nome completo,
              endereço de e-mail, nome da empresa e CNPJ.
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Dados de uso:</strong> mensagens enviadas aos
              agentes, histórico de sessões, arquivos enviados (PDFs, planilhas, áudios) e
              documentos da base de conhecimento.
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Dados de pagamento:</strong> informações de
              cobrança processadas pelo Stripe (não armazenamos dados de cartão de crédito
              diretamente).
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Dados técnicos:</strong> endereço IP, tipo de
              navegador, logs de acesso e informações de desempenho da plataforma.
            </li>
          </ul>
        </Section>

        <Section title="3. Finalidade e Base Legal (LGPD)">
          Utilizamos seus dados para as seguintes finalidades:
          <ul style={{ marginTop: "10px", paddingLeft: "20px", lineHeight: "1.9" }}>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Execução do contrato (Art. 7º, V):</strong>{" "}
              autenticação, prestação dos serviços, gestão de assinaturas e suporte técnico.
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Legítimo interesse (Art. 7º, IX):</strong>{" "}
              segurança da plataforma, prevenção a fraudes e melhoria dos serviços.
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Cumprimento de obrigação legal (Art. 7º, II):</strong>{" "}
              emissão de notas fiscais, obrigações tributárias e atendimento a autoridades.
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Consentimento (Art. 7º, I):</strong>{" "}
              comunicações de marketing e novidades da plataforma (revogável a qualquer momento).
            </li>
          </ul>
        </Section>

        <Section title="4. Compartilhamento de Dados">
          Seus dados podem ser compartilhados com:
          <ul style={{ marginTop: "10px", paddingLeft: "20px", lineHeight: "1.9" }}>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Anthropic:</strong> os textos das conversas são
              enviados à API da Anthropic para geração das respostas pelos agentes de IA.
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Supabase:</strong> armazenamento de dados e
              autenticação (servidores na região sa-east-1).
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Stripe:</strong> processamento de pagamentos.
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Groq:</strong> transcrição de arquivos de áudio
              (Whisper).
            </li>
            <li>
              <strong style={{ color: "#EBEBEB" }}>Voyage AI:</strong> geração de embeddings para
              a base de conhecimento (textos dos documentos enviados).
            </li>
          </ul>
          Não vendemos seus dados a terceiros. O compartilhamento ocorre apenas para a prestação do
          serviço contratado.
        </Section>

        <Section title="5. Retenção de Dados">
          Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, os dados são
          retidos por 30 dias e então excluídos permanentemente, salvo obrigação legal de retenção
          por prazo superior (ex: registros fiscais — 5 anos). Documentos enviados à base de
          conhecimento podem ser excluídos a qualquer momento pelo painel da plataforma.
        </Section>

        <Section title="6. Direitos dos Titulares">
          Nos termos da LGPD, você tem os seguintes direitos sobre seus dados:
          <ul style={{ marginTop: "10px", paddingLeft: "20px", lineHeight: "1.9" }}>
            <li>Confirmação da existência de tratamento</li>
            <li>Acesso aos dados</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
            <li>Portabilidade dos dados</li>
            <li>Eliminação dos dados tratados com consentimento</li>
            <li>Revogação do consentimento</li>
            <li>Oposição ao tratamento em caso de descumprimento da LGPD</li>
          </ul>
          Para exercer esses direitos, entre em contato pelo e-mail:{" "}
          <span style={{ color: "#10B981" }}>privacidade@orizonworks.com.br</span>. Responderemos
          em até 15 dias úteis.
        </Section>

        <Section title="7. Segurança">
          Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
          criptografia em trânsito (TLS/HTTPS), autenticação segura via Supabase Auth, controles de
          acesso por função (RBAC), políticas de Row Level Security (RLS) no banco de dados e
          armazenamento de arquivos em bucket privado no Supabase Storage.
        </Section>

        <Section title="8. Cookies">
          Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. Não
          utilizamos cookies de rastreamento para publicidade de terceiros. Os cookies de sessão são
          necessários para manter você conectado e não podem ser desativados sem comprometer o
          funcionamento do serviço.
        </Section>

        <Section title="9. Menores de Idade">
          Nossa plataforma é destinada exclusivamente a empresas e profissionais maiores de 18 anos.
          Não coletamos intencionalmente dados de menores de idade. Caso identifique tal situação,
          entre em contato para que possamos tomar as medidas cabíveis.
        </Section>

        <Section title="10. Transferência Internacional">
          Alguns de nossos prestadores de serviço (Anthropic, Stripe, Voyage AI) estão localizados
          nos Estados Unidos. A transferência de dados ocorre com base em cláusulas contratuais
          padrão e mecanismos equivalentes previstos na LGPD para garantir nível adequado de
          proteção.
        </Section>

        <Section title="11. Alterações nesta Política">
          Podemos atualizar esta política periodicamente. A versão vigente estará sempre disponível
          nesta página. Em caso de alterações relevantes, notificaremos por e-mail ou pela
          plataforma.
        </Section>

        <Section title="12. Encarregado de Dados (DPO)">
          Nosso encarregado pelo tratamento de dados pessoais pode ser contactado pelo e-mail:{" "}
          <span style={{ color: "#10B981" }}>privacidade@orizonworks.com.br</span>
        </Section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 24px",
          textAlign: "center",
          fontSize: "12px",
          color: "#444",
        }}
      >
        © {new Date().getFullYear()} Orizon Works ·{" "}
        <Link href="/termos" style={{ color: "#666", textDecoration: "none" }}>
          Termos de Uso
        </Link>{" "}
        ·{" "}
        <Link href="/privacidade" style={{ color: "#666", textDecoration: "none" }}>
          Política de Privacidade
        </Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "32px" }}>
      <h2
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "#EBEBEB",
          marginBottom: "10px",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: "14px", lineHeight: "1.75", color: "#999" }}>{children}</div>
    </section>
  );
}
