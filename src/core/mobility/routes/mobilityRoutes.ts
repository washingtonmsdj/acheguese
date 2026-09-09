export const mobilityRoutes = {
  motorista: {
    home: "/central/motorista",
    cadastro: "/central/motorista/cadastro",
    disponibilidade: "/central/motorista/disponibilidade",
    corridas: "/central/motorista/corridas",
    ganhos: "/central/motorista/ganhos",
    configuracoes: "/central/motorista/configuracoes",
  },
  motoboy: {
    home: "/central/motoboy",
    cadastro: "/central/motoboy/cadastro",
    disponibilidade: "/central/motoboy/disponibilidade",
    entregas: "/central/motoboy/entregas",
    ganhos: "/central/motoboy/ganhos",
    configuracoes: "/central/motoboy/configuracoes",
  },
  public: {
    home: "/mobilidade",
    motorista: "/mobilidade/motorista",
    motoboy: "/mobilidade/motoboy",
    motoristaProfile: "/mobilidade/motorista/perfil",
    history: "/mobilidade/historico",
    emergencyContacts: "/mobilidade/contatos-emergencia",
    trackPattern: "/track/:token",
    track: (token: string) => `/track/${token}`,
  },
  passageiro: {
    home: "/mobilidade/passageiro",
    corridas: "/mobilidade/passageiro/corridas",
    buscando: (rideId: string) => `/mobilidade/buscando/${rideId}`,
  },
} as const;

export type MobilityRoutes = typeof mobilityRoutes;
