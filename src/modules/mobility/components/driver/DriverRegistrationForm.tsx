import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  BRAZIL_STATE_OPTIONS,
  createDriverRegistrationFormValues,
  DRIVER_LICENSE_CATEGORIES,
  DRIVER_MAX_VEHICLE_YEAR,
  DRIVER_VEHICLE_TYPES,
  parseDriverRegistrationForm,
  type DriverRegistrationDefaults,
  type DriverRegistrationInput,
  type DriverRegistrationFormValues,
} from "@/modules/mobility/utils/driverRegistration";

interface DriverRegistrationFormProps {
  defaultValues?: DriverRegistrationDefaults;
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (input: DriverRegistrationInput) => void | Promise<void>;
}

const VEHICLE_TYPE_LABELS: Record<(typeof DRIVER_VEHICLE_TYPES)[number], string> = {
  car: "Carro",
  motorcycle: "Moto",
  van: "Van",
  truck: "Caminhão",
};

export function DriverRegistrationForm({
  defaultValues,
  loading = false,
  submitLabel = "Enviar Cadastro",
  onSubmit,
}: DriverRegistrationFormProps) {
  const defaultName = defaultValues?.name ?? null;
  const defaultCity = defaultValues?.city ?? null;
  const defaultAvatarUrl = defaultValues?.avatarUrl ?? null;
  const defaultState = defaultValues?.state ?? null;

  const [form, setForm] = useState<DriverRegistrationFormValues>(() =>
    createDriverRegistrationFormValues(defaultValues),
  );

  useEffect(() => {
    setForm(
      createDriverRegistrationFormValues({
        name: defaultName,
        city: defaultCity,
        avatarUrl: defaultAvatarUrl,
        state: defaultState,
      }),
    );
  }, [defaultAvatarUrl, defaultCity, defaultName, defaultState]);

  const updateField = <K extends keyof DriverRegistrationFormValues>(
    field: K,
    value: DriverRegistrationFormValues[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(parseDriverRegistrationForm(form, defaultValues));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Nome completo</Label>
        <Input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Seu nome completo"
          required
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Número da CNH</Label>
          <Input
            value={form.licenseNumber}
            onChange={(event) => updateField("licenseNumber", event.target.value)}
            placeholder="12345678900"
            maxLength={11}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Categoria</Label>
          <select
            value={form.licenseCategory}
            onChange={(event) =>
              updateField("licenseCategory", event.target.value as DriverRegistrationFormValues["licenseCategory"])
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
            disabled={loading}
          >
            {DRIVER_LICENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Validade da CNH</Label>
          <Input
            type="date"
            value={form.licenseExpiry}
            onChange={(event) => updateField("licenseExpiry", event.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">UF da CNH</Label>
          <select
            value={form.licenseState}
            onChange={(event) => updateField("licenseState", event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
            disabled={loading}
          >
            <option value="">Selecione</option>
            {BRAZIL_STATE_OPTIONS.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de veículo</Label>
          <select
            value={form.vehicleType}
            onChange={(event) =>
              updateField("vehicleType", event.target.value as DriverRegistrationFormValues["vehicleType"])
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
            disabled={loading}
          >
            {DRIVER_VEHICLE_TYPES.map((vehicleType) => (
              <option key={vehicleType} value={vehicleType}>
                {VEHICLE_TYPE_LABELS[vehicleType]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Placa do veículo</Label>
          <Input
            value={form.vehiclePlate}
            onChange={(event) => updateField("vehiclePlate", event.target.value.toUpperCase())}
            placeholder="ABC1D23"
            maxLength={8}
            className="uppercase"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Ano</Label>
          <Input
            type="number"
            min="2000"
            max={String(DRIVER_MAX_VEHICLE_YEAR)}
            value={form.vehicleYear}
            onChange={(event) => updateField("vehicleYear", event.target.value)}
            placeholder={String(new Date().getFullYear())}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cor do veículo</Label>
          <Input
            value={form.vehicleColor}
            onChange={(event) => updateField("vehicleColor", event.target.value)}
            placeholder="Ex: Preto"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Modelo do veículo</Label>
        <Input
          value={form.vehicleModel}
          onChange={(event) => updateField("vehicleModel", event.target.value)}
          placeholder="Ex: Honda Civic"
          required
          disabled={loading}
        />
      </div>

      <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">
        <p className="text-xs text-warning-foreground">
          Sua documentação será verificada pela equipe. Você receberá uma notificação
          quando o perfil estiver aprovado para operar.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
