# Achegue-se — documentação canônica

> **Porta de entrada única.** Este índice organiza a documentação viva. Se um documento não estiver classificado aqui como autoridade vigente, ele não substitui os contratos executáveis nem o SSOT atual.

## Estado do produto

Achegue-se é uma plataforma hiperlocal, territory-first e modular. A unidade territorial segue país → estado → cidade → bairro.

No corte atual do MVP:

- **domínio de produto ativo:** Business / Empresas;
- **capabilities horizontais ativas:** Mapa, Perto de mim, Busca, Mensagens com provider Business, Notificações, Auth, Perfis/Conta, Território, Localização e Central;
- Community, Gastronomia, Serviços/Profissionais, Classificados, Pontos Turísticos, Educação, Vagas, Eventos, Comunicação territorial, Mobilidade, Cupons, Gamificação, Analytics público, Safety familiar, Billing e demais domínios permanecem `paused`.

A ativação real é executável e pertence a:

- `src/app/config/productModuleRegistry.ts`;
- `src/app/config/platformCapabilityRegistry.ts`;
- `src/app/config/lifecycleRegistry.ts`.

Documentação não pode reativar domínio pausado nem criar uma autoridade paralela.

## Leitura recomendada para inspeção técnica ou societária

Para entender o projeto sem depender do histórico de conversas, leia nesta ordem:

1. [`../README.md`](../README.md) — visão rápida, stack e estrutura;
2. [`FEATURE-MAP.md`](./FEATURE-MAP.md) — o que está ativo e o que está pausado;
3. [`SCREEN-MAP.md`](./SCREEN-MAP.md) — superfícies e rotas públicas/privadas;
4. [`03-architecture/CURRENT_RULES.md`](./03-architecture/CURRENT_RULES.md) — regras arquiteturais vigentes;
5. [`03-architecture/PRODUCT_MODULE_LIFECYCLE.md`](./03-architecture/PRODUCT_MODULE_LIFECYCLE.md) — lifecycle de produto e plataforma;
6. [`09-reference/governance/AUTHORITIES.md`](./09-reference/governance/AUTHORITIES.md) — mapa de autoridades;
7. [`../SECURITY.md`](../SECURITY.md) e [`09-reference/SECURITY.md`](./09-reference/SECURITY.md) — postura de segurança;
8. [`08-roadmap/EXECUCAO_MAIN_ONLY.md`](./08-roadmap/EXECUCAO_MAIN_ONLY.md) — estado operacional e Definition of Done do MVP.

Histórico, auditorias encerradas e planos supersedidos ficam em `10-archive/` ou no histórico Git e não devem ser confundidos com backlog vivo.

## Precedência

Quando houver conflito, vale esta ordem:

1. contrato executável/versionado (`src/`, migrations, manifests e validators);
2. documento SSOT vivo listado neste índice;
3. plano operacional vigente em `08-roadmap`;
4. referência técnica;
5. histórico em `10-archive` e Git.

## Estrutura documental

```text
docs/
├── README.md            índice canônico
├── FEATURE-MAP.md       escopo funcional atual
├── SCREEN-MAP.md        rotas e superfícies atuais
├── DECISIONS.md         decisões vigentes
├── 02-domain/           território, taxonomia e geografia
├── 03-architecture/     arquitetura viva e lifecycle
├── 04-design/           design system e tokens
├── 05-ux/               UX do produto ativo e auditorias vigentes
├── 06-navigation/       navegação executável e mapa de owners
├── 07-modules/          contratos por domínio
├── 08-roadmap/          somente execução/plano ainda vigente
├── 09-reference/        segurança, migrations e governance
├── architecture/        registries/manifests técnicos consumidos por tooling
├── audits/              baselines/allowlists consumidos por validadores
└── 10-archive/          histórico não normativo
```

As pastas `docs/architecture/` e `docs/audits/` existem porque contêm artefatos técnicos lidos por tooling/testes. Elas não formam um segundo índice documental.

## SSOT vivos

### Produto e release

- [`FEATURE-MAP.md`](./FEATURE-MAP.md)
- [`SCREEN-MAP.md`](./SCREEN-MAP.md)
- [`DECISIONS.md`](./DECISIONS.md)
- [`08-roadmap/EXECUCAO_MAIN_ONLY.md`](./08-roadmap/EXECUCAO_MAIN_ONLY.md) — **SSOT operacional atual**
- [`08-roadmap/NEXT-STEPS.md`](./08-roadmap/NEXT-STEPS.md) — resumo curto, sem substituir o plano operacional

### Domínio

- [`02-domain/TERRITORY-DOMAIN.md`](./02-domain/TERRITORY-DOMAIN.md)
- [`02-domain/DOMAIN-MAPPING.md`](./02-domain/DOMAIN-MAPPING.md)
- [`02-domain/TAXONOMY_SSOT.md`](./02-domain/TAXONOMY_SSOT.md)
- [`02-domain/GEOGRAPHIC_FOUNDATION.md`](./02-domain/GEOGRAPHIC_FOUNDATION.md)
- taxonomia vertical executável: [`../src/core/verticals/config.ts`](../src/core/verticals/config.ts)

