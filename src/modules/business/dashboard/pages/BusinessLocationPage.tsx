import { useState } from "react";
import { ArrowRight, MapPin, Eye, Store } from "lucide-react";
import { AddressEditor } from "@/core/business/components/settings/AddressEditor";
import { LocationPickerSheet } from "@/core/maps/components/LocationPickerSheet";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { useBusinessEdit } from "@/modules/business/hooks/useBusinessEdit";
import { BusinessManagementIdentity } from "../components/BusinessManagementIdentity";
import { Button } from "@/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";
import { resolveMediaAssetSource } from "@/shared/media/mediaAssetReference";
import "./BusinessLocationPage.css";
import type { BusinessManagementIdentityData } from "../components/BusinessManagementIdentity";

type Address = Parameters<typeof AddressEditor>[0]["address"];

export default function BusinessLocationPage() {
  const { businessId, business, publicUrl } =
    useActiveBusinessDashboardContext();
  const initial: Address = {
    street: business.address?.street ?? "",
    number: business.address?.number ?? "",
    complement: business.address?.complement ?? "",
    postal_code: business.address?.postal_code ?? business.business_zip ?? "",
    city: business.business_city ?? "",
    state: business.business_state ?? "",
    latitude: business.address?.latitude ?? undefined,
    longitude: business.address?.longitude ?? undefined,
  };
  const [draft, setDraft] = useState<Address | null>(null);
  const edit = useBusinessEdit({ onSuccess: () => setDraft(null) });
  const address = draft ?? initial;
  const changed = JSON.stringify(address) !== JSON.stringify(initial);
  return (
    <BusinessLocationView
      showIdentity={false}
      business={business}
      publicUrl={publicUrl}
      address={address}
      changed={changed}
      isSaving={edit.isLoading}
      error={edit.error?.message}
      onChange={setDraft}
      onDiscard={() => setDraft(null)}
      onSave={async () => {
        await edit.updateBusiness({
          id: businessId,
          data: {
            location_id: business.location_id ?? undefined,
            address_street: address.street,
            address_number: address.number,
            address_complement: address.complement,
            postal_code: address.postal_code,
            city: address.city,
            state: address.state,
            neighborhood: address.neighborhood,
            latitude: address.latitude,
            longitude: address.longitude,
          },
        });
      }}
    />
  );
}

interface BusinessLocationViewProps {
  showIdentity?: boolean;
  showSteps?: boolean;
  business: BusinessManagementIdentityData;
  publicUrl?: string | null;
  address: Address;
  changed: boolean;
  isSaving: boolean;
  error?: string;
  onChange: (address: Address) => void;
  onDiscard: () => void;
  onSave: () => Promise<void>;
}

