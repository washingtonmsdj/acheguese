import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Megaphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  AdCampaignRequestService,
  type AdCampaignTerritoryType,
  type BusinessAdCampaignSummary,
} from "@/core/business/promotions/services/AdCampaignRequestService";
import type { AdPlacementKey } from "@/core/business/promotions";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";

interface AdsFormState {
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  placementKey: AdPlacementKey;
  startsAt: string;
  endsAt: string;
  budgetTotal: string;
}

const REVIEW_LABELS: Record<BusinessAdCampaignSummary["review_status"], string> = {
  draft: "Rascunho",
  pending: "Em revisao",
  approved: "Aprovado",
  rejected: "Rejeitado",
  archived: "Arquivado",
};

const BILLING_LABELS: Record<BusinessAdCampaignSummary["billing_status"], string> = {
  unpaid: "Aguardando pagamento",
  authorized: "Autorizado",
  paid: "Pago",
  refunded: "Reembolsado",
  failed: "Falhou",
};

const PLACEMENT_LABELS: Record<AdPlacementKey, string> = {
  sidebar_widget: "Anuncios locais da Home",
  feed_sponsored: "Feed patrocinado",
  banner_top: "Banner superior",
  banner_bottom: "Banner inferior",
};

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function inferTerritoryType(geographicPath: string | null | undefined): AdCampaignTerritoryType {
  const parts = geographicPath?.split("/").filter(Boolean) ?? [];
  if (parts.length >= 5) return "neighborhood";
  if (parts.length >= 4) return "district";
  return "city";
}

function trimForInput(value: string | null | undefined, maxLength: number): string {
  return (value ?? "").trim().slice(0, maxLength);
}

function safeDefaultImageUrl(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && /^https?:\/\//.test(trimmed) ? trimmed : "";
}

function buildInitialForm(
  businessName: string,
  businessDescription: string | null | undefined,
  publicUrl: string | null,
  imageUrl: string | null | undefined,
): AdsFormState {
  return {
    title: trimForInput(`Conheca ${businessName}`, 90),
    description: trimForInput(businessDescription, 220),
    ctaLabel: "Ver empresa",
    ctaUrl: publicUrl ?? "",
    imageUrl: safeDefaultImageUrl(imageUrl),
    placementKey: "sidebar_widget",
    startsAt: todayInputValue(),
    endsAt: "",
    budgetTotal: "",
  };
}

function formatDate(value: string | null): string {
  if (!value) return "Sem data final";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function parseBudget(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error("Orcamento invalido.");
  }
  return parsed;
}

