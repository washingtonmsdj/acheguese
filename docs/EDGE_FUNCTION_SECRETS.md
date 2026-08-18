# Edge Function Secrets — Fluxo Canônico

Status: CANÔNICO  
Última atualização: 2026-08-18

## 1. Escopo

Este documento cobre secrets consumidos por `supabase/functions/*` e módulos `_shared` executados no runtime Deno/Supabase Edge Functions.

## 2. Regras obrigatórias

- secrets reais ficam no mecanismo de secrets/environment do Supabase;
- nenhuma Edge Function deve conter secret hardcoded;
- `SUPABASE_SERVICE_ROLE_KEY` é server-only;
- webhook secrets e provider keys são server-only;
- `Deno.env.get(...)` deve falhar fechado para secrets obrigatórios;
- ausência de secret obrigatório não pode ativar fallback permissivo de produção;
- logs não podem imprimir o valor de secrets;
- respostas de erro não podem refletir segredo, stack ou configuração interna.

## 3. Funções públicas

`verify_jwt=false` não significa automaticamente vulnerabilidade. É permitido quando o endpoint precisa ser chamado sem Supabase JWT e possui autenticação adequada ao protocolo.

Exemplos:

- webhook Stripe: validar `stripe-signature` sobre raw body usando `STRIPE_WEBHOOK_SECRET`;
- cron: validar `CRON_SECRET` ou mecanismo equivalente;
- endpoint público/anon: aplicar validação, rate limit e limitar autoridade ao mínimo necessário.

A validação de autenticidade deve ocorrer **antes** do uso de `service_role` ou mutação privilegiada.

## 4. CORS

CORS não autentica chamadas server-to-server. Para chamadas browser:

- origins de produção devem ser explícitas;
- ausência de configuração não pode liberar `*`;
- origem desconhecida deve ser bloqueada;
- `Vary: Origin` deve ser usado quando a origem permitida é refletida dinamicamente.

## 5. Adicionando um secret novo

- [ ] definir nome em maiúsculas e sem prefixo `VITE_`;
- [ ] documentar finalidade sem valor real;
- [ ] adicionar ao ambiente seguro do Supabase;
- [ ] usar helper de secret obrigatório quando apropriado;
- [ ] definir comportamento fail-closed quando ausente;
- [ ] testar ambiente sem o secret;
- [ ] testar fluxo válido;
- [ ] confirmar que logs e respostas não revelam o valor.

## 6. Rotação

Quando um secret muda:

1. gerar/obter a nova credencial no provedor;
2. atualizar Supabase secret;
3. publicar/revalidar a função consumidora;
4. confirmar fluxo positivo;
5. revogar credencial antiga assim que a transição permitir;
6. revisar logs/erros durante a janela de rotação.

Em webhooks, coordenar rotação com suporte de múltiplos secrets somente se o provedor exigir janela de transição; remover o antigo ao final.

## 7. Segurança compartilhada

As funções devem reutilizar os helpers de segurança canônicos do diretório `_shared` para método, CORS, body guard, erros, rate limit e auditoria quando aplicável.

O plano SEC-009 deve eliminar dependência de sincronização manual de valores de segurança entre runtimes por meio de geração ou validação automática.

Ver:

- [`SECURITY.md`](./SECURITY.md)
- [`audits/SECURITY-REMEDIATION-PLAN-2026-08.md`](./audits/SECURITY-REMEDIATION-PLAN-2026-08.md)
