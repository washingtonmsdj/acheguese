# Rotas da Area Logada

Data: 13 de maio de 2026

## Hierarquia canonica

- `/perfil`: area pessoal do usuario.
- `/central`: area operacional/profissional do usuario.
- `/empresas`: modulo publico de descoberta/listagem de empresas.

## Perfil pessoal

- `/perfil`
- `/perfil/planos`
- `/perfil/gerenciar`
- `/perfil/identidades`
- `/perfil/conta`
- `/perfil/familia`
- `/perfil/configuracoes`
- `/perfil/editar/:profileId`
- `/perfil/verificacao-morador`

Regras:

- Perfil nao hospeda painel administrativo de empresa.
- Perfil nao hospeda fluxo operacional de motorista, motoboy ou prestador.
- Perfil pode exibir resumo e atalhos para areas que o usuario possui.
- Atalhos operacionais saem para `/central`.

## Central operacional

- `/central`
- `/central/empresas`
- `/central/empresas/nova`
- `/central/empresas/:businessId`
- `/central/empresas/:businessId/dados`
- `/central/empresas/:businessId/gastronomia`
- `/central/empresas/:businessId/gastronomia/setup`
- `/central/empresas/:businessId/gastronomia/cardapio`
- `/central/empresas/:businessId/gastronomia/horarios`
- `/central/empresas/:businessId/gastronomia/area-entrega`
- `/central/empresas/:businessId/gastronomia/pedidos`
- `/central/empresas/:businessId/gastronomia/pedidos/:orderId`
- `/central/empresas/:businessId/gastronomia/entregas`
- `/central/empresas/:businessId/gastronomia/analytics`
- `/central/empresas/:businessId/gastronomia/promocoes`
- `/central/empresas/:businessId/education`
- `/central/empresas/:businessId/education/setup`
- `/central/empresas/:businessId/education/programas`
- `/central/empresas/:businessId/education/programs`
- `/central/empresas/:businessId/education/leads`
- `/central/empresas/:businessId/education/eventos`
- `/central/empresas/:businessId/education/events`
- `/central/empresas/:businessId/education/analytics`
- `/central/empresas/:businessId/education/planos`
- `/central/empresas/:businessId/education/plans`
- `/central/empresas/:businessId/planos`
- `/central/empresas/:businessId/link-premium`
- `/central/empresas/:businessId/analytics`
- `/central/empresas/:businessId/configuracoes`
- `/central/motorista`
- `/central/motorista/cadastro`
- `/central/motorista/disponibilidade`
- `/central/motorista/corridas`
- `/central/motorista/ganhos`
- `/central/motorista/configuracoes`
- `/central/motoboy`
- `/central/motoboy/cadastro`
- `/central/motoboy/disponibilidade`
- `/central/motoboy/entregas`
- `/central/motoboy/ganhos`
- `/central/motoboy/configuracoes`

## Empresas publico

- `/empresas`
- `/empresas/cadastrar`
- `/empresas/:id/catalogo`
- `/empresas/:state/:city`
- `/empresas/:state/:city/:district`
- `/empresas/:state/:city/:district/:slug`

Regras:

- `/empresas` e descoberta publica.
- `/empresas/cadastrar` e landing comercial e encaminha para a Central.
- Formulario real de criacao fica somente em `/central/empresas/nova`.
- Nao ha redirects temporarios para rotas antigas de criacao.