# Revisão — Expansão e interesse em outras comunidades

Status: implementada e revisada em 19/09/2026.

Referência principal: `pranchas/060-expansao-interesse.png`.
Branch da revisão: `codex/reformulacao-entrada-comunidade`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Shell e viewport mobile | Ajustado | `src/app/pages/CommunityIndicationPage.tsx`, `src/index.css` | Manter o fluxo centralizado, com eixo de 16 px no mobile e largura máxima compatível com a prancha | Conferido em viewport mobile padrão e em largura reduzida equivalente ao frame do concept |
| Indicação de região | Implementado | `CommunityIndicationPage.tsx` | Primeira etapa reproduz título, apoio, Estado, Cidade, Bairro, relação opcional, aviso contextual e CTA `Enviar indicação` | Campos obrigatórios, asteriscos, foco e CTA desabilitado foram verificados no navegador interno |
| Confirmação de contato | Implementado em segunda etapa | `CommunityIndicationPage.tsx`, `CommunityInterestRegistrationService.ts` | Nome e contato continuam obrigatórios no contrato real; foram movidos para uma etapa explícita para preservar o viewport da primeira prancha sem enviar dados incompletos | Transição só ocorre com região preenchida; retorno para os dados da região funciona |
| Estado de erro | Ajustado | `src/index.css` | Erros do Turnstile e do registro permanecem visíveis e usam a paleta SSOT | Estilo de alerta revisado; contrato de submissão não foi alterado |
| Rota e regra de comunidade | Mantidos | `src/app/routes/AppRoutes.tsx`, `CommunityInterestPage.tsx` | `/indicar-comunidade` é a entrada funcional; `/comunidade/.../interesse` continua bloqueada quando a comunidade municipal não está disponível | A rota bloqueada foi conferida e não recebeu ativação artificial |
| Dados demonstrativos | Preservados como contexto controlado | nota `is-starting` da tela e serviço de registro | O texto inicial explica o território de partida, sem criar comunidade, vínculo ou promessa de data | Nenhum dado falso foi persistido ou enviado |

## Decisões de implementação

- A imagem apresenta a indicação de região como uma tela curta, mas o contrato autoritativo de registro exige `fullName`, `email` e demais dados de contato. A interface agora separa intenção de indicação e confirmação de contato, sem burlar o serviço nem fabricar valores.
- A tela usa os tokens territoriais já existentes para cor, tipografia, borda, foco, estados desabilitado e alerta. Não foram copiados estilos ou dimensões da imagem como valores de produção.
- A etapa de contato mantém os dados da região no mesmo formulário para que a submissão continue íntegra. Em viewport estreito, o conteúdo rola pelo container principal; não há corte vertical nem overflow oculto.

## Validação

- Navegador interno: conferidos estado inicial, CTA desabilitado, preenchimento de Estado/Cidade/Bairro, transição para contato, retorno e visibilidade da aba.
- Viewport mobile padrão: `425 × 1108` CSS px; largura reduzida equivalente ao frame: `376 × 693` CSS px.
- `npm run typecheck:app`.
- ESLint no componente alterado.
- `git diff --check`.

Limitação mantida: a prancha mostra conteúdo ilustrativo de confirmação e conta; esses estados continuam dependentes do serviço e das permissões reais e não foram simulados como sucesso persistido.
