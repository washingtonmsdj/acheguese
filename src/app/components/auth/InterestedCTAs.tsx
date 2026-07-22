import { Link } from "react-router-dom";
import { Bell, Building2, Handshake, Heart, ArrowRight } from "lucide-react";

/**
 * InterestedCTAs
 *
 * Bloco de continuidade exibido no /cadastro para quem chegou pela
 * apresentação/demo. Não altera o modelo de domínio — aponta para fluxos
 * já existentes ou canais simples de contato.
 */

type CTAItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  icon: typeof Bell;
  tone: "primary" | "business" | "partner" | "support";
};

const ITEMS: CTAItem[] = [
  {
    id: "acompanhar",
    title: "Quero acompanhar o lançamento",
    description: "Avisamos assim que o Achegue-se abrir no seu bairro.",
    href: "/interesse",
    icon: Bell,
    tone: "primary",
  },
  {
    id: "empresa",
    title: "Quero cadastrar minha empresa",
    description: "Apareça para vizinhos que já procuram no bairro.",
    href: "/empresas/nova",
    icon: Building2,
    tone: "business",
  },
  {
    id: "parceiro",
    title: "Quero ser parceiro",
    description: "Vamos crescer juntos em bairros e cidades.",
    href: "mailto:parcerias@achegue-se.com.br?subject=Quero%20ser%20parceiro%20do%20Achegue-se",
    external: true,
    icon: Handshake,
    tone: "partner",
  },
  {
    id: "apoiar",
    title: "Quero apoiar o projeto",
    description: "Sou investidor ou padrinho do movimento local.",
    href: "mailto:contato@achegue-se.com.br?subject=Quero%20apoiar%20o%20Achegue-se",
    external: true,
    icon: Heart,
    tone: "support",
  },
];

const TONE_STYLES: Record<CTAItem["tone"], string> = {
  primary: "border-primary/25 bg-primary/[0.04] text-primary",
  business: "border-category-business/30 bg-category-business/[0.06] text-category-business",
  partner: "border-category-event/30 bg-category-event/[0.06] text-category-event",
  support: "border-category-alert/30 bg-category-alert/[0.06] text-category-alert",
};

export function InterestedCTAs() {
  return (
    <section
      aria-labelledby="interested-ctas-title"
      className="mt-6 rounded-[24px] border border-border/60 bg-card/70 p-5 sm:p-6"
    >
      <div className="mb-4 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
          Chegou pela apresentação?
        </p>
        <h2
          id="interested-ctas-title"
          className="mt-1 font-heading text-lg font-semibold text-foreground sm:text-xl"
        >
          Escolha por onde quer entrar
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Se seu bairro ainda não está aberto, a gente te avisa.
        </p>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const toneClass = TONE_STYLES[item.tone];
          const content = (
            <div className="flex h-full items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneClass}`}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold leading-tight text-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          );

          return (
            <li key={item.id}>
              {item.external ? (
                <a
                  href={item.href}
                  className="block h-full rounded-2xl border border-border/70 bg-background/60 p-3.5 transition-colors hover:border-primary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {content}
                </a>
              ) : (
                <Link
                  to={item.href}
                  className="block h-full rounded-2xl border border-border/70 bg-background/60 p-3.5 transition-colors hover:border-primary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
