# Core Territorial

**Owner:** `src/core/territorial`

Este domínio é o owner de agrupamentos territoriais, memberships, conteúdo
editorial territorial e regras de disponibilidade de grupos.

## Fronteiras

- `core/location` é o owner da geografia oficial e de `locations`;
- `core/territorial` é o owner de `territorial_groups`,
  `territorial_group_members`, highlights e conteúdo editorial territorial;
- `core/coverage` é o owner de cobertura de entidades;
- `core/rollout` é o owner de rollout individual por localização;
- `core/geospatial` é o owner de operações espaciais especializadas.

Um grupo territorial agrega locations reais. Ele nunca cria uma location
artificial nem altera a árvore geográfica oficial.

## Grupos territoriais

Contracts canônicos:

- `contracts/index.ts`;
- `repositories/ITerritorialGroupRepository.ts`;
- `repositories/TerritorialGroupRepositorySupabase.ts`;
- `services/TerritorialGroupService.ts`.

Regras principais:

- slug é único dentro da cidade âncora;
- `anchor_city_id` é a identidade canônica da cidade do grupo;
- membros são locations reais elegíveis;
- grupo ativo não pode ficar vazio;
- leitura pública considera apenas grupos ativos;
- inventário administrativo é separado da leitura pública;
- mutations administrativas não devem criar um segundo writer no browser.

A facade pública do domínio é `@/core/territorial`.

## Territorial Highlights

`territorial_highlights` é conteúdo editorial público.

Contrato atual:

- browser lê apenas highlights ativos e dentro da janela editorial;
- a projeção pública usa colunas explícitas;
- campos legados/internos não fazem parte do Data API público;
- create/update/delete administrativos pertencem ao
  `admin-highlights-rpc`;
- o browser não possui DML direto na tabela.

Owner:

- `highlights/TerritorialHighlightService.ts`;
- `highlights/TerritorialHighlightRepositorySupabase.ts`;
- `supabase/functions/admin-highlights-rpc/index.ts`.

## Territory AI Content

`territory_ai_content` possui duas superfícies deliberadamente separadas.

### Público

A landing lê diretamente apenas:

- `territory_slug`;
- `territory_name`;
- `description`;
- `history`;
- `demographics`;
- `events`;
- `ai_generated_at`.

Não existe `SELECT *` nesse contrato.

### Administração

Leitura administrativa, edição manual e geração pertencem exclusivamente ao
broker `territory-ai-content`:

- `verify_jwt=true`;
- `requireAdmin` aplica a política administrativa/MFA;
- `getSupabaseAdminClient` concentra a autoridade `service_role`;
- a identidade territorial é resolvida no servidor a partir de
  `territorial_groups`, memberships e `locations`;
- o browser envia somente o slug canônico e conteúdo editorial editável;
- `id`, provenance de override e timestamps administrativos não são públicos;
- o browser não possui INSERT/UPDATE/DELETE em `territory_ai_content`.

Owners:

- `services/TerritorialAIService.ts`;
- `hooks/useTerritoryAIContent.ts` — leitura pública;
- `hooks/useTerritoryAIContentAdmin.ts` — operações administrativas;
- `supabase/functions/territory-ai-content/index.ts`.

## Regras de implementação

1. Não acessar tabelas territoriais diretamente de páginas/componentes.
2. Não criar writer alternativo fora do owner do domínio.
3. Não usar `select("*")` em superfícies públicas.
4. Não confiar em nome, membros, ator ou provenance enviados pelo browser.
5. Não usar `auth.role()` como boundary de autorização.
6. Não manter caminhos de compatibilidade depois do cutover.
7. Migrations aplicadas permanecem versionadas como histórico; código e
   documentação ativa refletem somente o contrato final.

## Ratchets

Os principais guardrails são:

- `tools/architecture/validate-territory-ssot.ts`;
- `tests/security/territorial-edge-contract-security.test.ts`;
- `tests/security/territorial-group-admin-authority-g43.test.ts`;
- `tests/security/territorial-highlights-authority.test.ts`;
- `tests/security/territory-ai-content-authority.test.ts`.

## Referências

- `src/core/territorial/TERRITORIAL_GROUPS_SEMANTICS.md`;
- `docs/02-domain/GEOGRAPHIC_FOUNDATION.md`;
- `docs/05-ux/HOME-SPEC.md`;
- `docs/08-roadmap/checkpoints/` para evidência de rollout e ambiente;
- `docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json`.

Detalhes históricos de fases anteriores ficam nos checkpoints/arquivo e não
devem ser copiados de volta para esta README operacional.
