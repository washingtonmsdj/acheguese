import React, { memo } from "react";
import { AlertTriangle, BriefcaseBusiness, Building2, CalendarDays, ChevronRight, CloudSun, Droplets, ShieldAlert, UtensilsCrossed, Wrench } from "lucide-react";

const shortcuts = [
  { icon: Building2, label: "Empresas em destaque" },
  { icon: UtensilsCrossed, label: "Restaurantes" },
  { icon: Wrench, label: "Prestadores de serviço" },
  { icon: BriefcaseBusiness, label: "Vagas de emprego" },
  { icon: CalendarDays, label: "Classificados recentes" },
];

const events = [
  { day: "18", month: "MAI", title: "Feira de Artesanato e Gastronomia", date: "Sábado, 18 de maio", time: "9h às 16h" },
  { day: "19", month: "MAI", title: "Aulão de Funcional na Orla", date: "Domingo, 19 de maio", time: "7h às 8h" },
  { day: "25", month: "MAI", title: "Show de MPB na Praça", date: "Sábado, 25 de maio", time: "18h às 22h" },
];

const featuredBusinesses = [
  { initials: "PJ", name: "Pizzaria do João", type: "Restaurante", rating: "4,8", reviews: "612" },
  { initials: "MB", name: "Mercado Bom Preço", type: "Mercado", rating: "4,6", reviews: "248" },
  { initials: "SP", name: "Studio Pilates Pituba", type: "Saúde e Bem-estar", rating: "4,9", reviews: "128" },
  { initials: "PA", name: "Pet Shop Amigo Fiel", type: "Pet Shop", rating: "4,7", reviews: "93" },
];

const neighborhoodAlerts = [
  { icon: ShieldAlert, title: "Atenção com furtos de bicicleta na orla. Fique atento!", meta: "Segurança • 1 h" },
  { icon: AlertTriangle, title: "Interdição na Rua Paraíba neste domingo (18/05).", meta: "Trânsito • 2 h" },
  { icon: Droplets, title: "Manutenção programada: falta d'água no sábado (18/05) das 8h às 14h.", meta: "Saneamento • 3 h" },
];

function SidebarSection({ title, actionLabel, children }: { title: string; actionLabel: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button type="button" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

export const CommunityRightSidebar = memo(() => {
  return (
    <div className="flex w-full flex-col gap-3">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CloudSun className="mt-0.5 h-8 w-8 text-primary" />
            <div>
              <p className="text-3xl font-bold leading-none text-foreground">28°C</p>
              <p className="mt-1 text-sm font-medium text-foreground">Ensolarado</p>
              <p className="text-xs text-muted-foreground">Salvador, BA</p>
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">Hoje</span>
        </div>
        <button type="button" className="mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
          Ver previsão completa
        </button>
      </section>

      <SidebarSection title="Atalhos populares" actionLabel="Ver todos">
        <div className="space-y-1">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <button
                type="button"
                key={shortcut.label}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">{shortcut.label}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </SidebarSection>

      <SidebarSection title="Próximos eventos" actionLabel="Ver todos">
        <div className="space-y-1">
          {events.map((event) => (
            <div key={`${event.title}-${event.day}`} className="flex items-start gap-3 border-b border-border py-2.5 last:border-b-0">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-accent">
                <span className="text-base font-bold leading-none text-foreground">{event.day}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{event.month}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight text-foreground">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{event.date}</p>
                <p className="text-xs text-muted-foreground">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Empresas em destaque" actionLabel="Ver todas">
        <div className="space-y-2">
          {featuredBusinesses.map((business) => (
            <div key={business.name} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-foreground">
                {business.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{business.name}</p>
                <p className="text-xs text-muted-foreground">{business.type}</p>
                <p className="text-xs text-primary">★ {business.rating} ({business.reviews})</p>
              </div>
            </div>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Alertas do bairro" actionLabel="Ver todos">
        <div className="space-y-1">
          {neighborhoodAlerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div key={alert.title} className="flex items-start gap-3 border-b border-border py-2.5 last:border-b-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-foreground">{alert.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.meta}</p>
                </div>
              </div>
            );
          })}
        </div>
      </SidebarSection>
    </div>
  );
});

CommunityRightSidebar.displayName = "CommunityRightSidebar";
