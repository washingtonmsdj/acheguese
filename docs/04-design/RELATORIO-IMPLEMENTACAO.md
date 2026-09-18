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
