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

import { Button } from "@/shared/components/ui/button";

const legalForum =
  import.meta.env.VITE_LEGAL_FORUM ?? "o foro competente definido pela legislacao aplicavel";

const TERMS_SECTIONS = [
  {
    icon: Users,
    title: "1. Aceitacao dos termos",
    paragraphs: [
      "Ao acessar ou utilizar a plataforma Achegue-se, o usuario declara que leu, compreendeu e aceitou estes Termos de Uso, assim como a Politica de Privacidade e as Regras da Comunidade.",
      "Se o usuario nao concordar com qualquer parte destes termos, nao deve utilizar a plataforma. O uso continuado apos atualizacoes relevantes representa aceitacao das novas condicoes.",
      "A plataforma e destinada a maiores de 18 anos ou a menores representados e autorizados por seus responsaveis legais, conforme a legislacao aplicavel.",
    ],
  },
  {
    icon: FileText,
    title: "2. Escopo do servico",
    paragraphs: [
      "O Achegue-se opera como uma plataforma digital voltada a descoberta territorial, comunicacao comunitaria e visibilidade de negocios, servicos e classificados locais.",
      "Os recursos podem incluir publicacoes, recomendacoes, mapas, paginas territoriais, perfis publicos, modulos de comunidade e fluxos de conta.",
      "A plataforma atua como intermediaria tecnologica e nao substitui autoridades publicas, relacoes contratuais privadas ou diligencia propria do usuario.",
    ],
  },
  {
    icon: Lock,
    title: "3. Cadastro e seguranca da conta",
    paragraphs: [
      "Para acessar recursos autenticados, o usuario deve fornecer dados verdadeiros, atuais e completos, mantendo email, telefone e demais informacoes essenciais sempre corretos.",
      "Cada conta e pessoal. O usuario deve proteger suas credenciais, evitar compartilhamento indevido e comunicar rapidamente qualquer suspeita de uso nao autorizado.",
      "A plataforma pode recusar cadastros, limitar funcionalidades, solicitar verificacoes adicionais ou encerrar contas quando houver violacao destes termos, tentativa de fraude ou uso indevido.",
    ],
  },
  {
    icon: Shield,
    title: "4. Conteudo e conduta do usuario",
    paragraphs: [
      "O usuario e responsavel por todo conteudo que publicar, comentar, recomendar, anunciar ou compartilhar na plataforma.",
      "Nao e permitido divulgar conteudo ilegal, enganoso, ofensivo, discriminatorio, difamatorio, abusivo, malicioso, violador de privacidade ou de direitos de terceiros.",
      "Tambem e proibido usar a plataforma para spam, manipulacao de reputacao, fraude, assedio, distribuicao de malware ou qualquer conduta incompativel com a seguranca da comunidade.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "5. Moderacao e medidas aplicaveis",
    paragraphs: [
      "A plataforma pode revisar conteudos, sinais de abuso, denuncias e comportamentos de risco por meios humanos e automatizados.",
      "Quando houver descumprimento de regras, a plataforma pode remover conteudo, limitar alcance, suspender funcionalidades, aplicar bloqueios temporarios ou encerrar contas.",
      "Nos casos exigidos por lei ou por preservacao de direitos, a plataforma tambem pode colaborar com autoridades competentes.",
    ],
  },
  {
    icon: Scale,
    title: "6. Responsabilidade, propriedade e foro",
    paragraphs: [
      "A plataforma e fornecida conforme disponibilidade operacional, sem garantia absoluta de continuidade, ausencia de falhas ou adequacao a qualquer finalidade especifica do usuario.",
      "Os elementos proprietarios do produto, incluindo marca, identidade visual, software, layout e documentacao, permanecem sob titularidade da plataforma ou de seus licenciantes.",
      `Estes termos sao regidos pelas leis brasileiras. Fica eleito ${legalForum} para solucao de controversias, salvo disposicao legal especifica em sentido diverso.`,
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
                  Ultima atualizacao: marco de 2026. Versao publica de leitura.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Uso, conduta e operacao
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Regras contratuais para uso do Achegue-se
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Este documento resume as condicoes principais de acesso, cadastro, publicacao,
                moderacao e responsabilidade dentro da plataforma. O objetivo e deixar o uso claro,
                previsivel e alinhado ao SSOT juridico do produto.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Contrato de uso
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                Conta e conteudo
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                Moderacao
              </span>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:p-5">
            <p className="text-sm leading-6 text-foreground">
              Ao criar conta, publicar conteudo ou interagir com a comunidade, o usuario aceita estas
              condicoes de uso e se compromete a respeitar as regras operacionais, legais e de
              seguranca da plataforma.
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
                Leia tambem os documentos complementares e os canais oficiais para temas de comunidade
                e privacidade.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/privacidade"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Politica de privacidade
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
