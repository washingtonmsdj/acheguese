# Início da comunidade

## Escopo

Início, módulos, feed, negócios, agenda, mapa e estados. Não usar contagens ou conteúdo demonstrativo como fallback real.

## Referências visuais

- [001-home-inicial](historico/001-home-inicial.png) — Histórico — não aplicar automaticamente.
- [003-home-petroleo](historico/003-home-petroleo.png) — Histórico — não aplicar automaticamente.
- [008-home-territorio](historico/008-home-territorio.png) — Histórico — não aplicar automaticamente.
- [076-home-complexo-mobile](pranchas/076-home-complexo-mobile.png) — Referência para revisão.
- [077-home-complexo-desktop](pranchas/077-home-complexo-desktop.png) — Referência para revisão.
- [078-home-complexo-estados](pranchas/078-home-complexo-estados.png) — Referência para revisão.

## Conferência no projeto

Pontos de partida identificados (revalidar no checkout atual):

- `src/app/pages/TerritoryHomePage.tsx`.
- `src/app/config/launchScope.ts`.

## Aplicação e critérios de aceite

- Compare código e referência: já atende / precisa ajustar / melhoria futura / não aplicável, sempre com evidência de arquivo e comportamento.
- Preserve regras existentes, permissões e flags. Funcionalidade desenhada e desativada exige implementação completa antes de ativação.
- Consuma a SSOT de cores/fontes e componentes compartilhados. Não replique estilos hardcoded da imagem.
- Substitua nomes, valores, contagens e mapas ilustrativos por dados reais; sem conteúdo fictício em produção.
- Valide leitura e ações em mobile/desktop, teclado, contraste, carregamento, vazio, erro e falta de permissão.
- Registre decisão, alterações e verificações no REVISAO.md desta pasta. Não marque concluído pela semelhança visual.

## Pendências

Conferir detalhes menores na imagem original em resolução completa. Textos gerados, contadores, porcentagens e slogans podem conter inconsistências; o contrato funcional prevalece. Confira GUIA-PARA-IMPLEMENTAR.md para decisões transversais.
