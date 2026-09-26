# Admin Locations — contrato vigente

**Status:** documentação operacional viva  
**Rota:** `/admin/locations`  
**Owner de domínio:** `src/core/location/services/LocationAdminService.ts`

Esta página documenta somente o comportamento comprovável no código atual. Ela não é uma segunda autoridade de território e não deve prometer automações, escala ou efeitos colaterais que não estejam implementados no runtime.

## Entrada e autoridade

A rota administrativa é registrada em `src/app/routes/sections/AdminRoutes.tsx` e monta `LocationsAdminPage` pelo conjunto de imports lazy do Admin.

A UI vive em:

- `src/modules/admin/pages/LocationsAdminPage.tsx`

O CRUD estrutural canônico de locations vive em:

- `src/core/location/services/LocationAdminService.ts`

O arquivo `src/modules/admin/services/LocationAdminService.ts` é apenas a facade do módulo Admin para esse owner canônico.

## Comportamento atual

A tela permite:

- carregar locations e organizá-los em hierarquia pai/filho;
- criar location com `parent_id`, tipo, slug, nome, `full_name`, `geographic_path` e metadata;
- informar latitude/longitude manualmente durante a criação;
- editar nome, slug e metadata de um location existente;
- refinar coordenadas pela `LocationGeocodingService`, usando Nominatim;
- abrir uma busca externa segura no Google Maps para conferência visual.

Na criação, `full_name` e `geographic_path` são montados a partir do parent retornado pelo serviço. Quando latitude/longitude não são informadas, esta UI envia metadata sem coordenadas; portanto esta documentação **não afirma herança automática de coordenadas** nem trigger de preenchimento sem uma prova separada do banco.

## Fronteira com Território

`LocationAdminService` é owner do CRUD estrutural, mas **não** é owner das flags de visibilidade territorial.

As chaves abaixo pertencem à fronteira territorial e são preservadas durante updates de metadata:

- `is_selector_active`;
- `is_landing_enabled`;
- `is_navigable`.

O serviço usa uma condição otimista sobre a metadata anterior para evitar que uma edição administrativa ampla sobrescreva uma mudança concorrente feita pela autoridade territorial.

## Regras para manutenção

- não mover autoridade de visibilidade territorial para esta página ou serviço;
- não duplicar CRUD de locations em outro service;
- não documentar ação como funcional antes de existir caller/runtime correspondente;
- não tratar geocoding externo como garantia de precisão absoluta;
- mudanças em território/SSOT devem passar pelos gates arquiteturais aplicáveis.

## Referências vigentes

- Runtime da página: `../pages/LocationsAdminPage.tsx`
- Owner de CRUD: `../../../core/location/services/LocationAdminService.ts`
- Domínio Location: `../../../core/location/README.md`
- SSOT operacional do MVP: `../../../../docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`
- Índice documental: `../../../../docs/README.md`
