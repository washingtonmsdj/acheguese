import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
  Facebook,
  Globe,
  Heart,
  Instagram,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Vote,
  Youtube,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { SafeLink } from "@/shared/components/security";
import { buildMailtoUrl, buildTelUrl } from "@/shared/utils/contactLinks";

type ElectedCard = {
  nome: string;
  cargo: string;
  partido: string;
  mandato: string;
};

type EmergencyContact = {
  nome: string;
  telefone: string;
  icone: React.ComponentType<{ className?: string }>;
  cor: string;
};

type UtilityContact = {
  nome: string;
  telefone: string;
};

type CivicChannel = {
  titulo: string;
  detalhe: string;
  acao: string;
  href: string;
};

type PrefeituraInfo = {
  endereco: string;
  horario: string;
  telefone: string;
  email: string;
  site: string;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export function CityElectedOfficialsSection({
  electedCards,
  cityDisplayName = "Cidade",
}: {
  electedCards: ElectedCard[];
  cityDisplayName?: string;
}) {
  if (!electedCards.length) {
    return null;
  }

  return (
    <section className="w-full bg-secondary/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Vote className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">Representantes Eleitos</h2>
          </div>
          <p className="text-base text-muted-foreground">Representação municipal de {cityDisplayName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {electedCards.map((pol, i) => (
            <motion.div
              key={pol.nome}
              {...fadeUp}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 md:p-7 text-center hover:shadow-xl hover:border-primary/30 transition-all"
            >
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Landmark className="h-9 w-9 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">{pol.nome}</h3>
              <p className="text-sm text-primary font-semibold mb-2">{pol.cargo}</p>
              <p className="text-xs text-muted-foreground">{pol.partido} · {pol.mandato}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CityUsefulContactsSection({
  emergencyContacts,
  utilityContacts,
  civicChannels,
  cityDisplayName = "Cidade",
}: {
  emergencyContacts: EmergencyContact[];
  utilityContacts: UtilityContact[];
  civicChannels: CivicChannel[];
  cityDisplayName?: string;
}) {
  if (!emergencyContacts.length && !utilityContacts.length && !civicChannels.length) {
    return null;
  }

  return (
    <>
      <section id="contatos" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-success" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Contatos Úteis</h2>
          </div>
          <p className="text-sm text-muted-foreground">Números de emergência e utilidade pública de {cityDisplayName}</p>
        </div>

        {!!emergencyContacts.length && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Emergência
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {emergencyContacts.map((contact) => (
                <a
                  key={contact.nome}
                  href={buildTelUrl(contact.telefone) ?? undefined}
                  className="bg-card border border-border rounded-2xl p-4 text-center hover:shadow-lg hover:border-destructive/30 transition-all group"
                >
                  <div className="flex justify-center mb-2">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                      <contact.icone className={`h-5 w-5 ${contact.cor}`} />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-foreground">{contact.telefone}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{contact.nome}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {!!utilityContacts.length && (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Utilidade Pública
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {utilityContacts.map((contact) => (
                <a
                  key={contact.nome}
                  href={buildTelUrl(contact.telefone) ?? undefined}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{contact.nome}</p>
                    <p className="text-xs text-primary font-medium">{contact.telefone}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {!!civicChannels.length && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 md:pb-10 w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Canais Cívicos Essenciais</h2>
            <p className="text-sm text-muted-foreground mt-1">Atalhos para demandas públicas da cidade</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {civicChannels.map((channel) => (
              <SafeLink
                key={channel.titulo}
                href={channel.href}
                allowInternal
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground">{channel.titulo}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{channel.detalhe}</p>
                </div>
                <span className="text-xs font-semibold text-primary whitespace-nowrap">{channel.acao}</span>
              </SafeLink>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function CityCommunityCtaSection({
  isAuthenticated,
  onOpenCommunity,
  onOpenBusiness,
  cityDisplayName = "Cidade",
}: {
  isAuthenticated: boolean;
  onOpenCommunity: () => void;
  onOpenBusiness: () => void;
  cityDisplayName?: string;
}) {
  return (
    <section className="w-full bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-primary font-bold text-sm">Junte-se a nós</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-heading leading-tight">
            Faça Parte da Comunidade<br className="hidden sm:block" /> de {cityDisplayName}
          </h2>

          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Conecte-se com moradores do seu bairro, descubra serviços locais e acompanhe classificados da cidade.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onOpenCommunity}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
            >
              {isAuthenticated ? "Ir para Comunidade" : "Criar Conta Grátis"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={onOpenBusiness}
              size="lg"
              className="border-border text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 font-semibold h-12 px-8 rounded-xl w-full sm:w-auto"
            >
              Cadastrar Negócio
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">Gratuito para sempre · Sem taxas ocultas · Comunidade local</p>
        </motion.div>
      </div>
    </section>
  );
}

function normalizeSocialHandle(value: string): string | null {
  const normalized = value.trim().replace(/^@/, "").replace(/^\/+/, "");
  return normalized ? encodeURIComponent(normalized) : null;
}

function buildSocialProfileUrl(baseUrl: string, handle: string): string | null {
  const normalizedHandle = normalizeSocialHandle(handle);
  return normalizedHandle ? `${baseUrl}/${normalizedHandle}` : null;
}

export function CityHallFooter({
  prefeituraInfo,
  cityDisplayName = "Cidade",
  stateCode = "",
  onNavigate,
  communityUrl,
  businessPath,
  servicesPath,
  classifiedsPath,
}: {
  prefeituraInfo: PrefeituraInfo;
  cityDisplayName?: string;
  stateCode?: string;
  onNavigate: (path: string) => void;
  communityUrl: string;
  businessPath: string;
  servicesPath: string;
  classifiedsPath: string;
}) {
  const socialLinks = [
    {
      key: "instagram",
      label: "Instagram",
      icon: Instagram,
      href: buildSocialProfileUrl("https://instagram.com", prefeituraInfo.instagram),
      className: "hover:text-primary",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: Facebook,
      href: buildSocialProfileUrl("https://facebook.com", prefeituraInfo.facebook),
      className: "hover:text-primary",
    },
    {
      key: "twitter",
      label: "Twitter/X",
      icon: Twitter,
      href: buildSocialProfileUrl("https://twitter.com", prefeituraInfo.twitter),
      className: "hover:text-primary",
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: Youtube,
      href: buildSocialProfileUrl("https://youtube.com", prefeituraInfo.youtube),
      className: "hover:text-destructive",
    },
  ] as const;

  return (
    <footer className="w-full bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Prefeitura de {cityDisplayName}</h3>
                <p className="text-[10px] text-muted-foreground">Governo Municipal</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                {prefeituraInfo.endereco}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {prefeituraInfo.horario}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">Contato</h3>
            <div className="space-y-2.5">
              <a href={buildTelUrl(prefeituraInfo.telefone) ?? undefined} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-3.5 w-3.5 text-primary" />
                {prefeituraInfo.telefone}
              </a>
              <a href={buildMailtoUrl(prefeituraInfo.email) ?? undefined} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-3.5 w-3.5 text-primary" />
                {prefeituraInfo.email}
              </a>
              {prefeituraInfo.site ? (
                <SafeLink href={prefeituraInfo.site} target="_blank" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {prefeituraInfo.site.replace("https://", "")}
                  <ExternalLink className="h-3 w-3" />
                </SafeLink>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">Redes Sociais</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                const className = `flex items-center gap-2 text-xs text-muted-foreground ${link.className} transition-colors bg-secondary/50 rounded-lg px-3 py-2`;

                if (!link.href) {
                  return (
                    <span key={link.key} className={className}>
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </span>
                  );
                }

                return (
                  <SafeLink key={link.key} href={link.href} target="_blank" className={className}>
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </SafeLink>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => onNavigate("/")} className="hover:text-primary transition-colors">Início</button>
            <button onClick={() => onNavigate(businessPath)} className="hover:text-primary transition-colors">Empresas</button>
            <button onClick={() => onNavigate(servicesPath)} className="hover:text-primary transition-colors">Serviços</button>
            <button onClick={() => onNavigate(classifiedsPath)} className="hover:text-primary transition-colors">Classificados</button>
            <button onClick={() => onNavigate(communityUrl)} className="hover:text-primary transition-colors">Comunidade</button>
          </div>
          <p className="text-[10px] text-muted-foreground">© 2026 Comunidade Conectada · {cityDisplayName}{stateCode ? `, ${stateCode}` : ""} · Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  );
}
