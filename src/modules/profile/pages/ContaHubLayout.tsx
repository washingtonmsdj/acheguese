import { Helmet } from "react-helmet-async";
import type { ChangeEvent, ReactNode } from "react";

import { ProfileHeaderCompact } from "@/modules/profile/components/hub";
import type {
  MultiProfileRecord,
  Profile as RuntimeProfile,
} from "@/core/profiles/services/multi-profile/types";
import type { ProfileRow } from "@/core/profiles/services/types";
import type {
  AccountSnapshot,
  Context,
  Identity,
} from "@/modules/profile/sections/types";

export interface ContaHubLayoutProps {
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
  readonly onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly children: ReactNode;
  readonly pageTitle?: string;
  readonly pageDescription?: string;
}

export function ContaHubLayout({
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
  pageTitle = "Minha conta | Achegue-se",
  pageDescription = "Identidade, território, preferências e segurança da sua conta.",
}: ContaHubLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
        <main className="mx-auto w-full max-w-[1180px] px-3 pb-24 pt-4 sm:px-6 sm:pt-6 md:pb-10 lg:px-8 lg:pt-8">
          <div className="mb-4 sm:mb-6">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-territory-brand">
              Área pessoal
            </p>
            <h1 className="mt-1 font-heading text-2xl font-semibold text-territory-ink sm:text-3xl">
              Conta
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-territory-muted">
              Sua identidade, seu território e seus controles pessoais dentro do
              Achegue-se.
            </p>
          </div>

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

          <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">{children}</div>
        </main>
      </div>
    </>
  );
}
