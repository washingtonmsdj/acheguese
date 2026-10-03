import { Helmet } from "react-helmet-async";
import {
  Bell,
  Database,
  Eye,
  Globe,
  Lock,
  Mail,
  Shield,
  UserCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { PublicInfoPageShell } from "@/app/components/public/PublicInfoPageShell";
import { COMMUNITY_GUIDELINES_PATH } from "@/core/legal/termsOfService";

const POLICY_SECTIONS = [
  {
    icon: Shield,
    title: "1. Introdução e controlador dos dados",
    paragraphs: [
      "Esta Política de Privacidade descreve como o Achegue-se coleta, usa, armazena, compartilha e protege os dados pessoais dos usuários, em conformidade com a LGPD e demais normas aplicáveis.",
      "A plataforma atua como controladora dos dados pessoais coletados e decide sobre as finalidades e meios de tratamento.",
      "Ao criar conta ou usar os serviços, o usuário declara ter lido esta política em conjunto com os Termos de Uso.",
    ],
  },
  {
    icon: Database,
    title: "2. Dados coletados",
    paragraphs: [
      "Podemos tratar dados de cadastro, como nome, handle, e-mail, senha, estado, cidade e bairro.",
      "Também tratamos dados de uso e navegação, como IP, navegador, sistema operacional, páginas acessadas, horário de acesso e interações.",
      "Conteúdos publicados, comentários, imagens, classificados e informações de localização fornecidas pelo usuário entram no escopo do tratamento quando necessários para a experiência comunitária.",
    ],
  },
  {
    icon: Eye,
    title: "3. Finalidades do tratamento",
    paragraphs: [
      "Os dados são usados para criar e gerenciar a conta, autenticar o usuário, operar os serviços contratados e enviar comunicações necessárias ao funcionamento da plataforma.",
      "Também tratamos dados para personalização, segurança da comunidade, prevenção a fraude, moderação de conteúdo e melhoria contínua do produto.",
      "Quando exigido, o tratamento pode ocorrer por cumprimento de obrigação legal, exercício regular de direitos ou consentimento do titular.",
    ],
  },
  {
    icon: UserCheck,
    title: "4. Compartilhamento de dados",
    paragraphs: [
      "Não vendemos dados pessoais para terceiros com finalidade de marketing.",
      "Podemos compartilhar dados com fornecedores que operam autenticação, hospedagem, analytics, suporte e outras funções essenciais, sempre sob contrato e necessidade operacional.",
      "Também pode haver compartilhamento por obrigação legal, proteção de direitos, resposta a ordens de autoridade competente ou operações societárias.",
    ],
  },
  {
    icon: Lock,
    title: "5. Segurança dos dados",
    paragraphs: [
      "Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso indevido, destruição, perda, alteração ou divulgação não autorizada.",
      "Isso inclui criptografia em trânsito, armazenamento seguro de credenciais, verificação de senhas comprometidas e controles internos de acesso.",
      "Em caso de incidente relevante, seguimos o fluxo de resposta adequado e notificamos titulares e autoridades quando a legislação exigir.",
    ],
  },
  {
    icon: UserCheck,
    title: "6. Direitos do titular",
    paragraphs: [
      "Nos termos da LGPD, o titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, exclusão, portabilidade e informações sobre compartilhamento.",
      "Também pode revogar consentimentos e exercer oposição quando a base legal permitir.",
      "Solicitações relacionadas à privacidade devem ser encaminhadas pelos canais oficiais da plataforma ou pela página de contato com o DPO.",
    ],
  },
  {
    icon: Bell,
    title: "7. Cookies e tecnologias similares",
    paragraphs: [
      "Utilizamos cookies e tecnologias equivalentes para autenticação, continuidade de sessão, preferências de exibição e mediação de desempenho.",
      "Cookies essenciais sustentam o funcionamento básico da plataforma. Outros recursos podem ser gerenciados pelo usuário conforme as configurações do navegador e do produto.",
    ],
  },
  {
    icon: Globe,
    title: "8. Transferência internacional de dados",
    paragraphs: [
      "Alguns dados podem ser processados fora do Brasil, inclusive em provedores internacionais de infraestrutura e serviços de nuvem.",
      "Quando isso ocorrer, adotamos salvaguardas contratuais e técnicas compatíveis com o nível de proteção exigido pela LGPD.",
    ],
  },
  {
    icon: Database,
    title: "9. Retenção de dados",
    paragraphs: [
      "Os dados são mantidos pelo tempo necessário para cumprir as finalidades desta política, respeitando obrigações legais, prazos de segurança e necessidades legítimas da operação.",
      "Dados de conta, logs e conteúdos publicados podem seguir prazos distintos conforme a natureza do tratamento e a legislação aplicável.",
    ],
  },
  {
    icon: Mail,
    title: "10. Contato e encarregado de dados",
    paragraphs: [
      "Em caso de dúvidas, exercício de direitos ou reporte de incidente envolvendo dados pessoais, use os canais oficiais de suporte ou a página do encarregado de dados.",
      "Esta política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas pelos canais da plataforma.",
    ],
  },
] as const;

export default function PrivacidadePage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Política de privacidade</title>
      </Helmet>

      <PublicInfoPageShell
        eyebrow="LGPD e governança"
        title="Política de privacidade"
        description="Última atualização: março de 2026. Versão pública de leitura."
        onBack={() => navigate(-1)}
      >
        <section className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-territory-brand">
              Transparência de dados
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-territory-ink sm:text-[2rem]">
              Como o Achegue-se trata dados pessoais
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-territory-muted">
              Este resumo público organiza as bases principais de coleta, uso,
              compartilhamento, segurança e direitos do titular. Para
              solicitações operacionais, use o fluxo de privacidade da conta
              ou o canal do encarregado de dados.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-territory-brand/20 bg-territory-brand/10 px-3 py-1 text-xs font-medium text-territory-brand">
              LGPD
            </span>
            <span className="rounded-full border border-territory-border/60 bg-territory-canvas/70 px-3 py-1 text-xs font-medium text-territory-ink">
              Dados pessoais
            </span>
            <span className="rounded-full border border-territory-border/60 bg-territory-canvas/70 px-3 py-1 text-xs font-medium text-territory-ink">
              Direitos do titular
            </span>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-territory-brand/20 bg-territory-brand/5 p-4 shadow-sm sm:p-5">
          <p className="text-sm leading-6 text-territory-ink">
            Esta política se alinha à Lei Geral de Proteção de Dados Pessoais
            e ao Marco Civil da Internet. O tratamento de dados deve seguir
            necessidade, finalidade, segurança e transparência.
          </p>
        </section>

        <div className="mt-5 space-y-4">
          {POLICY_SECTIONS.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.title}
                className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-territory-brand/10 p-2.5 text-territory-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-territory-ink sm:text-lg">
                      {section.title}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-6 text-territory-muted"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-5 rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-6 text-territory-muted">
              Veja também os documentos complementares e o canal de contato
              para assuntos de dados pessoais.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/termos"
                className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
              >
                Termos de uso
              </Link>
              <Link
                to={COMMUNITY_GUIDELINES_PATH}
                className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
              >
                Diretrizes da comunidade
              </Link>
              <Link
                to="/dpo"
                className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
              >
                Falar com o DPO
              </Link>
            </div>
          </div>
        </section>
      </PublicInfoPageShell>
    </>
  );
}
