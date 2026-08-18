# Índice Canônico de Documentação

Status: ATIVO  
Última atualização: 2026-08-18  
Autoridade: este arquivo é o ponto de entrada oficial para documentação operacional e arquitetural do Achegue-se.

## 1. Regra de autoridade

Quando houver conflito entre documentos, use a seguinte ordem:

1. contratos executáveis e validações automatizadas do repositório;
2. `SECURITY.md` e `docs/SECURITY.md` para regras de segurança;
3. SSOTs e governanças de domínio explicitamente marcados como ativos/frozen;
4. este índice para localizar a fonte canônica vigente;
5. relatórios de auditoria e roadmaps ativos;
6. documentos históricos, milestones antigos e evidências arquivadas.

Documentação histórica nunca deve reabrir um boundary congelado sem ADR/DECISION explícita.

## 2. Entrada do projeto

- Visão geral e comandos principais: [`README.md`](../README.md)
- Política de segurança na raiz: [`SECURITY.md`](../SECURITY.md)
- Regras operacionais atuais: [`docs/CURRENT_RULES.md`](./CURRENT_RULES.md)
- Marco arquitetural oficial: [`docs/architecture/PROJECT-MILESTONE-1.md`](./architecture/PROJECT-MILESTONE-1.md)

## 3. Segurança

- Política operacional canônica: [`docs/SECURITY.md`](./SECURITY.md)
- Segredos Supabase em desenvolvimento/CI: [`docs/SUPABASE_SECRETS.md`](./SUPABASE_SECRETS.md)
- Segredos de Edge Functions: [`docs/EDGE_FUNCTION_SECRETS.md`](./EDGE_FUNCTION_SECRETS.md)
- Relatório mestre de auditoria: [`docs/audits/MASTER_REPORT.md`](./audits/MASTER_REPORT.md)
- Plano de remediação vigente: [`docs/audits/SECURITY-REMEDIATION-PLAN-2026-08.md`](./audits/SECURITY-REMEDIATION-PLAN-2026-08.md)
- Checklist de implementação: [`docs/audits/SECURITY-IMPLEMENTATION-CHECKLIST.md`](./audits/SECURITY-IMPLEMENTATION-CHECKLIST.md)
- Matriz de verificação: [`docs/audits/SECURITY-VERIFICATION-MATRIX.md`](./audits/SECURITY-VERIFICATION-MATRIX.md)

## 4. Arquitetura e SSOT

- Registry arquitetural: `docs/architecture/SSOT_REGISTRY.md`
- Community First: `docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`
- Regras de território: `docs/domain/TERRITORY-GOVERNANCE.md`
- Governança de Feed: `docs/feed/FEED-GOVERNANCE.md`
- Freeze de Feed: `docs/feed/FEED-FREEZE.md`

> Se algum caminho acima deixar de existir, o mesmo PR que mover/remover o documento deve atualizar este índice e qualquer referência no `README.md`.

## 5. Como adicionar documentação ativa

Antes de criar um novo documento:

- identifique o domínio proprietário;
- procure um SSOT/governança existente;
- evite criar um segundo roadmap para o mesmo assunto;
- prefira atualizar a fonte canônica vigente;
- marque claramente `Status`, `Autoridade` e `Última atualização`;
- adicione critérios verificáveis quando o documento prescrever mudanças de código ou infraestrutura;
- execute `npm run validate:docs-structure` e `npm run validate:docs-live-links` quando aplicável.

## 6. Auditorias

Auditorias descrevem um snapshot e não substituem contratos executáveis. Cada achado deve declarar uma destas classes:

- **falha confirmada**: comportamento inseguro demonstrado;
- **configuração de risco**: condição insegura ou permissiva sem exploração confirmada;
- **hardening**: melhoria preventiva;
- **performance/operabilidade**: não é vulnerabilidade, mas pode causar degradação ou perda de evidência.

O relatório vigente fica sempre em `docs/audits/MASTER_REPORT.md`, que deve apontar para o plano/checklist atualmente ativo.