export default function BusinessAdsPage() {
  const { businessId, business, publicUrl } = useBusinessDashboardContext();
  const queryClient = useQueryClient();
  const ownerBusinessId = business.business_data_id ?? business.id;
  const territoryType = useMemo(
    () => inferTerritoryType(business.geographic_path),
    [business.geographic_path],
  );
  const initialForm = useMemo(
    () =>
      buildInitialForm(
        business.name,
        business.description,
        publicUrl,
        business.banner_url ?? business.logo_url,
      ),
    [business.name, business.description, publicUrl, business.banner_url, business.logo_url],
  );
  const [form, setForm] = useState<AdsFormState>(initialForm);
  const canRequestCampaign = Boolean(business.location_id);

  const campaignsQuery = useQuery({
    queryKey: ["business-ad-campaigns", ownerBusinessId],
    queryFn: () => AdCampaignRequestService.listBusinessCampaigns(ownerBusinessId),
    enabled: Boolean(ownerBusinessId),
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      AdCampaignRequestService.requestBusinessCampaign({
        ownerBusinessId,
        advertiserName: business.name,
        advertiserContact: business.email ?? business.whatsapp ?? business.phone ?? null,
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl || null,
        ctaLabel: form.ctaLabel || null,
        ctaUrl: form.ctaUrl || null,
        placementKey: form.placementKey,
        startsAt: form.startsAt,
        endsAt: form.endsAt || null,
        budgetTotal: parseBudget(form.budgetTotal),
        territoryRefId: business.location_id ?? "",
        territoryType,
        targets: business.location_id
          ? [{ locationId: business.location_id, targetScope: territoryType }]
          : [],
      }),
    onSuccess: async () => {
      toast.success("Anuncio enviado para revisao.");
      setForm(initialForm);
      await queryClient.invalidateQueries({
        queryKey: ["business-ad-campaigns", ownerBusinessId],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel solicitar anuncio.");
    },
  });

  function updateForm<K extends keyof AdsFormState>(key: K, value: AdsFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRequestCampaign) {
      toast.error("Defina o territorio principal da empresa antes de anunciar.");
      return;
    }
    requestMutation.mutate();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle>Anuncios da empresa</CardTitle>
          </div>
          <CardDescription>
            Solicite destaque em superficies patrocinadas. A campanha entra em revisao antes de
            aparecer publicamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Publicacao somente apos aprovacao</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>Janela de exibicao controlada</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <Megaphone className="h-4 w-4 text-primary" />
            <span>Target por territorio canonico</span>
          </div>
        </CardContent>
      </Card>

      {!canRequestCampaign && (
        <Card className="border-amber-300">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <span>Esta empresa precisa de um territorio principal para solicitar anuncio.</span>
            <Link to={businessManagementRoutes.dados(businessId)}>
              <Button variant="outline" size="sm">
                Editar dados
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Solicitar campanha</CardTitle>
            <CardDescription>
              O pedido fica pendente ate revisao, pagamento e ativacao operacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ad-title">Titulo</Label>
              <Input
                id="ad-title"
                value={form.title}
                maxLength={90}
                onChange={(event) => updateForm("title", event.target.value)}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ad-description">Descricao</Label>
              <Textarea
                id="ad-description"
                value={form.description}
                maxLength={220}
                rows={4}
                onChange={(event) => updateForm("description", event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-placement">Posicao</Label>
              <select
                id="ad-placement"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.placementKey}
                onChange={(event) =>
                  updateForm("placementKey", event.target.value as AdPlacementKey)
                }
              >
                {Object.entries(PLACEMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-budget">Orcamento planejado</Label>
              <Input
                id="ad-budget"
                inputMode="decimal"
                value={form.budgetTotal}
                onChange={(event) => updateForm("budgetTotal", event.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-start">Inicio</Label>
              <Input
                id="ad-start"
                type="date"
                value={form.startsAt}
                onChange={(event) => updateForm("startsAt", event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-end">Fim</Label>
              <Input
                id="ad-end"
                type="date"
                value={form.endsAt}
                onChange={(event) => updateForm("endsAt", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-cta-label">Texto do CTA</Label>
              <Input
                id="ad-cta-label"
                value={form.ctaLabel}
                maxLength={36}
                onChange={(event) => updateForm("ctaLabel", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-cta-url">URL do CTA</Label>
              <Input
                id="ad-cta-url"
                value={form.ctaUrl}
                onChange={(event) => updateForm("ctaUrl", event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ad-image">Imagem</Label>
              <Input
                id="ad-image"
                value={form.imageUrl}
                onChange={(event) => updateForm("imageUrl", event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revisao</CardTitle>
              <CardDescription>{PLACEMENT_LABELS[form.placementKey]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-3">
                <p className="text-sm font-semibold">{form.title || "Titulo do anuncio"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.description || "Descricao do anuncio"}
                </p>
                {form.ctaLabel && (
                  <Badge variant="secondary" className="mt-3">
                    {form.ctaLabel}
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Empresa: {business.name}</p>
                <p>
                  Territorio:{" "}
                  {business.location?.full_name ?? business.geographic_path ?? "Nao definido"}
                </p>
                <p>Status inicial: pendente de revisao</p>
              </div>
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={!canRequestCampaign || requestMutation.isPending}
              >
                <Megaphone className="h-4 w-4" />
                {requestMutation.isPending ? "Enviando..." : "Solicitar anuncio"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Campanhas solicitadas</CardTitle>
          <CardDescription>Historico de campanhas vinculadas a esta empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaignsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando campanhas...</p>
          )}
          {campaignsQuery.error && (
            <p className="text-sm text-destructive">
              {campaignsQuery.error instanceof Error
                ? campaignsQuery.error.message
                : "Nao foi possivel carregar campanhas."}
            </p>
          )}
          {!campaignsQuery.isLoading && !campaignsQuery.data?.length && (
            <p className="text-sm text-muted-foreground">Nenhuma campanha solicitada.</p>
          )}
          {campaignsQuery.data?.map((campaign) => (
            <div
              key={campaign.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{campaign.title}</p>
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
                <p className="text-xs text-muted-foreground">
                  {PLACEMENT_LABELS[campaign.placement_key]} - inicio{" "}
                  {formatDate(campaign.starts_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{REVIEW_LABELS[campaign.review_status]}</Badge>
                <Badge variant="secondary">{BILLING_LABELS[campaign.billing_status]}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
