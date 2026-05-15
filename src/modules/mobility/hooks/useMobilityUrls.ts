/**
 * useMobilityUrls - Hook SSOT para URLs do módulo de Mobilidade
 *
 * ✅ SSOT COMPLIANT
 * Centraliza todas as URLs relacionadas ao módulo de mobilidade.
 *
 * @returns Objeto com URLs do módulo de mobilidade
 */

import { mobilityRoutes } from "@/modules/mobility/routes/mobilityRoutes";

export interface MobilityUrls {
  home: string;
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
  };
}

export function useMobilityUrls(): MobilityUrls {
  return {
    home: mobilityRoutes.passageiro.home,
    motorista: mobilityRoutes.motorista,
    motoboy: mobilityRoutes.motoboy,
    passageiro: {
      home: mobilityRoutes.passageiro.home,
      corridas: mobilityRoutes.passageiro.corridas,
    },
  };
}
