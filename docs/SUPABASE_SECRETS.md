# Supabase Secrets — Fluxo Canônico

Status: CANÔNICO  
Última atualização: 2026-08-18

## 1. Regra principal

Segredos Supabase não são versionados. O repositório pode declarar **nomes de variáveis, finalidade e exemplos sintéticos**, mas nunca credenciais reais.

## 2. Classificação

### Browser-safe

Valores explicitamente projetados para o cliente, como URL pública do projeto e chave publicável/anon compatível com RLS, podem aparecer em configuração de build quando necessário. Mesmo esses valores não substituem RLS/autorização.

### Server-only

Devem permanecer exclusivamente em ambiente seguro:

- `SUPABASE_SERVICE_ROLE_KEY`;
- secrets de webhook;
- provider API keys;
- cron secrets;
- tokens administrativos;
- qualquer chave capaz de ignorar RLS ou realizar mutação privilegiada.

Nunca prefixar segredo server-only com `VITE_`.

## 3. Desenvolvimento local

- usar arquivo local ignorado pelo git ou mecanismo de secrets do ambiente;
- manter somente template seguro (`.env.example`) no repositório;
- conferir `git status` antes de commit;
- nunca colar segredo em issue, PR, screenshot, fixture ou log.

## 4. CI/CD

- armazenar secrets no GitHub Actions/Vercel/Supabase conforme o consumidor;
- conceder somente aos jobs/ambientes que realmente precisam;
- evitar imprimir variáveis completas em logs;
- Gitleaks deve permanecer ativo;
- builds de PR não confiável não devem receber segredo de produção sem necessidade explícita.

## 5. Rotação

Rotacionar imediatamente quando:

- segredo aparece em commit, log, issue, PR ou screenshot;
- segredo foi compartilhado fora do canal autorizado;
- há suspeita de acesso indevido;
- um integrante/integração perde necessidade de acesso e a credencial não é individualizável;
- provider recomenda rotação por incidente.

Remover do git **não** torna um segredo previamente exposto seguro. Primeiro rotacionar/revogar, depois limpar a origem e avaliar histórico.

## 6. Checklist antes de merge

- [ ] nenhum segredo novo em diff;
- [ ] nenhum `service_role` em `src/` browser/client;
- [ ] nenhum segredo server-only com `VITE_`;
- [ ] template atualizado se variável nova for necessária;
- [ ] documentação descreve finalidade sem valor real;
- [ ] Gitleaks/security scan passa.

## 7. Auditoria ativa

O plano atual inclui SEC-007 para remover ambientes efetivos do versionamento e adicionar prevenção de regressão. Ver:

- [`audits/SECURITY-REMEDIATION-PLAN-2026-08.md`](./audits/SECURITY-REMEDIATION-PLAN-2026-08.md)
- [`audits/SECURITY-IMPLEMENTATION-CHECKLIST.md`](./audits/SECURITY-IMPLEMENTATION-CHECKLIST.md)
