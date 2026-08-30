# Reviews SSOT

Status: canônico — G4 fechado no nível de autoridade/source
Última revalidação: 2026-08-30
Finding histórico: CP-013

## 1. Decisão

`public.reviews` é a única fonte de verdade para avaliações cujo alvo é um
Profile: Empresa, Profissional ou Serviço. `src/core/reviews` possui o agregado
base, as leituras comuns, a mutação profissional e os comandos de engajamento.
Business conserva apenas a política comercial e o broker autenticado; Gastronomia
compõe a experiência sem possuir persistência paralela.

Não existe seleção dinâmica de tabela, dual-write ou tabela de avaliação por
vertical. As tabelas legadas `business_reviews_new` e
`professional_reviews_new` foram reconciliadas e removidas em 2026-07.

`event_reviews` permanece intencionalmente no domínio de Eventos. Seu alvo,
elegibilidade, lifecycle e moderação são diferentes; compartilhar UI ou
contratos não autoriza fundir essa persistência com o agregado Profile Review.

## 2. Owners

| Responsabilidade | Owner |
| --- | --- |
| Tipos, mapeamento e leitura base | `src/core/reviews` |
| Review de Profissional | `src/core/reviews/services/reviews.mutations.ts` |
| Report e helpfulness | `src/core/reviews/services/ReviewEngagementService.ts` |
| Política de review de Empresa | `src/core/business/services/BusinessReviewService.ts` |
| Broker privilegiado de Business | `supabase/functions/business-reviews-rpc/index.ts` |
| Experiência de Gastronomia | `src/modules/business/gastronomy` |
| Mídia de review | `src/core/media` + preset `review_photo` |
| Enforcement | RLS, grants, RPCs e Edge Function |

Gastronomia não possui service de persistência próprio. Admin pode compor read
models explicitamente autorizados, mas não se torna segundo owner.

## 3. Modelo canônico

| Recurso | Responsabilidade |
| --- | --- |
| `reviews` | rating, comentário, tipo, autor, alvo e lifecycle canônicos |
| `review_helpfulness` | voto por Profile e Review; sem escrita/leitura direta de browser |
| `review_reports` | denúncia com reporter derivado pelo backend |
| `private.review_command_rate_limits` | limite de comandos por ator |
| `media_assets` / `media_asset_links` | mídia canônica referenciada por `MediaAssetRef` |

Não existe `review_media_assets` no schema atual. A documentação antiga que a
tratava como tabela própria ficou obsoleta após o cutover de MediaAsset.

Dados de pedido, atendimento e ownership continuam em seus domínios e são
consultados para elegibilidade; não são copiados para `reviews` como segunda
fonte de verdade.

## 4. Comandos e autorização

### Professional/Profile

- `upsert_profile_review` exige JWT e Profile ativo do ator, e delega à regra
  privada de elegibilidade profissional;
- `delete_profile_review` exige autor ativo ou admin, aplica rate limit e opera
  apenas `review_type = 'professional'`;
- `get_profile_review_stats` calcula agregado no banco sem baixar a coleção;
- `get_review_aggregates_admin` exige admin internamente e aceita no máximo 200
  Profiles por lote.

### Engagement

- `set_review_helpfulness` exige Profile ativo do próprio ator, proíbe auto-voto,
  aplica rate limit e lock transacional;
- `get_current_review_helpfulness` só resolve o voto do Profile ativo do ator;
- `create_review_report` deriva `reporter_profile_id` do Profile ativo;
- `moderate_review_report` exige autoridade administrativa no backend.

`review_helpfulness` não possui policy de browser e os grants da tabela ficam
restritos a `service_role`; o RPC autenticado é a autoridade de interação.

### Business

O browser chama somente `BusinessReviewService`, que invoca
`business-reviews-rpc`. O broker:

1. exige JWT válido e deriva `userId` do token;
2. bloqueia mutação quando a conta está em estado de exclusão operacional;
3. usa o helper canônico `is_admin` para autoridade administrativa — não lê
   `user_roles` diretamente;
4. valida Profile de reviewer, review comercial e, quando informado, pedido
   entregue e relação customer/merchant;
5. para publicar `business_response`, exige gestão do Profile da Empresa pelo
   wrapper service-role-only `broker_user_can_manage_profile`, que delega a
   `private.user_can_manage_profile` (dono direto ou membership ativa
   `owner/admin`); membership `member` não autoriza resposta pública;
6. executa a escrita server-side com service role depois de validar o ator.

A migration `20260829171858_add_broker_profile_management_authority.sql`
expõe apenas o adapter técnico necessário ao broker. `PUBLIC`, `anon` e
`authenticated` não podem executá-lo; somente `service_role` pode chamá-lo.
A regra de negócio continua pertencendo a `private.user_can_manage_profile`.

