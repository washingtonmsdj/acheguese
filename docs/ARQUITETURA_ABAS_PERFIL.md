# Arquitetura do Perfil

## Visao atual

O perfil tem tres camadas canonicas:

1. `/perfil` como hub principal do usuario.
2. Paginas proprias com o mesmo shell visual do perfil:
   - `/perfil/empresas`
   - `/perfil/planos`
   - `/perfil/mobilidade`

As demais secoes internas do hub continuam existindo apenas como estado interno do hub, nao como rota dedicada.

## Regras de navegacao

- `/perfil` e a entrada principal do hub.
- `/perfil/empresas` e a lista canonica de empresas.
- `/perfil/planos` e a central canonica de planos e cobrancas.
- `/perfil/mobilidade` e o painel canonico do perfil operacional.
- O hub de perfil nao usa querystring para trocar secao.
- Os links internos do app devem sair diretamente para `/perfil/empresas`, `/perfil/planos` e `/perfil/mobilidade`.

## Shell do perfil

As paginas canonicas do perfil mantem:

- sidebar do perfil;
- hero/header compacto do perfil;
- breadcrumb;
- contexto claro da conta ativa.

Isso vale para:

- `/perfil`
- `/perfil/empresas`
- `/perfil/planos`
- `/perfil/mobilidade`

## Shell de empresa

As paginas internas da empresa usam o shell unico em:

- `/perfil/empresas/:businessId`
- `/perfil/empresas/:businessId/dados`
- `/perfil/empresas/:businessId/gastronomia`
- `/perfil/empresas/:businessId/planos`
- `/perfil/empresas/:businessId/link-premium`
- `/perfil/empresas/:businessId/analytics`
- `/perfil/empresas/:businessId/configuracoes`

## Shell de mobilidade

As paginas internas de mobilidade usam um shell proprio em:

- `/perfil/mobilidade`
- `/perfil/mobilidade/motorista`
- `/perfil/mobilidade/motorista/cadastro`
- `/perfil/mobilidade/motorista/disponibilidade`
- `/perfil/mobilidade/motorista/corridas`
- `/perfil/mobilidade/motorista/ganhos`
- `/perfil/mobilidade/motorista/configuracoes`
- `/perfil/mobilidade/motoboy`
- `/perfil/mobilidade/motoboy/cadastro`
- `/perfil/mobilidade/motoboy/disponibilidade`
- `/perfil/mobilidade/motoboy/entregas`
- `/perfil/mobilidade/motoboy/ganhos`
- `/perfil/mobilidade/motoboy/configuracoes`

## Regras de produto

- Usuario e a conta pagadora.
- Empresa e a entidade principal de gestao.
- Gastronomia e uma vertical da empresa.
- Planos pertencem a empresa.
- Link premium pertence a empresa.
- Gastronomia consome entitlements da empresa.
- Mobilidade e um perfil operacional do usuario, separado da empresa.

## Implementacao

- `src/modules/profile/utils/profileNavigation.ts` concentra a definicao dos caminhos do perfil.
- `src/modules/profile/utils/profileMobilityNavigation.ts` concentra a definicao dos caminhos da mobilidade.
- `src/modules/profile/pages/PerfilHubPage.tsx` controla a secao ativa internamente.
- `src/modules/profile/pages/PerfilEmpresasPage.tsx`, `src/modules/profile/pages/PerfilPlanosPage.tsx` e `src/modules/profile/pages/PerfilMobilidadeLayout.tsx` reutilizam o shell do perfil.
