/**
 * PerfilHubLayout - Layout principal do hub de perfil
 * 
 * SSOT: Layout reutilizável com props tipadas
 * Sem gambiarras: Separação clara de responsabilidades
 * 
 * Responsabilidades:
 * - Renderizar sidebar (desktop) / tabs (mobile)
 * - Renderizar header compacto
 * - Renderizar área de conteúdo scrollável
 * - Gerenciar navegação entre sections
 */

import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";

import { ProfileHeaderCompact, ProfileSectionsNav } from "@/modules/profile/components/hub";
import type { MultiProfileRecord } from "@/core/profiles/services/multi-profile/types";
import type { ProfileSectionId } from "@/modules/profile/sections/types";
import type { SectionNavItem } from "@/modules/profile/components/hub/ProfileSectionsNav";

export interface PerfilHubLayoutProps {
  // Navegação
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
  readonly identity: any;
  readonly context: any;
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
  
  // Conteúdo
  readonly children: ReactNode;
  
  // Meta
  readonly pageTitle?: string;
  readonly pageDescription?: string;
}

export function PerfilHubLayout({
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
  pageTitle = "Perfil | Area organizada",
  pageDescription = "Area de perfil com navegacao por secoes, resumo enxuto e conteudo segmentado por contexto.",
}: PerfilHubLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      {/* Layout: sidebar fixa (desktop) + conteúdo scrollável */}
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Sidebar desktop - vai até o topo, conectando com a topbar */}
        <aside className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card xl:w-[260px]">
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

        {/* Área de conteúdo scrollável */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl space-y-3 px-3 pb-20 pt-3 sm:space-y-4 sm:px-4 sm:pb-12 sm:pt-4 md:pt-6">
              {/* Header compacto e responsivo - Sempre perfil PERSONAL */}
              <ProfileHeaderCompact
                activeProfile={personalProfile}
                profile={profile}
                allProfiles={allProfiles}
                userEmail={userEmail}
                accountSnapshot={accountSnapshot}
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
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
