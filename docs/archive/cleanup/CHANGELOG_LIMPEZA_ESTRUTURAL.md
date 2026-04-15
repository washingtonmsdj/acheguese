# Changelog — Limpeza Estrutural

**Data de conclusão**: 2026-03-29  
**Status**: CONCLUÍDA

---

## O que foi feito

### Identidade pública transversal
- `PublicIdentityService` estabelecido como SSOT para validação de identidade pública
- Adapters: `BusinessIdentityAdapter`, `ProfileIdentityAdapter`
- Policies: `BusinessIdentityPolicy`, `ProfileIdentityPolicy`
- `ProfileIdentityService` migrado para `ProfileService` em todos os consumidores (12 arquivos)

### Business consolidado
- `BusinessUrlService` é a única fonte de URLs canônicas de empresa
- `gerarUrlEmpresa()` e todas as funções deprecated de `urlUtils.ts` removidas
- URL canônica: `/empresas/:uf/:cidade/:slug`
- URL premium: `/p/:slug`
- URL dashboard: `/dashboard/business/:profileId`

### Profile consolidado
- `ProfileService` é o único ponto de acesso a perfis
- Delega validação de username para `PublicIdentityService`
- `profile_type` obrigatório na criação

### Rotas legadas removidas
- `/business/:slug` — removida (era redirect para canônica)
- `/businesss/:slug` — removida (era redirect com typo)
- `/:slug` — removida (catch-all de business)

### Componentes removidos
- `BusinessLegacyRoute.tsx`
- `LegacyBusinessRedirect.tsx`
- `LegacyRedirect.tsx`
- `StandaloneRoute.tsx`

### Helpers deprecated removidos de `urlUtils.ts`
- `gerarUrlEmpresa()`
- `gerarUrlCanonica()`
- `gerarUrlCompletaEmpresa()`
- `gerarTodasUrlsEmpresa()`
- `parseUrlEmpresa()`
- `isUrlLegacy()`
- `extrairSlugLegacy()`
- `CATEGORIA_PARA_NICHO` / `obterNicho()`

---

## Validação final

| Item | Status |
|---|---|
| `tsc --noEmit` | ✅ exit 0 |
| `vite build` | ✅ exit 0 |
| businessRouting.integration.test | ✅ 4/4 |
| profileRouting.integration.test | ✅ 7/7 |
| profilePublicPage.integration.test | ✅ 10/10 |
| ProfileService.test | ✅ 9/9 |
| ProfileService.identity.test | ✅ 14/14 |
| BusinessService (9 suítes) | ✅ 98/98 |
| Auditoria residual src/ | ✅ zero padrões críticos |
| Auditoria e2e/ | ✅ corrigido |
| Auditoria scripts/ | ✅ corrigido |

---

## Documentação histórica

Arquivos de processo movidos para `docs/historico/`.  
Não participam de nenhum fluxo ativo.
