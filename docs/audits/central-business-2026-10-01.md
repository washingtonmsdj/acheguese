# Central da empresa — auditoria estrutural

Base: origin/main `81a4f61e00a5a2501bdbec19a275a0426c163550`. Implementação realizada em worktree separado; alterações locais preexistentes preservadas.

## Inconsistências corrigidas

- Navegação Business manual omitia Dados e duplicava a navegação do hub da Central.
- Páginas de gestão repetiam headers da entidade, com apresentação/status divergentes.
- Criação de empresa usava header público com Entrar em uma superfície privada.
- Marca dependia de variáveis exclusivas do portal para três cores.
- Menu mobile tinha regras de alinhamento sobrescritas; skeleton podia ultrapassar telas pequenas.
- Configurações não tinha H1 próprio; sua identificação foi integrada ao componente existente, sem título duplicado.

## SSOT e limites

`businessManagementNavigation.ts` define as oito seções, owner, grupo, ordem, ícone, segmento e route builder. A composição do app autoriza por lifecycle de Central e Business. Teste arquitetural certifica correspondência exata com a árvore de rotas existente; nenhuma rota nova foi criada. Desktop e mobile consomem a mesma definição.

Shell compartilhado concentra identidade, breadcrumbs, navegação e tokens de painel. Header reutiliza seletor de perfis/autenticação existentes, conta, notificações horizontais e saída. Dados usa metadados reais e Não informado; Configurações conserva SettingsTab e gestão de pessoas/acesso do perfil Business. Previews isolados podem conservar identidade própria sem duplicá-la nas páginas reais.

## Rotas ativas preservadas

1. `/central`
2. `/central/empresas`
3. `/central/empresas/nova`
4. `/central/empresas/:businessId`
5. `/central/empresas/:businessId/editar`
6. `/central/empresas/:businessId/fotos`
7. `/central/empresas/:businessId/horarios`
8. `/central/empresas/:businessId/localizacao`
9. `/central/empresas/:businessId/produtos-servicos`
10. `/central/empresas/:businessId/dados`
11. `/central/empresas/:businessId/configuracoes`

Mensagens permanece em `/mensagens` e `/mensagens/business/:threadId`; notificações em `/notificacoes` e preferências em `/conta/notificacoes`. Conta não foi movida para Central.

Código pós-MVP preservado, sem itens de navegação/rotas novas: Community, Gastronomia, Educação, profissionais/serviços, classificados, turismo, vagas, eventos, comunicação territorial, mobilidade, cupons, gamificação, alerts/issues, achados e perdidos, Family Safety, Billing e Public Analytics. Avaliações privadas e estatísticas não foram adicionadas. Nenhuma métrica fictícia foi introduzida.

## Arquivos

- Composição: `src/app/config/businessManagementSurfaceScope.ts`, `src/app/routes/sections/CentralRoutes.tsx`.
- Marca e sessão: `src/app/components/navigation/PublicBrandHeader.tsx`, `src/core/profiles/components/MultiProfileSwitcher.tsx`, `src/modules/central/components/CentralHeader.tsx`, `CentralLayout.tsx`.
- Navegação: `src/modules/business/dashboard/businessManagementNavigation.ts`, `components/BusinessDashboardNavigation.tsx`, `components/BusinessManagementIdentity.tsx`, `pages/BusinessDashboardNav.css`, `pages/BusinessDashboardShellPage.tsx`.
- Páginas: BusinessDetailsPage, BusinessSettingsPage, BusinessOverviewPage, BusinessPhotosPage; BusinessOpeningHoursPage, BusinessLocationPage e BusinessCatalogPage (TSX/CSS); `src/modules/business/pages/EditarEmpresaPage.tsx`.
- Reuso: `src/core/business/components/SettingsTab.tsx`, `src/core/business/utils/businessManagementRoutes.ts`.
- Documentação: `docs/SCREEN-MAP.md`, `docs/FEATURE-MAP.md`, este relatório.
- Testes: business-central-navigation-ssot, central-management-shell, business-dashboard-legacy-shell-retired, central-private-seo; harness isolado em `tests/visual/central-audit*` e `vite.central-audit.config.ts`.

