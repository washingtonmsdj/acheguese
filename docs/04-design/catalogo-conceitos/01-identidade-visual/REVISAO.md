# Revisão — Identidade visual e logo

Status: concluída em 20/09/2026.

Branch analisada: `codex/reformulacao-entrada-comunidade`.
Referência vigente: `pranchas/005-logo-alternativa.png`; `historico/004-identidade-simbolo.png` permanece somente como histórico.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Wordmark aprovado | Já atende | `src/shared/components/territory-vivo/TerritoryTopbar.tsx`, `src/modules/messaging/pages/MensagensPage.tsx` e shells de conceito | Manter `achegue-se.` em minúsculas, com ponto solar; não substituir por imagem raster nem por outra marca | Screenshot desktop do preview de perfil confirmou wordmark no topo e no rail |
| Cores da marca | Já atende pela SSOT | `src/index.css` e `src/styles/theme.ts` | Preservar petróleo `#123E3D`, solar `#F3CB4C`, marfim `#FAFBF7` e texto `#203534`; superfícies usam tokens territoriais | Equivalência HSL/HEX conferida no SSOT e aplicada nos previews mobile/desktop |
| Tipografia | Já atende pela SSOT | `src/index.css` (`--font-sans`/`--font-heading`) e `tailwind.config.ts` | Manter Plus Jakarta Sans e a escala canônica; não criar fonte ou peso paralelo para o logo | Wordmark e títulos conferidos visualmente no viewport desktop e no mobile |
| Símbolo reduzido e ícone | Proposta não aprovada | README da página declara que a alternativa de símbolo não constitui aprovação; `public/images/logo-icon.png` é um asset legado multicolorido | Não introduzir o símbolo da prancha 005 em produção e não usar o asset legado como marca Achegue-se | Ausência do símbolo verificada nos shells atuais; o wordmark permanece consistente com as demais pranchas aprovadas |
| Variações claro/escuro | Já atende | `TerritoryTopbar.tsx`, variantes `light`/`brand` | Usar petróleo em superfícies claras, branco em barra petróleo e solar apenas no ponto/destaque | Variações conferidas nos headers dos previews e sem contraste dependente de imagem |
| Acessibilidade da marca | Já atende | Links com `aria-label="Achegue-se — início"` e foco visível nos shells | Preservar link semântico e foco; texto alternativo não deve depender do símbolo | AX tree dos previews expôs o link de início e nenhuma imagem de marca obrigatória |

## Decisão

Não houve alteração de código nesta entrada porque a SSOT existente já corresponde à marca aprovada. A prancha 005 apresenta uma alternativa de símbolo, mas o próprio documento determina que ela não é aprovação; promovê-la seria infiel ao contrato visual vigente e criaria uma segunda marca. A identidade já é consumida pelos componentes compartilhados e pelos tokens globais, portanto a implementação correta é preservar o wordmark e registrar a auditoria.

## Limitações e regras preservadas

- `public/images/logo-icon.png` não foi promovido nem removido: outros fluxos podem tratá-lo como asset legado, e sua remoção seria uma mudança fora do escopo visual.
- Não foram extraídas cores ou dimensões de pixels da prancha; a SSOT continua sendo `src/index.css`, `tailwind.config.ts` e `src/styles/theme.ts`.
- Não existe rota de produto para “identidade visual”; a validação foi feita nos shells compartilhados que materializam a marca.

## Validação

- Referência 005 comparada visualmente com o wordmark renderizado no preview desktop do perfil do anunciante.
- Mobile e desktop mantidos abertos no navegador interno; os headers expuseram a marca com ponto solar e sem overflow.
- TypeScript, ESLint e `git diff --check` já haviam passado no último lote de implementação; esta rodada alterou somente documentação de auditoria.
