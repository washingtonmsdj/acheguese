# URGENTE — ponteiro de compatibilidade

> **STATUS: SUBSTITUÍDO COMO AUTORIDADE.**
>
> Este arquivo permanece temporariamente na raiz **somente para não quebrar referências históricas, workflows e agentes antigos**.
>
> Ele **não é mais o SSOT operacional** e não deve receber novos checkpoints extensos.

## Autoridades vivas

Leia nesta ordem:

1. `docs/README.md` — índice documental canônico;
2. `docs/03-architecture/CURRENT_RULES.md` — regras arquiteturais vigentes;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — execução operacional atual;
4. `SECURITY.md` — segurança e gates de release.

## Regra para novas IAs/agentes

- não usar conteúdo histórico deste arquivo para decidir arquitetura;
- não recriar `src/features`, `src/config`, `scripts` ou outros roots aposentados;
- trabalhar diretamente na `main`, sem force-push;
- revalidar o HEAD antes de cada write;
- preferir owner/SSOT canônico em `src/core`, `src/modules`, `src/app`, `src/integrations` e `src/shared`;
- atualizar `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` quando um checkpoint operacional mudar;
- usar `teste-acheguese` apenas como laboratório/prova de UX territorial quando aplicável; o produto consolidado continua neste repositório.

## Política de migração deste ponteiro

Este arquivo só poderá ser removido depois que:

- referências ativas forem migradas para os documentos canônicos;
- validators e workflows deixarem de depender do path;
- referências históricas restantes estiverem apenas em `docs/10-archive/`.

Até lá, manter este conteúdo curto e sem segunda autoridade.
