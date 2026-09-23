# Próximos passos — lançamento MVP

Este arquivo é um resumo navegacional. O **SSOT operacional** permanece em [`EXECUCAO_MAIN_ONLY.md`](./EXECUCAO_MAIN_ONLY.md) e o lifecycle de módulos em [`PRODUCT_MODULE_LIFECYCLE.md`](../03-architecture/PRODUCT_MODULE_LIFECYCLE.md).

## Decisão vigente — 2026-09-22

O MVP público possui **um domínio de produto ativo: Empresas (`business`)**.

Capabilities horizontais ativas no lançamento:

1. **Mapa** (`map`);
2. **Perto de mim** (`nearby`);
3. **Busca** (`search`);
4. **Mensagens** (`messaging`, provider MVP = Business);
5. Auth, Perfis/Conta, Território, Localização, Notificações e Central.

`nearby` depende de Map + Location + Business. `messaging` depende de Auth +
Perfis + Business e registra somente providers de domínios ativos.

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
   - provar `nearby -> map + location + business`;
   - provar `messaging -> auth + profiles + business` e provider Business-only;
   - manter Mapa consumindo Business por port público, sem conhecer schema/tabelas internas;
   - manter toda gestão de Business sob `/central/empresas/*`, inclusive edição em `/:businessId/editar`;
   - eliminar imports e delegações do núcleo ativo para módulos pausados.

2. **Fechar rotas, navegação e prefetch**
   - navegação pública deve expor somente destinos do MVP e infraestrutura necessária;
   - módulo pausado não pode possuir rota funcional acessível;
   - prefetch/warmup deve consultar lifecycle antes de carregar qualquer módulo;
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

## Estado do CI e do release observado em 2026-09-23

Os hosted runners voltaram a executar steps e logs reais. O incidente histórico de jobs vazios foi encerrado no issue #17; não tratar falhas futuras automaticamente como repetição daquele incidente.

O contrato obrigatório do MVP inclui os ratchets recentes de lifecycle, Business, Search, Messaging, remoção de legado e rotas canônicas. `test:mvp:architecture` deve executar essas provas em todo candidato.

Os PRs #310–#319 consolidaram o corte modular, as rotas canônicas, a gestão Business, a retirada dos bypasses DEV e o primeiro corte de resíduos SSOT de Gastronomia:

- Business independente de verticais pausados;
- navegação alinhada às capabilities ativas;
- dashboard Business legado sem caller aposentado;
- Search sem imports runtime top-level de domínios pausados;
- Neighborhood mixed-domain stream callerless aposentado;
- ratchets recentes incorporados ao gate obrigatório;
- gestão Business consolidada sob `/central/empresas/*`, sem rota concorrente/redirect legado;
- #318 aposentou o bypass DEV `?concept-mock=1` e os cinco mocks/previews sem caller do runtime.
- #319 aposentou a allowance morta de `gastronomy_establishments`/`GastronomyQueryService.ts` no checker SSOT após censo de owners/callers.

A `main` atual é `2f21393c64f1d0e53fa7d4fa08dfdca5f707c6dc` (merge de #319). O head de #319 foi certificado antes do merge por SSOT Enforcement, Heavy exact-SHA, Security, lint/typecheck, unit, Runtime, E2E público e Regression; o merge SHA continua sendo um novo candidato e não herda automaticamente status de release. O corte em andamento remove o lint rule órfão `eslint-rules/no-direct-supabase-queries.js`, alinha o `SSOT_REGISTRY.md` a `gastronomy_profiles` + `GastronomyProfileService` e ratcheta essa aposentadoria no validador obrigatório de Gastronomia. O smoke autenticado continua bloqueado por #305 e a autoridade de deploy Supabase por #309.

### Blockers atuais do primeiro release

- **#305 — Supabase Auth upstream:** `auth.signInWithPassword()` retorna 5xx; SQL mínimo e Advisors do projeto também registraram `Connection terminated due to connection timeout`. Não mascarar com retry extra, fallback, troca de senha do fixture ou bypass OIDC.
- **#309 — autoridade de deploy Supabase:** o PAT do GitHub Actions é válido, mas recebe 403 para atualizar Edge Functions. Rotacionar para PAT pertencente a identidade Supabase Developer/Admin/Owner; não usar `service_role` como substituto.

O broker remoto v3 permanece ACTIVE e sem drift de source conhecido; portanto #309 é problema de autoridade automática, não justificativa para alterar frontend/runtime.

**MVP READY continua bloqueado** até o mesmo SHA obter sessão autenticada real e o deploy automatizado exact-main recuperar autoridade. Não reabrir redirects, mocks DEV, aliases ou fallbacks para contornar esses blockers externos.

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
