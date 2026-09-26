import { ArrowRight, Building2, Image, MapPin, Settings } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

interface SettingsTabProps {
  onEditBusiness?: () => void;
}

export function SettingsTab({ onEditBusiness }: SettingsTabProps) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-border bg-card">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Configurações da empresa</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Mantenha o perfil completo para que moradores encontrem informações corretas e atualizadas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-3">
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
        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            As alterações são feitas em um único fluxo para evitar informações divergentes.
          </p>
          <Button onClick={onEditBusiness} className="w-full gap-2 sm:w-auto">
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
    <div className="bg-card p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
