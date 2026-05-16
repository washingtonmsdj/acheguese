# Arquitetura: Comunicacao Territorial

Data: 2026-05-15
Status: proposta canonica para implementacao faseada
Owner conceitual: core/comunicacao-territorial + core/community-alerts + core/notifications + core/verification + core/moderation

## Decisao

Criar o dominio **Comunicacao Territorial** como camada institucional/editorial hiperlocal do Achegue-se.

Este dominio nao substitui `/comunidade` e nao deve virar mais um feed social. Ele cria uma identidade propria para canais comunitarios confiaveis, como TV de bairro, radio local, portal de noticias, coletivo de comunicacao, jornal local e canais de utilidade publica.

Decisao de produto atualizada em 2026-05-15:

- `/comunicacao` e a listagem/descoberta dos agentes de comunicacao do territorio.
- O feed proprio do canal vive na pagina canonica do canal em `/comunicacao/:state/:city/:territorySlug/:channelSlug`.
- As publicacoes dos canais tambem devem ser distribuidas na comunidade relacionada, em uma aba de Comunicacao ou bloco equivalente.
- Conteudo do tipo materia/reportagem deve abrir sua experiencia canonica no canal.
- Conteudo do tipo postagem comum, com texto/fotos, pode ser consumido diretamente na comunidade sem obrigar navegacao para a pagina do canal.
- A relevancia primaria e territorial/contextual, nao baseada apenas em seguidores.

A rota publica canonica do dominio e:

```text
/comunicacao
/comunicacao/:state/:city
/comunicacao/:state/:city/:territorySlug
/comunicacao/:state/:city/:territorySlug/:channelSlug
```

Observacao: o projeto usa `state`, `city` e `territorySlug` nas rotas territoriais. `uf` e aceito como conceito de produto, mas o contrato tecnico deve manter o padrao existente.

## Objetivo estrategico

Transformar o Achegue-se em infraestrutura de comunicacao hiperlocal confiavel, com:

- canais institucionais do territorio;
- noticias e utilidade publica com fonte clara;
- alertas territoriais com controle de abuso;
- reputacao editorial e historico de confiabilidade;
- push notification territorial sem abrir brecha para spam;
- separacao clara entre usuario comum, empresa, profissional, motorista, canal de comunicacao e orgao oficial.

## Ajuste no plano original

A ideia e forte, mas precisa ser encaixada no SSOT atual do projeto. O ajuste principal e este:

- Nao criar um modulo isolado que acesse Supabase direto.
- Nao colocar canais como `business` nem como usuario comum.
- Nao duplicar notificacoes, verificacao, moderacao, reputacao e alertas.
- Criar uma entidade operacional nova baseada em `profiles`, com tabela propria de dominio.
- Usar `location_id` como fronteira territorial obrigatoria.
- Usar `/comunicacao` como rota canonica editorial, deixando `/comunidade` apenas consumir/superficializar conteudo quando fizer sentido.

## Relacao com o que ja existe

| Capacidade existente | Como Comunicacao Territorial usa |
| --- | --- |
| `profiles` | identidade operacional do canal, via novo `profile_type` planejado |
| `profile_members` | operadores, editores e administradores do canal |
| `location_id` | SSOT territorial para autorizacao, feed e alcance |
| `territorial_groups` | expansao de grupos para bairros oficiais autorizados |
| `core/public-identity` | slug publico e historico de identificador |
| `core/verification` | verificacao institucional do canal |
| `core/moderation` | denuncia, revisao, auditoria e penalidade |
| `core/community-alerts` | infraestrutura de alertas territoriais e mapa |
| `core/notifications` | push/in-app/email com preferencia do usuario |
| `core/feed` / `core/posts` | exibicao agregada no feed geral, sem virar fonte primaria editorial |

## Papel correto no produto

`/comunicacao` nao e um Instagram paralelo e nao e um diretorio de empresas comuns. O papel correto e:

- diretorio inteligente de agentes de comunicacao;
- descoberta territorial de canais, midias, coletivos e comunicadores;
- camada editorial que abastece comunidade, feed principal e modulos contextuais;
- pagina publica canonica para canal e materias editoriais.

