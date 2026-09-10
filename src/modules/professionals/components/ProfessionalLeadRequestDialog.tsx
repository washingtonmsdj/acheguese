import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { TurnstileWidget } from "@/shared/components/security/TurnstileWidget";
import { useToast } from "@/shared/hooks/use-toast";
import {
  ProfessionalLeadIntakeService,
  type ProfessionalLeadSourceChannel,
} from "@/core/professional/services";
import { useSessionContext } from "@/core/session";
import { PROFESSIONAL_LEAD_INTAKE_CLIENT_CONTRACT } from "@/core/professional/contracts/ProfessionalLeadIntakeContract";

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();

interface ProfessionalLeadRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
  defaultService?: string | null;
  sourceChannel?: ProfessionalLeadSourceChannel;
}

export function ProfessionalLeadRequestDialog({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  defaultService,
  sourceChannel = "public_profile",
}: ProfessionalLeadRequestDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useSessionContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [turnstileGeneration, setTurnstileGeneration] = useState(0);
  const mountedAtRef = useRef(Date.now());
  const [formData, setFormData] = useState({
    requesterName: "",
    requesterPhone: "",
    requesterEmail: "",
    serviceNeeded: defaultService ?? "",
    description: "",
    preferredDate: "",
    preferredTimeWindow: "",
    neighborhood: "",
  });

  const turnstileConfigured = TURNSTILE_SITE_KEY.length > 0;
  const turnstileSatisfied = turnstileConfigured && Boolean(turnstileToken);

  useEffect(() => {
    if (!open) return;
    mountedAtRef.current = Date.now();
    setHoneypot("");
    setTurnstileToken(null);
    setTurnstileError(null);
    setTurnstileGeneration((current) => current + 1);
  }, [open]);

  const resetForm = () => {
    setFormData({
      requesterName: "",
      requesterPhone: "",
      requesterEmail: "",
      serviceNeeded: defaultService ?? "",
      description: "",
      preferredDate: "",
      preferredTimeWindow: "",
      neighborhood: "",
    });
    setHoneypot("");
  };

  const resetTurnstile = () => {
    setTurnstileToken(null);
    setTurnstileGeneration((current) => current + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (
      Date.now() - mountedAtRef.current <
      PROFESSIONAL_LEAD_INTAKE_CLIENT_CONTRACT.minimumFillMs
    ) {
      toast({
        title: "Aguarde um instante",
        description: "Confira os dados do pedido antes de enviar.",
      });
      return;
    }

    if (!formData.requesterPhone.trim() && !formData.requesterEmail.trim()) {
      toast({
        title: "Informe um contato",
        description: "Adicione telefone/WhatsApp ou email para o profissional responder.",
        variant: "destructive",
      });
      return;
    }

    if (
      PROFESSIONAL_LEAD_INTAKE_CLIENT_CONTRACT.turnstileRequired &&
      !turnstileConfigured
    ) {
      setTurnstileError(
        "Solicitação temporariamente indisponível: proteção anti-spam não configurada.",
      );
      return;
    }

    if (!turnstileToken) {
      setTurnstileError("Confirme a verificação anti-spam antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    const result = await ProfessionalLeadIntakeService.createLead({
      professionalId,
      requesterName: formData.requesterName,
      requesterPhone: formData.requesterPhone || undefined,
      requesterEmail: formData.requesterEmail || undefined,
      serviceNeeded: formData.serviceNeeded,
      description: formData.description,
      preferredDate: formData.preferredDate || undefined,
      preferredTimeWindow: formData.preferredTimeWindow || undefined,
      neighborhood: formData.neighborhood || undefined,
      sourceChannel,
      honeypot,
      turnstileToken,
    });
    setIsSubmitting(false);

    if (!result.success) {
      resetTurnstile();
      setTurnstileError(result.error ?? "Falha na verificação anti-spam.");
      toast({
        title: "Não foi possível enviar",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: result.deduplicated ? "Pedido já recebido" : "Pedido enviado",
      description: result.deduplicated
        ? `${professionalName} já recebeu esta solicitação recentemente.`
        : user
          ? `${professionalName} recebeu sua solicitação. Você pode acompanhar o status.`
          : `${professionalName} recebeu sua solicitação de orçamento.`,
    });
    resetForm();
    resetTurnstile();
    onOpenChange(false);

    if (user && result.data?.id) {
      navigate(`/servicos/orcamentos/${result.data.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar orçamento</DialogTitle>
          <DialogDescription>
            Envie seu pedido para {professionalName}. Seus dados de contato ficam
            registrados no funil seguro do profissional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-requester-name">Seu nome</Label>
              <Input
                id="lead-requester-name"
                value={formData.requesterName}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    requesterName: event.target.value,
                  }))
                }
                required
                minLength={2}
                maxLength={150}
                autoComplete="name"
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefone ou WhatsApp</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={formData.requesterPhone}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    requesterPhone: event.target.value,
                  }))
                }
                maxLength={40}
                autoComplete="tel"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email alternativo</Label>
              <Input
                id="lead-email"
                type="email"
                value={formData.requesterEmail}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    requesterEmail: event.target.value,
                  }))
                }
                maxLength={254}
                autoComplete="email"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-service-needed">Serviço desejado</Label>
              <Input
                id="lead-service-needed"
                value={formData.serviceNeeded}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    serviceNeeded: event.target.value,
                  }))
                }
                required
                minLength={3}
                maxLength={160}
                placeholder="Ex: instalação elétrica"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-description">Explique o que precisa</Label>
            <Textarea
              id="lead-description"
              value={formData.description}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              placeholder="Inclua contexto, urgência, medidas, fotos que pretende enviar ou qualquer detalhe importante."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="lead-preferred-date">Data preferida</Label>
              <Input
                id="lead-preferred-date"
                type="date"
                value={formData.preferredDate}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    preferredDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-time-window">Horário</Label>
              <Input
                id="lead-time-window"
                value={formData.preferredTimeWindow}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    preferredTimeWindow: event.target.value,
                  }))
                }
                maxLength={80}
                placeholder="Manhã, tarde, noite"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-neighborhood">Bairro</Label>
              <Input
                id="lead-neighborhood"
                value={formData.neighborhood}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    neighborhood: event.target.value,
                  }))
                }
                maxLength={120}
                placeholder="Bairro do atendimento"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Informe telefone ou email. O profissional recebe o pedido dentro da
            central, com histórico e status para acompanhamento.
          </p>

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-10000px",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            <label htmlFor="lead-company-website">Não preencha este campo</label>
            <input
              id="lead-company-website"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </div>

          {turnstileConfigured ? (
            <div className="space-y-1.5">
              <TurnstileWidget
                key={turnstileGeneration}
                siteKey={TURNSTILE_SITE_KEY}
                action={PROFESSIONAL_LEAD_INTAKE_CLIENT_CONTRACT.turnstileAction}
                onVerify={(token) => {
                  setTurnstileToken(token);
                  setTurnstileError(null);
                }}
                onExpire={() => setTurnstileToken(null)}
                onError={() => {
                  setTurnstileToken(null);
                  setTurnstileError(
                    "Não foi possível carregar a verificação. Recarregue a página.",
                  );
                }}
              />
              {turnstileError ? (
                <p className="text-xs text-destructive">{turnstileError}</p>
              ) : (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  Verificação anti-spam protegida por Cloudflare.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-destructive">
              Solicitação temporariamente indisponível: proteção anti-spam não configurada.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !turnstileSatisfied}
            >
              {isSubmitting ? "Enviando..." : "Enviar pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
