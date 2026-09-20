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

## 19/09/2026 · Refinamento de avisos e estados — prancha 117

### Ajustes

- Removi o painel externo e o segundo título redundante de Avisos; os filtros e relatos/comunicados agora seguem diretamente a área de conteúdo do shell 116.
- Diferenciei visualmente relato e comunicado, aumentei a hierarquia tipográfica dos cards e mantive a autoria autorizada fora do cartão do comunicado, como na prancha 117. O território não é repetido quando já aparece nos detalhes.
- Removi “Para perfil autorizado.” (anotação da prancha, não texto de produto). A ação “Criar publicação” no estado vazio só aparece quando `canCreatePost` permite; a tela de erro mantém apenas sua recuperação.
- O mock de comunicado demonstra a identificação “Publicado por representante autorizado.”; isso não concede nem simula permissão no fluxo de produção.

### Validação e evidências

- `CommunityOverviewSurface.spec.tsx` e `ComunidadePage.publicDeepLink.spec.tsx`: 12 testes passaram, incluindo filtros de avisos, ausência de cópia instrucional e ação condicionada à permissão.
- TypeScript da aplicação e ESLint dos três arquivos de código alterados passaram.
- Revisei a aba Avisos no navegador interno após HMR, lado a lado com a prancha 117; a aba original permanece aberta para acompanhamento. A largura do painel interno não equivale ao artboard desktop, então esta passada não certifica captura pixel a pixel em 1440 px.
- `git diff --check` passou; apenas avisos de conversão de fim de linha do Git foram emitidos.

### Git

- Entrega limitada ao componente, fixture, testes e este relatório; os arquivos staged preexistentes de catalogação e segurança permanecem fora do commit.

## 19/09/2026 · Refinamento visual dos estados de participação — prancha 117

### Ajustes

- Recomparei visitante, vínculo pendente, vazio e erro com a prancha 117. Ampliei e redesenhei as ilustrações vetoriais para ocupar a largura prevista no concept, mantendo o ritmo compacto entre arte, título, texto, ações e amostra pública.
- Corrigi os preenchimentos translúcidos dos SVGs para usar diretamente as variáveis de cor do território; isso evita classes de opacidade não geradas pelo tema, que apareciam pretas no navegador.
- Visitante e vínculo pendente continuam mostrando somente uma publicação pública de exemplo, sem composer nem filtros redundantes. Esse recorte pertence apenas ao preview visual de desenvolvimento; consultas, permissões e conteúdo real da produção não mudam.
- O estado vazio preserva a ação condicionada a `canCreatePost`; erro mantém apenas a recuperação. Não reintroduzi a anotação “Para perfil autorizado.” como texto de interface.

### Validação e evidências

- `CommunityOverviewSurface.spec.tsx`: 9 testes passaram; `ComunidadePage.publicDeepLink.spec.tsx`: 5 testes passaram, executados isoladamente por causa do timeout de inicialização observado quando os workers são agrupados.
- TypeScript da aplicação e ESLint dos dois arquivos de código passaram; `git diff --check` passou.
- Comparei as pranchas 117 e a renderização ao vivo no navegador interno, no viewport móvel disponível, após o HMR: visitante, pendente, vazio e erro; conferi também o token da nuvem, a amostra única e a ausência de filtros/composer nos estados de participação.
- Limite da evidência: esta passada valida visualmente o viewport móvel do navegador interno; não certifica captura pixel a pixel do artboard desktop em 1440 px. A aba continua aberta na rota principal do preview para acompanhamento.

## 19/09/2026 · Explorar e encontrar — prancha 009

### Auditoria e ajustes

- Comparei `BuscaPage` com `07-explorar/pranchas/009-explorar-mapa-lista.png`. A página já usa busca federada, escopo territorial com descendentes, marcadores derivados de resultados reais e a rota canônica do mapa; categorias pausadas continuam sob `launchScope`.
- No filtro padrão `Todos`, removi a linha mobile sem controles ativos e o link “Limpar” órfão; preservei 12 px entre as abas e o título dos resultados. A linha reaparece ao abrir Filtros e permanece no desktop; “Limpar” só aparece com uma categoria selecionada.
- Mantive o campo do cabeçalho sincronizado com a query demonstrativa apenas no preview de desenvolvimento, e separei o nome curto do topbar do nome territorial completo usado nos resultados. O mock segue sob `import.meta.env.DEV`; consultas, navegação e dados reais não foram substituídos.
- “Lista” agora é indicador da visualização atual, não um botão sem ação. “Mapa” e “Ver no mapa” continuam apontando para a rota territorial real.
- A página mostra recuperação com nova tentativa quando o hook expõe erro. Limite de contrato encontrado: `SearchService.search` e seus provedores atualmente convertem falhas em resultados vazios; portanto, falha de provedor não chega a esse estado e continua pendente em nível de serviço.

