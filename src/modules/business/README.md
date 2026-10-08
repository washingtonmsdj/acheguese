# Empresas — módulo de produto

**Lifecycle do domínio:** consultar `src/app/config/productModuleRegistry.ts`.  
**Owner da interface:** `src/modules/business/`.  
**Owner de domínio e persistência:** `src/core/business/`.  
**Critérios e gates:** [`VALIDATION.md`](./VALIDATION.md).  
**Prontidão/release:** `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`, sob `docs/README.md`.

Este README é o índice técnico do módulo; não é um checkpoint G4/G6, não fixa SHA ou estado de produção e não duplica o Definition of Done operacional.

## Escopo e estrutura

Empresas é o domínio-base de entidades comerciais, independente de Gastronomia e Educação, que permanecem subdomínios derivados quando seu lifecycle permitir.

| Área | Local canônico | Responsabilidade |
| --- | --- | --- |
| Cadastro de empresa | `hooks/useBusinessCreateMultiProfile.ts`, `pages/CriarEmpresaPage.tsx` | UI e fluxo; criação persistente delegada a `BusinessService.createBusiness()` |
| Edição | `hooks/useBusinessEdit.ts`, `pages/EditarEmpresaPage.tsx` | Estado do formulário, upload e navegação |
| Central de gestão | `src/modules/central/` | Rotas protegidas e superfície administrativa |
| Identidade e URL | `src/core/business/services/BusinessUrlService.ts`, `src/core/public-identity/` | Slug e URL públicos |
| Persistência | `src/core/business/services/business.mutations.ts` | Criação, atualização e desativação canônicas via broker |
| Consulta | `src/core/business/services/business.queries.ts` | Read models e consultas públicas |
| Ownership | `src/core/business/services/BusinessOwnershipService.ts` | Resolução de proprietário/gestor; backend mantém a autorização efetiva |
| Redes e filiais | `src/core/business/services/NetworkService.ts` | Lifecycle de rede e unidades |
| Mídias | `src/core/media/services/MediaService.ts` | Upload e referências canônicas |
| Analytics | `src/core/analytics/AnalyticsService.ts` | Métricas e views autorizadas |

Arquivos de UI não acessam diretamente `@/integrations/*`, tabelas Supabase ou `@supabase/supabase-js`. O owner de mutations permanece `src/core/business/`; não criar writer duplicado sob páginas ou hooks.

## Identidade e segurança

- `profiles.id` identifica o perfil público e a empresa no contexto de rota.
- `business_data.id` identifica o agregado persistente e integrações que exigem seu ID.
- Um gestor pode estar autenticado sem ter a empresa como **perfil ativo**. A permissão é determinada pelo serviço de domínio e pela autoridade do backend, não pela seleção visual do perfil.
- Falha na consulta não equivale a dado ausente; ausência confirmada não equivale a indisponibilidade de RLS/RPC.
- Upload de logo/banner não deve ser anunciado como atualização persistida até confirmação do comando de gravação.
- Retorno de mutation após commit não deve mascarar gravação confirmada como falha por indisponibilidade do read model.

## Contratos e manutenção

- Contratos canônicos: `src/core/business/types/` e facade pública `src/core/business/services/BusinessService.ts`.
- Validation: [`VALIDATION.md`](./VALIDATION.md) preserva invariantes e gates de release; seu status é separado da prontidão global.
- Boundary checks: `tools/architecture/validate-business-module-boundaries.ts`, validators de SSOT e testes de segurança.
- Frontend e documentação podem evoluir em módulos pausados sem reativá-los.
- Não reintroduzir writes diretos de `business_data`, `business_views` legado, fluxo de criação paralelo em `MultiProfileService` ou facades vazias.
- Histórico de fases G4/G6 e provas datadas pertencem a checkpoints, `docs/10-archive/` e ao Git; não reconstituem um segundo estado de MVP.

O status do produto vivo é resolvido pelos registries, a certificação do módulo por [`VALIDATION.md`](./VALIDATION.md) e o release global somente por `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.
