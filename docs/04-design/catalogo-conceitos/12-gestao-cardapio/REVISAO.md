# Revisão — Gestão do cardápio

Status: revisada em 19/09/2026.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Shell e identidade do negócio | Já atende | `BusinessMenuConceptPreviewPage.tsx`: rail desktop, cabeçalho territorial, identidade `Sabores da Ana` e navegação inferior mobile | Preservar a composição existente e a responsividade | Comparação visual mobile e desktop no navegador interno |
| Hierarquia do mobile | Ajustado | A prancha 017 mostra título, CTA amarelo, abas, busca, dois filtros e lista; o preview tinha controles extras de modo de visualização e selos sobre as fotos | Remover os controles de lista/grade da superfície do concept e os selos `Destaque` das linhas, mantendo o destaque disponível no editor | Captura mobile após HMR; filtros exibem `Categoria` e `Status` |
| Filtros desktop | Ajustado | A prancha usa `Todas as categorias` e `Todos os status` com campos mais largos | Usar rótulos responsivos e larguras alinhadas à coluna de itens | AX desktop confirmou os dois valores e a ausência do modo de visualização |
| Lista e editor | Já atende | Seis itens, Moqueca selecionada, preço/status e drawer `Editar item` correspondem à prancha | Preservar linhas, estados de disponibilidade, paginação demonstrativa e edição detalhada | AX confirmou seis itens, linha selecionada, campos, ações e drawer |
| Categorias e estados alternativos | Já atende no preview | Aba `Categorias`, busca, filtros, vazio e ações de adicionar/renomear/excluir já estão implementados no componente | Manter as interações locais do preview sem inventar persistência de produção | TypeScript e ESLint passaram |

## Limites e decisões

- A rota `/central/cardapio?concept-mock=1` é um preview visual de desenvolvimento; os dados ilustrativos e as ações locais não substituem o cardápio real, permissões ou persistência.
- O drawer permanece aberto no desktop para reproduzir a prancha; no mobile, a edição ocupa a superfície inteira e retorna por `Cardápio`, preservando a leitura em viewport estreito.
- A visualização em grade continua disponível no código do preview para não remover a capacidade já implementada, mas seus controles foram mantidos fora desta superfície porque não aparecem na prancha 017.
- Branch analisada: `codex/reformulacao-entrada-comunidade`. Data: 19/09/2026. O commit da entrega será registrado no relatório geral após a validação final.
