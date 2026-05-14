import { CalendarDays, Flame, Tag } from 'lucide-react';
import type { Event } from '../types';

interface EventsGlobalSidebarProps {
  events: Event[];
}

export function EventsGlobalSidebar({ events }: EventsGlobalSidebarProps) {
  const topEvents = [...events]
    .sort((a, b) => b.participants_count - a.participants_count)
    .slice(0, 3);

  const topCategories = Array.from(
    events.reduce((acc, event) => {
      acc.set(event.category, (acc.get(event.category) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4 text-primary" />
          Eventos em destaque
        </h3>
        <div className="space-y-3">
          {topEvents.map((event) => (
            <article key={event.id} className="rounded-lg border bg-background/40 p-3">
              <p className="line-clamp-2 text-sm font-medium">{event.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{event.participants_count} participantes</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Tag className="h-4 w-4 text-primary" />
          Categorias populares
        </h3>
        <div className="space-y-2">
          {topCategories.map(([category, count]) => (
            <div key={category} className="flex items-center justify-between rounded-md bg-background/40 px-2 py-1.5">
              <span className="text-xs capitalize">{category}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" />
          Contexto global
        </h3>
        <p className="text-xs text-muted-foreground">
          Explorando eventos sem recorte territorial. Use filtros para navegar por tema, data e tipo.
        </p>
      </section>
    </div>
  );
}
