# Status do Modulo de Comunicacao Territorial

Status atualizado em 2026-05-15.

## Resumo

O MVP estrutural de Comunicacao Territorial esta implementado: banco, RLS/RPC, dominio core, rotas publicas, central operacional, admin, identidade publica e validadores de arquitetura do modulo.

A fase de distribuicao territorial para comunidade foi iniciada e ja possui base funcional: `content_format`, tabela de distribuicao, service core, aba `Comunicacao` na comunidade e comportamento diferente para materia versus postagem simples.

## Implementado

Core:

- `src/core/communication-territorial/types.ts`
- `CommunicationTerritorialService`
- `AdminCommunicationTerritorialService`
- `CommunicationDistributionService`
- helpers de URL canonica
- mensagens de erro de UX
- README tecnico do dominio

Banco:

- `communication_channel_requests`
- `communication_channels`
- `communication_channel_territories`
- `communication_publications`
- `communication_publication_distribution`
- `communication_channel_audit`
- RLS e RPCs do MVP seguro
- `content_format` em publicacoes (`article` ou `update`)
- `communication_distribution_relevance_score` como SSOT de score inicial de distribuicao
- `rank_score` e `rank_reason` em `communication_publication_distribution`

Frontend publico:

- `/comunicacao`
- `/comunicacao/solicitar`
- `/comunicacao/:state/:city`
- `/comunicacao/:state/:city/:territorySlug`
- `/comunicacao/:state/:city/:territorySlug/:channelSlug`

Operacao:

- `/central/comunicacao`
- escolha de formato de consumo: materia/reportagem ou postagem simples
- `/admin/comunicacao`

Governanca:

- `communication_channel` como tipo separado de `business`;
- solicitacao aberta e aprovacao fechada;
- publicacao apenas em territorio autorizado;
- `can_alert` e `can_push` preparados, mas sem ativacao no MVP;
- boundary validator especifico do modulo.
- distribuicao default para `communication_hub` e `community_tab` ao publicar.
- funcao interna de upsert de distribuicao sem execucao direta por `anon`/`authenticated`.

## Decisao de Produto Atual

`/comunicacao` deve funcionar como listagem inteligente de agentes de comunicacao e porta canonica dos canais.

As publicacoes dos canais devem aparecer tambem na comunidade relacionada, em aba/bloco `Comunicacao`.

Comportamento esperado:

- materia/reportagem (`article`) abre canonical do canal;
- postagem comum (`update`) pode ser consumida inline na comunidade;
- relevancia vem do territorio/contexto, nao apenas de seguidores.

## Pendencias Criticas

- [x] Adicionar `content_format` em `communication_publications`.
- [x] Criar `communication_publication_distribution`.
- [x] Criar `CommunicationDistributionService`.
- [x] Criar aba `Comunicacao` na comunidade territorial.
- [x] Diferenciar comportamento de clique entre `article` e `update`.
- [ ] Resolver canonical do canal pelo territorio primario real.
- [ ] Criar rota canonica de detalhe de publicacao/materia, se o produto exigir URL propria alem da pagina do canal.
- [x] Criar E2E operacional da aba comunitaria `Comunicacao`.
- [x] Criar E2E transacional da distribuicao comunitaria com publicacao mockada.
- [x] Centralizar score inicial da distribuicao em SQL.
- [x] Materializar ranking territorial (`rank_score`/`rank_reason`) no banco.
- [x] Revogar execucao publica da funcao interna de upsert de distribuicao.
- [x] Ampliar `validate:architecture:communication` para bloquear reexposicao de funcoes internas por migration.
- [x] Criar E2E autenticado real (condicional por pre-condicao de ambiente): operador publica pela Central e valida distribuicao sem mock REST.
- [ ] Criar E2E autenticado real deterministico com fixture seedada.
- [ ] Implementar relevancia local/trending territorial.
- [ ] Integrar conteudos `event` e `job` sem duplicar regras dos dominios de eventos/vagas.

## Validacoes Recentes

Executadas anteriormente nesta etapa:

- `npm run validate:architecture:communication`: passou.
- testes unitarios focados de `CommunicationDistributionService`: passaram.
- `npx playwright test tests/e2e/communication-territorial-operational.spec.ts --project=chromium`: passou com cobertura operacional, transacional mockada e fluxo real condicional sem mock.
- `npm run test:e2e:communication-territorial`: passou.
- lint focado dos arquivos alterados: passou.

Gates globais ainda possuem debitos fora do modulo:

- `typecheck` global segue em hardening do monolito.
- `validate:architecture:governance` ainda possui violacoes legadas em outros dominios.

## Fonte Canonica

- `docs/COMUNICACAO_TERRITORIAL_ARCHITECTURE.md`
- `docs/COMUNICACAO_DISTRIBUICAO_TERRITORIAL_PLANO.md`
- `src/core/communication-territorial/README.md`
