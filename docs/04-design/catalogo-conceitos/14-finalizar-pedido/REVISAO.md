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

## Segunda rodada de fidelidade visual

- O padding mobile do shell passou para 16 px, o cabeçalho ficou mais compacto e o CTA fixo usa a mesma margem lateral do conteúdo.
- No mobile, quando a etapa está em Entrega ou Retirada, a modalidade `No local` não ocupa uma terceira coluna que não aparece na prancha; ela continua visível quando é o modo já selecionado, preservando o estado real do carrinho.
- Os estados ativos agora respeitam a diferença entre breakpoints: preenchimento teal no mobile, fundo claro com borda teal para a modalidade desktop e destaque amarelo para a entrega da loja.
- A identidade da loja usa o território do concept (`Santa Cruz · Salvador, BA`) quando o objeto carregado o fornece; o cartão de endereço usa o rótulo real da residência e ícone de casa, sem inventar endereço no runtime.

## Terceira rodada — tipografia SSOT

- A família permanece `Plus Jakarta Sans` via `font-heading`/`font-sans`, sem fonte local paralela.
- Os títulos de etapa foram normalizados para 24 px/700 no mobile e 30 px/700 no desktop, com line-height fechado; títulos de seção usam 16 px/700.
- Rótulos de interação e títulos internos usam 14 px/600–700; metadados, ajuda e estados auxiliares usam 12 px. O wordmark do header desktop usa 800, reservado pela SSOT para marca/display.
- Removi os valores arbitrários de 23,2 px e 10,9 px/11 px do checkout. A escala agora consome as classes canônicas `text-type-label`, `text-type-caption`, `text-type-micro` e `text-type-body`.
- Validação visual confirmou 24 px/700 no mobile e 30 px/700 no desktop no navegador interno, com o viewport restaurado ao padrão e a aba mantida aberta.

## Quarta rodada — estado “Outro endereço”

- Ao selecionar `Outro endereço`, o cartão vazio agora troca o rótulo para `Outro endereço`; ele não continua comunicando que o destino é o endereço do perfil.
- O editor de endereço permanece acionado somente pela escolha explícita e mantém o CTA fixo, o estado vazio real e as regras de autenticação já existentes.
- Conferi o estado aberto no navegador interno após HMR; nenhuma residência demonstrativa foi inserida na sessão.

Registrar branch/commit analisado, data, limitações e funcionalidades mantidas desativadas.
