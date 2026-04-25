import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";

export default function BusinessDetailsPage() {
  const { business } = useBusinessDashboardContext();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" value={business.name} />
          <Field label="Categoria" value={business.category} />
          <Field label="Status" value={business.status} />
          <Field label="Plano premium" value={business.is_premium ? "Sim" : "Nao"} />
          <Field label="Telefone" value={business.phone || "Nao informado"} />
          <Field label="WhatsApp" value={business.whatsapp || "Nao informado"} />
          <Field label="Email" value={business.email || "Nao informado"} />
          <Field label="Site" value={business.website || "Nao informado"} />
          <Field label="Cidade" value={business.business_city || "Nao informado"} />
          <Field label="Estado" value={business.business_state || "Nao informado"} />
          <Field label="Endereco" value={business.business_address || "Nao informado"} />
          <Field label="Slug" value={business.slug || "Nao configurado"} />
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
