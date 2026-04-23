import { Building2, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { DRIVER_STATUS } from "@/shared/types/constants";
const modosAtendimento = [
  { id: "presencial", label: "Presencial", icon: "🏪" },
  { id: "delivery", label: "Delivery", icon: "🚚" },
  { id: "domicilio", label: "A domicílio", icon: "🏠" },
  { id: DRIVER_STATUS.ONLINE, label: "Online", icon: "🌐" },
];

interface ContactStepProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  whatsapp: string;
  onWhatsappChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  latitude?: number;
  onLatitudeChange: (value: number | undefined) => void;
  longitude?: number;
  onLongitudeChange: (value: number | undefined) => void;
  schedules: string;
  onSchedulesChange: (value: string) => void;
  selectedModos: string[];
  onModosChange: (modos: string[]) => void;
  errors: Record<string, string>;
  onBack: () => void;
  onNext: () => void;
}

export function ContactStep({
  phone,
  onPhoneChange,
  whatsapp,
  onWhatsappChange,
  email,
  onEmailChange,
  address,
  onAddressChange,
  latitude,
  onLatitudeChange,
  longitude,
  onLongitudeChange,
  schedules,
  onSchedulesChange,
  selectedModos,
  onModosChange,
  errors,
  onBack,
  onNext,
}: ContactStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Contato e Localização
        </CardTitle>
        <CardDescription>Como os clientes podem te encontrar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="(71) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => onWhatsappChange(e.target.value)}
              placeholder="(71) 99999-9999"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="contato@empresa.com"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço Completo</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={latitude ?? ""}
              onChange={(e) => onLatitudeChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="-12.9714"
            />
            <p className="text-xs text-muted-foreground">
              Coordenada para localização no mapa
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={longitude ?? ""}
              onChange={(e) => onLongitudeChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="-38.5014"
            />
            <p className="text-xs text-muted-foreground">
              Coordenada para localização no mapa
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedules">Horários de Funcionamento</Label>
          <Input
            id="schedules"
            value={schedules}
            onChange={(e) => onSchedulesChange(e.target.value)}
            placeholder="Ex: Seg-Sex 8h-18h, Sáb 8h-12h"
          />
        </div>

        <div className="space-y-2">
          <Label>Modos de Atendimento</Label>
          <div className="grid grid-cols-2 gap-3">
            {modosAtendimento.map((modo) => (
              <div key={modo.id} className="flex items-center space-x-2">
                <Checkbox
                  id={modo.id}
                  checked={selectedModos.includes(modo.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onModosChange([...selectedModos, modo.id]);
                    } else {
                      onModosChange(selectedModos.filter((m) => m !== modo.id));
                    }
                  }}
                />
                <label
                  htmlFor={modo.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {modo.icon} {modo.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button onClick={onNext} className="flex-1 gap-2">
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
