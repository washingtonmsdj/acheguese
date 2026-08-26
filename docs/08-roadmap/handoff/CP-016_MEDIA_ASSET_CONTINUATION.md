# CP-016 - Registro de conclusao do MediaAsset publico

**Status:** concluido no codigo e no Supabase remoto em 2026-07-17.

Este arquivo deixou de ser um plano de aplicacao. Ele registra o corte para que
outra IA ou desenvolvedor nao tente repetir o backfill nem recriar os comandos
temporarios.

## Resultado

`MediaAsset` e a unica fonte de verdade para imagens publicas de avatar,
empresa, galeria de empresa, classificado, profissional, banner e marca do
site. Os campos de dominio persistem referencias no formato:

```text
storage://media-assets/<ownerProfileId>/<preset>/v1/<assetId>.jpg
```

URLs de CDN existem somente no read model. Evidencias privadas, documentos e
virtual try-on nao pertencem a este contrato.

## Autoridade por dominio

| Dominio        | Campo canonico                                                | Preset                                                               |
| -------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Avatar         | `profiles.avatar_url`                                         | `user_avatar`                                                        |
| Empresa        | `business_data.metadata.logo_url`, `banner_url`               | `business_logo`, `business_banner`                                   |
| Galeria        | `business_gallery.image_url`                                  | `business_gallery`                                                   |
| Classificado   | `classifieds.photos`                                          | `classified_image`                                                   |
| Profissional   | `metadata.logo_url`, `metadata.banner_url`, `portfolio_items` | `professional_logo`, `professional_banner`, `professional_portfolio` |
| Banner do site | `banners.image_url`                                           | `site_banner`                                                        |
| Marca do site  | `site_settings.value`                                         | `site_logo`, `site_favicon`                                          |

## Migrations aplicadas

1. `20260715113000_consolidate_public_media_asset_domains.sql`: presets,
   guardas de escrita e links canonicos, sem apagar legado.
2. `20260717120000_create_cp016_media_backfill_commands.sql`: comandos
   temporarios restritos a `service_role` e ledger privado sem URLs.
3. `20260717121000_finalize_cp016_media_cutover.sql`: assercao de legado zero,
   validacao de ledger/ativos/links e remocao de toda a superficie temporaria.

A terceira migration e replayable: banco novo sem dados passa pelas assercoes
sem exigir um backfill externo entre migrations.

## Evidencia remota

- linha de base: 1 empresa, 23 classificados e 1 site setting com legado;
- dry-run: 55 referencias, 25 agregados e 46 transformacoes unicas;
- backfill: 49 imagens migradas e vinculadas;
- 6 URLs Unsplash retornaram HTTP 404 no original e na variante otimizada;
- essas 6 referencias opcionais foram descartadas com hash e motivo auditados;
- preflight final: zero legado em todos os sete dominios;
- ledger final: 49 `migrated`, 6 `dropped`, 0 invalidas;
- comandos temporarios finais: 0.

Auditorias permanentes:

- `tests/security/media-assets-cp016-preflight-remote-audit.sql`;
- `tests/security/media-assets-cp016-legacy-shape-remote-audit.sql`;
- `tests/security/media-assets-cp016-cutover-remote-audit.sql`.

## Controles implementados

- upload autenticado pelo broker `media-assets`;
- owner e Profile ativo resolvidos no backend;
- allowlist exata de origem para o backfill;
- HTTPS sem redirect, credenciais ou porta arbitraria;
- limite de bytes, timeout, MIME e decode real;
- JPEG sanitizado, sem APP/COM e sem bytes apos EOI;
- reserva idempotente, `upsert: false` e finalizacao compare-and-swap;
- BOLA/IDOR bloqueados por owner, preset, agregado e triggers;
- URL legada nunca foi gravada no ledger nem exposta em logs.

## Validacao de entrega

Passaram: typecheck global, lint, build, testes MediaAsset/SSOT, testes JPEG,
validadores de dependencias, SSOT, seguranca e migrations. A migration de corte
tambem compilou contra o remoto dentro de uma transacao com rollback antes da
aplicacao definitiva.

## Regra para trabalho futuro

Nao recriar os RPCs `*_cp016_media_asset_backfill`. Nova origem de imagem
publica deve ganhar preset/versao e adapter no MediaAsset SSOT. Fluxo privado
deve permanecer em contrato separado. O proximo trabalho global esta em
`plans/CORE_PLATFORM_CONSOLIDATION_PLAN.md`; CP-016 nao e mais pendencia.
