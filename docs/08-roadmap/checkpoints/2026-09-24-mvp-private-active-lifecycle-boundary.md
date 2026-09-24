# Checkpoint — limpeza do grafo privado ativo (2026-09-24)

## Objetivo

Remover verticais pausadas da Conta/Central/gestão Business sem inverter a direção de dependências da arquitetura.

## Fronteira de lifecycle

O lifecycle canônico continua pertencendo a `src/app/config/productModuleRegistry.ts`,
`platformCapabilityRegistry.ts` e `lifecycleRegistry.ts`.

Arquivos dentro de `src/app` podem consumir esses owners diretamente. Já `core/*` e
`modules/*` não podem importar `app/config/lifecycleRegistry`: quando ainda precisam
consultar o estado de uma superfície, usam a projeção compatível `launchScope.ts` até que
o estado seja composto/injetado pela camada `app`. O gate de dependências protege essa direção.

## Mudanças

- a Conta deixa de anunciar Serviços e Comunidade enquanto esses domínios estão pausados;
- o resumo legado da Conta deixa de apresentar Posts, Serviços e Classificados como áreas ativas;
- o hub de Empresas deixa de expor Gastronomia, Delivery, Mobility e Public Analytics no grafo ativo;
- `useProfileHub` aposenta catálogos `operationalLinks`, `ecosystemLinks` e `moduleUrls` sem caller,
  removendo URLs/imports de verticais pausadas do runtime ativo da Conta;
- Billing continua pausado; recursos premium já concedidos podem permanecer gerenciáveis sem
  reabrir compra ou rota de planos;
- nenhum módulo pós-MVP foi ativado.

## Ratchets

Os testes privados impedem:

- links de Serviços/Comunidade na Conta enquanto esses módulos estão pausados;
- métricas de Posts/Serviços/Classificados no resumo do MVP;
- referências a `business.gastronomy`, Mobility ou Public Analytics no hub Business ativo;
- retorno dos catálogos órfãos de links pós-MVP pelo `useProfileHub`;
- imports diretos de lifecycle de `app` por camadas `core/modules`, já cobertos pelo validator de dependências.

## Release

Os blockers externos permanecem separados do frontend:

- #305: o Data Plane/SQL do Supabase ainda reproduziu `Connection terminated due to connection timeout`
  em 2026-09-24, apesar do projeto reportar `ACTIVE_HEALTHY`;
- #309: o GitHub Actions ainda precisa de um PAT Supabase com autoridade de deploy de Edge Functions.

Não criar fallback, redirect, retry artificial ou bypass de segurança para mascarar esses blockers.
