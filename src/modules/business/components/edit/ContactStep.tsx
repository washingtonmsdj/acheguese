import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
} from "lucide-react";
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
    <section className="overflow-hidden rounded-[26px] border border-territory-border bg-territory-surface">
      <div className="border-b border-territory-border bg-gradient-to-br from-territory-brand/10 via-territory-surface to-territory-surface px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-territory-brand/10 text-territory-brand">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-territory-brand/80">
              Etapa 2
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-territory-ink">
              Contato e localização
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-territory-muted">
              Mantenha os canais de atendimento e a posição no mapa corretos para quem procura sua empresa.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4 text-territory-brand" />
            <h3 className="text-sm font-semibold text-territory-ink">Canais de contato</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="(71) 99999-9999"
                  className="h-11 rounded-xl border-territory-border bg-territory-surface pl-10 text-territory-ink focus-visible:ring-territory-focus"
                />
              </div>
              {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <div className="relative">
                <MessageCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" />
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => onWhatsappChange(e.target.value)}
                  placeholder="(71) 99999-9999"
                  className="h-11 rounded-xl border-territory-border bg-territory-surface pl-10 text-territory-ink focus-visible:ring-territory-focus"
                />
              </div>
              {errors.whatsapp ? <p className="text-xs text-destructive">{errors.whatsapp}</p> : null}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="contato@empresa.com.br"
                className="h-11 rounded-xl border-territory-border bg-territory-surface pl-10 text-territory-ink focus-visible:ring-territory-focus"
              />
            </div>
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>
        </div>

        <div className="border-t border-territory-border pt-6">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-territory-brand" />
            <h3 className="text-sm font-semibold text-territory-ink">Endereço e mapa</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço completo</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
              className="h-11 rounded-xl border-territory-border bg-territory-surface text-territory-ink focus-visible:ring-territory-focus"
            />
            <p className="text-xs leading-5 text-territory-muted">
              Esse endereço ajuda a apresentar a empresa corretamente no território.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude ?? ""}
                onChange={(e) =>
                  onLatitudeChange(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="-12.9714"
                className="h-11 rounded-xl border-territory-border bg-territory-surface text-territory-ink focus-visible:ring-territory-focus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude ?? ""}
                onChange={(e) =>
                  onLongitudeChange(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="-38.5014"
                className="h-11 rounded-xl border-territory-border bg-territory-surface text-territory-ink focus-visible:ring-territory-focus"
              />
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-territory-border bg-territory-raised/70 px-4 py-3 text-xs leading-5 text-territory-muted">
            Latitude e longitude são usadas para posicionar a empresa no mapa e calcular proximidade real.
          </div>
        </div>

        <div className="border-t border-territory-border pt-6">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-territory-brand" />
            <div>
              <h3 className="text-sm font-semibold text-territory-ink">Modos de atendimento</h3>
              <p className="mt-0.5 text-xs text-territory-muted">
                Selecione todas as formas em que a empresa atende hoje.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MODOS_ATENDIMENTO.map((modo) => {
              const Icon = modo.icon;
              const checked = selectedModos.includes(modo.id);

              return (
                <label
                  key={modo.id}
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-sm transition-colors",
                    checked
                      ? "border-territory-brand/25 bg-territory-brand/[0.06] text-territory-ink"
                      : "border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised/70",
                  ].join(" ")}
                >
                  <Checkbox
                    checked={checked}
                    className="border-territory-border data-[state=checked]:bg-territory-brand data-[state=checked]:text-territory-on-image"
                    onCheckedChange={(nextChecked) => {
                      if (nextChecked) {
                        onModosChange(Array.from(new Set([...selectedModos, modo.id])));
                        return;
                      }
                      onModosChange(selectedModos.filter((m) => m !== modo.id));
                    }}
                  />
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{modo.label}</span>
                </label>
              );
            })}
          </div>
          {errors.modos_atendimento ? (
            <p className="mt-2 text-xs text-destructive">{errors.modos_atendimento}</p>
          ) : null}
        </div>

        <div className="business-edit-actions flex flex-col-reverse gap-3 border-t border-territory-border pt-5 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="gap-2 rounded-xl border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised sm:min-w-32"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={onNext}
            className="gap-2 rounded-xl bg-territory-sun text-territory-ink hover:bg-territory-sun/90 sm:min-w-36"
          >
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
