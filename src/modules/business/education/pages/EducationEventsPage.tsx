/**
 * EducationEventsPage
 *
 * Página de gestão de eventos da instituição.
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
import { Card, CardContent } from '@/shared/components/ui/card';
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
import { getNicheByKey } from '../niches/registry';
import { EducationUrlService } from '../services/EducationUrlService';
import {
  EDUCATION_EVENT_LOCATION_MAX_LENGTH,
  EDUCATION_EVENT_TITLE_MAX_LENGTH,
  getEducationEventValidationError,
  type EducationEvent,
  type SchoolEventType,
} from '@/core/education';
import {
  fromEventIsoToLocalInput,
  fromLocalInputToEventIso,
} from '../utils/educationEventDateTime';
import { EducationAdminReadError } from '../components/EducationAdminReadError';
import { EducationProfileRequiredState } from '../components/EducationProfileRequiredState';

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

const selectClassName =
  'mt-1 h-10 w-full rounded-md border border-territory-border bg-territory-surface px-3 py-2 text-sm text-territory-ink outline-none transition-colors focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20';

export function EducationEventsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useEducationProfile(businessId);
  const {
    events,
    isLoading,
    isError: isEventsError,
    error: eventsError,
    refetch: refetchEvents,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isMutating,
  } = useEducationEvents(profile?.id);
  const dashboardUrl = businessId
    ? EducationUrlService.buildAdminDashboardUrl(businessId)
    : null;

  const nicheBilling = useEducationNicheBilling({
    nicheKey: profile?.niche_key,
    businessId: businessId || '',
    enabled: Boolean(profile?.id),
  });

  const nicheInfo = profile?.niche_key ? getNicheByKey(profile.niche_key) : null;
  const eventsCapability = nicheBilling.can('events_public');
  const canCreateEvent = nicheBilling.checkCanCreateEvent(events?.length || 0);
  const isEventsBlocked = !eventsCapability.allowed;
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

  const buildValidatedEventPayload = () => {
    let startsAt: string;
    let endsAt: string | undefined;

    try {
      startsAt = fromLocalInputToEventIso(formData.startsAt);
      endsAt = formData.endsAt
        ? fromLocalInputToEventIso(formData.endsAt)
        : undefined;
    } catch {
      toast({
        title: 'Revise as datas',
        description: 'Informe datas e horários válidos para o evento.',
        variant: 'destructive',
      });
      return null;
    }

    const validationError = getEducationEventValidationError({
      title: formData.title,
      startsAt,
      endsAt,
      location: formData.location,
    });
    if (validationError) {
      toast({
        title: 'Revise o evento',
        description: validationError,
        variant: 'destructive',
      });
      return null;
    }

    return {
      title: formData.title.trim(),
      description: formData.description,
      startsAt,
      endsAt,
      location: formData.location.trim(),
      isPublic: formData.isPublic,
      schoolEventType: formData.schoolEventType || undefined,
    };
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isEventsBlocked) {
      toast({
        title: 'Recurso bloqueado',
        description: eventsCapability.upgradeMessage,
        variant: 'destructive',
      });
      return;
    }

    if (isLimitBlocked) {
      toast({
        title: 'Limite atingido',
        description:
          canCreateEvent.reason ||
          'Limite de eventos atingido para este nicho.',
        variant: 'destructive',
      });
      return;
    }

    const payload = buildValidatedEventPayload();
    if (!payload) return;

    try {
      await create(payload);
      toast({
        title: 'Evento criado',
        description: 'O evento foi criado com sucesso.',
      });
      setIsDialogOpen(false);
      resetForm();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o evento.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingEvent) return;

    const validated = buildValidatedEventPayload();
    if (!validated) return;

    try {
      await update({
        eventId: editingEvent.id,
        payload: {
          title: validated.title,
          description: validated.description,
          starts_at: validated.startsAt,
          ends_at: validated.endsAt ?? null,
          location: validated.location || null,
          is_public: validated.isPublic,
          school_event_type: validated.schoolEventType ?? null,
        },
      });
      toast({
        title: 'Evento atualizado',
        description: 'As alterações foram salvas.',
      });
      setIsDialogOpen(false);
      setEditingEvent(null);
      resetForm();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o evento.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (eventId: string) => {
    const confirmed = await confirm({
      title: 'Excluir evento',
      description:
        'Este evento será removido da instituição e deixará de aparecer no calendário público.',
      confirmLabel: 'Excluir',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await remove(eventId);
      toast({
        title: 'Evento excluído',
        description: 'O evento foi removido com sucesso.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o evento.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (event: EducationEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startsAt: fromEventIsoToLocalInput(event.starts_at),
      endsAt: event.ends_at ? fromEventIsoToLocalInput(event.ends_at) : '',
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

  const isUpcoming = (dateString: string) => new Date(dateString) > new Date();

  if (isProfileLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Skeleton className="mb-6 h-8 w-1/3" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isProfileError || isEventsError) {
    return (
      <EducationAdminReadError
        title="Não foi possível carregar os eventos"
        error={profileError ?? eventsError}
        onRetry={async () => {
          await Promise.all([refetchProfile(), refetchEvents()]);
        }}
      />
    );
  }

  if (!profile) {
    return (
      <EducationProfileRequiredState
        businessId={businessId}
        title="Configure Educação antes de gerenciar eventos"
        description="Não existe um perfil Education configurado para cadastrar eventos nesta instituição."
      />
    );
  }

  const upcomingEvents = events.filter((event) => isUpcoming(event.starts_at));
  const pastEvents = events.filter((event) => !isUpcoming(event.starts_at));
  const publicEvents = events.filter((event) => event.is_public).length;

  return (
    <div className="container mx-auto max-w-6xl p-6 text-territory-ink">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Voltar para a gestão de Educação"
            className="text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
            onClick={() => (dashboardUrl ? navigate(dashboardUrl) : navigate(-1))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-territory-brand shadow-sm">
            <Calendar className="h-5 w-5 text-territory-on-image" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-territory-ink">Eventos</h1>
            <p className="text-sm text-territory-muted">
              Gerencie eventos e visitas agendadas
            </p>
          </div>
        </div>
        <Button
          onClick={openNewDialog}
          className="gap-2 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
          disabled={isEventsBlocked || isLimitBlocked || isMutating}
          title={
            isEventsBlocked
              ? eventsCapability.upgradeMessage
              : isLimitBlocked
                ? canCreateEvent.reason
                : ''
          }
        >
          <Plus className="h-4 w-4" />
          Novo evento
        </Button>
      </motion.div>

      {isEventsBlocked && (
        <div className="mb-6">
          <EducationUpgradeBanner
            nicheKey={profile?.niche_key}
            businessId={businessId || ''}
            reason={
              eventsCapability.reason === 'niche_denied'
                ? 'niche_denied'
                : 'plan_denied'
            }
            feature="events_public"
            variant="banner"
          />
        </div>
      )}

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

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-territory-border bg-territory-surface shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-territory-muted">Total</p>
            <p className="text-2xl font-bold text-territory-ink">{events.length}</p>
          </CardContent>
        </Card>
        <Card className="border-territory-border bg-territory-surface shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-territory-muted">Próximos</p>
            <p className="text-2xl font-bold text-territory-success">
              {upcomingEvents.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-territory-border bg-territory-surface shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-territory-muted">Passados</p>
            <p className="text-2xl font-bold text-territory-muted">
              {pastEvents.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-territory-border bg-territory-surface shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-territory-muted">Públicos</p>
            <p className="text-2xl font-bold text-territory-ink">{publicEvents}</p>
          </CardContent>
        </Card>
      </div>

      {events.length === 0 ? (
        <Card className="border-territory-border bg-territory-surface py-12 text-center shadow-sm">
          <CardContent>
            <Calendar className="mx-auto mb-4 h-12 w-12 text-territory-muted/55" />
            <h3 className="mb-2 text-lg font-medium text-territory-ink">
              Nenhum evento cadastrado
            </h3>
            <p className="mb-4 text-territory-muted">
              Cadastre eventos, visitas abertas e outras atividades.
            </p>
            <Button
              onClick={openNewDialog}
              disabled={isEventsBlocked || isLimitBlocked || isMutating}
              className="bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...events]
            .sort(
              (left, right) =>
                new Date(right.starts_at).getTime() -
                new Date(left.starts_at).getTime(),
            )
            .map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`border-territory-border bg-territory-surface shadow-sm ${
                    isUpcoming(event.starts_at) ? '' : 'opacity-60'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-territory-ink">
                            {event.title}
                          </h3>
                          {isUpcoming(event.starts_at) ? (
                            <Badge className="border-territory-success/25 bg-territory-success/10 text-territory-success hover:bg-territory-success/15">
                              Em breve
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="border-territory-border bg-territory-raised text-territory-muted"
                            >
                              Concluído
                            </Badge>
                          )}
                          {event.school_event_type &&
                            profile?.niche_key === 'regular_school' && (
                              <Badge
                                variant="secondary"
                                className="gap-1 border-territory-brand/25 bg-territory-brand/10 text-territory-brand"
                              >
                                {SCHOOL_EVENT_TYPE_LABELS[event.school_event_type]}
                              </Badge>
                            )}
                          {event.is_public ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-territory-border text-territory-muted"
                            >
                              <Globe className="h-3 w-3" />
                              Público
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 border-territory-border text-territory-muted"
                            >
                              <Lock className="h-3 w-3" />
                              Privado
                            </Badge>
                          )}
                        </div>

                        {event.description && (
                          <p className="mb-2 line-clamp-2 text-sm text-territory-muted">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm text-territory-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(event.starts_at)}
                            {event.ends_at && ` - ${formatDate(event.ends_at)}`}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Ações do evento ${event.title}`}
                            disabled={isMutating}
                            className="text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={isMutating}
                            onClick={() => openEditDialog(event)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isMutating}
                            onClick={() => handleDelete(event.id)}
                            className="text-territory-error focus:text-territory-error"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (isMutating && !open) return;
          setIsDialogOpen(open);
          if (!open) setEditingEvent(null);
        }}
      >
        <DialogContent className="max-w-lg border-territory-border bg-territory-surface text-territory-ink">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar evento' : 'Novo evento'}
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
                onChange={(event) =>
                  setFormData({ ...formData, title: event.target.value })
                }
                placeholder="Ex: Visita Aberta 2024"
                maxLength={EDUCATION_EVENT_TITLE_MAX_LENGTH}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                placeholder="Descreva o evento..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startsAt">Início *</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(event) =>
                    setFormData({ ...formData, startsAt: event.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="endsAt">Término</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(event) =>
                    setFormData({ ...formData, endsAt: event.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(event) =>
                  setFormData({ ...formData, location: event.target.value })
                }
                placeholder="Ex: Auditório Principal"
                maxLength={EDUCATION_EVENT_LOCATION_MAX_LENGTH}
              />
            </div>

            <div>
              <Label htmlFor="schoolEventType">Tipo de evento</Label>
              <select
                id="schoolEventType"
                value={formData.schoolEventType}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    schoolEventType: event.target.value as SchoolEventType | '',
                  })
                }
                className={selectClassName}
              >
                <option value="">Selecione o tipo...</option>
                {SCHOOL_EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-territory-border bg-territory-raised/70 p-3">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked })
                }
              />
              <Label htmlFor="isPublic">Evento público (visível na página)</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isMutating}
                className="flex-1 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
              >
                {isCreating || isUpdating
                  ? 'Salvando...'
                  : editingEvent
                    ? 'Salvar alterações'
                    : 'Criar evento'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
                disabled={isMutating}
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