### Validação e evidências

- `BuscaPage.spec.tsx`: 4 testes passaram, cobrindo query/território, filtros desativados, ausência de “Limpar” no padrão, query/nome territorial do concept e retry de erro exposto pelo hook.
- TypeScript da aplicação, ESLint nos três arquivos de código e `git diff --check` passaram.
- Comparei no navegador interno a renderização mobile do app em modo demonstrativo de desenvolvimento (`concept-mock=1`), em aproximadamente 504 × 1120 px, com a prancha; a aba permaneceu no fluxo Explorar. O painel interno não permite fixar a largura desktop nesta rodada; não considero a aparência desktop certificada pixel a pixel.
- Os documentos e imagens do catálogo desta página foram preservados, conforme o escopo da implementação.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Somente os arquivos desta implementação e este relatório entram no commit; alterações staged preexistentes de catalogação e segurança permanecem excluídas.

## 19/09/2026 · Perfil público profissional — prancha 010

### Auditoria e ajustes

- Comparei o perfil público de João Santos com `08-perfil-profissional/pranchas/010-perfil-profissional.png` em mobile e desktop. O preview usa o mock somente quando `import.meta.env.DEV` e `concept-mock=1`; a rota pública continua consultando o profissional real fora desse modo.
- Alinhei o cabeçalho do concept: avatar demonstrativo no estado visual, utilitários de busca/notificação ocultos apenas no mobile do preview e mantidos no desktop. Isso não transforma visitantes reais em usuários autenticados fora do mock.
- Reduzi a distância entre avatar e identidade no mobile e mantive a hierarquia da prancha: nome, categoria, localidade, território de atendimento, descrição e CTA amarelo.
- Transformei as abas Sobre, Serviços, Trabalhos e Recomendações em âncoras navegáveis para as seções existentes, com `scroll-mt` para respeitar o cabeçalho fixo. “Ver fotos” também aponta para a galeria presente, sem criar uma ação fictícia.
- Mantive o CTA conectado ao `ProfessionalLeadRequestDialog`, o estado de salvar, o compartilhamento, a cobertura territorial e os dados reais do perfil; não adicionei avaliações, fotos ou contagens inexistentes ao fluxo de produção. O nome acessível do CTA explicita a solicitação de orçamento sem alterar o texto visual do concept.

### Validação e evidências

- `npm run typecheck:app`: passou.
- ESLint passou em `ProfissionalPublicPage.tsx` e `TerritoryTopbar.tsx`.
- Contratos profissionais: 3 arquivos, 10 testes passaram (`professionalPublicRoutes`, `ProfessionalUrlService` e `ProfessionalLeadSSOT`).
- Conferi no navegador interno a composição mobile após HMR, em aproximadamente 425 × 1108 px, e a composição desktop em viewport temporário de 1200 × 800 px; o viewport foi restaurado ao padrão e a aba permaneceu aberta e marcada como entrega visual.
- A captura mobile confirmou o cabeçalho sem ações extras, perfil, CTA, abas, serviços, galeria, cobertura e barra fixa conforme a prancha. O desktop confirmou rail, breadcrumb, hero, coluna de contato e galeria; a escala de captura do painel interno não permite declarar equivalência pixel a pixel ao artboard 1440 px.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Somente os arquivos desta implementação e este relatório serão incluídos; os arquivos staged preexistentes de catalogação e segurança permanecem excluídos.

## 19/09/2026 · Conversas por perfil — prancha 014

### Auditoria e ajuste

- Comparei `MensagensPage` com `09-conversas/pranchas/014-conversas-perfis-lado-a-lado.png` em mobile e desktop. A composição já correspondia ao concept: seletor de perfis, caixa de entrada, busca, filtros, fixadas, recentes, detalhe da conversa e navegação responsiva.
- Mantive o preview demonstrativo isolado por `import.meta.env.DEV` e `concept-mock=1`; fora dele, a página continua usando `useCommunityDirectMessages`, sessão ativa, troca de perfil, leitura e envio pelos serviços reais.
- Completei o controle “Filtros”, que antes era apenas visual: agora ele abre um painel acessível e aplica “Somente conversas fixadas” sem mudar a composição fechada da prancha. Busca, Todas, Não lidas e Arquivadas continuam funcionando como antes.
- Não acrescentei nomes, contagens, mensagens ou perfis fictícios ao fluxo de produção; os dados ilustrativos permanecem confinados ao mock já existente.

