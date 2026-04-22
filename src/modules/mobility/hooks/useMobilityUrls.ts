/**
 * useMobilityUrls - Hook SSOT para URLs do módulo de Mobilidade
 * 
 * ✅ SSOT COMPLIANT
 * Centraliza todas as URLs relacionadas ao módulo de mobilidade.
 * 
 * @returns Objeto com URLs do módulo de mobilidade
 */
export function useMobilityUrls() {
  return {
    // Página principal de mobilidade
    home: '/mobilidade',
    
    // Páginas de usuário
    passenger: '/mobilidade/passageiro',
    driver: '/mobilidade/motorista',
    motoboy: '/mobilidade/motoboy',
    driverProfile: '/mobilidade/motorista/perfil',
    
    // Cadastro e criação
    createDriver: '/create-driver',
    
    // Histórico
    history: '/mobilidade/historico',
    // Busca de motorista
    buscandoMotorista: (rideId: string) => `/mobilidade/buscando/${rideId}`,
  };
}
