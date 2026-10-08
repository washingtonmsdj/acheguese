# Auditoria aprofundada — Empresas (08/10/2026)

**Escopo:** código `main` de `washingtonmsdj/acheguese` e alterações isoladas nas PRs #641, #644 e nesta branch. Sem inspeção de dados sensíveis, sem mutações de Supabase/Vercel e sem certificação de deploy. **Este é um inventário de achados verificáveis no código, não uma afirmação de cobertura exaustiva de todas as superfícies ou de exploração efetiva.**

## Ownership e limites de segurança

- UI e navegação: `src/modules/business`, `src/modules/central`.
- Domínio e mutações: `src/core/business/services`. Autoridade de cadastro: `BusinessService.createBusiness` / `ProfileRpcService.createBusiness`.
- Autorização frontend **não** substitui enforcement confiável por RLS/RPC. `profiles.id` (identidade do perfil) e `business_data.id` (identidade do agregado) não são intercambiáveis.
- Nenhum caminho alternativo de escrita, migration ad hoc ou fallback para tabelas antigas é permitido.

## Achados e medidas

| ID | Prioridade | Evidência / causa | Encaminhamento |
| --- | --- | --- | --- |
| BUS-01 | P0 consistência | `business.mutations.createBusiness` fazia read `getBusinessById` **depois** do broker confirmar a criação, permitindo falso erro de cadastro após commit | #644: recibo de criação obtido do broker; testar falha da leitura posterior |
| BUS-02 | P0 duplicidade | `CriarEmpresaPage` protegia reenvio apenas com `isCreating`; eventos síncronos de submit podem preceder render | #644: trava síncrona por montagem e bloqueio pós-sucesso; **idempotência servidor continua não certificada** |
| BUS-03 | P1 integridade UX | Upload de logo/capa ou atualização de mídia pós-commit falhava e gerava `onError` para criação já confirmada | #644: sucesso de cadastro distinto de configuração incompleta, com aviso e logs |
| BUS-04 | P1 dado público | `getBusinessesList` devolvia lista vazia em erro PostgREST/transport, confundindo falha com zero empresas | Esta PR: propagar erro e preservar estado de erro dos consumidores TanStack Query |
| BUS-05 | P1 performance | `getBusinessesList` fazia `SELECT profile_id LIMIT 1` na view antes da consulta verdadeira em **todas** as páginas | Esta PR: consulta única da view |
| BUS-06 | P1 abrangência territorial | `getBusinessesList` engolia erro na resolução de descendentes e restringia silenciosamente a localidade exata | Esta PR: propagar erro; nunca representar recorte incompleto como busca normal |
| BUS-07 | P1 paginação | `getBusinessesList` ordenava por atributos não únicos sem desempate estável antes de `range` | Esta PR: desempate por `profile_id`; offset ainda exige testes de concorrência de escrita |
| BUS-08 | P1 identificação | `BusinessUrlService` convertia erro de resolução de slug/premium/ID em `null` | #641 já aberta, sem sobreposição |
| BUS-09 | P1 leitura agregada | `business.queries.getBusinessesByIds` devolve `[]` em erro; isso pode ocultar falha em Nearby e recomendações | Pendente: migrar erros à borda com testes de consumidores |
| BUS-10 | P1 detalhe | `business.queries.getBusinessBySlug` retorna `null` em erro, lido como inexistência em `useBusiness` | Esta PR: erro tipado de ausência, falhas relançadas ao hook |
| BUS-11 | P1 gestão | `BusinessAdminGuard` ignora o `error` de `useBusiness` e redireciona para listagem com mensagem de “não encontrada” quando o fetch falha | Esta PR: guard bloqueado com erro explícito/retry; redireciona apenas ausência confirmada |
| BUS-12 | P1 ID de domínio | `getBusinessDataIdByProfileId` retorna `null` em transporte com erro, confundindo falha e ausência no fluxo de autoridade | Pendente: definir erro distinto e validar consumidores (DashboardAccess, Gastronomy, ServiceAreas) |
| BUS-13 | P1 autoridade | `BusinessOwnershipService.resolveOwnerProfileId` retorna `null` em erro SQL; é **fail-closed quanto à permissão**, mas UI pode reportar ausência/negação falsa | Pendente: separar indisponibilidade de autorização negada; manter fail-closed |
| BUS-14 | P0 certificação | Atomicidade do `AddressService` externo versus transação de broker, compensação e idempotência entre requisições não foram comprovadas ponta a ponta | Pendente: revisão de contrato do broker e provas transacionais; não criar escritor paralelo |
| BUS-15 | P0 segurança | Autorização negativa real (não owner, gestor revogado, cross-profile), RLS/grants de Business e ações sensíveis exigem prova no backend | Pendente; **nenhuma vulnerabilidade de escalada foi demonstrada** apenas com inspeção do frontend |
| BUS-16 | P1 criação produto | `business.mutations.createProduct` insere diretamente em `business_products`; contrato RLS precisa ser comprovado, e `created_at` retornado é `new Date()`, não timestamp persistido | Pendente: validar ownership/enforcement e mapear timestamp do resultado real |
| BUS-17 | P2 contrato legado | `BusinessService.getBusinesses` retorna só primeira página (100) e depois filtra bairro/delivery em memória; consumidores podem receber resultados incompletos | Pendente: migrar consumidores restantes para consultas filtradas no owner e aposentar fachada |
| BUS-18 | P2 higiene | Prévia, testes mobile, CRUD de fotos/horários/catálogo e navegação já têm auditorias anteriores; não equivalem a smoke com conta real e mesmo SHA | Pendente: certificação funcional create → edit → página pública → gestão e cleanup |
| BUS-19 | P1 mídia | Upload confirmado sem associação ao perfil pode deixar artefato não referenciado; não há prova aqui de coleta de órfãos ou rollback seguro | Risco **não comprovado**; verificar owner `core/media` antes de propor limpeza |

## Plano de execução

1. **Source imediatamente:** #644 para cadastro confirmado/duplicidade; esta PR para consultas e paginação. Esperar checks no HEAD exato; não mesclar #621 durante gates.
2. **Próxima frente:** listas agregadas por IDs, propagação de falhas de autoridade no DashboardAccess e demais consumers; coordenação com #641 para não duplicar resolver.
3. **Hardening de segurança:** prova de autorização via RPC/RLS, mutações de produto, concessão/revogação e isolamento `profile_id`/`business_data.id`.
4. **Integridade persistente:** idempotência real do broker, referência de mídias, ownership de endereço e compensação; não substituir transação por retries na UI.
5. **Certificação de Business MVP:** criar, editar, detalhe público, gestão, testes negativos, performance/paginação em volume, typecheck/lint/unit/build e smoke same-SHA. Sem chamar runner pendente de PASS.

## Evidências de origem

- `src/core/business/services/business.mutations.ts`, `business.queries.ts`, `BusinessService.ts`, `BusinessOwnershipService.ts`;
- `src/modules/business/hooks/useBusinessCreateMultiProfile.ts`, `src/modules/business/pages/CriarEmpresaPage.tsx`, `src/modules/central/guards/BusinessAdminGuard.tsx`;
- `src/core/business/hooks/useBusiness.ts`, `useDashboardAccess.ts`, `useBusinessList.ts`;
- `src/modules/business/README.md`, `VALIDATION.md`, `docs/audits/central-business-2026-10-01.md`;
- PRs #641, #644; testes de regressão de `business.mutations.spec.ts` e `business-public-list-errors.spec.ts`.

**Status deste documento:** auditoria de código/versionamento; não declaração de MVP READY nem atestado de exploração de segurança.
