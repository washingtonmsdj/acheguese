import { ArrowLeft, ArrowRight, Clock3, MapPin, Phone, Route } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { TerritorialSelector } from "@/core/location/components/TerritorialSelector";
import { getRecordValue, setRecordValue } from "@/shared/utils/recordLookup";
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
    onHoursChange(
      setRecordValue(hours, day, {
        ...(getRecordValue(hours, day) ?? { open: "", close: "" }),
        ...patch,
      }),
    );
  };

  return (
    <section className="overflow-hidden rounded-[26px] border border-border bg-card">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
              Etapa 2
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              Contato, endereço e funcionamento
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Defina onde a empresa aparece, como as pessoas entram em contato e quando ela funciona.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="rounded-[22px] border border-border bg-background/70 p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Route className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Território principal</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                O território orienta a página pública, a busca, o mapa e resultados de proximidade.
              </p>
            </div>
          </div>
          <TerritorialSelector
            initialLocationId={locationId}
            onLocationChange={onLocationChange}
          />
          {errors.location_id ? (
            <p className="mt-2 text-xs text-destructive">{errors.location_id}</p>
          ) : null}
          {locationData ? (
            <div className="mt-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Página principal em <span className="font-semibold text-foreground">{locationData.neighborhoodName}</span>, {locationData.cityName} - {locationData.stateName}.
            </div>
          ) : null}
        </div>

        <div className="border-t border-border pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Canais de contato</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Informe pelo menos um canal que esteja realmente disponível.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                placeholder={copy.phonePlaceholder}
                className="h-11 rounded-xl"
              />
              {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(event) => onWhatsappChange(event.target.value)}
                placeholder={copy.whatsappPlaceholder}
                className="h-11 rounded-xl"
              />
              {errors.whatsapp ? <p className="text-xs text-destructive">{errors.whatsapp}</p> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">E-mail comercial</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder={copy.emailPlaceholder}
                className="h-11 rounded-xl"
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Endereço físico</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Use um endereço que possa ser reconhecido por clientes e pelos recursos de mapa.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address_street">Rua</Label>
              <Input
                id="address_street"
                value={addressStreet}
                onChange={(event) => onAddressStreetChange(event.target.value)}
                placeholder={copy.streetPlaceholder}
                className="h-11 rounded-xl"
              />
              {errors.address_street ? <p className="text-xs text-destructive">{errors.address_street}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_number">Número</Label>
              <Input
                id="address_number"
                value={addressNumber}
                onChange={(event) => onAddressNumberChange(event.target.value)}
                placeholder="123"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address_complement">Complemento</Label>
              <Input
                id="address_complement"
                value={addressComplement}
                onChange={(event) => onAddressComplementChange(event.target.value)}
                placeholder={copy.complementPlaceholder}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">CEP</Label>
              <Input
                id="postal_code"
                value={postalCode}
                onChange={(event) => onPostalCodeChange(event.target.value)}
                placeholder="40000-000"
                className="h-11 rounded-xl"
              />
              {errors.postal_code ? <p className="text-xs text-destructive">{errors.postal_code}</p> : null}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Horário de funcionamento</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                O horário informado alimenta o status “aberto agora” no catálogo e no perfil público.
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {DAY_LABELS.map((day) => {
              const dayValue = hours[day.key];
              const isClosed = Boolean(dayValue?.closed);

              return (
                <div
                  key={day.key}
                  className={`grid gap-3 rounded-2xl border px-4 py-3 md:grid-cols-[150px_1fr_1fr_130px] md:items-center ${
                    isClosed ? "border-border bg-muted/25" : "border-border bg-background/60"
                  }`}
                >
                  <div className="text-sm font-semibold text-foreground">{day.label}</div>
                  <Input
                    type="time"
                    value={dayValue?.open || "09:00"}
                    onChange={(event) => updateDay(day.key, { open: event.target.value })}
                    disabled={isClosed}
                    className="h-10 rounded-xl"
                    aria-label={`Abertura ${day.label}`}
                  />
                  <Input
                    type="time"
                    value={dayValue?.close || "18:00"}
                    onChange={(event) => updateDay(day.key, { close: event.target.value })}
                    disabled={isClosed}
                    className="h-10 rounded-xl"
                    aria-label={`Fechamento ${day.label}`}
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
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

        <div className="border-t border-border pt-6">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Modos de atendimento</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Marque todas as formas pelas quais a empresa atende hoje.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {MODOS_ATENDIMENTO.map((modo) => {
              const checked = selectedModos.includes(modo.id);
              return (
                <label
                  key={modo.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition-colors ${
                    checked
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-background/50 hover:bg-muted/30"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) => handleModoToggle(modo.id, Boolean(nextChecked))}
                  />
                  <div>
                    <div className="font-semibold text-foreground">{modo.label}</div>
                    <div className="mt-1 leading-5 text-muted-foreground">{modo.hint}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2 sm:flex-1">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button type="button" onClick={onNext} className="gap-2 sm:flex-1">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
