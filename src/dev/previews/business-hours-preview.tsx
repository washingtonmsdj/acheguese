import { useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  Clock,
  Images,
  Pencil,
  MapPin,
  Package,
  Store,
} from "lucide-react";
import { BusinessOpeningHoursView } from "@/modules/business/dashboard/pages/BusinessOpeningHoursPage";
import { WEEK_DAYS, WEEKDAYS } from "@/core/business/constants/weekDays";
import { getScheduleError } from "@/core/business/utils/openingHoursPresentation";
import { PublicBrandHeader } from "@/app/components/navigation/PublicBrandHeader";
import { ActiveProfileIdentity } from "@/shared/components/ActiveProfileIdentity";
import { BusinessDashboardNavigation } from "@/modules/business/dashboard/components/BusinessDashboardNavigation";
import "@/index.css";
import "@/modules/business/dashboard/pages/BusinessDashboardNav.css";

type Hours = Parameters<typeof BusinessOpeningHoursView>[0]["hours"];
const exampleHours: Hours = Object.fromEntries(
  WEEKDAYS.map((day) => [
    day,
    { open: "08:00", close: "17:00", closed: false },
  ]),
);
exampleHours.sabado = { open: "00:00", close: "00:00", closed: true };
const sections = [
  { name: "Visão", icon: Store, href: "/central-empresa-preview.html" },
  { name: "Editar", icon: Pencil, href: "/editar-empresa-preview.html" },
  { name: "Fotos", icon: Images },
  { name: "Horário", icon: Clock },
  { name: "Localização", icon: MapPin, href: "/localizacao-empresa-preview.html" },
  { name: "Catálogo", icon: Package, href: "/produtos-servicos-empresa-preview.html" },
];

export function Preview() {
  const [saved, setSaved] = useState<Hours>(exampleHours);
  const [draft, setDraft] = useState<Hours | null>(null);
  const [message, setMessage] = useState("");
  const hours = draft ?? saved;
  const changed = JSON.stringify(hours) !== JSON.stringify(saved);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!changed || WEEK_DAYS.some((day) => getScheduleError(hours[day])))
      return;
    setSaved(hours);
    setDraft(null);
    setMessage(
      "Horários atualizados somente nesta prévia. Nada foi enviado ao banco.",
    );
  };
  return (
    <div className="light pt-page min-h-screen bg-background text-foreground">
      <PublicBrandHeader
        accountHref="/conta"
        urls={{
          nearby: "/",
          business: "/central/empresas",
          map: "/",
          search: "/busca",
        }}
      />
      <div className="mx-auto grid max-w-[1440px] gap-3 px-4 py-4 sm:px-6 xl:px-8">
        <ActiveProfileIdentity profile={{ id: "preview-business", displayName: "Perfil da empresa (demonstração)" }} />
        <p className="text-xs leading-5 text-muted-foreground">
          Prévia com dados de exemplo · alterações não são publicadas.
        </p>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <BusinessDashboardNavigation count={sections.length}>
              {sections.map(({ name, icon: Icon, href }) => href ? (
                <a key={name} href={href} className="business-dashboard-nav__item text-foreground">
                  <Icon size={18} aria-hidden="true" />
                  {name}
                </a>
              ) : (
                <button
                  key={name}
                  type="button"
                  disabled={name !== "Horário"}
                  aria-current={name === "Horário" ? "page" : undefined}
                  className={`business-dashboard-nav__item ${name === "Horário" ? "bg-primary/10 text-primary ring-1 ring-primary/10" : "text-muted-foreground"}`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {name}
                </button>
              ))}
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
            <BusinessOpeningHoursView
              businessName="Empresa de demonstração"
              businessIdentity={{
                name: "Empresa de demonstração",
                category: "servicos",
                status: "active",
              }}
              publicUrl={null}
              hours={hours}
              changed={changed}
              isSaving={false}
              onChange={(next) => {
                setDraft(next);
                setMessage("");
              }}
              onSubmit={submit}
              onDiscard={() => {
                setDraft(null);
                setMessage("");
              }}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? (
    <BrowserRouter>
      <Preview />
    </BrowserRouter>
  ) : (
    <p>Prévia disponível apenas no ambiente de desenvolvimento.</p>
  ),
);
