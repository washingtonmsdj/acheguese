# MVP — Convergência Git, Supabase e CI — 2026-09-19

Status: **REVALIDAÇÃO DE RELEASE EM ANDAMENTO**

Base técnica observada nesta revalidação: `f45ec30501b91716182fdc1eb10ec38d3807281c`. O commit deste checkpoint pode ser descendente apenas documental; qualquer alteração funcional posterior exige nova prova.

Este checkpoint atualiza os blockers operacionais do primeiro release sem reescrever snapshots históricos. A autoridade continua sendo o projeto real + runtime observado.

## GitHub Actions

Os workflows do SHA `f45ec305...` continuam falhando antes de executar código:

- Security Check (`35482298437`): `Lint and Type Check`, `Run Tests`, `Maps Architecture Enforcement` e `Validate No Hardcoded Credentials` terminaram com `steps: null`;
- SSOT Enforcement (`35482298618`): `SSOT Enforcement Checks` terminou com `steps: null`;
- SSOT Territorial Tests (`35482298511`): E2E, Phase Core Gate, Account + Business E2E, Runtime Tests e agregação terminaram sem steps; `Regression Check` foi `skipped`;
- Supabase Types Sync (`35482298480`) estava `queued` na observação e não conta como aprovação.

Conclusão: **não há evidência de falha de lint/test/typecheck/source nesses runs**. O blocker é de execução/alocação/configuração administrativa do Actions até prova em contrário. Não alterar source/YAML às cegas para reagir a esses runs.

Próxima prova: usar GitHub CLI/API autenticada fora do conector para verificar Actions permissions, quota/billing/spending, inventário de runners e fila; se o hosted runner estiver indisponível, self-hosted runner pode ser preparado como fallback sem remover os gates.

## Supabase canônico

Projeto: `xhdowzacfujckjelqhtd` (`acheguese`)

Estado observado: `ACTIVE_HEALTHY`.

O projeto `acheguese-v2` inativo não é o alvo de release.

### Migrations

O ledger remoto observado contém **666 migrations** e, após este corte, a árvore Git contém **686 arquivos locais**. As **666 identidades remotas passam a existir no Git**; permanecem **20 arquivos somente locais** que ainda exigem prova de supersessão/necessidade.

Últimas migrations remotas observadas:

- `20260919003851_transactional_location_visibility_cascade_g42`;
- `20260919003900_create_territorial_group_admin_commands_g43`;
- `20260920004231_reconcile_vagas_runtime_mvp`;
- `20260920012056_allow_phone_only_community_interest_mvp`.

O PR #225 reconciliou somente dois pares cuja equivalência foi provada por conteúdo e reconstrução do array `statements` remoto: `retire_private_alpha_signup_gate` e `tighten_privacy_subject_request_runtime_grants`. Nenhum DDL foi executado. Os cinco outros pares recentes de mesmo nome apresentaram diferença material de SQL e permanecem bloqueados para análise de provenance; **não renomear nem aplicar por aproximação**.

A autoridade de aceite continua sendo:

```bash
npm run validate:migrations
npm run validate:migrations:provenance
npm run validate:migrations:remote
```

`validate:migrations:remote` só pode marcar PASS com zero aliases, zero conflicts, zero local-only, zero remote-only e nenhuma versão local duplicada. Este corte fecha `remote-only=0`, mas ainda deixa **20 local-only**; portanto **não executar `supabase db push --linked`**. A próxima ação é provar, um a um, quais desses 20 arquivos são drafts/superseded e quais ainda pertencem ao bootstrap canônico.

### Tipos gerados

`src/integrations/supabase/types.generated.ts` da `main` foi comparado com `generate_typescript_types` do Supabase vivo.

Resultado:

- PostgREST remoto: `14.5`;
- arquivo Git: `14.5`;
- tamanho normalizado em ambos: **731731 caracteres de texto**;
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
2. Fechar o drift de migrations até o gate remoto atingir zero divergências; estado atual após Safety provenance: 686 locais / 666 remotas / 666 exatas / 20 local-only / 0 remote-only.
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

