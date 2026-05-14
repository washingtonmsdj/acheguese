/**
 * �x` EVENTS ORGANIZER DASHBOARD
 * 
 * Dashboard do organizador para gerenciar seus eventos
 * Listagem, estatísticas e ações rápidas
 * 
 * @version 1.0.0
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Plus,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Search,
  Filter,
  Download,
  Share2,
  BarChart3,
  Home,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
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
import { cn } from '@/shared/utils/cn';
import type { Event, EventStatus } from '../types';
import { useSessionContext } from '@/core/session/hooks/useSessionContext';
import { communityEventsRuntimeService } from '@/core/community/services/CommunityEventsRuntimeService';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';

export default function EventsOrganizerDashboard() {
  const navigate = useNavigate();
  const { activeProfile } = useSessionContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');

  // Mock: Em produção, buscar eventos do organizador logado
  const { data: organizerEvents = [] } = useQuery({
    queryKey: ['events-organizer-dashboard', activeProfile?.id],
    enabled: Boolean(activeProfile?.id),
    queryFn: async () => {
      if (!activeProfile?.id) return [];
      const rows = await communityEventsRuntimeService.getEventsByOrganizerProfile(activeProfile.id, 200);
      if (rows.length > 0) return rows.map(mapCommunityEventToEvent);
      const fallback = await communityEventsRuntimeService.getEvents({ upcoming: true });
      return fallback.map(mapCommunityEventToEvent);
    },
  });

  // Filter events
  const filteredEvents = useMemo(() => {
    return organizerEvents.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [organizerEvents, search, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = organizerEvents.length;
    const published = organizerEvents.filter(e => e.status === 'publicado').length;
    const draft = organizerEvents.filter(e => e.status === 'rascunho').length;
    const totalParticipants = organizerEvents.reduce((acc, e) => acc + e.participants_count, 0);
    const totalViews = organizerEvents.reduce((acc, e) => acc + e.views_count, 0);
    const totalRevenue = organizerEvents.reduce((acc, e) => {
      if (e.is_free) return acc;
      return acc + e.tickets.reduce((sum, t) => sum + (t.quantity_sold * t.price), 0);
    }, 0);

    return { total, published, draft, totalParticipants, totalViews, totalRevenue };
  }, [organizerEvents]);

  // Handlers
  const handleCreateEvent = () => {
    navigate('/central/eventos/novo');
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/central/eventos/editar/${eventId}`);
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/eventos/${eventId}`);
  };

  const handleDuplicateEvent = (eventId: string) => {
    // TODO: Implementar duplicação
    alert(`Duplicar evento ${eventId}`);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      // TODO: Implementar exclusão
      alert(`Excluir evento ${eventId}`);
    }
  };

  const handleExportData = () => {
    // TODO: Implementar exportação
    alert('Exportar dados');
  };

  const handleViewAnalytics = (eventId: string) => {
    navigate(`/central/eventos/analytics/${eventId}`);
  };

  // Status badge
  const getStatusBadge = (status: EventStatus) => {
    const config = {
      publicado: { label: 'Publicado', className: 'bg-green-500' },
      rascunho: { label: 'Rascunho', className: 'bg-gray-500' },
      cancelado: { label: 'Cancelado', className: 'bg-red-500' },
      finalizado: { label: 'Finalizado', className: 'bg-blue-500' },
      em_andamento: { label: 'Em Andamento', className: 'bg-amber-500' },
    };

    const { label, className } = config[status] || config.rascunho;

    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>Meus Eventos | Dashboard | Achegue-se</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Page Container */}
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            {/* Breadcrumbs */}
            <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Início</span>
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground">Meus Eventos</span>
            </nav>

            {/* Title & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Meus Eventos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie e acompanhe seus eventos
                </p>
              </div>
              <Button onClick={handleCreateEvent} className="gap-2" size="lg">
                <Plus className="h-5 w-5" />
                Criar Evento
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="border-b border-border/50 bg-muted/30 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Events */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Eventos</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.published} publicados
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </motion.div>

              {/* Total Participants */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Participantes</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalParticipants.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-green-600">
                      +12% este mês
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              {/* Total Views */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Visualizações</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalViews.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-blue-600">
                      +8% este mês
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              {/* Total Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                    <p className="text-2xl font-bold text-foreground">
                      R$ {stats.totalRevenue.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-amber-600">
                      +15% este mês
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                    <DollarSign className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="border-b border-border/50 bg-background/80 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'publicado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('publicado')}
                >
                  Publicados
                </Button>
                <Button
                  variant={statusFilter === 'rascunho' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('rascunho')}
                >
                  Rascunhos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Events List */}
        <section className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Nenhum evento encontrado
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {search ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro evento'}
                </p>
                {!search && (
                  <Button onClick={handleCreateEvent} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Evento
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-32">
                        <img
                          src={event.cover_image_url}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                        {getStatusBadge(event.status)}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="mb-1 font-bold text-foreground line-clamp-1">
                                {event.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {event.short_description}
                              </p>
                            </div>

                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewEvent(event.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditEvent(event.id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateEvent(event.id)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Meta */}
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
                              {event.views_count} visualizações
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEvent(event.id)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEvent(event.id)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAnalytics(event.id)}
                            className="gap-1"
                          >
                            <BarChart3 className="h-3 w-3" />
                            <span className="hidden sm:inline">Analytics</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

    </>
  );
}