### Validação e evidências

- `npm run typecheck:app`: passou.
- ESLint passou em `src/modules/messaging/pages/MensagensPage.tsx`.
- Serviços de mensageria: 2 arquivos, 12 testes passaram.
- Conferi no navegador interno a composição mobile após HMR, em aproximadamente 425 × 1108 px, e validei a abertura, marcação e limpeza do filtro adicional. O viewport desktop temporário também foi conferido e restaurado ao padrão; a aba permanece aberta e marcada como entrega visual.
- A captura final voltou ao estado inicial do concept, com “Todas” ativo, fixadas e recentes visíveis.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Somente os arquivos desta implementação e este relatório serão incluídos; os arquivos staged preexistentes de catalogação e segurança permanecem excluídos.

## 19/09/2026 · Meus perfis — prancha 015

### Auditoria e ajustes

- Comparei a composição de `ContaHubPage` com `10-meus-perfis/pranchas/015-meus-perfis.png` em mobile e desktop: hierarquia de conta, cabeçalho territorial, rail lateral, busca, filtros, quatro cards, favoritos, convites e navegação inferior.
- Ajustei o avatar fallback de `Ana Serviços` para a ferramenta cruzada do concept, preservei os espaçamentos responsivos e mantive o texto de pendência específico para mobile e desktop.
- Alinhei os estados de ação: `Gerenciar` usa o CTA preenchido do concept, `Abrir atendimento` permanece contornado, e os perfis de negócio abrem o central demonstrativo. A notificação do cabeçalho agora é uma rota navegável.
- Reproduzi o texto contextual de favoritos por breakpoint, o ponto amarelo de novas conversas na navegação mobile e a assinatura do rodapé desktop. Busca, abas, favoritos, convites e links continuam interativos no preview DEV-only.

### Validação e evidências

- `npm run typecheck:app`: passou.
- ESLint passou em `src/modules/profile/pages/ContaHubPage.tsx`.
- `AccountTerritoryVivo.contract.spec.tsx`: 4 testes passaram.
- No navegador interno, conferi a composição mobile e desktop após HMR e validei filtro `Negócios` (2 perfis) e busca por `Ana Serviços` (1 perfil). O viewport temporário foi restaurado ao padrão; a aba permanece aberta e marcada como entrega visual.
- `git diff --check`: passou; os documentos e a prancha do catálogo foram preservados.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Somente os arquivos desta implementação e este relatório serão incluídos; os arquivos staged preexistentes de catalogação e segurança permanecem excluídos.

## 19/09/2026 · Visão geral da loja — prancha 016

### Auditoria e ajuste

- Comparei `BusinessManagementConceptPreviewPage` com `11-visao-geral-loja/pranchas/016-loja-visao-geral.png` em mobile e desktop. O preview já reproduzia o shell territorial, rail global e do negócio, identidade de `Sabores da Ana`, aviso de horários, atendimento, cardápio, publicações/ofertas e links de informações/equipe.
- Mantive as ações demonstrativas conectadas: abrir conversas, abrir cardápio, ver página pública, editar horários, criar/continuar publicação e voltar para Meus perfis. A rota `concept-mock=1` continua isolada do fluxo real e não concede permissões.
- Corrigi o ritmo mobile em detalhe: reduzi os intervalos entre identidade, seletor, aviso e cards, removi margens tipográficas herdadas e compactei o padding/gaps internos de Atendimento, Cardápio e Publicações; os valores explícitos de `md`/`lg` foram conferidos no desktop. Também alinhei o CTA `Editar horários →` à prancha. Não alterei a operação protegida, dados reais ou regras de acesso.
- Aproximei os detalhes de conteúdo: miniaturas do cardápio com a largura da prancha, avatar de Mariana ampliado e avatar masculino próprio para Lucas no desktop. O estado mobile continua mostrando apenas a conversa destacada, como no concept.

### Validação e evidências

- `npm run typecheck:app`: passou.
- ESLint do arquivo alterado e `git diff --check`: passaram; a tela foi conferida após HMR.
- Navegador interno: conferi mobile em viewport equivalente à prancha e desktop com viewport temporário de 1440 × 900; a aba permanece aberta para acompanhamento e o viewport será restaurado ao padrão antes do commit.
- Validei a ação `Gerenciar cardápio`, que navega para `/central/cardapio?concept-mock=1`, e retornei o preview à visão geral.
- Atualizei a revisão específica da página em `11-visao-geral-loja/REVISAO.md`, mantendo explícitas as limitações do concept e do preview DEV-only.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Somente os arquivos desta implementação e as duas documentações de revisão entram no commit; os arquivos staged preexistentes de catalogação e segurança permanecem excluídos.

