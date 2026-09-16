# Admin LGPD request authority

Data: 2026-09-16

## Objetivo

Fechar a etapa operacional do novo canal DPO sem expor `privacy_subject_requests` diretamente ao navegador.

## Autoridade

- `admin-privacy-rpc` exige JWT e reutiliza `requireAdmin`, incluindo a política de MFA administrativa;
- as três RPCs de banco são `service_role` only e validam novamente `private.is_admin(actor_user_id)`;
- a listagem é paginada e omite `subject`/`message` para reduzir exposição de PII;
- detalhes completos são carregados apenas para um `request_id` específico;
- mudanças de estado passam por `admin_transition_privacy_subject_request`, com `FOR UPDATE` e máquina de estados explícita;
- estados terminais não são reabertos implicitamente.

## Estados

- `received` -> `in_review` ou `cancelled`;
- `in_review` -> `waiting_for_requester`, `completed`, `denied` ou `cancelled`;
- `waiting_for_requester` -> `in_review`, `completed`, `denied` ou `cancelled`;
- `completed`, `denied` e `cancelled` são terminais neste contrato.

## Escopo preservado

Nenhuma alteração desta rodada toca mobilidade, cadastro, SMTP, Resend ou confirmação de e-mail.

## Próximo passo

Depois do backend remoto e dos testes de autoridade, conectar uma página administrativa dedicada de Privacidade/LGPD à nova Edge Function. A matriz `user-export-data` continua bloqueada e não é promovida nesta etapa.
