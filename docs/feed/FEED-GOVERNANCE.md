# FEED-GOVERNANCE.md

Sprint: FEED.GOVERNANCE.1

Status: constituicao oficial do dominio Feed

Base obrigatoria:

- `docs/feed/FEED-AUDIT.md`
- `docs/domain/TERRITORY-GOVERNANCE.md`
- `docs/domain/TERRITORY-DATA-QUALITY-V2.md`

Regra de escopo: este documento define dominio, fronteiras, SSOT, contratos, operacoes proibidas, arquitetura e criterios de congelamento. Nao implementa codigo, banco, migrations, contracts tecnicos ou roadmap.

## 1. Decisao central

Feed e o dominio responsavel pela experiencia de fluxo social territorial do Achegue-se.

Feed existe sobre um `ResolvedTerritory`. Nenhuma experiencia publica de Feed existe em modo global implicito.

Todo acesso publico, leitura, criacao, edicao, comentario, reacao, compartilhamento, denuncia e moderacao de item de Feed deve ser executado dentro de um contexto territorial explicito.

O dominio Feed nao e apenas "posts". Feed e a camada de orquestracao que transforma conteudo social territorial em timeline, detalhe, acoes e eventos de produto, respeitando Territory, Rollout e AccessPolicy.

## 2. Responsabilidade oficial do Feed

### 2.1 Missao do Feed

Fornecer a experiencia canonica de timeline social territorial, garantindo que cada item exibido ou acionado pertence ao Territory resolvido, esta permitido pelo rollout, respeita a politica de acesso e preserva a navegacao territorial em todos os deep-links e compartilhamentos.

### 2.2 O que pertence ao Feed

| Area | Pertence ao Feed |
| --- | --- |
| Timeline | Consulta, paginacao, ordenacao, filtros, ranking e composicao de itens exibidos em uma timeline territorial. |
| Detalhe | Resolucao de item de Feed dentro do Territory atual, incluindo estado de visibilidade e permissao. |
| Criacao | Orquestracao publica de criacao de post/item social territorial. |
| Edicao | Orquestracao publica de edicao de item social territorial, incluindo autor, territorio, rollout e permissao. |
| Exclusao/ocultacao | Orquestracao publica de remocao logica, ocultacao ou despublicacao de item de Feed. |
| Comentarios | Porta publica para listar e criar comentarios de item de Feed, sempre herdando o Territory do item pai. |
| Reacoes | Porta publica para curtir, salvar, votar, reagir ou desfazer reacao em item de Feed. |
| Compartilhamento | Geracao de link canonico territorial e registro de evento de compartilhamento. |
| Denuncias | Porta publica para denunciar item/comentario de Feed dentro do escopo territorial. |
| Moderacao de Feed | Escopo, alvo e contexto territorial enviados ao dominio Moderation. |
| Empty states | Estados oficiais da timeline e detalhe quando nao ha conteudo real. |
| Query keys/cache | Chaves de cache canonicas do Feed, sempre derivadas de `TerritoryFilter`. |
| Feed item model | Modelo de apresentacao `FeedItem` que agrega post, autor, midia, contadores, permissoes e origem territorial. |

### 2.3 O que nao pertence ao Feed

| Area | Nao pertence ao Feed | Dono |
| --- | --- | --- |
| Hierarquia geografica | Resolver estado/cidade/bairro/grupo, boundary, centro, paths, slugs e filtros territoriais primarios. | Territory |
| Comunidade como entidade | Perfil da comunidade, membros, grupos, regras locais, roles comunitarias e portal. | Community |
| Registro bruto de post | Schema atomico do post, constraints de persistencia e validacao de baixo nivel do registro. | Posts |
| Arvore bruta de comentarios | Persistencia atomica de comentario, parent/child, contadores basicos e validacao estrutural. | Comments |
| Mecanica bruta de engajamento | Deduplicacao de like/save/reaction, contadores e eventos atomicos. | Engagement |
| Busca federada | Orquestracao entre dominios pesquisaveis e ranking federado geral. | Search |
| Corridas, caronas e deslocamento | Regras de mobilidade, ofertas, corridas, pontos, rotas e matching. | Mobility |
| Entrega de notificacoes | Inbox, push, email, preferencias, outbox e delivery. | Notifications |
| Armazenamento de midia | Upload, scan, storage, transformacao e lifecycle de arquivos. | Media |
| Fila e decisao de moderacao | Workflow de revisao, sancoes, banimentos, auditoria e politicas globais. | Moderation |

## 3. Limites oficiais entre dominios

### 3.1 Feed x Community