## 19/09/2026 · Gestão do cardápio — prancha 017

### Auditoria e ajuste

- Comparei `BusinessMenuConceptPreviewPage` com `12-gestao-cardapio/pranchas/017-gestao-cardapio.png` em mobile e desktop. A página já reproduzia o shell do negócio, a identidade de `Sabores da Ana`, a lista de itens, a seleção da Moqueca de peixe e o drawer de edição demonstrativo.
- No mobile, removi os controles de lista/grade que não aparecem na prancha, retirei os selos “Destaque” que encobriam as fotos e mantive a densidade de cinco linhas visíveis, disponibilidade, preços e navegação inferior. Os filtros agora exibem `Categoria` e `Status`, como no concept.
- No desktop, alinhei os rótulos para `Todas as categorias` e `Todos os status`, ampliei as larguras dos filtros e mantive o drawer aberto, a linha selecionada, as seis linhas e a paginação demonstrativa conforme a prancha.
- O destaque do item continua editável dentro do editor; a mudança remove apenas a sobreposição visual da lista. A rota segue confinada ao preview DEV-only, sem alterar contratos, permissões ou persistência do cardápio real.

### Validação e evidências

- `npm run typecheck:app`: passou.
- ESLint passou em `src/modules/business/dashboard/pages/BusinessMenuConceptPreviewPage.tsx`.
- Comparei a captura mobile após HMR e a composição desktop temporária no navegador interno; conferi a presença dos filtros, cinco itens mobile, seis itens desktop, estado selecionado e editor. O viewport será restaurado ao padrão e a aba permanecerá aberta e marcada como entrega.
- `git diff --check` passou; a revisão específica foi atualizada em `12-gestao-cardapio/REVISAO.md`.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Somente o componente de cardápio, a revisão específica e este relatório entram no commit; os arquivos staged preexistentes de catalogação e segurança permanecem excluídos.

## 19/09/2026 · Cardápio público e seleção de itens — prancha 019

### Auditoria e ajuste

- Comparei `GastronomyDetailConceptPreviewPage` com `13-cardapio-publico/pranchas/019-cardapio-produto.png` em mobile e desktop. O preview já reproduzia o header público, hero, identidade, abas, lista, oferta, item selecionado, personalização e carrinho fixo.
- Corrigi o estado inicial de atendimento para exibir Entrega, Retirada e No local, com No local selecionado e a cópia de retirada/taxa/horários alinhada por breakpoint. Troquei o ícone de Salvar para bookmark, como na prancha.
- Removi da superfície visual inicial os controles de grade, preço, ordenação e contador de itens que não aparecem no concept, sem apagar as capacidades já implementadas no código. A oferta ganhou a quebra de preço do mobile, a linha selecionada recebeu contorno teal e a imagem do personalizador desktop foi ampliada para a proporção da referência.
- Mantive seleção de item, adicionais, tamanho, observações, quantidade, carrinho, salvar, compartilhar e navegação para checkout demonstrativo. A rota continua confinada ao mock de desenvolvimento e não altera o runtime público real.

### Validação e evidências

- `npm run typecheck:app`: passou.
- ESLint passou em `src/modules/business/gastronomy/pages/GastronomyDetailConceptPreviewPage.tsx`.
- Comparei a composição mobile e desktop no navegador interno após HMR; a aba foi mantida na rota pública do cardápio e o estado final foi restaurado para mobile, sem modal aberto.
- `git diff --check` passou. `GastronomyTerritoryRuntime.spec.tsx` ficou bloqueado no `beforeEach` por `window.localStorage` ausente no ambiente Vitest, antes dos casos serem executados.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Somente o componente público, a revisão específica e este relatório entram no commit; os arquivos staged preexistentes de catalogação e segurança permanecem excluídos.

## 19/09/2026 · Finalizar pedido — pranchas 021 e 024

### Auditoria e ajuste

