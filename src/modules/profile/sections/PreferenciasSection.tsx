/**
 * PreferenciasSection - Seção de preferências da conta
 *
 * SSOT: componente isolado com props tipadas
 * Sem gambiarras: lógica clara e organizada
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
        title="Preferências"
        description="Preferências pessoais da conta. Rotinas operacionais continuam na Central."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <HubLinkCard
            icon={Shield}
            title="Privacidade do perfil"
            description="Controle visibilidade e dados públicos."
            onClick={() => navigate(appUrls.profile.settings("privacy"))}
          />
          <HubLinkCard
            icon={Users}
            title="Vínculos e conexões"
            description="Gerencie vínculos da identidade ativa."
            onClick={() => navigate(appUrls.profile.settings("links"))}
          />
          {canManageProfileMembers ? (
            <HubLinkCard
              icon={Users}
              title="Membros do perfil"
              description="Convites e permissões do perfil empresarial ou profissional."
              onClick={() => navigate(appUrls.profile.settings("members"))}
            />
          ) : null}
          <HubLinkCard
            icon={Settings2}
            title="Meus endereços"
            description="Endereço operacional privado da conta."
            onClick={() => navigate(appUrls.profile.addresses)}
          />
          <HubLinkCard
            icon={Settings2}
            title="Central profissional"
            description="Empresas, verticais e dashboards operacionais."
            onClick={() => navigate("/conta/profissional")}
          />
        </div>
      </SectionFrame>
    </div>
  );
}
