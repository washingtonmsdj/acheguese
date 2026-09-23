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
   - remover implementações paralelas e owners duplicados;
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

## Estado do CI e do release observado em 2026-09-22

Os hosted runners voltaram a executar steps e logs reais. O incidente histórico de jobs vazios foi encerrado no issue #17; não tratar falhas futuras automaticamente como repetição daquele incidente.

O contrato obrigatório do MVP inclui os ratchets recentes de lifecycle, Business, Search, Messaging, remoção de legado e rotas canônicas. `test:mvp:architecture` deve executar essas provas em todo candidato.

Os PRs #310–#315 consolidaram o corte modular e de rotas:

- Business independente de verticais pausados;
- navegação alinhada às capabilities ativas;
- dashboard Business legado sem caller aposentado;
- Search sem imports runtime top-level de domínios pausados;
- Neighborhood mixed-domain stream callerless aposentado;
- ratchets recentes incorporados ao gate obrigatório.

Na `main` atual `4452f686b9eed06501c94a58fe432b8dddc1a43c` (após os PRs #315 e #316), Vercel, Dependency Lock, Auth Concept Regression, Heavy PR Certification, SSOT Enforcement, E2E público fixture-backed, Phase Core, Runtime, Regression, testes MVP, Maps, hardcoded credentials, lint e TypeScript passaram. O único vermelho relevante ao release continua sendo o smoke autenticado. Nesta execução, 3 provas falharam antes da sessão com `HTTP 503 [auth_upstream_unavailable]` do Supabase Auth e 1 tentativa recebeu `GitHub OIDC token request failed: HTTP 503`.

### O que ainda falta para o MVP

1. **Recuperar a emissão real de sessão autenticada** no mesmo SHA de produção (#305). Enquanto Conta/Mensagens/Business não conseguirem sessão real, o release permanece bloqueado.
2. **Restaurar o deploy automático exact-main da Edge Function** (#309) com PAT Supabase de identidade Developer/Admin/Owner.
3. **Reexecutar a certificação final em um único SHA**, exigindo Vercel production + gates públicos + smoke autenticado verde. Não existe outra feature obrigatória de produto pendente para o corte atual.

### Blockers atuais do primeiro release

- **#305 — Supabase Auth upstream:** `auth.signInWithPassword()` retorna 5xx; SQL mínimo e Advisors do projeto também registraram `Connection terminated due to connection timeout`. Não mascarar com retry extra, fallback, troca de senha do fixture ou bypass OIDC.
- **#309 — autoridade de deploy Supabase:** o PAT do GitHub Actions é válido, mas recebe 403 para atualizar Edge Functions. Rotacionar para PAT pertencente a identidade Supabase Developer/Admin/Owner; não usar `service_role` como substituto.

O broker remoto v3 permanece ACTIVE e byte a byte igual ao source versionado da `main`; portanto #309 é problema de autoridade automática, não drift do runtime atual.

**MVP READY continua bloqueado** até o mesmo SHA obter sessão autenticada real e o deploy automatizado exact-main recuperar autoridade.

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
