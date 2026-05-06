export function useMobilityUrls() {
  return {
    home: "/mobilidade",
    passenger: "/mobilidade/passageiro",
    driver: "/central/motorista",
    motoboy: "/central/motoboy",
    driverProfile: "/mobilidade/motorista/perfil",
    createDriver: "/create-driver",
    history: "/mobilidade/historico",
    buscandoMotorista: (rideId: string) => `/mobilidade/buscando/${rideId}`,
    // Sub-rotas de motorista na Central
    motorista: {
      home: "/central/motorista",
      cadastro: "/central/motorista/cadastro",
      disponibilidade: "/central/motorista/disponibilidade",
      corridas: "/central/motorista/corridas",
      ganhos: "/central/motorista/ganhos",
      configuracoes: "/central/motorista/configuracoes",
    },
    // Sub-rotas de motoboy na Central
    motoboyRoutes: {
      home: "/central/motoboy",
      cadastro: "/central/motoboy/cadastro",
      disponibilidade: "/central/motoboy/disponibilidade",
      entregas: "/central/motoboy/entregas",
      ganhos: "/central/motoboy/ganhos",
      configuracoes: "/central/motoboy/configuracoes",
    },
  };
}
