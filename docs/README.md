# Achegue-se — Documentação (SSOT)

> **Porta de entrada única.** Se um assunto não aparece aqui, ele não é canônico.
> Documentos ausentes deste índice ou fora das pastas numeradas devem ser tratados como legado.

---

## Visão do produto

Achegue-se é uma plataforma **hiperlocal, community-first**, cuja unidade fundamental é o **Território** (país → estado → cidade → bairro). Toda navegação, feed, comunicação, comércio local e serviços orbitam em torno do território ativo do usuário. O bairro é a home; a cidade é o contexto amplo; o país é apenas ponto de entrada.

Domínios de produto: **Comunidade** (feed, posts, alertas, achados/perdidos, grupos, eventos, recomendações), **Empresas** (gastronomia, promoções, catálogo), **Classificados**, **Profissionais/Serviços**, **Mobilidade** (passageiro, motorista, motoboy), **Educação**.

---

## Estrutura da documentação

```
docs/
├── README.md            ← você está aqui (SSOT — porta de entrada)
├── FEATURE-MAP.md       ← todas as funcionalidades, status e como o usuário chega
├── SCREEN-MAP.md        ← todas as telas/rotas com objetivo e sucessora
├── DECISIONS.md         ← decisões válidas hoje (não inclui superadas)
│
├── 01-product/          produto: status, saúde, score
├── 02-domain/           domínio: território, taxonomia, geografia, dados
├── 03-architecture/     arquitetura: regras vigentes, community-first, core platform
├── 04-design/           design system: tokens, decisões visuais, conceito de UI
├── 05-ux/               UX: auditorias e conteúdo editorial de Home/Feed/Post
├── 06-navigation/       navegação: mapeamento de rotas e arquitetura da informação
├── 07-modules/          contratos SSOT por módulo/domínio
├── 08-roadmap/          próximos passos, recuperação, pré-launch
├── 09-reference/        referência técnica: segurança, migrations, husky, governance
└── 10-archive/          histórico. NÃO USAR como fonte de decisão.
```

---

## Documentos SSOT (fonte de verdade)

Estes são os documentos vivos. Qualquer outra fonte deve ser ignorada.

### Produto
- [Status atual](./01-product/STATUS.md)
- [Project score / saúde](./01-product/PROJECT-SCORE.md)

### Domínio
- [Territory domain](./02-domain/TERRITORY-DOMAIN.md) — território é a entidade raiz
- [Domain mapping](./02-domain/DOMAIN-MAPPING.md)
- [Taxonomia SSOT](./02-domain/TAXONOMY_SSOT.md)
- [Geographic foundation](./02-domain/GEOGRAPHIC_FOUNDATION.md)

### Arquitetura
- [Regras vigentes (CURRENT_RULES)](./03-architecture/CURRENT_RULES.md)
- [Arquitetura global](./03-architecture/ARCHITECTURE.md)
- [Community-first architecture SSOT](./03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md)
- [Core Platform architecture SSOT](./03-architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md)
- [Canonical map (ownership)](./03-architecture/CANONICAL_MAP.md)

### Design
- [Design tokens](./04-design/DESIGN-TOKENS.md) — SSOT visual
- [UI concept](./04-design/UI-CONCEPT.md)

### UX (Home, Feed, Post são a referência)
- [Home review](./05-ux/HOME-REVIEW.md) · [Home content](./05-ux/HOME-CONTENT.md)
- [Feed review](./05-ux/FEED-REVIEW.md) · [Feed content](./05-ux/FEED-CONTENT.md)
- [Post review](./05-ux/POST-REVIEW.md) · [Post content](./05-ux/POST-CONTENT.md)
- [Jornadas](./05-ux/USER-JOURNEY-REVIEW.md) · [Friction map](./05-ux/FRICTION-MAP.md)

### Navegação
- [Navigation mapping](./06-navigation/NAVIGATION-MAPPING.md)
- [Navigation system](./06-navigation/NAVIGATION-SYSTEM.md)
- [Information architecture](./06-navigation/INFORMATION-ARCHITECTURE.md)

### Módulos (SSOT por bounded context)
Contratos em [`07-modules/`](./07-modules/): Posts/Feed, Social Engagement, Community DM, Classified Messaging, Business Favorites, Search, Reviews, Realtime, Media Asset, Notification Preferences, Entity Private Data, Profile Verification, Audit/Moderation, Gastronomy, Coverage, Mobility Motoboy.

### Roadmap
- [Próximos passos](./08-roadmap/NEXT-STEPS.md)
- [Recovery roadmap](./08-roadmap/RECOVERY-ROADMAP.md)
- [Migração mobile (Capacitor)](./08-roadmap/MONOREPO_MIGRATION_PLAN.md)

### Referência
- [Segurança](./09-reference/SECURITY.md) · [Governance](./09-reference/governance/AUTHORITIES.md)
- [Migrations](./09-reference/MIGRATIONS.md) · [Migrations pendentes](./09-reference/migrations-pending/README.md)
- [Edge Function secrets](./09-reference/EDGE_FUNCTION_SECRETS.md) · [Supabase secrets](./09-reference/SUPABASE_SECRETS.md)
- [Husky hooks](./09-reference/HUSKY_HOOKS.md)
- ADRs: [`09-reference/adr/`](./09-reference/adr/)

---

## Arquivados (NÃO usar como fonte)

Tudo em [`10-archive/`](./10-archive/) foi consolidado, superado ou é snapshot histórico.
Inclui: auditorias antigas, sprints concluídas, iteracões de Education, Profile phases, Mobility guides antigos, docs de comunicação territorial legados, typecheck fixes, root-legacy (`*-MOBILE.md`, `PHASE1-REVIEW`, etc.), architecture-legacy.

**Se um documento em `10-archive/` conflita com um documento acima, o de cima vence.**

---

## Regras da documentação

1. **Não criar documento novo** sem verificar se já existe equivalente. Consolidar antes de criar.
2. **Uma única fonte de verdade por assunto** — este índice é a autoridade.
3. **Raiz do repositório** contém somente `README.md` e `SECURITY.md`. Todo doc vai para `docs/`.
4. **Toda funcionalidade** precisa aparecer no [`FEATURE-MAP.md`](./FEATURE-MAP.md) com um caminho de navegação.
5. **Toda rota** precisa aparecer no [`SCREEN-MAP.md`](./SCREEN-MAP.md) com propósito claro.
6. **Toda decisão viva** entra em [`DECISIONS.md`](./DECISIONS.md). Decisões superadas não são copiadas.
