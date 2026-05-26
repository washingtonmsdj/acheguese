/**
 * EducationEventsPage
 *
 * Pagina de gestao de eventos da instituicao.
 * Rota: /central/empresas/:businessId/educacao/eventos
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Globe,
  Lock,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import { useToast } from '@/shared/hooks/use-toast';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { useEducationEvents } from '../hooks/useEducationEvents';
import { useEducationNicheBilling } from '../niches/hooks/useEducationNicheBilling';
import { EducationUpgradeBanner } from '../niches/components/EducationUpgradeBanner';
import { EducationCapabilityGuard } from '../niches/components/EducationCapabilityGuard';
import { getNicheByKey } from '../niches/registry';
import type { EducationEvent, SchoolEventType } from '../types';

const SCHOOL_EVENT_TYPE_LABELS: Record<SchoolEventType, string> = {
  open_house: 'Portas Abertas',
  enrollment_fair: 'Feira de Matrícula',
  parent_meeting: 'Reunião de Pais',
  trial_class: 'Aula Experimental',
  school_tour: 'Visita Escolar',
  cultural_event: 'Evento Cultural',
  sports_event: 'Evento Esportivo',
  other: 'Outro',
};

const SCHOOL_EVENT_TYPE_OPTIONS: { value: SchoolEventType; label: string }[] = [
  { value: 'open_house', label: 'Portas Abertas' },
  { value: 'enrollment_fair', label: 'Feira de Matrícula' },
  { value: 'parent_meeting', label: 'Reunião de Pais' },
  { value: 'trial_class', label: 'Aula Experimental' },
  { value: 'school_tour', label: 'Visita Escolar' },
  { value: 'cultural_event', label: 'Evento Cultural' },
  { value: 'sports_event', label: 'Evento Esportivo' },
  { value: 'other', label: 'Outro' },
];

export function EducationEventsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { data: profile, isLoading: isProfileLoading } = useEducationProfile(businessId);
  const { events, isLoading, create, update, remove } = useEducationEvents(profile?.id);

  // Integração nicho + billing
  const nicheBilling = useEducationNicheBilling({
    nicheKey: profile?.niche_key,
    businessId: businessId || '',
  });

  const nicheInfo = profile?.niche_key ? getNicheByKey(profile.niche_key) : null;

  // Verifica capability do nicho + plano
  const eventsCapability = nicheBilling.can('events_public');
  const canCreateEvent = nicheBilling.checkCanCreateEvent(events?.length || 0);
  const limitReached = !canCreateEvent.allowed && events && nicheInfo && events.length >= nicheInfo.entitlements.maxEvents;

  // Bloqueio por capability (nicho ou plano negou)
  const isEventsBlocked = !eventsCapability.allowed;
  // Bloqueio apenas por limite
  const isLimitBlocked = eventsCapability.allowed && !canCreateEvent.allowed;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EducationEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
    isPublic: true,
    schoolEventType: '' as SchoolEventType | '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de capability final = nicho permite AND plano permite
    if (isEventsBlocked) {
      toast({
        title: 'Recurso bloqueado',
        description: eventsCapability.upgradeMessage,
        variant: 'destructive'
      });
      return;
    }

    // Validação de limite operacional
    if (isLimitBlocked) {
      toast({
        title: 'Limite atingido',
        description: canCreateEvent.reason || 'Limite de eventos atingido para este nicho.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await create({
        title: formData.title,
        description: formData.description,
        startsAt: formData.startsAt,
        endsAt: formData.endsAt || undefined,
        location: formData.location,
        isPublic: formData.isPublic,
        schoolEventType: formData.schoolEventType || undefined,
      });
      toast({ title: 'Evento criado', description: 'O evento foi criado com sucesso.' });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar o evento.', variant: 'destructive' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      await update({
        eventId: editingEvent.id,
        payload: {
          title: formData.title,
          description: formData.description,
          starts_at: formData.startsAt,
          ends_at: formData.endsAt || null,
          location: formData.location,
          is_public: formData.isPublic,
          school_event_type: formData.schoolEventType || null,
        },
      });
      toast({ title: 'Evento atualizado', description: 'As alterações foram salvas.' });
      setIsDialogOpen(false);
      setEditingEvent(null);
      resetForm();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o evento.', variant: 'destructive' });
    }
  };

  const handleDelete = async (eventId: string) => {
    const confirmed = await confirm({
      title: 'Excluir evento',
      description: 'Este evento sera removido da instituicao e deixara de aparecer no calendario publico.',
      confirmLabel: 'Excluir',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await remove(eventId);
      toast({ title: 'Evento excluído', description: 'O evento foi removido com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o evento.', variant: 'destructive' });
    }
  };

  const openEditDialog = (event: EducationEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startsAt: event.starts_at.slice(0, 16), // Format for datetime-local
      endsAt: event.ends_at ? event.ends_at.slice(0, 16) : '',
      location: event.location || '',
      isPublic: event.is_public,
      schoolEventType: event.school_event_type || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startsAt: '',
      endsAt: '',
      location: '',
      isPublic: true,
      schoolEventType: '',
    });
  };

  const openNewDialog = () => {
    setEditingEvent(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (isProfileLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => isUpcoming(e.starts_at));
  const pastEvents = events.filter(e => !isUpcoming(e.starts_at));

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/central/empresas/${businessId}/educacao`)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
            <p className="text-sm text-gray-500">
              Gerencie eventos e visitas agendadas
            </p>
          </div>
        </div>
        <Button
          onClick={openNewDialog}
          className="gap-2"
          disabled={isEventsBlocked || isLimitBlocked}
          title={
            isEventsBlocked
              ? eventsCapability.upgradeMessage
              : isLimitBlocked
                ? canCreateEvent.reason
                : ''
          }
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </Button>
      </motion.div>

      {/* Banner de bloqueio por capability (nicho ou plano) */}
      {isEventsBlocked && (
        <div className="mb-6">
          <EducationUpgradeBanner
            nicheKey={profile?.niche_key}
            businessId={businessId || ''}
            reason={eventsCapability.reason === 'niche_denied' ? 'niche_denied' : 'plan_denied'}
            feature="events_public"
            variant="banner"
          />
        </div>
      )}

      {/* Upgrade Banner se limite atingido */}
      {isLimitBlocked && nicheInfo && (
        <div className="mb-6">
          <EducationUpgradeBanner
            nicheKey={profile?.niche_key}
            businessId={businessId || ''}
            reason="limit_reached"
            feature="events_public"
            currentCount={events?.length || 0}
            maxCount={nicheInfo.entitlements.maxEvents}
            variant="banner"
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Próximos</p>
            <p className="text-2xl font-bold text-green-600">{upcomingEvents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Passados</p>
            <p className="text-2xl font-bold text-gray-400">{pastEvents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Públicos</p>
            <p className="text-2xl font-bold">
              {events.filter(e => e.is_public).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum evento cadastrado
            </h3>
            <p className="text-gray-500 mb-4">
              Cadastre eventos, visitas abertas e outras atividades.
            </p>
            <Button
              onClick={openNewDialog}
              disabled={isEventsBlocked || isLimitBlocked}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events
            .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
            .map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={isUpcoming(event.starts_at) ? '' : 'opacity-60'}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {isUpcoming(event.starts_at) ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                            Em breve
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Concluído</Badge>
                        )}
                        {event.school_event_type && profile?.niche_key === 'regular_school' && (
                          <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                            {SCHOOL_EVENT_TYPE_LABELS[event.school_event_type]}
                          </Badge>
                        )}
                        {event.is_public ? (
                          <Badge variant="outline" className="gap-1">
                            <Globe className="w-3 h-3" />
                            Público
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="w-3 h-3" />
                            Privado
                          </Badge>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(event.starts_at)}
                          {event.ends_at && ` - ${formatDate(event.ends_at)}`}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(event)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar Evento' : 'Novo Evento'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editingEvent ? handleUpdate : handleCreate}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Visita Aberta 2024"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o evento..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startsAt">Início *</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endsAt">Término</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Auditório Principal"
              />
            </div>

            <div>
              <Label htmlFor="schoolEventType">Tipo de Evento</Label>
              <select
                id="schoolEventType"
                value={formData.schoolEventType}
                onChange={(e) => setFormData({ ...formData, schoolEventType: e.target.value as SchoolEventType | '' })}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione o tipo...</option>
                {SCHOOL_EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
              <Label htmlFor="isPublic">Evento público (visível na página)</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                {editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingEvent(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}

export default EducationEventsPage;
