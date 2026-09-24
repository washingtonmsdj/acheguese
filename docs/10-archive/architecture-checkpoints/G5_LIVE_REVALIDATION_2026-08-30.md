# G5 — Revalidação viva dos blockers — 2026-08-30

Status: **EM EXECUÇÃO / G6 BLOQUEADO**  
Branch: `main`  
HEAD observado no início desta revalidação: `60b4e048712d36eb4fef121153598d335629aa61`  
Último HEAD revalidado nesta nota: `b682ced87c341ce6542e85f69b35d65929cd9f33`  
Projeto Supabase canônico: `xhdowzacfujckjelqhtd`

## Objetivo

Registrar somente fatos vivos que alteram ou refinam os blockers remanescentes de G5, sem reabrir auditorias já fechadas e sem transformar indisponibilidade de provider em falha de source.

## 1. Tipos Supabase — geração oficial disponível, materialização integral ainda bloqueada

A capability oficial conectada de geração de tipos foi executada novamente contra o projeto canônico e respondeu com o payload TypeScript vivo completo.

A comparação pontual confirma drift real entre o schema remoto e o snapshot versionado:

- o output remoto reporta `PostgrestVersion: "14.5"`;
- `src/integrations/supabase/types.generated.ts` ainda reporta `PostgrestVersion: "14.4"`;
- o output remoto contém `public.account_deletion_requests`;
- o snapshot versionado não contém `account_deletion_requests`;
- o cliente em `src/integrations/supabase/supabase.ts` importa `Database` diretamente de `./types.generated`, portanto esse arquivo continua sendo a única SSOT de tipos do cliente.

Conclusão:

- o gate **client types reconciled** continua aberto;
- não é aceitável corrigir manualmente apenas versão, enums, campos ou tabelas isoladas;
- não criar `types.ts`, `database.types.ts` ou outra autoridade paralela;
- a correção válida continua sendo materializar integralmente o output oficial no arquivo canônico e validar o source resultante.

O workflow `.github/workflows/supabase-types-sync.yml` contém a implementação correta para esse lifecycle: geração oficial por `supabase gen types typescript --project-id`, validação mínima do artefato, escrita UTF-8 sem BOM e commit apenas quando o único drift é `src/integrations/supabase/types.generated.ts`. Não substituir esse fluxo por reconstrução manual do payload retornado pelo conector.

## 2. Storage — órfão atual confirmado

Consulta autenticada ao catálogo vivo de `storage.buckets` mostrou o conjunto atual de buckets do projeto canônico. Os nomes históricos `menu-items` e `restaurant-media` não fazem parte do catálogo vivo atual e não devem ser usados como alvo desta continuação.

O residual correto de G5 é:

- bucket: `classified-images`;
- `public = true`;
- `object_count = 0` na revalidação realizada nesta continuação.

O projeto também possui `classified_images` (underscore), que é um bucket distinto. Não confundir as duas identidades.

Decisão preservada:

- `classified-images` permanece **REMOTE ORPHAN / EMPTY**;
- não apagar via `DELETE FROM storage.buckets`;
- não contornar proteções internas de Storage;
- remover somente por lifecycle oficial da Storage API com autenticação apropriada;
- confirmar novamente zero objetos imediatamente antes da remoção e confirmar ausência depois.

A documentação oficial Supabase confirma o lifecycle `emptyBucket()` -> `deleteBucket()`. A capability conectada desta sessão continua sem expor essas operações oficiais. Usar SQL direto apenas para forçar fechamento do gate seria criar uma prova inválida e violar a governança já estabelecida.

## 3. GitHub Actions — falha pré-runner confirmada

O run `33344948015` (`SSOT Territorial Tests`) foi disparado pelo HEAD `60b4e048712d36eb4fef121153598d335629aa61` e concluiu como failure.

A inspeção dos jobs mostrou, para jobs `ubuntu-latest` que deveriam executar normalmente:

- `steps: []`;
- `runner_id: 0`;
- `runner_name: ""`;
- falha em poucos segundos, antes de qualquer step do workflow.

Um re-run isolado de `Runtime Tests (Vitest)` no run `33348216775` reproduziu o mesmo estado sem step/log útil.

### Revalidação atual — 2026-08-31

O run mais recente inspecionado, `33355975347` (`SSOT Territorial Tests`, HEAD `b682ced87c341ce6542e85f69b35d65929cd9f33`), reproduziu o blocker em 2026-08-31:

- `Authenticated Account E2E (remote-only)`: failure, `steps: []`, `runner_id: 0`, `runner_name: ""`, label `ubuntu-latest`;
- `Runtime Tests (Vitest)`: failure, `steps: []`, `runner_id: 0`, `runner_name: ""`, label `ubuntu-latest`;
- `E2E Tests (fixture-backed, remote-only)`: failure, `steps: []`, `runner_id: 0`, `runner_name: ""`, label `ubuntu-latest`;
- `Phase Core Gate (SSOT)`: failure, `steps: []`, `runner_id: 0`, `runner_name: ""`, label `ubuntu-latest`;
- `All Tests Passed`: failure sem steps porque os gates anteriores nunca executaram;
- `Regression Check`: skipped.

