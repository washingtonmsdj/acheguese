# G153 — Legacy retirement e certification tail — 2026-09-12

**Status:** SOURCE-ADVANCED / CERTIFICATION-BLOCKED  
**Branch:** `main`  
**HEAD de source imediatamente anterior a este checkpoint:** `076413c8d1a5c3cc6dd28eb7e2c64850351f9a18`  
**Autoridade operacional:** `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`

## 1. Regra aplicada neste bloco

A limpeza foi executada por evidência, não por idade/nome de arquivo:

1. localizar callers/imports/owners reais;
2. migrar callers ativos para o owner canônico;
3. remover a superfície antiga no mesmo fluxo quando possível;
4. adicionar/fortalecer ratchet contra recriação;
5. arquivar evidência histórica sem mantê-la como autoridade viva;
6. não apagar feature válida apenas porque está quebrada, pausada ou sem certificação.

`launch-paused` continua sendo gate de release, não classificação de legado.

## 2. `.kiro` aposentado de verdade

Fechado:

- `.kiro/**` foi desconectado do Vercel ignore, dos scanners/policies de segurança e da orientação do workflow SSOT;
- a árvore foi removida fisicamente no commit `077ce32e90e8f2916d64be990892ede9993a7371`;
- a `main` avançou por fast-forward e a Contents API confirmou `404` para `.kiro` no HEAD;
- histórico permanece recuperável pelo Git/arquivos canônicos, sem autoridade runtime/tooling.

Não recriar `.kiro/**` como fonte de planejamento, segurança, build ou SSOT.

## 3. Mobilidade/Admin — blocker TypeScript de source corrigido

O build Vercel real de `077ce32...` chegou ao TypeScript e revelou dois blockers atuais naquele SHA:

1. coerção estrutural em `admin.queries.ts` para o diretório de motoristas online;
2. tipo gerado antigo de `submit_ride_trust_feedback` esperando `p_subject_profile_id` em vez de `p_subject_role`.

O primeiro foi corrigido na origem em `AdminMobilityRealtimeDriverReadService.ts`: `AdminMobilityRealtimeOnlineDriverRow` passou a ser um object type estruturalmente compatível com o read model administrativo, sem `as unknown as` no caller e sem reabrir owner paralelo.

O segundo permanece **externamente bloqueado**: a migration G73 canônica usa `p_subject_role`, o source de Trust está alinhado a ela, mas a geração oficial `Supabase.generate_typescript_types` continua retornando `Gateway Timeout`. Não editar `types.generated.ts` manualmente para fabricar convergência.

## 4. Billing — bridge e alias realmente removidos

Fechado neste bloco:

- caller de Menu migrado do root bridge para `BusinessSubscriptionService`;
- `src/core/billing/SubscriptionService.ts` (bridge deprecated Business) removido fisicamente;
- um segundo census encontrou callers que o índice GitHub inicialmente não havia mostrado; Dashboard Empresa e Education foram então migrados para `BusinessSubscriptionService` antes de concluir a aposentadoria;
- o barrel `@/core/billing` deixou de recriar `SubscriptionService` como alias de `BusinessSubscriptionService`;
- `tests/architecture/billing-subscription-authority.test.ts` passou a bloquear tanto o arquivo antigo quanto import do alias pelo barrel;
- `src/core/billing/services/SubscriptionService.ts` permanece válido: ele é o owner da **assinatura de usuário**, não a bridge Business removida;
- README de Billing e `COMPATIBILITY_BRIDGES.md` foram reconciliados com a arquitetura executável.

A regra para próximos retirements é explícita: não confiar em uma única busca indexada; após remover uma bridge, executar segundo census por nome de método, import, barrel e compile/ratchet disponível.

## 5. Community drafts — legado deixou de ser perpetuado

`postDraft.ts` foi corrigido para tratar `updatedAt` como timestamp canônico:

- writers novos não persistem mais `savedAt`;
- snapshot antigo com `savedAt` é aceito somente na leitura, normalizado para `updatedAt` e regravado no formato canônico;
- `persistEncrypted` elimina `savedAt` antes de serializar;
- `writePostDraftSnapshot`, sem callers, foi removido;
- `postDraft.spec.ts` ratcheta writer canônico e migração/rewrite de snapshot antigo.

