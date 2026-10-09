# Supabase — reconciliação de migrations antes do próximo DB push

**Data da auditoria:** 08/10/2026 (America/Bahia)  
**Escopo:** repositório canônico `washingtonmsdj/acheguese`, `main` SHA
`13ee3235f3277c84e35c2d9a919d7f185d5e3f9f` e somente leitura do
histórico `supabase_migrations.schema_migrations` do projeto canônico
`xhdowzacfujckjelqhtd`.

## Diagnóstico comprovado

| Categoria | Quantidade |
|---|---:|
| Arquivos SQL em `main/supabase/migrations` | 708 |
| Migrações registradas no histórico remoto | 706 |
| Versões presentes em ambos | 682 |
| Versões somente no repositório | 26 |
| Versões somente no histórico remoto | 24 |

As **24 versões remotas exclusivas** têm nomes de migrations já conhecidos do
source. Entretanto, `remove_redundant_service_role_rls_policies` aparece
**duas vezes no histórico remoto** (`20260926011402` e
`20260926012211`) e apenas uma vez entre as versões locais divergentes
(`20260926011200`). Não fazer deduplicação por nome.

Comparação **do SQL armazenado no próprio histórico de produção**
(`supabase_migrations.schema_migrations.statements`) com os arquivos
de mesmo nome da `main`, em memória, sem trazer registros de usuários:

| Correspondência do corpo SQL (24 entradas) | Quantidade |
|---|---:|
| Exata, bytes iguais, versão diferente | 3 |
| Igual após retirar somente whitespace final, versão diferente | 14 |
| **Corpo SQL realmente divergente** | **7** |

Entradas com conteúdo divergente que exigem revisão da semântica, sem
assumir equivalência por nome:

| Versão remota aplicada | Nome |
|---|---|
| `20260926011402` | `remove_redundant_service_role_rls_policies` (primeiro dos dois registros) |
| `20260926011531` | `harden_analytics_ingest_abuse_controls` |
| `20260926012414` | `consolidate_browser_rls_policies` |
| `20260926012944` | `harden_public_security_definer_rpc_runtime` |
| `20260926015559` | `harden_authenticated_security_definer_rpc_timeouts` |
| `20260926020539` | `close_direct_profile_delete_authority` |
| `20261006055146` | `pause_community_direct_messaging_rpc_client_grants` |

Três arquivos `main` sem nome correspondente no histórico remoto e que
**não devem ser implicitamente classificados como seguros para aplicação**:

- `20260921224500_project_business_search_coordinates_from_address.sql`
- `20260927170000_territory_first_public_snapshot_urls.sql`
- `20261002175500_harden_professional_trust_reputation_search_path.sql`

O workflow histórico `.github/workflows/supabase-main-db-push.yml`
admitia exatamente cinco versões `20260821001800`, `20260821002600`,
`20260821011000`, `20260821022500`, `20260821024000`,
**que não aparecem nem nos arquivos atuais da `main`, nem no histórico
remoto**. Isso prova que o gate antigo já estava desatualizado antes das
PRs Address.

## Efeito no MVP

- **PR #658** — migração `20261008215900`, escrita trusted, 7/7 CI
  aprovados no último HEAD auditado.
- **PR #657** — migração `20261008220000`, leitura privada/projeção pública,
  7/7 CI aprovados no último HEAD auditado.
- Essas duas migrações **não foram aplicadas à produção**. Ainda existem
  grants permissivos de verificação; o histórico divergente bloqueia um
  `db push` profissional mesmo após merges.
- **PR #621** (release candidate), issues #305 (Data API), #445 (Vercel)
  e #649 (transação Business/Address) mantêm seus gates independentes.

## Correção segura, sem legado funcional e com SSOT

1. **Preservar o histórico de produção como evidência de execução**, sem
   `migration repair`, inserção manual de linhas, `db reset`, `db pull`
   destrutivo, SQL reexecutado, ou aplicação automática de versões pendentes.
2. Para as 17 versões cujo conteúdo coincide (exato ou whitespace final),
   avaliar reconciliação do **nome/timestamp de fonte** com o identificador
   efetivamente registrado, verificando ordem de dependências e novos
   bancos do zero. Não editar SQL já executado só para adequar a um nome.
3. Para as sete versões com SQL divergente, recuperar o conteúdo histórico
   versionado e comparar comandos, efeitos e dependências; decidir caso a
   caso se houve correção posterior já aplicada ou delta que precisa de uma
   **nova migration específica**, com testes PostgreSQL reais. Jamais
   reexecutar a versão local antiga presumindo equivalência.
4. Auditar individualmente as três migrations ainda sem correspondente
   remoto. Verificar se dependências e efeitos foram incorporados por
   outra migração, não assumir que ficaram pendentes apenas porque falta
   a versão.
5. Reexecutar a auditoria de versões **na `main` remota atual** antes da
   implantação. O gate canônico deve falhar fechado para qualquer versão
   remota sem arquivo histórico ou versão local fora da allowlist revisada.
   `tools/ci/verify-supabase-migration-lineage.mjs` agora centraliza
   essa verificação, com fixtures de teste.
6. Só após reconciliação e staging Supabase/Auth, revisar a allowlist
   canônica e autorizar explicitamente a aplicação **na ordem real**
   `20261008215900` → `20261008220000`, mais provas RLS/HTTP e
   rollback/recovery planejados.

**A auditoria é somente leitura. Este checkpoint não declara release,
migração concluída, banco alterado ou desbloqueio dos issues existentes.**
