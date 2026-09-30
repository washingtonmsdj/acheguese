import { useState, type CSSProperties, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  Clock,
  Images,
  Pencil,
  Settings,
  Store,
  BarChart3,
} from "lucide-react";
import { BusinessOpeningHoursView } from "@/modules/business/dashboard/pages/BusinessOpeningHoursPage";
import { WEEK_DAYS, WEEKDAYS } from "@/core/business/constants/weekDays";
import { getScheduleError } from "@/core/business/utils/openingHoursPresentation";
import { PublicBrandHeader } from "@/app/components/navigation/PublicBrandHeader";
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
  { name: "Visão", icon: Store },
  { name: "Editar", icon: Pencil },
  { name: "Fotos", icon: Images },
  { name: "Horário", icon: Clock },
  { name: "Métricas", icon: BarChart3 },
  { name: "Ajustes", icon: Settings },
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
    <div className="pt-page min-h-screen bg-background text-foreground">
      <PublicBrandHeader
        urls={{
          nearby: "/",
          business: "/central/empresas",
          map: "/",
          search: "/busca",
        }}
      />
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 xl:px-8">
        <p className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5">
          Dados de exemplo. Alterações ficam apenas nesta prévia.
        </p>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="min-w-0 self-start rounded-2xl border bg-card p-1.5 sm:p-2">
            <p className="hidden px-3 py-3 text-sm font-bold lg:block">
              Central da empresa
            </p>
            <nav
              aria-label="Seções demonstrativas"
              className="business-dashboard-nav"
              style={
                { "--business-nav-count": sections.length } as CSSProperties
              }
            >
              {sections.map(({ name, icon: Icon }) => (
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
            </nav>
          </aside>
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
