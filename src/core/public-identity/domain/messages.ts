/**
 * Public Identity — Mensagens padronizadas
 * Fonte única de todas as mensagens de UX de identidade pública.
 * Consistentes entre business, profile e professional.
 */

export const IDENTITY_MESSAGES = {
  // Disponibilidade
  available: 'Disponível',
  taken: 'Já está em uso',
  reserved: 'Nome reservado pelo sistema',
  invalid_format: 'Formato inválido',
  cooldown_blocked: 'Alteração bloqueada por período de espera',

  // Sugestão
  suggestion_prefix: 'Sugestão',

  // Cooldown
  cooldown_wait_days: (days: number) =>
    `Você só pode alterar este identificador em ${days} dia${days !== 1 ? 's' : ''}`,
  cooldown_wait_date: (date: string) => `Disponível a partir de ${date}`,

  // Erros de infraestrutura
  infra_error: 'Erro ao verificar disponibilidade. Tente novamente.',

  // Sucesso
  update_success: 'Identificador atualizado com sucesso',

  // Verificação
  checking: 'Verificando...',
} as const;

export type IdentityMessageKey = keyof typeof IDENTITY_MESSAGES;
