# Achegue-se — Execução main-only e prontidão MVP

**Status:** ATIVO — SSOT OPERACIONAL  
**Atualizado:** 2026-10-08  
**Linha de integração:** `main`

Este documento contém somente o estado operacional vigente, a ordem de execução e o Definition of Done do MVP. Histórico de PRs, SHAs e investigações encerradas pertence a `docs/08-roadmap/checkpoints/`, `docs/10-archive/` ou ao histórico do Git.

## Escopo do primeiro release

### Domínio de produto ativo

- **Business / Empresas**.

### Capabilities horizontais ativas

- Mapa;
- Perto de mim;
- Busca;
- Mensagens, com provider Business no MVP;
- Notificações;
- Auth;
- Perfis / Conta;
- Território;
- Localização;
- Central.

Community, Gastronomia, Serviços/Profissionais, Classificados, Pontos Turísticos, Educação, Vagas, Eventos, Comunicação territorial, Mobilidade, Cupons, Gamificação, Analytics público, Safety familiar, Billing e demais domínios permanecem **paused**.

Código pós-MVP pode permanecer versionado quando possui owner claro e fronteira limpa. Estar versionado não autoriza rota funcional, navegação, prefetch, query, provider, layer de Mapa ou CTA ativo.

## Autoridades de lifecycle

- `src/app/config/productModuleRegistry.ts`: domínios de produto;
- `src/app/config/platformCapabilityRegistry.ts`: capabilities horizontais;
- `src/app/config/lifecycleRegistry.ts`: avaliação de dependências;
- scopes de providers na camada `app/config`: composição entre capability e domínios ativos.

Regra permanente: **vertical de produto não é capability horizontal**. Pausar uma vertical remove seus providers; não transfere ownership e não pausa automaticamente Mapa, Nearby, Search, Messaging ou Notifications.

## Regras de implementação

- `main` é a linha canônica; branch/PR transitório só existe para satisfazer o fluxo protegido e deve retornar imediatamente à `main` após os gates;
- corrigir causa raiz; não introduzir paliativo;
- não criar redirect/alias/fallback para preservar arquitetura antiga;
- não manter duas autoridades para a mesma responsabilidade;
- não consultar módulo pausado apenas para montar UI escondida;
- não importar implementação interna entre módulos;
- não mover lifecycle para `core` ou `modules`; a composição pertence à camada `app`;
- preservar código pós-MVP quando estiver isolado do runtime ativo;
- remover código órfão, facade sem caller, barrel artificial e documento supersedido somente quando o censo provar ausência de dependência viva;
- migrations históricas permanecem imutáveis quando necessárias ao ledger/proveniência;
- merge/commit não equivale a produção validada;
- não forçar deployment, upgrade major ou mudança de runtime apenas para obter um gate verde.

## Estado técnico do núcleo

O corte estrutural do MVP está consolidado:

- Business é o único domínio público ativo;
- Map, Nearby, Search e Messaging usam providers lifecycle-scoped;
- Notifications mantém histórico horizontal e governa ações pela policy de lifecycle;
- rotas e prefetch ativos não montam módulos pausados;
- Central/Conta não anunciam verticais pausadas;
- componentes Business/Profile ativos recebem escopo de lifecycle pela camada `app`;
- Busca assistida autoriza intents explicitamente na camada `app`;
- URLs sem owner ativo chegam ao 404 canônico, sem redirect de compatibilidade;
- Account, Business lifecycle e Business Messaging já passaram no smoke autenticado de produção do candidato certificado;
- Notifications permanece horizontal e teve seu boundary live de RPC/RLS auditado sem escrita direta pelo browser;
- o build canônico passa security, lint, typecheck, sitemap, build e `npm audit --omit=dev` com zero vulnerabilidades production-reachable;
- findings de dependência exclusivamente dev permanecem sob a autoridade de residuals e não autorizam `npm audit fix --force` ou migração major improvisada.

### Frontend Finish do MVP

A convergência visual das superfícies ativas está em fase final:

