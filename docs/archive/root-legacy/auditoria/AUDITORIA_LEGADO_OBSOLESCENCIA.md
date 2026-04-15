# AUDITORIA DE LEGADO E OBSOLESCÊNCIA
**Data**: 2026-03-30 | **Escopo**: Diagnóstico pré-cleanup

> **Nota de status (2026-03-30)**: Este documento é o diagnóstico original feito antes do cleanup.
> O cleanup estrutural mínimo viável (Etapas A-R) foi executado após este diagnóstico.
> Para o estado atual do projeto, consulte `docs/CANONICAL_MAP.md`.
> Itens marcados como "candidatos a remoção" neste documento já foram removidos.

---

## 1. INVENTÁRIO DE LEGADO E OBSOLESCÊNCIA

### 1.1 Pasta src/services/ (legado de arquitetura anterior)

| Caminho | Tipo | Motivo | Ativo | Risco | Severidade |
|---|---|---|---|---|---|
| `src/services/alert/types.ts` | types legado | Pasta src/services/ foi substituída por src/core/ | Morto (0 imports) | Confunde onde ficam types | Média |
| `src/services/community-qa/types.ts` | types legado | Idem | Morto | Idem | Média |
| `src/services/company/types.ts` | types legado | Idem | Morto | Idem | Média |
| `src/services/interaction/types.ts` | types legado | Idem | Morto | Idem | Média |
| `src/services/professional/types.ts` | types legado | Importado por 1 teste (`ProfessionalService.canonical.test.ts`) | Legado ativo | Agente pode usar path errado | Alta |
| `src/services/social/types.ts` | types legado | Idem | Morto | Idem | Média |

**Nota**: `src/services/professional/types.ts` ainda é importado em `src/core/professional/services/__tests__/ProfessionalService.canonical.test.ts` via `@/services/professional/types`. Isso é um import apontando para path legado dentro de um teste de core.

---

### 1.2 Pasta src/pages/ (pasta legada com 1 arquivo ativo)

| Caminho | Tipo | Motivo | Ativo | Risco | Severidade |
|---|---|---|---|---|---|
| `src/pages/ProfilePublicPage.tsx` | page em lugar errado | Deveria estar em `src/app/pages/` ou `src/modules/profile/pages/`. Está em `src/pages/` que é pasta fora do padrão arquitetural | Ativo (importado por `ProfilePublicRoute.tsx`) | Agente pode criar novas pages em `src/pages/` achando que é o padrão | Alta |

---

### 1.3 Domínios duplicados em src/core/

| Caminho | Duplicata de | Motivo | Ativo | Risco | Severidade |
|---|---|---|---|---|---|
| `src/core/classified/` | `src/core/classifieds/` | Pasta `classified/` (singular) existe com `services/` vazia. `classifieds/` (plural) é o SSOT real | Morto (0 arquivos, 0 imports) | Agente pode criar service em lugar errado | Alta |
| `src/core/banners/BannerService.ts` | `src/core/banners/services/BannerService.ts` | Dois BannerService no mesmo domínio. O da raiz é legado (importado via barrel `@/core/banners`). O de `services/` é o canônico atual | Legado ativo (via barrel) | Agente não sabe qual usar | Alta |
| `src/core/company/` | `src/core/business/` | `company` é conceito legado substituído por `business`. Ainda tem consumers em `src/modules/business/hooks/` | Legado ativo | Dois domínios para o mesmo conceito | Alta |

### 1.4 Re-exports e aliases legados

| Caminho | Tipo | Motivo | Ativo | Risco | Severidade |
|---|---|---|---|---|---|
| `src/core/supabase/index.ts` | re-export legado | Re-exporta `supabase` e `createClient` de `@/integrations/supabase`. Existe para compatibilidade com imports antigos `@/core/supabase`. Ainda usado por `SessionService` e `AdminReportsPassageiros` (removido) | Legado ativo | Dois caminhos para o mesmo client | Alta |
| `src/core/banners/index.ts` | barrel com re-export perigoso | Linha: `export { supabase } from '@/core/supabase'` — re-exporta o client Supabase de dentro de um domínio de negócio | Ativo | Agente pode importar supabase via `@/core/banners` | Alta |