O consumo em `/comunidade` deve ser uma distribuicao contextual do conteudo, nao a fonte primaria da entidade editorial.

## Entidades de produto

### Usuario comum

Perfil pessoal. Pode publicar no feed social conforme regras atuais. Nao pode emitir alerta institucional nem push territorial em massa.

### Empresa

Entidade comercial. Pode publicar ofertas, cardapio, servicos e conteudo operacional do negocio. Nao deve receber permissao editorial territorial por ser empresa.

### Canal de Comunicacao

Nova entidade institucional do territorio. E o foco deste dominio.

Exemplos:

- TV de bairro;
- radio comunitaria;
- portal local;
- jornal comunitario;
- coletivo de comunicacao;
- canal de utilidade publica validado.

### Orgao oficial

Entidade institucional publica. Deve ser planejada como tipo separado, mas nao precisa entrar no MVP de Comunicacao Territorial. O risco de misturar orgao oficial com canal comunitario e alto: orgao oficial tem autoridade juridica, canal comunitario tem confiabilidade editorial.

## Tipo de perfil recomendado

Adicionar, em fase propria, o tipo:

```ts
type ProfileType =
  | "personal"
  | "business"
  | "professional"
  | "driver"
  | "communication_channel";
```

`official_agency` deve ser uma fase posterior, depois de validar governanca, auditoria e regras de responsabilidade publica.

## Modelo de dados recomendado

### `communication_channels`

Tabela dona do cadastro institucional do canal.

Campos principais:

- `id`
- `profile_id` FK para `profiles.id`, unico
- `public_name`
- `legal_name`
- `slug`
- `channel_kind`: `tv_bairro`, `radio`, `portal`, `jornal`, `coletivo`, `utilidade_publica`, `outro`
- `description`
- `website_url`
- `contact_email`
- `contact_phone`
- `status`: `draft`, `pending_verification`, `active`, `restricted`, `suspended`, `rejected`
- `verification_status`: `pending`, `verified`, `rejected`
- `reliability_score`: 0 a 100
- `alert_cooldown_until`
- `created_at`
- `updated_at`

### `communication_channel_territories`

Tabela de autorizacao territorial.

Campos principais:

- `id`
- `channel_id`
- `location_id` FK para `locations.id`
- `territory_role`: `primary`, `coverage`, `watch_only`
- `can_publish`
- `can_alert`
- `can_push`
- `approved_by_user_id`
- `approved_at`

Regra: alerta institucional so pode ser emitido para `location_id` autorizado. Grupo territorial deve ser expandido para `location_id` oficiais antes da gravacao.

### `communication_publications`

Fonte primaria editorial do dominio.

Campos principais:

- `id`
- `channel_id`
- `author_profile_id`
- `location_id`
- `publication_type`: `news`, `coverage`, `event`, `job`, `public_utility`, `report`, `moderated_alert`, `urgent_alert`
- `content_format`: `article` ou `update`
- `title`
- `summary`
- `body`
- `source_url`
- `media`
- `status`: `draft`, `published`, `under_review`, `removed`, `retracted`
- `trust_label`: `verified_source`, `community_checked`, `needs_context`, `retracted`
- `published_at`
- `expires_at`
- `created_at`
- `updated_at`

Eventos e vagas nao devem duplicar os dominios existentes quando houver entidade propria. Nesses casos, a publicacao pode referenciar `event_id` ou `job_id`, e o modulo de eventos/vagas continua dono da regra operacional.

`content_format` define a experiencia de clique:

- `article`: materia/reportagem/editorial com canonical propria no canal.
- `update`: postagem comum de canal, consumivel inline na comunidade ou em cards contextuais.

### `communication_publication_distribution`

Tabela recomendada para distribuir publicacoes sem duplicar conteudo.

Campos principais:

- `id`
- `publication_id`
- `channel_id`
- `location_id`
- `target_type`: `communication_hub`, `community_tab`, `contextual_feed`
- `is_active`
- `relevance_score`
- `rank_score`
- `rank_reason`
- `created_at`
- `updated_at`

Regra: a publicacao continua pertencendo a `communication_publications`. A tabela de distribuicao apenas decide onde ela aparece.