Community define o contexto social que existe sobre um Territory: comunidade ativa, membership, roles, regras e permissao social.

Feed consome a decisao de Community, mas nao decide membership.

Regra: Feed pode perguntar "este usuario pode agir neste Feed?", mas a resposta de pertencimento vem de Community/AccessPolicy.

### 3.2 Feed x Posts

Posts e o dominio do registro atomico de post.

Feed e a unica porta publica para usar posts como experiencia territorial.

Regra: UI, hooks publicos e modulos publicos nao acessam Posts diretamente para timeline, detalhe, criacao, edicao ou exclusao. Posts pode ser usado apenas como colaborador interno de Feed Service ou Feed Repository.

### 3.3 Feed x Comments

Comments e o dominio da estrutura atomica de comentarios.

Feed e a unica porta publica para comentario em item territorial.

Regra: nenhum comentario publico pode ser lido, criado, editado, excluido, reagido ou denunciado apenas por `comment_id` ou `post_id`. O contexto territorial do item pai e obrigatorio.

### 3.4 Feed x Engagement

Engagement e o dominio dos eventos atomicos de curtida, save, vote, reaction e contadores.

Feed decide se a acao e permitida no item territorial atual.

Regra: Engagement nao deve receber chamadas publicas por ID puro. A chamada publica passa pelo Feed Service, que valida territorio, rollout e acesso.

### 3.5 Feed x Search

Search e o dominio da busca federada.

Feed fornece um provider pesquisavel de itens de Feed e recebe consultas com `TerritoryFilter`.

Regra: Search nunca pode ampliar uma busca territorial de Feed para global sem decisao explicita do produto e sem alterar o contexto exibido ao usuario.

### 3.6 Feed x Mobility

Mobility e dono de regras de deslocamento, caronas, corridas e alertas de mobilidade.

Quando Mobility precisa publicar ou exibir uma conversa social, deve usar Feed como porta territorial.

Regra: Mobility nao pode consultar posts por tipo sem `ResolvedTerritory`/`TerritoryFilter`.

### 3.7 Feed x Notifications

Notifications entrega mensagens e mantem preferencias.

Feed emite eventos de dominio, como post criado, comentario criado, reacao recebida ou denuncia registrada.

Regra: Notifications nao decide visibilidade de Feed. Todo link de notificacao para Feed deve preservar o Territory canonico.

### 3.8 Feed x Media

Media armazena e processa arquivos.

Feed referencia assets e decide se eles podem aparecer no item territorial.

Regra: Feed nao armazena bytes de midia; Media nao decide se um asset pode aparecer em um Territory.

### 3.9 Feed x Moderation

Moderation decide revisao, fila, sancao e auditoria.

Feed fornece target, autor, reporter, territorio, motivo e evidencia contextual.

Regra: Moderation nao deve inferir territorio apenas por target ID. O contexto territorial deve ser parte do contrato recebido.

### 3.10 Profile Activity Exception

ActivityTimeline pertence ao dominio Profile.

`useUserActivity` e `useActivityStats` sao read models privados de Profile, orientados a `userId` e `profileId`. Eles nao representam uma superficie publica do Feed e nao substituem timeline territorial, detalhe territorial, comentarios publicos de item ou qualquer acao social publica.

Profile pode consumir read models atomicos de Comments, Posts e Engagement para compor historico pessoal, estatisticas por autor, exportacao de dados e atividade recente da conta, desde que:

- a superficie seja Profile/Account, nao Feed/Community;
- a operacao seja read-only;
- a operacao nao crie, edite, exclua, reaja, denuncie ou compartilhe alvo de Feed;
- a operacao nao liste conversa publica de post por `post_id` como experiencia territorial;
- a operacao nao substitua `FeedService.listTimeline`, `FeedService.getDetail`, `FeedService.listComments` ou `FeedService.createComment`;
- a operacao nao seja usada como discovery global de posts, comentarios ou atividades sociais;
- qualquer abertura de post, comentario ou alvo social seja entregue ao Feed/Routing e continue obrigatoriamente passando pela validacao territorial do Feed.

Regra: a excecao de Profile Activity permite apenas composicao privada de historico pessoal. Ela nao autoriza surfaces publicas, modulos satelites ou componentes de Community a acessarem Comments, Posts ou Engagement fora do Feed quando a operacao pertencer ao boundary publico do Feed.

## 4. SSOT oficial do Feed

### 4.1 Porta unica de entrada

A unica porta oficial para operacoes publicas de Feed e o **Feed Service**.

