# Mapa Canonico da Central

Data: 13 de maio de 2026

Este documento substitui os mapas de transicao antigos. O sistema esta em desenvolvimento e nao preserva redirects temporarios para rotas removidas.

## Separacao de responsabilidades

- `/conta`: area privada do usuario, dados pessoais, foto, bio, enderecos pessoais, notificacoes, favoritos e resumo/atalhos das areas que possui.
- `/u/:username`: perfil publico/social do usuario.
- `/central`: area operacional/profissional, gestao de empresas, verticais, planos, motorista, motoboy, prestador e dashboards administrativos do usuario.
- `/empresas`: modulo publico de descoberta/listagem de empresas.

## Empresas na Central

- `/central/empresas`: lista operacional das empresas do usuario.
- `/central/empresas/nova`: formulario real de criacao de empresa.
- `/central/empresas/:businessId`: shell administrativo da empresa.
- `/central/empresas/:businessId/dados`: dados cadastrais.
- `/central/empresas/:businessId/planos`: planos da empresa.
- `/central/empresas/:businessId/link-premium`: site/link premium.
- `/central/empresas/:businessId/analytics`: analytics geral.
- `/central/empresas/:businessId/configuracoes`: configuracoes da empresa.

## Verticais da empresa

- Gastronomia: `/central/empresas/:businessId/gastronomia/*`.
- Education: `/central/empresas/:businessId/education/*`.

## Mobilidade operacional

- Motorista: `/central/motorista/*`.
- Motoboy: `/central/motoboy/*`.

## Publico de empresas

- `/empresas`: descoberta publica.
- `/empresas/cadastrar`: landing comercial.
- `/empresas/:id/catalogo`: catalogo publico.
- Rotas territoriais de detalhe/listagem vivem sob `/empresas/:state/:city...`.

## Politica de redirects

- Sem redirects para rotas antigas nesta fase de desenvolvimento.
- Links, CTAs, breadcrumbs e helpers devem apontar diretamente para as rotas canonicas.
- O SSOT de rotas operacionais de empresa e `businessManagementRoutes`.
- O SSOT de URLs resolvidas da empresa e `BusinessUrlService`.
- O SSOT de mobilidade operacional e `mobilityRoutes`.