Observacao da fase atual: a primeira implementacao nao grava `territorial_group_id` nem `module_key`. Grupos territoriais sao resolvidos no service para uma lista de `location_id`, preservando `location_id` como SSOT territorial.

SSOT de relevancia:

```sql
communication_distribution_relevance_score(publication_type, content_format, target_type)
communication_distribution_rank_score(publication_type, content_format, target_type, reliability_score)
communication_distribution_rank_reason(publication_type, content_format, target_type, reliability_score)
```

O frontend nao calcula score de distribuicao. A RPC de publicacao materializa os destinos padrao e usa essas funcoes para preencher `relevance_score`, `rank_score` e `rank_reason`.

Hardening:

- `communication_upsert_default_distribution(publication_id)` e funcao interna, sem grant para `anon` ou `authenticated`.
- `communication_distribution_relevance_score(...)` tambem e funcao interna, sem grant para `anon` ou `authenticated`.
- `communication_distribution_rank_score(...)` e `communication_distribution_rank_reason(...)` tambem sao internas.
- Criacao de distribuicao operacional acontece depois de `publish_communication_publication` validar autenticacao, membro do canal e `location_id` autorizado.
- Leitura publica da distribuicao exige canal ativo, publicacao publicada e destino ativo.

### `communication_channel_permissions`

Permissoes efetivas do canal.

Campos principais:

- `channel_id`
- `can_publish_news`
- `can_publish_public_utility`
- `can_publish_moderated_alerts`
- `can_publish_urgent_alerts`
- `daily_publication_limit`
- `daily_alert_limit`
- `push_radius_policy`
- `requires_manual_review_until_score`
- `updated_by_user_id`
- `updated_at`

### `communication_reliability_events`

Historico de confiabilidade.

Exemplos de eventos:

- publicacao confirmada;
- alerta confirmado;
- denuncia valida;
- retratacao;
- remocao por moderacao;
- abuso de push;
- suspensao;
- revisao administrativa.

Esse historico alimenta `reliability_score`, mas nao deve ser substituido por um simples contador em `profiles`.

### `communication_penalties`

Penalidades formais.

Campos principais:

- `channel_id`
- `penalty_type`: `warning`, `cooldown`, `permission_loss`, `temporary_suspension`, `permanent_ban`
- `reason`
- `starts_at`
- `ends_at`
- `created_by_user_id`
- `created_at`

## Publicacoes

Tipos aceitos no plano atualizado:

| Tipo | Uso | Feed geral | Push |
| --- | --- | --- | --- |
| `news` | noticia local | sim | nao por padrao |
| `coverage` | cobertura de evento/fato | sim | nao por padrao |
| `event` | chamada editorial para evento | sim | nao por padrao |
| `job` | vaga divulgada por canal | sim | nao por padrao |
| `public_utility` | servico publico, falta de agua, agenda local | sim | opcional com limite |
| `report` | denuncia jornalistica/apuracao | sim, com cuidado | nao por padrao |
| `moderated_alert` | alerta relevante com revisao/limite | sim | limitado |
| `urgent_alert` | risco imediato autorizado | sim | sim, territorial |

Formato de exibicao:

| Formato | Uso | Clique na comunidade |
| --- | --- | --- |
| `article` | materia, reportagem, cobertura longa | abre canonical em `/comunicacao/.../:channelSlug` ou futura rota de detalhe da materia |
| `update` | post simples com texto/fotos do canal | abre inline/modal/card expandido na comunidade |

O MVP atual publica tipos editoriais, mas ainda precisa da coluna/campo de formato para evitar que toda publicacao seja tratada como materia.

## Alertas e push territorial

Alertas sao a parte mais sensivel. A regra deve ser conservadora.

### Regras obrigatorias

- Somente canal verificado pode emitir alerta institucional.
- Somente canal com `can_alert = true` no territorio pode emitir alerta naquele `location_id`.
- `urgent_alert` exige permissao explicita `can_publish_urgent_alerts`.
- Push usa `location_id` e preferencias de notificacao do usuario.
- Alerta para grupo territorial deve virar lista de bairros oficiais autorizados.
- Canal com score baixo entra em cooldown automatico.
- Denuncias validas reduzem score e podem retirar privilegios sem decisao manual.