O Feed Service e o boundary de aplicacao do dominio. Ele recebe contexto territorial, rollout, access policy, usuario/perfil e payload da operacao. Ele valida regras de dominio e delega persistencia ao Feed Repository.

Nenhuma tela, componente, hook publico ou modulo satelite pode chamar Supabase, Posts, Comments, Engagement, Media ou Moderation diretamente para executar uma operacao publica de Feed.

### 4.2 SSOT por operacao

| Operacao | SSOT oficial | Observacao normativa |
| --- | --- | --- |
| Timeline | Feed Service `listTimeline` | Deve receber `FeedContext` e `TerritoryFilter`; falha fechado sem territorio. |
| Detalhe | Feed Service `getDetail` | Deve validar que o item pertence ao Territory resolvido antes de retornar. |
| Criacao | Feed Service `createItem` | Deve derivar `targetTerritory` do contexto oficial, nunca de slug manual ou perfil como fallback silencioso. |
| Edicao | Feed Service `updateItem` | Deve validar autor/moderador, territorio, rollout e estado do item. |
| Exclusao | Feed Service `deleteItem` ou `hideItem` | Deve validar autor/moderador, territorio e estado atual. |
| Comentarios | Feed Service `listComments` / `createComment` / `updateComment` / `deleteComment` | Comentario herda o Territory do item pai e nao opera isolado. |
| Compartilhamento | Feed Service `createShareLink` / `recordShare` | Link sempre territorial, sem fallback global. |
| Denuncias | Feed Service `reportTarget` | Denuncia inclui contexto territorial e alvo validado. |
| Reacoes | Feed Service `reactToTarget` / `removeReaction` | Reacao sempre em alvo visivel no Territory atual. |

### 4.3 Entidades canonicas do Feed

| Entidade | Definicao |
| --- | --- |
| `FeedContext` | Contexto obrigatorio de qualquer operacao publica de Feed. |
| `FeedItem` | Unidade exibivel na timeline: post, alerta, pergunta, oportunidade social ou item equivalente aprovado. |
| `FeedTarget` | Alvo de acao: item, comentario, resposta ou anexo associado. |
| `FeedOperation` | Acao publica solicitada sobre timeline, item, comentario, reacao, share ou denuncia. |
| `FeedVisibility` | Estado de publicacao, ocultacao, remocao e disponibilidade de item. |
| `FeedPolicyDecision` | Resultado combinado de Territory, Rollout e AccessPolicy para uma operacao. |

### 4.4 Composicao minima de `FeedContext`

`FeedContext` deve conter:

- `resolvedTerritory`;
- `territoryFilter`;
- `rolloutDecision`;
- `accessPolicyDecision`;
- `activeProfile` quando a operacao exigir usuario;
- `requestSource` quando a operacao vier de deep-link, search, notification, share ou modulo externo;
- `canonicalFeedUrl` quando a operacao produzir navegacao ou compartilhamento.

## 5. Contratos que obrigatoriamente recebem contexto

### 5.1 Matriz de contexto

| Operacao | `ResolvedTerritory` | `TerritoryFilter` | Rollout | AccessPolicy |
| --- | --- | --- | --- | --- |
| Timeline | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Detalhe | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Criacao | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Edicao | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Exclusao/ocultacao | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Comentarios - listar | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Comentarios - criar | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Comentarios - editar/excluir | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Reacoes | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Compartilhamento | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio para visualizar o alvo |
| Denuncia | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Moderacao do alvo | Obrigatorio | Obrigatorio | Obrigatorio | Obrigatorio |
| Busca de itens de Feed | Obrigatorio quando em rota territorial | Obrigatorio quando em rota territorial | Obrigatorio para superficies publicas | Obrigatorio para personalizacao/permissao |
| Notificacao com link para Feed | Obrigatorio | Obrigatorio ou derivado do alvo validado | Obrigatorio para abrir | Obrigatorio para abrir |

### 5.2 Regra de falha fechada

Se qualquer operacao publica de Feed nao tiver contexto territorial suficiente, ela deve falhar fechado.

Falhar fechado significa:

- nao consultar dados;
- nao criar registro;
- nao alterar estado;
- nao compartilhar link;
- nao mostrar conteudo de outro Territory;
- retornar Empty State, bloqueio de acesso ou erro controlado.

## 6. Operacoes proibidas

### 6.1 Proibicoes absolutas no boundary publico

As operacoes abaixo sao proibidas em pages, components, hooks publicos e modulos satelites quando nao recebem `FeedContext` ou contexto equivalente validado pelo Feed Service:

| Operacao proibida | Motivo |
| --- | --- |
| `getPostById(id)` | Nao prova que o post pertence ao Territory atual. |
| `getCommentsByPost(postId)` | Herda risco de post por ID sem territorio. |
| `createComment({ post_id })` | Pode comentar alvo fora do Territory validado. |
| `likePost(postId)` | Reacao por ID puro nao prova visibilidade territorial. |
| `savePost(postId)` | Save por ID puro nao prova acesso ao alvo. |
| `recordPostShare(postId)` | Share por ID puro pode registrar alvo fora do contexto. |
| `sharePost(postId)` com fallback global | Deep-link pode perder o Territory. |
| `updatePost(id, data)` | Edicao por ID puro nao prova autor, territorio ou permissao. |
| `deletePost(id)` | Exclusao por ID puro nao prova autor, territorio ou permissao. |
| `getPostsByType(type)` | Pode retornar itens globais de varios Territories. |
| Query por `slug` manual | Slug nao substitui `ResolvedTerritory`. |
| Query por `location_id` isolado na UI | `location_id` sozinho nao substitui `TerritoryFilter`, rollout e access policy. |

### 6.2 Excecao permitida

Repositorios internos podem receber IDs atomicos apenas depois que o Feed Service validou:

1. o `ResolvedTerritory`;
2. o `TerritoryFilter`;
3. o rollout do modulo;
4. a politica de acesso;
5. a existencia e visibilidade do alvo naquele Territory.

Essa excecao nao autoriza UI, hooks ou modulos externos a chamarem operacoes por ID puro.

## 7. Arquitetura oficial

### 7.1 Fluxo de camadas

```text
Pages
  ->
Feed Hooks
  ->
Feed Service
  ->
Feed Repository
  ->
Supabase
```

### 7.2 Responsabilidades por camada

| Camada | Responsabilidade | Proibido |
| --- | --- | --- |
| Pages | Resolver rota, receber `ResolvedTerritory`, renderizar superficies e passar contexto aos hooks. | Consultar Supabase, Posts, Comments ou Engagement diretamente. |
| Components | Renderizar dados e emitir eventos de UI. | Resolver territorio, chamar servicos, montar URLs canonicas ou consultar banco. |
| Feed Hooks | Compor `FeedContext`, chamar Feed Service, gerenciar cache/estado reativo. | Ignorar Territory, usar slug manual, chamar Supabase ou servicos atomicos por ID puro. |
| Feed Service | Aplicar regras de dominio, rollout, access policy, visibilidade, URL canonica e orquestracao. | Renderizar UI, acessar banco sem repository, aceitar operacao publica sem contexto. |
| Feed Repository | Executar queries/mutations persistentes ja autorizadas pelo Service. | Decidir access policy, montar UI, inventar fallback territorial ou aplicar regra de produto nao recebida. |
| Supabase | Persistencia, constraints, RLS, indices e integridade. | Conhecer UI, rotas ou comportamento visual. |

### 7.3 Regras de dependencia

- Pages dependem de Feed Hooks.
- Feed Hooks dependem do Feed Service.
- Feed Service depende de Feed Repository e colaboradores internos autorizados.
- Feed Repository depende de Supabase.
- Components nao dependem de Supabase, Posts, Comments, Engagement, Moderation ou Search para executar operacoes publicas.
- Modulos externos dependem do Feed Service para publicar, consultar ou acionar itens de Feed.

## 8. Regras obrigatorias

### 8.1 Regras inviolaveis

| Regra | Definicao |
| --- | --- |
| F1 | Nenhum componente pode consultar Supabase. |
| F2 | Nenhum componente pode chamar servico de Posts, Comments, Engagement, Media ou Moderation diretamente para operacao publica de Feed. |
| F3 | Nenhum hook pode ignorar `ResolvedTerritory` quando a rota for territorial. |
| F4 | Nenhum hook pode montar `TerritoryFilter` por slug manual. |
| F5 | Nenhum servico publico de Feed pode operar apenas por `post_id`, `comment_id` ou `location_id`. |
| F6 | Nenhum deep-link de Feed pode perder o Territory. |
| F7 | Nenhum compartilhamento pode usar fallback global. |
| F8 | Nenhuma timeline pode consultar dados se `TerritoryFilter` nao estiver pronto. |
| F9 | Nenhuma criacao pode usar bairro do perfil como fallback silencioso quando a rota tiver Territory resolvido. |
| F10 | Nenhum modulo externo pode consultar posts sociais diretamente para montar feed local. |
| F11 | Nenhum Empty State pode parecer conteudo real. |
| F12 | Nenhum mock visual pode ser caminho nominal de producao. |
| F13 | Nenhuma busca territorial pode ampliar resultado para global sem mudanca explicita de escopo exibida ao usuario. |
| F14 | Nenhuma notificacao para item de Feed pode abrir alvo sem validar Territory, rollout e access policy. |
| F15 | Nenhuma denuncia pode ser registrada sem contexto territorial do alvo. |

