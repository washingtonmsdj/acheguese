# MediaAsset SSOT

Status: ativo; dominios de imagem publica canonicos; CP-016 concluido; G4 global upload ownership fechado em 2026-08-29
Data: 2026-07-17
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

| Responsabilidade               | Autoridade                                                      |
| ------------------------------ | --------------------------------------------------------------- |
| Presets permitidos no servidor | `supabase/functions/_shared/mediaPresets.ts`                    |
| Hints de otimizacao no cliente | `src/core/media/config/mediaPresets.ts`                         |
| Transporte autenticado         | `supabase/functions/media-assets/index.ts`                      |
| Metadata e estado              | `public.media_assets`                                           |
| Vinculo a agregado             | `public.media_asset_links`                                      |
| Referencia e resolucao         | `src/core/media/references/mediaAssetReference.ts`              |
| Cleanup fisico                 | `media-assets-cleanup` + `private.invoke_media_asset_cleanup()` |
| Regras de anexacao por dominio | triggers privados e adapters dos dominios                       |

O registro do cliente nao e autoridade de seguranca. Divergencia de limite e
resolvida pelo Edge/banco, que falham fechado.

## 3. Presets v1

| Preset                   | Maximo | Dimensoes maximas | Limite 24h | Nao anexados |
| ------------------------ | -----: | ----------------: | ---------: | -----------: |
| `user_avatar`            |   2 MB |       1200 x 1200 |         10 |            3 |
| `post_image`             |   5 MB |       1800 x 1800 |         20 |           20 |
| `business_logo`          |   5 MB |       1600 x 1600 |         20 |           10 |
| `business_banner`        |   5 MB |       2400 x 1600 |         20 |           10 |
| `business_gallery`       |   5 MB |       2000 x 2000 |         40 |           20 |
| `review_photo`           |   5 MB |       1800 x 1800 |         30 |           12 |
| `gastronomy_menu_item`   |   5 MB |       1800 x 1800 |         50 |           20 |
| `classified_image`       |   5 MB |       2200 x 2200 |         40 |           20 |
| `professional_logo`      |   5 MB |       1600 x 1600 |         20 |           10 |
| `professional_banner`    |   5 MB |       2400 x 1600 |         20 |           10 |
| `professional_portfolio` |   5 MB |       2000 x 2000 |         40 |           20 |
| `site_banner`            |   5 MB |       2400 x 1600 |         20 |           10 |
| `site_logo`              |   2 MB |       1600 x 1600 |         10 |            5 |
| `site_favicon`           | 512 KB |         512 x 512 |         10 |            5 |
| `attachment_image`       |   5 MB |       2000 x 2000 |         20 |           10 |

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
7. O dominio persiste a referencia. Triggers comprovam owner, preset, estado,
   agregado e exclusividade e criam `media_asset_links`.

Os comandos de lifecycle sao executaveis somente por `service_role`. Browser
nao escreve `media_assets`, `media_asset_links` ou `storage.objects`.

## 5. Leitura e URL

O banco conserva `storage://`. O resolver transforma a referencia em URL
publica apenas no read model/UI. URL externa arbitraria e path traversal falham
fechado. Paths relativos sao aceitos somente para fixtures controladas pelo
codigo e nunca sao gravados por fluxos de dominio.

Posts e Achados/Perdidos usam o preset `post_image`. Cada referencia e validada
contra owner, preset, versao, estado ativo e anexo unico; os triggers mantem os
links `post` e `lost_found_post`. O navegador nao possui writer direto em bucket
publico e uma falha de persistencia deixa o asset para o cleanup limitado de
orfaos, sem conceder delete de Storage ao cliente.

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

## 8. Corte CP-016

CP-016 foi concluido no remoto em 2026-07-17 pelas migrations
`20260715113000`, `20260717120000` e `20260717121000`:

- preflight: 1 empresa, 23 classificados e 1 configuracao com legado;
- dry-run: 55 referencias em 25 agregados, sem escrita;
- backfill: 49 imagens sanitizadas, migradas, ativas e vinculadas;
- indisponibilidade: 6 URLs Unsplash com HTTP 404 foram removidas de dois
  classificados; hash e motivo ficaram no ledger privado, sem persistir URL;
- pos-corte: zero referencias nao canonicas nos sete dominios auditados;
- ledger: 49 entradas `migrated`, 6 `dropped`, zero entradas invalidas;
- os tres RPCs publicos e os tres helpers privados temporarios foram removidos.

`private.media_asset_migration_audit` permanece como proveniencia imutavel e
sem URL. Os SQLs de evidencia sao:

- `tests/security/media-assets-cp016-preflight-remote-audit.sql`;
- `tests/security/media-assets-cp016-legacy-shape-remote-audit.sql`;
- `tests/security/media-assets-cp016-cutover-remote-audit.sql`.

## 9. Corte de Posts e Achados/Perdidos

Concluido no remoto em 2026-07-17 pela migration
`20260717130000_consolidate_community_post_media_assets.sql`:

- `posts.images` e `lost_found_posts.imagens` aceitam somente referencias do
  preset `post_image` pertencentes ao autor e em estado `active`;