A tentativa de obter os logs de `Runtime Tests (Vitest)` retornou `BlobNotFound`, coerente com a ausência de runner/steps/log blob.

Isso prova novamente que o blocker não é específico do self-hosted Windows: até jobs `ubuntu-latest` são encerrados antes de alocação. A causa exata account/platform não é exposta pelas evidências disponíveis, então não atribuir a billing sem prova.

Não alterar testes, scripts ou arquitetura apenas para reagir a esses runs enquanto `steps` permanecer vazio.

## 4. Hosted build — FECHADO

O blocker hospedado anteriormente registrado como `build-rate-limit` foi fechado por uma execução real posterior aos fixes.

Produção Vercel:

- deployment `dpl_8X8g212hHmqvbSwN2aUoSf1iNvRY`;
- source `b277e5fb7b560bdc9c540fff035eb21e49420de5`;
- target `production`;
- state `READY`.

A build clonou exatamente `b277e5f` e executou a cadeia canônica definida pelo repositório:

`vercel.json` -> `node tools/release/run-vercel-production-build.mjs` -> `npm run build:vercel`.

Essa cadeia inclui `npm run typecheck:app` (`tsc -p tsconfig.app.json --noEmit`), lint e Vite build, além dos gates externos de security validation, security lint, upload SSOT, Core/Platform ownership e sitemap.

Evidência observada:

- security validation: PASS com aviso conhecido de `.env.local` ausente no ambiente de build;
- Vite: `✓ built in 32.37s`;
- sitemap final: index válido, 3 files, 114302 URLs;
- `Build Completed in /vercel/output [3m]`;
- deployment completado;
- consulta de logs `errorsOnly` sem erro de source/typecheck/build.

Comparação GitHub entre `b277e5fb...` e o HEAD de aplicação posterior `4a012fb9...` mostrou seis commits e **zero mudanças em `src/**`**. Depois da build verde mudaram apenas quatro migrations SQL, um teste de segurança e o workflow de types.

Portanto o hosted TypeScript/production build está **CLOSED para o código de aplicação atual**. Um status Vercel posterior de rate-limit em commits SQL/test/workflow/docs não invalida a build verde já obtida; nova build hospedada volta a ser necessária quando aplicação/build inputs mudarem.

Detalhes completos: `docs/03-architecture/G5_HOSTED_TYPECHECK_RECONCILIATION_2026-08-30.md`.

## 5. Estado de G5 após esta revalidação

Continuam abertos, sem ambiguidade, apenas os blockers centrais abaixo:

1. materializar integralmente a geração oficial Supabase em `src/integrations/supabase/types.generated.ts` e validar o snapshot;
2. remover `classified-images` por Storage API oficial e provar ausência pós-delete;
3. obter execução real dos gates de GitHub Actions, com runner alocado e steps executados.

O hosted Vercel TypeScript/build não está mais nessa lista.

**G5 permanece EM EXECUÇÃO. Não iniciar G6.**

## 6. Do not repeat

- Não investigar novamente `menu-items` ou `restaurant-media` como blockers atuais.
- Não confundir `classified-images` com `classified_images`.
- Não deletar bucket diretamente por SQL.
- Não corrigir `types.generated.ts` manualmente por amostragem.
- Não recriar snapshots de tipos paralelos.
- Não interpretar `steps: []` em Actions como falha de teste.
- Não continuar citando o antigo Vercel build-rate-limit como blocker central depois da build `READY` em `b277e5fb...`.
- Não criar policies em `account_deletion_requests` apenas para silenciar advisor: a tabela é intencionalmente service-role-only/fail-closed.
- Não mover/recriar PostGIS extension-owned para silenciar warnings sem authority de owner/plataforma.
- Não criar índices em massa para toda FK sem índice líder sem evidência de carga/plano.
- Não iniciar G6 enquanto os três gates centrais acima permanecerem abertos.

## 7. Governança do Supabase Types Sync

Foi identificado que o workflow canônico de tipos só reagia a alteração do próprio YAML ou `workflow_dispatch`. Assim, migrations novas podiam avançar o schema remoto sem disparar regeneração do snapshot.

Correção aplicada diretamente em `main`:

- `54f6868577add5a2f6e2637723c8677fc1404da5` — `fix(g5): trigger Supabase type sync on schema changes`;
- o workflow observa `supabase/migrations/**`, `supabase/config.toml` e `tools/supabase/generate-supabase-types.ts`, além do próprio YAML;
- não foi criado segundo gerador, segundo snapshot ou caminho alternativo de autoridade.

A alteração disparou automaticamente `Supabase Types Sync` run `33348259701`, provando que o novo gatilho está funcional. Na observação disponível, o run não obteve job executável. O histórico do run inicial `33308736174` também mostra ausência de steps/logs executáveis, coerente com o blocker de runner.

