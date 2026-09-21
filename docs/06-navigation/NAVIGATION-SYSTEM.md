# Navigation System — Achegue-se

Status: **ATIVO / MVP 2026-09-21**

Este documento descreve a navegação vigente. O lifecycle executável pertence a
`src/app/config/productModuleRegistry.ts`; este documento não pode ativar uma
superfície pausada.

## Objetivo

A navegação deve preservar contexto territorial e expor somente capacidades
realmente disponíveis. Adicionar, pausar ou remover um módulo não deve exigir
uma segunda decisão manual em cada renderer.

## Navegação primária do MVP

O registry de apresentação é
`src/core/navigation/territoryNavigationModes.ts`.

Destinos vigentes:

1. **Home** — contexto territorial;
2. **Mapa** — descoberta geográfica de Business;
3. **Empresas** — catálogo/lista Business;
4. **Perto de mim** — proximidade Business; depende de Mapa + Empresas;
5. **Conta / Entrar** — infraestrutura de identidade.

Home e Conta são plataforma, não módulos adicionais do produto.

## Regras de lifecycle

- `business`, `map` e `nearby` são os únicos módulos ativos do MVP;
- `nearby` depende formalmente de `map + business`;
- Search, Community, Gastronomia, Serviços, Classificados, Eventos, Vagas,
  Educação, Mobilidade e demais módulos pós-MVP não aparecem na navegação;
- um módulo `paused` também fica fora de rota funcional, prefetch/warmup,
  discovery e layers públicas;
- renderer não cria exceção local para lifecycle;
- redirect não é mecanismo de ativação nem de pausa.

## Mobile

A bottom navigation deve consumir o mesmo registry e manter poucos destinos.
No MVP, os destinos de produto são Mapa, Empresas e Perto de mim, além de Home
e Conta.

Não reservar tabs para módulos pausados nem exibir teaser que pareça
funcionalidade disponível.

## Tablet e desktop

Rail/sidebar são apresentações do mesmo contrato. Não existe menu de desktop
com autoridade própria.

O shell pode mostrar:

- território ativo;
- Home;
- Mapa;
- Empresas;
- Perto de mim;
- Conta/Entrar;
- infraestrutura autenticada estritamente necessária.

## Território

Trocar território deve manter o módulo atual quando houver URL territorial
canônica para ele.

Exemplo:

- usuário está em Empresas/Pituba;
- troca para Barra;
- continua em Empresas, agora no novo território.

Perto de mim pode usar GPS real. Fallback territorial não pode ser apresentado
como localização pessoal.

## Ações

Ações pertencem ao owner do domínio. A navegação global não promove ações de
módulos pausados.

`Publicar`, Feed, Community, mensagens sociais, classificados e outras ações
pós-MVP só retornam quando seus módulos forem certificados e reativados no
lifecycle.

## Busca

Busca federada pública está `paused` no MVP. Componentes ou serviços internos
de busca podem continuar versionados, mas não constituem destino global nem tab.

## Evolução pós-MVP

A organização por intenção (Explorar, Community, Atividade etc.) permanece uma
hipótese de evolução, não o contrato vigente. Qualquer retomada deve:

1. nascer/voltar `paused`;
2. possuir owner e dependências explícitos;
3. passar testes e certificação isolada;
4. ser ativada no registry;
5. somente então entrar nos renderers de navegação.

## Acessibilidade e responsividade

- foco visível;
- alvos de toque adequados;
- sem overflow horizontal;
- `prefers-reduced-motion` respeitado;
- rótulos compreensíveis;
- comportamento equivalente entre bottom nav, rail e sidebar.

## Referências

- `src/app/config/productModuleRegistry.ts`;
- `src/core/navigation/territoryNavigationModes.ts`;
- `docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md`;
- `docs/05-ux/HOME-SPEC.md`;
- `docs/SCREEN-MAP.md`;
- `docs/FEATURE-MAP.md`.
