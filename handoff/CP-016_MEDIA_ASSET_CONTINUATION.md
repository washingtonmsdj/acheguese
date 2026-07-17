# CP-016 - Consolidacao de midia publica no Media Asset

**Status:** em andamento, checkpoint local nao validado.

**Responsavel pela proxima etapa:** qualquer IA ou desenvolvedor que retomar o
trabalho deve seguir este documento antes de alterar codigo ou aplicar SQL.

**Objetivo:** tornar `media_assets` a unica fonte de verdade para imagens
publicas de avatar, empresas, classificados, profissionais e configuracoes
visuais do site. A aplicacao deve persistir apenas referencias canonicas no
formato `storage://media-assets/<profile>/<preset>/v1/<asset>.jpg`; URLs de
renderizacao devem ser resolvidas a partir dessas referencias.

## Estado confirmado

- O projeto usa Supabase remoto. A migration CP-016 **nao foi aplicada**.
- O worktree possui centenas de alteracoes locais de diversas frentes. Nao
  presuma que elas pertencem ao CP-016 e nao as inclua em commits deste trabalho.
- A branch atual e `main`, com remoto `origin`. Este handoff deve ser tratado
  como o ponto de retomada auditavel do CP-016.
- Os assets de post, review, cardapio, anexos privados, evidencias de seguranca
  e virtual try-on nao fazem parte da migracao de dominio CP-016. Eles so podem
  ser alterados em um plano proprio, com sua politica de seguranca preservada.

## Decisoes de dominio ja definidas

| Dominio | Campo canonico | Preset | Dono do asset | Observacao |
| --- | --- | --- | --- | --- |
| Avatar | `profiles.avatar_url` | `user_avatar` | perfil do usuario | O nome do campo e legado, mas seu valor deve ser referencia canonica. |
| Empresa | `business_data.metadata.logo_url` e `banner_url` | `business_logo`, `business_banner` | perfil dono da empresa | Nao copiar logo para avatar do perfil. |
| Galeria de empresa | `business_gallery.image_url` | `business_gallery` | perfil dono da empresa | Nao usar `metadata.fotos`. |
| Classificado | `classifieds.photos` | `classified_image` | `seller_id` | Armazenar lista de referencias, nao URLs. |
| Profissional | `professional_data.metadata.logo_url`, `banner_url`, `portfolio_items` | `professional_logo`, `professional_banner`, `professional_portfolio` | `profile_id` | Nao usar `metadata.portfolio_images` nem avatar como fallback. |
| Banner do site | `banners.image_url` | `site_banner` | perfil de admin autor | A tabela nao tem owner proprio: comando deve validar o ator. |
| Marca do site | `site_settings.value` | `site_logo`, `site_favicon` | perfil de admin autor | A configuracao precisa manter referencia, nao URL bruta. |

## Checkpoint local existente

Ha implementacao parcial local. Ela foi deliberadamente deixada sem commit de
codigo porque ainda nao passou por typecheck, testes, revisao de migration e
auditoria remota. Antes de reaproveita-la, revise os diffs de cada arquivo.

### Migration pendente

`supabase/migrations/20260715113000_consolidate_public_media_asset_domains.sql`

Tentativas presentes na migration:

- ampliar os presets e tipos agregados aceitos por `media_assets`;
- criar triggers para vincular referencias de avatar, empresa, galeria,
  classificado, profissional, banner e site setting ao asset canonico;
- rejeitar URLs brutas e referencias de preset ou owner incorretos;
- limpar dados legados em campos publicos.

**Bloqueio obrigatorio:** o SQL atual contem operacoes de limpeza destrutivas
(`DELETE` e `UPDATE` que removem valores antigos). Nao aplique a migration como
esta. Primeiro execute uma auditoria de contagem no remoto, confirme por escrito
que o ambiente nao possui dados de clientes, e reescreva a migration para:

1. validar o estado atual e falhar com mensagem clara se houver dados legados;
2. migrar referencias validas quando existir caminho seguro;
3. executar limpeza somente em ambiente explicitamente autorizado;
4. separar schema, backfill e remocao em migrations auditaveis.

### Presets e referencias

Alteracoes locais relevantes:

- `src/core/media/config/mediaPresets.ts`
- `supabase/functions/_shared/mediaPresets.ts`
- `src/core/media/references/mediaAssetReference.ts`
- `src/shared/utils/urlSafety.ts`

Os presets novos pretendidos sao `professional_banner`, `site_logo` e
`site_favicon`. A lista de presets do cliente e da Edge Function deve ser
exatamente equivalente, protegida por teste automatizado. Avalie o import de
`urlSafety` para o core de media: se isso criar inversao de dependencia, extraia
o resolvedor de referencias para uma camada compartilhada e pura.

### Writers parcialmente adaptados

Os seguintes fluxos foram encaminhados para `mediaService.uploadMediaAsset`,
mas ainda precisam de revisao integrada:

- avatar: `profile.mutations.ts`, `ProfileService.ts`, `useAvatarUpload.ts`;
- empresa: schemas, mutations, mappers, hooks de create/edit/upload e servicos
  `BusinessSettingsService` e `BusinessManagementService`;
- classificado: `ClassifiedImageService`, hook de imagem e pagina de criacao;
- profissional: schemas, lifecycle, mappers, facade e paginas de cadastro/edicao;
- branding administrativo: `SiteSettingsService` e `AdminBranding.tsx`;
- banner: `BannerService.ts` foi atualizado, mas `BannersPage.tsx` ainda precisa
  passar o perfil administrador para o novo contrato.

