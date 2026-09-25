# TAXONOMY SSOT

**Atualizado:** 2026-09-25  
**Status:** canônico para organização física e classificação arquitetural.

Este documento define como classificar código e documentação. Ele **não ativa**
funcionalidades. O lifecycle executável pertence a:

- `src/app/config/productModuleRegistry.ts` — domínios de produto;
- `src/app/config/platformCapabilityRegistry.ts` — capabilities horizontais;
- `src/app/config/lifecycleRegistry.ts` — resolução de dependências.

## 1. Unidades arquiteturais

### 1.1 Domínio de produto

Responsabilidade de negócio com lifecycle próprio.

No primeiro release, somente `business` está `active`. Os demais domínios
de produto declarados em `PRODUCT_MODULE_REGISTRY` permanecem `paused`.

Código de domínio pausado pode continuar versionado, mas não pode participar do
runtime ativo por rota, navegação, prefetch, query, provider, layer ou CTA.

### 1.2 Capability horizontal

Capacidade de plataforma que pode servir mais de um domínio de produto.

Capabilities ativas no MVP:

- `auth`;
- `profiles`;
- `account`;
- `territory`;
- `location`;
- `notifications`;
- `central`;
- `map`;
- `nearby`;
- `search`;
- `messaging`.

Map, Nearby, Search, Messaging e Notifications **não são verticais de
Business**. Elas mantêm owners horizontais e recebem providers/adapters de
domínios habilitados.

### 1.3 Provider / adapter

Integra um domínio de produto a uma capability horizontal.

Exemplos do MVP:

- Business -> Map;
- Business -> Nearby;
- Business -> Search;
- Business -> Messaging.

Provider não transfere ownership. Pausar um domínio remove seus providers sem
pausar automaticamente a capability.

### 1.4 Vertical de Business

Vertical é uma especialização de Business declarada em
`src/core/verticals/config.ts`.

Verticais oficiais atualmente declaradas:

- `gastronomy`;
- `education`.

A declaração de uma vertical **não significa ativação pública**. Gastronomy e
Education permanecem `paused` no `PRODUCT_MODULE_REGISTRY`.

## 2. Camadas físicas do source

A árvore canônica de `src/` é:

- `app`;
- `assets`;
- `core`;
- `integrations`;
- `modules`;
- `shared`;
- `styles`.

Arquivos de bootstrap podem existir diretamente em `src/`.

### 2.1 `src/app`

Shell, composição, roteamento, páginas de entrada e lifecycle.

Regras:

- lifecycle e composição entre domínio/capability pertencem aqui;
- provider scopes ficam em `src/app/config`;
- `src/app` pode compor owners, mas não deve duplicar regra de domínio;
- o root aposentado `src/features` não deve voltar.

### 2.2 `src/modules`

Superfícies de produto, páginas, componentes e hooks de bounded contexts.

A existência física de um diretório **não define estado de lifecycle**.
Packages pós-MVP podem permanecer aqui com owner claro mesmo quando pausados.

Não inferir ativação pela lista de pastas.

### 2.3 `src/core`

Contratos canônicos, services, repositories, read models e capabilities
reutilizadas entre superfícies.

Regras:

- Core não importa implementação interna de `src/modules`;
- persistência reutilizável deve ter owner real em Core;
- Core não decide lifecycle de produto;
- contrato reutilizado por múltiplos módulos sobe para um owner canônico, não
  para facade duplicada.

### 2.4 `src/shared`

Primitivas agnósticas de domínio: UI base, utilities, config transversal e
tipos realmente compartilhados.

### 2.5 `src/integrations`

Adaptadores de provedores externos, como Supabase e mapas.

UI/module não cria segunda autoridade de integração quando já existe adapter
canônico.

### 2.6 `src/assets` e `src/styles`

Assets estáticos e estilos globais/canônicos. Não contêm regra de domínio nem
lifecycle.

## 3. Fronteiras obrigatórias

1. Domínio de produto, capability horizontal e provider são categorias
   diferentes.
2. Pausar domínio não pausa capability horizontal.
3. Provider de domínio `paused` não consulta, renderiza, prefetcha nem navega.
4. `src/core` não importa nem reexporta implementação de `src/modules`.
5. `src/modules` não acessa integração/persistência diretamente quando existe
   owner canônico em Core.
6. Lifecycle não é decidido em `core`, `modules` ou componente visual.
7. URL sem owner ativo cai no 404 canônico; redirect/fallback não substitui
   lifecycle.
8. Facade, barrel ou bridge sem caller deve ser removido quando o censo provar
   ausência de dependência viva.
9. Migrations históricas necessárias ao ledger permanecem imutáveis.
10. Código pós-MVP preservado deve permanecer fora do grafo runtime ativo.

## 4. Territory e Community

Territory é capability/fundação horizontal ativa e continua ancorado nos owners
canônicos de Location/Territorial.

Community é domínio de produto `paused` no MVP.

O contrato pós-MVP preservado de Community está em
`docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`. O plano
incremental antigo está arquivado em
`docs/10-archive/plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`.

Esses documentos preservam invariantes internos e histórico; não têm autoridade
para reativar Community.

## 5. Documentação

Prosa canônica viva usa a taxonomia numerada:

- `docs/02-domain/`;
- `docs/03-architecture/`;
- `docs/04-design/`;
- `docs/05-ux/`;
- `docs/06-navigation/`;
- `docs/07-modules/`;
- `docs/08-roadmap/`;
- `docs/09-reference/`.

Exceções técnicas intencionais:

- `docs/architecture/` — registry/manifests executáveis consumidos por tooling;
- `docs/audits/` — baselines/allowlists executáveis consumidos por validators.

Histórico, snapshots, planos encerrados e auditorias substituídas ficam em
`docs/10-archive/` e não são normativos.

Roots paralelos aposentados, como `docs/feed`, `docs/domain` e
`docs/concepts`, não devem ser recriados.

## 6. Estado físico de `src/modules`

A árvore pode conter packages ativos, horizontais/internos e pós-MVP. O estado
runtime não é derivado daqui.

Diretórios físicos observados e permitidos atualmente incluem:

- `admin`;
- `ai`;
- `business`;
- `central`;
- `classifieds`;
- `communication-territorial`;
- `community-events`;
- `community-feed`;
- `community-groups`;
- `community-issues`;
- `community-lost-found`;
- `community-recommendations`;
- `guide`;
- `messaging`;
- `mobility`;
- `professionals`;
- `profile`;
- `work-opportunities`.

Essa lista descreve organização física, **não** produtos ativos.

## 7. Guardrails

Executar:

- `npm run validate:taxonomy`;
- `npm run validate:architecture:governance`;
- `npm run validate:ssot`;
- `npm run validate:docs-structure`.

Ratchets relevantes também vivem em `tests/architecture/`.

## 8. Regra para futuras mudanças

Antes de criar, mover, ativar ou pausar qualquer unidade, classificar
explicitamente:

1. domínio de produto;
2. capability horizontal;
3. provider/adapter;
4. vertical de Business;
5. owner Core;
6. superfície de módulo;
7. integração;
8. histórico/documentação.

Se a classificação não estiver clara, não criar novo owner paralelo.

A autoridade de ativação continua sendo exclusivamente os registries de
lifecycle em `src/app/config`.
