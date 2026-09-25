# FEED.P0.C.AUTHORITY - Audit

Data: 2026-07-25

## Escopo

Auditoria exclusiva do dominio de autorizacao do Feed.

Esta auditoria nao implementa codigo, nao altera arquitetura e nao altera `FEED-GOVERNANCE.md`.

Base observada:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-P0.C-FINAL-REVIEW.md`
- `src/core/feed/types.ts`
- `src/core/feed/hooks/useFeedContext.ts`
- `src/core/feed/services/createFeedContextForLocation.ts`
- `src/core/community/access/CommunityAccessPolicy.ts`
- `src/core/community/access/useCommunityAccess.ts`
- `src/core/authorization/services/CapabilityPreviewService.ts`
- `src/core/authorization/services/RoleService.ts`

## Resultado Executivo

Hoje nao existe um SSOT oficial, nomeado e uniforme para `AccessPolicy` do Feed.

Existe, porem, uma autoridade parcial e tecnicamente forte no dominio Community:

- `CommunityAccessPolicy.resolveCommunityAccess()` define a matriz de permissoes sociais por `CommunityAction`;
- `useCommunityAccess()` consulta roles, residencia, membership, rollout e comunidade persistida para produzir uma `CommunityAccessDecision`;
- `useFeedContext()` deriva `FeedPolicyDecision` a partir de `useCommunityAccess()`.

O problema atual nao e falta total de regra. O problema e que a regra so esta bem conectada no fluxo React/Community. Nos fluxos de modulo satelite, `createFeedContextForLocation()` aceita uma `FeedPolicyDecision` injetada pelo caller, e Mobility, Work Opportunities e Jobs usam policies fixas com `canCreateItem: true`.

Isso transforma a AccessPolicy em afirmacao do caller, nao em decisao de autoridade.

## 1. Hoje Existe Uma Fonte Oficial Para AccessPolicy?

Parcialmente.

### Existe como fonte de regra social

`src/core/community/access/CommunityAccessPolicy.ts` e hoje a fonte mais proxima de SSOT para autorizacao social territorial.

Evidencia:

- define `CommunityAction`;
- define `CommunityAccessLevel`;
- define `CommunityAccessDecision`;
- centraliza `resolveCommunityAccess()`;
- diferencia visitante, autenticado, morador, morador verificado, membro, membro verificado, moderador e admin;
- decide `create_post`, `comment`, `react`, `save`, `report`, `moderate`, `manage_portal` e outras acoes comunitarias.

### Existe como hook operacional de UI

`src/core/community/access/useCommunityAccess.ts` operacionaliza essa regra para paginas React.

Ele consulta:

- usuario autenticado;
- perfil ativo;
- roles administrativos;
- residencia primaria;
- rollout da comunidade;
- comunidade persistida;
- membership local.

Depois chama `resolveCommunityAccess()`.

### Nao existe como SSOT oficial do Feed

O Feed possui `FeedPolicyDecision`, mas ele e um DTO de contexto, nao uma autoridade.

Evidencia:

- `src/core/feed/types.ts` define `FeedPolicyDecision`;
- `src/core/feed/hooks/useFeedContext.ts` pode derivar a policy via `useCommunityAccess()`;
- o mesmo hook tambem aceita `accessPolicyDecision` injetada;
- `src/core/feed/services/createFeedContextForLocation.ts` exige uma `accessPolicyDecision` do caller;
- os adaptadores de Mobility, Work Opportunities e Jobs passam policy fixa.

Conclusao:

- Community possui a melhor fonte de regra;
- Feed possui um contrato que carrega a decisao;
- ainda nao existe autoridade oficial para transformar contexto territorial + usuario/perfil + acao de Feed em `FeedPolicyDecision` em todos os fluxos.

## 2. Quem Deveria Decidir Cada Acao?

### Criacao

Responsavel recomendado: Community como autoridade de participacao local, consumida pelo Feed.

Racional:

- criar post e uma acao social comunitaria;
- depende de residencia, membership, perfil ativo, rollout e roles locais;
- `CommunityAccessPolicy` ja possui a action `create_post`;
- Feed deve validar o contexto e executar a orquestracao, mas nao inventar a permissao social.

Feed deve:

- exigir `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy;
- rejeitar contexto invalido;
- impedir fallback territorial;
- persistir via `FeedRepository` somente apos decisao pronta.

