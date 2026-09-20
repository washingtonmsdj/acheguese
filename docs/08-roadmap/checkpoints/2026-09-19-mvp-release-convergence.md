# MVP — Convergência Git, Supabase e CI — 2026-09-19

Status: **REVALIDAÇÃO DE RELEASE EM ANDAMENTO**

Base observada nesta revalidação: `0c6cdb8a84f0e3e5f40c1e586075686a413a67d7` ou descendente sem alteração dos fatos abaixo.

Este checkpoint atualiza os blockers operacionais do primeiro release sem reescrever snapshots históricos. A autoridade continua sendo o projeto real + runtime observado.

## GitHub Actions

Os workflows recentes continuam falhando antes de executar código:

- jobs encerram com `steps: null`/sem steps;
- logs de job não são produzidos;
- evidência histórica e atual registra `runner_id=0` e `runner_name=""`;
- no head do PR #208 falharam Security Check, SSOT Enforcement, Security Scan e SSOT Territorial Tests sem executar um primeiro step;
- Heavy PR Certification permaneceu em fila.

Conclusão: **não há evidência de falha de lint/test/typecheck/source nesses runs**. O blocker é de execução/alocação/configuração administrativa do Actions até prova em contrário. Não alterar source/YAML às cegas para reagir a esses runs.

Próxima prova: usar GitHub CLI/API autenticada fora do conector para verificar Actions permissions, quota/billing/spending, inventário de runners e fila; se o hosted runner estiver indisponível, self-hosted runner pode ser preparado como fallback sem remover os gates.

## Supabase canônico

Projeto: `xhdowzacfujckjelqhtd` (`acheguese`)

Estado observado: `ACTIVE_HEALTHY`.

O projeto `acheguese-v2` inativo não é o alvo de release.

### Migrations

O ledger remoto observado agora contém **664 migrations**.

Últimas migrations observadas:

- `20260919003851_transactional_location_visibility_cascade_g42`;
- `20260919003900_create_territorial_group_admin_commands_g43`.

A contagem remota agora coincide com a contagem local conhecida de 664 arquivos, mas **paridade de contagem não é paridade de identidade/conteúdo**.

A autoridade de aceite continua sendo:

```bash
npm run validate:migrations
npm run validate:migrations:provenance
npm run validate:migrations:remote
```

`validate:migrations:remote` só pode marcar PASS com zero aliases, zero conflicts, zero local-only, zero remote-only e nenhuma versão local duplicada. Até essa execução ocorrer num checkout local linkado ao Supabase, não declarar o ledger completamente reconciliado e não executar `supabase db push --linked`.

### Tipos gerados

`src/integrations/supabase/types.generated.ts` da `main` foi comparado com `generate_typescript_types` do Supabase vivo.

Resultado:

- PostgREST remoto: `14.5`;
- arquivo Git: `14.5`;
- tamanho normalizado em ambos: **729024 bytes/caracteres de texto**;
- comparação normalizada: **exact_equal=true**;
- primeiro diff: inexistente.

Conclusão: **drift de tipos gerados está fechado no estado observado**. Não manter esse item como blocker genérico sem nova evidência.

### Edge Functions

Estado remoto observado:

- **60 Edge Functions ACTIVE**;
- todas as 60 existem em `supabase/config.toml`;
- zero função remota sem declaração local;
- zero divergência de `verify_jwt` entre remoto e config.

O config versiona 68 funções. Oito estão versionadas/configuradas, mas não implantadas:

1. `admin-create-user`;
2. `admin-get-user-auth-summary`;
3. `ai-image`;
4. `ai-text`;
5. `ai-vision`;
6. `resend-emergency-webhook`;
7. `user-delete-account`;
8. `user-export-data`.

Classificação para o corte público atual:

- `admin-create-user`: admin/super-admin; não é superfície pública do MVP;
- `admin-get-user-auth-summary`: admin-only; o loader atual falha fechado para `null`;
- `ai-text`: usado no intent parser da Busca, porém `IntentParser` possui fallback canônico `RuleBasedAIProvider`;
- `ai-image`: não foi encontrado consumidor runtime além do hook/base versionado;
- `ai-vision`: não foi encontrado consumidor runtime ativo;
- `resend-emergency-webhook`: pertence ao fluxo de emergency delivery/safety ligado à frente de Mobilidade/Safety, ambos fora do primeiro release público;
- `user-delete-account`: legado destrutivo explicitamente bloqueado pelo preflight LGPD; não implantar;
- `user-export-data`: feature de produção continua `VITE_FEATURE_PRIVACY_DATA_EXPORT=false` e rollout permanece bloqueado até certificação da matriz LGPD.

Conclusão: **as oito ausências não são, por si só, blocker do escopo público atual**. Não implantá-las em lote para obter paridade numérica. Qualquer rollout futuro deve seguir o preflight e a authority específica da função.