- Comparei `GastronomyCheckoutConceptSurface` com as pranchas de checkout plataforma e estados mobile. A superfície agora aproxima a composição aprovada: cabeçalho desktop teal, identidade da loja junto ao título, ordem `Recebimento` → `Endereço e destinatário` → `Pagamento`, resumo lateral do pedido e CTA fixo no mobile.
- Corrigi o excesso de espaçamento causado pelo editor de endereço aberto automaticamente quando não havia destino. `useDeliveryDestination` ganhou a opção de não abrir esse editor no checkout; o cartão compacto continua exibindo o estado vazio e abre o formulário somente após uma ação explícita ou uma tentativa de continuar.
- A opção de entrega por plataforma é apresentada como estado desabilitado quando o contrato oficial ainda não a suporta. Não ativei seleção, cobrança ou despacho ilustrativos: a regra `isPlatformCourierCheckoutAvailable()` continua sendo a fonte de verdade e o fallback permanece disponível para indisponibilidade de cobertura.
- Removi a repetição dos itens no corpo desktop, mantendo-os no resumo lateral, e ajustei a numeração contextual do pagamento para modalidades sem endereço. Hooks, serviços, permissões, cálculo de frete e métodos de pagamento reais continuam preservados.

### Validação e evidências

- `npm run typecheck:app`: passou.
- ESLint passou nos dois arquivos de código alterados; `git diff --check` passou.
- Auditorias de checkout, regras de modalidade e serviço de criação de pedido: 3 arquivos, 10 testes passaram.
- Conferi no navegador interno o checkout pelo caminho real do cardápio, em mobile e desktop temporário. A comparação cobriu o estado sem endereço, o estado Entrega, o cabeçalho teal, a hierarquia dos cards, a coluna de resumo e o CTA fixo. O viewport voltou ao padrão e a aba ficou aberta para visualização em tempo real.
- Limitação da evidência: a sessão de desenvolvimento não retorna uma residência salva; a captura mostra o vazio funcional, enquanto a prancha usa Casa/Ana Oliveira como dado demonstrativo. Não foram inseridos dados fictícios no runtime.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Somente `GastronomyCheckoutConceptSurface.tsx`, `useDeliveryDestination.ts`, a revisão da página e este relatório entram no commit; os arquivos staged preexistentes de catalogação e segurança permanecem excluídos.

### Segunda rodada — refinamento de padding, header e estados

- Recomparei a tela com as pranchas em viewport mobile e desktop. Ajustei o shell mobile para 16 px laterais, cabeçalho de 48 px, CTA fixo alinhado ao mesmo eixo e tipografia dos botões de modalidade para a escala do concept.
- Diferenciei os estados ativos por breakpoint: mobile teal preenchido, desktop teal claro com borda e entrega da loja em amarelo claro. Retirei ações e ícone extras do título de endereço para manter a hierarquia da prancha.
- O cartão de endereço agora apresenta o rótulo real da residência e ícone de casa quando houver destino resolvido. O mock de `Sabores da Ana` também fornece a relação territorial carregada para exibir `Santa Cruz · Salvador, BA` sem alterar dados de produção.
- No mobile, `Retirada no local` ocupa a segunda coluna no fluxo de Entrega/Retirada; `No local` só permanece na grade quando já é o estado selecionado do carrinho, evitando perda de modalidade.

### Terceira rodada — tipografia fiel à SSOT

- Auditei família, tamanho, peso e line-height de todas as etapas do checkout contra `DESIGN-TOKENS.md` e `src/index.css`. A família continua `Plus Jakarta Sans`, com `font-heading` para headings e `font-sans` no restante.
- Normalizei os títulos para 24 px/700 no mobile e 30 px/700 no desktop; seções ficam em 16 px/700, rótulos em 14 px/600–700 e metadados em 12 px. O wordmark desktop usa 800, o único peso de display aplicado.
- Substituí os tamanhos arbitrários de 23,2 px e 10,9/11 px pelas classes canônicas `text-type-label`, `text-type-caption`, `text-type-micro` e `text-type-body`, preservando os paddings ajustados na rodada anterior.
- A medição no navegador interno confirmou os valores computados do título mobile (24/700/30) e desktop (30/700/37,5), mantendo a aba aberta e o viewport padrão restaurado ao final.

### Quarta rodada — consistência do estado de endereço

- Ao abrir `Outro endereço`, o cartão vazio agora usa o rótulo contextual da opção selecionada. Isso elimina a contradição visual entre a aba ativa e o título `Endereço do perfil`.
- O ajuste preserva o contrato real: o editor continua sendo aberto por ação explícita, o CTA fixo permanece disponível e nenhum endereço ilustrativo é criado.
- A conferência foi feita no navegador interno após HMR, com a aba mantida aberta no estado de edição para inspeção visual.

### Quinta rodada — hierarquia dos cartões de revisão

