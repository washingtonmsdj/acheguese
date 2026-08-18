# Matriz de Verificação de Segurança

Status: ATIVO  
Baseline: 2026-08-18

Esta matriz define como provar que um controle existe e continua existindo. Ela não substitui testes específicos de domínio.

## 1. Matriz principal

| Controle | Ameaça | Prova mínima | Evidência esperada | Frequência |
| --- | --- | --- | --- | --- |
| RLS em tabelas de aplicação | leitura/mutação lateral | query de catálogo + probes A/B | script/test + output de CI | cada migration sensível + auditoria periódica |
| Policies de ownership | IDOR horizontal | usuário A tenta acessar B | teste negativo falha fechado | cada alteração de policy/RPC |
| Admin authorization | privilege escalation | usuário comum chama comando admin | 401/403/erro de autorização | cada mudança admin/trust/safety |
| `SECURITY DEFINER` | bypass de RLS/owner authority | revisar body + grants + `search_path` + probes | migration + teste | cada função nova/alterada |
| Views privilegiadas | exposição indireta | A/B + anon/auth/admin | teste de linhas/colunas visíveis | cada view privilegiada |
| Storage privado | disclosure | URL direta anon + usuário não autorizado | acesso negado | cada bucket/policy |
| Signed URLs | disclosure temporal | expirado, ator errado, TTL | teste de expiração/escopo | cada fluxo novo |
| MIME/tamanho | upload abusivo | oversized + MIME inválido | rejeição antes da persistência | cada bucket de upload |
| Password leak protection | credential reuse | configuração remota + probe | script falha se desativado | release + auditoria periódica |
| Secrets | credential leak | Gitleaks + arquivos proibidos | CI verde | cada push/PR |
| Edge method guard | abuso de método | método inesperado | 405 | cada Edge Function |
| Edge body guard | DoS/payload abuse | body oversized/content-type inválido | 413/415 | cada endpoint de ingestão |
| Rate limiting | brute force/abuse | exceder janela de teste | 429 | auth, public writes, webhooks quando aplicável |
| CORS | browser cross-origin abuse | origem permitida vs não permitida | allow/block coerente | mudança de deploy/origin |
| Safe errors | information disclosure | provocar 5xx controlado | sem stack/secrets ao cliente | endpoints críticos |
| Stripe webhook signature | forged billing event | assinatura inválida | 401 antes de `service_role` | billing changes |
| Webhook idempotency | replay/double processing | reenviar event ID | sem efeito duplicado | billing changes |
| Anonymous analytics boundary | metric manipulation | replay/flood/spoof de IDs | limit/dedup/rejeição | analytics changes |
| CSP | XSS/data exfiltration | validar header real | CSP válida sem relaxamento não aprovado | cada deploy config change |
| Turnstile | automated abuse | produção sem config válida deve falhar build | gate verde | cada build de produção |
| Migration drift | prod/repo divergence | remote migration validation | zero drift não justificado | cada DB deploy |
| Security config drift | políticas divergentes | divergência sintética em teste | CI falha | cada alteração de config |
| Dependency vulnerabilities | supply-chain | `npm audit --audit-level=high` | zero high/critical não aceito | cada CI + scheduled scan |

## 2. Perfis de teste obrigatórios

Quando aplicável, cada boundary sensível deve considerar:

1. `anon`;
2. usuário autenticado dono do recurso;
3. usuário autenticado não relacionado;
4. membro legítimo;
5. ex-membro/removido;
6. usuário inativo/bloqueado/banido;
7. owner de business A;
8. owner de business B;
9. moderador/admin autorizado;
10. usuário comum tentando caminho administrativo.

Não é necessário criar dez fixtures para todo teste; a matriz deve ser reduzida ao conjunto relevante ao boundary.

## 3. Regressões que devem bloquear merge

Bloquear merge quando houver:

- leitura lateral de dados privados;
- mutação lateral;
- chamada administrativa por role não autorizada;
- bucket sensível acessível anonimamente sem decisão explícita;
- `service_role` em código browser/client;
- segredo real detectado;
- assinatura de webhook inválida aceita;
- mudança de migration com drift não explicado;
- dependência high/critical não aceita pela política;
- CSP/Turnstile/security gate removido ou bypassado sem decisão explícita.

## 4. Evidência no PR

PR de segurança deve registrar, quando aplicável:

- ameaça/bug anterior;
- por que o controle escolhido fecha a ameaça;
- teste negativo que falhava antes ou reproduz a tentativa proibida;
- teste positivo para preservar o fluxo legítimo;
- comandos executados;
- resultado remoto quando a mudança depende de Supabase/Vercel;
- migration/rollback;
- risco residual.

Evitar screenshots contendo token, email privado, telefone, payload sensível, cookie ou identificador desnecessário.

## 5. Reauditoria

A reauditoria deve comparar o estado atual com:

- [`MASTER_REPORT.md`](./MASTER_REPORT.md)
- [`SECURITY-IMPLEMENTATION-CHECKLIST.md`](./SECURITY-IMPLEMENTATION-CHECKLIST.md)

Achado novo recebe novo ID; achado antigo reaberto mantém o ID e registra a regressão.
