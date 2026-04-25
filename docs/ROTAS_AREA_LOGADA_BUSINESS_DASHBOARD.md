# Rotas da Area Logada

Data: 25 de abril de 2026

## Hierarquia canonica

Usuario -> Perfil -> Empresas -> Empresa -> Verticais -> Recursos -> Planos
Usuario -> Perfil -> Mobilidade -> Motorista | Motoboy

## Rotas de perfil

- `/perfil`
- `/perfil/empresas`
- `/perfil/planos`
- `/perfil/mobilidade`

## Regras do perfil

- `Empresas` navega para `/perfil/empresas`.
- `Planos e cobrancas` navega para `/perfil/planos`.
- `Mobilidade` navega para `/perfil/mobilidade`.
- `/perfil/cobrancas` nao e rota canonica da aplicacao.
- `?sec=` permanece apenas para secoes internas do hub `/perfil`.

## Rotas canonicas da empresa

- `/perfil/empresas/:businessId`
- `/perfil/empresas/:businessId/dados`
- `/perfil/empresas/:businessId/gastronomia`
- `/perfil/empresas/:businessId/planos`
- `/perfil/empresas/:businessId/link-premium`
- `/perfil/empresas/:businessId/analytics`
- `/perfil/empresas/:businessId/configuracoes`

## Subrotas canonicas da gastronomia

- `/perfil/empresas/:businessId/gastronomia/setup`
- `/perfil/empresas/:businessId/gastronomia/cardapio`
- `/perfil/empresas/:businessId/gastronomia/horarios`
- `/perfil/empresas/:businessId/gastronomia/area-entrega`
- `/perfil/empresas/:businessId/gastronomia/pedidos`
- `/perfil/empresas/:businessId/gastronomia/entregas`
- `/perfil/empresas/:businessId/gastronomia/analytics`
- `/perfil/empresas/:businessId/gastronomia/promocoes`

## Rotas canonicas de mobilidade

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

## Rotas removidas da navegacao interna

- `/dashboard/business/:businessId`
- `/dashboard/business/:businessId/details`
- `/dashboard/business/:businessId/gastronomy`
- `/dashboard/business/:businessId/gastronomy/dashboard`
- `/dashboard/business/:businessId/gastronomy/plans`
- `/dashboard/business/:businessId/gastronomy/billing`
- `/dashboard/business/:businessId/plans`
- `/dashboard/business/:businessId/premium-site`
- `/dashboard/business/:businessId/settings`
- `/dashboard/driver`
- `/dashboard/motoboy`
- `/driver/dashboard`
- `/motoboy/dashboard`
- `/perfil/motorista`
- `/perfil/motoboy`

## Regras de produto aplicadas

- Planos pertencem a empresa.
- Gastronomia consome entitlements da empresa.
- Link premium pertence a empresa.
- CTA de upgrade dentro da gastronomia aponta para `/perfil/empresas/:businessId/planos`.
- Mobilidade e um perfil operacional separado da empresa.
- O shell da empresa vive em `/perfil/empresas/:businessId`.
- O shell da mobilidade vive em `/perfil/mobilidade`.