Community deve:

- decidir se o sujeito pode criar no territorio.

### Comentarios

Responsavel recomendado: Feed como boundary da operacao, Community como autoridade da permissao.

Racional:

- comentario herda territorio do item pai;
- Feed deve validar alvo, visibilidade e pertencimento territorial;
- Community deve decidir `comment`;
- Comments deve persistir somente depois da autorizacao do Feed.

### Reacoes

Responsavel recomendado: Feed como boundary da operacao, Community como autoridade da permissao.

Racional:

- reacao depende de o item estar visivel no territorio atual;
- Feed deve validar o target;
- Community deve decidir `react`/`save`;
- Engagement deve continuar como mecanismo atomico, nao como autoridade publica.

### Compartilhamentos

Responsavel recomendado: Feed para link canonico e visibilidade do alvo; Community para permissao de visualizar/acionar o alvo.

Racional:

- compartilhar item de Feed nao pode perder territorio;
- Feed deve gerar URL territorial canonica;
- Feed deve validar que o item pode ser aberto naquele Territory;
- Community decide se o sujeito pode visualizar a superficie necessaria;
- a acao de registrar share nao deve operar por `post_id` puro.

### Moderacao

Responsavel recomendado: responsabilidade composta.

- Community decide autoridade local (`moderate`, `manage_portal`) por membership/role local.
- Authorization/Role decide roles globais (`admin`, `moderator`, `super_admin`).
- Feed valida alvo, territorio e visibilidade contextual.
- Moderation executa workflow, fila, sancao, auditoria e decisao final de moderacao.

Racional:

- moderacao nao e apenas permissao social;
- tambem envolve workflow e auditoria;
- ainda assim, Moderation nao deve inferir territorio so por target ID.

## 3. Existe Hoje Algum Servico Que Ja Exerca Parcialmente Esse Papel?

Sim.

### CommunityAccessPolicy

Exerce o papel de regra pura.

Pontos fortes:

- e deterministico;
- e testado;
- cobre acoes comunitarias essenciais;
- separa nivel de acesso de permissoes;
- aceita target territorial;
- nao depende de React.

Limite:

- recebe input ja carregado;
- nao consulta dados;
- nao monta `FeedPolicyDecision` diretamente.

### useCommunityAccess

Exerce o papel de orquestrador de UI.

Pontos fortes:

- consulta dados reais de sessao, roles, residencia, membership e rollout;
- retorna `CommunityAccessDecision` completa;
- ja e usado em paginas da comunidade;
- e usado indiretamente pelo `useFeedContext()`.

Limite:

- e hook React;
- nao atende fluxos service-to-service ou modulos satelite fora de React;
- nao pode ser chamado em services.

### useFeedContext

Exerce o papel de adaptador Feed em fluxos React.

Pontos fortes:

- deriva `FeedPolicyDecision` de `useCommunityAccess()`;
- falha para estados `unknown` e `pending`;
- integra rollout do modulo Community.

Limite:

- permite override por `accessPolicyDecision`;
- nao resolve autoridade para services/modulos.

### CapabilityPreviewService

Nao deve ser autoridade de Feed.

Evidencia do proprio arquivo:

- os contratos sao "UI capability preview";
- resultado positivo nunca autoriza comando;
- backend/RLS/RPC/Edge Functions devem reavaliar identidade, role, escopo e ownership.

Ele pode ajudar visibilidade de UI, mas nao deve decidir criacao, comentarios, reacoes ou moderacao do Feed.

### RoleService

Exerce autoridade parcial para roles globais.

Pontos fortes:

- consulta roles por RPC/Edge Function;
- serve para admin/moderator/super_admin.

Limite:

- nao decide membership local;
- nao decide residencia;
- nao decide Territory;
- nao substitui CommunityAccessPolicy.

## 4. Vale Criar Um AccessPolicyService Proprio?

Nao como novo dominio generico neste momento.

Criar um `AccessPolicyService` proprio para Feed agora tende a duplicar `CommunityAccessPolicy`, porque as regras que importam para Feed sao regras de participacao social comunitaria:

