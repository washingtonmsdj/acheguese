# Coverage SSOT

Status: canonical
Data: 2026-07-17

## Decisao

`src/core/coverage` e o unico owner de cobertura territorial de entidades.
`src/core/geospatial` possui calculos, limites e busca espacial, mas nao cria,
remove nem decide ownership de cobertura.

## Persistencia

- Tabela canonica: `public.service_areas`.
- Migration base e comandos: `20260717140000_consolidate_coverage_commands.sql`.
- Leitura publica: somente `SELECT`, protegida por RLS.
- Escrita: somente os RPCs `replace_entity_coverage`,
  `remove_entity_coverage` e `update_entity_coverage_status`.
- `anon` e `authenticated` nao possuem `INSERT`, `UPDATE` ou `DELETE` na
  tabela.

`replace_entity_coverage` valida e grava em uma unica transacao: owner da
entidade, perfil ativo, taxonomia, local ativo, raio de 1 a 100 km,
duplicidades, area primaria unica e limite de 50 areas.

## Ownership

| `entity_type` | Entidade canonica | Regra de escrita |
|---|---|---|
| `business` | `business_data.id` | Profile ativo da empresa |
| `service_provider` | `professional_data.id` | Profile ativo do profissional |
| `classified` | `classifieds.id` | Seller/Profile ativo |
| `mobility_driver` | `driver_data.id` | Profile ativo do motorista |
| `ad_campaign` | `ad_campaigns.id` | Criador ou owner da empresa |

Admin e `service_role` mantem bypass operacional, mas a entidade precisa
existir. Para atores comuns, a resposta nao revela se uma entidade de outro
owner existe.

## Aplicacao

- Contratos: `src/core/coverage/types/index.ts`.
- Servico: `src/core/coverage/services/CoverageService.ts`.
- Persistencia: `CoverageRepositorySupabase`, com leitura da tabela e escrita
  exclusivamente pelos RPCs.
- Empresa: `BusinessCoverageService`, `useBusinessCoverage` e componentes em
  `src/modules/business/components/coverage`.
- O raio e ancorado em `location_id`; coordenadas livres do navegador nao sao
  autoridade territorial.

Os antigos RPCs `add_coverage_by_*`, `check_coverage`,
`find_entities_with_coverage`, `get_coverage_areas` e `remove_coverage`, assim
como o segundo service/hook de `core/geospatial`, foram removidos.

## Verificacao

- Teste estatico: `tests/security/coverage-command-security.test.ts`.
- Auditoria remota: `tests/security/coverage-commands-remote-audit.sql`.
- Gate de migrations: `npm run validate:migrations`.

## Rollback

Rollback funcional significa migrar consumidores para um novo comando antes
de revogar os comandos atuais. Nao reabrir escrita direta na tabela e nao
restaurar os RPCs geoespaciais antigos.
