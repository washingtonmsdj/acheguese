# Módulos de produto — SSOT

`src/modules` contém contextos delimitados de produto e sua apresentação. A presença física de uma pasta não implica que o domínio esteja ativo.

Um módulo `paused` permanece versionado para manutenção e futura certificação. A ativação ocorre exclusivamente nos registries de `src/app/config`, nunca pela presença da pasta.

## Módulos canônicos de primeiro nível

- `admin`
- `ai`
- `billing`
- `business`
- `central`
- `classifieds`
- `communication-territorial`
- `community-events`
- `community-feed`
- `community-groups`
- `community-issues`
- `community-lost-found`
- `community-recommendations`
- `gamification`
- `guide`
- `mobility`
- `messaging`
- `professionals`
- `profile`
- `work-opportunities`

## Regras de taxonomia

- `business` é o domínio-base de entidades empresariais.
- `business` **não** é vertical nem capability horizontal da plataforma.
- Verticais empresariais oficiais são declaradas exclusivamente em `src/core/verticals/config.ts`.
- Estado oficial das verticais: `gastronomy` e `education`.
- `billing` e `gamification` são módulos canônicos, mesmo quando permanecem `paused`.
- Community permanece `paused` no MVP; o seu conceito de produto é **Comunidade Local**.
- A identidade da Comunidade Local pertence a `src/core/community-experience`, não a um módulo agregado paralelo.

## Organização dos subdomínios

- Subdomínios empresariais permanecem sob `business`: `business/company`, `business/gastronomy`, `business/education`, `business/promotions`.
- Experiências Community usam módulos explícitos: `community-feed`, `community-issues`, `community-groups`, `community-events`, `community-lost-found`, `community-recommendations`.
- Alertas Community pertencem a `src/core/community/alerts`, sem facade de módulo de compatibilidade.
- Subdomínios de mobilidade permanecem sob `mobility`: `mobility/delivery`.
- Oportunidades rápidas permanecem em `work-opportunities`.
- Vagas classificadas permanecem em `classifieds/jobs`.
- A capacidade de Serviços permanece em `professionals/services`.
- A UI de caixa de entrada utiliza `messaging` e consome contratos de `src/core/messaging`. Business, Classifieds, Community e futuros módulos podem fornecer adapters próprios sem recriar a caixa de entrada global.

## Fora de `src/modules`

Fluxos e páginas de entrada de aplicação pertencem a `src/app` (onboarding, dashboard e landings). Não recriar uma taxonomia paralela em `src/features`.

## Regras de fronteira

- Módulos podem consumir `shared`, `core` e `integrations` respeitando fronteiras aprovadas.
- É proibido importar implementação interna de outro módulo.
- Contratos compartilhados e serviços canônicos pertencem a `core`.
- `src/core` não importa nem reexporta `src/modules`. Caso UI/hook precise servir a mais de um contexto, promover o contrato reutilizável ao owner apropriado e migrar todos os consumidores antes da remoção.
- `index.ts` expõe somente API pública real; facades vazias (`export {};`) são proibidas.
- Não existe allowlist `src/core -> src/modules`. UI/hooks de Mobilidade compartilhados com a Central pertencem a `src/core/mobility`.
