# Navegacao do aplicativo

## Fontes canonicas

- `navigation.config.ts`: itens da sidebar operacional desktop.
- `AppSidebar.tsx`: renderizacao da sidebar operacional.
- `src/core/navigation/BottomNav.tsx`: navegacao publica mobile territorial. Ela preserva cidade/bairro/grupo resolvidos e respeita o escopo de lancamento.

Nao existe uma segunda bottom nav em `app/components/navigation`. A barra mobile permanece no dominio de navegacao e tem contrato global estavel, inclusive quando uma comunidade esta aberta.

## Responsabilidades

- Sidebar: navegacao operacional ampla em telas medias e grandes.
- Bottom nav: quatro destinos territoriais recorrentes (`Hoje`, `Explorar`, `Community`, `Busca`) e um menu de modulos habilitados no mobile. `Publicar` e uma acao contextual, nao um destino global.
- Headers de pagina: marca, territorio e acoes de sessao; nao devem recriar regras de URL.

## Tipografia e responsividade

- Interface, navegacao, marca e titulos usam a familia canonica `Plus Jakarta Sans`.
- `src/index.css` possui o stack tipografico; `tailwind.config.ts` apenas o consome por `font-sans`, `font-heading` e `font-display`.
- Pesos 400, 500, 600 e 700 cobrem corpo, controles e titulos; 800 fica reservado a hierarquias de display/wordmark aprovadas pelo concept.
- Nenhum componente de navegacao deve carregar ou declarar uma segunda familia de fonte.
- A bottom nav aparece abaixo de `md` e garante uma linha estavel de 64 px, acrescida da safe area do dispositivo.

## Alteracoes

Ao adicionar um destino desktop operacional, edite `navigation.config.ts`. Ao alterar os atalhos da barra mobile territorial, edite `src/core/navigation/BottomNav.tsx` e os contratos de `territoryNavigationModes.ts`. Headers de pagina devem consumir essas fontes ou seus wrappers ativos; nao criar catalogos paralelos sem caller runtime.