### Arquitetura

- [`03-architecture/CURRENT_RULES.md`](./03-architecture/CURRENT_RULES.md)
- [`03-architecture/ARCHITECTURE.md`](./03-architecture/ARCHITECTURE.md)
- [`03-architecture/CORE_LAYER_SSOT.md`](./03-architecture/CORE_LAYER_SSOT.md)
- [`03-architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md`](./03-architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md)
- [`03-architecture/PRODUCT_MODULE_LIFECYCLE.md`](./03-architecture/PRODUCT_MODULE_LIFECYCLE.md)
- [`architecture/SSOT_REGISTRY.md`](./architecture/SSOT_REGISTRY.md) — registry técnico de owners

[`03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`](./03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md) preserva a arquitetura de Community para evolução futura, mas **não** autoriza sua ativação no MVP.

### Segurança e governance

- [`../SECURITY.md`](../SECURITY.md)
- [`09-reference/SECURITY.md`](./09-reference/SECURITY.md)
- [`09-reference/governance/security/SECURITY_AUTHORITY.md`](./09-reference/governance/security/SECURITY_AUTHORITY.md)
- [`09-reference/governance/AUTHORITIES.md`](./09-reference/governance/AUTHORITIES.md)
- [`09-reference/MIGRATIONS.md`](./09-reference/MIGRATIONS.md)
- [`09-reference/migrations-pending/README.md`](./09-reference/migrations-pending/README.md)
- [`09-reference/EDGE_FUNCTION_SECRETS.md`](./09-reference/EDGE_FUNCTION_SECRETS.md)
- [`09-reference/SUPABASE_SECRETS.md`](./09-reference/SUPABASE_SECRETS.md)
- [`09-reference/AUTH_EMAIL_PRODUCTION.md`](./09-reference/AUTH_EMAIL_PRODUCTION.md)

### Design e UX ativa

- [`04-design/DESIGN-TOKENS.md`](./04-design/DESIGN-TOKENS.md)
- [`04-design/UI-CONCEPT.md`](./04-design/UI-CONCEPT.md)
- [`05-ux/HOME-SPEC.md`](./05-ux/HOME-SPEC.md) — contrato canônico da Home do MVP
- [`05-ux/HOME-INVENTORY.md`](./05-ux/HOME-INVENTORY.md) — conteúdo permitido/proibido derivado do lifecycle
- [`05-ux/AUTH-CONCEPT-PARITY-AUDIT.md`](./05-ux/AUTH-CONCEPT-PARITY-AUDIT.md) — auditoria viva da família Conta e acesso

Sprints antigas de Home, Journey, Feed/Post e planos de UX que não representam o corte atual foram retirados da árvore viva. A proveniência dessas remoções está registrada em `10-archive/post-mvp/` e o conteúdo detalhado permanece no histórico Git.

### Navegação

- [`06-navigation/NAVIGATION-SYSTEM.md`](./06-navigation/NAVIGATION-SYSTEM.md) — contrato vigente de apresentação e lifecycle
- [`06-navigation/NAVIGATION-MAPPING.md`](./06-navigation/NAVIGATION-MAPPING.md) — mapa de páginas, owners e migrações canônicas

Visões de arquitetura da informação declaradas como pós-MVP ou não executáveis ficam no arquivo histórico e não competem com a navegação ativa.

### Módulos

- bounded contexts: [`../src/modules/README.md`](../src/modules/README.md)
- contratos por domínio: [`07-modules/`](./07-modules/)
- verticais empresariais declaradas somente em [`../src/core/verticals/config.ts`](../src/core/verticals/config.ts)

## Arquivo histórico

Tudo em [`10-archive/`](./10-archive/) é histórico, checkpoint ou material supersedido. O conteúdo pode explicar decisões passadas, mas não representa automaticamente o produto atual.

Documentos concluídos não permanecem em `08-roadmap/` como se fossem trabalho pendente. Handoffs encerrados e roadmaps substituídos devem ser arquivados ou removidos da árvore viva.

## Regras documentais

1. Não criar documento novo sem verificar se já existe owner equivalente.
2. Uma única fonte de verdade por assunto.
3. A raiz do repositório mantém apenas documentos de entrada/governança transversal.
4. Toda funcionalidade de usuário pertence ao `FEATURE-MAP.md`.
5. Toda rota/superfície pertence ao `SCREEN-MAP.md`.
6. Decisão viva pertence a `DECISIONS.md` ou ao SSOT técnico responsável.
7. Plano concluído ou supersedido sai da árvore viva.
8. Histórico relevante vai para `10-archive/` ou permanece no Git, mas nunca compete com documentação ativa.
9. Mudança de taxonomia/lifecycle atualiza contrato executável e passa pelos validators correspondentes.
10. Documentação deve permitir que um novo desenvolvedor, auditor ou sócio entenda o estado atual sem reconstruir contexto de chats antigos.