## Atualização — fechamento de superfícies e provenance — 2026-09-19

Após a reconciliação de Vagas, o corte urgente avançou em quatro frentes sem ampliar escopo de produto:

- **PR #221:** cadastro de interesse deixou de criar identidade sintética de e-mail; o runtime recebeu `20260920012056_allow_phone_only_community_interest_mvp` e aceita telefone como canal real quando o formulário o fornece;
- **PR #223:** o fluxo público de publicação de Vagas perdeu o estado morto `destaque` e não consegue mais gravar `highlightType="premium"` enquanto Billing está pausado; urgência continua mapeando somente para `featured`;
- **PR #224:** `DEMO-READY.md`, `PROJECT-HEALTH-REPORT.md` e `PROJECT-SCORE.md`, já classificados como históricos, foram movidos de `docs/01-product` para `docs/10-archive/product` sem perda de conteúdo, eliminando instruções antigas de demo fictícia da árvore documental ativa;
- **PR #225:** duas identidades de migration comprovadamente equivalentes foram alinhadas ao ledger remoto sem executar DDL; os demais mismatches foram preservados para investigação porque não possuem prova suficiente de equivalência.

### Diagnóstico operacional após #225

- Supabase canônico: `ACTIVE_HEALTHY`;
- Edge Functions implantadas: 60, todas `ACTIVE`;
- tipos gerados Git ↔ Supabase: `exact=true`, 731731 caracteres normalizados;
- migrations: 683 locais / 666 remotas / 649 exatas / 34 local-only / 17 remote-only;
- Vercel no SHA auditado: status de falha por build rate limit, portanto sem nova prova de deploy;
- `main` está protegida, porém o endpoint acessível mostra required status checks sem enforcement/contextos; a leitura completa da branch protection não está disponível à integração atual. Não declarar release authority fechada com essa evidência parcial.

**Próximo gate:** tratar a divergência do ledger por provenance e estado remoto, sem `db push` global. Priorizar os registros G71/G72/G75–G80 e os remotos G42/G43, pois já existem checkpoints de runtime que permitem separar migrations superseded/reconciliadas de DDL realmente ausente.

## Atualização — provenance Safety G71/G72/G75–G80 — 2026-09-19

A comparação do SQL local antigo com as oito migrations `reconcile_*` realmente registradas no ledger remoto foi feita por tokenização SQL, ignorando apenas whitespace, comentários e wrappers transacionais. Os oito pares retornaram a mesma sequência de tokens.

Consequência:

- os oito filenames locais históricos foram alinhados às versões/names reais do ledger remoto;
- o conteúdo SQL legível foi preservado porque é semanticamente idêntico ao aplicado;
- testes que leem esses artefatos foram apontados para as identidades canônicas;
- nenhum SQL foi reaplicado e nenhum dado/schema/runtime foi alterado;
- a paridade de identidade melhora de 649 para 657 migrations exatas; local-only cai de 34 para 26 e remote-only de 17 para 9.

Continuam sem reconciliação: pricing/cancellation de Mobilidade, G42/G43 territoriais e o conjunto local-only restante. Não inferir equivalência sem a mesma prova de provenance.

## Atualização — pricing/cancelamento com equivalência comprovada — 2026-09-19

Quatro pares adicionais local ↔ remoto foram comparados por tokenização SQL e retornaram sequência de tokens idêntica:

- `20260916064000_remove_provisional_mobility_fare_floor` ↔ `20260916091805_remove_provisional_mobility_fare_floor`;
- `20260916123000_persist_mobility_cancellation_reason` ↔ `20260916093913_persist_mobility_cancellation_reason`;
- `20260916104000_enforce_server_owned_mobility_quotes` ↔ `20260916102110_enforce_server_owned_mobility_quotes`;
- `20260916113000_require_explicit_mobility_quote_id` ↔ `20260916104609_require_explicit_mobility_quote_id`.

