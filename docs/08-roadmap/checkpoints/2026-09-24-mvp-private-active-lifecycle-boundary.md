# Checkpoint — lifecycle canônico no grafo privado ativo (2026-09-24)

## Objetivo

Remover dependências residuais da fachada `launchScope.ts` das superfícies privadas que fazem parte do MVP e impedir que verticais pausadas reapareçam na Conta/Central.

## Mudanças

- `CentralHeader`, navegação da Conta, resumo da Conta, hub de Empresas e gestão de link premium usam os registries canônicos de lifecycle;
- Billing, Family Safety, Mobility e Public Analytics continuam obedecendo `productModuleRegistry.ts`;
- Mapa continua capability horizontal e é consultado por `platformCapabilityRegistry.ts`;
- a Conta deixa de anunciar Serviços e Comunidade enquanto os módulos estão pausados;
- o resumo da Conta deixa de apresentar Posts, Serviços e Classificados como áreas ativas;
- o hub de Empresas deixa de expor Gastronomia, Delivery, Mobility e Analytics no grafo ativo;
- recursos premium já concedidos podem continuar gerenciáveis sem reabrir compra/Billing.

## Ratchets

Os testes privados agora impedem:

- retorno de `isLaunchSurfaceEnabled` às superfícies privadas ativas;
- links de Serviços/Comunidade na Conta com esses módulos pausados;
- métricas de Posts/Serviços/Classificados no resumo ativo;
- referências a `business.gastronomy`, Mobility ou Public Analytics no hub Business ativo.

## Release

Nenhum módulo pós-MVP foi ativado. Os blockers externos de release permanecem separados do frontend:

- #305: conexão SQL/Data Plane Supabase ainda reproduz timeout;
- #309: GitHub Actions ainda precisa de autoridade de deploy Edge Functions apropriada.

Não criar fallback, redirect ou bypass para mascarar esses blockers.
