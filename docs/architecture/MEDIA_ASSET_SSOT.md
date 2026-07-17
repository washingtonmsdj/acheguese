# MediaAsset SSOT

Status: ativo; Review e Menu canonicos; migracao dos demais buckets rastreada
Data: 2026-07-14
Owner: `src/core/media`, `supabase/functions/media-assets` e lifecycle no banco

## 1. Decisao

`MediaAsset` e a identidade canonica de uma imagem publica validada pela
plataforma. O banco persiste uma referencia imutavel, nunca uma URL de CDN como
fonte de verdade:

```text
storage://media-assets/{ownerProfileId}/{preset}/v{version}/{assetId}.jpg
```

O dominio decide se pode anexar uma imagem, quantas imagens aceita e por quanto
tempo o agregado vive. O Core decide autenticacao do upload, preset, formato,
path, quota, metadata, ownership, referencia, cleanup e resolucao para CDN.

O bucket `media-assets` contem apenas imagens publicas destinadas a descoberta.
Documentos privados, comprovantes e evidencias sensiveis continuam em buckets
privados e nao podem ser movidos para esse contrato.

## 2. Autoridades

| Responsabilidade | Autoridade |
| --- | --- |
| Presets permitidos no servidor | `supabase/functions/_shared/mediaPresets.ts` |
| Hints de otimizacao no cliente | `src/core/media/config/mediaPresets.ts` |
| Transporte autenticado | `supabase/functions/media-assets/index.ts` |
| Metadata e estado | `public.media_assets` |
| Vinculo a agregado | `public.media_asset_links` |
| Referencia e resolucao | `src/core/media/references/mediaAssetReference.ts` |
| Cleanup fisico | `media-assets-cleanup` + `private.invoke_media_asset_cleanup()` |
| Regras de Review/Menu | triggers privados e adapters dos dominios |

O registro do cliente nao e autoridade de seguranca. Divergencia de limite e
resolvida pelo Edge/banco, que falham fechado.

## 3. Presets v1

| Preset | Maximo | Dimensoes maximas | Limite 24h | Nao anexados |
| --- | ---: | ---: | ---: | ---: |
| `user_avatar` | 2 MB | 1200 x 1200 | 10 | 3 |
| `post_image` | 5 MB | 1800 x 1800 | 20 | 20 |
| `business_logo` | 5 MB | 1600 x 1600 | 20 | 10 |
| `business_banner` | 5 MB | 2400 x 1600 | 20 | 10 |
| `business_gallery` | 5 MB | 2000 x 2000 | 40 | 20 |
| `review_photo` | 5 MB | 1800 x 1800 | 30 | 12 |
| `gastronomy_menu_item` | 5 MB | 1800 x 1800 | 50 | 20 |
| `classified_image` | 5 MB | 2200 x 2200 | 40 | 20 |
| `professional_logo` | 5 MB | 1600 x 1600 | 20 | 10 |
| `professional_portfolio` | 5 MB | 2000 x 2000 | 40 | 20 |
| `site_banner` | 5 MB | 2400 x 1600 | 20 | 10 |
| `attachment_image` | 5 MB | 2000 x 2000 | 20 | 10 |

Alterar dimensao, transformacao ou semantica exige nova versao do preset. Nao
se altera silenciosamente o significado de `v1`.

## 4. Fluxo de escrita

1. O navegador otimiza para JPEG como melhoria de UX; falha de decode aborta.
2. `media-assets` valida JWT e ownership de Profile ativo.
3. O broker limita o corpo antes de `formData()`, valida JPEG por bytes,
   SOI/EOI, segmentos e dimensoes, e remove APP/COM metadata.
4. O servidor gera `assetId` e path; nome enviado pelo usuario e ignorado.
5. `reserve_media_asset_upload` serializa a quota por Profile/preset com
   advisory lock e cria estado `reserved`.
6. Storage recebe JPEG com `upsert: false`; sucesso muda o estado para `active`.
7. Review/Menu persistem a referencia. Triggers comprovam owner, preset,
   estado e exclusividade e criam `media_asset_links`.

Os comandos de lifecycle sao executaveis somente por `service_role`. Browser
nao escreve `media_assets`, `media_asset_links` ou `storage.objects`.

## 5. Leitura e URL

O banco conserva `storage://`. O resolver transforma a referencia em URL
publica apenas no read model/UI. URL externa arbitraria e path traversal falham
fechado. Paths relativos sao aceitos somente para fixtures controladas pelo
codigo e nunca sao gravados pelos novos fluxos de Review/Menu.

## 6. Lifecycle e cleanup

Estados: `reserved -> active -> deleting -> deleted`; falha de upload usa
`reserved -> failed`. Compensacao remove o objeto se upload/ativacao falhar.

O cron `media-assets-cleanup-every-5-minutes` chama a Edge Function via
`pg_net`. URL e `CRON_SECRET` ficam no Supabase Vault. Cada execucao processa
no maximo cinco lotes de 100 registros. O claim usa `FOR UPDATE SKIP LOCKED`.

- `reserved`, `failed` e `deleting` sao elegiveis depois de 1 hora;
- `active` sem link e elegivel depois de 24 horas;
- Storage e removido antes do estado final `deleted`;
- falha deixa o item recuperavel para retry, sem hard delete de metadata.

## 7. Evidencias remotas

Validado no projeto vinculado em 2026-07-14:

- migrations `20260714125000` e `20260714126000` aplicadas;
- bucket publico somente JPEG, limite de 5 MB;
- Edge Functions ativas com `verify_jwt=true` no upload e segredo de cron no
  cleanup;
- upload JPEG valido retornou referencia canonica;
- objeto publico respondeu 200 e o JPEG sanitizado foi decodificado em suas
  dimensoes originais pelo probe;
- outro Profile observou zero rows por RLS e recebeu `403` no ownership cruzado;
- JPEG com payload apos EOI recebeu `415`;
- quota de nao anexados bloqueou a reserva excedente com `P0001`;
- anon/authenticated nao executam RPCs de lifecycle; `service_role` executa;
- probe de quota terminou com rollback e zero reservas persistidas;
- cleanup removeu o objeto fisico e marcou metadata como `deleted`;
- scheduler ativo `*/5 * * * *` e chamada `pg_net` retornou HTTP 200.

Testes versionados: `npm run test:media:ssot`, migration validator, ownership
validator e security validator.

## 8. Residual CP-016

Avatar, imagens gerais de Business, Classified, Professional, Site e alguns
wrappers antigos de `MediaService` ainda usam contratos de bucket anteriores.
Eles nao podem reutilizar presets de Post, Review ou Menu e nao devem ganhar
novos consumidores. A migracao deve ocorrer por preset e dominio, preservando
as regras privadas de documentos/evidencias e removendo cada caminho anterior
somente depois de consumidores e dados zerados.

Esse residual nao reabre CP-006: o acoplamento incorreto de Gastronomia ao
lifecycle de Post foi removido. Ele registra que a adocao de `MediaAsset` pelos
demais uploads ainda nao esta concluida.
