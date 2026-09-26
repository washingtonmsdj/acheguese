import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, Mail, MapPin, Phone, Pencil, Store, Globe2 } from "lucide-react";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { Button } from "@/shared/components/ui/button";

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Ativa";
    case "pending":
      return "Em análise";
    case "suspended":
      return "Suspensa";
    case "inactive":
      return "Inativa";
    default:
      return status;
  }
}

export default function BusinessDetailsPage() {
  const { businessId, business } = useActiveBusinessDashboardContext();

  return (
    <div className="space-y-5">
      <section className="rounded-[26px] border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Store className="h-3.5 w-3.5" />
              Perfil da empresa
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Dados da empresa
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Confira as informações usadas na gestão e na apresentação pública da sua empresa.
            </p>
          </div>

          <Link to={businessManagementRoutes.edit(businessId)}>
            <Button className="w-full gap-2 sm:w-auto">
              <Pencil className="h-4 w-4" />
              Editar dados
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Identidade"
          icon={Building2}
          description="Como a empresa aparece para quem encontra seu perfil."
        >
          <Field label="Nome" value={business.name} />
          <Field label="Categoria" value={business.category} capitalize />
          <Field label="Situação" value={getStatusLabel(business.status)} />
          <Field
            label="Endereço da página"
            value={business.slug ? `@${business.slug}` : "Ainda não configurado"}
          />
        </SectionCard>

        <SectionCard
          title="Contato"
          icon={Phone}
          description="Canais disponíveis para moradores e clientes."
        >
          <Field label="Telefone" value={business.phone || "Não informado"} />
          <Field label="WhatsApp" value={business.whatsapp || "Não informado"} />
          <Field label="E-mail" value={business.email || "Não informado"} icon={Mail} />
          <Field label="Site" value={business.website || "Não informado"} icon={Globe2} />
        </SectionCard>
      </div>

      <SectionCard
        title="Localização"
        icon={MapPin}
        description="Endereço usado para exibição territorial, mapa e proximidade."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Cidade" value={business.business_city || "Não informado"} />
          <Field label="Estado" value={business.business_state || "Não informado"} />
          <div className="md:col-span-2">
            <Field label="Endereço" value={business.business_address || "Não informado"} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Building2;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  capitalize = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  icon?: typeof Mail;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 flex min-w-0 items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        <p className={`min-w-0 break-words text-sm font-medium text-foreground ${capitalize ? "capitalize" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
