# Community First Architecture SSOT

Data de referencia: 2026-07-08

Este documento e o contrato arquitetural vivo para a arquitetura Community
First do Achegue-se. O plano detalhado de implementacao incremental permanece
em `plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`.

## Decisao Oficial

O core domain do Achegue-se e:

**Comunidade Local**

Comunidade Local e a entidade social ancorada em um territorio canonico. Ela
organiza descoberta, contexto, pertencimento, interacoes e distribuicao local
de entidades independentes, como empresas, gastronomia, servicos,
classificados, eventos e conteudo.

## SSOTs Canonicos

### Territorio

SSOT:

- `locations`
- `territorial_groups`
- `src/core/location`
- `src/core/territorial`

Responsabilidade:

- representar pais, estado, cidade, bairro, distrito e grupos territoriais;
- resolver escopo geografico;
- servir como base para filtros, URLs territoriais e residencia.

Territorio nao e comunidade. Territorio e a base geografica; Comunidade Local
e o produto social construido sobre essa base.

### Comunidade Local

SSOT atual:

- `territory_communities`
- `community_public_aliases`
- `src/core/community-experience`

Responsabilidade:

- representar a comunidade local routeavel e exibivel;
- resolver perfil publico, status de lancamento, copy, alias e metadados de
  experiencia;
- expor a fachada canonica para leitura da comunidade local.

`src/core/community-experience/services/CommunityExperienceService.ts` e o
servico canonico atual para leitura da Comunidade Local. A Fase 2 do plano deve
reduzir leituras paralelas de `territory_communities` em outros dominios.

### Entidades Independentes

Estas entidades existem por identidade propria e podem se vincular a uma ou
mais comunidades sem copiar seus dados mestres:

- Empresas: `business_data`, `src/core/business`
- Gastronomia: `gastronomy_profiles`, `menu_*`, `orders`,
  `src/core/verticals/gastronomy`, `src/modules/business/gastronomy`
- Servicos/profissionais: `professional_data`, `src/core/professional`,
  `src/modules/professionals/services`
- Classificados: `classifieds`, `src/core/classifieds`,
  `src/modules/classifieds`
- Eventos: tabelas de eventos existentes, com ownership a consolidar antes de
  reativacao publica ampla
- Usuarios/perfis: `profiles`, `src/core/profiles`, `src/modules/profile`
- Posts/feed: `posts` como candidato a SSOT principal, com consolidacao
  pendente contra `community_posts`

## Relacionamento Oficial

O modelo oficial e:

```text
Territorio canonico
  -> Comunidade Local
      -> vinculos de entidades independentes
      -> membresia e interacao comunitaria
      -> rankings, destaques e descoberta local
```

Regras:

- entidades independentes nao devem nascer duplicadas dentro de comunidades;
- comunidade guarda contexto, vinculo, status, destaque e moderacao;
- dados mestres permanecem no dominio dono da entidade;
- filtros territoriais usam ids canonicos, nao nomes livres de cidade/bairro;
- URLs publicas usam os servicos canonicos de routing/public identity.

## Fronteiras De Dominio

### `src/core/community-experience`

Dono da identidade da Comunidade Local.

Pode:

- ler `territory_communities`;
- ler alias publico quando a fachada for consolidada;
- compor dados territoriais canonicos para experiencia publica.

Nao deve:

- virar feed social;
- concentrar empresas, eventos, classificados, gastronomia ou servicos;
- duplicar regras de outros dominios.

### `src/modules/community-*`

Bounded contexts de produto para experiencias comunitarias.

Podem:

- renderizar telas e fluxos de feed, alertas, grupos, problemas, eventos,
  achados/perdidos e recomendacoes;
- consumir services canonicos de `src/core`.

Nao devem:

- acessar Supabase diretamente fora de service/repository aprovado;
- redefinir entidade Comunidade Local;
- recriar URL, territorio ou membership por conta propria.

### `src/app`

Composicao, roteamento e shells.

Pode:

- montar paginas;
- aplicar guards de lancamento;
- combinar modulos.

Nao deve:

- ser SSOT de dominio;
- conter regra de negocio persistente;
- consultar tabela canonica diretamente para substituir service de dominio.

## Verticais Oficiais

O SSOT de verticais empresariais e `src/core/verticals/config.ts`.

Estado oficial atual:

- `gastronomy`
- `education`

`business` e dominio horizontal base, nao vertical.

## Regras Para Novos Modulos

Um novo modulo so pode ser criado quando tiver:

- entidade ou capacidade claramente nomeada;
- tabela/SSOT claro quando houver persistencia;
- service canonico em `src/core` quando compartilhar regra;
- rota canonica quando for publico;
- ownership de admin quando houver moderacao/operacao;
- risco e validacao definidos quando tocar seguranca, dados pessoais, RLS,
  storage, pagamentos ou autorizacao.

## Guards Obrigatorios

Mudancas nessa arquitetura devem passar por:

- `npm run validate:taxonomy`
- `npm run validate:architecture:governance`
- `npm run validate:ssot`
- `npm run validate:docs-structure`
- `npm run validate:docs-live-links`

## Fonte De Continuidade

Plano executavel:

- `plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`

Este documento registra a decisao e os invariantes. O plano registra fases,
checklists, riscos e definicao de pronto.
