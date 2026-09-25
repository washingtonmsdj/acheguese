# Próximos passos — lançamento MVP

Este arquivo é um resumo navegacional. O **SSOT operacional** permanece em [`EXECUCAO_MAIN_ONLY.md`](./EXECUCAO_MAIN_ONLY.md) e o lifecycle de módulos em [`PRODUCT_MODULE_LIFECYCLE.md`](../03-architecture/PRODUCT_MODULE_LIFECYCLE.md).

## Decisão vigente

O MVP público possui **um domínio de produto ativo: Empresas (`business`)**.

Capabilities horizontais ativas no lançamento:

1. **Mapa** (`map`);
2. **Perto de mim** (`nearby`);
3. **Busca** (`search`);
4. **Mensagens** (`messaging`, provider MVP = Business);
5. Auth, Perfis/Conta, Território, Localização, Notificações e Central.

`nearby` depende estruturalmente de Map + Location; providers verticais são gated separadamente e Business é o provider MVP atual. `map` possui registry/scope próprio de layers. `search` recebe buckets autorizados de `searchProviderScope.ts` e não decide lifecycle no core. `messaging` depende de Auth + Perfis e registra somente providers de domínios ativos. No MVP, Business é o único provider de domínio ativo em Map/Nearby/Search/Messaging.

Todos os demais módulos de produto permanecem **pausados e fail-closed** até certificação individual. Código preservado para pós-MVP não pode aparecer em navegação, rotas funcionais, prefetch, discovery, providers públicos ou layers do Mapa.

## Objetivo imediato

Entregar um candidato pequeno, verificável e profissional sem reabrir escopo.

Regras:

- não adicionar novos módulos ao MVP;
- corrigir causas raiz, não sintomas;
- não criar redirect, alias, fallback ou feature flag local para esconder arquitetura quebrada; no MVP, redirects de compatibilidade são proibidos; guards de autenticação/autorização não contam como alias;
- manter as autoridades de lifecycle separadas: `productModuleRegistry.ts` para domínios, `platformCapabilityRegistry.ts` para capabilities e `lifecycleRegistry.ts` como avaliador único;
- remover código morto, duplicidades e dependências cruzadas que pertençam apenas ao runtime antigo;
- manter código pós-MVP apenas quando houver owner claro, fronteira limpa e zero interferência no produto ativo;
- nenhuma superfície pausada pode ser consultada apenas para montar UI escondida;
- nenhuma mudança recebe status de release por ter sido apenas mergeada.

## Ordem atual

1. **Concluir o corte modular**
   - manter `business` como domínio ativo;
   - manter `map`, `nearby`, `search` e `messaging` como capabilities ativas;
   - manter `nearby -> map + location`, com Business apenas como provider lifecycle-scoped;
   - manter `map` como capability horizontal e suas layers como providers lifecycle-scoped;
   - manter `search` como capability horizontal; providers são selecionados em `app/config/searchProviderScope.ts` e o core falha fechado sem autorização;
   - provar `messaging -> auth + profiles`, com provider Business-only no MVP;
   - manter o provider Business do Mapa consumindo seu port público bounded, sem schema/tabelas internas no owner horizontal;
   - manter toda gestão de Business sob `/central/empresas/*`, inclusive edição em `/:businessId/editar`;
   - eliminar imports e delegações do núcleo ativo para módulos pausados.

2. **Fechar rotas, navegação e prefetch**
   - navegação pública deve expor somente destinos do MVP e infraestrutura necessária;
   - módulo pausado não pode possuir rota funcional acessível, inclusive em Admin/Central;
   - router, lazy barrel, shell, navegação e prefetch/warmup do runtime ativo não podem conectar owner de módulo pausado; URL pausada/antiga sem contrato externo deve cair no 404 canônico;
   - não manter redirects de compatibilidade no corte MVP; URL antiga sem contrato externo comprovado deve ser removida e resultar em 404.

3. **Limpar resíduos do escopo anterior**
   - remover componentes, services, helpers, facades, previews, aliases e imports sem caller real;
   - não manter `concept-mock`, preview DEV ou query-string especial conectado ao router principal; protótipos devem viver fora do runtime de produto;
   - remover implementações paralelas e owners duplicados;
   - remover allowances de SSOT que apontem para tabelas/owners já aposentados; o censo de Gastronomia confirmou que `gastronomy_establishments` e `GastronomyQueryService.ts` eram resíduos do grafo legado, enquanto a persistência atual usa `gastronomy_profiles`/`business_data` pelos owners em `src/core/business`;
   - manter migrations históricas somente quando necessárias à integridade/proveniência;
   - atualizar testes arquiteturais para impedir reintrodução do legado.