---

### 1.5 Scripts legados em src/scripts/ (bootstrap/admin)

| Caminho | Tipo | Motivo | Ativo | Risco | Severidade |
|---|---|---|---|---|---|
| `src/scripts/addAdmin.ts` | script bootstrap | Cria usuário admin. Duplicata funcional de `src/modules/admin/pages/AdminSetupPage.tsx` e `scripts/create_admin_final.js` | Morto (não referenciado) | Confunde com código de produção | Média |
| `src/scripts/createAdmin.mjs` | script bootstrap | Idem | Morto | Idem | Média |
| `src/scripts/createAdminRemote.ts` | script bootstrap | Idem | Morto | Idem | Média |
| `src/scripts/createAdminUser.ts` | script bootstrap | Idem | Morto | Idem | Média |
| `src/scripts/createTestUser.ts` | script de teste | Cria usuário de teste. Não é produção | Morto | Misturado com src/ | Baixa |
| `src/scripts/checkUserProfile.ts` | script diagnóstico | Diagnóstico pontual. Não é produção | Morto | Misturado com src/ | Baixa |
| `src/scripts/testLogin.ts` | script de teste | Testa login. Não é produção | Morto | Misturado com src/ | Baixa |
| `src/scripts/applyMigration.ts` | script de migração | Aplica migration inline. Duplicata de `scripts/apply-migrations.mjs` | Morto | Confunde com código de produção | Média |
| `src/scripts/registerMigrations.mjs` | script legado | Registra migrations manualmente | Morto | Idem | Baixa |
| `src/scripts/runMigration*.mjs` (4 arquivos) | scripts legados | Múltiplas variantes de apply migration | Mortos | Idem | Baixa |

---

### 1.6 Arquivos SQL soltos na raiz

| Caminho | Tipo | Motivo | Ativo | Risco | Severidade |
|---|---|---|---|---|---|
| `fix_group_id.sql` | SQL solto | Fix pontual de group_id. Deveria estar em `supabase/migrations/` ou `scripts/` | Morto | Agente pode reaplicar | Alta |
| `seed_highlights.sql` | SQL solto | Seed de highlights. Deveria estar em `supabase/` | Morto | Agente pode reaplicar | Alta |

---

### 1.7 Pasta supabase/migrations_old/

| Caminho | Tipo | Motivo | Ativo | Risco | Severidade |
|---|---|---|---|---|---|
| `supabase/migrations_old/` (14 arquivos) | migrations descartadas | Migrations que foram substituídas pelas de `supabase/migrations/`. Não são aplicadas pelo CLI | Mortos | Agente pode confundir com migrations ativas | Alta |

Arquivos: `20260327000001` a `20260327000014` — cobrem criação de tabelas, RLS, notifications, mobility, banners, coupons, business_claims, user_blocks, privacy_fields.

---

### 1.8 Migrations com datas inconsistentes (2025 vs 2026)

| Caminho | Tipo | Motivo | Risco | Severidade |
|---|---|---|---|---|
| `supabase/migrations/20250130_create_city_metadata.sql` | migration com data 2025 | Todas as outras migrations são 2026. Essa é de 2025 e pode ter sido criada fora do fluxo normal | Agente pode achar que é mais antiga e ignorar | Média |
| `supabase/migrations/20250130000001_update_classifieds_data.sql` | idem | Idem | Idem | Média |
| `supabase/migrations/20250130000002_seed_better_classifieds.sql` | idem | Idem | Idem | Média |
| `supabase/migrations/20250130000003_add_price_type_to_professional_data.sql` | idem | Idem | Idem | Média |
| `supabase/migrations/20250130000004_expand_city_metadata_jsonb.sql` | idem | Idem | Idem | Média |

---

### 1.9 Snippet SQL sem nome

| Caminho | Tipo | Motivo | Risco | Severidade |
|---|---|---|---|---|
| `supabase/snippets/Untitled query 556.sql` | snippet sem nome | Query ad-hoc sem contexto | Agente pode achar que é canônico | Baixa |

---

### 1.10 Tabelas com sufixo _new (nomes temporários permanentes)

