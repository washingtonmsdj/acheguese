import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Building2, Mail, MapPin, Phone, Pencil, Globe2 } from "lucide-react";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { Button } from "@/shared/components/ui/button";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";
import { getBusinessStatusPresentation } from "../presentation/businessStatusPresentation";

export default function BusinessDetailsPage() {
  const { businessId, business, publicUrl } = useActiveBusinessDashboardContext();

  return (
    <div className="space-y-5">
      <section className="business-management-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="business-management-title">
              Dados da empresa
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              Confira as informações usadas na gestão e na apresentação pública da sua empresa.
            </p>
          </div>

          <Button asChild className="w-full gap-2 sm:w-auto">
            <Link to={businessManagementRoutes.edit(businessId)}>
              <Pencil className="h-4 w-4" />
              Editar dados
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <SectionCard
          title="Identidade"
          icon={Building2}
          description="Como a empresa aparece para quem encontra seu perfil."
        >
          <Field label="Nome" value={business.name} />
          <Field label="Categoria" value={getBusinessCategoryLabel(business.category)} />
          <Field label="Situação" value={getBusinessStatusPresentation(business.status).label} />
          <Field label="Identificador" value={businessId} />
          <Field
            label="Endereço da página"
            value={business.slug ? `@${business.slug}` : "Ainda não configurado"}
          />
          <Field label="Página pública" value={publicUrl || "Ainda não disponível"} />
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
        <Field label="Cidade" value={business.business_city || "Não informado"} />
        <Field label="Estado" value={business.business_state || "Não informado"} />
        <Field label="Endereço" value={business.business_address || "Não informado"} />
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
    <section className="business-management-panel">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-territory-brand/10 text-territory-brand">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <dl className="business-management-fields">{children}</dl>
    </section>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
}) {
  return (
    <div className="business-management-field">
      <dt>
        {label}
      </dt>
      <dd>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        <span>
          {value}
        </span>
      </dd>
    </div>
  );
}
