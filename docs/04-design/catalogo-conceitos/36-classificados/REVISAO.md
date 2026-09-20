# Revisão de implementação

Status: concluída em 20/09/2026.
Branch analisada: `codex/reformulacao-entrada-comunidade`.

| Verificação | Estado |
| --- | --- |
| Comparar filtros, categorias e condições com os contratos atuais | Conferido no mock conforme `sections/types.ts`: preço, condição, bairro e foto |
| Validar favoritos, perguntas, mensagens e denúncia por perfil | Ações visuais separadas; pergunta pública e conversa privada não são o mesmo canal |
| Respeitar contato privado e disponibilidade de comunicação | Contato aparece como disponibilidade condicionada; nenhum telefone é exposto |
| Diferenciar todos os estados do anúncio | Ativo, vendido/encerrado e vazio foram representados sem misturar mensagens |
| Preservar histórico sem permitir novas perguntas no encerrado conforme política | Estado encerrado mantém a seção histórica e bloqueia nova pergunta |
| Testar paginação, filtro vazio, rede indisponível e retorno ao resultado | Filtros, vazio e retorno ao resultado foram materializados; paginação/rede permanecem responsabilidade do módulo canônico |
| Medir acessibilidade e verificar mobile/desktop | Verificado no navegador interno; alvos nomeados e sem overflow horizontal |

Não aplicar os textos demonstrativos como regras de negócio sem consultar o README. Não substituir tokens globais por cores hardcoded nas páginas.

## Implementação do concept

- Rota visual isolada em `DEV + /classificados?concept-mock=1`; as páginas/serviços canônicos do módulo continuam preservados.
- Mobile: descoberta com busca, filtros, categorias, cards, detalhe, conversa privada, filtros e anúncio encerrado.
- Desktop: rail territorial, topbar com território e busca, galeria/detalhe, perguntas públicas, contato condicionado, painel do anúncio, semelhantes e três pranchas de estado.
- As imagens são demonstrativas e usam assets territoriais existentes; não foi inventado selo de verificação, endereço residencial, checkout, garantia de compra ou entrega integrada.

## Validação visual

- Navegador interno mantido aberto nas duas vistas: mobile `491 × 1108` e desktop `1707 × 960`.
- Foram comparados descoberta, detalhe, conversa, filtros e encerrado no mobile; detalhe desktop e os três estados inferiores no desktop.
- `body.scrollWidth` permaneceu dentro do viewport; após navegação o mobile chegou a `471` de largura útil no detalhe, sem overflow horizontal. Logs da aba ficaram sem erro.