- catálogo de Empresas alinhado à identidade petróleo/teal;
- detalhe público com shell responsivo alinhado ao catálogo;
- Central da empresa com visão geral, dados e configurações repaginados;
- Perto de mim sem o hero legado;
- Busca com copy pública humanizada;
- criação e edição de empresa alinhadas em etapas canônicas;
- horário noturno que atravessa meia-noite tratado pelo owner de Business Hours;
- detalhe público consome `BusinessHoursService` em vez de recalcular estado localmente;
- testes arquiteturais impedem reintrodução de owners concorrentes.

O restante do Frontend Finish é acabamento de shell e consistência visual das superfícies ativas; não existe nova feature de produto prevista para o corte do MVP.

### Higiene documental/repositório

A documentação viva representa somente o produto atual:

- `docs/README.md` é o índice canônico;
- `docs/08-roadmap/README.md` separa execução atual de planos futuros;
- material concluído/supersedido vai para `docs/10-archive/` ou permanece no Git;
- checkpoints datados podem registrar blockers históricos sem se tornarem autoridade atual;
- módulos pausados não são apagados apenas para reduzir o repositório.

Qualquer regressão nessas regras deve falhar nos gates arquiteturais/documentais correspondentes.

## Blockers ativos de infraestrutura

**O release permanece bloqueado por #305 (Supabase/PostgREST) e #445 (Vercel/identidade).** As certificações de snapshots anteriores não substituem verificação do Data API nem deployment e smoke do mesmo conteúdo. A PR #621 está desatualizada em relação à `main` e precisa ser reconciliada sem sobrescrever melhorias dos outros chats.

### #305 — Supabase / PostgREST territorial

**ABERTO.** O Data API sofreu nova degradação nas leituras territoriais (`locations` e `territorial_groups`) após o fechamento histórico. Em 08/10/2026, logs recentes de PostgREST continuavam registrando timeouts HTTP, `57014` e falhas de leitura de schema/configuração. Uma leitura SQL isolada respondeu, mas não certifica o Data API. A correção histórica de Profile/browser permanece preservada, sem provar resolução deste incidente.

O gate #305 só fecha após leituras reais e sustentadas de PostgREST, certificação das rotas territoriais e smoke do candidato. Não compensar com retry ilimitado, timeout artificialmente maior, fallback de login, bypass OIDC, fixture alternativa ou relaxamento de RLS.

### #445 — Vercel / identidade de release

**ABERTO.** A última rejeição registrada do deployment canônico foi HTTP `402 payment_required` (quota Vercel), com reset histórico informado em 07/10/2026; a capacidade atual e a identidade do deployment do novo conteúdo ainda **não foram comprovadas**. A política **`exact/equivalent`** continua canônica: equivalência só vale com fingerprint demonstrado, nunca por presunção ou reaproveitamento de CI antigo.

A política `tools/release/vercel-ignore-build.mjs` continua válida: somente paths classificados como **skippable** ficam fora do fingerprint deployável e podem receber `Ignored Build Step`. Testes e documentação comum normalmente entram nessa classe, mas documentos críticos de governança consumidos pela autoridade de release — incluindo este `EXECUCAO_MAIN_ONLY.md` — são deliberadamente deploy-relevant e alteram o fingerprint. Não contornar isso com commit vazio, alteração artificial de runtime, ampliação indevida da allowlist ou relaxamento de `vercel.json`.

Todo novo delta deployável — inclusive mudança em input crítico de governança que participa do fingerprint — exige nova prova: deployment `READY` + smoke, ou equivalência de fingerprint aceita pelo gate canônico. Qualquer regressão de infraestrutura reabre o gate correspondente.

## P0 de integridade do domínio ativo

### #649 — Business / Endereço e idempotência

**ABERTO.** As PRs #646, #648, #650, #651 e #652 foram integradas para evitar compensações destrutivas, impedir edição antecipada do endereço existente e validar o CEP. Entretanto, a operação Address/Business continua sem transação conjunta comprovada, recibo de idempotência persistente ou reconciliação de órfãos no servidor. Não tratar copy-on-write e CI verde como certificação do fluxo empresarial de criação/edição. A correção deve nascer versionada no owner SQL/broker, sem escritor paralelo nem dashboard drift, e passar testes negativos autenticados.

## Dívidas abertas que não são blocker genérico do MVP

