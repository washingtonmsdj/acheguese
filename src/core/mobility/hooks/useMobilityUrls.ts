/**
 * useMobilityUrls - Hook SSOT para URLs do módulo de Mobilidade
 *
 * ✅ SSOT COMPLIANT
 * Centraliza todas as URLs relacionadas ao módulo de mobilidade.
 *
 * @returns Objeto com URLs do módulo de mobilidade
 */

import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";

export interface MobilityUrls {
  home: string;
  passenger: string;
  driver: string;
  driverProfile: string;
  motoboyHome: string;
  motorista: {
    home: string;
    cadastro: string;
    disponibilidade: string;
    corridas: string;
    ganhos: string;
    configuracoes: string;
  };
  motoboy: {
    home: string;
    cadastro: string;
    disponibilidade: string;
    entregas: string;
    ganhos: string;
    configuracoes: string;
  };
  passageiro: {
    home: string;
    corridas: string;
    buscando: (rideId: string) => string;
  };
}

export function useMobilityUrls(): MobilityUrls {
  return {
    home: mobilityRoutes.public.home,
    passenger: mobilityRoutes.passageiro.home,
    driver: mobilityRoutes.motorista.home,
    driverProfile: mobilityRoutes.motorista.home,
    motoboyHome: mobilityRoutes.motoboy.home,
    motorista: mobilityRoutes.motorista,
    motoboy: mobilityRoutes.motoboy,
    passageiro: {
      home: mobilityRoutes.passageiro.home,
      corridas: mobilityRoutes.passageiro.corridas,
      buscando: mobilityRoutes.passageiro.buscando,
    },
  };
}