- Recomparei `Revisar pedido` com a prancha mobile 024. Os títulos dos cartões de entrega, pagamento e itens agora usam 14 px/700; descrições e metadados permanecem em 12 px, e totais em 16 px/700.
- O refinamento preserva os gaps, o CTA fixo e as regras de habilitação. A aparência desabilitada do CTA continua sendo consequência da sessão de desenvolvimento, não de uma alteração visual que mascare autorização incompleta.
- A etapa foi conferida no mobile e no desktop temporário; o viewport foi restaurado e a aba ficou aberta na revisão mobile.

### Sexta rodada — composição desktop contra a prancha 021

- Removi a barra de etapas do desktop, que duplicava a numeração dos cartões e não existe na prancha 021. A progressão numerada permanece nos próprios cartões; o stepper continua restrito à revisão mobile, como na prancha 024.
- Reestruturei o header para refletir a composição aprovada: wordmark, navegação, busca e conta, sem repetir a localização do território dentro do header.
- Corrigi a margem global do título desktop e retirei o texto auxiliar que não pertence ao concept, reduzindo o espaço entre retorno, título, loja e o primeiro cartão.
- Revalidei o frame desktop equivalente ao concept e o estado mobile de endereço após HMR; o viewport foi restaurado ao padrão e a aba permaneceu aberta.

## 19/09/2026 · Como funciona — pranchas 061 e 062

### Auditoria e ajuste

- Comparei `ComoFuncionaPage` com as referências mobile e desktop. A estrutura existente já cobria os quatro trechos de rolagem: conhecer, explorar/participar, perfis e chegada de novas comunidades; mantive os links reais, launch scope, FAQ e menu móvel.
- Ajustei a fotografia do primeiro trecho para `complexo-comercio.jpg`, mais coerente com o comércio local mostrado na prancha, sem gerar ou introduzir conteúdo ilustrativo novo.
- Corrigi a tipografia responsiva do título: no mobile a quebra ocorre depois de `Seu lugar,`, como na prancha 061; no desktop amplo o título permanece em uma linha, como na prancha 062.
- Corrigi o alinhamento do rodapé mobile para centralizar wordmark e links; no desktop a distribuição horizontal continua preservada.

### Validação e evidências

- Navegador interno: conferi mobile equivalente a `389 × 867` CSS px e desktop temporário `1440 × 867` CSS px. Foram verificados header, menu, hero, módulos habilitados, perfis, participação, expansão, FAQ e rodapé.
- `npm run typecheck:app`.
- ESLint no componente alterado.
- `git diff --check`.
- A aba foi mantida aberta na rota `/como-funciona` e o viewport retornou ao padrão mobile para acompanhamento.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit restrito ao componente e às documentações do concept; alterações staged preexistentes permanecem fora do commit.

## 19/09/2026 · Explorar e encontrar — prancha 009

### Auditoria e ajuste

- Comparei `BuscaPage` com a referência de mapa/lista. Busca territorial, query, chip `Serviços`, ordenação, lista de profissionais, CTA `Ver no mapa` e mapa continuam usando os componentes e contratos existentes; o mock DEV só fornece os três resultados demonstrativos já definidos para a prancha.
- A divergência principal estava na navegação do preview: a barra global exibia `Hoje`, `Community` e `Atividade`, enquanto a prancha mostra `Início`, `Comunidade`, `Publicar`, `Conversas` e `Conta`. O `TerritoryAdaptiveNavigation` agora troca esse conjunto somente em `/busca/...?...concept-mock=1` durante desenvolvimento.
- No desktop do preview, o rail agora reproduz os módulos da referência: Início, Comunidade, Explorar, Negócios, Serviços, Mobilidade, Classificados e Educação, com `Explorar` ativo e `Trocar território` no rodapé.
- A ação `Publicar` aponta para o fluxo real da comunidade com `action=publicar`; não concede permissão nem persiste conteúdo. Fora do preview, a navegação global permanece inalterada.

### Validação e evidências

- Navegador interno: conferi mobile equivalente a `389 × 867` CSS px e desktop amplo `1440 × 867` CSS px. Foram verificados header, busca, categorias, filtros, resultados, mapa, navegação mobile e rail desktop.
- `npm run typecheck:app`.
- ESLint no componente de navegação alterado.
- `git diff --check`.
- A aba permaneceu aberta na rota de busca e o viewport retornou ao padrão mobile para acompanhamento.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit restrito ao componente de navegação e às documentações do concept; alterações staged preexistentes permanecem fora do commit.

## 19/09/2026 · Expansão territorial e interesse — prancha 060

### Auditoria e ajuste

