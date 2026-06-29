import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Eye,
  MapPin,
  Megaphone,
  Scale,
  Shield,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/button";

const COMMUNITY_RULES = [
  {
    icon: Ban,
    title: "Não acuse pessoas ou empresas",
    description:
      "Não use a plataforma para acusar terceiros de crime, fraude ou conduta ilegal sem canal oficial e base apropriada. Denúncias formais devem seguir os meios competentes.",
  },
  {
    icon: Eye,
    title: "Não exponha dados pessoais",
    description:
      "Não publique endereço, telefone, fotos privadas, documentos ou qualquer dado sensível de terceiros sem permissão válida e finalidade legítima.",
  },
  {
    icon: AlertTriangle,
    title: "Sem conteúdo ofensivo ou abusivo",
    description:
      "A comunidade não admite ameaça, discurso de ódio, discriminação, humilhação pública, assédio, intimidação ou ataques pessoais.",
  },
  {
    icon: MapPin,
    title: "Não divulgue operações sensíveis",
    description:
      "Não informe localização de blitz, operações policiais, fiscalização em andamento ou qualquer ação que possa comprometer a segurança pública.",
  },
  {
    icon: Megaphone,
    title: "Não espalhe desinformação",
    description:
      "Não publique boatos, alertas falsos ou informações sem contexto que possam gerar pânico, dano reputacional ou comportamento de risco na comunidade.",
  },
  {
    icon: Scale,
    title: "Respeite a lei e o contexto local",
    description:
      "Todo conteúdo precisa respeitar a legislação brasileira, as regras da plataforma e o uso responsável dos módulos de bairro, cidade e comunidade.",
  },
] as const;

const ENFORCEMENT_STEPS = [
  "Conteúdo removido e orientação inicial quando houver infração de menor gravidade.",
  "Restrição temporária de interação ou suspensão parcial em caso de reincidência ou risco moderado.",
  "Bloqueio prolongado ou encerramento da conta quando houver abuso grave, fraude, ameaça ou recorrência.",
] as const;

export default function RegrasPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Regras da comunidade</title>
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
                  Segurança comunitária
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Regras da comunidade
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Leitura pública para descoberta. Interação depende do contexto da conta.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Convivência, moderação e proteção
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Regras para manter a comunidade útil e segura
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Estas diretrizes organizam como posts, comentários, alertas, recomendações e
                interações podem acontecer dentro do Achegue-se. O objetivo é reduzir abuso,
                desinformação e risco territorial.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Leitura pública
              </span>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                Moderação ativa
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                Bairro, cidade e comunidade
              </span>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-2.5 text-amber-700 dark:text-amber-300">
                <Shield className="h-5 w-5" />
              </div>
              <p className="text-sm leading-6 text-foreground">
                Violações podem levar à remoção de conteúdo, restrição de alcance, suspensão de
                funcionalidades ou encerramento da conta, conforme gravidade, contexto e histórico.
              </p>
            </div>
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
            <section className="space-y-4">
              {COMMUNITY_RULES.map((rule) => {
                const Icon = rule.icon;

                return (
                  <article
                    key={rule.title}
                    className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-destructive/10 p-2.5 text-destructive">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground sm:text-lg">
                          {rule.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Como a moderação escala</h3>
                <div className="mt-4 space-y-3">
                  {ENFORCEMENT_STEPS.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Antes de publicar</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li>Cheque o contexto territorial e a fonte da informação.</li>
                  <li>Evite expor terceiros sem necessidade legítima.</li>
                  <li>Prefira fatos verificáveis e linguagem objetiva.</li>
                </ul>
              </section>
            </aside>
          </div>

          <section className="mt-5 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Consulte também os documentos complementares para entender o contrato de uso e o
                tratamento de dados pessoais na plataforma.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/termos"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Termos de uso
                </Link>
                <Link
                  to="/privacidade"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Política de privacidade
                </Link>
                <Link
                  to="/dpo"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Canal do DPO
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
