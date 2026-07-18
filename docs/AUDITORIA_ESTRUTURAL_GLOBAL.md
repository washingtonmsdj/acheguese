# AUDITORIA ESTRUTURAL GLOBAL (SSOT)

Data de referencia: 2026-04-22
Atualizacao Community First: 2026-07-09
Escopo: `src/app`, `src/core`, `src/modules`, `src/shared`, `src/integrations`, `docs`, `scripts`

## 1) Diagnostico das ambiguidades atuais

### 1.1 Achados estruturais
- `src/modules` estava com alias legados, subdominios no topo e fluxos de app fora da camada correta.
- `src/core` concentra capacidades transversais canonicas, mas ainda possui zonas com nomes sobrepostos (ex.: `profile`/`profiles`, `admin`/`admin-identidade`/`admin-motoristas`, `services`/`service-areas`/`professional`/`vagas`), exigindo governanca permanente.
- `docs` tem grande volume historico e auditorias antigas com caminhos legados; sem separacao explicita, isso gera leitura ambigua.
- `scripts` tinha regras de governanca com caminhos desatualizados (pre-migracao de modulos).

### 1.2 Classificacao arquitetural por area
- `src/app`: shell/rotas/fluxos de aplicacao (camada de composicao e pagina/rota).
- `src/core`: transversal + contratos canonicos (camada de dominio compartilhado e infraestrutura de dominio).
- `src/modules`: bounded contexts de produto (dominio principal e subdominio de produto).
- `src/shared`: primitivas reutilizaveis transversais (UI, hooks utilitarios, tipos compartilhados).
- `src/integrations`: adaptadores de infraestrutura externa (maps/supabase).
- `docs`: SSOT documental ativo + historico/arquivo.
- `scripts`: governanca, validacao, migracoes e automacao de engenharia.

## 2) Redacao oficial final do SSOT de taxonomia

### 2.1 Taxonomia global oficial
- `app` = fluxo de aplicacao (rotas, shell, composicao de paginas).
- `modules` = contextos de produto.
- `core` = capacidades transversais e contratos canonicos.
- `shared` = componentes/infra utilitaria agnostica de dominio.
- `integrations` = borda com provedores externos.

### 2.2 Taxonomia oficial de `src/modules`
- Modulos de topo canonicos:
  - `admin`
  - `ai`
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
  - `guide`
  - `mobility`
  - `professionals`
  - `profile`
  - `work-opportunities`
- Regras:
  - `business`/`empresas` e dominio base horizontal.
  - `business` nao e vertical.
  - Vertical oficial empresarial existe somente por declaracao em `src/core/verticals/config.ts`.
  - Estado oficial atual: `gastronomy` e `education`.
  - Community First usa modulos comunitarios explicitos; nao existe mais modulo
    top-level `community`.
  - Comunidade Local e core domain social e sua identidade canonica fica em
    `src/core/community-experience`.
  - Potencial futuro nao equivale a modulo/vertical oficialmente reconhecido.

## 3) Arvore atual x arvore alvo oficial

### 3.1 Estado atual (pos-reorganizacao executada)
```text
src/
  app/
    features/{landing,business-landing,dashboard,onboarding}
    pages/
    routes/
  core/
    ... (transversal + contratos canonicos)
  modules/
    admin/
    ai/
    business/{company,gastronomy,promotions,...}
    central/
    classifieds/{jobs,...}
    communication-territorial/
    community-events/
    community-feed/
    community-groups/
    community-issues/
    community-lost-found/
    community-recommendations/
    guide/
    mobility/{delivery,...}
    professionals/{services,...}
    profile/
    work-opportunities/
  shared/
  integrations/
```

### 3.2 Arvore alvo oficial
- Igual ao estado atual acima para os modulos de produto.
- Evolucao futura permitida apenas por:
  - declaracao explicita em SSOT;
  - migracao com encerramento formal de legado;
  - atualizacao de validadores de governanca no mesmo PR.

## 4) Execucao aplicada nesta rodada

- Registry de governanca atualizado para refletir paths reais pos-migracao:
  - `scripts/lib/architecture-registry.ts`
- Validador de fronteira de delivery corrigido para novo home:
  - `src/modules/mobility/delivery`
  - arquivo: `scripts/validate-delivery-architecture-boundaries.ts`
- Blindagem estrutural adicionada para prevenir regressao de taxonomia:
  - novo script: `scripts/validate-project-taxonomy.ts`
  - novo comando: `npm run validate:taxonomy`
- Consolidacao inicial de sobreposicao em `core/admin`:
  - `src/core/admin-identidade` migrado para `src/core/admin/identity`
  - `src/core/admin-motoristas` migrado para `src/core/admin/drivers`
  - imports atualizados para os novos paths canonicos
- Auditoria minuciosa da camada `core` consolidada em:
  - `docs/architecture/CORE_LAYER_SSOT.md`
- Consolidacao adicional de fronteiras de `core` executada:
  - facades `src/core/community-alerts` e `src/modules/community-alerts`
    removidas; consumidores usam diretamente o owner
    `src/core/community/alerts`
  - `src/core/community-issues` mantido como owner explicito de problemas
    comunitarios; superficie de produto em `src/modules/community-issues`
  - `src/core/promotions` -> `src/modules/business/promotions`
  - `src/core/services` -> `src/modules/professionals/services`
  - `src/core/vagas` -> `src/modules/classifieds/jobs`
  - `src/core/classifieds` -> `src/modules/classifieds`
  - `src/core/mobility` mantem contratos, servicos operacionais e UI
    cross-domain; `src/modules/mobility` concentra jornadas de produto
  - `src/core/events` legado substituido por `src/core/verticals/events` e
    `src/modules/community-events`
  - `src/core/gastronomy` -> `src/modules/business/gastronomy`
  - `src/core/lostfound` legado substituido por `src/core/community-lost-found`
    e `src/modules/community-lost-found`
  - `src/core/tourist-points` -> `src/modules/guide/tourist-points`
  - `src/core/civic` removido (facade legada)
  - `src/core/landing` -> `src/app/features/landing`
  - `src/core/supabase` removido e consolidado em `src/integrations/supabase`
- SSOT documental global consolidado neste arquivo e indexado no mapa canonico.

## 5) Regras de blindagem (anti-regressao)

- Nenhum novo modulo no topo de `src/modules` sem alteracao formal do SSOT.
- Fluxos de app (`landing`, `dashboard`, `onboarding`) permanecem em `src/app/features`.
- Subdominios derivados permanecem dentro do dominio base (nao no topo).
- Mudanca estrutural sem atualizar validadores/documentacao e considerada incompleta.

