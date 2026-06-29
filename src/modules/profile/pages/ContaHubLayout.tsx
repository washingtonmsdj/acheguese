/**
 * ContaHubLayout - Layout principal do hub de conta
 *
 * SSOT: layout reutilizavel com props tipadas.
 */

import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";

import { ProfileHeaderCompact, ProfileSectionsNav } from "@/modules/profile/components/hub";
import type { MultiProfileRecord, Profile as RuntimeProfile } from "@/core/profiles/services/multi-profile/types";
import type { ProfileRow } from "@/core/profiles/services/types";
import type { AccountSnapshot, Context, Identity } from "@/modules/profile/sections/types";
import type { ProfileSectionId } from "@/modules/profile/sections/types";
import type { SectionNavItem } from "@/modules/profile/components/hub/ProfileSectionsNav";

export interface ContaHubLayoutProps {
  readonly activeSection: ProfileSectionId;
  readonly onSectionChange: (section: ProfileSectionId) => void;
  readonly sectionItems: readonly SectionNavItem<ProfileSectionId>[];
  readonly personalProfile: MultiProfileRecord | RuntimeProfile | null;
  readonly profile: MultiProfileRecord | RuntimeProfile | ProfileRow | null;
  readonly allProfiles?: readonly (MultiProfileRecord | RuntimeProfile)[];
  readonly isVerified: boolean;
  readonly canOpenPublicProfile: boolean;
  readonly handle: string;
  readonly territoryLabel?: string;
  readonly userEmail: string;
  readonly accountSnapshot: AccountSnapshot;
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
  readonly children: ReactNode;
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
  pageTitle = "Minha conta | Area organizada",
  pageDescription = "Area privada da conta com navegacao por secoes e conteudo segmentado por contexto.",
}: ContaHubLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <div className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_0%,hsl(var(--primary)/0.14),transparent_30%),radial-gradient(circle_at_90%_10%,hsl(var(--accent)/0.24),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.36))]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

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

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:px-5 sm:pb-14 sm:pt-5 md:space-y-6 lg:px-7 lg:pt-7">
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

              <div className="lg:hidden">
                <ProfileSectionsNav
                  items={sectionItems}
                  activeId={activeSection}
                  onChange={onSectionChange}
                  variant="tabs"
                />
              </div>

              <div className="space-y-4 sm:space-y-6">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
