# GitHub branch hygiene — 2026-09-20

Status: **AUDITADO / LIMPEZA FÍSICA PENDENTE DE AUTORIDADE DELETE REF**

Base auditada: `main@cbc6271a5761d96ba679d4e7d56eda0052edbe51`.

## Resultado da auditoria

O repositório possui **153 branches remotas** no corte auditado.

Classificação fail-closed:

- **74 branches**: o SHA atual da branch é exatamente o SHA de head de um PR já mergeado;
- **3 branches**: não possuem PR mergeado correspondente, mas o compare contra `main` retorna `ahead_by=0`, portanto todo o conteúdo já está contido na base;
- **72 branches**: possuem commits exclusivos e ficam preservadas;
- **2 branches alteradas depois de merge**: ainda possuem delta exclusivo e ficam preservadas;
- `main`: sempre preservada;
- `work/mvp-urgent`: preservada deliberadamente como única branch operacional reutilizável.

**Candidatas seguras à exclusão física: 77.**
**Branches preservadas: 76.**

As três branches seguras por contenção direta são:

- `cleanup/maps-governance-docs-20260918`;
- `fix/mvp-jobs-business-canonical-route`;
- `fix/mvp-paused-cost-backend-gates-20260919`.

As duas branches pós-merge com delta exclusivo que **não** devem ser apagadas neste corte são:

- `cleanup/active-compat-facades-20260919`;
- `codex/identidade-visual-achegue-se`.

## Ferramenta canônica

Foi adicionado:

`tools/github/cleanup-merged-branches.mjs`

Comando:

```bash
npm run maintenance:branches
```

O comportamento padrão é **dry-run**. Nenhuma ref é removida sem `--apply`.

Saída estruturada:

```bash
npm run maintenance:branches -- --json
```

Aplicação real:

```bash
npm run maintenance:branches -- --apply
```

Requer `GH_TOKEN` ou `GITHUB_TOKEN` com permissão para ler o repositório e deletar refs Git.

## Regras de segurança

A ferramenta preserva automaticamente:

1. `main` e `work/mvp-urgent`;
2. branch marcada como protegida;
3. branch que seja head de PR aberto;
4. branch cujo SHA mudou após a auditoria;
5. branch que deixe de estar contida na `main` antes do DELETE;
6. qualquer branch que ainda possua commits exclusivos.

Uma branch só entra como candidata quando:

- o SHA atual é exatamente o head de um PR já mergeado no mesmo repositório; **ou**
- o compare contra a base retorna `ahead_by=0`.

Antes de cada DELETE a ferramenta relê a branch e revalida SHA, proteção e PR aberto. Para candidatas classificadas por contenção, o compare é executado novamente imediatamente antes da exclusão.

## Limitação da integração atual

A conexão GitHub disponível nesta conversa não expõe `DELETE /git/refs/...` nem alteração administrativa de `delete_branch_on_merge`. Por isso **nenhuma branch foi mascarada movendo ref para `main`**.

A limpeza física deve ser executada somente com uma autoridade GitHub que tenha delete-ref. O utilitário foi preparado exatamente para tornar essa execução reproduzível, auditável e fail-closed.

## Ratchet

`tests/scripts/github-branch-cleanup.test.ts` valida que:

- base/branch reutilizável são preservadas;
- proteção tem precedência;
- PR aberto tem precedência;
- SHA mergeado exato pode ser limpo;
- branch totalmente contida na base pode ser limpa;
- qualquer commit exclusivo preserva a branch.

## Próximo passo

Executar primeiro o dry-run com credencial administrativa, conferir que a contagem continua coerente e somente então usar `--apply`.

Depois da limpeza, habilitar `delete_branch_on_merge` no repositório quando a autoridade administrativa estiver disponível, para impedir novo acúmulo.
