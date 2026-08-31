# G5 — Revalidação viva dos blockers — 2026-08-30

Status: **EM EXECUÇÃO / G6 BLOQUEADO**  
Branch: `main`  
HEAD observado no início desta revalidação: `60b4e048712d36eb4fef121153598d335629aa61`  
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

O workflow `.github/workflows/supabase-types-sync.yml` já contém a implementação correta para esse lifecycle: geração oficial por `supabase gen types typescript --project-id`, validação mínima do artefato, escrita UTF-8 sem BOM e commit apenas quando o único drift é `src/integrations/supabase/types.generated.ts`. Não substituir esse fluxo por reconstrução manual do payload retornado pelo conector.

## 2. Storage — órfão atual confirmado

Consulta autenticada ao catálogo vivo de `storage.buckets` mostrou o conjunto atual de buckets do projeto canônico. Os nomes históricos `menu-items` e `restaurant-media` não fazem parte do catálogo vivo atual e não devem ser usados como alvo desta continuação.

O residual correto de G5 é:

- bucket: `classified-images`;
- `public = true`;
- `object_count = 0` na revalidação imediatamente realizada nesta continuação.

O projeto também possui `classified_images` (underscore), que é um bucket distinto. Não confundir as duas identidades.

Decisão preservada:

- `classified-images` permanece **REMOTE ORPHAN / EMPTY**;
- não apagar via `DELETE FROM storage.buckets`;
- não contornar proteções internas de Storage;
- remover somente por lifecycle oficial da Storage API com autenticação apropriada;
- confirmar novamente zero objetos imediatamente antes da remoção e confirmar ausência depois.

A capability Supabase disponível nesta sessão expõe geração de tipos e SQL, mas não expõe operação oficial de `emptyBucket`/`deleteBucket`. Usar SQL direto apenas para forçar fechamento do gate seria criar uma prova inválida e violar a governança já estabelecida.

## 3. GitHub Actions — falha pré-runner confirmada no HEAD

O run `33344948015` (`SSOT Territorial Tests`) foi disparado pelo HEAD `60b4e048712d36eb4fef121153598d335629aa61` e concluiu como failure.

A inspeção dos jobs mostra, para jobs `ubuntu-latest` que deveriam executar normalmente:

- `steps: []`;
- `runner_id: 0`;
- `runner_name: ""`;
- falha em poucos segundos, antes de qualquer step do workflow.

Isso reproduz e fortalece a classificação já registrada: o blocker é de alocação/execução de GitHub Actions, não uma evidência de lint, typecheck, Vitest ou E2E executados e falhando.

Não alterar testes, scripts ou arquitetura apenas para reagir a esses runs enquanto `steps` permanecer vazio.

## 4. Hosted build

A evidência versionada imediatamente anterior (`G5_HOSTED_TYPECHECK_RECONCILIATION_2026-08-30.md`) já registra que os três últimos erros TypeScript observados em execução hospedada foram corrigidos em source e que o reteste final passou a ser bloqueado por `build-rate-limit` do Vercel.

Esta revalidação não converte esse estado em PASS: é necessário um build hospedado posterior aos fixes que realmente execute TypeScript/build antes de fechar o gate correspondente.

## 5. Estado de G5 após esta revalidação

Continuam abertos, sem ambiguidade:

1. materializar integralmente a geração oficial Supabase em `src/integrations/supabase/types.generated.ts` e validar o snapshot;
2. remover `classified-images` por Storage API oficial e provar ausência pós-delete;
3. obter execução real dos gates de GitHub Actions (jobs com runner alocado e steps executados);
4. obter reteste hospedado pós-fixes quando o provider permitir build.

**G5 permanece EM EXECUÇÃO. Não iniciar G6.**

## 6. Do not repeat

- Não investigar novamente `menu-items` ou `restaurant-media` como blockers atuais.
- Não confundir `classified-images` com `classified_images`.
- Não deletar bucket diretamente por SQL.
- Não corrigir `types.generated.ts` manualmente por amostragem.
- Não recriar snapshots de tipos paralelos.
- Não interpretar `steps: []` em Actions como falha de teste.
- Não interpretar `build-rate-limit` do Vercel como regressão de source.
- Não iniciar G6 enquanto os gates acima permanecerem abertos.