## Security Advisor

Revalidação viva em `2026-09-19T23:58:36.141Z`:

- 19 `rls_enabled_no_policy` — INFO;
- 1 `rls_disabled_in_public` — ERROR, `public.spatial_ref_sys`;
- 4 `extension_in_public` — WARN;
- 9 `anon_security_definer_function_executable` — WARN;
- 84 `authenticated_security_definer_function_executable` — WARN;
- 1 `auth_leaked_password_protection` — WARN.

Total: 118 findings; **99 não-INFO**.

Todos os 99 findings não-INFO atuais possuem classificação no registro canônico `SUPABASE_ADVISOR_RESIDUALS.json`. Nenhum finding não-INFO novo ficou sem classificação.

O PR #209 removeu duas exceções antigas que já não aparecem no Advisor, reduzindo o registro de 101 para 99 residuais.

`public.spatial_ref_sys` é objeto extension-owned do PostGIS e já possui guards de browser write. O projeto proíbe alterar ownership/RLS desse objeto por migration comum sem preflight de owner/plataforma. **Não criar hack de RLS apenas para silenciar o Advisor.**

## Blockers de release que permanecem

1. Executar o GitHub Actions de verdade em runner válido e obter security/lint/typecheck/test/build no SHA candidato.
2. Executar `validate:migrations:remote` no checkout local linkado e fechar a prova das 664 identidades.
3. Completar branch protection/release authority depois que existir check executável.
4. Produzir build/deploy real do mesmo SHA aprovado; o provider Vercel vinha bloqueando novas provas pelo limite diário.
5. Executar smoke do domínio no mesmo SHA.
6. Certificar todas as superfícies `launchScope=true`; Vagas/Eventos continuam condicionais e podem ser pausados antes do release se não passarem pelo mesmo gate.

## Regra de continuidade

Não transformar blocker de infraestrutura em alteração de produto.

- Actions sem runner não autoriza remover checks.
- Igualdade de contagem de migrations não autoriza `db push`.
- Edge Function versionada e não implantada não autoriza deploy em massa.
- Finding conhecido do Advisor não autoriza alteração de ownership/policy fora da authority existente.
- Feature pausada/fail-closed não precisa ser concluída para o MVP se continuar inacessível e não for prometida pela UI.

## Atualização — Vagas runtime reconciliado — 2026-09-19

A auditoria viva do Supabase encontrou um blocker real na superfície `jobs=true`:

- `public.vagas` ainda usava `vaga_status = ativa/pausada/encerrada/preenchida`;
- a policy pública já exigia `published`, portanto o catálogo público não conseguia expor as vagas legadas;
- `vaga_modalidade` e `vaga_nivel` também permaneciam no formato antigo, enquanto a tela de publicação grava os valores canônicos;
- vários campos já consumidos por `VagasService` ainda não existiam no runtime;
- `VagasService` consultava `search_vector`, mas a coluna não existia;
- as 15 linhas existentes eram dados de demonstração: 13 do seed histórico `seed_vagas` e 2 marcadas `MOCK_FEED_SEED_V1`;
- as 15 linhas possuíam zero candidaturas, zero denúncias e zero itens salvos.

Correção aplicada:

- PR #216 / commit `6c8377af26cb64fdad518ccd8934ad7cde3592aa`;
- migration remota canônica `20260920004231_reconcile_vagas_runtime_mvp`;
- 15 seeds removidos com guard explícito de engajamento;
- `vaga_status`, `vaga_contrato`, `vaga_modalidade` e `vaga_nivel` reconciliados ao contrato do app;
- campos canônicos de detalhe/candidatura/SEO adicionados e compatibilidade antiga backfilled;
- `search_vector` agora é coluna `tsvector` gerada e indexada;
- policies duplicadas de admin foram removidas; owner/public ficaram na authority canônica;
- `vaga_applications_insert` foi preservada e agora referencia o enum canônico;
- `trg_enqueue_vaga_match_notifications` foi removido/recriado transacionalmente e permanece ativo;
- pós-check vivo confirmou zero seed e zero mock no domínio Vagas.

O Supabase registrou a migration em `20260920004231`. O filename Git foi realinhado a essa identidade e `src/integrations/supabase/types.generated.ts` foi regenerado diretamente do runtime. A comparação normalizada Git ↔ Supabase retornou `exact=true`.

**Estado:** o drift estrutural de Vagas e o drift de tipos gerados não devem mais ser tratados como blockers genéricos. A superfície ainda precisa do gate executável/E2E e smoke exact-SHA antes do release, como todo o restante do MVP. O banco agora contém zero vagas fictícias; até haver publicação real, a UI deve mostrar empty state verdadeiro.