- triggers sincronizam `media_asset_links` com os agregados `post` e
  `lost_found_post`;
- o writer e o cleanup direto do navegador foram removidos;
- o bucket vazio `post_images` foi removido pela API oficial do Storage;
- auditoria remota: zero referencia invalida, link ausente, bucket, policy ou
  funcao legada;
- probe anonimo: insert de Post bloqueado com `42501` e upload direto em
  `media-assets` bloqueado com `403`.

Evidencia somente leitura:
`tests/security/community-media-assets-cutover-remote-audit.sql`.

Documentos privados, evidencias de seguranca e virtual try-on continuam fora
deste SSOT e preservam buckets e politicas proprios. `uploadToBucket` nao pode
ser reutilizado para imagens publicas canonicas; a API restante e limitada ao
staging publico especializado do Try-On.

## 10. G4 global upload ownership — 2026-08-29

O hardening global separa explicitamente cinco classes de Storage. Elas nao sao
SSOTs concorrentes porque cada uma possui semantica e autoridade distintas:

1. **Imagem publica canonica de dominio** — `MediaService.uploadMediaAsset()` ->
   Edge Function `media-assets` -> `public.media_assets`/`media_asset_links`.
2. **Arquivo privado sensivel** — `MediaService.uploadPrivateFile()` e
   `createPrivateSignedUrl()` sao primitivas de transporte; o dominio continua
   owner da autorizacao e persistencia. Safety usa exclusivamente
   `SafetyEvidenceService` e grava referencia `storage://safety-evidence/...`.
3. **Staging publico especializado** — `uploadToBucket()` aceita somente o tipo
   `PublicImageUploadBucket`, cujo contrato atual contem apenas `tryon`. Buckets
   historicos `business_images` e `classified_images` nao podem voltar a ser
   writers de produto por esse helper.
4. **Geracao/lifecycle server-side** — `ai-image` e `tryon-generate` podem gravar
   outputs gerados no servidor em `ai-images`/`tryon`; `media-assets-cleanup`
   pode remover orfaos. Esses gateways sao owners de operacoes concretas.
5. **Observacao operacional metadata-only** — `health-check` pode consultar
   apenas a metadata do bucket canonico `media-assets` via `getBucket`, somente
   apos `requireAdmin`. Essa classe nao possui ownership nem leitura de objetos
   e nao pode adquirir list, download, signed URL, upload, remove, update, move
   ou copy sem mudar explicitamente o contrato.

`tools/architecture/validate-upload-ssot.ts` protege tanto `src` quanto
`supabase/functions`: direct Storage no frontend fica concentrado no
`MediaService`; Edge Functions com `.storage` falham por padrao. Gateways de
mutacao e observers metadata-only precisam ser classificados separadamente e
cada classe possui invariantes fail-closed proprias.

### Safety evidence

O fluxo duplicado `SafetyService.uploadSafetyEvidence()` foi aposentado.
`SafetyEvidenceService` e o unico owner de leitura/escrita de
`public.safety_evidence` e usa o bucket privado `safety-evidence`.

Em 2026-08-29 a auditoria remota encontrou o bucket privado sem policies de
`storage.objects`, apesar do fluxo browser autenticado ja existir. A migration
`20260829161927_repair_safety_evidence_storage_owner_policies.sql` foi aplicada
e versionada no mesmo corte. Ela autoriza somente `authenticated` para:

- `INSERT` de objeto cujo primeiro segmento e um `incident_id` pertencente ao
  Profile do usuario;
- `SELECT` do mesmo escopo, necessario para signed URL;
- `DELETE` do mesmo escopo, necessario para compensacao de upload orfao.

Nao existe policy de `UPDATE`, `anon` ou `public`. A expressao de ownership
mantem `storage.foldername(name)` fora da subquery de Profiles para evitar
shadowing por colunas chamadas `name`.

### Verification documents

`MediaService.uploadVerificationDocument()` permanece no source como API privada
historica, mas a busca global no checkpoint de 2026-08-29 encontrou somente sua
propria definicao e teste; nao existe caller runtime de produto. Portanto o
bucket `verification-documents` nao constitui segunda autoridade ativa de G4.

A policy historica desse bucket apresenta uma expressao que deve ser
reconciliada na auditoria exaustiva de **G5 Database/RLS/legado** antes de o fluxo
ser reativado. Ate la, nenhum novo caller deve ser introduzido sem reparar e
provar o contrato remoto primeiro.

### Criterio de fechamento G4

No nivel de autoridade arquitetural/source exigido pelo plano global:

- owner publico canonico: unico;
- owner privado de Safety: unico;
- helper publico residual: restrito a Try-On;
- gateways server-side de mutacao: enumerados e fail-closed por validator;
- observers server-side metadata-only: enumerados, admin-only, sem leitura de
  objetos e sem mutacao;
- banco remoto conhecido nao contradiz o fluxo ativo de Safety apos a migration
  `20260829161927`;
- drift inativo de `verification-documents` fica explicitamente transferido a
  G5, sem ser interpretado como fluxo certificado.

A certificacao hosted same-SHA continua separada: falha de runner sem steps nao
e convertida em PASS de codigo.
