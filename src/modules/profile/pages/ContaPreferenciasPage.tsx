import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Accessibility,
  Bell,
  CheckCircle2,
  ChevronRight,
  Eye,
  Link2,
  MapPin,
  Move,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  Text,
  UserRound,
} from "lucide-react";

import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { useAccessibility } from "@/shared/components/accessibility/AccessibilityProvider";
import { Switch } from "@/shared/components/ui/switch";
import type { AccessibilityFontSize } from "@/shared/accessibility/preferences";
import { cn } from "@/shared/utils/cn";

const PREFERENCE_ROWS = [
  {
    title: "Notificações",
    description: "Canais, frequência e horário silencioso.",
    icon: Bell,
    hrefKey: "notifications",
  },
  {
    title: "Privacidade e dados",
    description: "Consentimentos, exportação e exclusão da conta.",
    icon: Shield,
    hrefKey: "privacy",
  },
  {
    title: "Endereços e território",
    description: "Residência privada e contexto territorial do seu perfil.",
    icon: MapPin,
    hrefKey: "addresses",
  },
  {
    title: "Vínculos e membros",
    description: "Relações da identidade ativa e acesso de equipes.",
    icon: Link2,
    hrefKey: "links",
  },
  {
    title: "Identidade ativa",
    description: "Visibilidade e configurações do perfil em uso.",
    icon: UserRound,
    hrefKey: "identity",
  },
  {
    title: "Acessibilidade",
    description: "Contraste, tamanho do texto e preferências do dispositivo.",
    icon: Accessibility,
    hrefKey: "accessibility",
  },
] as const;

const FONT_SIZE_OPTIONS: Array<{
  value: AccessibilityFontSize;
  label: string;
  description: string;
}> = [
  { value: "normal", label: "Normal", description: "100%" },
  { value: "large", label: "Grande", description: "118%" },
  { value: "extra-large", label: "Extra grande", description: "132%" },
];

function AccessibilityPreferenceRow({
  icon,
  title,
  description,
  control,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex min-h-[78px] items-center gap-3 border-b border-territory-border py-3 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-territory-ink">{title}</p>
        <p className="mt-1 text-xs leading-4 text-territory-muted">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function ContaPreferenciasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appUrls = useAppUrls();
  const accessibilityView = location.hash === "#acessibilidade";
  const {
    isHighContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
  } = useAccessibility();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const resolveHref = (
    hrefKey: (typeof PREFERENCE_ROWS)[number]["hrefKey"],
  ) => {
    switch (hrefKey) {
      case "notifications":
        return ACCOUNT_PATHS.notifications;
      case "privacy":
        return ACCOUNT_PATHS.privacy;
      case "addresses":
        return ACCOUNT_PATHS.addresses;
      case "links":
        return appUrls.profile.settings("links");
      case "identity":
        return appUrls.profile.settings("privacy");
      case "accessibility":
        return ACCOUNT_PATHS.accessibility;
      default:
        return ACCOUNT_PATHS.home;
    }
  };

  if (accessibilityView) {
    const restoreDefaults = () => {
      if (isHighContrast) toggleHighContrast();
      setFontSize("normal");
    };

    return (
      <>
        <Helmet>
          <title>Acessibilidade | Achegue-se</title>
        </Helmet>

        <AccountSettingsShell
          title="Acessibilidade"
          description="Ajuste a leitura e o conforto visual do Achegue-se neste dispositivo."
        >
          <section className="rounded-2xl border border-territory-border bg-territory-surface px-4 sm:px-5">
            <AccessibilityPreferenceRow
              icon={<Eye className="h-5 w-5" aria-hidden="true" />}
              title="Contraste reforçado"
              description="Aumenta a separação visual de textos, controles e estados de foco."
              control={
                <Switch
                  id="account-high-contrast"
                  checked={isHighContrast}
                  onCheckedChange={(checked) => {
                    if (checked !== isHighContrast) toggleHighContrast();
                  }}
                  aria-label="Ativar contraste reforçado"
                />
              }
            />

            <div className="border-b border-territory-border py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                  <Text className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-territory-ink">Tamanho do texto</p>
                  <p className="mt-1 text-xs leading-4 text-territory-muted">
                    Escolha um tamanho confortável para ler o aplicativo.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Tamanho do texto">
                {FONT_SIZE_OPTIONS.map((option) => {
                  const selected = fontSize === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFontSize(option.value)}
                      className={cn(
                        "min-h-14 rounded-xl border px-2 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand",
                        selected
                          ? "border-territory-brand bg-territory-brand text-white"
                          : "border-territory-border bg-territory-raised text-territory-ink hover:border-territory-brand/50",
                      )}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className={cn("mt-0.5 block text-xs", selected ? "text-white/80" : "text-territory-muted")}>
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <AccessibilityPreferenceRow
              icon={<Move className="h-5 w-5" aria-hidden="true" />}
              title="Movimento reduzido"
              description="O Achegue-se acompanha automaticamente a preferência de movimento do sistema ou navegador."
              control={
                <span
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
                    prefersReducedMotion
                      ? "bg-territory-brand/10 text-territory-brand"
                      : "bg-territory-raised text-territory-muted",
                  )}
                  aria-live="polite"
                >
                  {prefersReducedMotion ? (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : null}
                  {prefersReducedMotion ? "Ativo" : "Padrão"}
                </span>
              }
            />
          </section>

          <section className="mt-4 rounded-2xl border border-territory-border bg-territory-raised p-4 sm:p-5">
            <p className="text-sm leading-5 text-territory-muted">
              Contraste e tamanho do texto ficam salvos neste dispositivo. Essas opções não alteram seus dados de perfil nem as permissões da conta.
            </p>
            <button
              type="button"
              onClick={restoreDefaults}
              disabled={!isHighContrast && fontSize === "normal"}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-territory-brand hover:bg-territory-brand/5 disabled:cursor-not-allowed disabled:text-territory-muted disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restaurar padrão
            </button>
          </section>
        </AccountSettingsShell>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Preferências | Achegue-se</title>
      </Helmet>

      <AccountSettingsShell
        title="Preferências do aplicativo"
        description="Encontre os ajustes da sua conta e abra cada área no lugar certo."
      >
        <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
          <div className="flex items-start gap-3 border-b border-territory-border pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-territory-ink">Ajustes pessoais</h2>
              <p className="mt-1 text-sm leading-5 text-territory-muted">
                Escolha uma área para revisar ou alterar suas preferências.
              </p>
            </div>
          </div>

          <div>
            {PREFERENCE_ROWS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigate(resolveHref(item.hrefKey))}
                  className="group flex min-h-[76px] w-full items-center gap-3 border-b border-territory-border py-3 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-raised text-territory-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-territory-ink">{item.title}</span>
                    <span className="mt-1 block text-xs leading-4 text-territory-muted">{item.description}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-territory-border bg-territory-raised p-4 text-sm leading-5 text-territory-muted sm:p-5">
          Cada ajuste continua em sua área responsável. Assim, uma mudança de aparência não altera sua privacidade, e uma mudança de perfil não interfere nas preferências do dispositivo.
        </section>
      </AccountSettingsShell>
    </>
  );
}
