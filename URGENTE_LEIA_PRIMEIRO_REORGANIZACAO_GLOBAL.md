# URGENTE — ponteiro de compatibilidade

> **STATUS: SUBSTITUÍDO COMO AUTORIDADE.**
>
> Este arquivo existe apenas para preservar referências históricas, workflows e agentes antigos. Ele **não é o SSOT operacional** e deve permanecer curto. O histórico anterior continua disponível no Git.

## Leia nesta ordem

1. `docs/README.md` — índice documental canônico;
2. `docs/03-architecture/CURRENT_RULES.md` — regras arquiteturais vigentes;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — plano operacional ativo;
4. `docs/08-roadmap/checkpoints/2026-09-14-g176-public-root-lean-auth-and-boundary-resilience.md` — checkpoint mais recente desta linha;
5. `SECURITY.md` — segurança e gates de release.

## Regras que não podem ser perdidas

- projeto real primeiro: código, owners, schema/migrations, runtime, testes e deploy prevalecem sobre docs antigas;
- não remover feature válida porque está quebrada, incompleta, `launch-paused` ou com teste falhando;
- remover somente legado/duplicação/bridge/owner substituído depois de censar callers, preservar capacidade e provar o substituto;
- corrigir causa raiz; não recriar wrappers, aliases, writers paralelos, hardcodes ou paliativos apenas para fazer build/test passar;
- otimização reutilizável de mapas pertence aos owners canônicos descritos em `CURRENT_RULES.md`; não copiar loaders/CSS/workers/providers por página;
- Browser Geolocation pertence a `src/shared/services/GeolocationService.ts`; não chamar `navigator.geolocation` diretamente em páginas/componentes/hooks de domínio;
- “usar minha localização” exige GPS preciso sem fallback IP silencioso; coordenada `0` continua válida;
- CEP/geocoding reconciliado pertence a `LocationGeocodingService`; UI não chama provider diretamente quando esse owner atende o contrato;
- contexto de lançamento da `/` vem de `TERRITORY_CONFIG`/`LAUNCH_URLS`; a página não cria fallback paralelo de estado/cidade/slug/nome;
- paths/query keys/classificação de callback de Auth vêm de `authFlow.ts`/`authCallback.ts`; âncora comum não é retorno OAuth;
- fallback geográfico reutilizável vem de `mapDefaults`; não reintroduzir coordenadas locais quando o SSOT compartilhado atende o caso;
- carregamento de boundary/polígono precisa ser limitado e não bloqueante; timeout não autoriza contorno aproximado;
- timeout final de mapa precisa encerrar estado acessível de carregamento; fallback visual resolvido não permanece `aria-busy=true`;
- regra exclusiva da `/` só permanece local quando depender de prioridade/UX específica da entrada pública;
- trabalhar na `main` sem force-push e preservar trabalhos concorrentes;
- GitHub Actions com `steps=[]`/`runner_id=0` é falha de execução do provider, não certificação do source;
- rate-limit Vercel não é build aprovado nem reprovado;
- tipos Supabase gerados devem vir do schema real; não editar `types.generated.ts` manualmente para esconder drift;
- Mobilidade permanece `PUBLIC_LAUNCH_SURFACES.mobility=false` até E2E + security + build + deploy do mesmo SHA.

## Política deste arquivo

Não voltar a acumular checkpoints aqui. Mudanças operacionais pertencem a `docs/08-roadmap/checkpoints/` e ao roadmap canônico. Quando toda referência ativa a este nome for migrada, este ponteiro poderá ser removido.
