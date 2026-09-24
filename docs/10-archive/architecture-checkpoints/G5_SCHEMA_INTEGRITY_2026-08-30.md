# G5 — Schema integrity audit — 2026-08-30

## Escopo

Este corte fecha o item `indexes/constraints` de G5 com evidência do banco remoto de produção. O objetivo é distinguir defeito estrutural comprovado de advisory genérico e evitar tanto dívida silenciosa quanto criação/remoção massiva de índices por heurística.

## 1. Índices inválidos ou não prontos

Consulta direta em `pg_index` para relações `public` confirmou:

- índices `indisvalid = false`: **0**;
- índices `indisready = false`: **0**.

Classificação: **CLOSED**.

## 2. Índices exatamente duplicados

O inventário comparou tabela, unicidade, colunas/chaves, operator classes, collations, options, expressão e predicado.

Resultado:

- grupos de índices estruturalmente idênticos: **0**.

`idx_scan = 0` não foi tratado como autorização para remover índice. Índices podem proteger FK, unicidade, paths raros ou contratos futuros; remoção exige provenance e workload, não somente contador de scans.

Classificação: **CLOSED**.

## 3. Constraints `NOT VALID`

O remoto possuía **45** constraints `CHECK`/`FOREIGN KEY` em `public` com `convalidated = false`.

Antes de validar:

- as tabelas vazias foram confirmadas como vazias;
- as tabelas com dados foram verificadas contra a expressão real dos contratos;
- `emergency_contacts` possuía 3 linhas e zero violações reais;
- `notifications` possuía 544 linhas e zero violações de `notifications_type_format`;
- `tryon_generations` possuía 9 linhas e zero violações do contrato de origem da imagem.

A migration `20260830040754_validate_existing_public_constraints_g5.sql` executou apenas `VALIDATE CONSTRAINT`; nenhuma linha de aplicação foi alterada.

Pós-check:

- constraints públicas `CHECK`/`FK` ainda não validadas: **0**.

Classificação: **CLOSED**.

## 4. Constraints exatamente duplicadas

A auditoria encontrou quatro cópias redundantes, preservando sempre a constraint canônica/versionada equivalente:

- `profiles.fk_profiles_location_id` duplicava `profiles_location_id_fkey`;
- `ride_ratings.ride_ratings_rating_check` duplicava `ride_ratings_rating_range_chk`;
- `safety_evidence.safety_evidence_evidence_type_check` duplicava `safety_evidence_type_contract`;
- `safety_incidents.safety_incidents_incident_type_check` duplicava `safety_incidents_type_check`.

A migration `20260830041205_remove_exact_duplicate_constraints_g5.sql` removeu somente as cópias redundantes, sem modificar dados.

Pós-check:

- grupos de FK exatamente duplicadas: **0**;
- grupos de CHECK exatamente duplicados: **0**.

Classificação: **CLOSED**.

## 5. Foreign keys sinalizadas como sem índice

Um detector estrito, que aceitava apenas índice completo não parcial, apontou 148 FKs. Esse número não foi usado como plano de migration.

A reconciliação mostrou que **52** dessas FKs já possuem índice parcial com o mesmo prefixo. Muitos desses índices usam exatamente `coluna IS NOT NULL`, o que cobre as linhas que podem referenciar o pai e evita indexar valores nulos sem utilidade.

Exemplos observados no workload de produção:

- `idx_business_data_location_id` — `location_id IS NOT NULL`, **4046 scans**;
- `idx_profiles_location_id` — `location_id IS NOT NULL`, **621 scans**;
- `idx_profiles_main_territory_location` — `main_territory_location_id IS NOT NULL`, **26 scans**;
- `idx_order_timeline_actor` — `actor_profile_id IS NOT NULL`, **216 scans**;
- `idx_community_social_audit_location` — `location_id IS NOT NULL`, **218 scans**;
- `idx_events_location_id` — `location_id IS NOT NULL`, **902 scans**.

O workload de `pg_stat_statements` também confirmou filtros territoriais reais em `business_data.status + location_id` com centenas/milhares de chamadas. O índice existente de `location_id` já é usado ativamente; criar outro índice full apenas para silenciar o Advisor duplicaria custo de escrita.

Após reconhecer somente cobertura integral ou o caso seguro de índice parcial `FK_column IS NOT NULL`, restam **104** FKs sem esse tipo de cobertura. O topo atual é dominado por:

- colunas de auditoria/atribuição;
- colunas atualmente sem valores (`revoked_by`, `invited_by`, `business_id` em `user_subscriptions` neste snapshot);
- tabelas muito pequenas;
- relações de baixo uso atual.

Esses 104 itens permanecem como **performance/scale debt priorizável**, não como defeito de integridade. Eles devem ganhar índice quando workload, crescimento, parent-delete/update cost ou query path concreto justificar. Não criar 104 índices preventivos apenas para zerar INFO do Advisor.

## 6. Decisão sobre `unused_index`

Warnings `unused_index` do Advisor são informativos. Alguns índices com `idx_scan = 0` ainda dão suporte a constraints, rollouts ou paths raros; outros podem ter sido criados recentemente desde o reset de stats.

Regra G5:

1. não dropar por `idx_scan = 0` isoladamente;
2. antes de remover, provar ausência de constraint/dependency;
3. cruzar com source e `pg_stat_statements`;
4. preferir retirada pequena e reversível;
5. nunca combinar limpeza massiva de índices com refactor funcional.

## 7. Migrations deste corte

- `20260830040754_validate_existing_public_constraints_g5.sql`;
- `20260830041205_remove_exact_duplicate_constraints_g5.sql`.

## 8. Estado final do item G5

`indexes/constraints`: **CLOSED** no snapshot remoto de 2026-08-30.

Isso não significa performance global certificada. Load test, p50/p95/p99, planos de queries de módulos e crescimento pertencem à certificação operacional G6/G7. O que fica fechado aqui é a integridade estrutural conhecida e a triagem de advisory sem mudanças por heurística.