- **#68 — LGPD:** purge físico e exportação self-service permanecem fail-closed; não habilitar migration/worker/scheduler/export enquanto seus contratos não autorizarem rollout. O canal DPO e os fluxos seguros atuais permanecem válidos para o MVP.
- **#85 — Security Hardening:** continua como programa de endurecimento e auditoria de drift; finding do Advisor só gera mudança quando o caller/grant indevido for comprovado.
- **#28 — Governança da `main`:** depende de credencial/integração com permissão administrativa para ler e comprovar a proteção clássica; não existe correção de código legítima para substituir essa prova.
- **#447/#448 — OrdaX:** dependem da autoridade OrdaX certificada. Achegue-se não compartilha banco, `service_role` ou persistência com OrdaX e a indisponibilidade da integração não pode quebrar Business, Mapa, Nearby, Busca ou Business Messaging.
- **#50/#118:** pós-MVP.

## Ordem de execução até a promoção do primeiro release

1. **Fechar Frontend Finish**
   - revisar responsividade e consistência visual de Empresas, Busca, Mapa, Perto de mim, Mensagens e Notificações;
   - corrigir somente defeitos objetivos;
   - não ampliar escopo.

2. **Concluir higiene final**
   - remover código/documento comprovadamente obsoleto;
   - manter histórico em checkpoints/archive/Git;
   - preservar módulos pós-MVP com owner legítimo;
   - impedir documento vivo de ocultar blocker reaberto.

3. **Preservar os gates do candidato**
   - security;
   - SSOT/arquitetura;
   - lint;
   - typecheck;
   - testes lifecycle-scoped;
   - build canônico;
   - audit de dependências de produção;
   - E2E público;
   - E2E autenticado;
   - release identity;
   - deployment/smoke quando houver delta deployável.

4. **Resolver os blockers atuais**
   - #305: validar saúde sustentada das consultas territoriais do Data API;
   - #445: comprovar capacidade, deployment e identidade de release do novo conteúdo;
   - #649: resolver a atomicidade/idempotência no broker SQL e certificar os cenários negativos;
   - reconciliar #621 com a `main` sem perder os commits já incorporados.

5. **Promover**
   - somente com os blockers acima efetivamente resolvidos e todas as provas aplicáveis ao mesmo conteúdo de runtime verdes;
   - regressão crítica reabre o gate;
   - módulos pós-MVP continuam `paused` após o primeiro release.

## Definition of Done — MVP READY

O MVP recebe **READY** quando o conteúdo candidato comprovar:

- Business funcional com dados reais e rotas canônicas;
- Mapa funcional com provider Business;
- Perto de mim funcional, com localização/distância truthful;
- Busca funcional dentro do escopo autorizado;
- Mensagens Business funcionais com sessão real;
- Notificações funcionais como capability horizontal, sem reabrir vertical pausada;
- Conta/Auth funcionais com sessão real;
- zero dependência ativa em módulo pausado;
- zero redirect/alias/fallback legado usado como mecanismo de lifecycle;
- security/lint/typecheck/test/build executados de verdade;
- audit de produção sem vulnerabilidade não excepcionada;
- identidade de release `exact/equivalent` comprovada;
- deployment `READY` + smoke para qualquer novo delta deployável;
- `Ignored Build Step` apenas quando a política canônica provar que não houve delta deployável;
- nenhum erro crítico recorrente;
- #305 e #445 fechados com provas atuais, e #649 resolvido e certificado na autoridade persistente.

**MVP NÃO HOMOLOGADO.** O candidato #621 precisa ser reconciliado com a `main` e recertificado no novo HEAD. #305, #445 e #649 continuam abertos; acabamento/higiene não substitui correção dos bloqueios de operação.

## Onde fica o histórico

- decisões vigentes: `docs/DECISIONS.md`;
- arquitetura vigente: `docs/03-architecture/`;
- estado funcional: `docs/FEATURE-MAP.md` e `docs/SCREEN-MAP.md`;
- estado dos roadmaps: `docs/08-roadmap/README.md`;
- evidências datadas: `docs/08-roadmap/checkpoints/`;
- material superado: `docs/10-archive/`;
- sequência completa de mudanças: histórico do Git.

Documento operacional vivo não deve virar diário de PRs nem fixar SHA como “main atual”, porque isso se torna obsoleto no merge seguinte.
