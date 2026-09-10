# Checkpoint G39 — Professional Lead Intake server-owned

**Data:** 2026-09-10  
**Autoridade funcional:** `main`  
**Estado:** código e Edge aditivos concluídos; cutover destrutivo deliberadamente pendente de frontend LIVE + smoke.

## Causa raiz corrigida

O pedido público de orçamento ainda nascia por `INSERT` direto do browser em `professional_leads`. O frontend LIVE também incrementava `professional_stats.contacts_count` depois do insert. Ativar o trigger G38 antes do novo frontend ficaria incorreto: o mesmo lead poderia ser contado duas vezes e a criação pública continuaria exposta a abuso volumétrico sem verificação server-side.

## Fechado no Git

- `9b01a9a3` consolida o intake público em `ProfessionalLeadIntakeService` + Edge Function `create-professional-lead`;
- o formulário usa `TurnstileWidget`, honeypot e tempo mínimo de preenchimento;
- o payload público não aceita `requester_user_id`, `requester_profile_id`, `priority` ou `metadata`;
- identidade autenticada e perfil ativo são derivados no servidor; token inválido/expirado falha com 401 em vez de degradar para anônimo;
- o broker valida origin, método, limite de body, rate-limit, Turnstile action `professional-lead`, Professional ativo/disponível e deduplicação recente;
- a resposta pública expõe apenas o `id` do lead;
- `supabase/config.toml` e `EDGE_FUNCTION_AUTH_POLICY.json` classificam explicitamente o endpoint público `verify_jwt=false` como broker crítico com service-role governado;
- a migration G38 destrutiva saiu de `supabase/migrations` e virou cutover pendente em `docs/09-reference/migrations-pending/20260910133000_finalize_professional_lead_intake_g39.sql`;
- `3e68743b` atualiza o ratchet G38 para exigir que esse cutover continue fora da fila automática e que a futura revogação de `professional_leads` + `professional_stats` aconteça no mesmo corte;
- busca de código após o cutover do frontend no Git confirmou zero caller runtime de `ProfessionalLeadService.createLead`; os hits restantes são documentação/teste de migração. A remoção física desse método legado fica em commit isolado para não misturar reescrita de serviço grande com release/governança.

## Runtime Supabase

- `create-professional-lead` está **v2 ACTIVE**, `verify_jwt=false`;
- a função foi redeployada com entrypoint e shared helpers canônicos da `main`;
- `admin-professional-rpc` permanece **v6 ACTIVE**, `verify_jwt=true`;
- nenhuma migration de cutover G38/G39 foi aplicada.

## Release / Vercel

- produção conhecida continua no SHA `ba691ca64d7dc7088bd96b353c6583747c7a2c3e`;
- o SHA G39 recebeu `Deployment rate limited — retry in 24 hours` da Vercel;
- isto é blocker externo de build/deploy, não certificação positiva nem erro de compilação;
- como o frontend G39 ainda não está comprovadamente LIVE, é proibido mover/aplicar o SQL pendente.

## Gate obrigatório para o cutover DB

Somente promover `docs/09-reference/migrations-pending/20260910133000_finalize_professional_lead_intake_g39.sql` para `supabase/migrations` depois de comprovar, nesta ordem:

1. `create-professional-lead` ACTIVE e source reconciliado;
2. build/deploy do frontend G39 no mesmo SHA ou descendente funcionalmente equivalente;
3. produção LIVE usando `ProfessionalLeadIntakeService` exclusivamente;
4. smoke anônimo e autenticado pelo broker com Turnstile válido;
5. ausência de caller LIVE do criador direto legado;
6. aplicação transacional do cutover;
7. pós-condições: browser sem `INSERT` em `professional_leads`, browser sem DML em `professional_stats`, service_role preservado e trigger ativo;
8. validar que um lead criado pelo broker incrementa `contacts_count` exatamente uma vez.

## Não fazer

- não reintroduzir `INSERT` público direto em `professional_leads`;
- não ativar o trigger antes do frontend novo LIVE;
- não aceitar identidade/lifecycle vindos do cliente;
- não contornar Turnstile/rate-limit para liberar o release;
- não declarar G39 concluído no banco enquanto o SQL estiver em `migrations-pending`.