### Funcao/RPC obrigatoria

Criar uma funcao de banco ou RPC de dominio:

```text
create_communication_publication(payload)
create_communication_alert(payload)
can_channel_publish_in_location(channel_id, location_id, action)
```

A validacao nao pode ficar somente no frontend.

## Reputacao e confiabilidade

Usar dois niveis:

1. `profiles.reputation_score` e `trust_score` continuam sendo sinais globais do perfil.
2. `communication_channels.reliability_score` e o score editorial/institucional do canal.

Regras sugeridas:

- score inicial apos verificacao: 70;
- alerta confirmado: aumenta pouco;
- publicacao removida por moderacao: reduz;
- denuncia valida de alerta urgente: reduz forte;
- tres infracoes em janela curta: remove push e aplica cooldown;
- score abaixo de 60: bloqueia alerta urgente;
- score abaixo de 50: publicacoes entram em revisao;
- score abaixo de 40: suspensao temporaria automatica.

## Territorializacao

`location_id` e obrigatorio em toda publicacao territorial.

Regras:

- Canal nao publica alerta fora dos territorios aprovados.
- Canal pode ter cobertura editorial mais ampla que permissao de push.
- `watch_only` permite listar/cobrir um territorio, mas nao emitir alerta.
- `can_push` deve ser mais restrito que `can_publish`.
- Cidades e grupos territoriais sao resolvidos para bairros/locations oficiais antes de permissao.

## Rotas publicas

### Diretorio geral

```text
/comunicacao
```

Papel: explicar a camada, listar cidades/territorios ativos, entrada institucional e SEO geral.

### Cidade

```text
/comunicacao/:state/:city
```

Papel: hub editorial da cidade, canais verificados e noticias por territorio.

### Territorio

```text
/comunicacao/:state/:city/:territorySlug
```

Papel: hub editorial do bairro/grupo, feed de noticias, utilidade publica, canais ativos e alertas institucionais.

### Canal

```text
/comunicacao/:state/:city/:territorySlug/:channelSlug
```

Papel: pagina publica canonica do canal de comunicacao.

### Subrotas opcionais

```text
/comunicacao/:state/:city/:territorySlug/noticias
/comunicacao/:state/:city/:territorySlug/alertas
/comunicacao/:state/:city/:territorySlug/canais
```

## Relacao com `/comunidade`

`/comunidade` continua sendo cockpit social.

`/comunicacao` vira cockpit editorial/institucional.

Conteudos de Comunicacao Territorial podem aparecer em `/comunidade/.../feed`, mas a canonical URL do conteudo deve apontar para `/comunicacao/...` quando o conteudo for editorial/institucional.

Experiencia recomendada na comunidade:

- aba `Comunicacao` dentro do contexto territorial;
- lista de publicacoes de todos os canais autorizados naquele territorio;
- filtros por tipo: noticias, utilidade publica, eventos, vagas, denuncias/reportagens;
- cards mostram canal, selo/verificacao, territorio, tipo e confiabilidade;
- `article` redireciona para experiencia canonica do canal;
- `update` pode ser expandido diretamente na aba da comunidade.

Regra SEO:

- `/comunicacao/...` indexavel quando conteudo for publico e verificado.
- duplicacao dentro de `/comunidade/...` deve usar canonical para `/comunicacao/...` quando nao houver contexto social exclusivo.

## Admin e operacao

### Admin global

```text
/admin/comunicacao
/admin/comunicacao/canais
/admin/comunicacao/verificacoes
/admin/comunicacao/penalidades
/admin/comunicacao/alertas
```

Responsabilidades:

- aprovar canal;
- definir territorios autorizados;
- conceder/remover permissao de alerta;
- revisar denuncias;
- aplicar penalidades;
- auditar push territorial.

### Central do canal

```text
/central/comunicacao
/central/comunicacao/publicacoes
/central/comunicacao/alertas
/central/comunicacao/confiabilidade
```

Responsabilidades:

- publicar noticia/utilidade publica;
- solicitar verificacao;
- gerenciar equipe via `profile_members`;
- acompanhar reputacao e restricoes;
- consultar historico de alertas.

## Fases de implementacao

### Fase 0: contrato e governanca

