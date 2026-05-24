import { ArrowRight, Clock3, MapPin, Phone } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { TerritorialSelector } from "@/core/location/components/TerritorialSelector";
import { getBusinessCreateFieldCopy } from "./businessCreateCopy";

interface DayHoursValue {
  open: string;
  close: string;
  closed?: boolean;
}

interface SelectedLocationData {
  stateId: string;
  cityId: string;
  neighborhoodId: string;
  stateName: string;
  cityName: string;
  neighborhoodName: string;
}

interface ContactLocationStepProps {
  category: string;
  phone: string;
  whatsapp: string;
  email: string;
  locationId: string | null;
  locationData: SelectedLocationData | null;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  postalCode: string;
  hours: Record<string, DayHoursValue>;
  selectedModos: string[];
  errors: Record<string, string>;
  onPhoneChange: (value: string) => void;
  onWhatsappChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onLocationChange: (locationId: string | null, locationData: SelectedLocationData | null) => void;
  onAddressStreetChange: (value: string) => void;
  onAddressNumberChange: (value: string) => void;
  onAddressComplementChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onHoursChange: (hours: Record<string, DayHoursValue>) => void;
  onModosChange: (modos: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const MODOS_ATENDIMENTO = [
  { id: "presencial", label: "Atendimento presencial", hint: "Cliente vai até a empresa." },
  { id: "delivery", label: "Delivery", hint: "Entrega de pedidos no endereço do cliente." },
  { id: "domicilio", label: "A domicílio", hint: "Serviço prestado no local do cliente." },
  { id: "online", label: "Online", hint: "Atendimento remoto ou digital." },
];

const DAY_LABELS: Array<{ key: string; label: string }> = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

export function ContactLocationStep({
  category,
  phone,
  whatsapp,
  email,
  locationId,
  locationData,
  addressStreet,
  addressNumber,
  addressComplement,
  postalCode,
  hours,
  selectedModos,
  errors,
  onPhoneChange,
  onWhatsappChange,
  onEmailChange,
  onLocationChange,
  onAddressStreetChange,
  onAddressNumberChange,
  onAddressComplementChange,
  onPostalCodeChange,
  onHoursChange,
  onModosChange,
  onBack,
  onNext,
}: ContactLocationStepProps) {
  const copy = getBusinessCreateFieldCopy(category);

  const handleModoToggle = (modoId: string, checked: boolean) => {
    if (checked) {
      onModosChange(Array.from(new Set([...selectedModos, modoId])));
      return;
    }
    onModosChange(selectedModos.filter((modo) => modo !== modoId));
  };

  const updateDay = (day: string, patch: Partial<DayHoursValue>) => {
    onHoursChange({
      ...hours,
      [day]: {
        ...hours[day],
        ...patch,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Território, contato e operação
        </CardTitle>
        <CardDescription>
          Defina como a empresa aparece territorialmente, onde ela opera e como o cliente entra em contato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Território principal</h3>
          </div>
          <TerritorialSelector
            initialLocationId={locationId}
            onLocationChange={onLocationChange}
          />
          {errors.location_id && <p className="text-xs text-destructive">{errors.location_id}</p>}
          {locationData && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              Exibição pública principal em{" "}
              <span className="font-medium text-foreground">{locationData.neighborhoodName}</span>,{" "}
              {locationData.cityName} - {locationData.stateName}.
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Canais de contato</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                placeholder={copy.phonePlaceholder}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(event) => onWhatsappChange(event.target.value)}
                placeholder={copy.whatsappPlaceholder}
              />
              {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email comercial</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder={copy.emailPlaceholder}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            <p className="text-xs text-muted-foreground">
              Informe pelo menos um canal de contato entre telefone, WhatsApp ou e-mail.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Endereço físico</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address_street">Rua</Label>
              <Input
                id="address_street"
                value={addressStreet}
                onChange={(event) => onAddressStreetChange(event.target.value)}
                placeholder={copy.streetPlaceholder}
              />
              {errors.address_street && <p className="text-xs text-destructive">{errors.address_street}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_number">Número</Label>
              <Input
                id="address_number"
                value={addressNumber}
                onChange={(event) => onAddressNumberChange(event.target.value)}
                placeholder="123"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address_complement">Complemento</Label>
              <Input
                id="address_complement"
                value={addressComplement}
                onChange={(event) => onAddressComplementChange(event.target.value)}
                placeholder={copy.complementPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">CEP</Label>
              <Input
                id="postal_code"
                value={postalCode}
                onChange={(event) => onPostalCodeChange(event.target.value)}
                placeholder="40000-000"
              />
              {errors.postal_code && <p className="text-xs text-destructive">{errors.postal_code}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Horário de funcionamento</h3>
          </div>
          <div className="space-y-3">
            {DAY_LABELS.map((day) => {
              const dayValue = hours[day.key];
              const isClosed = Boolean(dayValue?.closed);

              return (
                <div key={day.key} className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-[160px_1fr_1fr_140px] md:items-center">
                  <div className="text-sm font-medium">{day.label}</div>
                  <Input
                    type="time"
                    value={dayValue?.open || "09:00"}
                    onChange={(event) => updateDay(day.key, { open: event.target.value })}
                    disabled={isClosed}
                  />
                  <Input
                    type="time"
                    value={dayValue?.close || "18:00"}
                    onChange={(event) => updateDay(day.key, { close: event.target.value })}
                    disabled={isClosed}
                  />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={isClosed}
                      onCheckedChange={(checked) => updateDay(day.key, { closed: Boolean(checked) })}
                    />
                    Fechado
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border p-4">
          <h3 className="font-medium">Modos de atendimento</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MODOS_ATENDIMENTO.map((modo) => (
              <label key={modo.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <Checkbox
                  checked={selectedModos.includes(modo.id)}
                  onCheckedChange={(checked) => handleModoToggle(modo.id, Boolean(checked))}
                />
                <div>
                  <div className="font-medium text-foreground">{modo.label}</div>
                  <div className="text-muted-foreground">{modo.hint}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button type="button" onClick={onNext} className="flex-1 gap-2">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
