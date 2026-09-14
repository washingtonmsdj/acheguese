# G156 — Integração funcional dos concepts na main

Data: 2026-09-14  
Branch: `main`

Este checkpoint registra a integração seletiva dos concepts da branch `codex/identidade-visual-achegue-se` na linha funcional da `main`. A branch visual não foi mesclada integralmente porque havia regressões de capacidade; o trabalho válido foi absorvido na superfície canônica e as lacunas funcionais começaram a ser fechadas.

## Entregas

- Home inicial (`TerritoryEntryPage`) voltou a ter busca territorial real, sugestões locais/remotas, resolução pública e uso de localização, mantendo a hierarquia visual do concept.
- A Home mantém o foco de lançamento no Complexo do Nordeste de Amaralina e comunica expansão por etapas, sem fingir cobertura ainda não liberada.
- A superfície de gestão de entregas saiu do owner legado de Gastronomia e passou para `src/modules/mobility/delivery/pages/DeliveryManagementPage.tsx`.
- A gestão de entregas usa `OrderDeliverySSOTService.listOrdersBySource` e mutações do hook canônico para operar pedidos reais, sem mocks de pedido.
- A rota de Entregas continua protegida por `launchElement("mobility", ...)`; portanto a criação da superfície funcional não reativa Mobilidade publicamente.
- O guard de SSOT foi atualizado para impedir retorno do antigo `business/gastronomy/pages/DeliveryManagementPage.tsx` e fixar o owner Mobility/Delivery.

## Conceitos preservados

Os concepts de checkout, pedidos, tracking, motoboy e dashboard continuam servindo como referência visual/fluxual, mas não são tratados como dados reais quando a capacidade correspondente ainda não está liberada.

## Gates

- Supabase/provider: continua gateado quando o conector não responde; não houve edição manual de tipos gerados.
- Mobilidade: `PUBLIC_LAUNCH_SURFACES.mobility=false` permanece obrigatório.
- Vercel: o deployment do SHA `3e90db644eae8d6d4f8bd70884931f097f9a06db` estava `QUEUED` no momento deste checkpoint; ausência de erros no log não equivale a `READY`.

## Próxima linha de trabalho

1. Transformar os demais `ConceptMock` expostos em superfícies reais ou previews explicitamente DEV-only, começando por pedidos/tracking e indicação de comunidade.
2. Reaproveitar a linguagem visual do concept nas telas reais sem duplicar SSOTs.
3. Certificar cada integração contra build/Vercel e manter os launch flags como gate de produto.
