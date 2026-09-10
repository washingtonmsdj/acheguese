# Checkpoint G38 — Professional authority e stats server-owned

**Data:** 2026-09-10  
**Repositório:** `washingtonmsdj/acheguese`  
**Main validada:** `37144731fcf913fa4e4c488a5aa57b290d2eeeb2`  
**Branch visual sincronizada:** `2d9737402a61ab8a5137c9acf455c5f23d4d3085`

Este checkpoint registra o estado real do G38. Código versionado, runtime Edge, banco e deploy web são tratados separadamente; nenhum deles deve ser inferido como concluído a partir dos outros.

## 1. Admin Professional — broker canônico

Concluído no Git:

- `AdminServicos` deixou de possuir o writer privilegiado direto de disponibilidade em `professional_data`;
- mutação administrativa passa pelo broker dedicado `admin-professional-rpc`;
- o broker aceita apenas a ação explícita `setAvailability`, autentica Admin e mantém whitelist fechada de payload;
- o broker usa `getSupabaseAdminClient()` e `requireAdmin()` compartilhados; não existe segundo client/admin authority local;
- ratchet `tests/security/admin-professional-authority-g38.test.ts` protege o contrato.

Concluído no runtime Supabase:

- `admin-professional-rpc` está em **v6 ACTIVE**;
- `verify_jwt=true`;
- entrypoint + `_shared/adminAuth.ts` + `_shared/security.ts` foram redeployados a partir do source canônico da `main`;
- o runtime devolvido pelo Supabase corresponde ao conteúdo enviado da `main`.

## 2. `professional_stats` — writer do browser removido do código

Concluído no Git:

- `ProfessionalLeadService.createLead()` não executa mais incremento pós-insert no browser;
- removidos o read-modify-write de `contacts_count`, `upsert`, o tipo `ProfessionalStatsContactsRow` e o helper `getProfessionalOwner` que existia somente para esse contador;
- migration `20260910133000_server_own_professional_stats_contacts_g38.sql` define `private.increment_professional_contacts_from_lead()`;
- o evento autoritativo passa a ser o `INSERT` de `professional_leads`, com incremento de `professional_stats.contacts_count` no mesmo transaction boundary via trigger;
- a migration também revoga `INSERT/UPDATE/DELETE` de `PUBLIC`, `anon` e `authenticated` em `professional_stats` e remove a policy histórica `Owners manage own professional stats`;
- `SELECT` permanece sob as policies existentes;
- ratchet `tests/security/professional-stats-authority-g38.test.ts` impede retorno do writer direto.

## 3. Runtime DB — ainda NÃO aplicado

A migration G38 de `professional_stats` **não deve ser marcada aplicada** neste checkpoint.

Foram feitas tentativas controladas de `apply_migration`, todas falhando antes de inicializar o histórico com:

`Failed to initialise history table: Connection terminated due to connection timeout`

A própria listagem de migrations também falhou com:

`Failed to list database migrations: Connection terminated due to connection timeout`

O projeto Supabase continua respondendo pelas APIs de projeto/Edge e foi observado como `ACTIVE_HEALTHY`; o blocker atual está no canal administrativo SQL/database usado pelo conector. Não há evidência de DDL parcial e nenhuma nova tentativa deve ser tratada como sucesso sem leitura posterior de trigger, grants e policy.

### Prova obrigatória quando o SQL voltar

Antes de fechar G38 DB:

1. aplicar `server_own_professional_stats_contacts_g38` exatamente do source versionado;
2. confirmar trigger `professional_leads_increment_contacts` ativo em `public.professional_leads`;
3. confirmar `authenticated/anon/PUBLIC` sem `INSERT/UPDATE/DELETE` em `professional_stats`;
4. confirmar a policy `Owners manage own professional stats` ausente;
5. executar probe transacional: criar lead elegível e provar incremento exatamente +1 no Profile profissional; rollback ao final;
6. confirmar que leitura autorizada de stats continua funcional.

## 4. `professional_data` — NÃO revogar grants ainda

O broker Admin novo está pronto, mas o cutover global de DML de `professional_data` continua bloqueado até o frontend novo estar comprovadamente LIVE no mesmo SHA funcional.

Não revogar `INSERT/UPDATE/DELETE` de compatibilidade de `professional_data` somente para “fechar” o checklist enquanto a produção web estiver em SHA anterior. O objetivo é retirar a autoridade antiga sem quebrar callers do frontend publicado.

## 5. Vercel / same-SHA

O SHA atual da `main` recebeu status Vercel:

`Deployment rate limited — retry in 24 hours.`

Logo:

- isto é blocker externo de execução;
- não é falha de compilação provada;
- também não é certificação de build;
- a produção não deve ser declarada reconciliada com G38 até existir deployment READY do SHA correspondente ou descendente funcionalmente equivalente.

## 6. Identidade visual — sincronização sem regressão

A branch `codex/identidade-visual-achegue-se` foi sincronizada com a `main` por merge de dois pais, sem force-push.

Resultado validado após o merge:

- `behind_by=0` em relação à `main`;
- a `main` é merge-base atual;
- os únicos arquivos que permanecem como delta visual são:
  - `src/app/components/territory-vivo/TerritoryAdaptiveNavigation.tsx`;
  - `src/app/components/territory-vivo/TerritoryMapPreview.tsx`;
  - `src/app/pages/BuscaPage.tsx`;
  - `src/shared/components/territory-vivo/TerritoryTopbar.tsx`.

Isso mantém a política desejada: correções estruturais da `main` chegam à branch visual, enquanto experimentos/ajustes de UI continuam isolados até integração deliberada na `main`.

## Próximo gate

1. quando o canal SQL do Supabase responder, aplicar e provar o cutover de `professional_stats`;
2. obter build/deploy web READY do SHA funcional novo quando o rate limit do Vercel permitir;
3. somente após frontend novo LIVE, auditar zero callers antigos e preparar o cutover de grants de `professional_data`/`profiles` ainda mantidos por compatibilidade;
4. preservar a branch visual como linha de trabalho de UI, sempre trazendo a `main` sem force-push e sem sobrescrever deltas visuais ativos;
5. continuar correções por owner/SSOT real, sem recriar writers browser, wrappers de compatibilidade ou authorities paralelas.