export function BusinessLocationView({
  showIdentity = true,
  showSteps = showIdentity,
  business,
  publicUrl,
  address,
  changed,
  isSaving,
  error,
  onChange,
  onDiscard,
  onSave,
}: BusinessLocationViewProps) {
  const hasPin =
    address.latitude !== undefined && address.longitude !== undefined;
  const image = resolveMediaAssetSource(business.logo_url);
  const updateAddress = (next: Address) => {
    const locatorChanged = [
      "street",
      "number",
      "postal_code",
      "neighborhood",
      "city",
      "state",
    ].some(
      (field) =>
        next[field as keyof Address] !== address[field as keyof Address],
    );
    const coordinatesChanged =
      next.latitude !== address.latitude ||
      next.longitude !== address.longitude;
    onChange(
      locatorChanged && !coordinatesChanged
        ? { ...next, latitude: undefined, longitude: undefined }
        : next,
    );
  };
  return (
    <div className="business-location">
      {showIdentity ? <BusinessManagementIdentity business={business} publicUrl={publicUrl} /> : null}
      {showSteps ? (
        <ol
          className="business-location__steps"
          aria-label="Etapas de edição da empresa"
        >
          {[
            { label: "Dados básicos", mobile: "Dados" },
            { label: "Fotos", mobile: "Fotos" },
            { label: "Horário", mobile: "Horário" },
            { label: "Localização", mobile: "Localização" },
            { label: "Produtos e serviços", mobile: "Serviços" },
          ].map(({ label, mobile }, index) => (
            <li
              key={label}
              aria-label={`Etapa ${index + 1}: ${label}`}
              aria-current={index === 3 ? "step" : undefined}
            >
              <span>{index + 1}</span>
              <small className="business-location__step-label">{label}</small>
              <small className="business-location__step-label--mobile">
                {mobile}
              </small>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="business-location__grid">
        <form
          className="business-location__panel"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!changed || isSaving) return;
            try {
              await onSave();
            } catch {
              /* Existing mutation reports the error; retain the draft. */
            }
          }}
        >
          <header>
            <MapPin aria-hidden="true" />
            <div>
              <h1 className="business-management-title">Localização</h1>
              <p>
                Defina o endereço da sua empresa. Ele será exibido no mapa e
                ajudará as pessoas a encontrá-la.
              </p>
            </div>
          </header>
          <AddressEditor
            className="business-location__fields space-y-0"
            showHeading={false}
            showCompleteness={false}
            compactCepButton
            address={address}
            onChange={updateAddress}
            features={{ cepLookup: true, coordinates: false }}
          />
          <section className="business-location__pin">
            <div className="business-location__pin-note">
              <MapPin aria-hidden="true" />
              <div>
                <h2>Ajuste o ponto no mapa</h2>
                <p>
                  {hasPin
                    ? "Arraste o marcador ou toque no mapa para ajustar o local."
                    : "Referência do território. Ajuste e confirme o pin no endereço da empresa."}
                </p>
              </div>
            </div>
            <LocationPickerSheet
              open={false}
              onOpenChange={() => undefined}
              inline
              requireAdjustment={!hasPin}
              initialLat={
                address.latitude ??
                business.location?.canonical_lat ??
                undefined
              }
              initialLng={
                address.longitude ??
                business.location?.canonical_lng ??
                undefined
              }
              initialZoom={13.5}
              onConfirm={(latitude, longitude) =>
                onChange({ ...address, latitude, longitude })
              }
            />
          </section>
          {error && <p role="alert">{error}</p>}
          <footer>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!changed || isSaving}
                >
                  Descartar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[calc(100%-2rem)] rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O endereço e o ponto do mapa voltarão à última versão salva.
                    As alterações desta tela serão perdidas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="min-h-11">
                    Continuar editando
                  </AlertDialogCancel>
                  <AlertDialogAction className="min-h-11" onClick={onDiscard}>
                    Descartar alterações
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button disabled={!changed || isSaving || !address.street?.trim()}>
              {isSaving ? "Salvando…" : "Salvar alterações"}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </footer>
        </form>
        <aside className="business-location__panel business-location__preview">
          <header>
            <Eye aria-hidden="true" />
            <div>
              <h2>Pré-visualização da página pública</h2>
              <p>Veja como suas informações aparecem no mapa.</p>
            </div>
          </header>
          <div className="business-location__preview-map">
            <LocationPickerSheet
              open={false}
              onOpenChange={() => undefined}
              inline
              readOnly
              compact
              initialLat={
                address.latitude ??
                business.location?.canonical_lat ??
                undefined
              }
              initialLng={
                address.longitude ??
                business.location?.canonical_lng ??
                undefined
              }
              initialZoom={13.5}
              onConfirm={() => undefined}
            />
            <div className="business-location__public-card">
              <span className="business-location__public-icon">
                {image ? (
                  <img src={image} alt="" />
                ) : (
                  <Store aria-hidden="true" />
                )}
              </span>
              <div className="business-location__public-copy">
                <strong>{business.name}</strong>
                {business.category && (
                  <span className="business-location__preview-label">
                    {getBusinessCategoryLabel(business.category)}
                  </span>
                )}
                <p>
                  {[address.street, address.number]
                    .filter(Boolean)
                    .join(", ") || "Endereço não informado"}
                </p>
                <p>
                  {[address.neighborhood, address.city, address.state]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {address.postal_code && <p>{address.postal_code}</p>}
                <small>
                  {hasPin
                    ? "Ponto confirmado no mapa"
                    : "Prévia pela referência territorial"}
                </small>
              </div>
            </div>
          </div>
          <p className="business-location__preview-note">
            A prévia acompanha o ponto e o endereço confirmados antes de salvar.
          </p>
        </aside>
      </div>
    </div>
  );
}
