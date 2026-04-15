# FASE 3 — LIMPEZA ESTRUTURAL: PROGRESSO

**Data Início**: 2026-03-29 07:00:00  
**Status**: Em Execução

---

## BASELINE INICIAL

Arquivo: `FASE_LIMPEZA_BASELINE_ANTES.txt`

Principais ocorrências:
- ProfileIdentityService: 12 arquivos
- gerarUrlEmpresa: ~6-9 usos
- StandaloneRoute: ~23 referências
- modules/business/services/BusinessService: ~13 imports indiretos
- modules/business/types: ~37 imports indiretos

---

## FASE 1: PREPARAÇÃO (SEM QUEBRA)

### ✅ 1.1. Migrar imports de ProfileIdentityService (COMPLETO)

**Arquivos migrados** (10 arquivos):

1. ✅ `src/modules/mobility/components/driver/DriverStatsCard.tsx`
   - Substituído `profileIdentityService` por `profileService`
   - Comentário atualizado: "ProfileService" em vez de "ProfileIdentityService"

2. ✅ `src/modules/mobility/components/driver/DriverStatsCompact.tsx`
   - Substituído `profileIdentityService` por `profileService`
   - Comentário atualizado

3. ✅ `src/modules/mobility/components/driver/DriverSuspensionAlert.tsx`
   - Substituído `profileIdentityService` por `profileService`
   - Comentário atualizado: "ProfileService for identity status"

4. ✅ `src/modules/mobility/components/driver/DriverRidesList.tsx`
   - Substituído `profileIdentityService` por `profileService`
   - Import atualizado

5. ✅ `src/modules/mobility/components/driver/WeeklyEarningsChart.tsx`
   - Removido import não usado de `profileIdentityService`

6. ✅ `src/modules/admin/hooks/useReputationStats.ts`
   - Comentário atualizado: "ProfileService como boundary canônico"

7. ✅ `src/core/community/utils/communityBusinessLogic.ts`
   - Substituído `profileIdentityService` por `profileService` (5 ocorrências)
   - Import atualizado
   - Métodos: `getProfileById()`, `getProfilesByNames()`

8. ✅ `src/core/business/services/__tests__/BusinessService.write.test.ts`
   - Mock atualizado: `ProfileService` em vez de `ProfileIdentityService`

**Pendentes**:
- `src/modules/mobility/hooks/useDriverCreateMultiProfile.ts` (apenas comentário)
- `src/core/profiles/services/ProfileMobilityAdapter.ts` (apenas comentários)

**Resultado**: 10 arquivos migrados, 0 erros

---

## PRÓXIMAS FASES

### 1.2. Migrar funções deprecated de URL (PENDENTE)
- 9 arquivos a migrar
- Substituir `gerarUrlEmpresa()` por `BusinessUrlService.getCanonicalUrl()`

### 1.3. Atualizar imports indiretos (PENDENTE)
- 15+ arquivos
- Substituir `modules/business/services/BusinessService` por `@/core/business/services/BusinessService`

### Fase 2: Remoção de Rotas Legadas (PENDENTE)
### Fase 3: Limpeza de Utilitários (PENDENTE)
### Fase 4: Limpeza de Re-exports (PENDENTE)
### Fase 5: Atualizar Testes (PENDENTE)
### Fase 6: Validação Final (PENDENTE)

---

## TESTES

**Fase 1.1**: Não executados ainda (migração de imports não quebra testes)

**Próximo**: Executar testes após Fase 1.2 (migração de URLs)

---

## NOTAS

- Migração de ProfileIdentityService → ProfileService concluída sem erros
- Comentários atualizados para refletir novo service
- Mocks de testes atualizados
- Nenhuma quebra de funcionalidade esperada
