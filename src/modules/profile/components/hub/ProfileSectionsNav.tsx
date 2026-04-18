/**
 * ProfileSectionsNav - Navegação de seções responsiva
 *
 * Desktop (lg+): sidebar fixa lateral com header e footer
 * Mobile: tabs roláveis horizontais sticky no topo
 * 
 * Features:
 * - Consome SSOT de profile-sections.config.ts
 * - Header com avatar e info do perfil
 * - Footer com ações rápidas
 * - Badges dinâmicos para notificações
 * - Scroll automático para seção ativa
 * - Acessibilidade completa (ARIA)
 */

import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/utils/cn";
import { ProfileSidebarHeader } from "./ProfileSidebarHeader";
import { ProfileSidebarFooter } from "./ProfileSidebarFooter";
import type { Profile } from "@/core/profiles/services/multi-profile/types";

export interface SectionNavItem<TId extends string = string> {
  id: TId;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

interface ProfileSectionsNavProps<TId extends string = string> {
  items: SectionNavItem<TId>[];
  activeId: TId;
  onChange: (id: TId) => void;
  /** Variante de exibição. Defaults: "sidebar" (desktop) e "tabs" (mobile) */
  variant?: "sidebar" | "tabs";
  /** Perfil ativo (apenas para sidebar) */
  profile?: Profile | null;
  /** Se o perfil está verificado (apenas para sidebar) */
  isVerified?: boolean;
  /** Handle do perfil (apenas para sidebar) */
  handle?: string;
  /** Se pode abrir perfil público (apenas para sidebar) */
  canOpenPublicProfile?: boolean;
}

/* ============================================================
 * SIDEBAR (desktop)
 * ============================================================ */
function SidebarVariant<TId extends string>({
  items,
  activeId,
  onChange,
  profile,
  isVerified,
  handle,
  canOpenPublicProfile,
}: ProfileSectionsNavProps<TId>) {
  return (
    <div className="flex h-full flex-col">
      {/* Header com info do perfil */}
      {profile ? (
        <>
          <ProfileSidebarHeader
            profile={profile}
            isVerified={isVerified}
            handle={handle}
            canOpenPublicProfile={canOpenPublicProfile}
            className="shrink-0"
          />
          <Separator />
        </>
      ) : null}

      {/* Navegação principal */}
      <nav
        aria-label="Seções do perfil"
        className="flex-1 space-y-1 overflow-y-auto px-2 py-3"
      >
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Navegação
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-foreground hover:bg-accent/50",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "shrink-0 rounded-xl p-2 transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground group-hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium leading-tight">{item.label}</p>
                  {item.badge ? (
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                      {item.badge}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer com ações rápidas */}
      {profile ? (
        <ProfileSidebarFooter
          profileId={profile.id}
          handle={handle || ""}
          canOpenPublicProfile={canOpenPublicProfile || false}
          className="shrink-0 py-3"
        />
      ) : null}
    </div>
  );
}

/* ============================================================
 * TABS (mobile/tablet) - horizontal scroll
 * ============================================================ */
function TabsVariant<TId extends string>({
  items,
  activeId,
  onChange,
}: ProfileSectionsNavProps<TId>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll automático para a tab ativa
  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-section-id="${activeId}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeId]);

  return (
    <nav
      aria-label="Seções do perfil"
      className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-0 sm:rounded-2xl sm:border sm:bg-card"
    >
      <ScrollArea className="w-full">
        <div ref={containerRef} className="flex gap-1.5 pb-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                data-section-id={item.id}
                onClick={() => onChange(item.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "border-primary/50 bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className={cn(
                      "ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </nav>
  );
}

export function ProfileSectionsNav<TId extends string = string>(
  props: ProfileSectionsNavProps<TId>,
) {
  const variant = props.variant ?? "sidebar";
  return variant === "sidebar" ? <SidebarVariant {...props} /> : <TabsVariant {...props} />;
}