| Tabela | Onde usada | Motivo | Risco | Severidade |
|---|---|---|---|---|
| `post_likes_new` | `SocialInteractionsService.ts` | Nome temporário de migração que virou permanente | Agente pode criar `post_likes` achando que é a tabela correta | Alta |
| `saved_posts_new` | `SocialInteractionsService.ts` | Idem | Idem | Alta |
| `group_members_new` | `SocialInteractionsService.ts` | Idem | Idem | Alta |
| `group_messages_new` | `SocialInteractionsService.ts` | Idem | Idem | Alta |
| `profile_favorites_new` | `src/scripts/applyMigration.ts` | Idem | Idem | Alta |

---

### 1.11 Arquivos de texto/commit na raiz

| Caminho | Tipo | Motivo | Risco | Severidade |
|---|---|---|---|---|
| `COMMIT_*.txt` (5 arquivos) | mensagens de commit | Rascunhos de commit message. Não são documentação | Poluição visual | Baixa |
| `FASE_LIMPEZA_BASELINE*.txt` (2 arquivos) | snapshots de limpeza | Snapshots de estado anterior | Poluição visual | Baixa |
| `dependency-violations-full.txt` | relatório de violações | Relatório gerado por script. Pode estar desatualizado | Agente pode usar como referência desatualizada | Média |
| `violations-complete.txt` | idem | Idem | Idem | Média |
| `violations-report.json` | idem | Idem | Idem | Média |
| `lint-report.txt` | relatório de lint | Idem | Idem | Média |
| `lint-ssot-errors.txt` | idem | Idem | Idem | Média |
| `HOMOLOGACAO_*.json` (7 arquivos) | resultados de homologação | Snapshots de homologação. Podem estar desatualizados | Agente pode usar como referência | Baixa |
| `vite.config.ts.timestamp-*.mjs` | artefato de build | Arquivo temporário do Vite que não deveria estar no repo | Poluição | Baixa |
| `restart-dev.ps1` | script PowerShell | Script de conveniência local | Poluição | Baixa |

---

## 2. DOCS QUE PODEM CONFUNDIR

### 2.1 Docs na raiz (>200 arquivos .md)

A raiz do projeto tem **mais de 200 arquivos .md**. A maioria são relatórios de sessões de trabalho com agentes. Nenhum é documentação canônica. Os que representam risco real de confusão:

| Arquivo | O que diz | Por que conflita | Ação recomendada |
|---|---|---|---|
| `ARCHITECTURE.md` (raiz) | Descreve arquitetura geral | Pode estar desatualizado em relação a `docs/ARCHITECTURE.md` | Consolidar com `docs/ARCHITECTURE.md` ou remover |
| `README.md` (raiz) | Ponto de entrada do projeto | Pode não refletir estrutura atual | Revisar e atualizar |
| `START_HERE.md` | Guia de início | Pode ter instruções antigas | Revisar |
| `TECHNICAL_SUMMARY.md` | Resumo técnico | Pode estar desatualizado | Revisar ou arquivar |
| `ARQUITETURA_MULTI_PERFIL_CORRIGIDA.md` | Arquitetura multi-perfil | Há 3 versões: `_CORRIGIDA`, `_DEFINITIVA`, `_FINAL` — qual é a atual? | Consolidar em 1 |
| `ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md` | Idem | Idem | Idem |
| `ARQUITETURA_MULTI_PERFIL_FINAL.md` | Idem | Idem | Idem |
| `ARQUITETURA_COMMUNITY_OFICIAL.md` | Arquitetura de community | Pode conflitar com estado atual | Revisar |
| `ARQUITETURA_CONGELADA_RESUMO.md` | Arquitetura congelada | Pode estar desatualizado | Revisar |
| `AUDITORIA_FINAL_SSOT.md` | Auditoria SSOT | Há `AUDITORIA_FINAL_SSOT.md` e `AUDITORIA_FINAL_SSOT_COMPLETA.md` | Consolidar |
| `AUDITORIA_SSOT_COMPLETA.md` | Idem | Idem | Idem |
| `BLINDAGEM_ARQUITETURAL_RELATORIO.md` | Relatório de blindagem | Superado por `FECHAMENTO_FINAL_BLINDAGEM_v3.md` | Marcar deprecated |
| `VALIDACAO_FINAL_BLINDAGEM.md` | Validação de blindagem | Superado por `VEREDITO_FINAL_COERENCIA_v3.md` | Marcar deprecated |
| `FECHAMENTO_BLINDAGEM_v3.md` | Fechamento de blindagem | Superado por `FECHAMENTO_FINAL_BLINDAGEM_v3.md` | Marcar deprecated |
| `LEIA_ISTO_PRIMEIRO*.md` (múltiplos) | Guias de início | Múltiplas versões conflitantes | Consolidar em 1 |
| `ENTREGA_FINAL*.md` (múltiplos) | Relatórios de entrega | Múltiplas versões — qual é a final? | Arquivar todos |
| `CONCLUSAO_FINAL.md` | Conclusão | Pode estar desatualizado | Arquivar |
| `INDICE_DOCUMENTACAO*.md` (3 arquivos) | Índices de docs | Múltiplos índices conflitantes | Consolidar em 1 |

