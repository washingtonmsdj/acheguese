# Marco zero — main canônica e higiene de branches

**Data:** 2026-09-21  
**Main após corte do MVP:** `89ad133ece76d10ea66312bfdc3794852b0dfb04`

## Estado do produto

O PR #283 foi integrado por squash e estabeleceu o corte inicial do MVP em:

- **Empresas**;
- **Mapa**;
- **Perto de mim**.

**Correção do mesmo marco em 2026-09-21:** Busca não deve ser removida do MVP. O lifecycle vigente passa a manter também **Busca (`search`) ativa**, com providers de módulos pausados fail-closed. O escopo atual, portanto, é **Empresas + Mapa + Perto de mim + Busca**.

O PR #284 foi integrado por squash e mudou a política de higiene: `main` é a única branch explicitamente preservada como linha ativa.

## Auditoria remota de refs

Inventário após o PR #284:

- branches remotas: **175**;
- PRs abertos: **0**;
- heads atuais exatamente iguais ao head de PR já mergeado: **92**;
- heads auditados e SHA-pinados como superseded: **67**;
- branches adicionais comprovadamente contidas na `main` (`ahead_by=0`): **6**;
- branches com commits exclusivos: **9**;
- `main`: 1.

Portanto, **165 branches são candidatas seguras à exclusão física imediata** pelas regras fail-closed do utilitário.

### Contidas na main

As branches sem match anterior que agora têm `ahead_by=0` são:

- `cleanup/maps-governance-docs-20260918`;
- `fix/mvp-jobs-business-canonical-route`;
- `fix/mvp-paused-cost-backend-gates-20260919`;
- `reconcile/supabase-migration-history-pr117-20260919`;
- `work/mvp-launch-gates-audit-20260920`;
- `work/mvp-launch-scope-audit`.

## Histórico exclusivo ainda preservado

Estas nove refs ainda possuem commits que não são ancestrais da `main`:

| Branch | Ahead | Situação |
| --- | ---: | --- |
| `agent/lgpd-pending-deletion-boundary` | 14 | histórico LGPD sensível; preservar |
| `agent/structure-cleanup-foundation` | 66 | reorganização estrutural antiga; preservar até arquivamento |
| `audit/mobility-launch-hardening-2026-09-16` | 17 | Mobilidade pós-MVP; preservar |
| `audit/mobility-launch-hardening-main-2026-09-17` | 23 | Mobilidade pós-MVP; preservar |
| `codex/identidade-visual-achegue-se` | 1 | lote visual exclusivo; preservar |
| `codex/reformulacao-entrada-comunidade` | 73 | Community pós-MVP; preservar |
| `fix/mvp-public-territorial-route-registry` | 2 | delta de roteamento exclusivo; auditar antes de aposentar |
| `module/mobilidade` | 286 | linha histórica grande de Mobilidade; preservar |
| `work/mvp-urgent` | 40 | delta histórico após reutilização da branch; preservar até auditoria/arquivamento |

Essas branches **não são linhas ativas de desenvolvimento**. São refs de preservação histórica enquanto não houver tag/archive equivalente. Novo desenvolvimento parte da `main` e cria branch curta somente quando necessário.

## Tentativa de limpeza física

Foi adicionado o workflow one-shot:

`.github/workflows/milestone-zero-branch-hygiene.yml`

Ele executa:

1. dry-run completo;
2. revalidação de SHA;
3. proteção;
4. PR aberto;
5. containment;
6. exclusão somente das refs seguras;
7. artifact com evidência.

Run `35602264073` foi tentado e reexecutado. Nas duas tentativas o job terminou `failure` com `steps=null`.

Isso significa que **nenhum step foi iniciado** e nenhuma branch foi apagada pelo workflow.

A integração GitHub deste chat também não expõe `DELETE /git/refs`, e o ambiente local não possui `gh` nem `GH_TOKEN/GITHUB_TOKEN`. Portanto não é correto afirmar que a exclusão física ocorreu.

## Regra do marco zero

A partir deste checkpoint:

- **linha ativa:** somente `main`;
- nenhuma branch antiga deve receber desenvolvimento novo;
- branch nova só nasce da `main` para uma mudança concreta e deve voltar por PR;
- branches históricas exclusivas permanecem somente para preservação até arquivamento seguro;
- refs comprovadamente absorvidas/superseded devem ser apagadas assim que uma autoridade `delete-ref` realmente executar o utilitário;
- não mover refs para a `main` para simular limpeza.

## Release do MVP

O marco arquitetural não equivale a release certificado.

Antes de `MVP READY`, ainda é obrigatório provar no **mesmo SHA**:

- security;
- lint;
- typecheck;
- testes unitários/arquiteturais;
- build;
- E2E de Empresas + Mapa + Perto de mim + Busca;
- deploy real;
- smoke de produção.

Os runners atuais continuam apresentando jobs com `steps=null`; isso não prova falha de código, mas também não prova aprovação.
