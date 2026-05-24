import React from "react";

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import {
  AlertTriangle,
  Loader2,
  MapPin,
  ShieldAlert,
  X,
  Shield,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/shared/utils/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { GeolocationService } from '@/core/maps/services/GeolocationService';
import { GamificationService } from "@/core/gamification/services";
import { postService } from "@/core/posts/services"; // ✅ LOTE 8
import { profileService } from "@/core/profiles/services/ProfileService";

const ALERT_TYPES = [
  { id: "tiroteio", label: "Tiroteio", icon: ShieldAlert },
  { id: "assalto", label: "Assalto", icon: ShieldAlert },
  { id: "tentativa_assalto", label: "Tentativa de assalto", icon: AlertTriangle },
  { id: "atividade_suspeita", label: "Atividade suspeita", icon: Shield },
  { id: "acidente", label: "Acidente", icon: AlertTriangle },
  { id: "risco_rua", label: "Risco na rua", icon: AlertTriangle },
  { id: "outro", label: "Outro risco", icon: ShieldAlert },
] as const;

// Blocked words to prevent misuse (police operations, illegal activities, accusations)
const BLOCKED_PATTERNS = [
  // Police operations
  /\bblitz\b/i,
  /\bfiscaliza[çc][aã]o\b/i,
  /\bpol[ií]cia\s+na\s+rua\b/i,
  /\blei\s+seca\b/i,
  /\bopera[çc][aã]o\s+policial\b/i,
  /\brabec[aã]o\b/i,
  /\bbat[iã]da\s+policial\b/i,
  /\bradar\b/i,
  // Criminal facilitation
  /\bfuga\b/i,
  /\besconderijo\b/i,
  /\bponto\s+de\s+venda\b/i,
  /\btr[aá]fico\b/i,
  /\bdrogas?\b/i,
  /\bboca\s+de\s+fumo\b/i,
  // Accusations against specific people/places
  /\bcasa\s+d[eoa]\s+\w+/i,
  /\bmorador\s+d[eoa]\b/i,
  /\b(fulano|ciclano|beltrano)\b/i,
  /\btraficante\b/i,
  /\bcriminoso\b/i,
  /\bbandido\b/i,
  /\bladr[aã]o\b/i,
  /\bsuspeito\s+(é|e|mora)\b/i,
  /\bmarca[rr]\s+(ponto|casa|local)\b/i,
];

function hasBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

function resolveProfileLocationId(profile: unknown): string | null {
  if (!profile || typeof profile !== "object") return null;
  const record = profile as Record<string, unknown>;

  if (typeof record.locationId === "string" && record.locationId) {
    return record.locationId;
  }
  if (typeof record.location_id === "string" && record.location_id) {
    return record.location_id;
  }
  return null;
}

type Step = "rules" | "type" | "details" | "confirm";

interface Props {
  userId: string | undefined;
}

export function PanicAlertButton({ userId }: Props) {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("rules");
  const [alertType, setAlertType] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [gettingLocation, setGettingLocation] = useState(false);
  const [checking, setChecking] = useState(false);
  const selectedAlertType = ALERT_TYPES.find((type) => type.id === alertType);
  const SelectedAlertIcon = selectedAlertType?.icon ?? AlertTriangle;

  const getLocation = useCallback(async () => {
    setGettingLocation(true);
    try {
      const result = await GeolocationService.getCurrentLocation({ useCache: true });
      setLocation({ lat: result.coords.latitude, lng: result.coords.longitude });
    } catch {
      // localização não disponível — alerta continua sem coordenadas
    } finally {
      setGettingLocation(false);
    }
  }, []);

  const handleOpen = () => {
    if (!userId) {
      toast.error("Faça login para send alertas");
      navigate(appUrls.auth.login); // ✅ SSOT
      return;
    }
    setOpen(true);
    setStep("rules");
    setAlertType("");
    setDetails("");
    setLocation(null);
    getLocation();
  };

  const handleSelectType = (type: string) => {
    setAlertType(type);
    setStep("details");
  };

  const handleProceedToConfirm = async () => {
    // Check blocked content
    if (hasBlockedContent(details)) {
      toast.error(
        "Não é permitido divulgar localização de operações policiais ou blitz.",
      );
      return;
    }

    if (!userId) {
      toast.error("Faça login para send alertas de segurança");
      setOpen(false);
      navigate(appUrls.auth.login); // ✅ SSOT
      return;
    }
    setChecking(true);

    try {
      // Check eligibility: account age > 7 days
      const profile = await profileService.getProfileById(userId);

      if (profile?.alert_banned) {
        toast.error(
          "Sua conta foi suspensa de create alertas devido a uso indevido.",
        );
        setOpen(false);
        return;
      }

      const accountAge =
        Date.now() - new Date(profile?.created_at ?? "").getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (accountAge < sevenDays) {
        toast.error(
          "Sua conta precisa ter pelo menos 7 dias para criar alertas.",
        );
        return;
      }

      // Check phone verified
      if (!profile?.telefone || profile.telefone.trim() === "") {
        toast.error(
          "Você precisa ter um telefone cadastrado no perfil para criar alertas.",
        );
        return;
      }

      setStep("confirm");
    } catch {
      toast.error("Error verify elegibilidade");
    } finally {
      setChecking(false);
    }
  };

  const handleSend = async () => {
    if (!userId) {
      toast.error("Faça login para send alertas");
      return;
    }
    setSending(true);
    try {
      const selected = ALERT_TYPES.find((t) => t.id === alertType);
      const texto = `**${selected?.label?.toUpperCase()}** - ${details || "Alerta de risco na região!"}`;

      // ✅ CLEANUP PÓS-SPRINT2: Usar createPost() diretamente
      // userId aqui é author_profile_id (não user_id)
      const profile = await profileService.getProfileById(userId);
      const locationId = resolveProfileLocationId(profile);

      if (!locationId) {
        toast.error("Configure sua localização no perfil antes de enviar alertas.");
        return;
      }

      await postService.createPost({
        author_profile_id: userId,
        content: texto,
        type: "segurança",
        location_id: locationId,
        reach: 'neighborhood',
      });

      // ✅ SSOT - Usar GamificationService para adicionar pontos
      await GamificationService.addPoints(
        userId,
        25,
        "alerta_seguranca",
        "Alerta de segurança enviado",
      );

      toast.success(
        "Alerta enviado! +25 pontos. Vizinhos serão notificados.",
      );
      setOpen(false);
    } catch (err) {
      logger.error(err);
      toast.error("Error send alerta");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex-1 flex items-center gap-2 bg-destructive/10 rounded-xl p-3 hover:bg-destructive/15 transition-colors border border-destructive/20"
      >
        <ShieldAlert className="h-5 w-5 text-destructive" />
        <div className="text-left">
          <p className="text-xs font-semibold text-destructive">Alerta</p>
          <p className="text-[10px] text-muted-foreground">Situação de risco</p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Emergência
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Enviar alerta de emergência para autoridades
          </DialogDescription>

          <AnimatePresence mode="wait">
            {/* Step 1: Rules */}
            {step === "rules" && (
              <motion.div
                key="rules"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">
                      Regras de Uso
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li>
                      Este sistema é destinado{" "}
                      <strong>apenas a alertas de segurança</strong> da
                      comunidade.
                    </li>
                    <li>
                      <strong>Não publique acusações</strong> contra pessoas ou
                      locais específicos.
                    </li>
                    <li>
                      <strong>Não é permitido</strong> divulgar localização de
                      operações policiais, blitz ou qualquer atividade que ajude
                      práticas ilegais.
                    </li>
                    <li>
                      Descreva apenas <strong>o que está acontecendo</strong>,
                      não acuse ninguém.
                    </li>
                    <li>
                      Alertas enviam{" "}
                      <strong>notificações para todos os moradores</strong> do
                      neighborhood e{" "}
                      <strong>expiram automaticamente em 3 times</strong>.
                    </li>
                    <li>
                      Use apenas para{" "}
                      <strong>situações reais de risco no momento</strong>.
                    </li>
                    <li>
                      O uso indevido pode levar à{" "}
                      <strong>suspensão da conta</strong>.
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => setStep("type")}
                  className="w-full"
                  variant="default"
                >
                  Entendi, continuar
                </Button>
              </motion.div>
            )}

            {/* Step 2: Type selection */}
            {step === "type" && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground">
                  Qual o tipo de ocorrência?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_TYPES.map((type) => {
                    const TypeIcon = type.icon;

                    return (
                      <button
                        key={type.id}
                        onClick={() => handleSelectType(type.id)}
                        className="flex items-center gap-2 p-3 rounded-xl border hover:bg-destructive/10 hover:border-destructive/30 transition-all text-left"
                      >
                        <TypeIcon className="h-4 w-4 text-destructive" aria-hidden="true" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setStep("rules")}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  ← Voltar às regras
                </button>
              </motion.div>
            )}

            {/* Step 3: Details */}
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 bg-destructive/10 rounded-lg px-3 py-2">
                  <SelectedAlertIcon className="h-4 w-4 text-destructive" aria-hidden="true" />
                  <span className="text-sm font-semibold text-destructive">
                    {selectedAlertType?.label}
                  </span>
                  <button
                    onClick={() => setStep("type")}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Textarea
                  value={details}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 200);
                    setDetails(val);
                  }}
                  placeholder="Descreva brevemente o que está acontecendo... (opcional)"
                  className="min-h-[80px] resize-none"
                />

                {hasBlockedContent(details) && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-destructive font-medium">
                      Conteúdo bloqueado: Não é permitido divulgar operações
                      policiais, acusar pessoas ou locais específicos.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Apenas o seu <strong>neighborhood</strong> será exibido —
                    nunca a localização exata.
                  </span>
                </div>

                <Button
                  onClick={handleProceedToConfirm}
                  disabled={checking || hasBlockedContent(details)}
                  className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  Continuar
                </Button>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    Tem certeza?
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Alertas de segurança enviam notificações para{" "}
                    <strong>todos os moradores do seu neighborhood</strong>. O
                    alerta <strong>expira automaticamente em 3 times</strong>.
                    Apenas a região (neighborhood) será exibida, não a
                    localização exata. Use apenas para situações reais de risco.
                    O uso indevido pode levar à{" "}
                    <strong>suspensão da sua conta</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <SelectedAlertIcon className="h-4 w-4 text-destructive" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">
                      {selectedAlertType?.label}
                    </p>
                    {details && (
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Confirmar alerta
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
