# SALVADOR.READINESS.IMPLEMENTATION.1

**Data:** 2026-07-24
**Base:** `SALVADOR-READINESS-REPORT.md` e `TERRITORY-GOVERNANCE.md`
**Escopo:** eliminacao dos bloqueios P0 da Home, rollout publico e residuos SSOT. A importacao dos 170 boundaries ficou fora desta sprint.

## Resultado executivo

Os bloqueios P0 desta sprint foram implementados sem alterar o contrato ou a arquitetura do dominio Territory.

- A Territory Home deixou de apresentar conteudo editorial estatico como se fosse atividade real.
- Feed, empresas e eventos agora sao derivados das consultas SSOT filtradas pelo Territory resolvido.
- URLs da Home sao construidas a partir da base territorial resolvida.
- CTAs e rotas territoriais de comunidade, empresas, servicos, classificados, eventos, gastronomia, vagas, mapa/mobilidade, busca e categoria de empresas respeitam o rollout efetivo.
- O SSOT remoto foi corrigido: Pelourinho e o distrito residual `Salvador` nao estao mais ativos, e a cidade canonica possui coordenadas canonicas.
- Nenhum boundary novo foi importado.

## Respostas solicitadas

### Territory Home agora utiliza somente SSOT?

Sim, na superficie territorial auditada. Os blocos de pulso, feed, empresas e eventos sao preenchidos por hooks e services reais, com empty states oficiais quando o modulo esta indisponivel ou sem dados. Labels de navegacao e textos de estado permanecem estaticos por serem copy de interface, nao dados de demonstracao.

### Existe algum dado mock restante?

Nao foi mantido dado mock na Territory Home. Foram removidos numeros, nomes, horarios, ofertas, alertas e posts demonstrativos. Nao foi realizada nova auditoria de mocks fora do escopo desta sprint.

### O rollout agora funciona por bairro?

Sim. O Home consulta o rollout efetivo do Territory resolvido, e o gate publico usa a precedencia existente do `RolloutService`: override local do bairro, depois heranca territorial, depois default inativo. Grupos continuam avaliando os membros ativos pelo `GroupAvailabilityService`.

As rotas de busca territorial passaram a usar o mesmo gate. Mapa/mobilidade e categoria de empresas tambem deixaram de escapar do gate.

### Ainda existe codigo especifico para Salvador?

Nao foi introduzido codigo especifico para Salvador nesta implementacao. A Home usa parametros e Territory resolvido; a configuracao de lancamento continua env-driven, conforme a governanca. Nao ha branch, slug ou URL fixa de Salvador nos caminhos alterados.

### Os residuos foram eliminados?

Sim, no SSOT remoto verificado:

- Pelourinho ativo: eliminado por `status = 'inactive'`.
- Distrito residual `Salvador`: eliminado por `status = 'inactive'`.
- Coordenadas da cidade canonica: `-12.971111, -38.510833`, com `coordinate_status = 'canonical'`.

A migration `20260724120000_salvador_readiness_implementation_1.sql` registra a mesma operacao de forma idempotente, com verificacoes e soft-delete conforme a regra R15.

## Arquivos principais

- `src/app/pages/TerritoryHomePage.tsx`: remove dados estaticos, usa SSOT, rollout e URLs contextuais.
- `src/core/rollout/hooks/useTerritoryModuleRollouts.ts`: leitura agregada do rollout efetivo sem alterar o contrato do dominio.
- `src/core/rollout/services/RolloutService.ts`: inclui gastronomia, eventos e vagas na lista de modulos ativos.
- `src/app/routes/territorial/TerritorialModulePages.tsx`: gate por Territory resolvido para os modulos publicos.
- `src/app/routes/sections/AppLayoutRoutes.tsx` e `src/app/routes/lazyImports.ts`: busca territorial encaminhada ao gate.
- `supabase/migrations/20260724120000_salvador_readiness_implementation_1.sql`: limpeza SSOT e coordenadas canonicas.

## Validacao

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 13 warnings preexistentes de projecao manual de marcadores em outras telas |
| `npm run build` | PASS |

## Observacoes fora do escopo

1. Salvador continua com somente 4 boundaries reais; a importacao dos demais 166 bairros permanece para a sprint exclusiva de boundaries.
2. O banco atualmente possui rollouts explicitos na cidade, mas nenhum override local nos 170 bairros. O motor por bairro esta pronto; enquanto nao houver override local, os bairros herdam o rollout da cidade conforme o contrato congelado.
3. A tabela remota de migrations ainda nao registra esta nova migration porque a limpeza foi aplicada diretamente pelo cliente Supabase configurado para validar o SSOT. A migration permanece no repositorio e deve passar pelo pipeline normal de deploy; ela e idempotente.
4. Nao foram implementados novos modulos, UX, features, conceitos de Territory ou boundaries nesta sprint.
