export function useMobilityUrls() {
  return {
    home: "/mobilidade",
    passenger: "/mobilidade/passageiro",
    driver: "/perfil/mobilidade/motorista",
    motoboy: "/perfil/mobilidade/motoboy",
    driverProfile: "/mobilidade/motorista/perfil",
    createDriver: "/create-driver",
    history: "/mobilidade/historico",
    buscandoMotorista: (rideId: string) => `/mobilidade/buscando/${rideId}`,
  };
}
