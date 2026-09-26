# CP-016 — corte concluído do MediaAsset público

**Status:** histórico — concluído no código e no Supabase remoto em 2026-07-17.

Este registro preserva a evidência do corte de MediaAsset. Não é um plano ativo e não deve ser usado como fila de execução.

## Resultado

`MediaAsset` tornou-se a fonte de verdade para imagens públicas de avatar, empresa, galeria de empresa, classificado, profissional, banner e marca do site. Os campos de domínio persistem referências no formato:

```text
storage://media-assets/<ownerProfileId>/<preset>/v1/<assetId>.jpg
```

URLs de CDN existem somente no read model. Evidências privadas, documentos e virtual try-on não pertencem a este contrato.

## Autoridade por domínio

| Domínio | Campo canônico | Preset |
| --- | --- | --- |
| Avatar | `profiles.avatar_url` | `user_avatar` |
| Empresa | `business_data.metadata.logo_url`, `banner_url` | `business_logo`, `business_banner` |
| Galeria | `business_gallery.image_url` | `business_gallery` |
| Classificado | `classifieds.photos` | `classified_image` |
| Profissional | `metadata.logo_url`, `metadata.banner_url`, `portfolio_items` | `professional_logo`, `professional_banner`, `professional_portfolio` |
| Banner do site | `banners.image_url` | `site_banner` |
| Marca do site | `site_settings.value` | `site_logo`, `site_favicon` |

## Migrations aplicadas

1. `20260715113000_consolidate_public_media_asset_domains.sql`: presets, guardas de escrita e links canônicos, sem apagar legado.
2. `20260717120000_create_cp016_media_backfill_commands.sql`: comandos temporários restritos a `service_role` e ledger privado sem URLs.
3. `20260717121000_finalize_cp016_media_cutover.sql`: asserção de legado zero, validação de ledger/ativos/links e remoção da superfície temporária.

A terceira migration é replayable: banco novo sem dados passa pelas asserções sem exigir backfill externo entre migrations.

## Evidência remota

- linha de base: 1 empresa, 23 classificados e 1 site setting com legado;
- dry-run: 55 referências, 25 agregados e 46 transformações únicas;
- backfill: 49 imagens migradas e vinculadas;
- 6 URLs Unsplash retornaram HTTP 404 no original e na variante otimizada;
- essas 6 referências opcionais foram descartadas com hash e motivo auditados;
- preflight final: zero legado em todos os sete domínios;
- ledger final: 49 `migrated`, 6 `dropped`, 0 inválidas;
- comandos temporários finais: 0.

Auditorias permanentes:

- `tests/security/media-assets-cp016-preflight-remote-audit.sql`;
- `tests/security/media-assets-cp016-legacy-shape-remote-audit.sql`;
- `tests/security/media-assets-cp016-cutover-remote-audit.sql`.

## Controles implementados

- upload autenticado pelo broker `media-assets`;
- owner e Profile ativo resolvidos no backend;
- allowlist exata de origem para o backfill;
- HTTPS sem redirect, credenciais ou porta arbitrária;
- limite de bytes, timeout, MIME e decode real;
- JPEG sanitizado, sem APP/COM e sem bytes após EOI;
- reserva idempotente, `upsert: false` e finalização compare-and-swap;
- BOLA/IDOR bloqueados por owner, preset, agregado e triggers;
- URL legada nunca foi gravada no ledger nem exposta em logs.

## Validação de entrega

Passaram: typecheck global, lint, build, testes MediaAsset/SSOT, testes JPEG, validadores de dependências, SSOT, segurança e migrations. A migration de corte também compilou contra o remoto dentro de uma transação com rollback antes da aplicação definitiva.

## Regra permanente

Não recriar os RPCs `*_cp016_media_asset_backfill`. Nova origem de imagem pública deve ganhar preset/versão e adapter no MediaAsset SSOT. Fluxo privado deve permanecer em contrato separado.

O estado operacional vigente do produto não está neste arquivo histórico. Consulte `docs/README.md` e `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.