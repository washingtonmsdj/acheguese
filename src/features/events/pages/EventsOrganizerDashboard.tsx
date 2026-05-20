import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plus, Calendar, Home, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useToast } from '@/shared/hooks/use-toast';
import type { EventStatus } from '../types';
import { useSessionContext } from '@/core/session/hooks/useSessionContext';
import {
  communityEventsRuntimeService,
  type EventParticipantRow,
} from '@/core/community/services/CommunityEventsRuntimeService';
import { parseEventCheckinQrPayload } from '../utils/checkinQr';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';
import {
  filterOrganizerEvents,
  getOrganizerDashboardStats,
  type OrganizerParticipant,
} from './EventsOrganizerDashboard.model';
import {
  EventsOrganizerFiltersSection,
  EventsOrganizerListSection,
  EventsOrganizerStatsSection,
} from './EventsOrganizerDashboardSections';

export default function EventsOrganizerDashboard() {
  const navigate = useNavigate();
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [checkInLoadingProfileId, setCheckInLoadingProfileId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [qrPayloadInput, setQrPayloadInput] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerBusy, setScannerBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const scanningLockRef = useRef(false);
  const recentPayloadsRef = useRef<Set<string>>(new Set());

  const [participants, setParticipants] = useState<OrganizerParticipant[]>([]);

  const { data: organizerEvents = [] } = useQuery({
    queryKey: ['events-organizer-dashboard', activeProfile?.id],
    enabled: Boolean(activeProfile?.id),
    queryFn: async () => {
      if (!activeProfile?.id) return [];
      const rows = await communityEventsRuntimeService.getEventsByOrganizerProfile(activeProfile.id, 200);
      return rows.map(mapCommunityEventToEvent);
    },
  });

  const filteredEvents = useMemo(
    () => filterOrganizerEvents(organizerEvents, search, statusFilter),
    [organizerEvents, search, statusFilter],
  );

  const stats = useMemo(() => getOrganizerDashboardStats(organizerEvents), [organizerEvents]);

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
    alert(`Duplicar evento ${eventId}`);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      alert(`Excluir evento ${eventId}`);
    }
  };

  const handleExportData = () => {
    alert('Exportar dados');
  };

  const handleViewAnalytics = (eventId: string) => {
    navigate(`/central/eventos/analytics/${eventId}`);
  };

  const handleViewParticipants = async (eventId: string, eventTitle: string) => {
    setParticipantsOpen(true);
    setParticipantsLoading(true);
    setSelectedEventId(eventId);
    setSelectedEventTitle(eventTitle);
    setParticipants([]);

    try {
      const rows = await communityEventsRuntimeService.getEventParticipants(eventId);
      const mapped = rows.map((row: EventParticipantRow) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          id: row.profile_id ?? profile?.id ?? '',
          name: profile?.name ?? 'Participante',
          avatarUrl: profile?.avatar_url ?? null,
          checkedInAt: row.checked_in_at ?? null,
          joinedAt: row.joined_at ?? null,
        };
      });
      setParticipants(mapped.filter((item) => item.id));
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleOrganizerCheckIn = useCallback(async (profileId: string) => {
    if (!selectedEventId) return;

    setCheckInLoadingProfileId(profileId);
    try {
      const checkedInAt = await communityEventsRuntimeService.checkInEvent(selectedEventId, profileId);
      setParticipants((prev) =>
        prev.map((participant) =>
          participant.id === profileId
            ? { ...participant, checkedInAt }
            : participant
        )
      );
      toast({
        title: 'Check-in confirmado',
        description: 'Participante marcado como presente.',
      });
    } catch (error) {
      toast({
        title: 'Falha ao confirmar check-in',
        description: error instanceof Error ? error.message : 'Não foi possível confirmar o check-in.',
        variant: 'destructive',
      });
    } finally {
      setCheckInLoadingProfileId(null);
    }
  }, [selectedEventId, toast]);

  const handleCheckInFromQrPayload = async () => {
    if (!selectedEventId) return;
    if (!qrPayloadInput.trim()) {
      toast({
        title: 'Payload vazio',
        description: 'Cole o conteúdo do QR Code para validar.',
        variant: 'destructive',
      });
      return;
    }

    let parsedUnknown: unknown;
    try {
      parsedUnknown = JSON.parse(qrPayloadInput);
    } catch {
      toast({
        title: 'QR inválido',
        description: 'O conteúdo informado não é um JSON válido.',
        variant: 'destructive',
      });
      return;
    }
    let parsed;
    try {
      parsed = parseEventCheckinQrPayload(parsedUnknown);
    } catch (error) {
      toast({
        title: 'QR inválido',
        description: error instanceof Error ? error.message : 'Formato inválido.',
        variant: 'destructive',
      });
      return;
    }
    if (parsed.eventId !== selectedEventId) {
      toast({
        title: 'Evento não confere',
        description: 'Este QR pertence a outro evento.',
        variant: 'destructive',
      });
      return;
    }

    setCheckInLoadingProfileId('__qr__');
    try {
      const result = await communityEventsRuntimeService.checkInEventByCode(
        selectedEventId,
        parsed.checkinCode
      );
      setParticipants((prev) =>
        prev.map((participant) =>
          participant.id === result.profileId
            ? { ...participant, checkedInAt: result.checkedInAt }
            : participant
        )
      );
      toast({
        title: 'Check-in confirmado',
        description: 'Participante marcado como presente via QR.',
      });
    } catch (error) {
      toast({
        title: 'Falha ao validar QR',
        description: error instanceof Error ? error.message : 'Não foi possível validar o QR.',
        variant: 'destructive',
      });
    } finally {
      setCheckInLoadingProfileId(null);
    }
  };

  const stopScanner = useCallback(() => {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    scanningLockRef.current = false;
    setScannerBusy(false);
  }, []);

  const processQrRawValue = useCallback(async (rawValue: string) => {
    if (scanningLockRef.current) return;
    const trimmed = rawValue.trim();
    if (!trimmed || recentPayloadsRef.current.has(trimmed)) return;

    let parsedUnknown: unknown;
    try {
      parsedUnknown = JSON.parse(trimmed);
    } catch {
      return;
    }

    let payload;
    try {
      payload = parseEventCheckinQrPayload(parsedUnknown);
    } catch {
      return;
    }
    if (!selectedEventId || payload.eventId !== selectedEventId) return;

    scanningLockRef.current = true;
    setScannerBusy(true);
    recentPayloadsRef.current.add(trimmed);
    try {
      const result = await communityEventsRuntimeService.checkInEventByCode(
        selectedEventId,
        payload.checkinCode
      );
      setParticipants((prev) =>
        prev.map((participant) =>
          participant.id === result.profileId
            ? { ...participant, checkedInAt: result.checkedInAt }
            : participant
        )
      );
      toast({
        title: 'Check-in confirmado',
        description: 'Participante marcado como presente via scanner.',
      });
      setScannerOpen(false);
      stopScanner();
    } catch (error) {
      toast({
        title: 'Falha ao validar QR',
        description: error instanceof Error ? error.message : 'Não foi possível validar o QR.',
        variant: 'destructive',
      });
    } finally {
      scanningLockRef.current = false;
      setScannerBusy(false);
    }
  }, [selectedEventId, stopScanner, toast]);

  useEffect(() => {
    setScannerSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner();
      return;
    }
    if (!scannerSupported) {
      setScannerError('Leitura por câmera não suportada neste navegador.');
      return;
    }

    let cancelled = false;
    setScannerError(null);

    const start = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = mediaStream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();

        const DetectorCtor = (window as unknown as {
          BarcodeDetector?: new (options?: { formats?: string[] }) => {
            detect: (input: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
          };
        }).BarcodeDetector;
        if (!DetectorCtor) {
          setScannerError('Leitura por câmera não suportada neste navegador.');
          return;
        }

        const detector = new DetectorCtor({ formats: ['qr_code'] });

        const scanLoop = async () => {
          if (cancelled || !videoRef.current || !scannerOpen) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            for (const barcode of barcodes) {
              if (barcode.rawValue) {
                await processQrRawValue(barcode.rawValue);
              }
            }
          } catch {
            void 0;
          }
          scanFrameRef.current = requestAnimationFrame(scanLoop);
        };
        scanFrameRef.current = requestAnimationFrame(scanLoop);
      } catch (error) {
        setScannerError(
          error instanceof Error
            ? `Não foi possível acessar a câmera: ${error.message}`
            : 'Não foi possível acessar a câmera.'
        );
      }
    };

    start();
    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [processQrRawValue, scannerOpen, scannerSupported, stopScanner]);
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

        <EventsOrganizerStatsSection stats={stats} />

        <EventsOrganizerFiltersSection
          onExportData={handleExportData}
          search={search}
          setSearch={setSearch}
          setStatusFilter={setStatusFilter}
          statusFilter={statusFilter}
        />

        <EventsOrganizerListSection
          events={filteredEvents}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
          onDuplicateEvent={handleDuplicateEvent}
          onEditEvent={handleEditEvent}
          onViewAnalytics={handleViewAnalytics}
          onViewEvent={handleViewEvent}
          onViewParticipants={handleViewParticipants}
          search={search}
        />
      </div>

      <Dialog open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Participantes - {selectedEventTitle}</DialogTitle>
          </DialogHeader>
          {participantsLoading ? (
            <p className="text-sm text-muted-foreground">Carregando participantes...</p>
          ) : participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum participante inscrito ainda.</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-xs font-medium text-foreground">Check-in via QR (colar payload)</p>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      setScannerError(null);
                      setScannerOpen(true);
                    }}
                    disabled={!scannerSupported}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Abrir câmera
                  </Button>
                  {!scannerSupported && (
                    <span className="text-xs text-muted-foreground">
                      Câmera não suportada neste navegador.
                    </span>
                  )}
                </div>
                <Textarea
                  value={qrPayloadInput}
                  onChange={(e) => setQrPayloadInput(e.target.value)}
                  placeholder='{"eventId":"...","checkinCode":"..."}'
                  className="min-h-[80px] text-xs"
                />
                <div className="mt-2">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={handleCheckInFromQrPayload}
                    disabled={checkInLoadingProfileId === '__qr__'}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    {checkInLoadingProfileId === '__qr__'
                      ? 'Validando...'
                      : 'Validar QR e Confirmar'}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{participants.length}</span> inscritos
                {' • '}
                <span className="font-medium text-foreground">
                  {participants.filter((participant) => participant.checkedInAt).length}
                </span>{' '}
                check-ins confirmados
              </div>
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <img
                    src={participant.avatarUrl || '/placeholder.svg'}
                    alt={participant.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {participant.checkedInAt
                        ? `Check-in: ${new Date(participant.checkedInAt).toLocaleString('pt-BR')}`
                        : 'Check-in pendente'}
                    </p>
                  </div>
                  <Badge variant={participant.checkedInAt ? 'default' : 'secondary'}>
                    {participant.checkedInAt ? 'Check-in OK' : 'Pendente'}
                  </Badge>
                  {!participant.checkedInAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleOrganizerCheckIn(participant.id)}
                      disabled={checkInLoadingProfileId === participant.id}
                    >
                      {checkInLoadingProfileId === participant.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <QrCode className="h-3 w-3" />
                      )}
                      Confirmar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={scannerOpen} onOpenChange={(open) => { setScannerOpen(open); if (!open) stopScanner(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scanner de QR do evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-border bg-black">
              <video ref={videoRef} className="h-72 w-full object-cover" playsInline muted />
            </div>
            {scannerBusy && (
              <p className="text-xs text-muted-foreground">Processando QR detectado...</p>
            )}
            {scannerError && (
              <p className="text-xs text-destructive">{scannerError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Aponte a câmera para o QR de check-in do participante. A confirmação é automática quando o QR for válido para este evento.
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