- Comparei `CommunityIndicationPage` com `03-expansao-territorial/pranchas/060-expansao-interesse.png`. A primeira etapa agora segue a composição mobile da referência: wordmark e retorno no topo, título `Onde você quer o Achegue-se?`, apoio curto, três campos de região, relação opcional, aviso contextual, `Enviar indicação` e a legenda sobre não criar conta.
- Corrigi o eixo lateral real da tela: o componente usava uma classe de conteúdo que não existia no JSX e, por isso, ficava encostado na borda. O espaçamento passou a ser aplicado no próprio `.community-indication-screen`, com 16 px no mobile e largura máxima de 27 rem; o container principal rola quando a segunda etapa precisa de mais altura.
- Separei a indicação da confirmação de contato. A imagem é uma referência de composição, mas o serviço e o banco exigem nome e contato; esses dados agora aparecem em uma segunda etapa explícita, sem enviar payload incompleto nem inserir dados fictícios.
- Mantive o gate funcional da rota `/comunidade/.../interesse`: quando a comunidade municipal não existe, ela continua indisponível. A entrada de interesse permanece em `/indicar-comunidade`, com os serviços, flags e permissões reais preservados.
- Normalizei a apresentação dos erros de registro e Turnstile com tokens territoriais, mantendo a mensagem acessível via `role="alert"`.

### Validação e evidências

- Navegador interno: conferi a tela inicial limpa, obrigatoriedade dos três campos, CTA desabilitado, transição após preenchimento, retorno para a primeira etapa e scroll da etapa de contato.
- Viewports conferidos: mobile padrão `425 × 1108` CSS px e largura reduzida `376 × 693` CSS px, sem clipping no primeiro estágio.
- `npm run typecheck:app`.
- ESLint no componente alterado.
- `git diff --check`.
- A aba do navegador foi mantida aberta na rota de indicação e será deixada no viewport mobile padrão para acompanhamento em tempo real.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit restrito ao componente, estilos e documentações do concept; arquivos staged preexistentes de catalogação e segurança permanecem fora da alteração.

## 20/09/2026 · Perfil público profissional — prancha 010

### Auditoria e ajuste

- Comparei `ProfissionalPublicPage` com a prancha mobile/desktop do perfil de João Santos. A estrutura já usava a rota pública real, os dados demonstrativos DEV e o diálogo de lead existente; mantive esses contratos e concentrei a alteração no desvio visual comprovado.
- A causa do excesso de espaço estava nos defaults globais de acessibilidade: `p` recebe `margin-bottom: 1rem`, o que duplicava a altura de cada descrição dentro das três linhas de serviço. Isso empurrava `Trabalhos realizados` para fora do viewport mobile.
- Adicionei a classe de escopo `.professional-public-page` e neutralizei somente nesse perfil as margens automáticas de `p` e headings. A regra não altera o SSOT tipográfico global nem outras páginas.
- Mantive a composição da referência: retorno e ações no topo, hero com identidade e cobertura, CTA amarelo de conversa, abas, três serviços compactos, fotos do portfólio, cobertura no mobile e coluna lateral de conversa no desktop.

### Validação e evidências

- Navegador interno mantido aberto na rota `/servicos/ba/salvador/profissional/joao-santos?concept-mock=1`; a comparação usa viewport mobile equivalente a `389 × 867` CSS px e desktop equivalente a `1440 × 867` CSS px.
- Conferi a ordem do conteúdo, a altura das linhas de serviço, a entrada do portfólio no frame mobile, a coluna lateral desktop e a ausência de erros de runtime.
- `npm run typecheck:app`, ESLint no componente alterado, testes dos serviços profissionais e `git diff --check`.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit restrito ao perfil, ao estilo scoped e às documentações do concept; alterações staged preexistentes permanecem fora do commit.

## 20/09/2026 · Conversas por perfil — prancha 014

### Auditoria e ajuste

- Comparei `MensagensPage` com a prancha mobile/desktop de Conversas. A composição já tinha os três perfis, badges, fixadas, recentes, busca, filtros, painel de conversa e alternância mobile lista/detalhe; mantive esses contratos e refinei o ritmo visual.
- A lista de conversas foi reduzida de 68 px para aproximadamente 60 px por linha, mantendo avatar, horário, prévia, pin, unread e alvo de toque. Isso aproxima a quantidade de itens visível no viewport da referência sem recorrer a zoom ou clipping.
- A causa adicional de excesso de espaço estava nos defaults globais de parágrafo: bolhas, subtítulos e compositor herdavam `margin-bottom: 1rem`. O escopo `.messages-page p` neutraliza apenas essa margem na tela de Conversas.
- O mock permanece somente em DEV; em produção, a tela continua usando sessão, troca de perfil, threads e envio pela camada de mensagens existente.