4. **Certificar o núcleo ativo**
   - Empresas;
   - Mapa;
   - Perto de mim;
   - Busca;
   - Mensagens/Business Direct Messaging;
   - contratos de plataforma utilizados diretamente pelo domínio e capabilities;
   - truthfulness de localização/distância;
   - boundary Map -> Business;
   - rotas e navegação launch-safe.

5. **Executar candidato exact-SHA**
   - security;
   - lint;
   - typecheck;
   - testes arquiteturais/unitários;
   - build;
   - E2E do domínio Business + capabilities públicas do MVP;
   - deploy do mesmo SHA;
   - smoke público do mesmo SHA.

6. **Lançar e observar**
   - corrigir regressões no núcleo antes de ampliar produto;
   - qualquer módulo futuro nasce/retorna `paused`, é certificado isoladamente e só então passa a `active`.

## Estado atual do release

A estrutura do MVP está suficientemente fechada para que o trabalho restante seja de **certificação e infraestrutura**, não de reabrir escopo.

Já está consolidado:

- Business é o único domínio ativo;
- Map/Nearby/Search/Messaging/Notifications permanecem capabilities horizontais;
- navegação, Busca, Notificações, sitemap, Central e criação de Business usam composição de lifecycle nos boundaries corretos;
- Billing e verticais pós-MVP continuam pausados e não entram no grafo ativo;
- os gates hospedados de PR executam testes reais, incluindo Security, SSOT Territorial, SSOT Enforcement e Heavy Certification.

Blockers reais:

- **#305:** Supabase/Auth/data plane continua reproduzindo timeout até em consulta SQL mínima; isso impede certificar Conta + Mensagens autenticadas em produção;
- **#309:** GitHub Actions ainda precisa de PAT Supabase com autoridade mínima para deploy de Edge Functions;
- **exact-SHA final:** após o último merge do candidato, o mesmo SHA precisa ser deployado e passar smoke público + autenticado.

Não criar código de contorno para nenhum desses três itens. Em especial: sem redirects, aliases, login alternativo, retries ilimitados, timeouts inflados, bypass de RLS/OIDC ou reativação temporária de módulo pausado.

## Pós-MVP

Ficam fora do produto ativo até trabalho individual e reintegração formal, entre outros:

- Comunidade/Feed;
- Classificados;
- Serviços/Profissionais;
- Gastronomia;
- Eventos;
- Vagas;
- Pontos Turísticos;
- Mobilidade;
- Educação;
- monetização/billing;
- gamificação;
- analytics público;
- demais verticais preservadas no repositório.

Preservar código pós-MVP não significa mantê-lo conectado ao runtime ativo.

## Critério de MVP READY

O release só recebe **MVP READY** quando **Business + Mapa + Perto de mim + Busca + Mensagens (Business provider)** estiverem certificados em um único SHA, com:

- lifecycle modular coerente;
- zero dependência ativa em módulo pausado;
- rotas/navegação/prefetch alinhados;
- security/lint/typecheck/test/build realmente executados;
- E2E/smoke das superfícies ativas e fluxo de Mensagens Business;
- deploy real do mesmo SHA;
- nenhum erro crítico recorrente.

Módulos pausados não precisam ser concluídos para o primeiro release. Precisam permanecer realmente fora do produto ativo.

### Regra de expansão modular para os próximos trabalhos

Não acoplar uma capability horizontal ao único domínio ativo do momento. Para Mobility, Services, Gastronomy, Tourist Points, Classifieds ou qualquer nova vertical:

1. manter o owner horizontal intacto;
2. certificar e ativar a vertical;
3. registrar seu provider/adapter no boundary da capability;
4. deixar o lifecycle decidir se o provider participa;
5. provar por teste que provider pausado não vaza por rota, query, prefetch, mapa, busca, Inbox ou notificação.

Nearby, Map, Search e Messaging são padrões de referência desse modelo. Notifications segue a mesma regra: publicação server-owned por brokers/outbox e destino de ação lifecycle-scoped no app.

Boundaries territoriais de Nearby e Map: providerizados. Antes de habilitar um segundo provider/layer, registrar lifecycle + rollout owner; a cobertura de grupos é agregada por união dos membros cobertos. Não adicionar hardcode de domínio em `TerritorialLayout`.

### Boundary da Inbox de Notificações

- manter histórico de notificações mesmo quando uma vertical for pausada;
- nunca usar a existência de uma notificação antiga como autorização para abrir rota inativa;
- `notificationActionScope.ts` é a policy canônica de destino para ações da Inbox;
- Push/service worker e Inbox devem convergir na mesma semântica fail-closed para verticais pausadas;
- ao reativar uma vertical, não criar exceção no componente: o lifecycle existente deve liberar o destino.