As identidades locais foram alinhadas às versões realmente registradas no Supabase sem executar DDL. O teste que lê a migration de `quote_id` foi atualizado para o caminho canônico.

Estado naquele estágio: **683 locais / 666 remotas / 661 exatas / 22 local-only / 5 remote-only**.

Os cinco remote-only restantes são: três migrations da cadeia de preço terminal da entrega (`make_delivery_final_price_server_owned`, `restore_atomic_delivery_completion_with_server_owned_price`, `ignore_client_final_price_in_delivery_wrapper`) e as territoriais G42/G43. A cadeia terminal é materialmente diferente do draft local e exige reconstrução de provenance em grupo; não renomear automaticamente.

## Atualização — cadeia terminal de preço/entrega — 2026-09-19

A cadeia remota foi tratada como sequência, não como rename isolado:

1. `20260916112547_make_delivery_final_price_server_owned`: implementação monolítica passa a derivar preço terminal do estado server-owned;
2. `20260916113602_restore_atomic_delivery_completion_with_server_owned_price`: a mesma implementação base é materializada explicitamente em `private.mobility_transition_delivery_state_atomic_base_g70` e o wrapper público G70 fecha `delivered -> completed` atomicamente;
3. `20260916113754_ignore_client_final_price_in_delivery_wrapper`: o wrapper mantém a assinatura de rollout, mas passa `NULL::numeric` à base, ignorando autoridade monetária do cliente.

Provas:

- a função pública de `112547` e a base privada de `113602` têm a mesma sequência de tokens após normalizar somente o nome qualificado da função;
- o wrapper público de `113602` é token-a-token idêntico ao wrapper do antigo draft local G70;
- o wrapper de `113754` é token-a-token idêntico ao antigo draft local de server-owned price;
- a migration posterior `20260916233125_remove_mobility_delivery_final_price_compat` permanece e remove a compatibilidade `p_final_price` depois do cutover.

Os dois drafts locais foram substituídos pelas três identidades realmente registradas no ledger remoto. Nenhum DDL foi reaplicado.

Estado naquele estágio: **684 arquivos locais / 666 remotas / 664 identidades exatas / 20 local-only / 2 remote-only**. Os únicos remote-only eram G42 e G43 territoriais.


## Atualização — G42/G43 territoriais promovidas do staging histórico — 2026-09-20

A investigação encontrou as duas migrations `remote-only` já versionadas, porém incorretamente mantidas em `docs/09-reference/migrations-pending/`:

- G42 staging `20260910214500_transactional_location_visibility_cascade_g42.sql` ↔ ledger `20260919003851_transactional_location_visibility_cascade_g42`;
- G43 phase 1 staging `20260910220500_create_territorial_group_admin_commands_g43.sql` ↔ ledger `20260919003900_create_territorial_group_admin_commands_g43`.

Ambos os pares foram comparados token-a-token, ignorando apenas comentários, whitespace/case e wrapper transacional; os dois retornaram equivalência integral. Os artefatos foram promovidos para `supabase/migrations` com as identidades reais do ledger e removidos de `migrations-pending`. Testes e documentação passaram a apontar para os caminhos canônicos.

Revalidação viva confirmou `territorial-update-location-visibility`, `territorial-update-group-visibility`, `territorial-get-tree` e `territorial-group-admin-rpc` como `ACTIVE` com `verify_jwt=true`.

**Importante:** G43 phase 2 continua pendente. O frontend administrativo ainda usa `updateGroup()` + `replaceMembers()` do writer compatível; o DML browser não deve ser revogado antes de cutover e smoke AAL2. O arquivo `20260910221500_lock_territorial_group_writes_to_broker_g43.sql` permanece em `migrations-pending` de forma intencional.

Resultado do ledger após este corte: **686 locais / 666 remotas / 666 identidades remotas presentes no Git / 20 local-only / 0 remote-only**.
