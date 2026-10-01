import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  ExternalLink,
  Settings,
  Users,
  Pencil,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { ProfileMembersManager } from "@/core/profiles/components/ProfileMembersManager";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { Button } from "@/shared/components/ui/button";
import { getBusinessStatusPresentation } from "../presentation/businessStatusPresentation";
import { BusinessSettingsRiskAction } from "../components/BusinessSettingsRiskAction";

export default function BusinessSettingsPage() {
  const {
    businessId,
    business,
    publicUrl: resolvedPublicUrl,
  } = useActiveBusinessDashboardContext();
  const publicUrl = business.status === "active" ? resolvedPublicUrl : null;
  const status = getBusinessStatusPresentation(business.status);
  const StatusIcon = status.icon;
  const [copying, setCopying] = useState(false);

  async function copyPublicLink() {
    if (!publicUrl || copying) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(
        new URL(publicUrl, window.location.origin).href,
      );
      toast.success("Link público copiado.");
    } catch {
      toast.error(
        "Não foi possível copiar. Selecione o link para copiá-lo manualmente.",
      );
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      <section className="business-management-panel">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
            <Settings className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="business-management-title">
              Configurações da empresa
            </h1>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Confira a página pública e gerencie o acesso da sua equipe.
            </p>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
        <section
          className="business-management-panel"
          aria-labelledby="business-public-settings"
        >
          <h2 id="business-public-settings" className="font-semibold">
            Página pública
          </h2>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${status.badgeClassName}`}
          >
            <StatusIcon className="h-4 w-4" aria-hidden="true" />
            {status.label}
          </span>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {publicUrl
              ? "Compartilhe a página da empresa com moradores e clientes."
              : status.unavailablePublicMessage}
          </p>
          {publicUrl ? (
            <div className="mt-4 grid min-w-0 gap-3">
              <a
                href={publicUrl}
                className="break-all text-sm text-territory-brand underline underline-offset-4"
              >
                {publicUrl}
              </a>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 gap-2"
                  disabled={copying}
                  onClick={() => void copyPublicLink()}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copiar link
                </Button>
                <Button asChild variant="outline" className="min-h-11 gap-2">
                  <Link to={publicUrl}>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Ver página pública
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </section>
        <section
          className="business-management-panel"
          aria-labelledby="business-settings-shortcuts"
        >
          <h2 id="business-settings-shortcuts" className="font-semibold">
            Informações e contato
          </h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Nome, categoria e canais de contato são atualizados em Editar
            empresa. O endereço tem sua própria seção.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="min-h-11 gap-2">
              <Link to={businessManagementRoutes.edit(businessId)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar dados
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 gap-2">
              <Link to={businessManagementRoutes.location(businessId)}>
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Editar localização
              </Link>
            </Button>
          </div>
        </section>
      </div>

      {business.profile_id ? (
        <section
          className="business-management-panel"
          aria-label="Equipe e acessos"
        >
          <div className="mb-4 flex items-start gap-3">
            <Users
              className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            <p className="text-sm leading-5 text-muted-foreground">
              O proprietário controla quem pode administrar este perfil. As
              alterações de acesso são aplicadas a cada ação.
            </p>
          </div>
          <ProfileMembersManager
            profileId={business.profile_id}
            profileType="business"
          />
        </section>
      ) : null}
      <BusinessSettingsRiskAction />
    </div>
  );
}