### 8.2 Regras de URL e deep-link

- Todo link de item de Feed deve ser construido sobre URL territorial canonica.
- O Territory deve estar presente no path ou ser recuperavel de forma canonica pelo alvo validado.
- Query param de item e aceitavel somente se a base da URL for territorial.
- Fallback para cidade/bairro de lancamento nao e permitido para share ou notificacao.
- `/p/:slug` nao pertence ao Feed enquanto estiver reservado a mini-site premium.

### 8.3 Regras de rollout

- Rollout de bairro prevalece sobre rollout de cidade quando existir.
- Feed nao pode ativar acao de criacao se o Territory alvo estiver bloqueado para Feed.
- Timeline publica pode exibir Empty State oficial quando o rollout permite navegacao, mas nao permite conteudo.
- Moderador/admin nao elimina a necessidade de resolver Territory; apenas altera a decisao de acesso.

### 8.4 Regras de access policy

- Visitante pode ver somente superficie publica permitida.
- Usuario autenticado nao equivale a morador.
- Morador, membro, moderador e administrador sao niveis de decisao, nao shortcuts de codigo.
- Acoes de comentario, reacao, share, denuncia e criacao devem receber decisao explicita de policy.
- A policy deve ser avaliada antes da mutation.

## 9. Criterios para congelamento

O dominio Feed podera entrar em modo de manutencao evolutiva somente quando todos os criterios abaixo forem verdadeiros.

### 9.1 Criterios de fronteira

- Existe uma unica porta publica para timeline, detalhe, criacao, edicao, exclusao, comentarios, reacoes, compartilhamento e denuncias.
- Nenhuma page chama Posts, Comments, Engagement, Moderation, Media ou Supabase diretamente para operacao de Feed.
- Nenhum hook publico opera por `post_id` ou `comment_id` sem `FeedContext`.
- Modulos externos, incluindo Mobility, usam Feed Service para itens sociais.

### 9.2 Criterios territoriais

- Toda timeline falha fechado sem `TerritoryFilter`.
- Todo detalhe valida que o item pertence ao `ResolvedTerritory`.
- Todo comentario herda e valida o Territory do item pai.
- Toda reacao valida visibilidade e acesso do alvo no Territory atual.
- Todo share preserva URL territorial.
- Toda notificacao que abre Feed preserva ou revalida Territory.

### 9.3 Criterios de rollout e acesso

- Rollout efetivo por bairro e cidade e aplicado em todas as operacoes publicas.
- AccessPolicy e obrigatoria para leitura sensivel e toda mutation.
- A diferenca entre visitante, autenticado, morador, membro, moderador e admin esta expressa em policy, nao em condicional local espalhada.

### 9.4 Criterios de qualidade de dados e operacao

- Nenhum conteudo mockado aparece como dado real.
- Empty States oficiais existem para timeline, detalhe sem acesso, comentario vazio, erro, offline e busca sem resultado.
- Dados de Feed contam para Operational Maturity do Territory, mas nao compensam falha de Data Quality.
- Nenhum Territory pode lancar Feed oficial apenas por score; gates e blockers continuam obrigatorios.

### 9.5 Criterios de auditabilidade

- Auditoria estatica consegue provar ausencia de operacoes proibidas.
- Testes de isolamento territorial cobrem pelo menos cidade, bairro, TerritoryGroup e deep-link.
- Testes de regressao cobrem share, notification link, search result, comment, reaction e moderation target.
- Documentos `FEATURE-MAP.md` e `SCREEN-MAP.md` nao contradizem as rotas reais do Feed.

## 10. Interpretacao oficial

Esta governanca define a fronteira do dominio Feed. Ela nao declara que a implementacao atual ja esta conforme.

A partir deste documento, qualquer evolucao do Feed deve ser avaliada por tres perguntas:

1. A operacao entra pelo Feed Service?
2. A operacao recebeu `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy quando aplicavel?
3. A operacao falha fechado se o contexto territorial estiver ausente ou invalido?

Se qualquer resposta for "nao", a mudanca viola a governanca do dominio Feed.

## 11. Status final

O dominio Feed possui governanca oficial definida neste documento.

A implementacao atual ainda precisa ser adaptada para cumprir esta governanca, conforme findings de `docs/feed/FEED-AUDIT.md`.