## 5. RPCs comerciais legados — aposentados em G5

G4 havia classificado como legado dormente, sem caller runtime e com `EXECUTE`
restrito a `service_role`, os RPCs:

- `can_user_review_business`;
- `create_business_review`;
- `update_business_review`;
- `delete_business_review`;
- `add_business_review_response`.

`get_business_reviews` também não possuía caller runtime; o read path comercial
ativo usa `ReviewsService`.

Em 2026-08-30, G5 executou a provenance/dependency audit exigida antes da
retirada física:

- busca no HEAD sem caller runtime dos seis nomes;
- os cinco comandos/eligibility permaneciam `service_role`-only;
- `get_business_reviews` era um read RPC `SECURITY INVOKER`, porém sem consumer
  canônico;
- `pg_depend` não encontrou objetos dependentes;
- busca nas definições remotas não encontrou função, view ou policy chamando
  qualquer um dos seis RPCs.

A migration `20260830033012_retire_dormant_business_review_rpcs.sql` removeu as
seis funções com `DROP FUNCTION IF EXISTS` e **sem `CASCADE`**. A ausência de
`CASCADE` é intencional: replay deve falhar fechado se uma dependência reaparecer.
O pós-check remoto retornou zero funções restantes com esses nomes.

`tests/security/retired-business-review-rpcs.test.ts` impede recriação ou novo
grant para essa superfície sem uma nova decisão arquitetural.

## 6. Leitura, escala e mídia

- queries comuns vivem em `src/core/reviews/services/reviews.queries.ts`;
- o runtime em `src/**` não acessa `reviews` diretamente fora do owner;
- estatísticas são agregadas no banco;
- governança admin usa lotes limitados a 200;
- mídia usa somente referências `storage://media-assets/.../review_photo/...`
  aprovadas pelo Core Media;
- URL externa arbitrária não entra no agregado comercial;
- comandos sensíveis usam limites server-side e, onde aplicável, rate limit e
  `statement_timeout`.

Paginação profunda, carga p50/p95/p99 e concorrência são requisitos de
certificação operacional/staging (G6/G7), não justificativa para criar um
segundo read model em G4.

## 7. Evidência G4/G5

Revalidação source + remoto confirmou:

- `reviews`, `review_helpfulness`, `review_reports` e `event_reviews` com RLS
  habilitado;
- browser sem grant de escrita em `reviews` e sem grants diretos em
  `review_helpfulness`;
- schema de `reviews`, `review_helpfulness` e `review_reports` alinhado aos
  contratos atuais do Core;
- RPCs Professional/helpfulness autenticados validando ator/Profile ativo;
- aggregate admin validando admin internamente e limitando batch;
- report derivando reporter e moderação exigindo admin;
- `business-reviews-rpc` remoto atualizado para versão 10, `ACTIVE`, com
  `verify_jwt = true`, proteção de conta operacional, `is_admin` canônico e
  gestão de Business delegada ao helper canônico;
- wrapper `broker_user_can_manage_profile` restrito a `service_role`;
- nenhum alerta novo do Security Advisor atribuído ao wrapper criado;
- seis RPCs comerciais/read legados removidos em G5 após auditoria de callers e
  dependências, com pós-check remoto vazio.

Regression guards ativos:

- `tests/architecture/reviews-ssot.test.ts`;
- `tests/security/business-reviews-rpc-security.test.ts`;
- `tests/security/retired-business-review-rpcs.test.ts`;
- comando `npm run test:reviews:ssot`.

A infraestrutura hosted continua sendo uma evidência separada. Enquanto os
jobs não executarem steps, não existe PASS same-SHA inferido para lint,
typecheck ou testes deste corte.

## 8. Dívidas que pertencem a G5/G6/G7

G4 fecha autoridade/source conhecido; a retirada dos RPCs comerciais dormentes
foi concluída em G5, mas isso não fecha automaticamente:

- auditoria exaustiva migration ↔ remoto de toda a história de Reviews;
- triagem global dos warnings do Security Advisor — inclusive warnings
  genéricos de `SECURITY DEFINER` que precisam ser avaliados pela semântica de
  cada RPC, não removidos mecanicamente;
- carga, concorrência, p50/p95/p99 e paginação profunda;
- certificação funcional de Gastronomia/Professional/Events;
- build/deploy/smoke do mesmo SHA em G7.

## 9. Rollback

Rollback de código desabilita consumidores novos antes de alterar o schema.
Rollback de dados usa backup/restauração do agregado canônico. Recriar tabelas
legadas, reintroduzir selector de tabela, direct browser writes ou dual-write
não são estratégias de rollback aceitas.
