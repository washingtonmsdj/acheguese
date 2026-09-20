# Revisão — Cardápio público e seleção de itens

Status: revisada em 19/09/2026.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Cabeçalho, hero e identidade | Ajustado | `GastronomyDetailConceptPreviewPage.tsx`: header público, hero, avatar textual, nome, categoria, localidade e ações Salvar/Compartilhar | Alinhar a identidade ao avatar sobreposto e usar bookmark no lugar de coração | Comparação visual mobile e desktop no navegador interno |
| Formas de atendimento | Ajustado | A prancha 019 mostra Entrega, Retirada e No local, com No local selecionado | Habilitar as três opções no mock e iniciar em `dine-in`; manter a cópia responsiva de horários/taxa | AX confirmou três radios e No local selecionado |
| Busca e categorias | Ajustado | O concept mostra busca, abas Todas/Refeições/Bebidas/Sobremesas e não mostra preço, ordenação ou alternância de grade | Remover esses controles extras da superfície visual, preservando o código de filtros e modos para evolução futura | AX não expõe controles extras; abas e busca permanecem acessíveis |
| Oferta, itens e seleção | Ajustado | Oferta, cinco itens, Pudim indisponível e Moqueca selecionada correspondem à prancha | Ajustar a imagem da oferta, o contorno da linha selecionada e manter estados de disponibilidade | Capturas mobile/desktop após HMR |
| Personalização e carrinho | Já atende com refinamento | Tamanho, adicionais, observações, quantidade, CTA amarelo e carrinho fixo já existem no componente | Aumentar a imagem do item no desktop e preservar cálculo/fluxo demonstrativo para checkout | AX confirmou campos, quantidades, CTA e barra do carrinho |

## Limites e decisões

- A rota `/gastronomia/ba/salvador/pituba/sabores-da-ana?concept-mock=1` é um preview visual de desenvolvimento; dados, carrinho e checkout demonstrativos não substituem contratos ou persistência de produção.
- O modo de grade, filtros de preço e ordenação continuam implementados no código, mas ficam fora da superfície inicial porque não aparecem na prancha 019.
- O teste `GastronomyTerritoryRuntime.spec.tsx` não iniciou os casos nesta rodada porque o ambiente Vitest não expôs `window.localStorage` e falhou no `beforeEach` ao chamar `.clear()`; TypeScript e ESLint do componente passaram.
- Branch analisada: `codex/reformulacao-entrada-comunidade`. Data: 19/09/2026.
