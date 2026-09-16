# Core Pricing — contrato canônico

> Estado auditado em 2026-09-16. Para mobilidade, preço de produção é autoridade do servidor e da quote single-use; cálculo monetário local no browser não é contrato comercial.

## Ownership

- Regras persistidas: `pricing_rules` e tabelas relacionadas.
- Entrada canônica da aplicação: `src/core/pricing/instance.ts`.
- Emissão de preço de mobilidade: `MobilityPriceQuoteService` → RPC/Edge server-owned → `mobility_price_quotes`.
- Criação de corrida/entrega recebe `priceQuoteId`; não recebe tarifa, coordenadas ou identidade do passageiro como autoridade monetária.
- Administração de regras usa a instância canônica e os comandos privilegiados do `admin-pricing-rpc`.

## Estado comercial

Os valores atuais de `pricing_rules` são provisórios/fictícios de desenvolvimento. Eles não representam a política comercial aprovada do Achegue-se.

Em produção, uma regra de mobilidade só pode ser tratada como comercialmente utilizável quando o contrato canônico a reconhecer explicitamente como aprovada. Falha de regra, quote ou routing deve falhar fechada; nunca inventar tarifa de contingência.

## API de aplicação

Use a instância canônica quando um fluxo administrativo ou de leitura realmente precisar trabalhar com regras:

```ts
import { pricingService } from '@/core/pricing/instance';

const rules = await pricingService.listRules(true);
```

Para solicitar corrida ou motoboy, não use `calculateEstimate`, `calculateQuickEstimate` nem fórmula local. Emita uma quote pelo owner de mobilidade/pricing e passe apenas seu ID ao comando de criação.

Os antigos hooks `usePriceEstimate` e `useQuickPriceEstimate` foram aposentados por não terem callers de runtime e por representarem uma fronteira errada para preço contratual de mobilidade.

## Estrutura

```text
pricing/
├── instance.ts                      # entrada canônica da aplicação
├── services/
│   ├── MobilityPriceQuoteService.ts # emissão/consumo da quote server-owned
│   └── PricingService.ts            # implementação interna em transição
├── hooks/
│   └── index.ts                     # sem hooks de tarifa client-side
├── types/
└── index.ts
```

## Invariantes

- Browser não é autoridade de tarifa final.
- Não criar fallback monetário hardcoded.
- Não criar janelas/multiplicadores comerciais locais.
- Não usar velocidade média inventada para formar preço contratual.
- Não importar `PricingService.ts` diretamente fora de `instance.ts`.
- Não exportar singleton cru pelo barrel `services`.
- Distância/tempo de rota, quando necessários à quote, vêm do boundary de routing/server, não de aproximação comercial no componente.
- Valores e políticas comerciais precisam de aprovação explícita antes do lançamento.

## Dívida ainda aberta

`PricingService.ts` ainda contém implementação histórica de fallback, pico e estimativa de duração. Ela não deve ganhar novos callers. A remoção física desse código continua obrigatória antes de declarar pricing/mobilidade prontos para lançamento.
