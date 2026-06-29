import { Helmet } from "react-helmet-async";
import { ArrowLeft, Bell, Database, Eye, Globe, Lock, Mail, Shield, UserCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/button";

const POLICY_SECTIONS = [
  {
    icon: Shield,
    title: "1. Introducao e controlador dos dados",
    paragraphs: [
      'Esta Politica de Privacidade descreve como o Achegue-se coleta, usa, armazena, compartilha e protege os dados pessoais dos usuarios, em conformidade com a LGPD e demais normas aplicaveis.',
      "A plataforma atua como controladora dos dados pessoais coletados e decide sobre as finalidades e meios de tratamento.",
      "Ao criar conta ou usar os servicos, o usuario declara ter lido esta politica em conjunto com os Termos de Uso.",
    ],
  },
  {
    icon: Database,
    title: "2. Dados coletados",
    paragraphs: [
      "Podemos tratar dados de cadastro, como nome, handle, email, senha, estado, cidade e bairro.",
      "Tambem tratamos dados de uso e navegacao, como IP, navegador, sistema operacional, paginas acessadas, horario de acesso e interacoes.",
      "Conteudos publicados, comentarios, imagens, classificados e informacoes de localizacao fornecidas pelo usuario entram no escopo do tratamento quando necessarios para a experiencia comunitaria.",
    ],
  },
  {
    icon: Eye,
    title: "3. Finalidades do tratamento",
    paragraphs: [
      "Os dados sao usados para criar e gerenciar a conta, autenticar o usuario, operar os servicos contratados e enviar comunicacoes necessarias ao funcionamento da plataforma.",
      "Tambem tratamos dados para personalizacao, seguranca da comunidade, prevencao a fraude, moderacao de conteudo e melhoria continua do produto.",
      "Quando exigido, o tratamento pode ocorrer por cumprimento de obrigacao legal, exercicio regular de direitos ou consentimento do titular.",
    ],
  },
  {
    icon: UserCheck,
    title: "4. Compartilhamento de dados",
    paragraphs: [
      "Nao vendemos dados pessoais para terceiros com finalidade de marketing.",
      "Podemos compartilhar dados com fornecedores que operam autenticacao, hospedagem, analytics, suporte e outras funcoes essenciais, sempre sob contrato e necessidade operacional.",
      "Tambem pode haver compartilhamento por obrigacao legal, protecao de direitos, resposta a ordens de autoridade competente ou operacoes societarias.",
    ],
  },
  {
    icon: Lock,
    title: "5. Seguranca dos dados",
    paragraphs: [
      "Adotamos medidas tecnicas e organizacionais para proteger os dados contra acesso indevido, destruicao, perda, alteracao ou divulgacao nao autorizada.",
      "Isso inclui criptografia em transito, armazenamento seguro de credenciais, verificacao de senhas comprometidas e controles internos de acesso.",
      "Em caso de incidente relevante, seguimos o fluxo de resposta adequado e notificamos titulares e autoridades quando a legislacao exigir.",
    ],
  },
  {
    icon: UserCheck,
    title: "6. Direitos do titular",
    paragraphs: [
      "Nos termos da LGPD, o titular pode solicitar confirmacao de tratamento, acesso, correcao, anonimizacao, bloqueio, exclusao, portabilidade e informacoes sobre compartilhamento.",
      "Tambem pode revogar consentimentos e exercer oposicao quando a base legal permitir.",
      "Solicitacoes relacionadas a privacidade devem ser encaminhadas pelos canais oficiais da plataforma ou pela pagina de contato com o DPO.",
    ],
  },
  {
    icon: Bell,
    title: "7. Cookies e tecnologias similares",
    paragraphs: [
      "Utilizamos cookies e tecnologias equivalentes para autenticacao, continuidade de sessao, preferencias de exibicao e mediacao de desempenho.",
      "Cookies essenciais sustentam o funcionamento basico da plataforma. Outros recursos podem ser gerenciados pelo usuario conforme as configuracoes do navegador e do produto.",
    ],
  },
  {
    icon: Globe,
    title: "8. Transferencia internacional de dados",
    paragraphs: [
      "Alguns dados podem ser processados fora do Brasil, inclusive em provedores internacionais de infraestrutura e servicos de nuvem.",
      "Quando isso ocorrer, adotamos salvaguardas contratuais e tecnicas compativeis com o nivel de protecao exigido pela LGPD.",
    ],
  },
  {
    icon: Database,
    title: "9. Retencao de dados",
    paragraphs: [
      "Os dados sao mantidos pelo tempo necessario para cumprir as finalidades desta politica, respeitando obrigacoes legais, prazos de seguranca e necessidades legitimas da operacao.",
      "Dados de conta, logs e conteudos publicados podem seguir prazos distintos conforme a natureza do tratamento e a legislacao aplicavel.",
    ],
  },
  {
    icon: Mail,
    title: "10. Contato e encarregado de dados",
    paragraphs: [
      "Em caso de duvidas, exercicio de direitos ou reporte de incidente envolvendo dados pessoais, use os canais oficiais de suporte ou a pagina do encarregado de dados.",
      "Esta politica pode ser atualizada periodicamente. Alteracoes relevantes serao comunicadas pelos canais da plataforma.",
    ],
  },
] as const;

export default function PrivacidadePage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Politica de privacidade</title>
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.26))]">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8"
        >
          <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:rounded-3xl sm:border sm:bg-card/85 sm:px-5 sm:shadow-sm">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={() => navigate(-1)}
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  LGPD e governanca
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Politica de privacidade
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Ultima atualizacao: marco de 2026. Versao publica de leitura.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Transparencia de dados
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Como o Achegue-se trata dados pessoais
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Este resumo publico organiza as bases principais de coleta, uso, compartilhamento,
                seguranca e direitos do titular. Para solicitacoes operacionais, use o fluxo de privacidade da conta
                ou o canal do encarregado de dados.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                LGPD
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                Dados pessoais
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                Direitos do titular
              </span>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:p-5">
            <p className="text-sm leading-6 text-foreground">
              Esta politica se alinha a Lei Geral de Protecao de Dados Pessoais e ao Marco Civil da Internet.
              O tratamento de dados deve seguir necessidade, finalidade, seguranca e transparencia.
            </p>
          </section>

          <div className="mt-5 space-y-4">
            {POLICY_SECTIONS.map((section) => {
              const Icon = section.icon;

              return (
                <section
                  key={section.title}
                  className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground sm:text-lg">
                        {section.title}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-6 text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <section className="mt-5 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Veja tambem os documentos complementares e o canal de contato para assuntos de dados pessoais.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/termos"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Termos de uso
                </Link>
                <Link
                  to="/regras"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Regras da comunidade
                </Link>
                <Link
                  to="/dpo"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Falar com o DPO
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
