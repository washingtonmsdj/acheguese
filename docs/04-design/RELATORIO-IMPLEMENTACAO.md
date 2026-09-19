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
