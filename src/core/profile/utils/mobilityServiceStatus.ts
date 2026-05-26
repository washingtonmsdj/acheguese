export type MobilityServiceStatus =
  | "Não cadastrado"
  | "Cadastro incompleto"
  | "Aguardando aprovacao"
  | "Ativo"
  | "Suspenso";

interface DriverDataLike {
  is_suspended?: boolean | null;
  is_verified?: boolean | null;
  license_number?: string | null;
  vehicle_plate?: string | null;
  vehicle_model?: string | null;
  can_do_rides?: boolean | null;
  can_do_delivery?: boolean | null;
}

function hasCommonRegistrationData(driverData: DriverDataLike | null | undefined): boolean {
  return Boolean(driverData?.license_number && driverData?.vehicle_plate && driverData?.vehicle_model);
}

export function getMobilityServiceStatus(params: {
  driverProfileId: string | null;
  driverData: DriverDataLike | null | undefined;
  service: "motorista" | "motoboy";
}): MobilityServiceStatus {
  const { driverProfileId, driverData, service } = params;

  if (!driverProfileId) return "Não cadastrado";
  if (driverData?.is_suspended) return "Suspenso";
  if (!hasCommonRegistrationData(driverData)) return "Cadastro incompleto";

  if (service === "motorista" && driverData?.can_do_rides === false) {
    return "Não cadastrado";
  }

  if (service === "motoboy" && driverData?.can_do_delivery !== true) {
    return "Não cadastrado";
  }

  if (driverData?.is_verified === true) return "Ativo";
  return "Aguardando aprovacao";
}
