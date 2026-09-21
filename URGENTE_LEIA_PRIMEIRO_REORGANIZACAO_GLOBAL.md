# URGENTE — ponteiro operacional de estabilização

> **STATUS: PONTEIRO DE COMPATIBILIDADE, NÃO SSOT.**
>
> Este arquivo existe somente porque workflows, agentes e links históricos ainda podem referenciar este nome. **Não registrar estado, blockers, decisões, números de migrations, SHAs ou checkpoints aqui.** Essas informações envelhecem e criam uma segunda autoridade.

## Retomada correta

Leia nesta ordem:

1. `docs/README.md` — índice e precedência documental;
2. `docs/03-architecture/CURRENT_RULES.md` — regras arquiteturais atuais;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — **SSOT operacional e de prontidão do MVP**;
4. `docs/08-roadmap/checkpoints/` — evidências factuais recentes;
5. `docs/architecture/SSOT_REGISTRY.md` — owners e fontes de verdade executáveis;
6. `SECURITY.md` — política de segurança.

## Regra de execução

O projeto real prevalece sobre snapshots antigos: `main`, rotas, owners, schema/migrations, contratos, testes, runtime e deploy devem ser verificados antes de qualquer mudança.

Não crie novos planos ou checkpoints neste arquivo. Quando os callers históricos forem migrados, este ponteiro deve ser removido conforme a política documental da raiz.