### 2.2 Docs em docs/ que podem confundir

| Arquivo | O que diz | Por que conflita | Ação recomendada |
|---|---|---|---|
| `docs/ARCHITECTURE.md` | Arquitetura oficial | Pode estar desatualizado em relação à blindagem v3.0 | Atualizar com regras v3.0 |
| `docs/CURRENT_RULES.md` | Regras atuais | Pode não refletir blindagem v3.0 | Atualizar |
| `docs/architecture-fix/` (11 arquivos) | Correções de arquitetura | Histórico de correções — não é estado atual | Mover para `docs/historico/` |
| `docs/GEOGRAPHIC_FOUNDATION*.md` (6 arquivos) | Fundação geográfica | Pode estar desatualizado | Revisar |

---

## 3. SQL E ESTRUTURA DE BANCO LEGADA

| Caminho | Tabela/Objeto | Ainda usado | Risco de reuso errado | Ação recomendada |
|---|---|---|---|---|
| `supabase/migrations_old/` (14 arquivos) | Várias tabelas | NÃO (descartadas) | Alto — agente pode aplicar novamente | Mover para `docs/archive/` ou deletar |
| `fix_group_id.sql` (raiz) | `territorial_groups` | NÃO | Alto — agente pode reaplicar | Mover para `supabase/scripts/` ou deletar |
| `seed_highlights.sql` (raiz) | `territorial_highlights` | NÃO | Alto — agente pode reaplicar | Mover para `supabase/scripts/` ou deletar |
| `supabase/snippets/Untitled query 556.sql` | Desconhecido | NÃO | Médio | Deletar ou nomear |
| `scripts/all-migrations.sql` | Todas as tabelas | NÃO (consolidação manual) | Alto — pode conflitar com migrations | Arquivar |
| `scripts/validacao-banco-final.sql` | Várias tabelas | NÃO (diagnóstico) | Baixo | Mover para `supabase/scripts/` |
| `scripts/seed_tonecosloja*.sql` (2 arquivos) | Dados de teste | NÃO | Médio — dados hardcoded de usuário real | Deletar |
| `scripts/seed_grupo_complexo_nordeste.sql` | `territorial_groups` | NÃO | Médio | Mover para `supabase/` |
| `scripts/debug_grupo.sql` | `territorial_groups` | NÃO | Baixo | Deletar |
| `scripts/test_*.sql` (6 arquivos) | Várias tabelas | NÃO | Médio — agente pode achar que são queries canônicas | Mover para `supabase/scripts/` |
| `scripts/check_*.sql` (2 arquivos) | Várias tabelas | NÃO | Baixo | Mover para `supabase/scripts/` |
| `scripts/verificar_*.sql` (2 arquivos) | Várias tabelas | NÃO | Baixo | Mover para `supabase/scripts/` |
| `scripts/validate_*.sql` (2 arquivos) | Várias tabelas | NÃO | Baixo | Mover para `supabase/scripts/` |
| `scripts/aplicar-rpc-invite-member.sql` | RPC `invite_member` | Pode estar desatualizado | Médio | Verificar se RPC existe |
| `scripts/apply-constraints-manual.sql` | Constraints | NÃO (aplicadas via migration) | Médio | Arquivar |
| `scripts/add_admin_user.sql` | `user_roles` | NÃO | Médio — dados hardcoded | Deletar |
| Tabelas `*_new` em produção | `post_likes_new`, `saved_posts_new`, `group_members_new`, `group_messages_new` | SIM (ativas) | Alto — nome temporário virou permanente | Documentar como canônico ou planejar rename |
| `supabase/migrations/20250130*.sql` (5 arquivos) | `city_metadata`, `classifieds` | SIM (aplicadas) | Médio — data 2025 confunde ordem | Documentar que são válidas |

