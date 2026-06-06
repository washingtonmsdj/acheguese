import React from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Calendar } from "@/shared/components/ui/calendar";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";
import { toast } from "sonner";
import { buildTelUrl, buildWhatsAppUrl, openContactUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";

interface BookingButtonProps {
  businessId: string;
  businessName: string;
  businessPhone?: string;
  businessWhatsApp?: string;
  services?: Array<{
    id: string;
    name: string;
    duracao?: string;
    price?: number;
  }>;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function BookingButton({
  businessId,
  businessName,
  businessPhone,
  businessWhatsApp,
  services = [],
  variant = "default",
  size = "lg",
  className,
}: BookingButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    observacoes: "",
  });

  const availableTimes = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Agendamento solicitado com sucesso!", {
        description: "Você receberá uma confirmação em breve.",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      setFormData({
        name: "",
        phone: "",
        email: "",
        service: "",
        observacoes: "",
      });
      setDate(undefined);
      setTime("");
      setOpen(false);
    } catch {
      toast.error("Erro ao agendar", {
        description: "Tente novamente ou entre em contato diretamente.",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppBooking = () => {
    if (!businessWhatsApp) {
      toast.error("WhatsApp não disponível para agendamento");
      return;
    }

    const message =
      `Olá! Gostaria de agendar um horário na ${businessName}.\n\n` +
      `*Nome:* ${formData.name || "[Preencher]"}\n` +
      `*Telefone:* ${formData.phone || "[Preencher]"}\n` +
      `*Data:* ${date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "[Escolher]"}\n` +
      `*Horário:* ${time || "[Escolher]"}\n` +
      `*Serviço:* ${formData.service || "[Escolher]"}\n` +
      `*Observações:* ${formData.observacoes || "Nenhuma"}`;

    const url = buildWhatsAppUrl(businessWhatsApp, message);
    if (url) openSafeExternalUrl(url, { context: "business-booking-whatsapp" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2 font-semibold", className)}
        >
          <CalendarIcon className="h-4 w-4" />
          Agendar Horário
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Agendar Horário
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Agende um horário na {businessName}
          </p>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Agendar um horário com esta empresa
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  <User className="h-3 w-3 inline mr-1" />
                  Nome *
                </Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">
                  <Phone className="h-3 w-3 inline mr-1" />
                  Telefone *
                </Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                <Mail className="h-3 w-3 inline mr-1" />
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          {services.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="service" className="text-sm">
                Serviço desejado
              </Label>
              <Select
                value={formData.service}
                onValueChange={(value) =>
                  setFormData({ ...formData, service: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                      {service.price && ` - ${formatBrl(service.price)}`}
                      {service.duracao && ` (${service.duracao})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <CalendarIcon className="h-3 w-3" />
                Data do agendamento *
              </Label>
              <div className="border rounded-md p-3">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date() || d.getDay() === 0}
                  className="w-full"
                  locale={ptBR}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Horário *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={time === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTime(t)}
                    className="h-9"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Alguma observação especial ou necessidade específica..."
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Confirmação necessária
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Seu agendamento será confirmado pela empresa em até 24 horas.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              disabled={
                loading || !date || !time || !formData.name || !formData.phone
              }
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Solicitar Agendamento
                </>
              )}
            </Button>

            {businessWhatsApp && (
              <Button
                type="button"
                variant="outline"
                onClick={handleWhatsAppBooking}
                className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                disabled={!date || !time}
              >
                <Phone className="h-4 w-4" />
                Agendar pelo WhatsApp
              </Button>
            )}

            {businessPhone && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = buildTelUrl(businessPhone);
                  openContactUrl(url);
                }}
                className="text-sm"
              >
                <Phone className="h-3 w-3 mr-1" />
                Ligar para confirmar disponibilidade
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
