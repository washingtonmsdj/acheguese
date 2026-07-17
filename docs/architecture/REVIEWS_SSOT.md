# Reviews SSOT

Status: canonico
Data: 2026-07-15
Finding encerrado: CP-013

## 1. Decisao

`public.reviews` e a unica fonte de verdade para avaliacoes cujo alvo e um
Profile: Empresa, Profissional ou Servico. `core/reviews` possui o agregado
base, as leituras comuns e os comandos de engajamento. Business conserva a
regra comercial em um adapter tipado; Gastronomia apenas compoe a experiencia.

Nao existe selecao dinamica de tabela, dual-write ou tabela de avaliacao por
vertical. As tabelas legadas remotas `business_reviews_new` e
`professional_reviews_new` foram migradas, verificadas e removidas.

`event_reviews` permanece no dominio de Eventos. Seu alvo, elegibilidade,
lifecycle e moderacao sao diferentes; compartilhar componentes ou contratos
de leitura nao autoriza fundir a persistencia.

## 2. Owners

| Responsabilidade                 | Owner                                                  |
| -------------------------------- | ------------------------------------------------------ |
| Tipos, mapeamento e leitura base | `src/core/reviews`                                     |
| Review de Profissional           | `src/core/reviews/services/reviews.mutations.ts`       |
| Report e helpfulness             | `src/core/reviews/services/ReviewEngagementService.ts` |
| Politica de review de Empresa    | `src/core/business/services/BusinessReviewService.ts`  |
| Broker comercial privilegiado    | `supabase/functions/business-reviews-rpc/index.ts`     |
| Experiencia de Gastronomia       | `src/modules/business/gastronomy`                      |
| Enforcement                      | RLS, grants, RPCs e Edge Function                      |

Gastronomia nao possui service de persistencia proprio. Admin pode compor
read models explicitamente allowlisted, mas nao se torna segundo owner.

## 3. Modelo canonico

| Recurso                              | Responsabilidade                                            |
| ------------------------------------ | ----------------------------------------------------------- |
| `reviews`                            | rating, comentario, tipo, autor, alvo e lifecycle canonicos |
| `review_helpfulness`                 | voto por Profile e Review                                   |
| `review_reports`                     | denuncia com reporter derivado pelo backend                 |
| `private.review_command_rate_limits` | limite de comandos por ator                                 |
| `review_media_assets`                | vinculo com `MediaAssetRef` publico aprovado                |

As extensoes comerciais sao campos tipados do mesmo agregado. Dados de
pedido, atendimento e ownership continuam em seus dominios e sao consultados
para elegibilidade; eles nao sao copiados para `reviews` como uma segunda
fonte de verdade.

## 4. Comandos e autorizacao

- `upsert_profile_review` cria ou atualiza review de Profissional somente para
  o cliente de atendimento concluido;
- `delete_profile_review` permite hard delete pelo autor ou admin;
- `get_profile_review_stats` calcula agregado no banco, sem baixar a colecao;
- `get_review_aggregates_admin` agrega ate 200 Profiles por chamada, exige
  admin e e consumido somente por `ReviewsService`;
- `set_review_helpfulness` deriva o ator, proibe auto-voto e e idempotente;
- `get_current_review_helpfulness` le apenas o voto do Profile autenticado;
- `create_review_report` deriva reporter, limita e deduplica a denuncia;
- `business-reviews-rpc` valida Profile, ownership e pedido entregue quando o
  review comercial esta vinculado a pedido.

O browser nao recebe grant de escrita em `reviews` ou
`review_helpfulness`. Identidade, elegibilidade, papel administrativo e alvo
efetivo sao derivados/validados no backend. Escrita direta e spoof de Profile
falham fechados.

Hard delete e o contrato vigente porque o constraint remoto de status nao
possui estado `deleted`. Votos, reports e links de midia associados seguem as
FKs/cascades documentadas; ampliar silenciosamente o enum seria criar um novo
lifecycle sem regra de produto.

## 5. Leitura e escala

- consultas exigem tipo/status explicitos e usam limites fechados;
- estatisticas usam agregacao no banco;
- governanca admin divide listas maiores em lotes de 200, sem consulta por
  Profile e sem acesso direto a `reviews` fora do owner;
- indices cobrem alvo/tipo/status, autor e elegibilidade profissional;
- comandos sensiveis usam rate limit por Profile e `statement_timeout`;
- `get_business_reviews` limita pagina a 100 e offset a 5000;
- falha de schema ou autorizacao nao e convertida em lista vazia de sucesso.

O offset limitado do read model comercial permanece como compatibilidade. Se
paginacao profunda aparecer em metrica real, ela deve migrar para keyset; nao
se cria complexidade preventiva sem consumidor ou evidencia.

## 6. Midia, privacidade e moderacao

Imagem de Review usa apenas `MediaAssetRef` do preset versionado `review`.
Browser nao escolhe bucket/path e URL externa arbitraria nao entra no
agregado. Texto, rating, resposta comercial e motivo de denuncia possuem
limites server-side. Auditoria e rate limit ficam em schema privado e nao
expõem corpo livre para telemetria.

Helpfulness e report sao capacidades do Core Review. Resposta da Empresa,
elegibilidade por pedido e apresentacao gastronomica permanecem em Business.
Moderacao administrativa pode federar a fila, mas `review_reports` continua o
status mestre desse dominio.

## 7. Migracao e evidencias

A migration `20260715094000_consolidate_review_core.sql`:

1. migrou 2 reviews profissionais e 0 reviews comerciais legados;
2. comparou cada linha de origem com o agregado canonico;
3. removeu as duas tabelas legadas com `DROP TABLE ... RESTRICT`;
4. endureceu RLS, grants, indices, comandos e read models.

As migrations `20260715095000` e `20260715096000` fecharam lifecycle do rate
limit e o contrato definitivo de exclusao. Todas estao aplicadas no Supabase
remoto de desenvolvimento e os tipos foram regenerados.

A migration `20260715110000_create_review_aggregate_admin_read_model.sql`
removeu o ultimo acesso direto do loader de governanca e criou o read model
admin agregado e limitado.

Evidencias executadas:

- `npm run test:reviews:ssot`: 7 testes de ownership e fronteira;
- `npm run security:reviews:authz-probe`: 31 casos remotos positivos e
  negativos com fixtures temporarias e cleanup;
- `npm run typecheck:app -- --pretty false`;
- `npm run validate:migrations`.

O probe comprova os contratos testados de autorizacao e persistencia. Ele nao
prova milhares de requisicoes por segundo; p50/p95/p99 e concorrencia ainda
exigem staging explicitamente autorizado.

## 8. Rollback

Rollback de codigo desabilita os consumidores novos antes de alterar o schema.
Rollback de dados usa backup/restauracao do agregado canonico. Recriar tabelas
legadas, reintroduzir selector de tabela ou dual-write nao sao estrategias de
rollback aceitas.
