import { PublicIdentityService } from "@/core/public-identity";
import { BUSINESS_RULES } from "@/modules/mobility/constants";

export const DRIVER_LICENSE_CATEGORIES = ["A", "B", "AB", "C", "D", "E"] as const;
export const DRIVER_VEHICLE_TYPES = ["car", "motorcycle", "van", "truck"] as const;
export const BRAZIL_STATE_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type DriverLicenseCategory = (typeof DRIVER_LICENSE_CATEGORIES)[number];
export type DriverVehicleType = (typeof DRIVER_VEHICLE_TYPES)[number];
export type BrazilStateCode = (typeof BRAZIL_STATE_OPTIONS)[number];

export interface DriverRegistrationInput {
  name: string;
  licenseNumber: string;
  licenseCategory: DriverLicenseCategory;
  licenseExpiry: string;
  licenseState: string;
  vehicleType: DriverVehicleType;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  city?: string;
  avatarUrl?: string;
  bio?: string;
  capabilities?: {
    can_do_delivery?: boolean;
    can_do_rides?: boolean;
  };
}

export interface DriverRegistrationFormValues {
  name: string;
  licenseNumber: string;
  licenseCategory: DriverLicenseCategory;
  licenseExpiry: string;
  licenseState: string;
  vehicleType: DriverVehicleType;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
}

export interface DriverRegistrationDefaults {
  name?: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  state?: string | null;
  vehicleType?: DriverVehicleType;
}

export interface DriverProfileCreatePayload {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  extensionData: Record<string, unknown>;
}

export const DRIVER_MAX_VEHICLE_YEAR = Math.max(
  BUSINESS_RULES.MAX_VEHICLE_YEAR,
  new Date().getFullYear() + 1,
);

export function createDriverRegistrationFormValues(
  defaults: DriverRegistrationDefaults = {},
): DriverRegistrationFormValues {
  return {
    name: defaults.name?.trim() ?? "",
    licenseNumber: "",
    licenseCategory: "B",
    licenseExpiry: "",
    licenseState: defaults.state?.trim()?.toUpperCase() ?? "",
    vehicleType: defaults.vehicleType ?? "car",
    vehiclePlate: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
  };
}

export function parseDriverRegistrationForm(
  values: DriverRegistrationFormValues,
  defaults: DriverRegistrationDefaults = {},
): DriverRegistrationInput {
  return {
    name: values.name.trim(),
    licenseNumber: sanitizeLicenseNumber(values.licenseNumber),
    licenseCategory: values.licenseCategory,
    licenseExpiry: values.licenseExpiry,
    licenseState: values.licenseState.trim().toUpperCase(),
    vehicleType: values.vehicleType,
    vehiclePlate: sanitizeVehiclePlate(values.vehiclePlate),
    vehicleModel: values.vehicleModel.trim(),
    vehicleYear: Number(values.vehicleYear),
    vehicleColor: values.vehicleColor.trim(),
    city: defaults.city?.trim() ?? undefined,
    avatarUrl: defaults.avatarUrl?.trim() ?? undefined,
  };
}

export function sanitizeLicenseNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function sanitizeVehiclePlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function validateDriverRegistrationInput(input: DriverRegistrationInput): void {
  if (!input.name) {
    throw new Error("Nome completo é obrigatório");
  }

  if (!input.licenseNumber) {
    throw new Error("Número da CNH é obrigatório");
  }

  if (!input.licenseCategory) {
    throw new Error("Categoria da CNH é obrigatória");
  }

  if (!input.licenseExpiry) {
    throw new Error("Validade da CNH é obrigatória");
  }

  const expiryDate = new Date(`${input.licenseExpiry}T00:00:00`);
  if (Number.isNaN(expiryDate.getTime())) {
    throw new Error("Validade da CNH inválida");
  }
  if (expiryDate < new Date(new Date().toDateString())) {
    throw new Error("A CNH informada está vencida");
  }

  if (!input.licenseState) {
    throw new Error("UF da CNH é obrigatória");
  }

  if (!BRAZIL_STATE_OPTIONS.includes(input.licenseState as BrazilStateCode)) {
    throw new Error("UF da CNH inválida");
  }

  if (!input.vehiclePlate) {
    throw new Error("Placa do veículo é obrigatória");
  }

  if (!input.vehicleModel) {
    throw new Error("Modelo do veículo é obrigatório");
  }

  if (!input.vehicleYear || Number.isNaN(input.vehicleYear)) {
    throw new Error("Ano do veículo é obrigatório");
  }

  if (
    input.vehicleYear < BUSINESS_RULES.MIN_VEHICLE_YEAR ||
    input.vehicleYear > DRIVER_MAX_VEHICLE_YEAR
  ) {
    throw new Error("Ano do veículo inválido");
  }

  if (!input.vehicleColor) {
    throw new Error("Cor do veículo é obrigatória");
  }
}

export async function buildDriverProfileCreatePayload(
  input: DriverRegistrationInput,
): Promise<DriverProfileCreatePayload> {
  validateDriverRegistrationInput(input);

  const preferredHandle = buildPreferredDriverHandle(input.name);
  const handle = await resolveAvailableDriverHandle(preferredHandle);

  // ✅ Usar bio customizada se fornecida, senão usar padrão
  const bio = input.bio || (input.city ? `Motorista em ${input.city}` : "Motorista cadastrado");

  return {
    handle,
    displayName: input.name,
    avatarUrl: input.avatarUrl,
    bio,
    extensionData: {
      license_number: input.licenseNumber,
      license_category: input.licenseCategory,
      license_expiry: input.licenseExpiry,
      license_state: input.licenseState,
      vehicle_type: input.vehicleType,
      vehicle_plate: input.vehiclePlate,
      vehicle_model: input.vehicleModel,
      vehicle_year: input.vehicleYear,
      vehicle_color: input.vehicleColor,
      documents_verified: false,
      background_check_status: "pending",
      is_available: false,
      // ✅ Capacidades baseadas no tipo
      can_do_delivery: input.capabilities?.can_do_delivery ?? true,
      can_do_rides: input.capabilities?.can_do_rides ?? true,
    },
  };
}

export function buildPreferredDriverHandle(name: string): string {
  const normalized = PublicIdentityService.normalize(`${name} motorista`, "profile");
  if (!normalized) {
    throw new Error("Não foi possível gerar um identificador público para o motorista");
  }
  return normalized;
}

async function resolveAvailableDriverHandle(preferredHandle: string): Promise<string> {
  const availability = await PublicIdentityService.checkAvailability({
    identifier: preferredHandle,
    entityType: "profile",
  });

  if (availability.status === "available") {
    return preferredHandle;
  }

  if (availability.suggestion) {
    const suggestionAvailability = await PublicIdentityService.checkAvailability({
      identifier: availability.suggestion,
      entityType: "profile",
    });

    if (suggestionAvailability.status === "available") {
      return availability.suggestion;
    }
  }

  throw new Error(
    availability.message ||
      `Identificador público "${preferredHandle}" indisponível para o perfil de motorista`,
  );
}
