import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Lock,
  Scale,
  Shield,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  COMMUNITY_GUIDELINE_ENFORCEMENT_STEPS,
  COMMUNITY_GUIDELINES,
  COMMUNITY_GUIDELINES_ANCHOR,
  COMMUNITY_GUIDELINES_PATH,
  TERMS_OF_SERVICE_UPDATED_LABEL,
  TERMS_OF_SERVICE_VERSION,
} from "@/core/legal/termsOfService";
import { Button } from "@/shared/components/ui/button";

const legalForum =
  import.meta.env.VITE_LEGAL_FORUM ??
  "o foro competente definido pela legislação aplicável";

const TERMS_SECTIONS = [
  {
    icon: Users,
    title: "1. Aceitação dos termos",
    paragraphs: [
      "Ao acessar ou utilizar a plataforma Achegue-se, o usuário declara que leu, compreendeu e aceitou estes Termos de Uso, incluindo as Diretrizes da Comunidade, assim como a Política de Privacidade.",
      "Se o usuário não concordar com qualquer parte destes termos, não deve utilizar a plataforma. O uso continuado após atualizações relevantes representa aceitação das novas condições.",
      "A plataforma é destinada a maiores de 18 anos ou a menores representados e autorizados por seus responsáveis legais, conforme a legislação aplicável.",
    ],
  },
  {
    icon: FileText,
    title: "2. Escopo do serviço",
    paragraphs: [
      "O Achegue-se opera como uma plataforma digital voltada à descoberta territorial, comunicação comunitária e visibilidade de negócios, serviços e classificados locais.",
      "Os recursos podem incluir publicações, recomendações, mapas, páginas territoriais, perfis públicos, módulos de comunidade e fluxos de conta.",
      "A plataforma atua como intermediária tecnológica e não substitui autoridades públicas, relações contratuais privadas ou diligência própria do usuário.",
    ],
  },
  {
    icon: Lock,
    title: "3. Cadastro e segurança da conta",
    paragraphs: [
      "Para acessar recursos autenticados, o usuário deve fornecer dados verdadeiros, atuais e completos, mantendo e-mail, telefone e demais informações essenciais sempre corretos.",
      "Cada conta é pessoal. O usuário deve proteger suas credenciais, evitar compartilhamento indevido e comunicar rapidamente qualquer suspeita de uso não autorizado.",
      "A plataforma pode recusar cadastros, limitar funcionalidades, solicitar verificações adicionais ou encerrar contas quando houver violação destes termos, tentativa de fraude ou uso indevido.",
    ],
  },
  {
    icon: Shield,
    title: "4. Conteúdo e conduta do usuário",
    paragraphs: [
      "O usuário é responsável por todo conteúdo que publicar, comentar, recomendar, anunciar ou compartilhar na plataforma.",
      "Não é permitido divulgar conteúdo ilegal, enganoso, ofensivo, discriminatório, difamatório, abusivo, malicioso, violador de privacidade ou de direitos de terceiros.",
      "Também é proibido usar a plataforma para spam, manipulação de reputação, fraude, assédio, distribuição de malware ou qualquer conduta incompatível com a segurança da comunidade.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "5. Moderação e medidas aplicáveis",
    paragraphs: [
      "A plataforma pode revisar conteúdos, sinais de abuso, denúncias e comportamentos de risco por meios humanos e automatizados.",
      "Quando houver descumprimento de regras, a plataforma pode remover conteúdo, limitar alcance, suspender funcionalidades, aplicar bloqueios temporários ou encerrar contas.",
      "Nos casos exigidos por lei ou por preservação de direitos, a plataforma também pode colaborar com autoridades competentes.",
    ],
  },
  {
    icon: Scale,
    title: "6. Responsabilidade, propriedade e foro",
    paragraphs: [
      "A plataforma é fornecida conforme disponibilidade operacional, sem garantia absoluta de continuidade, ausência de falhas ou adequação a qualquer finalidade específica do usuário.",
      "Os elementos proprietários do produto, incluindo marca, identidade visual, software, layout e documentação, permanecem sob titularidade da plataforma ou de seus licenciantes.",
      `Estes termos são regidos pelas leis brasileiras. Fica eleito ${legalForum} para solução de controvérsias, salvo disposição legal específica em sentido diverso.`,
    ],
  },
] as const;

export default function TermosPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Termos de uso</title>
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
                  Base legal da plataforma
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Termos de uso
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Última atualização: {TERMS_OF_SERVICE_UPDATED_LABEL}. Versão{" "}
                  {TERMS_OF_SERVICE_VERSION}.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Uso, conduta e operação
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Regras contratuais para uso do Achegue-se
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Este documento resume as condições principais de acesso,
                cadastro, publicação, moderação e responsabilidade dentro da
                plataforma. O objetivo é deixar o uso claro, previsível e
                alinhado ao SSOT jurídico do produto.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Contrato de uso
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                Conta e conteúdo
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                Moderação
              </span>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:p-5">
            <p className="text-sm leading-6 text-foreground">
              Ao criar conta, publicar conteúdo ou interagir com a comunidade, o
              usuário aceita estas condições de uso e se compromete a respeitar
              as regras operacionais, legais e de segurança da plataforma.
            </p>
          </section>

          <div className="mt-5 space-y-4">
            {TERMS_SECTIONS.map((section) => {
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
                      <p
                        key={paragraph}
                        className="text-sm leading-6 text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <section
            id={COMMUNITY_GUIDELINES_ANCHOR}
            className="mt-5 rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6"
          >
            <div className="max-w-3xl space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Parte integrante dos termos
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Diretrizes da comunidade
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Estas diretrizes fazem parte dos Termos de Uso e orientam
                publicações, comentários, alertas, recomendações e interações em
                todos os territórios. O aceite da versão vigente é exigido no
                cadastro autogerenciado.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {COMMUNITY_GUIDELINES.map((guideline) => (
                <article
                  key={guideline.id}
                  className="rounded-2xl border border-border/70 bg-background/50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">
                        {guideline.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        {guideline.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Como a moderação escala
              </h3>
              <ol className="mt-3 space-y-2">
                {COMMUNITY_GUIDELINE_ENFORCEMENT_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Leia também os documentos complementares e os canais oficiais
                para temas de comunidade e privacidade.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/privacidade"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Política de privacidade
                </Link>
                <Link
                  to={COMMUNITY_GUIDELINES_PATH}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Diretrizes da comunidade
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
