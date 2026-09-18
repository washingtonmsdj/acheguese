# Revisão — Início da comunidade

Status: implementada nesta rodada.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Dados, permissões e flags | Atende | `src/app/pages/TerritoryHomePage.tsx:620-648`; `src/app/config/launchScope.ts` | Mantidos `useTerritoryHomeData`, `useCommunityAccess` e `isLaunchSurfaceEnabled`; mock só é acionado explicitamente em desenvolvimento por `?concept-mock=1` | TypeScript e ESLint passaram |
| Primeira dobra mobile | Ajustada | `src/app/pages/TerritoryHomePage.tsx:887-930` | Título do território passa a acompanhar a busca e os atalhos no bloco petróleo, conforme a prancha mobile, sem duplicar o topbar compartilhado | Hot reload acompanhado no navegador interno; sem erro de compilação |
| Módulos rápidos | Ajustada | `src/app/pages/TerritoryHomePage.tsx:686-755`, `940-967` | Eventos foi incluído somente quando habilitado na SSOT; no mobile a prioridade é Comida, Negócios, Serviços e “Ver todos”, enquanto Classificados/Eventos seguem acessíveis na grade desktop e no agrupamento | TypeScript, ESLint e captura ao vivo passaram |
| Convite para visitante | Implementada | `src/app/pages/TerritoryHomePage.tsx:828-840`, `1009-1048` | Convite usa apenas `appUrls.auth.register` e `appUrls.auth.login`, e só aparece quando a comunidade real está disponível | Contrato visual revisado; sem conteúdo demonstrativo em produção |
| Estados de dados | Mantidos | `src/app/pages/TerritoryHomePage.tsx:989-1117`, `1147-1201`, `1394-1403` | Loading, vazio, erro parcial, ausência de permissão e links territoriais existentes foram preservados | Revisão de código e smoke manual |

Branch analisada: `codex/reformulacao-entrada-comunidade` · data: 18/09/2026.

Limitações: o preview interno depende da resolução territorial e das consultas do ambiente; sem sessão/dados ativos, ele pode permanecer no carregamento antes de apresentar a Home. Mobilidade, educação e outras superfícies continuam desativadas pela `launchScope` quando aplicável. Nenhuma ativação foi feita nesta rodada.