### Validação e evidências

- Navegador interno mantido aberto em `/mensagens?concept-mock=1`, com viewport mobile equivalente a `389 × 867` CSS px; conferi lista, perfil ativo, filtros, densidade das linhas e barra inferior.
- Também conferi a composição de detalhe: assunto, bolhas, resposta como `Sabores da Ana`, campo de mensagem e envio habilitado somente no mock/contrato live.
- `npm run typecheck:app`, ESLint no componente, testes dos serviços de mensagens e `git diff --check`.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit restrito à tela, ao estilo scoped e às documentações do concept; alterações staged preexistentes permanecem fora do commit.

## 20/09/2026 · Meus perfis — prancha 015

### Auditoria e ajuste

- Comparei `AccountConceptPreviewPage` e `ConceptManagedProfileCard` com a prancha mobile/desktop de Meus perfis. A hierarquia de header, CTA amarelo, busca, filtros, nota de favoritos, cards por tipo de perfil, ações por permissão e navegação responsiva já estava presente; mantive as rotas e os contratos de interação.
- A divergência visual comprovada estava no ritmo vertical dos cards: os defaults globais de acessibilidade aplicavam `margin-bottom: 1rem` a cada parágrafo e `12px` ao título, somando espaços duplicados entre categoria, contexto, status e ações.
- Adicionei o escopo `.account-concept-page` e reduzi somente dentro dos cards as margens para `4px`. A correção deixa o card pessoal em aproximadamente `151px` no mobile e os cards de negócio/profissional com densidade compatível com a referência, sem alterar o SSOT tipográfico global.
- O mock continua restrito a DEV (`?concept-mock=1`); a rota de produção permanece ligada à conta real, sessão, perfis e permissões.

### Validação e evidências

- Navegador interno mantido aberto em `/conta?concept-mock=1`; conferi mobile equivalente a `389 × 867` CSS px e desktop amplo equivalente a `1600 × 1067` CSS px.
- Conferi ordem dos elementos, CTA, filtros, cards, ações, barra inferior, header territorial e rail lateral; o viewport não apresenta clipping nem erro de runtime.
- `npm run typecheck:app`, ESLint no componente alterado e `git diff --check`.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit restrito à tela, ao estilo scoped e às documentações do concept; alterações staged preexistentes permanecem fora do commit.

## 20/09/2026 · Acompanhar pedido — pranchas 023 e 025

### Auditoria e ajuste

- Comparei `OrderTrackingConceptSurface` com as referências mobile e desktop de Acompanhar pedido. A superfície já cobria preparo, entrega, sinal desatualizado e conclusão, com composição responsiva, pagamento, itens, histórico, comprovante, avaliação e ações de contato; mantive os contratos reais e revisei os quatro estados no navegador.
- A divergência funcional encontrada estava no preview DEV: mesmo recebendo uma localização demonstrativa, `RideTrackingMap` inicializava `useDriverLocation` com `enabled: true` e tentava consultar a RPC de posição real. Isso poluía o console com erro de schema e não era aceitável para uma referência visual limpa.
- Adicionei `trackingEnabled` ao componente compartilhado e desliguei a consulta apenas quando existe `driverLocationOverride`. O mapa continua usando o rastreamento real em produção e o mock passa a renderizar somente o snapshot autorizado pelo próprio preview.
- Alinhei a asserção histórica da suíte ao fixture de `11/09/2026`: datas antigas são exibidas como `11/09 às HH:mm`; “Hoje” só aparece quando a data do pedido coincide com o dia corrente.

### Validação e evidências

- Navegador interno mantido aberto em `/gastronomia/pedidos/concept-mock-order-1042?concept-mock=1&state=preparing`.
- Estados `preparing`, `in_delivery`, `stale` e `completed` conferidos em `389 × 867` CSS px; desktop conferido em viewport amplo equivalente a `1440 × 867` CSS px.
- Console do mock sem erros após o ajuste; preparo não renderiza mapa, entrega renderiza mapa/contato quando há coordenadas e concluído renderiza comprovante/avaliação/cardápio.
- `npm exec vitest -- --run src/modules/business/gastronomy/pages/OrderTrackingConceptSurface.spec.tsx --pool=threads --maxWorkers=1` — 5 testes aprovados.
- `npm run typecheck:app`, ESLint nos arquivos alterados e `git diff --check`.

### Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit restrito ao componente de mapa, à superfície de acompanhamento, ao teste e às documentações do concept; alterações staged preexistentes permanecem fora do commit.