- residencia;
- residencia verificada;
- membership;
- roles locais;
- roles globais;
- rollout comunitario;
- acoes como `create_post`, `comment`, `react`, `save`, `report`, `moderate`.

O dominio Community ja possui essa responsabilidade conceitual e tecnica.

O que falta nao e um novo dominio, mas uma forma oficial de consumir essa autoridade fora do hook React.

Recomendacao:

- nao criar um AccessPolicyService paralelo no Feed;
- promover CommunityAccessPolicy como autoridade de regra;
- criar, em sprint propria, um adaptador/autoridade operacional pequeno para fluxos nao-React, sem duplicar matriz de permissoes.

Esse adaptador deveria consultar ou receber dados canonicos e produzir `CommunityAccessDecision`/`FeedPolicyDecision` com origem auditavel.

## 5. Qual Solucao Gera Menos Duplicacao Arquitetural?

A solucao com menos duplicacao e:

1. manter `CommunityAccessPolicy.resolveCommunityAccess()` como regra canonica;
2. manter `useCommunityAccess()` como orquestrador React;
3. impedir que modulos satelite fabriquem `FeedPolicyDecision`;
4. para fluxos service-to-service, consultar a autoridade Community ou um adaptador fino baseado na mesma policy;
5. Feed continua consumindo `FeedPolicyDecision`, mas nao aceita policy permissiva sem proveniencia confiavel.

Isso evita:

- duplicar matriz de permissoes dentro de Feed;
- criar regra diferente para Mobility/Jobs/Oportunidades;
- transformar Authorization global em autoridade local indevida;
- colocar regra de membership dentro do FeedRepository;
- espalhar `canCreateItem: true` por modulos.

## 6. A Decisao De AccessPolicy Deve Ser Derivada, Consultada Ou Injetada?

Depende do tipo de fluxo, mas nao deve ser livremente injetada por modulo publico.

### Fluxos React territoriais

Decisao deve ser derivada.

Fonte atual adequada:

- `useFeedContext()` deriva de `useCommunityAccess()`.

### Fluxos service-to-service ou modulos satelite

Decisao deve ser consultada.

O caller deve fornecer contexto suficiente:

- user/profile ou sujeito operacional;
- Territory/Location;
- acao desejada;
- origem da requisicao;
- target, quando existir.

A autoridade deve retornar uma decisao auditavel.

### Testes

Decisao pode ser injetada.

Motivo:

- permite testar `FeedService` isoladamente;
- nao representa fluxo publico real.

### Excecoes operacionais

Decisao pode ser injetada somente se a excecao for formal.

Requisitos minimos:

- source/proveniencia explicita;
- caller autorizado;
- escopo territorial;
- action;
- teste provando que caller nao autorizado falha fechado;
- documentacao da excecao.

## 7. A Correcao Pertence A P0.C Ou Deve Virar Sprint Propria?

A correcao deve virar uma sprint propria pequena: `FEED.P0.C.AUTHORITY`.

Motivo:

- o problema foi descoberto no encerramento da P0.C;
- afeta diretamente criacao de posts, entao continua bloqueando a conclusao da P0.C;
- porem nao e apenas trocar um caller;
- exige definir o modo oficial de obter AccessPolicy em fluxos nao-React;
- envolve fronteira entre Feed, Community, Authorization e modulos satelite;
- se for corrigido de forma apressada dentro da P0.C, ha risco de criar um segundo SSOT ou consolidar injecao permissiva.

Essa sprint propria nao deve criar funcionalidades novas.

Escopo recomendado:

- remover policies fixas permissivas de Mobility, Work Opportunities e Jobs;
- consumir decisao de autoridade baseada em `CommunityAccessPolicy`;
- preservar `FeedService.createItem()` como boundary;
- manter `CapabilityPreviewService` fora da autoridade;
- adicionar testes de caller autorizado e caller nao autorizado para fluxos satelite;
- documentar qualquer excecao service-to-service real, se existir.

## Decisao Final

A correcao deve virar uma sprint propria.

Justificativa tecnica: a P0.C ja fechou o boundary de criacao, mas a autoridade de AccessPolicy ainda nao esta uniformemente definida para fluxos nao-React. Como o dominio Community ja possui a regra canonica, a proxima etapa deve conectar os adaptadores satelite a essa autoridade sem criar um novo SSOT concorrente.
