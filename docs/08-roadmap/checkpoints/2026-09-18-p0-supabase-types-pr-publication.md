# Checkpoint 2026-09-18 — P0: publicação de tipos Supabase por PR

## Objetivo

Remover o writer direto em `main` do workflow canônico `Supabase Types Sync`, desbloqueando a evolução da proteção de branch para exigir Pull Request sem criar bypass administrativo para tipos gerados.

## Mudança

- o gerador canônico continua sendo `tools/supabase/generate-supabase-types.ts`;
- o artefato canônico continua sendo `src/integrations/supabase/types.generated.ts`;
- o workflow continua restrito ao runner remoto canônico e parte sempre da `main` mais recente;
- quando existe drift, o workflow reconstrói a branch bot-owned `automation/supabase-types-sync` a partir da `main`, aplica somente o arquivo gerado e publica essa branch;
- o workflow cria ou atualiza um PR para `main`;
- o workflow não faz auto-merge e não faz `git push` direto para `main`;
- o teste de governança passa a impedir a reintrodução de publicação direta em `main`.

## Segurança e autoridade

A branch automatizada é exclusiva do workflow e pode ser reescrita porque não contém trabalho humano. A `main` deixa de precisar de exceção de escrita para esse publisher. O PR gerado continua sujeito aos gates normais; geração de tipos não equivale a autorização de release.

## Limites atuais

- o runner `acheguese-heavy-windows` continua dependente de disponibilidade/orçamento externo;
- a mudança não regenera tipos por si só enquanto o runner estiver indisponível;
- a mudança não habilita Mobilidade e não altera política comercial;
- required checks de `main` só devem ser ligados depois que houver um check executável e estável no fluxo real.

## Próximo gate

Após integrar esta mudança e obter uma execução real do Types Sync:

1. comprovar que o workflow abre/atualiza PR sem escrever diretamente em `main`;
2. validar o PR gerado com os gates normais;
3. então elevar a proteção de `main` para exigir PR, preservando apenas um caminho de emergência administrado e documentado;
4. manter `Vercel` como required check apenas quando sua semântica de `READY`/same-SHA estiver garantida pelo gate de release.

Relacionado a #28 e ao plano operacional `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.
