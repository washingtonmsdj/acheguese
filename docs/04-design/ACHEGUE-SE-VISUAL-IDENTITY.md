# Identidade visual do Achegue-se

## Fonte de verdade

Os tokens vivem em `src/index.css` e são expostos ao Tailwind em `tailwind.config.ts`. A fachada TypeScript em `src/styles/theme.ts` referencia as mesmas variáveis CSS. Componentes territoriais continuam usando classes semânticas `territory-*`; não foi criado um tema paralelo para a entrada pública.

A entrada pública segue a composição do conceito: mapa como tela dominante, cabeçalho claro, painel flutuante com busca, localização, território recomendado e CTA solar. No mobile, o mapa ocupa a primeira área e o painel se transforma em uma superfície inferior; no desktop, o painel fica sobre o mapa à esquerda. O conteúdo real do produto substitui textos, imagem e geografia ilustrativos do conceito.

A Home territorial (`/:estado/:cidade/:território`) usa o segundo padrão do conceito: cabeçalho petróleo com busca contextual, sidebar responsiva, categorias em ícones circulares, conteúdo real de Community, oportunidades, agenda e mapa. No mobile, a sidebar vira uma navegação inferior de cinco ações, com publicação solar central e acesso à conta; a ordem do DOM acompanha a ordem visual dos blocos. Módulos desabilitados pelo rollout continuam fora da interface e os estados vazios explicam a ausência de dados sem inventar conteúdo.

## Tokens de marca

| Uso | Token | Valor |
| --- | --- | --- |
| Ações principais e identidade | `--brand-petroleum` | `#123E3D` |
| Destaque pontual / CTA de exploração | `--brand-solar` | `#F3CB4C` |
| Superfície clara | `--brand-surface` | `#FAFBF7` |
| Texto principal | `--brand-text` | `#203534` |
| Texto secundário | `--brand-text-secondary` | `#61736C` |
| Texto secundário compacto | `--brand-text-secondary-strong` | `#52665F` |

Estados semânticos não reutilizam o solar: erro (`--semantic-error`), sucesso (`--semantic-success`), aviso (`--semantic-warning`), informação (`--semantic-info`), foco (`--semantic-focus`), seleção (`--semantic-selection`) e desabilitado (`--semantic-disabled` / `--semantic-disabled-foreground`).

## Validação de acessibilidade

- Fonte migrada para Plus Jakarta Sans, com 400 para texto, 500–600 para controles e 700 para títulos.
- Áreas de toque e controles preservam o mínimo de 44px definido pelo sistema de acessibilidade existente.
- Foco visível usa `--semantic-focus`; movimento reduzido continua desabilitando transições e animações.
- `#123E3D` sobre `#FAFBF7`: contraste aproximado 11,34:1.
- `#203534` sobre `#F3CB4C`: contraste aproximado 8,31:1.
- `#203534` sobre `#FAFBF7`: contraste aproximado 12,47:1.
- `#61736C` sobre `#FAFBF7`: contraste aproximado 4,84:1; atende AA para texto normal e AAA para texto grande, mas não AAA para texto normal. Textos compactos essenciais devem usar `--brand-text-secondary-strong` (aprox. 5,90:1) ou `--brand-text`; para AAA em texto normal, usar `--brand-text`.

Ainda é necessário verificar com leitor de tela, zoom real a 200%, teclado virtual e combinações de navegador/OS antes de declarar conformidade WCAG AAA completa. Testes automáticos não são suficientes para essa declaração.

## Resiliência do mapa e evidências executadas

- A entrada pública mantém a busca e a seleção de cidade/bairro independentes do mapa.
- O `MapLibreAdapter` preserva o provider e os polígonos existentes; a entrada exibe uma mensagem acessível quando o estilo falha ou não responde em até 8 segundos, sem substituir nem desativar o mapa quando ele carrega.
- Preview local em viewport estreito: fonte Plus Jakarta Sans aplicada, categorias sem corte visual, navegação inferior com áreas de toque e canvas MapLibre carregado na Home territorial.
- A composição desktop foi validada por typecheck/build e pelas regras responsivas do shell (`md`/`xl`); a captura automatizada em 1440px permanece pendente porque o runtime Chromium do Playwright não está instalado nesta sessão.
- Fluxo público verificado no navegador: seleção de `Pituba` levou a `/ba/salvador/pituba`, mantendo busca, mapa, módulos públicos e acesso à conta.
- O endpoint externo de tiles não pôde ser consultado pelo terminal restrito desta sessão; isso limita a validação de disponibilidade do provider fora do navegador. A sessão de preview, porém, confirmou o canvas do mapa carregado. Não há declaração de disponibilidade operacional do provider.

## Exceções preservadas

- Cores de categorias de conteúdo, estados de dados e integrações cartográficas continuam separadas dos tokens de marca.
- O mapa mantém seu estilo/cores de dados próprios; a identidade só controla moldura, sobreposições e ações.
- O asset oficial colorido do ícone continua disponível para áreas que ainda o consomem; a entrada pública usa o monograma `a` da referência para não misturar a linguagem visual legada com a nova marca.
- O balão de conversa do concept foi ligado à rota real `/mensagens` quando há sessão; visitantes seguem para o login. O acesso a notificações, conta, Community e publicação permanece nos destinos existentes.
- A prévia preenchida do segundo concept pode ser aberta localmente com `?concept-mock=1`. Ela usa imagens e textos demonstrativos apenas em desenvolvimento, não grava dados e não altera rollout, permissões ou estados vazios reais.
- O modo escuro e superfícies legadas seguem disponíveis quando explicitamente escolhidos; o padrão de produto passa a ser claro para a entrada pública e superfícies territoriais.
