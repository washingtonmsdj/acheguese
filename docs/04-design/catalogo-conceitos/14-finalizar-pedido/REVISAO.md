# Revisão — Finalizar pedido

Status: revisada em 19/09/2026.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Auditoria desta página | Ajustado | `GastronomyCheckoutConceptSurface.tsx`, `useDeliveryDestination.ts` e as pranchas 021/024 | Reorganizar a superfície para o mesmo ritmo do concept, sem ativar a entrega por plataforma antes do contrato E2E | Comparação visual mobile/desktop no navegador interno, TypeScript, ESLint e auditorias de checkout |

## Decisões de implementação

- O desktop agora usa o cabeçalho teal, identidade da loja junto ao título, stepper e a ordem visual `1. Recebimento` → `2. Endereço e destinatário` → `3. Pagamento`, com o resumo do pedido fixo na coluna lateral.
- O cartão de endereço mobile permanece compacto quando não há residência salva. O editor completo só abre por ação explícita (`Adicionar`, `Outro endereço` ou continuação sem endereço), evitando o bloco de formulário aberto e o excesso de altura observado na comparação.
- A opção `Motoboy Achegue-se` aparece como referência visual, mas fica desabilitada enquanto `isPlatformCourierCheckoutAvailable()` permanecer falso. A loja continua sendo a única modalidade ativável no checkout oficial, conforme `checkoutRules.ts` e `GastronomyCheckoutService`.
- O fluxo continua consumindo carrinho, perfil, endereço, modalidades, pagamentos, taxas e validação de cobertura dos hooks/serviços existentes. Nenhum dado ilustrativo das pranchas foi promovido para produção.

## Validação e limitações

- `npm run typecheck:app`: passou.
- ESLint em `GastronomyCheckoutConceptSurface.tsx` e `useDeliveryDestination.ts`: passou.
- `GastronomyCheckoutConsistencyAudit.spec.ts`, `checkoutRules.spec.ts` e `GastronomyCheckoutService.spec.ts`: 10 testes passaram.
- `git diff --check`: passou.
- Comparei o fluxo pelo navegador interno em mobile e desktop: endereço inicial, redução do editor aberto, cabeçalho, ordem das seções, opções de recebimento, resumo lateral e CTA fixo. O viewport foi restaurado ao padrão ao final; a aba permanece aberta para acompanhamento.
- A conta de desenvolvimento não possui uma residência salva no momento da captura; por isso o cartão mostra o estado real “Informe um endereço completo” em vez dos dados demonstrativos Casa/Ana Oliveira da prancha. O layout e as ações permanecem os mesmos quando o hook retorna uma residência.

Branch analisada: `codex/reformulacao-entrada-comunidade`. Data: 19/09/2026.

Registrar branch/commit analisado, data, limitações e funcionalidades mantidas desativadas.
