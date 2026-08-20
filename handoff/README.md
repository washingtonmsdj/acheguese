# Handoff de continuidade

Status: CONTEXTO OPERACIONAL / NAO CANONICO

Esta pasta preserva checkpoints para outra IA ou desenvolvedor retomar trabalho sem depender do historico da conversa. **Handoffs nao sao fonte de verdade do produto nem autorizam mudancas por si so.**

## Como usar

1. Use o handoff apenas para localizar a frente, o ultimo ponto conhecido e evidencias a revalidar.
2. Antes de agir, confronte o handoff com o estado atual do Git, codigo, migrations, testes, configuracao e docs canonicos.
3. Se houver divergencia, o estado atual verificavel e os owners canonicos prevalecem sobre o handoff.
4. Verifique `git status --short` antes de editar: este repositorio pode conter mudancas locais de outras frentes.
5. Nao agrupe mudancas nao relacionadas no mesmo commit.
6. Execute os gates aplicaveis e prove criterios de aceite no ambiente alvo antes de concluir a frente.

## Handoff ativo

- [CP-016 - Consolidacao de midia publica no Media Asset](./CP-016_MEDIA_ASSET_CONTINUATION.md)

O plano relacionado em [`plans/CORE_PLATFORM_CONSOLIDATION_PLAN.md`](../plans/CORE_PLATFORM_CONSOLIDATION_PLAN.md) e um artefato de execucao. Codigo, testes, migrations e documentacao viva/canonica prevalecem em caso de divergencia.
