# Navegacao do aplicativo

## Fontes canonicas

- `navigation.config.ts`: itens da sidebar operacional desktop.
- `AppSidebar.tsx`: renderizacao da sidebar operacional.
- `src/core/navigation/BottomNav.tsx`: navegacao publica mobile territorial. Ela preserva cidade/bairro/grupo resolvidos e respeita o escopo de lancamento.
- `src/core/navigation/publicHeaderNavigation.ts`: catalogo SSOT dos destinos do menu recolhivel, com ordem, rotulo, descricao, icone e launch gate.
- `src/core/navigation/PublicHeaderMobileMenu.tsx`: menu recolhivel de Home e Cidade; a Comunidade possui navegacao local propria e nao renderiza este menu no mobile.

Nao existe uma segunda bottom nav em `app/components/navigation`. A barra mobile permanece no dominio de navegacao e tem contrato global estavel, inclusive quando uma comunidade esta aberta.

## Responsabilidades

- Sidebar: navegacao operacional ampla em telas medias e grandes.
- Bottom nav: quatro destinos territoriais recorrentes (`Hoje`, `Explorar`, `Community`, `Busca`) e um menu de modulos habilitados no mobile. `Publicar` e uma acao contextual, nao um destino global.
- Menu do header: acesso recolhivel ao conjunto completo de secoes publicas, contextualizado pelas URLs de Home, Cidade ou Comunidade.
- Headers de pagina: marca, territorio e acoes de sessao; nao devem recriar regras de URL.

## Tipografia e responsividade

- Interface, navegacao, marca e titulos usam a familia canonica `Plus Jakarta Sans`.
- `src/index.css` possui o stack tipografico; `tailwind.config.ts` apenas o consome por `font-sans`, `font-heading` e `font-display`.
- Pesos 400, 500, 600 e 700 cobrem corpo, controles e titulos; 800 fica reservado a hierarquias de display/wordmark aprovadas pelo concept.
- Nenhum componente de navegacao deve carregar ou declarar uma segunda familia de fonte.
- A bottom nav aparece abaixo de `md` e garante uma linha estavel de 64 px, acrescida da safe area do dispositivo.
- Links completos do header viram menu recolhivel no mobile; a bottom nav permanece como navegacao primaria.
- Na Comunidade, `Feed`, `Empresas` e `Servicos` sao os destinos primarios; `Secoes` concentra os modulos secundarios. Grupos e Discussoes sao descobertos dentro do Feed. A bottom nav nunca aponta para rotas internas da comunidade.

## Alteracoes

Ao adicionar um destino desktop operacional, edite `navigation.config.ts`. Ao alterar os atalhos da barra mobile, edite `src/core/navigation/BottomNav.tsx`. Ao alterar o menu recolhivel dos headers, edite `src/core/navigation/publicHeaderNavigation.ts`; as paginas fornecem apenas as URLs territoriais.
