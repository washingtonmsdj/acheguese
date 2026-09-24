# Arquitetura do Projeto

## Objetivo
Garantir separacao clara de responsabilidades com SSOT por dominio, fluxo previsivel de dados e baixo acoplamento entre modulos.

## Estrutura
```text
src/
├── app/            # Shell da aplicacao (layout, rotas, bootstrap)
├── shared/         # Primitivos reutilizaveis (UI, hooks, utils)
├── core/           # Capacidades transversais e contratos canonicos
├── modules/        # Dominios de produto (feature-first)
└── integrations/   # Adaptadores externos (Supabase, mapas, etc.)
```

## Regra de Fluxo
Para dados de negocio, o fluxo oficial deve ser:

```text
Database -> Service -> Hook -> Component
```

- `Service`: dono de regra de negocio e acesso a dados.
- `Hook`: estado, orquestracao de chamadas e cache de UI.
- `Component/Page`: apenas apresentacao e interacao.

## SSOT por Dominio
- Cada dominio deve ter um owner canonico para tabelas e regras.
- Adaptadores/facades sao permitidos apenas para compatibilidade de import.
- Nao manter implementacoes paralelas para o mesmo contrato.

## Core Platform
- `Core Platform` e a camada de capacidades compartilhadas; nao e o core
  domain do produto e nao absorve entidades de Business, Classifieds, Events,
  Gastronomy ou Mobility.
- Um contrato pode ser compartilhado sem que tabelas com lifecycle e RLS
  diferentes sejam fundidas.
- Cada tabela mutavel possui um unico owner de escrita. Read models paralelos
  precisam ser declarados e read-only.
- Autorizacao no frontend e apenas hint de interface. RLS, RPC e Edge Function
  sao a autoridade de seguranca.
- Ownership atual, duplicacoes e alvo de migracao estao em
  [architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md](./architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md).

## Produto territory-first e lifecycle modular
- Territorio e o contexto geografico raiz.
- Dominios de produto vivem em `productModuleRegistry.ts`; no MVP, somente
  `business` esta ativo.
- Capabilities horizontais vivem em `platformCapabilityRegistry.ts`; no MVP,
  Map, Nearby, Search, Messaging, Auth, Profiles/Account, Territory, Location,
  Notifications e Central estao ativos.
- `lifecycleRegistry.ts` resolve dependencias cruzadas sem transformar
  capability horizontal em dominio.
- Nearby depende de Map + Location + Business.
- Messaging depende de Auth + Profiles. O lifecycle da capability não depende
  de Business; o registry de providers registra apenas Business no MVP.
- Community e demais dominios pos-MVP continuam `paused` e fail-closed.
- Regras completas: [PRODUCT_MODULE_LIFECYCLE.md](./PRODUCT_MODULE_LIFECYCLE.md).

## Fronteiras
- `core/*`: contratos, capacidades compartilhadas e servicos canonicos.
- `modules/*`: composicao de telas e casos de uso do dominio, consumindo servicos canonicos.
- `integrations/*`: detalhes de infraestrutura, nunca regra de negocio de dominio.

## Taxonomia oficial
- `business`/`empresas` e o dominio base horizontal para entidades empresariais.
- `business` nao e vertical.
- Verticais empresariais oficiais sao somente as chaves declaradas no contrato `src/core/verticals/config.ts`.
- Estado atual do contrato executavel: `gastronomy` e `education` sao verticais oficialmente formalizadas; ambas permanecem pausadas no MVP.
- Modulo existente em `src/modules/*` nao equivale automaticamente a vertical oficial.

## Documentacao Relacionada
- [CURRENT_RULES.md](./CURRENT_RULES.md)
- [DATA_MODELING.md](./DATA_MODELING.md)
- [architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md](./architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md)
- [COMMUNITY_FIRST_ARCHITECTURE_SSOT.md](./COMMUNITY_FIRST_ARCHITECTURE_SSOT.md) — contrato interno pos-MVP
- [COMUNICACAO_TERRITORIAL_ARCHITECTURE.md](./COMUNICACAO_TERRITORIAL_ARCHITECTURE.md)
- [MIGRATIONS.md](./MIGRATIONS.md)