Ainda existe compatibilidade de leitura do campo antigo no contrato consumido pelo modal; isso é migração de dado local existente, não segundo owner. O campo não pode voltar a ser emitido por writer novo.

## 6. Core Platform — baseline apertado

O último build real havia reportado melhoria de baseline:

`table|emergency_contacts|read|supabase/functions/send-emergency-email/index.ts`

O source já não usa essa leitura. `docs/architecture/core-platform-ownership.json` foi reduzido para remover a permissão `trusted-delivery` obsoleta de `emergency_contacts`; somente `SafetyEmergencyContactsService.ts` continua autorizado como reader.

Não ampliar novamente esse baseline sem mudança arquitetural revisada.

## 7. Documentação ativa vs histórico

Movidos para `docs/10-archive/architecture-checkpoints/`, preservando os blobs originais e removendo os paths ativos:

- `REPOSITORY_CENSUS_2026-08-26.md`;
- `G5_PROVIDER_EXECUTION_CHECKPOINT_2026-08-31.md`;
- `G5_BUSINESS_READ_PERFORMANCE_2026-08-30.md`;
- `G5_HOSTED_SECURITY_REVALIDATION_2026-08-31.md`.

A limpeza documental segue a mesma regra do source: snapshot datado sem backlink vivo pode ser arquivado; documento canônico/SSOT ou evidência ainda referenciada só sai depois de migrar os backlinks.

## 8. Evidência externa atual

### Supabase

Tentativa mais recente de geração oficial de tipos no projeto `xhdowzacfujckjelqhtd`:

- resultado: `Gateway Timeout`;
- consequência: drift do RPC Trust continua aberto como gate externo;
- decisão: nenhuma edição manual do generated type.

### Vercel

O build production real de `077ce32...` avançou pelos gates de segurança/audit/ownership e chegou ao TypeScript. Depois das correções de source, novos SHAs não obtiveram novo build porque o provider passou a registrar explicitamente:

`Deployment rate limited — retry in 24 hours.`

No SHA `076413c8d1a5c3cc6dd28eb7e2c64850351f9a18` o commit status Vercel continua exatamente nesse estado. Rate-limit não é PASS nem FAIL de compilação.

### GitHub Actions

No run SSOT Enforcement `34725743792`, job `103639427649`:

- `status=completed`;
- `conclusion=failure`;
- `steps=[]`;
- `runner_id=0`;
- `runner_name=""`.

Portanto checkout/npm/typecheck/lint/test não executaram. A falha observada é de provisionamento/execução do runner, não prova de regressão do source.

## 9. Gates ainda abertos para fechar o urgente

1. Supabase voltar a responder e regenerar `types.generated.ts` a partir do schema/migrations reais;
2. obter TypeScript/build de produção verde em HEAD/descendente funcionalmente equivalente depois do rate-limit;
3. executar de verdade ratchets/security/tests — GitHub Actions atual não executa steps;
4. executar E2E operacional real de Mobilidade com autorização positiva e negativa para passageiro/motorista/motoboy, mais smoke responsivo;
5. deployar e comprovar **o mesmo SHA** que passou os gates;
6. somente depois reavaliar `PUBLIC_LAUNCH_SURFACES.mobility`.

## 10. Estado de release

Mobilidade permanece:

`PUBLIC_LAUNCH_SURFACES.mobility=false`

Nenhum trabalho deste checkpoint autoriza habilitar a surface pública antes da certificação same-SHA.

## 11. Próxima execução

Continuar em blocos, não em microtarefas:

1. census/retirement de bridges e hardcodes restantes com callers reais;
2. reduzir snapshots datados ainda presentes em docs ativos somente após migrar backlinks;
3. quando Supabase responder, regenerar tipos e remover o último blocker Trust sem cast paliativo;
4. quando Vercel/Actions voltarem, executar certificação same-SHA completa;
5. atualizar este checkpoint/roadmap somente com provas executadas.