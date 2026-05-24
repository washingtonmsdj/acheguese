/**
 * ContaHubLayout - Layout principal do hub de conta
 *
 * SSOT: Layout reutilizavel com props tipadas
 * Sem gambiarras: Separacao clara de responsabilidades
 *
 * Responsabilidades:
 * - Renderizar sidebar (desktop) / tabs (mobile)
 * - Renderizar header compacto
 * - Renderizar area de conteudo scrollavel
 * - Gerenciar navegacao entre sections
 */

import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";

import { ProfileHeaderCompact, ProfileSectionsNav } from "@/modules/profile/components/hub";
import type { MultiProfileRecord } from "@/core/profiles/services/multi-profile/types";
import type { Context, Identity } from "@/modules/profile/sections/types";
import type { ProfileSectionId } from "@/modules/profile/sections/types";
import type { SectionNavItem } from "@/modules/profile/components/hub/ProfileSectionsNav";

export interface ContaHubLayoutProps {
  // Navegacao
  readonly activeSection: ProfileSectionId;
  readonly onSectionChange: (section: ProfileSectionId) => void;
  readonly sectionItems: readonly SectionNavItem<ProfileSectionId>[];

  // Perfil
  readonly personalProfile: MultiProfileRecord | null;
  readonly profile: MultiProfileRecord | null;
  readonly allProfiles?: readonly MultiProfileRecord[];
  readonly isVerified: boolean;
  readonly canOpenPublicProfile: boolean;
  readonly handle: string;
  readonly territoryLabel?: string;

  // Header props
  readonly userEmail: string;
  readonly accountSnapshot: {
    readonly accountState: "active" | "inactive" | "blocked" | "suspended";
    readonly isBlocked: boolean;
    readonly isSuspended: boolean;
    readonly verificationStatus: string;
    readonly verificationRejectionReason?: string;
  };
  readonly identity: Identity | null;
  readonly context: Context | null;
  readonly notifications: {
    readonly unread: number;
    readonly highPriority: number;
    readonly urgentPriority: number;
  };
  readonly reputation?: {
    readonly score: number;
    readonly level: number;
    readonly rank?: string;
  };
  readonly onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Conteudo
  readonly children: ReactNode;

  // Meta
  readonly pageTitle?: string;
  readonly pageDescription?: string;
}

export function ContaHubLayout({
  activeSection,
  onSectionChange,
  sectionItems,
  personalProfile,
  profile,
  allProfiles,
  isVerified,
  canOpenPublicProfile,
  handle,
  territoryLabel,
  userEmail,
  accountSnapshot,
  identity,
  context,
  notifications,
  reputation,
  onAvatarChange,
  children,
  pageTitle = "Minha conta | Área organizada",
  pageDescription = "Área privada da conta com navegação por seções, resumo enxuto e conteúdo segmentado por contexto.",
}: ContaHubLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      {/* Layout: sidebar fixa (desktop) + conteúdo rolável */}
      <div className="relative flex h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_12%_0%,hsl(var(--primary)/0.14),transparent_30%),radial-gradient(circle_at_90%_10%,hsl(var(--accent)/0.24),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.36))]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        {/* Sidebar desktop - área pessoal do usuário */}
        <aside className="hidden lg:flex lg:w-[264px] lg:shrink-0 lg:flex-col lg:border-r lg:border-border/70 lg:bg-card/88 lg:shadow-[12px_0_40px_rgba(15,23,42,0.04)] lg:backdrop-blur-xl xl:w-[292px]">
          <ProfileSectionsNav
            items={sectionItems}
            activeId={activeSection}
            onChange={onSectionChange}
            variant="sidebar"
            profile={personalProfile}
            isVerified={isVerified}
            handle={handle}
            canOpenPublicProfile={canOpenPublicProfile}
          />
        </aside>

        {/* Area de conteudo scrollavel */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl space-y-5 px-3 pb-20 pt-3 sm:px-5 sm:pb-12 sm:pt-5 md:space-y-6 lg:px-7 lg:pt-7">
              {/* Header compacto e responsivo - sempre perfil pessoal */}
              <ProfileHeaderCompact
                activeProfile={personalProfile}
                profile={profile}
                allProfiles={allProfiles as any}
                userEmail={userEmail}
                accountSnapshot={accountSnapshot as any}
                identity={identity}
                context={context}
                notifications={notifications}
                isVerified={isVerified}
                canOpenPublicProfile={canOpenPublicProfile}
                handle={handle}
                territoryLabel={territoryLabel}
                reputation={reputation}
                onAvatarChange={onAvatarChange}
              />

              {/* Tabs roláveis mobile */}
              <div className="lg:hidden">
                <ProfileSectionsNav
                  items={sectionItems}
                  activeId={activeSection}
                  onChange={onSectionChange}
                  variant="tabs"
                />
              </div>

              {/* Conteúdo das seções */}
              <div className="space-y-5 sm:space-y-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
