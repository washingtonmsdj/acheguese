# Achegue-se — Documentação (SSOT)

> **Porta de entrada única.** Este índice define quais documentos são autoridades vivas. Conteúdo fora daqui pode ser referência histórica, mas não substitui o SSOT atual.

## Visão do produto

Achegue-se é uma plataforma **hiperlocal, community-first**, cuja unidade fundamental é o **Território** (país → estado → cidade → bairro). Navegação, comunidade, comércio local e serviços são resolvidos a partir do território ativo.

Domínios de produto: **Comunidade** (feed, posts, alertas, achados/perdidos, grupos, eventos, recomendações), **Empresas** (base horizontal + verticais oficiais), **Classificados**, **Profissionais/Serviços**, **Mobilidade** e **Educação**.

## Autoridade e precedência

Quando houver conflito, aplicar esta ordem:

1. contrato executável/versionado (`src/`, migrations, manifests e validators);
2. documento SSOT vivo listado neste índice;
3. plano operacional atual em `08-roadmap`;
4. referência técnica;
5. histórico em `10-archive`.

Nenhum snapshot antigo pode sobrescrever um contrato executável atual.

## Estrutura documental

```text
docs/
├── README.md            ← índice canônico
├── FEATURE-MAP.md       ← funcionalidades e acesso do usuário
├── SCREEN-MAP.md        ← telas/rotas e propósito
├── DECISIONS.md         ← decisões válidas hoje
├── 01-product/          produto e saúde
├── 02-domain/           território, taxonomia e geografia
├── 03-architecture/     regras e owners arquiteturais
├── 04-design/           design system
├── 05-ux/               UX e conteúdo
├── 06-navigation/       navegação e IA
├── 07-modules/          contratos por domínio
├── 08-roadmap/          execução e próximos passos
├── 09-reference/        segurança, migrations e governance
└── 10-archive/          histórico — não normativo
```

Alguns caminhos antigos ainda existem fora das pastas numeradas por compatibilidade. Eles só são considerados ativos quando aparecem explicitamente neste índice; a consolidação física restante é backlog estrutural e não cria uma segunda autoridade.

## Documentos SSOT vivos

### Produto

- [Project milestone / status oficial](./architecture/PROJECT-MILESTONE-1.md)
- [Project score / saúde](./01-product/PROJECT-SCORE.md)
- [Feature map](./FEATURE-MAP.md)
- [Screen map](./SCREEN-MAP.md)

`01-product/STATUS.md` está marcado como **SUBSTITUÍDO** e permanece apenas por histórico/compatibilidade; não é autoridade de status.

### Domínio

- [Territory domain](./02-domain/TERRITORY-DOMAIN.md)
- [Domain mapping](./02-domain/DOMAIN-MAPPING.md)
- [Taxonomia SSOT](./02-domain/TAXONOMY_SSOT.md)
- [Geographic foundation](./02-domain/GEOGRAPHIC_FOUNDATION.md)
- Taxonomia vertical executável: [`../src/core/verticals/config.ts`](../src/core/verticals/config.ts)

### Arquitetura

- [Regras vigentes](./03-architecture/CURRENT_RULES.md)
- [Arquitetura global](./03-architecture/ARCHITECTURE.md)
- [Community-first architecture SSOT](./03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md)
- [Core Platform architecture SSOT](./03-architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md)
- [Canonical map / ownership](./03-architecture/CANONICAL_MAP.md)

### Segurança e governance

- [Política raiz](../SECURITY.md)
- [Diretrizes de desenvolvimento seguro](./09-reference/SECURITY.md)
- [Security Authority](./09-reference/governance/security/SECURITY_AUTHORITY.md)
- [Authorities](./09-reference/governance/AUTHORITIES.md)
- [Migrations](./09-reference/MIGRATIONS.md)
- [Migrations pendentes](./09-reference/migrations-pending/README.md)
- [Edge Function secrets](./09-reference/EDGE_FUNCTION_SECRETS.md)
- [Supabase secrets](./09-reference/SUPABASE_SECRETS.md)

### Design e UX

- [Design tokens](./04-design/DESIGN-TOKENS.md)
- [UI concept](./04-design/UI-CONCEPT.md)
- [Home review](./05-ux/HOME-REVIEW.md) · [Home content](./05-ux/HOME-CONTENT.md)
- [Feed review](./05-ux/FEED-REVIEW.md) · [Feed content](./05-ux/FEED-CONTENT.md)
- [Post review](./05-ux/POST-REVIEW.md) · [Post content](./05-ux/POST-CONTENT.md)
- [Jornadas](./05-ux/USER-JOURNEY-REVIEW.md) · [Friction map](./05-ux/FRICTION-MAP.md)

### Navegação

- [Navigation mapping](./06-navigation/NAVIGATION-MAPPING.md)
- [Navigation system](./06-navigation/NAVIGATION-SYSTEM.md)
- [Information architecture](./06-navigation/INFORMATION-ARCHITECTURE.md)

### Módulos

- Bounded contexts de código: [`../src/modules/README.md`](../src/modules/README.md)
- Contratos transversais e de módulo em [`07-modules/`](./07-modules/)
- [Posts/Feed SSOT atual](./07-modules/POSTS_FEED_SSOT.md) — `core/posts` é o owner; `core/community-feed` compõe a experiência territorial.
- Verticais empresariais oficiais são declaradas **somente** em [`src/core/verticals/config.ts`](../src/core/verticals/config.ts). No estado atual: `gastronomy` e `education`.

### Roadmap / execução

- [Execução main-only e prontidão MVP](./08-roadmap/EXECUCAO_MAIN_ONLY.md) — **SSOT operacional atual**
- [Próximos passos](./08-roadmap/NEXT-STEPS.md) — resumo de navegação; não substitui o plano de execução
- [Recovery roadmap](./08-roadmap/RECOVERY-ROADMAP.md)
- [Migração mobile](./08-roadmap/MONOREPO_MIGRATION_PLAN.md)

## Arquivo histórico

Tudo em [`10-archive/`](./10-archive/) foi consolidado, superado ou é snapshot. Se conflitar com uma fonte viva acima, **a fonte viva vence**.

## Regras documentais

1. Não criar documento novo sem verificar se já existe owner equivalente.
2. Uma única fonte de verdade por assunto; este índice registra a autoridade.
3. A raiz do repositório mantém apenas `README.md` e `SECURITY.md`.
4. Toda funcionalidade de usuário deve estar no `FEATURE-MAP.md`.
5. Toda rota deve estar no `SCREEN-MAP.md`.
6. Toda decisão viva deve estar em `DECISIONS.md` ou no SSOT técnico explicitamente responsável.
7. Documentos substituídos devem sair dos links canônicos e, quando possível, ser movidos para `10-archive` após prova de que não há dependência viva.
8. Alteração de taxonomia deve atualizar o contrato executável e passar pelos validators/testes de SSOT.