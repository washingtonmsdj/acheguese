# URGENTE — ponteiro de compatibilidade

> **STATUS: SUBSTITUÍDO COMO AUTORIDADE.**
>
> Este arquivo existe apenas para preservar referências históricas, workflows e agentes antigos. Ele **não é o SSOT operacional** e deve permanecer curto. O histórico anterior continua disponível no Git.

## Leia nesta ordem

1. `docs/README.md` — índice documental canônico;
2. `docs/03-architecture/CURRENT_RULES.md` — regras arquiteturais vigentes;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — plano operacional ativo;
4. `docs/08-roadmap/checkpoints/2026-09-14-g169-root-map-ssot-performance-skeleton.md` — checkpoint mais recente desta linha;
5. `SECURITY.md` — segurança e gates de release.

## Regras que não podem ser perdidas

- projeto real primeiro: código, owners, schema/migrations, runtime, testes e deploy prevalecem sobre docs antigas;
- não remover feature válida porque está quebrada, incompleta, `launch-paused` ou com teste falhando;
- remover somente legado/duplicação/bridge/owner substituído depois de censar callers, preservar capacidade e provar o substituto;
- corrigir causa raiz; não recriar wrappers, aliases, writers paralelos, hardcodes ou paliativos apenas para fazer build/test passar;
- trabalhar na `main` sem force-push e preservar trabalhos concorrentes;
- GitHub Actions com `steps=[]`/`runner_id=0` é falha de execução do provider, não certificação do source;
- rate-limit Vercel não é build aprovado nem reprovado;
- tipos Supabase gerados devem vir do schema real; não editar `types.generated.ts` manualmente para esconder drift;
- Mobilidade permanece `PUBLIC_LAUNCH_SURFACES.mobility=false` até E2E + security + build + deploy do mesmo SHA.

## Política deste arquivo

Não voltar a acumular checkpoints aqui. Mudanças operacionais pertencem a `docs/08-roadmap/checkpoints/` e ao roadmap canônico. Quando toda referência ativa a este nome for migrada, este ponteiro poderá ser removido.