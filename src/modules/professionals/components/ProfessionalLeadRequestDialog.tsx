import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/shared/hooks/use-toast";
import { ProfessionalLeadService } from "@/core/professional/services";
import { useSessionContext } from "@/core/session";

interface ProfessionalLeadRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
  defaultService?: string | null;
  sourceChannel?: "public_profile" | "service_profile" | "central" | string;
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
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await ProfessionalLeadService.createLead({
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
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast({
        title: "Não foi possível enviar",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pedido enviado",
      description: user
        ? `${professionalName} recebeu sua solicitação. Você pode acompanhar o status.`
        : `${professionalName} recebeu sua solicitação de orçamento.`,
    });
    resetForm();
    onOpenChange(false);

    if (user && result.data?.id) {
      navigate(`/servicos/orcamentos/${result.data.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefone ou WhatsApp</Label>
              <Input
                id="lead-phone"
                value={formData.requesterPhone}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    requesterPhone: event.target.value,
                  }))
                }
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
                placeholder="Bairro do atendimento"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Informe telefone ou email. O profissional recebe o pedido dentro da
            central, com histórico e status para acompanhamento.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
