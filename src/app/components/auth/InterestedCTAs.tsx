import { Link } from "react-router-dom";
import { Bell, Building2, Handshake, Heart, ArrowRight } from "lucide-react";
import { SafeLink } from "@/shared/components/security";
import { buildMailtoUrl } from "@/shared/utils/contactLinks";

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

const contactEmail = import.meta.env.VITE_CONTACT_EMAIL ?? "";
const partnerMailtoUrl = buildMailtoUrl(contactEmail, {
  subject: "Quero ser parceiro do Achegue-se",
});
const supportMailtoUrl = buildMailtoUrl(contactEmail, {
  subject: "Quero apoiar o Achegue-se",
});

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
    href: partnerMailtoUrl ?? "/contato",
    external: Boolean(partnerMailtoUrl),
    icon: Handshake,
    tone: "partner",
  },
  {
    id: "apoiar",
    title: "Quero apoiar o projeto",
    description: "Sou investidor ou padrinho do movimento local.",
    href: supportMailtoUrl ?? "/contato",
    external: Boolean(supportMailtoUrl),
    icon: Heart,
    tone: "support",
  },
];

const TONE_STYLES: Record<CTAItem["tone"], string> = {
  primary: "border-territory-brand/30 bg-territory-brand/10 text-territory-brand",
  business: "border-territory-info/30 bg-territory-info/10 text-territory-info",
  partner: "border-territory-sun/40 bg-territory-sun/12 text-territory-ink",
  support: "border-territory-success/30 bg-territory-success/10 text-territory-success",
};

export function InterestedCTAs() {
  return (
    <section
      aria-labelledby="interested-ctas-title"
      className="mt-6 rounded-[24px] border border-territory-border bg-territory-surface/80 p-5 text-territory-ink sm:p-6"
    >
      <div className="mb-4 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-territory-brand">
          Chegou pela apresentação?
        </p>
        <h2
          id="interested-ctas-title"
          className="mt-1 font-heading text-lg font-semibold text-territory-ink sm:text-xl"
        >
          Escolha por onde quer entrar
        </h2>
        <p className="mt-1 text-xs text-territory-muted">
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
                <p className="text-[13.5px] font-semibold leading-tight text-territory-ink">
                  {item.title}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-territory-muted">
                  {item.description}
                </p>
              </div>
              <ArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-territory-muted"
                aria-hidden
              />
            </div>
          );

          const className =
            "block h-full rounded-2xl border border-territory-border bg-territory-canvas/60 p-3.5 transition-colors hover:border-territory-brand/40 hover:bg-territory-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand/40";

          return (
            <li key={item.id}>
              {item.external ? (
                <SafeLink href={item.href} className={className}>
                  {content}
                </SafeLink>
              ) : (
                <Link to={item.href} className={className}>
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