---

## 4. CÓDIGO MORTO OU DUPLICADO

| Caminho | Quem deveria consumir | Quem realmente consome | Status |
|---|---|---|---|
| `src/core/classified/services/` | Ninguém (pasta vazia) | Ninguém | Morto |
| `src/services/alert/types.ts` | Ninguém | Ninguém | Morto |
| `src/services/community-qa/types.ts` | Ninguém | Ninguém | Morto |
| `src/services/company/types.ts` | Ninguém | Ninguém | Morto |
| `src/services/interaction/types.ts` | Ninguém | Ninguém | Morto |
| `src/services/professional/types.ts` | `src/core/professional/` | 1 teste (`ProfessionalService.canonical.test.ts`) | Legado ativo |
| `src/services/social/types.ts` | Ninguém | Ninguém | Morto |
| `src/core/banners/BannerService.ts` (raiz) | Substituído por `services/BannerService.ts` | `BannerDisplay.tsx` via barrel `@/core/banners` | Legado ativo via barrel |
| `src/core/company/` | Substituído por `src/core/business/` | `src/modules/business/hooks/useCompan*.ts` (8 arquivos) | Legado ativo |
| `src/modules/business/services/BusinessService.ts` | Substituído por `src/core/business/services/BusinessService.ts` | Desconhecido (verificar) | Duplicado potencial |
| `src/core/supabase/index.ts` | Substituído por `@/integrations/supabase` | `SessionService.ts`, `GovernanceRepositorySupabase.ts` | Legado ativo |
| `src/scripts/addAdmin.ts` | Ninguém | Ninguém | Morto |
| `src/scripts/createAdmin.mjs` | Ninguém | Ninguém | Morto |
| `src/scripts/createAdminRemote.ts` | Ninguém | Ninguém | Morto |
| `src/scripts/createAdminUser.ts` | Ninguém | Ninguém | Morto |
| `src/scripts/createTestUser.ts` | Ninguém | Ninguém | Morto |
| `src/scripts/testLogin.ts` | Ninguém | Ninguém | Morto |
| `src/scripts/checkUserProfile.ts` | Ninguém | Ninguém | Morto |
| `src/scripts/applyMigration.ts` | Ninguém | Ninguém | Morto |
| `src/scripts/runMigration*.mjs` (4 arquivos) | Ninguém | Ninguém | Mortos |
| `fix_group_id.sql` (raiz) | Ninguém | Ninguém | Morto |
| `seed_highlights.sql` (raiz) | Ninguém | Ninguém | Morto |
| `supabase/migrations_old/` (14 arquivos) | Ninguém | Ninguém | Mortos |
| `supabase/snippets/Untitled query 556.sql` | Ninguém | Ninguém | Morto |
| `vite.config.ts.timestamp-*.mjs` | Ninguém | Ninguém | Artefato de build |
| `docs-archive/` (31 arquivos) | Histórico | Ninguém | Legado ocioso |
| `docs/archive/` | Histórico | Ninguém | Legado ocioso |
| `docs/historico/` | Histórico | Ninguém | Legado ocioso |
| `docs/architecture-fix/` | Histórico | Ninguém | Legado ocioso |

---

## 5. ZONAS QUE PODEM CONFUNDIR AGENTES DE CÓDIGO

### Zona 1: Dois BannerService no mesmo domínio