## Validação

- Typecheck app: aprovado.
- ESLint dos componentes alterados: aprovado.
- Onze arquivos de testes relevantes de Central/Business/arquitetura: 38 testes aprovados.
- Prévia com componentes reais e fixtures exclusivamente no harness de teste: 320/360/390/430/768/1440/2560px sem overflow horizontal. Menu mobile, seleção de seção e troca de perfil testados. Nenhum bypass de login ou mock no runtime da aplicação.
- Três falhas preexistentes em suites adicionais: public-paused-monetization-boundary (expectativa histórica de premium) e business-extension-identity-g6 (regex SQL e contrato de entitlements antigo). Arquivos correspondentes não foram alterados; testes não foram enfraquecidos e módulos não foram reativados.

Limite: navegação visual usa dados simulados autorizados pelo usuário. Login, persistência, upload e alterações de acesso com backend real não foram certificados nesta execução. Não há alegação de validação autenticada end-to-end.

### Refinamento visual complementar

Dados passou a usar lista semântica de rótulos/valores com divisores discretos, substituindo cards internos repetidos. Tipografia do título e identidade foi suavizada; thumbnail mobile compactada sem truncar o nome. Navegação mobile tem texto maior; sidebar desktop respeita a altura do header fixo. Configurações usa ícones e texto lado a lado, reduzindo altura sem esconder informações. Espaçamentos do shell mobile foram compactados. Breakpoints 320/360/390/430/768/1440/2560px novamente conferidos sem overflow; seis testes focados de shell/navegação aprovados, typecheck e lint aprovados.

Prévia: `npx vite --config tests/visual/vite.central-audit.config.ts --host 127.0.0.1 --port 5176 --strictPort`, URL `/tests/visual/central-audit.html`. Não integra o build/runtime público.

### Refinamento das oito superfícies de gestão

Complemento mobile: campos de Localização e busca do Catálogo usam fonte de 16px nas telas pequenas; ações de Localização usam duas colunas flexíveis e alvos de 44px. As duas superfícies foram conferidas em 320/360/390/430/768/1440/2560px sem overflow; botões de localização sem conteúdo cortado. Alteração restrita a CSS, sem modificar contratos de dados ou ações.

Complemento de navegação: Escape fecha o menu mobile e devolve o foco ao botão que o abriu, inclusive quando o próprio botão tem foco. Em desktop, não direciona foco ao botão mobile oculto. Três testes de regressão adicionados; nove testes de shell/navegação aprovados. Horários usa grid com o token de espaçamento de seção em vez de margens acumuladas; sete larguras conferidas sem overflow.

- Tokens comuns de tamanho, peso e altura de linha dos títulos aplicados à Visão geral, Editar, Fotos, Horários, Localização e Catálogo, mantendo Dados e Configurações na mesma família.
- Painéis, estados vazios de fotos, seção inicial de edição e ações rápidas compactados; prévias fixas de edição, fotos e horários respeitam o header. Filtros de catálogo se reorganizam nas larguras intermediárias, sem comprimir busca e selects.
- Harness isolado ampliado para as oito seções, reutilizando o shell e componentes reais. Fotos valida o estado vazio; catálogo usa itens simulados e mutações somente em memória; Editar valida apenas a primeira seção real, não o fluxo completo de envio. Localização não recebe coordenadas fictícias. Nenhuma fixture faz parte do runtime de produção.
- 56 verificações de layout: oito superfícies em 320/360/390/430/768/1440/2560px, sem overflow horizontal e com exatamente um H1. Catálogo conferido visualmente em mobile e desktop; filtros e diálogo de criação conferidos em 320px. Horários inclui estados definido, fechado e não informado na fixture.
- Typecheck da aplicação aprovado; ESLint dos componentes de produção alterados sem erros; oito arquivos de testes focados, 25 testes aprovados. Os arquivos do harness são excluídos pelo lint padrão. Persistência/backend real continuam fora da certificação visual.
