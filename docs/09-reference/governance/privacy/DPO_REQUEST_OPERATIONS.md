# Admin LGPD request authority

Data: 2026-09-16

## Objetivo

Fechar a etapa operacional do canal DPO sem expor `privacy_subject_requests` diretamente ao navegador.

## Autoridade

- `submit-dpo-request` é o broker público de entrada; o navegador não grava no ledger diretamente;
- `admin-privacy-rpc` exige JWT e reutiliza `requireAdmin`, incluindo a política de MFA administrativa;
- as três RPCs administrativas de banco são `service_role` only e validam novamente `private.is_admin(actor_user_id)`;
- a listagem é paginada e omite `subject`/`message` para reduzir exposição de PII;
- detalhes completos são carregados apenas para um `request_id` específico;
- mudanças de estado passam por `admin_transition_privacy_subject_request`, com `FOR UPDATE` e máquina de estados explícita;
- estados terminais não são reabertos implicitamente;
- a página administrativa não oferece exportação em massa da caixa DPO.

## Superfície administrativa

A fila operacional está em `/admin/privacidade`, dentro da seção **Moderação e Segurança** do painel. O frontend usa `AdminPrivacyRequestsService`, que chama exclusivamente `admin-privacy-rpc` por meio do broker compartilhado de Edge Functions.

A listagem mostra apenas metadados necessários à triagem. `subject` e `message` só são requisitados quando um administrador abre uma solicitação individual para análise.

## Estados

- `received` -> `in_review` ou `cancelled`;
- `in_review` -> `waiting_for_requester`, `completed`, `denied` ou `cancelled`;
- `waiting_for_requester` -> `in_review`, `completed`, `denied` ou `cancelled`;
- `completed`, `denied` e `cancelled` são terminais neste contrato.

## Estado remoto verificado

Em 2026-09-16:

- `privacy_subject_requests` permanece protegido por RLS/FORCE RLS e sem DML direto de `anon`/`authenticated`;
- `admin_list_privacy_subject_requests`, `admin_get_privacy_subject_request` e `admin_transition_privacy_subject_request` existem no projeto remoto;
- `anon` e `authenticated` não possuem `EXECUTE` nessas RPCs; `service_role` possui;
- `admin-privacy-rpc` está implantada com `verify_jwt=true`;
- o ledger estava vazio na última verificação remota.

Essas verificações comprovam schema, grants e implantação. Um fluxo HTTP autenticado completo pelo painel ainda deve ser tratado como uma validação E2E separada, não inferido apenas pelo estado `ACTIVE` da função.

## Escopo preservado

Nenhuma alteração desta rodada toca mobilidade, cadastro, SMTP, Resend ou confirmação de e-mail.

## Pendências separadas

A matriz `user-export-data` continua bloqueada até concluir sua certificação de completude LGPD. A existência do canal DPO e da fila administrativa não autoriza habilitar esse exportador.