- **Por que confunde**: `src/core/banners/BannerService.ts` (raiz) e `src/core/banners/services/BannerService.ts` têm o mesmo nome. O barrel `src/core/banners/index.ts` exporta o da raiz. `BannersPage.tsx` importa diretamente o de `services/`. Dois consumidores, dois services, mesmo nome.
- **Exemplo concreto**: Agente busca "BannerService" e encontra dois arquivos. Não sabe qual é o canônico.
- **Impacto provável**: Agente usa o legado (raiz) achando que é o atual.
- **Severidade**: Alta

### Zona 2: src/core/company/ vs src/core/business/

- **Por que confunde**: `company` e `business` são o mesmo conceito. `src/core/company/` tem `CompanyService`, `src/core/business/` tem `BusinessService`. Módulos em `src/modules/business/` ainda importam de `@/core/company`.
- **Exemplo concreto**: Agente precisa adicionar funcionalidade de negócio. Encontra dois domínios. Não sabe qual usar.
- **Impacto provável**: Agente adiciona em `company` (legado) em vez de `business` (canônico).
- **Severidade**: Alta

### Zona 3: src/core/supabase/ como alias de @/integrations/supabase

- **Por que confunde**: `src/core/supabase/index.ts` re-exporta o client de `@/integrations/supabase`. Existe para compatibilidade com imports antigos. Mas a regra v3.0 diz que só `@/integrations/supabase` é o path oficial. Dois caminhos para o mesmo client.
- **Exemplo concreto**: `SessionService.ts` importa de `@/core/supabase`. `BannerService.ts` importa de `@/integrations/supabase`. Agente não sabe qual usar.
- **Impacto provável**: Agente usa `@/core/supabase` em novo service, violando a regra v3.0 sem saber.
- **Severidade**: Alta

### Zona 4: Tabelas com sufixo _new como nomes permanentes

- **Por que confunde**: `post_likes_new`, `saved_posts_new`, `group_members_new`, `group_messages_new` são nomes temporários de migração que viraram permanentes. Agente pode criar `post_likes` achando que é a tabela correta.
- **Exemplo concreto**: Agente precisa adicionar like em post. Busca "post_likes" e não encontra. Cria nova tabela. Duplica.
- **Impacto provável**: Duplicação de tabela ou query errada.
- **Severidade**: Alta

### Zona 5: 200+ docs .md na raiz sem hierarquia

- **Por que confunde**: Docs de sessões de trabalho, relatórios de entrega, checklists, análises — tudo misturado na raiz. Não há distinção entre documentação canônica e histórico de trabalho.
- **Exemplo concreto**: Agente busca "arquitetura" e encontra `ARCHITECTURE.md`, `ARQUITETURA_CONGELADA_RESUMO.md`, `ARQUITETURA_COMMUNITY_OFICIAL.md`, `ARQUITETURA_MULTI_PERFIL_FINAL.md` — qual é a fonte de verdade?
- **Impacto provável**: Agente usa doc desatualizada como referência.
- **Severidade**: Alta

### Zona 6: supabase/migrations_old/ visível junto com migrations/

- **Por que confunde**: `migrations_old/` está no mesmo nível que `migrations/`. Agente pode achar que são migrations pendentes ou alternativas.
- **Exemplo concreto**: Agente precisa criar migration para mobility. Encontra `migrations_old/20260327000008_create_mobility_tables.sql`. Acha que é a migration canônica.
- **Impacto provável**: Reaplicação de migration descartada.
- **Severidade**: Alta

### Zona 7: src/pages/ com 1 arquivo ativo fora do padrão

- **Por que confunde**: `src/pages/` tem apenas `ProfilePublicPage.tsx`. Todas as outras pages estão em `src/app/pages/` ou `src/modules/*/pages/`. Agente pode criar nova page em `src/pages/` achando que é o padrão.
- **Impacto provável**: Nova page criada fora do padrão arquitetural.
- **Severidade**: Alta

### Zona 8: src/modules/business/services/BusinessService.ts vs src/core/business/services/BusinessService.ts

- **Por que confunde**: Dois arquivos com o mesmo nome em caminhos diferentes. Um em `modules/`, outro em `core/`. O de `core/` é o SSOT. O de `modules/` pode ser legado ou wrapper.
- **Impacto provável**: Agente usa o de `modules/` achando que é o canônico.
- **Severidade**: Média

### Zona 9: scripts/ na raiz com 100+ arquivos sem categorização

