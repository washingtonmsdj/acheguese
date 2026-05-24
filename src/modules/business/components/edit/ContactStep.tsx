import { ArrowRight, Building2, Globe, Home, Truck } from "lucide-react";
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

const MODOS_ATENDIMENTO = [
  { id: "presencial", label: "Presencial", icon: Building2 },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "domicilio", label: "A domicílio", icon: Home },
  { id: "online", label: "Online", icon: Globe },
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
          Contato e localização
        </CardTitle>
        <CardDescription>Atualize como clientes e moradores encontram seu negócio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="(71) 99999-9999"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => onWhatsappChange(e.target.value)}
              placeholder="(71) 99999-9999"
            />
            {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="contato@empresa.com.br"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço completo</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Rua, número, bairro, cidade"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              Usada para posicionar no mapa da cidade.
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
              Usada para posicionar no mapa da cidade.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Modos de atendimento</Label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MODOS_ATENDIMENTO.map((modo) => {
              const Icon = modo.icon;
              return (
                <label key={modo.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <Checkbox
                    checked={selectedModos.includes(modo.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onModosChange(Array.from(new Set([...selectedModos, modo.id])));
                        return;
                      }
                      onModosChange(selectedModos.filter((m) => m !== modo.id));
                    }}
                  />
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {modo.label}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.modos_atendimento && <p className="text-xs text-destructive">{errors.modos_atendimento}</p>}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button type="button" onClick={onNext} className="flex-1 gap-2">
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
