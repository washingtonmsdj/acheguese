/**
 * PreferenciasSection - Secao de preferencias da conta
 *
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Logica clara e organizada
 */

import { Settings2, Shield, Users } from "lucide-react";

import { SectionFrame, HubLinkCard } from "@/modules/profile/components/hub";

import type { PreferenciasSectionProps } from "./types";

export function PreferenciasSection({
  canManageProfileMembers,
  navigate,
  appUrls,
}: PreferenciasSectionProps) {
  return (
    <div className="space-y-6">
      <SectionFrame
        title="Preferencias"
        description="Preferencias pessoais da conta. Rotinas operacionais continuam na Central."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <HubLinkCard
            icon={Shield}
            title="Privacidade do perfil"
            description="Controle visibilidade, mensagens e dados publicos."
            onClick={() => navigate(appUrls.profile.settings("privacy"))}
          />
          <HubLinkCard
            icon={Users}
            title="Vinculos e conexoes"
            description="Gerencie vinculos da identidade ativa."
            onClick={() => navigate(appUrls.profile.settings("links"))}
          />
          {canManageProfileMembers ? (
            <HubLinkCard
              icon={Users}
              title="Membros do perfil"
              description="Convites e permissoes do perfil empresarial/profissional."
              onClick={() => navigate(appUrls.profile.settings("members"))}
            />
          ) : null}
          <HubLinkCard
            icon={Settings2}
            title="Meus enderecos"
            description="Endereco operacional privado da conta."
            onClick={() => navigate("/conta/enderecos")}
          />
          <HubLinkCard
            icon={Settings2}
            title="Central profissional"
            description="Empresas, mobilidade, verticais e dashboards operacionais."
            onClick={() => navigate("/conta/profissional")}
          />
        </div>
      </SectionFrame>
    </div>
  );
}
