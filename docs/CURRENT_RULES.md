# Regras Atuais do Projeto

Status: CANÔNICO  
Última atualização: 2026-08-18

Este documento reúne regras de engenharia transversais. Regras específicas de domínio continuam pertencendo aos respectivos SSOTs/governanças.

## 1. Autoridade documental

- O índice oficial é [`INDEX_CANONICO.md`](./INDEX_CANONICO.md).
- `README.md` é entrada, não especificação completa.
- Segurança é regida por [`../SECURITY.md`](../SECURITY.md) e [`SECURITY.md`](./SECURITY.md).
- Domínio congelado só muda por fluxo explícito de decisão/ADR compatível com sua governança.
- Roadmap histórico não recupera autoridade por ser mais detalhado ou mais antigo.

## 2. SSOT

- Uma capacidade crítica deve ter uma fonte canônica identificável.
- Não criar service/repository/helper paralelo quando já existir boundary oficial.
- Configuração duplicada entre runtimes deve ser gerada ou validada automaticamente quando material à segurança/arquitetura.
- Hardcodes de URL, autoridade, planos, taxonomia ou regras de domínio devem obedecer aos validadores SSOT existentes.

## 3. Banco

- Mudanças de schema/policies/RPCs são feitas por migrations versionadas.
- Não corrigir produção manualmente sem representar a alteração no repositório.
- RLS permanece fail-closed por padrão.
- Autoridade deve ser derivada de auth/contexto confiável, não de IDs arbitrários enviados pelo cliente.
- RPC privilegiada requer grants mínimos, autorização interna quando aplicável e testes negativos.
- Migration drift remoto precisa estar explicado/zerado antes de release.

## 4. Segurança

- Nenhum segredo real no git.
- Nenhum `service_role` no browser.
- Nenhum CORS permissivo de produção como fallback.
- Nenhum endpoint crítico sem guards compatíveis com seu risco.
- Webhook público deve validar autenticidade do provedor antes de autoridade privilegiada.
- Storage sensível é privado por padrão.
- Mudança de autorização exige teste positivo e negativo.

Detalhes: [`SECURITY.md`](./SECURITY.md).

## 5. Arquitetura

- `src/core` contém capacidades transversais/contratos canônicos; módulos de produto não devem recriar esses boundaries.
- `src/modules` contém domínios/verticais de produto.
- `src/integrations` contém adaptadores externos, não autoridade de domínio.
- Mudanças devem respeitar validadores de arquitetura incremental/governance.
- Evitar refatoração ampla junto de correção de segurança; reduzir blast radius e facilitar rollback.

## 6. Testes e release

Antes de merge/release, executar o conjunto aplicável:

```bash
npm run validate:ssot
npm run validate:architecture:incremental
npm run validate:architecture:governance
npm run validate:docs-structure
npm run typecheck
npm run lint
npm run build
```

Mudanças sensíveis também seguem os gates em [`SECURITY.md`](./SECURITY.md) e a matriz [`audits/SECURITY-VERIFICATION-MATRIX.md`](./audits/SECURITY-VERIFICATION-MATRIX.md).

## 7. Documentação de mudança

Um PR que altera contrato relevante deve declarar:

- owner/domínio afetado;
- regra anterior e nova;
- compatibilidade/migration quando aplicável;
- testes executados;
- risco residual;
- rollback;
- documentos canônicos atualizados.

## 8. Plano ativo de hardening

O trabalho de segurança aberto no snapshot de 2026-08-18 está controlado por:

- [`audits/MASTER_REPORT.md`](./audits/MASTER_REPORT.md)
- [`audits/SECURITY-REMEDIATION-PLAN-2026-08.md`](./audits/SECURITY-REMEDIATION-PLAN-2026-08.md)
- [`audits/SECURITY-IMPLEMENTATION-CHECKLIST.md`](./audits/SECURITY-IMPLEMENTATION-CHECKLIST.md)

Esses documentos não substituem SSOTs de domínio; coordenam remediação transversal.