Antes de prosseguir, rode `rg "uploadAvatar|uploadBusinessImage|uploadProfessionalImage|uploadToBucket" src supabase` e classifique cada uso. Nao remova wrappers genericos enquanto ainda houver consumidores legitimos (por exemplo, evidencias privadas e virtual try-on).

### Readers parcialmente adaptados

- `SafeImage` foi adotado em `business-logo.tsx` e `ProfessionalHeader.tsx`.
- Mappers de empresa, classificado e profissional foram alterados para trabalhar
  com referencias ou URLs resolvidas.

Falta garantir que **todo** consumidor de avatar, logo, banner, galeria,
classificado, portfolio e branding use um resolvedor canonico e `SafeImage` ou
componente equivalente. Nenhuma tela deve aceitar URL arbitraria vinda do banco
como `src` sem validacao de host e de tipo de referencia.

## Plano de execucao obrigatorio

### Fase 0 - Isolamento e baseline

1. Rode `git status --short` e registre os arquivos que ja estavam sujos.
2. Nao use `git add -A`, `git commit -a`, `git reset --hard` ou force push.
3. Inspecione os diffs locais do CP-016 individualmente antes de mantelos.
4. Leia `docs/architecture/MEDIA_ASSET_SSOT.md` e
   `plans/CORE_PLATFORM_CONSOLIDATION_PLAN.md`.
5. Atualize este handoff e o plano mestre se a realidade encontrada divergir.

### Fase 1 - Contrato e migration seguros

1. Compare `mediaPresets.ts` com `functions/_shared/mediaPresets.ts` e crie um
   teste de paridade de presets, mime types e dimensoes.
2. Reescreva a migration CP-016 em etapas idempotentes e reversiveis no nivel
de dados: schema, verificacao/backfill, depois corte do legado.
3. Adicione testes SQL para owner, aggregate type/id, preset, acesso anonimo e
tentativas de BOLA/IDOR em cada dominio.
4. Execute auditoria remota somente em modo leitura antes de qualquer `db push`.
5. Nao execute `supabase db push` sem validar que o ambiente, a ordem das
migrations e os dados existentes correspondem ao plano.

### Fase 2 - Completar writers por dominio

1. Avatar: uma unica chamada `uploadMediaAsset` pelo perfil ativo; persistir a
referencia em `profiles.avatar_url`.
2. Empresa: terminar create, edit e galeria; persistir galeria na tabela
`business_gallery`, nunca em JSON duplicado.
3. Classificado: limitar arquivos, concorrencia e tamanho; persistir somente
referencias no JSONB `photos`.
4. Profissional: concluir logo, banner e portfolio estruturado; remover facade
ou implementacao duplicada somente depois de todos os imports migrarem.
5. Branding: corrigir `BannersPage.tsx`, usar `activeProfile.id`, persistir
referencias de logo/favicon/banner e apresentar aviso de upload sem mascarar
falha de comando principal.

### Fase 3 - Readers, interface e compatibilidade

1. Centralize a resolucao de referencias em um contrato puro e tipado.
2. Converta gradualmente cada renderizador publico para `SafeImage`.
3. Mantenha compatibilidade de leitura apenas pelo tempo necessario ao backfill;
documente data e criterio de remocao.
4. Remova fallbacks entre dominios, como logo de empresa virando avatar e avatar
virando logo profissional.

### Fase 4 - Remover legado e duplicacoes

1. Depois de `rg` sem consumidores, remova de `MediaService` os wrappers
`uploadAvatar`, `uploadBusinessImage` e `uploadProfessionalImage`.
2. Elimine os campos JSON duplicados e servicos mortos apenas depois de migration
e testes provarem que nao ha leitura/escrita residual.
3. Preserve os fluxos privados fora do dominio de midia publica; eles exigem
politicas e buckets diferentes.

### Fase 5 - Validacao e entrega

Execute, na ordem, os comandos definidos pelo repositorio (ajuste apenas se o
`package.json` trouxer nomes diferentes):

```powershell
npm run typecheck
npm run lint
npm test -- --runInBand
npm run validate:architecture
npm run validate:security
npm run build
```

Adicione testes especificos para:

- rejeicao de URL externa e referencia malformada;
- owner e preset incorretos;
- leitura de cada agregado por anonimo, dono, outro usuario e admin;
- upload e render de cada dominio;
- limites de arquivo e concorrencia;
- rollback/erro de upload sem gravar referencia inexistente.

Somente apos todos os gates verdes e auditoria remota aprovada: aplicar migration,
regenerar tipos Supabase se o projeto os versionar, atualizar
`MEDIA_ASSET_SSOT.md`, o plano mestre e este handoff. O commit de codigo deve
conter apenas arquivos CP-016 relacionados; revise `git diff --cached --check`
antes de publicar.

## Criterios de pronto

- Cada asset publico tem um preset, owner e aggregate validos no backend.
- O browser nao escreve em tabelas de midia e nao escolhe owner/aggregate livremente.
- Nenhum dominio mantem URL publica e referencia canonica para o mesmo asset.
- Cada tela resolve referencias por um unico caminho seguro.
- Nao ha fallback de identidade visual entre dominios.
- Testes de autorizacao e de contratos impedem regressao de BOLA/IDOR, upload em
nome de terceiro, URL arbitraria e preset indevido.
- O remoto foi auditado e as migrations foram aplicadas sem apagar dados por acidente.

## Registro de entrega deste checkpoint

Este checkpoint deliberadamente publica somente a documentacao de continuidade.
Nenhum codigo CP-016 parcial deve ser considerado entregue, aplicado no remoto
ou pronto para producao ate que as fases acima terminem.
