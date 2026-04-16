import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Orizon Works",
  description: "Termos e condições de uso da plataforma Orizon Works.",
};

export default function TermosPage() {
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
          <Link href="/termos" style={{ color: "#EBEBEB", textDecoration: "none" }}>
            Termos de Uso
          </Link>
          <Link href="/privacidade" style={{ color: "#888", textDecoration: "none" }}>
            Privacidade
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1
          style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px", color: "#EBEBEB" }}
        >
          Termos de Uso
        </h1>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "40px" }}>
          Última atualização: abril de 2025
        </p>

        <Section title="1. Aceitação dos Termos">
          Ao acessar ou usar a plataforma Orizon Works, você concorda em cumprir estes Termos de
          Uso. Se você não concordar com qualquer parte destes termos, não utilize nossos serviços.
          Estes termos constituem um contrato legal entre você (ou a empresa que você representa) e
          Orizon Works.
        </Section>

        <Section title="2. Descrição do Serviço">
          A Orizon Works oferece uma plataforma de agentes de inteligência artificial voltada para
          uso empresarial. Os serviços incluem: criação e gestão de agentes de IA personalizados,
          chat com agentes especializados por setor, análise de documentos, avaliação de currículos,
          base de conhecimento com RAG (Retrieval-Augmented Generation) e ferramentas
          administrativas para gestão de times.
        </Section>

        <Section title="3. Cadastro e Conta">
          Para utilizar a plataforma, é necessário criar uma conta fornecendo informações precisas e
          completas. Você é responsável por manter a confidencialidade de suas credenciais de acesso
          e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente caso
          suspeite de uso não autorizado.
        </Section>

        <Section title="4. Planos e Pagamentos">
          A plataforma é oferecida em diferentes planos de assinatura (Trial, Starter, Growth e
          Business). Os planos pagos são cobrados de forma recorrente via cartão de crédito,
          processados pelo Stripe. O plano Trial concede acesso gratuito por período determinado.
          Planos pagos incluem período de carência de 7 (sete) dias. O cancelamento pode ser feito a
          qualquer momento, com acesso mantido até o fim do período vigente. Pacotes adicionais de
          tokens podem ser adquiridos pontualmente e são creditados imediatamente após a confirmação
          do pagamento.
        </Section>

        <Section title="5. Tokens e Limites de Uso">
          O uso dos agentes de IA é medido em tokens, unidade que representa o volume de texto
          processado. Cada plano inclui uma cota mensal de tokens. Ao esgotar os tokens disponíveis,
          o acesso aos agentes é suspenso até a renovação do plano ou aquisição de pacote adicional.
          Tokens não utilizados não são transferidos para o mês seguinte.
        </Section>

        <Section title="6. Uso Aceitável">
          Você concorda em utilizar a plataforma somente para fins lícitos e de acordo com estes
          termos. É vedado: usar a plataforma para atividades ilegais, fraudulentas ou prejudiciais;
          tentar acessar sistemas ou dados não autorizados; realizar engenharia reversa; distribuir
          malware; gerar conteúdo que viole direitos de terceiros; ou fazer uso excessivo da
          plataforma que comprometa sua disponibilidade para outros usuários.
        </Section>

        <Section title="7. Propriedade Intelectual">
          Todo o código, design, marca, logotipos e conteúdo da plataforma Orizon Works são de
          propriedade exclusiva da empresa e protegidos por leis de propriedade intelectual. O
          conteúdo gerado pelos agentes de IA a partir de seus dados pertence à sua empresa. Ao
          enviar documentos para a plataforma, você concede à Orizon Works uma licença limitada para
          processar esses dados com a finalidade de prestar o serviço contratado.
        </Section>

        <Section title="8. Confidencialidade e Segurança">
          Tratamos os dados da sua empresa com sigilo. Implementamos medidas técnicas e
          organizacionais adequadas para proteger as informações contra acesso não autorizado,
          alteração, divulgação ou destruição. Os dados são armazenados em servidores na região
          sa-east-1 (Brasil/América do Sul).
        </Section>

        <Section title="9. Limitação de Responsabilidade">
          A plataforma é fornecida "no estado em que se encontra". Não garantimos disponibilidade
          ininterrupta, ausência de erros ou que os resultados gerados pelos agentes de IA sejam
          precisos em todas as situações. Não nos responsabilizamos por decisões tomadas com base
          exclusivamente nas respostas dos agentes de IA. Nossa responsabilidade total está limitada
          ao valor pago pelos serviços nos últimos 3 (três) meses.
        </Section>

        <Section title="10. Rescisão">
          Podemos suspender ou encerrar sua conta caso identifiquemos violação destes termos,
          atividade fraudulenta ou uso inadequado da plataforma. Você pode cancelar sua assinatura a
          qualquer momento pelo painel de configurações. Dados serão retidos por 30 dias após o
          cancelamento e então excluídos permanentemente, salvo obrigação legal em contrário.
        </Section>

        <Section title="11. Alterações nos Termos">
          Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças relevantes por
          e-mail ou notificação na plataforma. O uso contínuo após a data de vigência das
          alterações constitui aceitação dos novos termos.
        </Section>

        <Section title="12. Lei Aplicável e Foro">
          Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de São
          Paulo/SP para dirimir quaisquer controvérsias decorrentes deste contrato, com renúncia a
          qualquer outro, por mais privilegiado que seja.
        </Section>

        <Section title="13. Contato">
          Para dúvidas sobre estes termos, entre em contato pelo e-mail:{" "}
          <span style={{ color: "#10B981" }}>contato@orizonworks.com.br</span>
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
        © {new Date().getFullYear()} Orizon Works · {" "}
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
      <p style={{ fontSize: "14px", lineHeight: "1.75", color: "#999" }}>{children}</p>
    </section>
  );
}
