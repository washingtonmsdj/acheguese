/**
 * 🔗 EVENT SHARE MODAL
 * 
 * Modal para compartilhar evento em redes sociais
 * Inclui WhatsApp, Facebook, Twitter, Instagram e QR Code
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Share2, 
  Copy, 
  Check,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  QrCode,
  Mail
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';
import QRCode from 'qrcode';
import { openSafeExternalUrl } from '@/shared/utils/safeRedirect';

interface EventShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventUrl: string;
  eventDescription?: string;
}

export function EventShareModal({ 
  isOpen, 
  onClose, 
  eventTitle, 
  eventUrl,
  eventDescription 
}: EventShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);

  const fullUrl = `${window.location.origin}${eventUrl}`;
  const shareText = `Confira este evento: ${eventTitle}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleGenerateQRCode = async () => {
    try {
      const qr = await QRCode.toDataURL(fullUrl, {
        width: 300,
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

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${fullUrl}`)}`;
        openSafeExternalUrl(url, { context: 'event-share-whatsapp' });
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
        openSafeExternalUrl(url, { context: 'event-share-facebook' });
      },
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
        openSafeExternalUrl(url, { context: 'event-share-twitter' });
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-slate-600 hover:bg-slate-700',
      action: () => {
        const subject = encodeURIComponent(eventTitle);
        const body = encodeURIComponent(`${eventDescription || shareText}\n\n${fullUrl}`);
        window.location.assign(`mailto:?subject=${subject}&body=${body}`);
      },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-border bg-muted/30 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Compartilhar evento
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Convide seus amigos
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!showQRCode ? (
                  <>
                    {/* Social Share Buttons */}
                    <div className="mb-6">
                      <p className="mb-3 text-sm font-semibold text-foreground">
                        Compartilhar em:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {shareOptions.map((option) => (
                          <motion.button
                            key={option.name}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={option.action}
                            className={cn(
                              "flex items-center gap-3 rounded-xl p-4 text-white transition-colors",
                              option.color
                            )}
                          >
                            <option.icon className="h-5 w-5" />
                            <span className="font-semibold">{option.name}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Copy Link */}
                    <div className="mb-4">
                      <p className="mb-3 text-sm font-semibold text-foreground">
                        Ou copie o link:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={fullUrl}
                          readOnly
                          className="flex-1 bg-muted"
                        />
                        <Button
                          onClick={handleCopyLink}
                          className="gap-2"
                          variant={copied ? 'default' : 'outline'}
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* QR Code Button */}
                    <Button
                      onClick={handleGenerateQRCode}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      Gerar QR Code
                    </Button>
                  </>
                ) : (
                  <>
                    {/* QR Code Display */}
                    <div className="text-center">
                      <p className="mb-4 text-sm text-muted-foreground">
                        Escaneie o QR Code para acessar o evento
                      </p>
                      <div className="mb-4 flex justify-center">
                        <div className="rounded-xl border-2 border-border bg-white p-4">
                          <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="h-64 w-64"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowQRCode(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Voltar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
