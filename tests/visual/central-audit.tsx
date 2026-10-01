import React from "react";
import { createRoot } from "react-dom/client";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import { BrandMark } from "@/app/components/navigation/PublicBrandHeader";
import { getActiveBusinessManagementNavigation } from "@/app/config/businessManagementSurfaceScope";
import { CentralHeader } from "@/modules/central/components/CentralHeader";
import BusinessDashboardShellPage from "@/modules/business/dashboard/pages/BusinessDashboardShellPage";
import BusinessDetailsPage from "@/modules/business/dashboard/pages/BusinessDetailsPage";
import BusinessSettingsPage from "@/modules/business/dashboard/pages/BusinessSettingsPage";
import BusinessOverviewPage from "@/modules/business/dashboard/pages/BusinessOverviewPage";
import BusinessPhotosPage from "@/modules/business/dashboard/pages/BusinessPhotosPage";
import { BusinessOpeningHoursView } from "@/modules/business/dashboard/pages/BusinessOpeningHoursPage";
import { BusinessLocationView } from "@/modules/business/dashboard/pages/BusinessLocationPage";
import { BusinessCatalogView } from "@/modules/business/dashboard/pages/BusinessCatalogPage";
import { BasicInfoStep } from "@/modules/business/components/edit/BasicInfoStep";
import type { BusinessCatalogItem } from "@/core/business/services/businessCatalogService";
import "@/modules/business/pages/EditarEmpresaPage.css";
import { business } from "./central-audit-fixtures";

const queryClient = new QueryClient();
const previewOnly = () => {};
function HoursPreview() {
  const [hours, setHours] = React.useState<
    React.ComponentProps<typeof BusinessOpeningHoursView>["hours"]
  >({
    segunda: { open: "07:00", close: "17:00" },
    sabado: { open: "", close: "", closed: true },
  });
  return (
    <BusinessOpeningHoursView
      showIdentity={false}
      businessName={business.name}
      publicUrl={null}
      hours={hours}
      changed={false}
      isSaving={false}
      onChange={setHours}
      onDiscard={previewOnly}
      onSubmit={(event) => event.preventDefault()}
    />
  );
}
function LocationPreview() {
  const [address, setAddress] = React.useState<
    React.ComponentProps<typeof BusinessLocationView>["address"]
  >({
    street: "Rua de demonstração",
    number: "100",
    city: "Cidade de exemplo",
    state: "BA",
  });
  return (
    <BusinessLocationView
      showIdentity={false}
      business={business}
      address={address}
      changed={false}
      isSaving={false}
      onChange={setAddress}
      onDiscard={previewOnly}
      onSave={async () => {}}
    />
  );
}
function CatalogPreview() {
  const [items, setItems] = React.useState<BusinessCatalogItem[]>([
    {
      id: "sample-1",
      kind: "service",
      name: "Serviço demonstrativo com nome extenso",
      description:
        "Descrição simulada para verificar quebra de linha e densidade.",
      price: null,
      active: true,
      category: "Educação",
      image: null,
      createdAt: "2026-01-01",
    },
    {
      id: "sample-2",
      kind: "product",
      name: "Produto de exemplo",
      description: "Item inativo de teste",
      price: 0,
      active: false,
      category: "Educação",
      image: null,
      createdAt: "2026-01-01",
    },
  ]);
  return (
    <BusinessCatalogView
      showIdentity={false}
      business={business}
      items={items}
      onSave={async (input, id) =>
        setItems((current) =>
          id
            ? current.map((item) =>
                item.id === id ? { ...item, ...input } : item,
              )
            : [
                ...current,
                { ...input, id: crypto.randomUUID(), createdAt: "2026-01-01" },
              ],
        )
      }
      onRemove={async (item) =>
        setItems((current) =>
          current.filter((candidate) => candidate.id !== item.id),
        )
      }
    />
  );
}
function EditPreview() {
  const [name, setName] = React.useState(business.name);
  const [description, setDescription] = React.useState(business.description);
  const [category, setCategory] = React.useState<string>(business.category);
  const logoRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="business-edit-page space-y-4">
      <h1 className="business-management-title">Editar empresa</h1>
      <p className="text-xs text-muted-foreground">
        Teste da seção inicial de edição; envio e etapas seguintes não são
        simulados.
      </p>
      <BasicInfoStep
        name={name}
        onNameChange={setName}
        description={description}
        onDescriptionChange={setDescription}
        category={category}
        onCategoryChange={setCategory}
        logoPreview={null}
        logoRef={logoRef}
        onLogoChange={previewOnly}
        errors={{}}
        onCancel={previewOnly}
        onNext={previewOnly}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={["/central/empresas/test-business"]}>
      <div className="min-h-screen bg-background text-foreground">
        <CentralHeader
          billingEnabled={false}
          showNavigation={false}
          brand={
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-base font-bold sm:text-xl"
            >
              <BrandMark />
              <span>achegue-se</span>
            </Link>
          }
        />
        <p className="mx-auto max-w-[1440px] px-4 pt-3 text-xs text-muted-foreground">
          Teste visual isolado · dados simulados · sem gravação ou autenticação
          de produção.
        </p>
        <Routes>
          <Route
            path="/central/empresas/:businessId"
            element={
              <BusinessDashboardShellPage
                navigationItems={getActiveBusinessManagementNavigation()}
              />
            }
          >
            <Route
              index
              element={<BusinessOverviewPage messagingAvailable={false} />}
            />
            <Route path="editar" element={<EditPreview />} />
            <Route path="fotos" element={<BusinessPhotosPage />} />
            <Route path="horarios" element={<HoursPreview />} />
            <Route path="localizacao" element={<LocationPreview />} />
            <Route path="produtos-servicos" element={<CatalogPreview />} />
            <Route path="dados" element={<BusinessDetailsPage />} />
            <Route path="configuracoes" element={<BusinessSettingsPage />} />
          </Route>
        </Routes>
        <Toaster />
      </div>
    </MemoryRouter>
  </QueryClientProvider>,
);
