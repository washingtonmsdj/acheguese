# Revisão — Central do entregador

Status: concluída para as superfícies das pranchas 035, 036 e 037.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Visão geral e oferta | Atende após ajuste | `src/modules/central/pages/CentralMotoboyConceptMockPage.tsx` (`overview`, `phase=offer`) | Mantida a disponibilidade, mapa, oferta e ações do entregador; avatar e imagem da oferta usam assets existentes | Mobile `389 × 867` sem overflow; CTA `Ver oferta` entre `y=697–741`, oferta entre `y=731–775`; desktop sem overflow |
| Coleta, entrega e conclusão | Atende após ajuste | `CentralMotoboyConceptMockPage.tsx` (`pickup`, `delivery`, `section=completion`) | Mantido o roteiro coleta → entrega → comprovante/problema/offline/histórico, sem confirmar estado financeiro ou localização real | Mobile `389 × 867`: CTAs finais entre `y=691–775`, sem clipping; histórico com ações até `y=733` e navegação fixa em `y=808–867` |
| Disponibilidade e área de atuação | Atende após ajuste | `CentralMotoboyConceptMockPage.tsx` (`state=availability`) | Áreas continuam ilustrativas no mock; localização permanece explicitamente desativada até contrato real | Desktop e mobile conferidos; mapa, áreas, perfil operacional, aviso e CTA dentro do frame |
| Escala desktop | Corrigido | `CentralMotoboyConceptMockPage.tsx` (`Sidebar`, shell desktop, `StateContent`) | Rail de `128px` e shell de `608px` reproduzem a janela compacta da prancha 037; conteúdo não é esticado até a largura do navegador | Desktop `1440 × 867`: conteúdo útil `576px`, sem overflow em visão geral, entrega e disponibilidade |
| Ritmo e viewport mobile | Corrigido | `src/index.css` e `CentralMotoboyConceptMockPage.tsx` | Margens editoriais globais neutralizadas somente no concept; navegação inferior fixa sem sobrepor o conteúdo | Mobile `389 × 867`: todos os oito estados auditados sem overflow documental ou do `main` |

Registrar branch/commit analisado, data, limitações e funcionalidades mantidas desativadas.

- Branch: `codex/reformulacao-entrada-comunidade`.
- Data da revisão: `20/09/2026`.
- O mock mantém dados, mapas e imagens demonstrativos apenas na rota `concept-mock`; disponibilidade, localização, ganhos e contatos continuam sem ativação de contratos de produção.
