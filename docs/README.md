# Achegue-se — Documentação (SSOT)

> **Porta de entrada única.** Se um assunto não aparece aqui, ele não é canônico.
> `DOCUMENTATION-INDEX.md` é o registro de classificação/inventário; este README é a navegação operacional para documentação viva.
> Documentos ausentes desta navegação, fora das pastas canônicas ou classificados como histórico/substituído/arquivado não orientam implementação nova.

---

## Visão do produto

Achegue-se é uma plataforma **hiperlocal, community-first**, cuja unidade fundamental é o **Território** (país → estado → cidade → bairro). Toda navegação, feed, comunicação, comércio local e serviços orbitam em torno do território ativo do usuário. O bairro é a home; a cidade é o contexto amplo; o país é apenas ponto de entrada.

Domínios de produto: **Comunidade** (feed, posts, alertas, achados/perdidos, grupos, eventos, recomendações), **Empresas** (gastronomia, promoções, catálogo), **Classificados**, **Profissionais/Serviços**, **Mobilidade** (passageiro, motorista, motoboy), **Educação**.

---

## Estrutura da documentação

```text
docs/
├── README.md            ← porta de entrada operacional
├── DOCUMENTATION-INDEX.md ← inventário/classificação documental
├── FEATURE-MAP.md       ← funcionalidades, status e caminhos
├── SCREEN-MAP.md        ← telas/rotas, objetivo e sucessora
├── DECISIONS.md         ← decisões válidas hoje
│
├── 01-product/          produto: status e saúde
├── 02-domain/           domínio: território, taxonomia, geografia, dados
├── 03-architecture/     arquitetura e regras vigentes
├── 04-design/           design system e conceito visual
├── 05-ux/               UX e conteúdo editorial
├── 06-navigation/       rotas e arquitetura da informação
├── 07-modules/          contratos SSOT por módulo/domínio
├── 08-roadmap/          plano de implementação e próximos passos
├── 09-reference/        referência técnica, segurança e governance
└── 10-archive/          legado versionado pendente de remoção da árvore ativa
```

`10-archive/` não é fonte de decisão. O programa estrutural #51 está removendo gradualmente esse histórico da árvore ativa; o histórico completo permanece recuperável pelo Git.

---

## Documentos SSOT (fonte de verdade)

### Produto
- [Status atual](./01-product/STATUS.md)
- [Project score / saúde](./01-product/PROJECT-SCORE.md)
- [Feature map](./FEATURE-MAP.md)
- [Screen map](./SCREEN-MAP.md)

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

A estrutura de código por ownership também é documentada junto ao código em [`src/modules/README.md`](../src/modules/README.md). Esse arquivo é a autoridade para a topologia `app/modules/core/integrations/shared`.

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

### Roadmap e execução
- [Auditoria e plano de implementação](./08-roadmap/AUDITORIA_E_PLANO_IMPLEMENTACAO.md) — backlog transversal de auditoria, segurança, release e implementação
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

## Classificação e histórico

- [`DOCUMENTATION-INDEX.md`](./DOCUMENTATION-INDEX.md) registra a classificação dos documentos inventariados.
- [`PROJECT-DOCUMENTATION-AUDIT.md`](./PROJECT-DOCUMENTATION-AUDIT.md) é evidência da auditoria documental de 2026-07-28, não um segundo SSOT de arquitetura.
- [`PROJECT-DOCUMENTATION-HARDENING.md`](./PROJECT-DOCUMENTATION-HARDENING.md) registra a sprint que marcou conflitos documentais, também sem autoridade sobre código/runtime.
- Conteúdo classificado como `HISTORICO`, `SUBSTITUIDO` ou `ARQUIVADO` serve apenas como evidência; não reabre decisões vigentes.

---

## Regras da documentação

1. **Não criar documento novo** sem verificar se já existe equivalente. Consolidar antes de criar.
2. **Uma única fonte de verdade por assunto** — este README navega as fontes vivas; `DOCUMENTATION-INDEX.md` classifica o inventário.
3. **Raiz do repositório** contém somente `README.md` e `SECURITY.md`. Documentação do projeto fica em `docs/`; documentação técnica específica pode ficar junto ao owner de código.
4. **Toda funcionalidade** precisa aparecer no [`FEATURE-MAP.md`](./FEATURE-MAP.md) com um caminho de navegação.
5. **Toda rota** precisa aparecer no [`SCREEN-MAP.md`](./SCREEN-MAP.md) com propósito claro.
6. **Toda decisão viva** entra em [`DECISIONS.md`](./DECISIONS.md). Decisões superadas não são copiadas.
7. **Histórico não precisa permanecer na árvore ativa.** Git preserva versões anteriores; snapshots, handoffs e relatórios encerrados devem ser removidos quando não houver dependência viva.
8. **Artefatos de ferramenta não são documentação canônica.** `.kiro/`, `.lovable/`, screenshots e outputs de QA têm lifecycle próprio e não definem arquitetura.
