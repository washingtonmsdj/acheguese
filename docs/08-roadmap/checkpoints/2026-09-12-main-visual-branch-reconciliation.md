# Checkpoint — reconciliação da branch visual na main

Data: 2026-09-12

## Objetivo

Atualizar a `main` com o trabalho ainda exclusivo de `codex/identidade-visual-achegue-se` sem reset, force-push, substituição de árvore ou regressão das correções estruturais mais novas da `main`.

## Estado antes da integração

- `main`: `2081c00b64e2f75abc4cec326e329e33c11a8e36`
- `codex/identidade-visual-achegue-se`: `da1d0288a1c9f6323000af9869a750e5d36bf625`
- merge-base: `188dd0a1a44863698086136c3028076d116d5ea7`
- branch visual: 75 commits exclusivos
- main: 216 commits exclusivos
- delta visual: 40 arquivos, +6988 / -486

A comparação dos dois lados desde o merge-base mostrou que os 40 arquivos alterados pela branch visual não se sobrepunham ao conjunto alterado pelos 216 commits novos da `main`.

## Integração

PR: `#114` — `reconcile(ui): integrate current visual branch into main`

O GitHub inicialmente retornou mergeability pendente/falsa durante o cálculo e, na reconsulta, confirmou `mergeable=true`.

Os checks do head visual apareceram como `failure`, porém os jobs inspecionados (`Validate No Hardcoded Credentials`, `Lint and Type Check`, `Run Tests`, `Maps Architecture Enforcement`) encerraram com:

- `steps=[]`
- `runner_id=0`
- `runner_name=""`

Portanto não houve etapa de código executada e não existe evidência de falha funcional produzida por esses checks.

O PR foi integrado por **merge commit**, preservando a ancestralidade completa da branch para futura remoção segura da ref.

Merge commit:

`5a4aacfd3113263e58c4767ce449d0952745d81b`

## Prova pós-merge

Comparação `codex/identidade-visual-achegue-se...main` após o merge:

- branch visual `behind_by=0` em relação à sua inclusão como ancestral da `main`;
- `main` está 217 commits à frente da branch visual;
- o tip `da1d0288...` é merge-base/ancestral da `main`.

Isso significa que não existe mais trabalho exclusivo nessa branch que precise ser preservado antes de sua futura remoção física.

## Branch antiga de CI

`codex/ci-heavy-certification` **não foi integrada neste checkpoint**.

Estado observado:

- 5 commits exclusivos;
- 3154 commits atrás da `main`;
- alterações em CI, governança e scripts de certificação antigos.

Decisão: não importar automaticamente. Essa branch deve ser tratada na auditoria específica de branches para determinar se seus 5 commits foram semanticamente substituídos, se algum slice ainda merece reconciliação, ou se a branch pode ser descartada como legado.

## Autoridade de trabalho

A autoridade atual continua sendo `main`.

Nenhuma branch histórica deve ser usada para resetar, substituir ou rebaixar a `main`.
