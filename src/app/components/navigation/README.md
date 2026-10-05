# Navegação do aplicativo

## Fontes canônicas

- `navigation.config.ts`: SSOT dos itens da Sidebar operacional desktop, filtrados pelo lifecycle de domínios/capabilities;
- `AppSidebar.tsx`: renderização da Sidebar operacional;
- `src/core/navigation/territoryNavigationModes.ts`: SSOT dos modos recorrentes do Território Vivo;
- `src/core/navigation/BottomNav.tsx`: navegação mobile que consome o owner territorial e preserva o contexto de cidade/bairro/grupo resolvido.

Não criar uma segunda lista de destinos em componentes de página. Visibilidade de produto deve derivar dos registries canônicos de lifecycle.

## Estado ativo do MVP

A navegação deve refletir o runtime vigente:

- domínio ativo: Empresas/Business;
- capabilities horizontais ativas: Mapa, Perto de mim, Busca, Mensagens, Notificações, Conta/Perfis, Território, Localização e Central;
- domínios pós-MVP permanecem preservados no código, porém não aparecem como superfícies funcionais enquanto `paused`.

Mensagens e Notificações pertencem à plataforma. Uma vertical pode fornecer provider/eventos, mas não controla o lifecycle dessas capabilities.

## Responsabilidades

- Sidebar: navegação operacional ampla em telas médias e grandes; itens são filtrados pelo lifecycle e, quando necessário, por autenticação;
- navegação Territory Vivo/mobile: destinos canônicos `Início`, `Mapa`, `Empresas`, `Perto`, `Busca` e `Conta`/`Entrar`, conforme `territoryNavigationModes.ts`;
- Topbar: atalhos globais autenticados, incluindo Mensagens e Notificações quando suas capabilities estiverem ativas;
- headers de página: contexto e ações da própria superfície; não devem recriar catálogo de navegação, lifecycle ou regras de URL;
- Inbox de Mensagens: participa do shell autenticado normal; uma thread aberta pode usar modo focado de conversa sem transformar Messaging em owner de shell global.

## Tipografia e responsividade

- Interface, navegação, marca e títulos usam a família canônica `Plus Jakarta Sans`;
- `src/index.css` possui o stack tipográfico; `tailwind.config.ts` apenas o consome por `font-sans`, `font-heading` e `font-display`;
- pesos 400, 500, 600 e 700 cobrem corpo, controles e títulos; 800 fica reservado a hierarquias de display/wordmark aprovadas;
- nenhum componente de navegação deve carregar ou declarar uma segunda família de fonte;
- navegação mobile deve respeitar safe area e não competir com superfícies focadas, como uma conversa aberta.

## Alterações

Ao adicionar ou remover um destino desktop operacional, altere `navigation.config.ts` e o lifecycle owner correspondente. Ao alterar os modos territoriais/mobile, altere `src/core/navigation/territoryNavigationModes.ts` e seus consumidores. Headers de página devem consumir URLs/owners canônicos; não criar catálogos paralelos, redirects paliativos ou hardcodes de lifecycle.
