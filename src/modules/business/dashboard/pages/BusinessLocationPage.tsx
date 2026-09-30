import { useState } from "react";
import { MapPin, Eye } from "lucide-react";
import { AddressEditor } from "@/core/business/components/settings/AddressEditor";
import { LocationPickerSheet } from "@/core/maps/components/LocationPickerSheet";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { useBusinessEdit } from "@/modules/business/hooks/useBusinessEdit";
import { BusinessManagementIdentity } from "../components/BusinessManagementIdentity";
import { Button } from "@/shared/components/ui/button";
import "./BusinessLocationPage.css";

type Address = Parameters<typeof AddressEditor>[0]["address"];

export default function BusinessLocationPage() {
  const { businessId, business, publicUrl } = useActiveBusinessDashboardContext();
  const initial: Address = {
    street: business.address?.street ?? "", number: business.address?.number ?? "",
    complement: business.address?.complement ?? "", postal_code: business.address?.postal_code ?? business.business_zip ?? "",
    city: business.business_city ?? "", state: business.business_state ?? "",
    latitude: business.address?.latitude ?? undefined, longitude: business.address?.longitude ?? undefined,
  };
  const [draft, setDraft] = useState<Address | null>(null);
  const [picker, setPicker] = useState(false);
  const edit = useBusinessEdit({ onSuccess: () => setDraft(null) });
  const address = draft ?? initial;
  const changed = JSON.stringify(address) !== JSON.stringify(initial);
  const hasPin = address.latitude !== undefined && address.longitude !== undefined;
  return <div className="business-location">
    <BusinessManagementIdentity business={business} publicUrl={publicUrl} />
    <div className="business-location__grid">
      <form className="business-location__panel" onSubmit={async (event) => {
        event.preventDefault();
        if (!changed || edit.isLoading) return;
        try {
          await edit.updateBusiness({ id: businessId, data: {
            location_id: business.location_id ?? undefined,
            address_street: address.street, address_number: address.number,
            address_complement: address.complement, postal_code: address.postal_code,
            city: address.city, state: address.state, neighborhood: address.neighborhood,
            latitude: address.latitude, longitude: address.longitude,
          } });
        } catch { /* Existing mutation reports the error; retain the draft. */ }
      }}>
        <header><MapPin aria-hidden="true" /><div><h1>Localização da empresa</h1><p>Confira o endereço e confirme o ponto exato para ajudar as pessoas a encontrar sua empresa.</p></div></header>
        <AddressEditor address={address} onChange={setDraft} features={{ cepLookup: true, coordinates: false }} />
        <section className="business-location__pin">
          <h2>Ponto no mapa</h2>
          <p>{hasPin ? "Localização definida. Abra o mapa para conferir ou ajustar o marcador." : "O ponto da empresa ainda não foi confirmado. A referência territorial não será usada como localização precisa."}</p>
          <Button type="button" variant="outline" onClick={() => setPicker(true)}><MapPin className="h-4 w-4 mr-2" />{hasPin ? "Ajustar ponto no mapa" : "Marcar localização"}</Button>
        </section>
        {edit.error && <p role="alert">{edit.error.message}</p>}
        <footer><Button type="button" variant="outline" disabled={!changed || edit.isLoading} onClick={() => { if (window.confirm("Descartar as alterações de localização?")) setDraft(null); }}>Cancelar</Button><Button disabled={!changed || edit.isLoading || !address.street?.trim()}>{edit.isLoading ? "Salvando…" : "Salvar alterações"}</Button></footer>
      </form>
      <aside className="business-location__panel"><header><Eye aria-hidden="true" /><div><h2>Prévia do endereço público</h2><p>Confira as informações antes de salvar.</p></div></header><strong>{business.name}</strong><p>{[address.street, address.number, address.complement].filter(Boolean).join(", ") || "Endereço não informado"}</p><p>{[address.neighborhood, address.city, address.state].filter(Boolean).join(" · ")}</p>{address.postal_code && <p>CEP {address.postal_code}</p>}<p className="business-location__note">{hasPin ? "Ponto definido no mapa." : "Sem ponto preciso confirmado."} As alterações só serão publicadas ao salvar.</p>{business.location?.name && <p>Território vinculado: {business.location.name}</p>}</aside>
    </div>
    <LocationPickerSheet open={picker} onOpenChange={setPicker} initialLat={address.latitude ?? business.location?.canonical_lat ?? undefined} initialLng={address.longitude ?? business.location?.canonical_lng ?? undefined} onConfirm={(latitude, longitude) => setDraft({ ...address, latitude, longitude })} />
  </div>;
}
