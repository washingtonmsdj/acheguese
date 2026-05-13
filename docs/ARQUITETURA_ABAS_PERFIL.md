# Arquitetura do Perfil

## Visao atual

O perfil tem uma unica responsabilidade canonica: representar a area pessoal do usuario.

1. `/perfil` e o hub pessoal do usuario.
2. `/central` e o hub operacional/profissional.
3. `/empresas` e o modulo publico de descoberta/listagem de empresas.

## Regras de navegacao

- `/perfil` e a entrada principal da area pessoal.
- `/perfil/planos` centraliza planos e cobrancas pessoais/visao de conta.
- `/perfil/identidades` e `/perfil/gerenciar` tratam identidades e areas vinculadas ao usuario.
- Atalhos de empresas navegam para `/central/empresas`.
- Atalhos de motorista/motoboy navegam para `/central/motorista` ou `/central/motoboy`.
- O hub de perfil nao usa querystring para trocar secao.
- `/central/empresas/*` e `/central/*` nao existem como rotas canonicas.

## Shell do perfil

As paginas canonicas do perfil mantem:

- sidebar do perfil;
- hero/header compacto do perfil;
- breadcrumb;
- contexto claro da conta ativa.

Isso vale para:

- `/perfil`
- `/perfil/planos`
- `/perfil/gerenciar`
- `/perfil/identidades`
- `/perfil/conta`
- `/perfil/familia`
- `/perfil/configuracoes`

## Shell operacional

As paginas operacionais usam a Central:

- `/central`
- `/central/empresas`
- `/central/empresas/nova`
- `/central/empresas/:businessId/*`
- `/central/motorista/*`
- `/central/motoboy/*`

## Shell publico de empresas

O modulo publico de empresas fica em:

- `/empresas`
- `/empresas/cadastrar`
- `/empresas/:id/catalogo`

`/empresas/cadastrar` e uma landing comercial; o formulario operacional real vive em `/central/empresas/nova`.

## Regras de produto

- Usuario e a conta pessoal.
- Empresa e entidade operacional gerida na Central.
- Gastronomia e education sao verticais da empresa.
- Planos de empresa pertencem a empresa.
- Link premium pertence a empresa.
- Mobilidade e perfil operacional do usuario, gerido na Central.

## Implementacao

- `src/modules/profile/utils/profileNavigation.ts` concentra caminhos do perfil e atalhos para a Central.
- `src/modules/mobility/routes/mobilityNavigation.ts` concentra navegacao operacional de mobilidade.
- `src/core/business/utils/businessManagementRoutes.ts` concentra rotas operacionais de empresas.
- `src/modules/profile/pages/PerfilHubPage.tsx` controla o hub pessoal.
- `src/modules/central/pages/*` controla paineis operacionais.