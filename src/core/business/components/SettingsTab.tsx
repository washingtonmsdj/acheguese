import { ArrowRight, Building2, Image, MapPin, Settings } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

interface SettingsTabProps {
  onEditBusiness?: () => void;
  headingLevel?: "h1" | "h2";
}

export function SettingsTab({ onEditBusiness, headingLevel: Heading = "h2" }: SettingsTabProps) {
  return (
    <section className="overflow-hidden rounded-[var(--business-panel-radius,16px)] border border-territory-border bg-territory-surface">
      <div className="border-b border-territory-border bg-gradient-to-br from-territory-brand/10 via-territory-surface to-territory-surface px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-territory-brand/10 text-territory-brand">
            <Settings className="h-5 w-5" />
          </span>
          <div>
            <Heading className="text-lg font-semibold text-territory-ink">Configurações da empresa</Heading>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-territory-muted">
              Mantenha o perfil completo para que moradores encontrem informações corretas e atualizadas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-territory-border md:grid-cols-3">
        <InfoItem
          icon={Building2}
          title="Perfil público"
          description="Nome, categoria, descrição e identidade da empresa."
        />
        <InfoItem
          icon={MapPin}
          title="Localização e contato"
          description="Endereço, telefone, WhatsApp e canais de atendimento."
        />
        <InfoItem
          icon={Image}
          title="Imagens e apresentação"
          description="Logo, capa e conteúdo visual exibido no perfil."
        />
      </div>

      {onEditBusiness ? (
        <div className="flex flex-col gap-3 border-t border-territory-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-territory-muted">
            As alterações são feitas em um único fluxo para evitar informações divergentes.
          </p>
          <Button
            onClick={onEditBusiness}
            className="w-full gap-2 bg-territory-sun text-territory-ink hover:bg-territory-sun/90 sm:w-auto"
          >
            Editar dados da empresa
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function InfoItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 bg-territory-surface p-4 sm:p-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-territory-ink">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-territory-muted">{description}</p>
      </div>
    </div>
  );
}
