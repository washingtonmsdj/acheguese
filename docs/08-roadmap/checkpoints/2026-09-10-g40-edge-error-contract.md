# G40 — Edge HTTP error contract + fechamento do creator legado

Data: 2026-09-10
Branch de execução: `main`
Baseline funcional deste checkpoint: `878e06d2589585c1875985cd2b45d6e2feae9bc0`

## Objetivo

Fechar fragilidades encontradas durante a consolidação G39 sem reabrir autoridade de browser:

1. remover fisicamente o criador legado `ProfessionalLeadService.createLead`, já sem callers runtime;
2. tratar corretamente respostas HTTP 4xx/5xx de Supabase Edge Functions, preservando o erro estruturado devolvido pelo servidor em vez de reduzi-lo à mensagem genérica do SDK;
3. tornar a fixture operacional de leads compatível com o futuro cutover que revoga `INSERT` de `anon/authenticated`, sem enfraquecer RLS ou grants do produto.

## Mudanças aplicadas na `main`

- `f0658184` — começou o mapeamento explícito dos outcomes do intake profissional;
- `f679467f` — adicionou cobertura unitária do `ProfessionalLeadIntakeService`;
- `86d92e03` — removeu fisicamente `ProfessionalLeadService.createLead` e seus helpers/imports mortos, mantendo leitura, mensagens, propostas, lifecycle de atendimento e avaliações;
- `71d3c42b` — converteu o teste G39 em ratchet: o creator legado, `normalizeLeadInput` e `CreateProfessionalLeadInput` não podem reaparecer no serviço antigo;
- `08c5f04b` + `d4427825` — adicionaram o adapter canônico `readSupabaseFunctionHttpErrorBody` dentro de `src/integrations/supabase`, mantendo `@supabase/supabase-js` fora de `core`;
- `9d8be3fd` + `97b84906` — o intake profissional passou a ler o body de `FunctionsHttpError` e mapear `invalid_payload`, profissional indisponível, falha de verificação/configuração, sessão inválida, rate-limit e falha de persistência sem afrouxar o fail-closed;
- `beb6c0d2` + `4c430e1e` — o broker genérico de Edge Functions passou a preservar `error`/`message` estruturado de respostas 4xx/5xx, evitando que outros módulos percam contexto útil;
- `3b52d362` — cobertura do adapter com `FunctionsHttpError` real, incluindo JSON válido, erro não HTTP e body inválido;
- `55b25cd0` — a criação da fixture técnica de `professional_leads` saiu do cliente autenticado e passou para `createOptionalOperationalAdminClient()`, que exige `service_role` e target E2E aprovado; mensagens, propostas, aceite, atendimento e avaliação continuam exercitados pelo usuário autenticado;
- `878e06d2` — adicionou ratchet de segurança para impedir que a fixture volte a usar `client.from("professional_leads").insert(...)`.

## Causa raiz confirmada

O SDK Supabase retorna respostas não-2xx como `FunctionsHttpError`; o payload da Edge Function fica em `error.context`/`Response`, não em `data`. Portanto, tratar apenas `data` ou apenas `error.message` perde o contrato de erro autoritativo do servidor.

A correção foi colocada na integração Supabase e reutilizada pelo broker transversal para não duplicar conhecimento do provider dentro dos módulos de domínio.

## Segurança / autoridade

- nenhum grant foi ampliado;
- nenhum SQL pendente foi aplicado;
- nenhum writer direto de produção foi restaurado;
- `ProfessionalLeadService.createLead` foi removido somente depois de busca de callers runtime confirmar que o diálogo público usa `ProfessionalLeadIntakeService`;
- a fixture técnica não depende mais do futuro grant browser que será revogado: o único `INSERT` de setup em `professional_leads` usa autoridade `service_role` somente quando o helper reconhece um target operacional isolado aprovado;
- o restante do E2E continua no cliente autenticado para que RLS e owners reais de mensagens/propostas/atendimento/reviews continuem sob teste;
- o SQL destrutivo G39 continua exclusivamente em `docs/09-reference/migrations-pending/20260910133000_finalize_professional_lead_intake_g39.sql`.

## Residual E2E após G40

O resíduo de fixture direta autenticada em `professional_leads` foi fechado em `55b25cd0`/`878e06d2`.

Isso **não substitui** os smokes públicos exigidos para certificar o ingress real. Antes do cutover ainda é obrigatório provar separadamente o fluxo anônimo e o autenticado passando por `create-professional-lead` + Turnstile, porque a fixture admin existe apenas para preparar de forma determinística o pipeline operacional E2E.

## Validação disponível neste ambiente

Os pushes anteriores dispararam `SSOT Enforcement` e `Security Check`, porém os jobs encerraram como `failure` antes de executar steps e sem logs de job disponíveis. Logo, esse sinal não prova erro de código nem aprovação dos gates.

O status de Vercel continua bloqueado por `build-rate-limit`, portanto também não existe novo build production certificado para este baseline.

Até existir executor válido, considerar os testes adicionados como **cobertura implementada, não execução comprovada**.

## Gate preservado para o cutover G39

Não mover/aplicar a migration pendente até cumprir todos os itens:

1. frontend G39/G40 LIVE no mesmo SHA ou descendente certificado;
2. smoke anônimo por `create-professional-lead` aprovado;
3. smoke autenticado por `create-professional-lead` aprovado;
4. zero caller LIVE do creator direto legado;
5. security/architecture/typecheck/build executados de verdade e verdes.

O item anterior de compatibilidade das fixtures com a revogação de browser `INSERT` foi concluído no G40 e agora está protegido por ratchet.

## Próxima ação recomendada

1. executar os testes focados G39/G40, adapter Supabase e broker transversal assim que houver executor válido;
2. executar gates globais de arquitetura/segurança/typecheck/build;
3. publicar o frontend no SHA/descendente certificado e provar os smokes anônimo e autenticado do broker;
4. somente então executar o cutover transacional de leads + `professional_stats`.
