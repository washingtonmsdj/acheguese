import { Helmet } from "react-helmet-async";
import type { ChangeEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  KeyRound,
  LockKeyhole,
  LogOut,
  Shield,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { ProfileHeaderCompact } from "@/modules/profile/components/hub";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
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
import { SUPPORT_PATH } from "@/shared/constants/legal";

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

function OverviewRow({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[66px] w-full items-center gap-3 border-b border-territory-border px-1 py-3 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-territory-ink">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-4 text-territory-muted">{description}</span>
        ) : null}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  );
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
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch {
      toast.error("Não foi possível sair da conta agora.");
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <AccountSettingsShell
        title="Minha conta"
        description="Estas configurações valem para toda a sua conta."
        eyebrow="Conta"
        showBack={false}
      >
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

        <section className="mt-4 rounded-2xl border border-territory-border bg-territory-surface px-4 sm:px-5">
          <OverviewRow
            icon={<KeyRound className="h-5 w-5" aria-hidden="true" />}
            title="Dados de acesso"
            description="E-mail, nome de usuário e métodos de entrada."
            onClick={() => navigate("/conta/seguranca#acesso")}
          />
          <OverviewRow
            icon={<LockKeyhole className="h-5 w-5" aria-hidden="true" />}
            title="Senha e segurança"
            description="Senha, recuperação e autenticação em duas etapas."
            onClick={() => navigate("/conta/seguranca")}
          />
          <OverviewRow
            icon={<Bell className="h-5 w-5" aria-hidden="true" />}
            title="Notificações"
            description="Canais, tipos de aviso e horário de silêncio."
            onClick={() => navigate("/conta/notificacoes")}
          />
          <OverviewRow
            icon={<Shield className="h-5 w-5" aria-hidden="true" />}
            title="Privacidade e dados"
            description="Consentimentos, exportação e exclusão."
            onClick={() => navigate("/conta/privacidade")}
          />
          <OverviewRow
            icon={<SlidersHorizontal className="h-5 w-5" aria-hidden="true" />}
            title="Preferências do aplicativo"
            description="Ajustes pessoais e vínculos da identidade."
            onClick={() => navigate("/conta/preferencias")}
          />
        </section>

        <section className="mt-4 rounded-2xl border border-territory-border bg-territory-surface px-4 sm:px-5">
          <OverviewRow
            icon={<UsersRound className="h-5 w-5" aria-hidden="true" />}
            title="Meus perfis"
            description="Identidades, equipes e visibilidade pública."
            onClick={() => document.getElementById("account-details")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
        </section>

        <section className="mt-4 rounded-2xl border border-territory-border bg-territory-surface px-4 sm:px-5">
          <OverviewRow
            icon={<CircleHelp className="h-5 w-5" aria-hidden="true" />}
            title="Ajuda"
            onClick={() => navigate(SUPPORT_PATH)}
          />
        </section>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-red-200 bg-territory-surface px-4 text-left text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sair da conta
        </button>

        <div id="account-details" className="mt-8 border-t border-territory-border pt-6">
          <div className="mb-4">
            <h2 className="font-heading text-lg font-bold text-territory-ink">Perfis e recursos da conta</h2>
            <p className="mt-1 text-sm text-territory-muted">
              Recursos já existentes continuam disponíveis abaixo do conjunto principal do concept.
            </p>
          </div>
          <div className="space-y-4 sm:space-y-6">{children}</div>
        </div>
      </AccountSettingsShell>
    </>
  );
}
