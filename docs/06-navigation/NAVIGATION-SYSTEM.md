# Navigation System — Achegue-se

Status: **ATIVO / MVP 2026-09-21**

Este documento descreve a navegação vigente. O lifecycle executável é dividido
entre `productModuleRegistry.ts` (domínios), `platformCapabilityRegistry.ts`
(capabilities horizontais) e `lifecycleRegistry.ts` (avaliação).

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
5. **Busca** — descoberta textual restrita aos providers ativos;
6. **Mensagens** — Inbox privada horizontal; Business é o provider ativo;
7. **Conta / Entrar** — infraestrutura de identidade.

Home e Conta são plataforma, não módulos adicionais do produto.

## Regras de lifecycle

- `business` é o domínio de produto ativo;
- `map`, `nearby`, `search` e `messaging` são capabilities horizontais ativas;
- `nearby` depende de Map + Location + Business;
- Messaging registra somente providers cujos domínios estão ativos; no MVP, Business;
- Community, Gastronomia, Serviços, Classificados, Eventos, Vagas,
  Educação, Mobilidade e demais módulos pós-MVP não aparecem na navegação;
- Search aparece como destino ativo, mas somente providers de superfícies ativas podem responder;
- um módulo `paused` também fica fora de rota funcional, prefetch/warmup,
  discovery e layers públicas;
- renderer não cria exceção local para lifecycle;
- redirect não é mecanismo de ativação nem de pausa.

## Mobile

A bottom navigation deve consumir o mesmo registry e manter poucos destinos.
No MVP, a navegação combina o domínio Empresas com Mapa, Perto de mim e Busca.
Mensagens fica acessível à sessão autenticada pela topbar/Conta e pelos CTAs de
Business, sem exigir Community.

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
- Busca;
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

Busca é capability horizontal ativa do MVP. Ela é um orquestrador e não um segundo owner de dados.

Regras:
- Business é provider ativo no corte atual;
- Community, Serviços, Classificados, Eventos, Vagas e demais providers pausados permanecem desligados;
- filtros/coleções de módulos pausados não aparecem na UI;
- páginas de resultado de busca continuam fora do sitemap quando parametrizadas, mesmo com Search ativa.

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
- `src/app/config/platformCapabilityRegistry.ts`;
- `src/app/config/lifecycleRegistry.ts`;
- `src/core/navigation/territoryNavigationModes.ts`;
- `docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md`;
- `docs/05-ux/HOME-SPEC.md`;
- `docs/SCREEN-MAP.md`;
- `docs/FEATURE-MAP.md`.
