# Checkpoint R4 — Empresas públicas no MVP — 2026-09-21

## Estado atual

Este checkpoint substitui a suposição anterior de que `category=educacao` deveria ser escondida quando o módulo Educação estivesse pausado.

A decisão final do MVP separa dois conceitos:

- **Business category**: classificação institucional da empresa;
- **vertical module**: experiência especializada opcional.

Portanto uma escola continua sendo uma Empresa pública válida, mesmo com `education=false`.

## Evidência

O dataset público preservado contém escolas reais e as fixtures de lojas/profissionais foram retiradas da exposição pública.

A probe `tests/security/business-mvp-public-flow-remote-probe.sql` agora seleciona dinamicamente qualquer Business ativo e roteável no território de lançamento, sem excluir Educação e sem depender de nome/UUID de fixture.

Ela valida em transação rollback-only:

- `public_business_search`;
- slug e `geographic_path` válidos;
- `get_public_business_snapshot_by_slug`;
- identidade do Business;
- URL canônica de detalhe.

A probe foi executada no Supabase canônico em 2026-09-21 sem exceção.

## Contrato

- `business=true`;
- `education=false`;
- não existe helper de launch scope para filtrar categorias Business;
- ativar/desativar uma vertical especializada não altera a visibilidade institucional de uma categoria Business.

## Pendências

Browser E2E, build/deploy do mesmo SHA e smoke público continuam pendentes enquanto a infraestrutura de CI/deploy não produzir execução real.
