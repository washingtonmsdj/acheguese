/**
 * EVENT CHECK-IN
 * 
 * Sistema de check-in digital para eventos
 * QR Code para entrada e certificado de participação
 * 
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  CheckCircle, 
  Download, 
  Share2,
  Award,
  Calendar,
  MapPin,
  Clock,
  X
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import QRCodeLib from 'qrcode';
import { useToast } from '@/shared/hooks/use-toast';
import { useSessionContext } from '@/core/session';
import { eventRuntimeService } from '@/core/community-events';
import type { Event } from '../types';

interface EventCheckinProps {
  event: Event;
}

export function EventCheckin({ event }: EventCheckinProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkinTime, setCheckinTime] = useState<string>('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(false);
  const { toast } = useToast();
  const { activeProfile } = useSessionContext();

  // Check if already checked in (backend)
  useEffect(() => {
    let mounted = true;

    async function loadCheckinStatus() {
      if (!activeProfile?.id) {
        if (mounted) {
          setIsCheckedIn(false);
          setCheckinTime('');
        }
        return;
      }

      const checkedInAt = await eventRuntimeService.getCheckInStatus(
        event.id,
        activeProfile.id
      );

      if (mounted) {
        setIsCheckedIn(Boolean(checkedInAt));
        setCheckinTime(checkedInAt ?? '');
      }
    }

    loadCheckinStatus();

    return () => {
      mounted = false;
    };
  }, [event.id, activeProfile?.id]);

  // Generate QR Code
  const generateQRCode = async () => {
    if (!activeProfile?.id) {
      toast({
        title: 'Faça login para check-in',
        description: 'Entre com sua conta para gerar o QR Code oficial.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const participating = await eventRuntimeService.isParticipating(
        event.id,
        activeProfile.id
      );
      if (!participating) {
        toast({
          title: 'Inscrição necessária',
          description: 'Garanta sua vaga antes de gerar o QR de check-in.',
          variant: 'destructive',
        });
        return;
      }

      const checkinCode = await eventRuntimeService.getParticipantCheckinCode(
        event.id,
        activeProfile.id
      );

      const checkinData = {
        eventId: event.id,
        eventTitle: event.title,
        profileId: activeProfile.id,
        profileName: activeProfile.name ?? '',
        checkinCode,
        timestamp: new Date().toISOString(),
      };

      const qr = await QRCodeLib.toDataURL(JSON.stringify(checkinData), {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeUrl(qr);
      setShowQRCode(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  // Perform check-in (backend)
  const handleCheckin = async () => {
    if (!activeProfile?.id) {
      toast({
        title: 'Faça login para check-in',
        description: 'Entre com sua conta para confirmar presença.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingCheckin(true);
    try {
      const participating = await eventRuntimeService.isParticipating(
        event.id,
        activeProfile.id
      );
      if (!participating) {
        toast({
          title: 'Inscrição necessária',
          description: 'Garanta sua vaga antes de fazer check-in.',
          variant: 'destructive',
        });
        return;
      }

      const checkedInAt = await eventRuntimeService.checkInEvent(
        event.id,
        activeProfile.id
      );

      setIsCheckedIn(true);
      setCheckinTime(checkedInAt);
      setShowQRCode(false);
      toast({
        title: 'Check-in confirmado',
        description: 'Seu check-in foi registrado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Falha no check-in',
        description: error instanceof Error ? error.message : 'Não foi possível concluir o check-in.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCheckin(false);
    }
  };

  // Generate certificate
  const generateCertificate = () => {
    setShowCertificate(true);
  };

  // Download certificate
  const downloadCertificate = () => {
    // In production, generate a proper PDF certificate
    const certificateText = `
CERTIFICADO DE PARTICIPAÇÃO

Certificamos que você participou do evento:

${event.title}

Data: ${new Date(event.start_date).toLocaleDateString('pt-BR')}
Local: ${event.location.venue_name || event.location.city}

Check-in realizado em: ${new Date(checkinTime).toLocaleString('pt-BR')}

Achegue-se - Plataforma de Eventos
    `.trim();

    const blob = new Blob([certificateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificado-${event.slug}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Check-in Digital</h3>
        </div>
        {isCheckedIn && (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Confirmado
          </Badge>
        )}
      </div>

      {!isCheckedIn ? (
        <>
          {/* Pre Check-in */}
          <p className="mb-4 text-sm text-muted-foreground">
            Faça o check-in no evento para confirmar sua presença e receber seu certificado de participação.
          </p>

          <div className="space-y-3">
            <Button
              onClick={generateQRCode}
              className="w-full gap-2"
              size="lg"
              disabled={isLoadingCheckin}
            >
              <QrCode className="h-5 w-5" />
              Gerar QR Code para Check-in
            </Button>

            <Button
              onClick={handleCheckin}
              variant="outline"
              className="w-full gap-2"
              size="lg"
              disabled={isLoadingCheckin}
            >
              <CheckCircle className="h-5 w-5" />
              {isLoadingCheckin ? 'Confirmando...' : 'Fazer Check-in Manual'}
            </Button>
          </div>

          {/* Info */}
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Dica:</strong> Apresente o QR Code na entrada do evento ou faça o check-in manual quando chegar.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Post Check-in */}
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Check-in realizado!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              {new Date(checkinTime).toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Certificate */}
          <div className="space-y-3">
            <Button
              onClick={generateCertificate}
              className="w-full gap-2"
              size="lg"
            >
              <Award className="h-5 w-5" />
              Ver Certificado
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={downloadCertificate}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowQRCode(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowQRCode(false)}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="p-6">
                  <h3 className="mb-4 text-center text-xl font-bold text-foreground">
                    QR Code de Check-in
                  </h3>

                  <div className="mb-4 flex justify-center">
                    <div className="rounded-xl border-4 border-border bg-white p-4">
                      <img src={qrCodeUrl} alt="QR Code" className="h-64 w-64" />
                    </div>
                  </div>

                  <p className="mb-4 text-center text-sm text-muted-foreground">
                    Apresente este QR Code na entrada do evento
                  </p>

                  <Button
                    onClick={handleCheckin}
                    className="w-full gap-2"
                    size="lg"
                    disabled={isLoadingCheckin}
                  >
                    <CheckCircle className="h-5 w-5" />
                    {isLoadingCheckin ? 'Confirmando...' : 'Confirmar Check-in'}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCertificate(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowCertificate(false)}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Certificate Design */}
                <div className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 p-8">
                  <div className="rounded-xl border-4 border-primary/20 bg-white p-8 dark:bg-card">
                    {/* Header */}
                    <div className="mb-6 text-center">
                      <Award className="mx-auto mb-3 h-16 w-16 text-primary" />
                      <h2 className="mb-2 text-3xl font-bold text-foreground">
                        Certificado de Participação
                      </h2>
                      <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary to-purple-600" />
                    </div>

                    {/* Content */}
                    <div className="mb-6 space-y-4 text-center">
                      <p className="text-muted-foreground">
                        Certificamos que você participou do evento:
                      </p>
                      <h3 className="text-2xl font-bold text-foreground">
                        {event.title}
                      </h3>
                      
                      <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.start_date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location.venue_name || event.location.city}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Check-in: {new Date(checkinTime).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border pt-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        Achegue-se - Plataforma de Eventos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Certificado gerado em {new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-4">
                  <Button
                    onClick={downloadCertificate}
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
