# G5 — Hosted build recovery and Business ownership fix — 2026-08-30

Status: **SOURCE CORRIGIDO / RETEST FINAL BLOQUEADO POR PROVIDER**  
Branch: `main`  
HEAD desta evidência antes do commit documental: `13e4efb162baca392c5363e02bdb743143121439`

## Objetivo

Registrar a primeira execução Vercel posterior à reconciliação dos três erros TypeScript já conhecidos, separar provas positivas de gates realmente executados e documentar o único blocker de source encontrado nessa execução.

## 1. Build hospedado voltou a executar

Deployment Vercel:

- `dpl_7XsCkpARGrEreakpC1t2mtBkR6DC`;
- source commit: `72b61815c4330a3e1f3a225aae5eb504c3b9e741`;
- branch: `main`;
- target: production.

Esse deployment não morreu por rate-limit antes do build. Ele executou de fato os gates de produção.

### Gates executados com sucesso

O log hospedado prova:

- lint amplo inicial chegou a `92 problems (0 errors, 92 warnings)`;
- `validate:upload:ssot`: PASS;
- `validate:architecture:core-platform`: PASS;
- `generate:sitemap`: PASS;
- sitemap gerado com `4` arquivos, `114302` URLs, `16327` locations e `1` grupo;
- validação do sitemap: PASS, index válido com `3` arquivos filhos e `114302` URLs;
- `validate:vercel:inputs`: PASS;
- `validate:csp`: PASS;
- `validate:turnstile:production`: PASS;
- `typecheck:app`: executou e concluiu sem erro TypeScript antes de avançar para lint.

Consequência: os três erros TypeScript registrados anteriormente em Jobs/Event engagement ficaram efetivamente superados em hosted execution nesse commit.

## 2. Único erro bloqueante encontrado

O build parou no `eslint src api` com exatamente um erro:

- `src/core/business/services/BusinessOwnershipService.ts`;
- regra: `ssot/no-direct-profile-access`;
- causa: `.from('profiles')` fora do owner canônico `ProfileService`.

Os dois findings de Maps no mesmo lint eram `warning`, não blockers.

Não foi adicionada whitelist, disable ou exceção para esconder o erro.

## 3. Correção de source

A correção foi feita diretamente em `main` preservando a semântica de autorização:

- `048cdbaa47b4ba2a7d8f72571823f53cafa87992` — primeira migração do caller para Profile authority;
- `63df7fc4886b2c0dd080e8f3fa49313b4de92e7c` — preserva explicitamente a semântica de dono direto via `profileService.getProfileById(ownerProfileId)` + `profile.user_id`;
- memberships continuam delegadas a `ProfileMembersService.isManager(ownerProfileId, userId)`.

A correção não usa `profileService.isProfileOwner()` porque esse adapter atualmente resolve apenas ownership de membership; usá-lo teria alterado silenciosamente o contrato de dono direto de `profiles.user_id`.

## 4. Alinhamento com authority viva do banco

A função remota `private.can_manage_profile(uuid)` foi revalidada diretamente no catálogo vivo.

Ela retorna true quando:

1. existe `public.profiles` com `p.id = p_profile_id` e `p.user_id = auth.uid()`; ou
2. existe `public.profile_members` para o profile/user atual com `is_active = TRUE` e role em `owner/admin`.

A função é `SECURITY DEFINER`, fixa `search_path`, e seu ACL atual concede execução a `authenticated` e `service_role`, não a PUBLIC.

Portanto o runtime corrigido permanece semanticamente alinhado à authority canônica do banco.

## 5. Ratchet corrigido

O teste `tests/architecture/business-management-authority-ssot.test.ts` foi atualizado para:

- exigir `profileService.getProfileById(ownerProfileId)`;
- exigir comparação de `profile.user_id`;
- exigir delegação de manager para `ProfileMembersService.isManager`;
- proibir retorno de `.from('profiles')` ao `BusinessOwnershipService`;
- verificar que `ProfileMembersService` exige membership ativa e aceita somente owner/admin para manager.

Também foi corrigida uma referência de migration obsoleta que faria o teste falhar quando o CI voltasse:

- antigo/inexistente: `20260826100000_unify_business_profile_management_authority.sql`;
- canônico/ledger-aligned: `20260826095937_unify_business_profile_management_authority.sql`;
- commit: `13e4efb162baca392c5363e02bdb743143121439`.

A busca pelo timestamp aposentado `20260826100000` encontrou somente esse ratchet.

## 6. Sitemap: evidência hospedada e otimização posterior

O deployment `72b61815...` provou que o sitemap anterior já era funcional e válido com 114302 URLs.

Depois dessa prova, o caminho de build foi otimizado em source para reduzir transferência sem alterar o inventário público:

- `a8ee70451c003a016b74a8660c20ed101ff8b902` — adiciona leitura mínima de locations para routing público;
- `dec43c473f3337a35aa5b918d39a084c66eca2b2` — sitemap passa a usar a projeção mínima;
- `ca0035a4c0cdf58e7a99e8d190ef5e1548446692` — ratchet contra retorno a `select=*` no sitemap;
- `796f5f0b9639155aeaca288bd946470dc5ecb2eb` — tipa a projeção pela SSOT `types.generated.ts`;
- `8d5a1eb843b055cede8c8663621ae85f689288e7` — consumidor SEO usa o contrato tipado.

A projeção traz somente `id,type,status,geographic_path,metadata`, filtra `city/district` + `active` no banco e preserva paginação fail-closed. O tipo gerado versionado confirma `geographic_path: string`; `metadata` nullable já é tratado pelo helper de visibilidade.

Esse corte posterior ainda precisa de hosted retest porque o Vercel passou a recusar novos builds por `build-rate-limit`.

## 7. Estado atual do hosted gate

Para HEADs posteriores ao deployment acima, incluindo o corte do sitemap e o fix de ownership, o status Vercel voltou a apontar:

- `upgradeToPro=build-rate-limit`.

Portanto:

- há prova hospedada de typecheck PASS até `72b61815...`;
- há prova hospedada do único lint blocker naquele commit;
- o blocker foi corrigido em source sem bypass;
- não existe ainda hosted PASS posterior a `63df7fc...`/`13e4efb...`;
- não marcar build final como PASS até um deployment posterior realmente executar.

## 8. G5 consequence

G5 permanece **EM EXECUÇÃO**. Não iniciar G6.

Blockers centrais independentes continuam:

1. materialização integral dos tipos Supabase canônicos quando o runner autorizado executar;
2. lifecycle oficial do bucket órfão `classified-images`;
3. GitHub Actions com runner e steps realmente executados;
4. hosted retest pós-fix de Business Ownership e pós-otimização do sitemap.

## 9. Do not repeat

- Não reabrir os três erros TypeScript antigos sem nova reprodução hospedada.
- Não recriar acesso direto a `profiles` no `BusinessOwnershipService`.
- Não substituir owner direto por `ProfileMembersService.isOwner`: são contratos diferentes.
- Não adicionar whitelist/disable ESLint para esconder o caller.
- Não voltar o ratchet para timestamp `20260826100000`.
- Não interpretar os dois warnings de Maps como a causa do build failure registrado aqui.
- Não marcar o sitemap otimizado como hosted PASS até execução posterior a `8d5a1eb...`.
- Não interpretar `build-rate-limit` como regressão de source.
