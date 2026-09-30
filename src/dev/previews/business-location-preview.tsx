import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { MapPin } from "lucide-react";
import { BusinessLocationView } from "@/modules/business/dashboard/pages/BusinessLocationPage";
import { PublicBrandHeader } from "@/app/components/navigation/PublicBrandHeader";
import "@/index.css";

type Address = Parameters<typeof BusinessLocationView>[0]["address"];
export function Preview() {
  const [saved, setSaved] = useState<Address>({ street: "Endereço de demonstração", number: "100", city: "Salvador", state: "BA", neighborhood: "Bairro de demonstração" });
  const [draft, setDraft] = useState<Address | null>(null);
  const [message, setMessage] = useState("");
  const address = draft ?? saved;
  return <div className="pt-page min-h-screen bg-background text-foreground">
    <PublicBrandHeader urls={{ nearby: "/", business: "/central/empresas", map: "/", search: "/busca" }} />
    <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 xl:px-8">
      <p className="mb-4 text-xs text-muted-foreground">Prévia com dados de exemplo · nada é gravado no banco. O mapa e a busca de CEP utilizam os serviços reais.</p>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex min-w-0 items-center gap-2 rounded-2xl border bg-card p-2 self-start lg:block"><h2 className="hidden font-bold lg:block">Central da empresa</h2><p className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm font-semibold text-primary"><MapPin size={18} /> Localização</p><a className="block p-2 text-xs lg:p-3 lg:text-sm" href="/horarios-empresa-preview.html">Horário</a></aside>
        <main className="min-w-0">{message && <p role="status" className="mb-3 rounded-xl bg-primary/10 p-3 text-sm">{message}</p>}
          <BusinessLocationView business={{ name: "Empresa de demonstração", category: "servicos", status: "active" }} address={address} changed={JSON.stringify(address) !== JSON.stringify(saved)} isSaving={false} onChange={(next) => { setDraft(next); setMessage(""); }} onDiscard={() => setDraft(null)} onSave={async () => { setSaved(address); setDraft(null); setMessage("Localização salva somente nesta prévia. Nenhum dado enviado ao banco."); }} />
        </main>
      </div>
    </div><Toaster richColors />
  </div>;
}
createRoot(document.getElementById("root")!).render(import.meta.env.DEV ? <BrowserRouter><Preview /></BrowserRouter> : <p>Prévia disponível apenas em desenvolvimento.</p>);
