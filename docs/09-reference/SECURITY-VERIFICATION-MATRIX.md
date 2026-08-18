# Matriz de Verificação de Segurança

Status: ATIVO  
Baseline: 2026-08-18

Esta matriz define como provar que um controle existe e continua existindo. Ela complementa os testes específicos de cada domínio.

## Matriz principal

| Controle | Ameaça | Prova mínima | Evidência |
| --- | --- | --- | --- |
| RLS em tabelas de aplicação | leitura/mutação lateral | catálogo + probes A/B | script/test + CI |
| Policies de ownership | IDOR | usuário A tenta recurso de B | teste negativo fail-closed |
| Admin authorization | privilege escalation | usuário comum chama comando admin | rejeição de autorização |
| `SECURITY DEFINER` | bypass de RLS | body + grants + `search_path` + probe | migration + teste |
| Views privilegiadas | exposição indireta | anon/auth/admin e A/B | teste de linhas/colunas |
| Storage privado | disclosure | URL direta anônima + usuário não autorizado | acesso negado |
| Signed URLs | disclosure temporal | URL expirada/escopo | teste de TTL |
| MIME/tamanho | upload abusivo | oversized + MIME inválido | rejeição pré-persistência |
| Password leak protection | credential reuse | config remota + probe | regression check |
| Secrets | credential leak | Gitleaks + arquivos proibidos | CI verde |
| Edge method/body guard | abuso/DoS | método/body inválido | 405/413/415 |
| Rate limiting | brute force/abuso | exceder janela controlada | 429 |
| CORS | cross-origin abuse | origem permitida vs não permitida | comportamento coerente |
| Safe errors | information disclosure | provocar 5xx controlado | sem stack/secrets |
| Stripe signature | forged event | assinatura inválida | rejeição antes de `service_role` |
| Webhook idempotency | replay | reenviar event ID | sem efeito duplicado |
| Anonymous analytics | metric manipulation | replay/flood/spoof | rate limit/dedup/rejeição |
| CSP | XSS/exfiltration | header real | política válida sem relaxamento indevido |
| Turnstile | automação abusiva | config de produção inválida | build/gate falha |
| Migration drift | prod/repo divergence | validação remota | zero drift não justificado |
| Security config drift | políticas divergentes | divergência sintética | CI falha |
| Dependências | supply chain | `npm audit --audit-level=high` | zero high/critical não aceito |
| CI assurance | regressão mascarada | mesmo commit em runner alternativo/diagnóstico | causa raiz distinguível |

## Perfis de teste

Quando relevantes, considerar:

1. `anon`;
2. dono do recurso;
3. usuário não relacionado;
4. membro legítimo;
5. ex-membro;
6. usuário inativo/bloqueado/banido;
7. owner de business A;
8. owner de business B;
9. moderador/admin autorizado;
10. usuário comum em caminho administrativo.

Não é obrigatório criar dez fixtures por teste; usar o menor conjunto que prove o boundary.

## Regressões que bloqueiam merge

- leitura ou mutação lateral de dados privados;
- comando administrativo por ator não autorizado;
- bucket sensível público sem decisão explícita;
- `service_role` em browser/client;
- segredo real detectado;
- webhook com assinatura inválida aceito;
- migration drift não explicado;
- dependência high/critical não aceita;
- CSP/Turnstile/security gate removido ou bypassado sem decisão;
- correção de CI que simplesmente torne scanner não bloqueante.

## Evidência exigida no PR

Quando aplicável, registrar:

- ameaça/bug anterior;
- por que o controle fecha a ameaça;
- teste negativo;
- teste positivo para o fluxo legítimo;
- comandos executados;
- resultado remoto quando depender de Supabase/Vercel;
- migration/rollback;
- risco residual.

Nunca incluir em screenshot/log de evidência token, senha, cookie, PII ou payload sensível desnecessário.

## Reauditoria

Comparar com:

- [Auditoria de Segurança — 2026-08](./SECURITY-AUDIT-2026-08.md)
- [Checklist de implementação](../08-roadmap/SECURITY-IMPLEMENTATION-CHECKLIST.md)

Achado novo recebe novo ID. Achado antigo reaberto mantém o ID e registra a regressão.
