import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { Store, Pencil, Images, Clock, MapPin, Package } from "lucide-react";
import { PublicBrandHeader } from "@/app/components/navigation/PublicBrandHeader";
import { ActiveProfileIdentity } from "@/shared/components/ActiveProfileIdentity";
import { BusinessDashboardNavigation } from "@/modules/business/dashboard/components/BusinessDashboardNavigation";
import { BusinessCatalogView } from "@/modules/business/dashboard/pages/BusinessCatalogPage";
import type { BusinessCatalogItem } from "@/core/business/services/businessCatalogService";
import "@/index.css";

const sections = [
  { label: "Visão geral", icon: Store, href: "/central-empresa-preview.html" },
  {
    label: "Editar empresa",
    icon: Pencil,
    href: "/editar-empresa-preview.html",
  },
  { label: "Fotos", icon: Images },
  { label: "Horário", icon: Clock, href: "/horarios-empresa-preview.html" },
  {
    label: "Localização",
    icon: MapPin,
    href: "/localizacao-empresa-preview.html",
  },
  { label: "Produtos e serviços", icon: Package },
];
const sampleItems: BusinessCatalogItem[] = [
  {
    id: "demo-1",
    kind: "service",
    name: "Educação infantil",
    description: "Atendimento e atividades para crianças.",
    price: 0,
    active: true,
    category: "",
    image: null,
    createdAt: "2026-01-05",
  },
  {
    id: "demo-2",
    kind: "service",
    name: "Atividades extracurriculares",
    description: "Atividades complementares ao aprendizado.",
    price: null,
    active: true,
    category: "",
    image: null,
    createdAt: "2026-01-03",
  },
  {
    id: "demo-3",
    kind: "service",
    name: "Uso do espaço",
    description: "Disponibilidade mediante consulta.",
    price: null,
    active: false,
    category: "",
    image: null,
    createdAt: "2026-01-01",
  },
  {
    id: "demo-4",
    kind: "service",
    name: "Ensino fundamental",
    description: "Exemplo de serviço com descrição curta e preço gratuito.",
    price: 0,
    active: true,
    category: "",
    image: null,
    createdAt: "2026-01-04",
  },
  {
    id: "demo-5",
    kind: "service",
    name: "Biblioteca",
    description: "Exemplo de item cuja disponibilidade pode ser alterada.",
    price: null,
    active: true,
    category: "",
    image: null,
    createdAt: "2026-01-02",
  },
];
export function Preview() {
  const [items, setItems] = useState(sampleItems);
  return (
    <div className="light pt-page min-h-screen bg-background text-foreground">
      <PublicBrandHeader
        accountHref="/conta"
        contextLabel="Salvador, BA"
        urls={{
          nearby: "/",
          business: "/central/empresas",
          map: "/",
          search: "/busca",
        }}
      />
      <main className="mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:px-6 xl:px-8">
        <ActiveProfileIdentity profile={{ id: "preview-business", displayName: "Perfil da empresa (demonstração)" }} />
        <nav
          aria-label="Caminho da central"
          className="flex gap-2 text-xs text-muted-foreground"
        >
          <span>Central</span>
          <span>›</span>
          <span>Minha empresa</span>
          <span>›</span>
          <strong className="text-foreground">Produtos e serviços</strong>
        </nav>
        <p className="text-xs text-muted-foreground">
          Prévia com dados de exemplo. Alterações ficam somente nesta tela, sem
          publicação.
        </p>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <BusinessDashboardNavigation count={sections.length}>
            {sections.map(({ label, icon: Icon, href }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  className="business-dashboard-nav__item"
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </a>
              ) : (
                <button
                  key={label}
                  type="button"
                  disabled={label === "Fotos"}
                  aria-current={
                    label === "Produtos e serviços" ? "page" : undefined
                  }
                  className={`business-dashboard-nav__item ${label === "Produtos e serviços" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ),
            )}
          </BusinessDashboardNavigation>
          <BusinessCatalogView
            business={{
              name: "Escola Municipal Artur de Sales",
              category: "educacao",
              status: "active",
              business_city: "Salvador",
              business_state: "BA",
            }}
            items={items}
            onSave={async (input, id) => {
              setItems((current) =>
                id
                  ? current.map((item) =>
                      item.id === id ? { ...item, ...input } : item,
                    )
                  : [
                      {
                        ...input,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                      },
                      ...current,
                    ],
              );
            }}
            onRemove={async (item) => {
              setItems((current) =>
                current.filter((entry) => entry.id !== item.id),
              );
            }}
          />
        </div>
      </main>
      <Toaster richColors />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Preview />
  </BrowserRouter>,
);