- Registrar este documento no indice canonico.
- Decidir `ProfileType` novo.
- Definir reserved names para `comunicacao`, `noticias`, `alertas`, `canais`, `oficial`.
- Criar testes de arquitetura para impedir Supabase direto em UI do dominio.

### Fase 1: entidade e verificacao

- Adicionar `communication_channel` em `ProfileType`.
- Criar `communication_channels`.
- Criar `communication_channel_territories`.
- Integrar `profile_members`.
- Integrar `core/verification`.
- Criar admin minimo para aprovar canal e territorios.

### Fase 2: publicacoes editoriais

- Criar `communication_publications`.
- Criar service canonico em `core/communication` ou `core/communication-territorial`.
- Criar rotas publicas `/comunicacao/...`.
- Integrar feed geral por projecao/leitura, sem duplicar regra de negocio.

### Fase 2.5: distribuicao comunitaria e formato de conteudo

- [x] Adicionar `content_format` em `communication_publications`.
- [x] Criar `communication_publication_distribution`.
- [x] Criar `CommunicationDistributionService`.
- [x] Criar query para aba `Comunicacao` em `/comunidade/:state/:city/:territorySlug`.
- [x] Garantir que `article` e `update` tenham comportamento de clique diferente.
- [x] Centralizar score inicial da distribuicao em SQL.
- [x] Materializar `rank_score` e `rank_reason` no banco.
- [x] Revogar execucao publica da funcao interna de upsert de distribuicao.
- Manter canonical editorial em `/comunicacao/...` para materias/reportagens.
- Nao duplicar publicacoes como posts sociais comuns.

### Fase 3: alertas autorizados

- Criar RPC `create_communication_alert`.
- Integrar `core/community-alerts` e `core/notifications`.
- Implementar limites por reputacao e territorio.
- Auditar push territorial.

### Fase 4: confiabilidade e penalidade automatica

- Criar `communication_reliability_events`.
- Criar `communication_penalties`.
- Automatizar perda de privilegios.
- Exibir historico publico simplificado de confiabilidade.

### Fase 5: orgaos oficiais

- Avaliar tipo separado `official_agency`.
- Criar governanca mais rigida, com auditoria administrativa e responsabilidade institucional.
- Nao misturar com canais comunitarios no MVP.

## Criterios de aceite

- Nenhum canal publica ou envia alerta sem `profile_id` institucional.
- Nenhum alerta institucional sai sem `location_id` autorizado.
- Nenhuma UI do dominio acessa Supabase direto.
- Push territorial passa por `core/notifications`.
- Verificacao passa por `core/verification`.
- Moderacao e denuncia passam por `core/moderation`.
- `/comunicacao` tem papel distinto de `/comunidade`.
- `/comunidade` possui aba/bloco de Comunicacao alimentado por distribuicao territorial.
- Materias/reportagens apontam para canonical do canal.
- Postagens comuns de canal podem ser consumidas inline na comunidade.
- Canal com baixa confiabilidade perde privilegios automaticamente.
- Admin consegue explicar por que um canal pode ou nao emitir alerta em um territorio.

## Riscos e decisoes duras

### Risco: virar spam institucional

Mitigacao: push so por permissao, limite, cooldown e score.

### Risco: confundir empresa com canal

Mitigacao: `communication_channel` nao e `business`. Empresa pode anunciar; canal comunica.

### Risco: falso senso de oficialidade

Mitigacao: separar `verified channel` de `official agency`. Um canal verificado nao e orgao publico.

### Risco: duplicar comunidade

Mitigacao: `/comunicacao` e editorial/institucional; `/comunidade` e social.

### Risco: alerta fora do territorio

Mitigacao: autorizacao por `location_id` no banco, nao no frontend.

## Posicionamento de produto

Esta camada e estrategica porque transforma o Achegue-se em infraestrutura territorial: moradores acompanham o que acontece no bairro, canais ganham distribuicao confiavel, e a plataforma passa a ter um papel institucional sem depender apenas de publicacoes sociais.

A implementacao deve ser profissional e conservadora. O valor esta na confiabilidade. Se alertas e canais forem liberados sem governanca forte, o recurso vira ruido e perde autoridade.
