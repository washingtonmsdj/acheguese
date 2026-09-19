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

## 18/09/2026 · Feed da comunidade

### Escopo

Terceira tela priorizada no catálogo: feed público da comunidade, com identidade territorial, navegação contextual, ordenação, leitura de publicações, agenda lateral e estados de acesso.

### Alterações e decisões

- Mantive `CommunityOverviewSurface`, `CommunityFeed`, `useCommunityFeedSimple`, consultas de eventos/grupos e os filtros de `launchScope` como fontes canônicas; não foram ativadas funções desenhadas na prancha que permanecem desabilitadas.
- Corrigi o contraste do CTA público “Participar” no hero usando o token solar do tema, preservando a rota real de login.
- Tornei a prévia visual existente inspecionável no navegador interno com `visualMock=community-concept`: somente em `DEV`, a guarda de disponibilidade e a faixa do shell são atravessadas para a inspeção; ações e regras de produção continuam reais.
- A prévia pública mantém o compositor como entrada controlada: clicar leva ao login, sem habilitar publicação anônima.

### Testes e evidências

- TypeScript da aplicação passou.
- ESLint passou nos três arquivos alterados.
- `CommunityOverviewSurface.spec.tsx`: 6 testes passaram.
- `ComunidadePage.publicDeepLink.spec.tsx`: 5 testes passaram.
- Preview mantido aberto no navegador interno em `http://127.0.0.1:5175/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina?visualMock=community-concept`; a captura ao vivo confirmou hero, CTA legível, atalhos, compositor, filtros, posts e navegação inferior mobile.
- Uma execução agrupada dos testes encontrou timeout de inicialização de workers para dois arquivos, mas a repetição isolada dos dois contratos passou; o ambiente permanece lento para carregar módulos do feed.

### Pendências

- Validar a mesma composição em desktop com dados reais da Community quando a disponibilidade persistida do território estiver resolvida no ambiente.
- A prancha permanece referência visual; nomes, contagens, permissões e módulos ativos seguem os contratos do produto.

### Segunda passada — fidelidade ao concept

- Reestruturei a primeira dobra do feed para seguir a prancha: `TerritoryTopbar` claro, título “Comunidade”, subtítulo, composer com ações e cards de publicação em superfície branca; o hero fotográfico continua disponível nas visões territoriais que ainda dependem dele.
- Adicionei a navegação lateral do desktop com Início, Comunidade, Explorar, módulos ativos e Trocar território. A grade usa `10.75rem / minmax(0,1fr) / 20rem` a partir de `xl`, mantendo a agenda na terceira coluna.
- Mantive Posts, Grupos, Discussões, ordenação, consultas reais, launch scope e guards de acesso; o mock continua estritamente dev e o modo público não ganhou escrita anônima.
- Ajustei o composer para o texto do concept e as ações Foto/Pergunta/Publicar; o primeiro post `aviso` recebe o destaque solar da referência sem alterar o tipo persistido.
- A captura viva foi conferida lado a lado com `002-feed-comunidade.png` em viewport interno móvel de aproximadamente 425 px. A aba permanece aberta em `http://127.0.0.1:5175/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina?visualMock=community-concept`.

### Validação da segunda passada

- TypeScript da aplicação passou.
- ESLint passou nos quatro arquivos de código alterados nesta rodada.
- `CommunityOverviewSurface.spec.tsx`: 6 testes passaram.
- `ComunidadePage.publicDeepLink.spec.tsx`: 5 testes passaram.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- As alterações preexistentes da catalogação e segurança permanecem fora desta entrega.

## 18/09/2026 · Feed da comunidade — pranchas 116 e 117

As pranchas 116 e 117 passaram a ser a referência vigente do feed. Ajustei o preview visual e os contratos de composição para refletir o shell petróleo/solar, a aba `Publicações`, `Avisos`, `Grupos` e `Agenda`, composer compacto, filtros recentes, resposta em destaque e rail contextual do desktop. Os atalhos/cards de módulos antigos ficam fora do preview do concept e continuam preservados no fluxo canônico.

A prancha 117 também está coberta pelos estados demonstrativos de visitante, vínculo pendente, avisos com filtros, vazio e erro com recuperação. A política real não foi ampliada: publicação, login, representação autorizada e vínculo continuam sujeitos aos contratos existentes.

### Validação

- TypeScript da aplicação passou.
- ESLint passou nos arquivos alterados da superfície, topbar, composer, fixture, página e teste.
- `CommunityOverviewSurface.spec.tsx`: 6 testes passaram.
- `ComunidadePage.publicDeepLink.spec.tsx`: 5 testes passaram.
- Preview interno conferido ao vivo nas rotas `visualMock=community-concept` e `previewState=visitor|pending|empty|error`; a aba permanece aberta.

## 19/09/2026 · Refinamento responsivo — prancha 116

### Revisão visual e ajuste

- Recomparei a primeira dobra mobile com a prancha 116: cabeçalho territorial, título/subtítulo, abas, composer, filtros e primeiro post permanecem na mesma sequência e com densidade compacta; não foi acrescentado um bloco entre os filtros e o feed.
- Corrigi a faixa tablet do preview. Antes, o shell ocultava a navegação global a partir de `md`, enquanto a navegação contextual da prancha só aparecia a partir de 1000 px; entre 768 e 999 px não havia navegação. Agora essa faixa mantém a rail compacta de 72 px e o conteúdo reserva o mesmo espaço. Em 1000 px, a rail compacta cede à navegação completa embutida no concept, cuja coluna mede 174 px.
- A mudança fica limitada ao preview de desenvolvimento `visualMock=community-concept`; o shell das demais rotas e as permissões de participação não mudam.

### Validação e limite da evidência

- TypeScript da aplicação e ESLint dos dois componentes alterados passaram.
- `CommunityOverviewSurface.spec.tsx` e `ComunidadePage.publicDeepLink.spec.tsx`: 11 testes passaram.
- Verifiquei as classes responsivas compiladas em Edge nas larguras 390, 768, 999, 1000, 1024 e 1280 px: barra mobile em 390; rail tablet e recuo de 72 px em 768/999; rail oculta, recuo zerado e navegação interna ativa de 1000 px em diante.
- A aba do navegador interno continua aberta na rota `visualMock=community-concept` e mostra a composição mobile após o HMR.
- Limite: o Edge isolado não tinha o estado persistido do preview e ficou em “Carregando comunidade...”; por isso, os testes acima validam as regras responsivas compiladas, não uma captura renderizada da composição desktop em 1024/1440 px. Não repliquei credenciais nem alterei a sessão visível.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- A entrega mantém fora do commit os arquivos staged preexistentes de catalogação e segurança.
