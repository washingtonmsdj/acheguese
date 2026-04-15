# ANÁLISE MINUCIOSA - MOBILIDADE PASSAGEIRO

**Data:** 2026-04-06  
**URL:** http://localhost:8080/mobilidade/passageiro  
**Objetivo:** UI/UX nível AAA, responsivo, código limpo, sem gambiarras, SSOT

---

## PROBLEMAS IDENTIFICADOS

### 1. HARDCODED COLORS ❌
- `bg-[#1E2529]` em RateDriverModal
- Cores RGB diretas ao invés de design tokens
- Inconsistência com tema global

### 2. DADOS OPCIONAIS SEM VALIDAÇÃO ❌
```typescript
ride.driver?.name ?? '?'  // Fallback manual
ride.driver.vehicle_plate // Pode crashar se undefined
```

### 3. COMPONENTES GRANDES ❌
- `PassengerRideHistory.tsx`: 400+ linhas
- Lógica de filtros misturada com UI
- Dificulta manutenção

### 4. TIPOS LEGADOS ❌
```typescript
import type { RideRequest } from "@/modules/mobility/types";
// TODO: Migrar para mobility.generated.ts
```

### 5. RESPONSIVIDADE PARCIAL ⚠️
- Grid fixo `grid-cols-2`, `grid-cols-4`
- Sem breakpoints mobile/tablet/desktop
- Texto pode quebrar em telas pequenas

### 6. ACESSIBILIDADE INCOMPLETA ⚠️
- Alguns botões sem `aria-label`
- Contraste de cores não validado
- Foco de teclado não otimizado

### 7. PERFORMANCE ⚠️
- `useMemo` usado, mas pode otimizar mais
- Animações podem causar jank em mobile
- Imagens/mapas sem lazy loading explícito

### 8. SSOT VIOLADO ❌
```typescript
// PassageiroPage.tsx linha 73
const rating = await MobilityService.getPassengerRating(...)
// Deveria vir do hook useMobilidade
```

### 9. MAGIC NUMBERS ❌
```typescript
className="h-14"  // 14 o quê? Por quê 14?
className="text-[0.6rem]"  // Tamanho arbitrário
```

### 10. ERROR HANDLING INCONSISTENTE ⚠️
- Alguns componentes com ErrorBoundary
- Outros sem tratamento de erro
- Toast usado, mas sem padrão consistente

---

## MELHORIAS NECESSÁRIAS

### PRIORIDADE ALTA 🔴

1. **Remover hardcoded colors**
   - Usar design tokens do tema
   - Garantir dark/light mode

2. **Validação de dados**
   - Adicionar guards para dados opcionais
   - Prevenir crashes por undefined

3. **Refatorar componentes grandes**
   - Extrair lógica de filtros
   - Criar sub-componentes

4. **Migrar tipos legados**
   - Usar `mobility.generated.ts`
   - Remover TODOs

5. **Corrigir SSOT**
   - Rating deve vir do hook
   - Centralizar estado

### PRIORIDADE MÉDIA 🟡

6. **Responsividade completa**
   - Breakpoints: sm, md, lg, xl
   - Grid adaptativo
   - Texto responsivo

7. **Acessibilidade AAA**
   - ARIA labels completos
   - Contraste WCAG AAA
   - Navegação por teclado

8. **Performance**
   - Lazy loading
   - Debounce em filtros
   - Virtualização de listas longas

### PRIORIDADE BAIXA 🟢

9. **Design tokens**
   - Substituir magic numbers
   - Criar constantes semânticas

10. **Testes**
    - Unit tests para lógica
    - Integration tests para fluxos

---

## PLANO DE EXECUÇÃO

### FASE 1: CORREÇÕES CRÍTICAS
1. Remover hardcoded colors
2. Adicionar validação de dados
3. Corrigir SSOT (rating)

### FASE 2: REFATORAÇÃO
4. Extrair lógica de filtros
5. Criar sub-componentes
6. Migrar tipos

### FASE 3: RESPONSIVIDADE
7. Adicionar breakpoints
8. Grid adaptativo
9. Texto responsivo

### FASE 4: ACESSIBILIDADE
10. ARIA labels
11. Contraste
12. Navegação teclado

### FASE 5: PERFORMANCE
13. Lazy loading
14. Debounce
15. Virtualização

---

## ESTIMATIVA

- **Fase 1:** 30min
- **Fase 2:** 1h
- **Fase 3:** 45min
- **Fase 4:** 30min
- **Fase 5:** 45min

**Total:** ~3h30min

---

## PRÓXIMOS PASSOS

Executar Fase 1 agora:
1. Remover `bg-[#1E2529]` → usar `bg-card`
2. Adicionar guards para `ride.driver`
3. Mover rating para hook `useMobilidade`
