# Revisão — Visão geral da loja

Status: revisada em 19/09/2026.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Auditoria desta página | Atendida no preview DEV-only | `src/modules/business/dashboard/pages/BusinessManagementConceptPreviewPage.tsx`, rota `/central?concept-mock=1` | Manter o preview isolado por `concept-mock`; a operação real segue nas rotas protegidas | Navegador interno em mobile e desktop |
| Fidelidade mobile/desktop | Atendida com ajuste fino | Prancha `016-loja-visao-geral.png`; shell global, navegação do negócio, aviso, atendimento, cardápio, publicações e links inferiores presentes | Preservar tokens Territory Vivo e a hierarquia existente | Comparação visual lado a lado |
| Ações e permissões | Mantidas no escopo do mock | `openMessages`, `openMenu`, publicação, horários e links de navegação continuam conectados | Não habilitar dados demonstrativos no fluxo de produção | Typecheck e interação visual |

### Limitações

- A prancha é um concept demonstrativo; nomes, contagens, imagens e status permanecem confinados ao preview de desenvolvimento.
- O viewport explícito do navegador é traduzido pelo painel para CSS pixels com `devicePixelRatio` próprio; validei a composição em mobile e desktop e restaurei o viewport padrão ao final.

Registrar branch/commit analisado, data, limitações e funcionalidades mantidas desativadas.
