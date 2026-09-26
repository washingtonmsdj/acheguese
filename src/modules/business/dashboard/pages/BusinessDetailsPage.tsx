import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";

export default function BusinessDetailsPage() {
  const { businessId, business } = useActiveBusinessDashboardContext();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Dados da empresa</CardTitle>
          <Link to={businessManagementRoutes.edit(businessId)}>
            <Button size="sm">Editar dados</Button>
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" value={business.name} />
          <Field label="Categoria" value={business.category} />
          <Field label="Status" value={business.status} />
          <Field label="Telefone" value={business.phone || "Não informado"} />
          <Field label="WhatsApp" value={business.whatsapp || "Não informado"} />
          <Field label="E-mail" value={business.email || "Não informado"} />
          <Field label="Site" value={business.website || "Não informado"} />
          <Field label="Cidade" value={business.business_city || "Não informado"} />
          <Field label="Estado" value={business.business_state || "Não informado"} />
          <Field label="Endereço" value={business.business_address || "Não informado"} />
          <Field label="Endereço da página" value={business.slug || "Não configurado"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-md border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