- **Por que confunde**: Scripts de migração, homologação, diagnóstico, seed, fix, validate — todos no mesmo nível. Não há distinção entre scripts ativos e históricos.
- **Impacto provável**: Agente executa script desatualizado ou usa como referência errada.
- **Severidade**: Média

---

## 6. CLASSIFICAÇÃO FINAL

### Categoria 1: Pode ficar, mas precisa marcação
- `src/core/supabase/index.ts` — marcar como deprecated, documentar que `@/integrations/supabase` é o path oficial
- `src/core/company/` — marcar como deprecated, documentar que `@/core/business/` é o SSOT
- `src/core/banners/BannerService.ts` (raiz) — marcar como deprecated, documentar que `services/BannerService.ts` é o canônico
- `src/pages/ProfilePublicPage.tsx` — marcar que deveria estar em `src/app/pages/` ou `src/modules/profile/pages/`
- Tabelas `*_new` — documentar que são os nomes canônicos permanentes (não temporários)
- `supabase/migrations/20250130*.sql` — documentar que são válidas apesar da data 2025

### Categoria 2: Deve ser movido para archive/legacy
- `supabase/migrations_old/` — mover para `docs/archive/migrations_old/`
- `docs-archive/` — já está em archive, manter
- `docs/archive/` — já está em archive, manter
- `docs/historico/` — já está em histórico, manter
- `docs/architecture-fix/` — mover para `docs/historico/`
- `fix_group_id.sql` (raiz) — mover para `supabase/scripts/`
- `seed_highlights.sql` (raiz) — mover para `supabase/scripts/`
- `scripts/seed_tonecosloja*.sql` — mover para archive (contém dados de usuário real)

### Categoria 3: Deve ser consolidado
- `ARQUITETURA_MULTI_PERFIL_*.md` (3 versões) — consolidar em 1
- `AUDITORIA_FINAL_SSOT*.md` (2 versões) — consolidar em 1
- `INDICE_DOCUMENTACAO*.md` (3 versões) — consolidar em 1
- `LEIA_ISTO_PRIMEIRO*.md` (múltiplos) — consolidar em 1
- `ARCHITECTURE.md` (raiz) + `docs/ARCHITECTURE.md` — consolidar em 1
- Relatórios de blindagem (`BLINDAGEM_*.md`, `VALIDACAO_FINAL_BLINDAGEM.md`, `FECHAMENTO_*.md`) — consolidar em 1 doc final

### Categoria 4: Deve ser removido depois
- `src/core/classified/` (pasta vazia) — remover
- `src/services/alert/types.ts` — remover
- `src/services/community-qa/types.ts` — remover
- `src/services/company/types.ts` — remover
- `src/services/interaction/types.ts` — remover
- `src/services/social/types.ts` — remover
- `src/scripts/addAdmin.ts`, `createAdmin.mjs`, `createAdminRemote.ts`, `createAdminUser.ts`, `createTestUser.ts`, `testLogin.ts`, `checkUserProfile.ts` — remover
- `src/scripts/applyMigration.ts`, `runMigration*.mjs` — remover
- `vite.config.ts.timestamp-*.mjs` — remover
- `supabase/snippets/Untitled query 556.sql` — remover
- `COMMIT_*.txt`, `FASE_LIMPEZA_BASELINE*.txt` — remover
- `dependency-violations-full.txt`, `violations-complete.txt`, `violations-report.json`, `lint-report.txt`, `lint-ssot-errors.txt` — remover (ou mover para archive)
- `restart-dev.ps1` — remover

### Categoria 5: Deve ser blindado com lint/regra
- `src/core/supabase/` — adicionar regra ESLint proibindo novos imports de `@/core/supabase` (exceto os existentes)
- `src/pages/` — adicionar regra ESLint proibindo criação de novos arquivos em `src/pages/`
- `src/services/` — adicionar regra ESLint proibindo novos imports de `@/services/`

### Categoria 6: Deve ser explicitamente documentado como exceção
- `src/modules/admin/pages/AdminSetupPage.tsx` — já documentado no ESLint
- `src/services/professional/types.ts` — documentar que o import em `ProfessionalService.canonical.test.ts` é legado e deve ser migrado
- Tabelas `*_new` — documentar em `docs/DATA_MODELING.md` que são os nomes canônicos

