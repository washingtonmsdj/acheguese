# Checkpoint R4 — Business discovery para Mapa/Perto de mim — 2026-09-21

## Decisão atual

Mapa e Perto de mim fazem parte do MVP e devem descobrir **Empresas**. Categorias Business não são desligadas pelo lifecycle de verticalizações especializadas.

Assim, escolas reais são elegíveis para:

- Empresas;
- Mapa;
- Perto de mim.

O módulo Educação continua pausado e suas rotas/experiências especializadas permanecem isoladas.

## Boundaries

- lista Business: `BusinessService`;
- mapa: `MapBusinessLayerRuntimeService`;
- proximidade: `useNearbyBusinesses` -> geospatial -> Business owner;
- URLs: `BusinessUrlService`;
- layers do mapa: filtrados por lifecycle; no MVP público, somente Business.

A política de categoria não passa pelo launch scope. Não existe mapa de categoria Business → vertical: `education=false` ou `gastronomy=false` pausa somente a experiência especializada, nunca a entidade institucional.

## Evidência remota

A probe `tests/security/business-discovery-launch-remote-probe.sql` executa `search_entities_by_radius`, resolve cada identidade espacial contra `public_business_search`, rejeita identidades sem join e exige pelo menos um Business público no recorte.

A probe foi executada no Supabase canônico em 2026-09-21 sem exceção.

## Estado

Business discovery está alinhado ao MVP de três módulos no source e no runtime remoto. CI/browser/build exact-SHA continuam pendentes enquanto os runners/provider não executarem de fato.
