/**
 * ConfiguracoesSection - Seção de configurações do perfil
 * 
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Lógica clara e organizada
 */

import { Settings2, Shield, Users } from "lucide-react";

import { SectionFrame, HubLinkCard } from "@/modules/profile/components/hub";

import type { ConfiguracoesSectionProps } from "./types";

export function ConfiguracoesSection({
  canManageProfileMembers,
  navigate,
  appUrls,
}: ConfiguracoesSectionProps) {
  return (
    <div className="space-y-6">
      <SectionFrame
        title="Configuracoes"
        description="Ajustes de perfil e operacao agrupados em uma area dedicada."
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
            title="Configuracoes operacionais"
            description="Residencia, area de atuacao e preferencias gerais."
            onClick={() => navigate(appUrls.settings)}
          />
        </div>
      </SectionFrame>
    </div>
  );
}
