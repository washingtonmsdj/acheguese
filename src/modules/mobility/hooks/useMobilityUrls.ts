/**
 * useMobilityUrls - Hook SSOT para URLs do módulo de Mobilidade
 *
 * ✅ SSOT COMPLIANT
 * Centraliza todas as URLs relacionadas ao módulo de mobilidade.
 *
 * @returns Objeto com URLs do módulo de mobilidade
 */

export interface MobilityUrls {
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
    motorista: {
      home: '/central/motorista',
      cadastro: '/central/motorista/cadastro',
      disponibilidade: '/central/motorista/disponibilidade',
      corridas: '/central/motorista/corridas',
      ganhos: '/central/motorista/ganhos',
      configuracoes: '/central/motorista/configuracoes',
    },
    motoboy: {
      home: '/central/motoboy',
      cadastro: '/central/motoboy/cadastro',
      disponibilidade: '/central/motoboy/disponibilidade',
      entregas: '/central/motoboy/entregas',
      ganhos: '/central/motoboy/ganhos',
      configuracoes: '/central/motoboy/configuracoes',
    },
    passageiro: {
      home: '/mobilidade/passageiro',
      corridas: '/mobilidade/passageiro/corridas',
    },
  };
}
