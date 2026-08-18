# Segurança Operacional do Achegue-se

Status: CANÔNICO  
Última atualização: 2026-08-18  
Entrada pública: [`../SECURITY.md`](../SECURITY.md)

## 1. Objetivo

Definir as regras operacionais de segurança que devem permanecer verdadeiras no código, banco, storage, Edge Functions, CI/CD e produção.

Este documento descreve política. A prova executável deve existir em migrations, scripts, tests, probes e workflows sempre que possível.

## 2. Fronteiras de confiança

- Browser/client é não confiável.
- `anon` e `authenticated` não recebem autoridade implícita além das policies/RPCs explícitas.
- `service_role` é somente server-side/infra e nunca pode entrar em bundle, `VITE_*`, localStorage ou resposta ao cliente.
- Dados territoriais/publicáveis não tornam automaticamente dados privados de entidade, perfil, mensagem, billing ou safety públicos.
- Cada domínio deve declarar ownership, autoridade de mutação e interface pública canônica.

## 3. Banco e RLS

- Tabelas de aplicação expostas via API devem usar RLS, salvo exceção documentada de infraestrutura.
- Policies devem ser mínimas e preferir ownership/membership explícitos.
- `SECURITY DEFINER` exige justificativa, grants mínimos, autorização interna quando necessário e `search_path` controlado.
- Views privilegiadas exigem revisão de semântica e teste de exposição.
- Mudanças de banco devem ser versionadas por migration e passar validação de drift.
- Nunca usar client-supplied `user_id`, `owner_id`, `business_id` ou role como fonte de autoridade quando o servidor puder derivá-los de auth/contexto.

## 4. Edge Functions e APIs

Toda função crítica deve possuir, conforme o caso:

- guarda de método;
- limite de body;
- validação de content-type;
- validação de schema/entrada;
- autenticação e autorização quando a rota não for pública;
- rate limit quando houver risco de abuso;
- CORS estrito para chamadas browser;
- headers de segurança;
- erros 5xx sem detalhes internos;
- auditoria para operações privilegiadas.

Rotas públicas por natureza — como webhooks — não devem receber JWT artificial só para satisfazer checklist. Elas devem usar o mecanismo de autenticidade do provedor (assinatura, secret compartilhado, mTLS etc.) e validar antes de qualquer operação privilegiada.

## 5. Webhooks e billing

- Stripe webhook exige `stripe-signature` e validação criptográfica sobre o raw body.
- `service_role` só pode ser usado após autenticação do evento.
- Eventos financeiros devem ser idempotentes.
- Replay não pode duplicar cobrança, assinatura, ledger ou entitlement.
- Eventos desconhecidos devem falhar de forma segura ou ser ignorados explicitamente.
- Logs não devem conter secrets, payment credentials ou payloads sensíveis completos.

## 6. Storage

Classifique buckets em:

- público por design: mídia destinada a qualquer visitante;
- privado por design: mensagens, incidentes, evidências, recibos, verificações, documentos internos;
- temporário/processamento: conteúdo que não deve depender de URL pública permanente.

Regras:

- evidência de safety/moderação é privada por padrão;
- bucket privado precisa de policy de ownership/authority, não apenas obscuridade do path;
- signed URL deve ter TTL mínimo necessário;
- uploads de usuário devem ter limite de tamanho e MIME;
- formatos ativos como SVG/HTML exigem tratamento explícito;
- nome/path fornecido pelo cliente não concede autoridade.

## 7. Auth

- Proteção contra senhas comprometidas deve permanecer ativa quando suportada.
- Fluxos de login/signup/reset devem ter controles anti-abuso compatíveis com risco.
- Mensagens de erro não devem facilitar enumeração de conta além do necessário.
- Sessão/token não deve ser persistido em mecanismos inseguros fora da estratégia oficial do cliente Supabase.
- Mudanças em login alternativo devem preservar rate limit, Turnstile quando aplicável e validação server-side.

## 8. Secrets e configuração

- Segredos reais nunca são commitados.
- Arquivos de ambiente efetivos não são fonte de verdade do repositório.
- Templates podem listar nomes de variáveis, exemplos sintéticos e descrição, nunca credencial real.
- Segredos de Edge Functions ficam no mecanismo de secrets do Supabase.
- Segredos de deploy/frontend server-side ficam no provedor apropriado.
- Qualquer segredo exposto ou suspeito de exposição deve ser rotacionado; remover do git não invalida segredo já comprometido.

Procedimentos: [`SUPABASE_SECRETS.md`](./SUPABASE_SECRETS.md) e [`EDGE_FUNCTION_SECRETS.md`](./EDGE_FUNCTION_SECRETS.md).

## 9. Browser e deploy

- CSP deve permanecer explícita e restritiva.
- `unsafe-eval` não deve ser introduzido sem decisão de segurança específica.
- `frame-ancestors`/anti-clickjacking, HSTS, nosniff e referrer policy devem permanecer no deploy.
- Turnstile/configurações anti-abuso de produção devem falhar o build se ausentes quando exigidas.
- Service workers e HTML não devem receber cache imutável.

## 10. CI e gates

Gates de segurança existentes não devem ser removidos silenciosamente. A baseline inclui:

- ESLint security;
- `npm audit` high/critical;
- Semgrep;
- Gitleaks;
- verificações de XSS/token/cookie;
- TypeScript strict;
- validações SSOT/arquitetura;
- validação de migrations/drift para mudanças de banco.

Exceções devem ser estreitas, documentadas e possuir prazo de revisão.

## 11. Testes de autorização

Toda mudança sensível deve testar pelo menos:

- ator autorizado funciona;
- ator não autorizado falha fechado;
- quando relevante, usuário A não acessa usuário B;
- quando relevante, business A não acessa business B;
- caminho admin é negado ao usuário comum;
- usuário inativo/banido/removido perde autoridade esperada.

## 12. Auditoria e remediação ativa

Estado atual:

- [`audits/MASTER_REPORT.md`](./audits/MASTER_REPORT.md)
- [`audits/SECURITY-REMEDIATION-PLAN-2026-08.md`](./audits/SECURITY-REMEDIATION-PLAN-2026-08.md)
- [`audits/SECURITY-IMPLEMENTATION-CHECKLIST.md`](./audits/SECURITY-IMPLEMENTATION-CHECKLIST.md)
- [`audits/SECURITY-VERIFICATION-MATRIX.md`](./audits/SECURITY-VERIFICATION-MATRIX.md)

Auditorias são snapshots. Se a política aqui divergir do código, a divergência deve ser tratada; não atualizar a documentação apenas para normalizar um comportamento inseguro.