A prevenção de regressão foi reforçada em source:

- `72b61815c4330a3e1f3a225aae5eb504c3b9e741` — `test(g5): ratchet Supabase type sync triggers`;
- o teste arquitetural exige os gatilhos de schema/config/gerador, o único `TYPES_PATH` canônico e proíbe snapshots aposentados.

### Concorrência stale-safe

A semântica oficial do GitHub Actions foi revalidada: um concurrency group já mantém no máximo um run em execução e um pending; `cancel-in-progress: true` também invalida a execução antiga quando chega um commit novo.

Para evitar que um sync de tipos já em execução sobre SHA antigo tente escrever na `main` depois de novo schema commit, foi aplicado:

- `4a012fb9fd4d4fa7cc4613ee0aa1d6e27f28da29` — `fix(g5): cancel stale Supabase type sync runs`;
- única mudança: `cancel-in-progress: false` -> `cancel-in-progress: true`;
- runner, labels, token, gerador, project ref, `TYPES_PATH`, main-only assertion e commit authority permaneceram intactos.

Consequência: a governança do caminho canônico está fechada em source; a materialização viva continua dependendo da recuperação da infraestrutura autorizada do GitHub Actions.

## 8. Auth de lançamento — baseline source endurecido e exceção HIBP preservada

O `supabase/config.toml` canônico já exige:

- `enable_anonymous_sign_ins = false`;
- `enable_manual_linking = false`;
- senha mínima de 12 caracteres;
- maiúsculas, minúsculas, dígitos e símbolos;
- confirmação de e-mail;
- troca segura de senha.

A consulta agregada ao `auth.users` remoto retornou 287 usuários e **0 usuários anônimos**. Portanto não existe migração de identidade anônima pendente.

O baseline foi protegido contra regressão em:

- `a006cb6b62d297af7929071e2c63245be405f8b7` — `test(g5): ratchet launch auth hardening`.

O advisor remoto atual continua reportando `auth_leaked_password_protection`. A documentação Supabase confirma que o recurso nativo verifica senhas comprometidas via HaveIBeenPwned e depende de configuração Auth/plano compatível. A sessão conectada atual não expõe mutation de Auth config.

O estado permanece governado pela exceção existente `EXC-2026-08-11-AUTH-HIBP-FREE-PLAN`; não classificar a mitigação app-side como equivalente ao controle nativo e não inventar migration SQL para configuração de Auth.

## 9. Advisors e integridade — revalidação sem reabrir gates fechados

### `account_deletion_requests`

O advisor sinalizou `rls_enabled_no_policy`, mas a inspeção do catálogo e da migration canônica confirmou que isso é intencional:

- RLS ligado;
- zero policies;
- zero grants para `anon` e `authenticated`;
- autoridade concedida apenas aos brokers service-role definidos pela migration de reconciliação.

Adicionar policy para silenciar o advisor reduziria a segurança e contrariaria o contrato canônico.

### PostGIS / `spatial_ref_sys` / `st_estimatedextent`

A revalidação de 2026-08-31 confirmou:

- owner da extensão PostGIS: `supabase_admin`;
- owner de `public.spatial_ref_sys`: `supabase_admin`;
- owner dos três overloads `public.st_estimatedextent(...)`: `supabase_admin`;
- current role da conexão de manutenção: `postgres`, portanto sem ownership da extensão/objetos.

Os grants de browser em `st_estimatedextent` reapareceram mesmo após as migrations `20260707124929` e `20260826063104`, confirmando drift recorrente de objeto extension-owned. Não criar uma terceira migration periódica apenas para o provider restaurar a ACL novamente.

`spatial_ref_sys` continua sem RLS e expõe grants de tabela, mas os dois guards já versionados permanecem presentes e habilitados:

- `block_spatial_ref_sys_browser_dml`;
- `block_spatial_ref_sys_browser_truncate`.

Probe funcional como `anon` tentou `UPDATE public.spatial_ref_sys` e recebeu `42501: browser writes to spatial_ref_sys are blocked`, provando que o fail-closed de write continua efetivo.

Para `st_estimatedextent`, a única geometry table sem SELECT para `anon` observada foi `public.business_data(point)`. O probe anon de `st_estimatedextent('public','business_data','point')` retornou `NULL`; `business_data` possui 100 rows e 0 valores `point` não-nulos. Portanto não existe evidência atual de vazamento material de extent sobre dado privado.

O residual continua governado por `EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE` e pelo preflight read-only `tools/security/supabase-postgis-owner-preflight.mjs`.

### índices

- zero índices `public/private` inválidos, não-ready ou não-live na revalidação registrada;
- existem FKs sem índice líder dedicado, inclusive legadas, mas isso não implica automaticamente defeito;
- nenhuma criação em massa foi feita a partir de advisor genérico.

A revalidação atual não reabre o item `indexes/constraints` já fechado no checkpoint principal.
