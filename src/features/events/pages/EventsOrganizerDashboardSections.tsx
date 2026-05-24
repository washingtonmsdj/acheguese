import type React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Copy,
  DollarSign,
  Download,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import type { Event, EventStatus } from '../types';
import { getOrganizerEventStatusBadge, type OrganizerDashboardStats } from './EventsOrganizerDashboard.model';

type EventsOrganizerStatsSectionProps = {
  stats: OrganizerDashboardStats;
};

type EventsOrganizerFiltersSectionProps = {
  onExportData: () => void;
  search: string;
  setSearch: (value: string) => void;
  setStatusFilter: (value: EventStatus | 'all') => void;
  statusFilter: EventStatus | 'all';
};

type EventsOrganizerListSectionProps = {
  events: Event[];
  onCreateEvent: () => void;
  onDeleteEvent: (eventId: string) => void;
  onDuplicateEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onViewAnalytics: (eventId: string) => void;
  onViewEvent: (eventId: string) => void;
  onViewParticipants: (eventId: string, eventTitle: string) => void;
  search: string;
};

export function EventsOrganizerStatsSection({ stats }: EventsOrganizerStatsSectionProps) {
  return (
    <section className="border-b border-border/50 bg-muted/30 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OrganizerStatCard
            delay={0.1}
            icon={<Calendar className="h-6 w-6 text-primary" />}
            iconClassName="bg-primary/10"
            label="Total de Eventos"
            value={stats.total}
            helper={`${stats.published} publicados`}
          />
          <OrganizerStatCard
            delay={0.2}
            icon={<Users className="h-6 w-6 text-green-600" />}
            iconClassName="bg-green-500/10"
            label="Participantes"
            value={stats.totalParticipants.toLocaleString('pt-BR')}
            helper="+12% este mes"
            helperClassName="text-green-600"
          />
          <OrganizerStatCard
            delay={0.3}
            icon={<Eye className="h-6 w-6 text-blue-600" />}
            iconClassName="bg-blue-500/10"
            label="Visualizacoes"
            value={stats.totalViews.toLocaleString('pt-BR')}
            helper="+8% este mes"
            helperClassName="text-blue-600"
          />
          <OrganizerStatCard
            delay={0.4}
            icon={<DollarSign className="h-6 w-6 text-amber-600" />}
            iconClassName="bg-amber-500/10"
            label="Receita Total"
            value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`}
            helper="+15% este mes"
            helperClassName="text-amber-600"
          />
        </div>
      </div>
    </section>
  );
}

export function EventsOrganizerFiltersSection({
  onExportData,
  search,
  setSearch,
  setStatusFilter,
  statusFilter,
}: EventsOrganizerFiltersSectionProps) {
  return (
    <section className="border-b border-border/50 bg-background/80 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <StatusFilterButton current={statusFilter} value="all" onClick={setStatusFilter}>Todos</StatusFilterButton>
            <StatusFilterButton current={statusFilter} value="publicado" onClick={setStatusFilter}>Publicados</StatusFilterButton>
            <StatusFilterButton current={statusFilter} value="rascunho" onClick={setStatusFilter}>Rascunhos</StatusFilterButton>
            <Button variant="outline" size="sm" onClick={onExportData} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EventsOrganizerListSection({
  events,
  onCreateEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onEditEvent,
  onViewAnalytics,
  onViewEvent,
  onViewParticipants,
  search,
}: EventsOrganizerListSectionProps) {
  return (
    <section className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhum evento encontrado</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {search ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro evento'}
            </p>
            {!search && (
              <Button onClick={onCreateEvent} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Evento
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <OrganizerEventRow
                key={event.id}
                event={event}
                index={index}
                onDeleteEvent={onDeleteEvent}
                onDuplicateEvent={onDuplicateEvent}
                onEditEvent={onEditEvent}
                onViewAnalytics={onViewAnalytics}
                onViewEvent={onViewEvent}
                onViewParticipants={onViewParticipants}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function OrganizerStatCard({
  delay,
  helper,
  helperClassName = 'text-muted-foreground',
  icon,
  iconClassName,
  label,
  value,
}: {
  delay: number;
  helper: string;
  helperClassName?: string;
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className={`text-xs ${helperClassName}`}>{helper}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconClassName}`}>{icon}</div>
      </div>
    </motion.div>
  );
}

function StatusFilterButton({
  children,
  current,
  onClick,
  value,
}: {
  children: React.ReactNode;
  current: EventStatus | 'all';
  onClick: (value: EventStatus | 'all') => void;
  value: EventStatus | 'all';
}) {
  return (
    <Button variant={current === value ? 'default' : 'outline'} size="sm" onClick={() => onClick(value)}>
      {children}
    </Button>
  );
}

function OrganizerEventRow({
  event,
  index,
  onDeleteEvent,
  onDuplicateEvent,
  onEditEvent,
  onViewAnalytics,
  onViewEvent,
  onViewParticipants,
}: {
  event: Event;
  index: number;
  onDeleteEvent: (eventId: string) => void;
  onDuplicateEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onViewAnalytics: (eventId: string) => void;
  onViewEvent: (eventId: string) => void;
  onViewParticipants: (eventId: string, eventTitle: string) => void;
}) {
  const statusBadge = getOrganizerEventStatusBadge(event.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
    >
      <div className="flex gap-4">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-32">
          <img src={event.cover_image_url} alt={event.title} className="h-full w-full object-cover" />
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="mb-1 font-bold text-foreground line-clamp-1">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{event.short_description}</p>
              </div>
              <OrganizerEventActionsMenu
                event={event}
                onDeleteEvent={onDeleteEvent}
                onDuplicateEvent={onDuplicateEvent}
                onEditEvent={onEditEvent}
                onViewEvent={onViewEvent}
                onViewParticipants={onViewParticipants}
              />
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(event.start_date).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {event.participants_count} participantes
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {event.views_count} visualizacoes
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEditEvent(event.id)} className="gap-1">
              <Edit className="h-3 w-3" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => onViewEvent(event.id)} className="gap-1">
              <Eye className="h-3 w-3" />
              Ver
            </Button>
            <Button variant="outline" size="sm" onClick={() => onViewAnalytics(event.id)} className="gap-1">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => onViewParticipants(event.id, event.title)} className="gap-1">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Participantes</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function OrganizerEventActionsMenu({
  event,
  onDeleteEvent,
  onDuplicateEvent,
  onEditEvent,
  onViewEvent,
  onViewParticipants,
}: {
  event: Event;
  onDeleteEvent: (eventId: string) => void;
  onDuplicateEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onViewEvent: (eventId: string) => void;
  onViewParticipants: (eventId: string, eventTitle: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewEvent(event.id)}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditEvent(event.id)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewParticipants(event.id, event.title)}>
          <Users className="mr-2 h-4 w-4" />
          Participantes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicateEvent(event.id)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDeleteEvent(event.id)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
