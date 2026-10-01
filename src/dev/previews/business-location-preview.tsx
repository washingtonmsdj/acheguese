import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Images,
  MapPin,
  Pencil,
  Settings,
  Store,
} from "lucide-react";
import { BusinessLocationView } from "@/modules/business/dashboard/pages/BusinessLocationPage";
import { PublicBrandHeader } from "@/app/components/navigation/PublicBrandHeader";
import { ActiveProfileIdentity } from "@/shared/components/ActiveProfileIdentity";
import "@/index.css";
import { BusinessDashboardNavigation } from "@/modules/business/dashboard/components/BusinessDashboardNavigation";

type Address = Parameters<typeof BusinessLocationView>[0]["address"];
const previewSections = [
  { label: "Visão geral", mobileLabel: "Visão", icon: Store },
  { label: "Editar empresa", mobileLabel: "Editar", icon: Pencil },
  { label: "Fotos", mobileLabel: "Fotos", icon: Images },
  { label: "Horário de funcionamento", mobileLabel: "Horário", icon: Clock },
  { label: "Localização", mobileLabel: "Local", icon: MapPin },
  { label: "Desempenho", mobileLabel: "Métricas", icon: BarChart3 },
  { label: "Configurações", mobileLabel: "Ajustes", icon: Settings },
];
export function Preview() {
  const [saved, setSaved] = useState<Address>({
    street: "Rua Direta do Nordeste de Amaralina",
    number: "100",
    complement: "Ao lado da quadra",
    postal_code: "41900-000",
    city: "Salvador",
    state: "BA",
    neighborhood: "Nordeste de Amaralina",
  });
  const [draft, setDraft] = useState<Address | null>(null);
  const [message, setMessage] = useState("");
  const address = draft ?? saved;
  return (
    <div className="light pt-page min-h-screen bg-background text-foreground">
      <PublicBrandHeader
        accountHref="/conta"
        contextLabel={[saved.city, saved.state].filter(Boolean).join(", ")}
        urls={{
          nearby: "/",
          business: "/central/empresas",
          map: "/",
          search: "/busca",
        }}
      />
      <div className="mx-auto max-w-[1440px] space-y-3 px-4 py-4 sm:px-6 xl:px-8">
        <ActiveProfileIdentity profile={{ id: "preview-business", displayName: "Perfil da empresa (demonstração)" }} />
        <nav
          aria-label="Caminho da central"
          className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-muted-foreground sm:text-sm"
        >
          <a
            href="/editar-empresa-preview.html"
            aria-label="Voltar à empresa"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted sm:hidden"
          >
            <ArrowLeft size={16} />
          </a>
          <span className="hidden sm:inline">Central</span>
          <span className="hidden sm:inline">›</span>
          <span className="hidden sm:inline">Minhas empresas</span>
          <span className="hidden sm:inline">›</span>
          <span className="truncate">Escola Municipal Artur de Sales</span>
          <span>›</span>
          <span className="shrink-0 font-medium text-foreground">
            Localização
          </span>
        </nav>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <BusinessDashboardNavigation count={previewSections.length}>
            {previewSections.map(({ label, mobileLabel, icon: Icon }) =>
              label === "Horário de funcionamento" ? (
                <a
                  key={label}
                  href="/horarios-empresa-preview.html"
                  aria-label={label}
                  className="business-dashboard-nav__item text-muted-foreground"
                >
                  <Icon size={18} />
                  <span className="lg:hidden">{mobileLabel}</span>
                  <span className="hidden lg:inline">{label}</span>
                </a>
              ) : (
                <button
                  key={label}
                  type="button"
                  disabled={label !== "Localização"}
                  aria-label={label}
                  aria-current={label === "Localização" ? "page" : undefined}
                  className={`business-dashboard-nav__item ${label === "Localização" ? "bg-primary/10 text-primary ring-1 ring-primary/10" : "text-muted-foreground"}`}
                >
                  <Icon size={18} />
                  <span className="lg:hidden">{mobileLabel}</span>
                  <span className="hidden lg:inline">{label}</span>
                </button>
              ),
            )}
          </BusinessDashboardNavigation>
          <main className="min-w-0">
            {message && (
              <p
                role="status"
                className="mb-3 rounded-xl bg-primary/10 p-3 text-sm"
              >
                {message}
              </p>
            )}
            <BusinessLocationView
              business={{
                name: "Escola Municipal Artur de Sales",
                category: "educacao",
                status: "active",
                business_city: saved.city,
                business_state: saved.state,
                location: {
                  name: "Nordeste de Amaralina",
                  full_name: "Nordeste de Amaralina, Salvador - BA",
                  canonical_lat: -13.00912935,
                  canonical_lng: -38.47367582,
                },
              }}
              address={address}
              changed={JSON.stringify(address) !== JSON.stringify(saved)}
              isSaving={false}
              onChange={(next) => {
                setDraft(next);
                setMessage("");
              }}
              onDiscard={() => {
                setDraft(null);
                setMessage("");
              }}
              onSave={async () => {
                setSaved(address);
                setDraft(null);
                setMessage(
                  "Localização salva somente nesta prévia. Nenhum dado enviado ao banco.",
                );
              }}
            />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Prévia com dados de exemplo: as alterações ficam somente nesta
              tela e não são gravadas no banco.
            </p>
          </main>
        </div>
      </div>
      <Toaster richColors />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? (
    <BrowserRouter>
      <Preview />
    </BrowserRouter>
  ) : (
    <p>Prévia disponível apenas em desenvolvimento.</p>
  ),
);
