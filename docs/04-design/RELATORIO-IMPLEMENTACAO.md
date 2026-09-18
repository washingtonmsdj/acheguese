# Relatório de implementação — Reformulação do Achegue-se

## 18/09/2026 · Entrada do site

### Escopo

Primeiro fluxo implementado conforme a ordem priorizada no catálogo: entrada pública community-first do MVP no Complexo do Nordeste de Amaralina.

### Referências utilizadas

- `docs/04-design/catalogo-conceitos/GUIA-PARA-IMPLEMENTAR.md`.
- `docs/04-design/catalogo-conceitos/README.md` e `classificacao.json`.
- `docs/04-design/catalogo-conceitos/02-entrada-do-site/README.md`.
- `docs/04-design/catalogo-conceitos/02-entrada-do-site/pranchas/059-entrada-mvp-complexo.png`.

### Funcionalidades preservadas

- Exploração pública da comunidade sem cadastro.
- Derivação do território e dos bairros a partir de `TERRITORY_CONFIG` e fallback público versionado.
- Mapa real com carregamento progressivo, limite territorial oficial e estados de carregamento, lentidão e indisponibilidade.
- Registro do último território ao entrar na comunidade.
- Reflexo de sessão real no acesso da conta.
- Indicação de comunidade por rota pública própria.
- Navegação pública, foco visível, menu móvel com Escape e retorno de foco.

### Alterações e melhorias

- Reforcei a hierarquia visual da prancha 059 no mobile e desktop usando o SSOT de tokens.
- Aumentei a legibilidade de chips, textos auxiliares e CTA.
- Ajustei alvos de toque móveis para uso confortável.
- Adicionei relação semântica entre a comunidade apresentada e a explicação de que explorar não depende de morar no território.
- Mantive textos, nomes, bairros, links e estados dependentes das fontes reais do produto.

### Testes e evidências visuais

- 24 contratos regressivos da entrada passaram.
- TypeScript da aplicação passou.
- ESLint do componente passou.
- Capturas verificadas em 390×844 e 1440×900: `test-results/entry-updated-mobile.png` e `test-results/entry-current.png`.
- Smoke browser em 360, 390, 768, 1024 e 1440 px: título e CTA visíveis, sem rolagem horizontal; menu móvel abre e fecha com Escape.
- Prettier continua pendente por divergências preexistentes na formatação integral dos arquivos compartilhados; não foi aplicado reformatador global.

### Pendências

- Executar o e2e completo da entrada quando o conjunto de fixtures de rede estiver disponível no ambiente.
- Avançar para a página `05-home-comunidade` somente após a revisão deste fluxo.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Base: `main`/`origin/main`.
- Commit e PR: pendentes da conferência final; alterações preexistentes da catalogação e segurança não fazem parte desta entrega.

## 18/09/2026 · Home da comunidade

### Escopo

Segunda tela priorizada no catálogo: Home territorial do Complexo, com primeira dobra mobile, módulos rápidos, convite de visitante e preservação dos estados reais de dados.

### Referências utilizadas

- `docs/04-design/catalogo-conceitos/05-home-comunidade/README.md`.
- `docs/04-design/catalogo-conceitos/05-home-comunidade/pranchas/076-home-complexo-mobile.png`.
- `docs/04-design/catalogo-conceitos/05-home-comunidade/pranchas/077-home-complexo-desktop.png`.
- `docs/04-design/catalogo-conceitos/05-home-comunidade/pranchas/078-home-complexo-estados.png`.

### Alterações e decisões

- Mantive `useTerritoryHomeData`, `useCommunityAccess`, os links territoriais da SSOT e o filtro de `launchScope`; não há conteúdo demonstrativo usado como fallback de produção.
- Levei o título da Home para a primeira dobra mobile, contíguo ao topbar petróleo e aos atalhos, sem alterar o componente compartilhado `TerritoryTopbar`.
- Incluí Eventos nos atalhos somente porque `events` já está habilitado no catálogo de lançamento e acrescentei “Ver todos” à grade desktop.
- Adicionei um convite de visitante com as rotas reais de cadastro/login, condicionado à disponibilidade real da comunidade.
- Mantive carregamento, vazio, erro parcial, estados de comunidade e mapa, além das superfícies desativadas por flag.

### Testes e evidências

- TypeScript da aplicação passou.
- ESLint de `src/app/pages/TerritoryHomePage.tsx` passou.
- Build Vite em modo development passou com 6.089 módulos transformados; o aviso restante é apenas de Browserslist desatualizado.
- Contratos específicos `territory-home-launch-scope.test.ts` e `home-header-runtime-regression.test.ts` passaram: 4 testes.
- Preview mantido aberto no navegador interno em `http://127.0.0.1:5175/ba/salvador/complexo-do-nordeste-de-amaralina?concept-mock=1` para acompanhamento em tempo real; essa é a rota territorial da Home, enquanto `/comunidade/...` passa pela disponibilidade do módulo Community.
- Captura ao vivo confirmou o título mobile, rótulos legíveis e a composição de três atalhos mais “Ver todos”; a resolução de dados do ambiente pode manter o estado de carregamento antes da Home.
- O contrato legado `territorial-copy.test.ts` continua exigindo strings antigas (`Hoje em ...` e `Vale saber em ...`) ausentes do componente antes desta rodada; não foi reintroduzido texto morto para satisfazê-lo.
- O mock visual continua restrito ao parâmetro explícito de desenvolvimento e não substitui consultas reais em produção.