---

## 7. PLANO DE LIMPEZA EM ETAPAS

### Etapa A: Marcação de deprecated
**O que entra**: Adicionar comentários/headers de deprecated nos arquivos legados ativos sem remover nada.
- `src/core/supabase/index.ts` — adicionar `@deprecated`
- `src/core/company/` — adicionar `@deprecated` em todos os arquivos
- `src/core/banners/BannerService.ts` (raiz) — adicionar `@deprecated`
- `src/core/banners/index.ts` — remover re-export de supabase
- `src/pages/ProfilePublicPage.tsx` — adicionar comentário de localização incorreta
**Risco**: Baixo. Nenhuma remoção.
**Dependências**: Nenhuma.

### Etapa B: Archive/legacy
**O que entra**: Mover arquivos mortos para pastas de archive sem deletar.
- `supabase/migrations_old/` → `docs/archive/migrations_old/`
- `fix_group_id.sql`, `seed_highlights.sql` → `supabase/scripts/`
- `docs/architecture-fix/` → `docs/historico/`
- `scripts/seed_tonecosloja*.sql` → `docs/archive/`
**Risco**: Médio. Mover migrations_old pode confundir o CLI do Supabase se não for feito corretamente.
**Dependências**: Etapa A concluída.

### Etapa C: Remoção de mortos
**O que entra**: Deletar arquivos confirmados como mortos (0 imports, 0 consumidores).
- `src/core/classified/` (pasta vazia)
- `src/services/alert/`, `community-qa/`, `company/`, `interaction/`, `social/` (exceto `professional/`)
- `src/scripts/` (scripts de bootstrap mortos)
- `vite.config.ts.timestamp-*.mjs`
- `supabase/snippets/Untitled query 556.sql`
- `COMMIT_*.txt`, `FASE_LIMPEZA_BASELINE*.txt`
- Relatórios gerados: `violations-*.txt`, `lint-*.txt`
**Risco**: Médio. Verificar 0 imports antes de cada remoção.
**Dependências**: Etapa B concluída. Typecheck deve passar antes e depois.

### Etapa D: Consolidação de docs canônicas
**O que entra**: Consolidar docs duplicadas e mover histórico para `docs/historico/`.
- Consolidar `ARQUITETURA_MULTI_PERFIL_*.md` em 1
- Consolidar `ARCHITECTURE.md` (raiz) + `docs/ARCHITECTURE.md` em 1
- Consolidar relatórios de blindagem em 1 doc final
- Mover 200+ docs de sessão da raiz para `docs/historico/` ou `docs/archive/`
**Risco**: Baixo. Apenas docs, não código.
**Dependências**: Etapa C concluída.

### Etapa E: Blindagem contra reuso indevido
**O que entra**: Adicionar regras ESLint para prevenir regressão.
- Proibir novos imports de `@/core/supabase` (exceto existentes)
- Proibir novos imports de `@/services/` (exceto existentes)
- Proibir criação de arquivos em `src/pages/` (exceto `ProfilePublicPage.tsx`)
- Proibir imports de `@/core/company` em novos arquivos
**Risco**: Baixo. Apenas lint, não remove código.
**Dependências**: Etapas A-D concluídas.

---

## MAPA DE LEGADO PARA LIMPEZA

- docs obsoletas: **~180** (raiz) + **~50** (docs/archive, docs/historico, docs-archive)
- SQLs perigosos/ambíguos: **~30** (migrations_old + scripts SQL soltos + snippets)
- arquivos mortos: **~35** (src/scripts mortos + src/services mortos + artefatos)
- duplicações reais: **5** (BannerService x2, BusinessService x2, company vs business, classified vs classifieds, core/supabase vs integrations/supabase)
- rotas/páginas legadas: **1** (`src/pages/ProfilePublicPage.tsx` em lugar errado)
- serviços/hooks/components candidatos a archive: **~15** (src/core/company/, src/services/*, src/core/banners/BannerService.ts raiz)
- zonas de risco para agentes: **9** (documentadas na seção 5)
- cleanup recomendado: **SIM**
