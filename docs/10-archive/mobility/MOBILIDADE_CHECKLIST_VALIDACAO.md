# MOBILIDADE (MOTOBOY) - CHECKLIST DE VALIDAÇÃO

**Objetivo**: Validar a implementação antes de produção  
**Responsável**: Operador/QA  
**Pré-requisito**: Implementação core completa (Fases 0-4 parciais)

---

## ✅ FASE 0 - AMBIENTE

### Migrações
- [ ] Aplicar migrações pendentes:
  ```bash
  cd supabase
  supabase db push
  ```
- [ ] Verificar que não há erros 400 de colunas faltantes em vagas
- [ ] Confirmar que `highlight_type` e `urgencia` existem na tabela `vagas`

### RLS Policies
- [ ] Verificar que policies de `ride_requests` estão em `supabase/migrations/`
- [ ] Confirmar que policies incluem:
  - SELECT para passenger/driver/admin
  - INSERT para passenger (com validações)
  - UPDATE para driver/admin
  - DELETE apenas para admin
- [ ] Testar em ambiente novo (sem policies legadas) se possível

### Schema
- [ ] Verificar colunas de `ride_requests`:
  - `ride_mode` (enum com 'motoboy')
  - `source_type` (enum: passenger/business/gastronomy/service/admin)
  - `source_id` (uuid, nullable)
  - `status` (enum com todos os estados)
  - `created_at`, `updated_at`
- [ ] Verificar índices:
  - `idx_ride_requests_status`
  - `idx_ride_requests_source`
  - `idx_ride_requests_driver`

---

## ✅ FASE 1 - PERMISSÕES

### Autorização Backend
- [ ] Testar `MotoboyAuthorizationService.authorize()` com:
  - [ ] Passenger válido → deve autorizar
  - [ ] Business sem plano → deve negar
  - [ ] Business com plano → deve autorizar
  - [ ] Território desabilitado → deve negar
  - [ ] Source_id inválido → deve negar

### Logs de Auditoria
- [ ] Verificar que tentativas de autorização são logadas
- [ ] Verificar que criações de entrega são logadas
- [ ] Verificar que cancelamentos são logados
- [ ] Verificar que erros de permissão são logados

### Códigos de Erro
- [ ] Confirmar que erros retornam mensagens padronizadas:
  - `ROLLOUT_DISABLED`
  - `MISSING_ENTITLEMENT`
  - `INVALID_ASSOCIATION`
  - `UNAUTHORIZED`

---

## ✅ FASE 2 - SSOT

### Fluxo Único
- [ ] Confirmar que `useDelivery` é o hook oficial
- [ ] Confirmar que `RideOperationalService` é o service oficial
- [ ] Confirmar que `ride_requests` é a tabela oficial
- [ ] Verificar que não há chamadas a `delivery_requests` para rede motoboy

### Tipagem
- [ ] Verificar que não há `@ts-nocheck` em:
  - `MotoboyAuthorizationService.ts`
  - `RideOperationalService.ts`
  - `useDelivery.ts`
  - `useMobilidade.ts`
- [ ] Executar `npx tsc --noEmit` sem erros críticos

---

## ✅ FASE 3 - INTEGRAÇÃO FRONTEND

### Gastronomia
- [ ] Abrir `/gastronomy/:id/delivery-management`
- [ ] Clicar em "Nova Entrega"
- [ ] Verificar que modal abre com campos corretos
- [ ] Preencher formulário e submeter
- [ ] Verificar que entrega aparece na lista
- [ ] Verificar que `source_type='gastronomy'` e `source_id` corretos

### Empresa
- [ ] Abrir dashboard de empresa (`/dashboard/business/:id`)
- [ ] Verificar que CTA "Solicitar Motoboy" aparece
- [ ] Se plano não permite, verificar mensagem de erro
- [ ] Se plano permite, clicar e verificar modal
- [ ] Submeter e verificar criação

### Stubs Substituídos
- [ ] Testar avaliação de corrida (passageiro)
- [ ] Testar confirmação de conclusão (passageiro)
- [ ] Testar reporte de problema (passageiro)
- [ ] Verificar que dados são persistidos (não apenas toast)

---

## ✅ FASE 4 - ADMIN

### AdminMotoboyOperationsPage
- [ ] Abrir `/admin/motoboy-operations`
- [ ] Verificar que lista de entregas carrega
- [ ] Testar filtros:
  - [ ] Por status (requested, in_delivery, delivered, etc.)
  - [ ] Por território
  - [ ] Por source_type
  - [ ] Por motoboy
- [ ] Verificar métricas:
  - [ ] Tempo médio de aceite
  - [ ] Taxa de falha
  - [ ] Taxa de cancelamento
- [ ] Testar ação de cancelamento admin
- [ ] Verificar estados:
  - [ ] Loading (skeleton)
  - [ ] Erro (mensagem clara)
  - [ ] Vazio (mensagem "Nenhuma entrega")

### Link de Acesso
- [ ] Abrir `/admin/operacoes`
- [ ] Verificar que há link para "Operações Motoboy"
- [ ] Clicar e verificar navegação

---

## ✅ TESTES E2E CRÍTICOS

### Fluxo Completo: Business → Motoboy → Conclusão
1. [ ] Business solicita motoboy via dashboard
2. [ ] Verificar que `ride_request` é criada com:
   - `ride_mode='motoboy'`
   - `source_type='business'`
   - `source_id={businessId}`
   - `status='requested'`
3. [ ] Motoboy aceita via app/dashboard
4. [ ] Verificar que status muda para `driver_accepted`
5. [ ] Motoboy confirma coleta
6. [ ] Verificar que status muda para `pickup_confirmed`
7. [ ] Motoboy inicia entrega
8. [ ] Verificar que status muda para `in_delivery`
9. [ ] Motoboy confirma entrega
10. [ ] Verificar que status muda para `delivered`
11. [ ] Admin visualiza entrega concluída em `/admin/motoboy-operations`

### Fluxo de Permissão Negada
1. [ ] Business sem plano tenta solicitar
2. [ ] Verificar que botão mostra mensagem de erro
3. [ ] Verificar que modal não abre
4. [ ] Verificar que log de auditoria registra tentativa negada

### Fluxo de Cancelamento
1. [ ] Business solicita motoboy
2. [ ] Business cancela antes de aceite
3. [ ] Verificar que status muda para `cancelled`
4. [ ] Verificar que motoboy não vê mais a oferta
5. [ ] Admin visualiza cancelamento em operações

---

## ✅ SEGURANÇA

### RLS
- [ ] Tentar acessar `ride_requests` sem autenticação → deve negar
- [ ] Tentar UPDATE de ride de outro usuário → deve negar
- [ ] Tentar DELETE sem ser admin → deve negar

### Autorização
- [ ] Tentar criar entrega com `source_id` de outra empresa → deve negar
- [ ] Tentar criar entrega em território desabilitado → deve negar
- [ ] Tentar criar entrega sem entitlement → deve negar

### Auditoria
- [ ] Verificar que todas as tentativas negadas são logadas
- [ ] Verificar que logs incluem:
  - `userId`
  - `sourceType`
  - `sourceId`
  - `reason` (motivo da negação)

---

## ✅ PERFORMANCE

### Queries
- [ ] Verificar que lista de entregas carrega em < 2s
- [ ] Verificar que filtros aplicam em < 500ms
- [ ] Verificar que métricas calculam em < 1s

### Cache
- [ ] Verificar que após criar entrega, lista atualiza automaticamente
- [ ] Verificar que após cancelar, lista atualiza automaticamente
- [ ] Verificar que cache é invalidado corretamente

---

## ✅ UX

### Estados de Loading
- [ ] Verificar skeleton durante carregamento
- [ ] Verificar spinner em botões durante submit
- [ ] Verificar que usuário não pode clicar múltiplas vezes

### Estados de Erro
- [ ] Verificar mensagem clara quando erro de rede
- [ ] Verificar mensagem clara quando erro de permissão
- [ ] Verificar mensagem clara quando erro de validação

### Estados Vazios
- [ ] Verificar mensagem quando não há entregas
- [ ] Verificar mensagem quando filtro não retorna resultados
- [ ] Verificar CTA para criar primeira entrega

### Feedback ao Usuário
- [ ] Verificar toast de sucesso ao criar entrega
- [ ] Verificar toast de sucesso ao cancelar
- [ ] Verificar toast de erro quando falha

---

## ✅ MOBILE

### Responsividade
- [ ] Testar dashboard empresa em mobile
- [ ] Testar modal de criação em mobile
- [ ] Testar admin operations em mobile
- [ ] Verificar que botões são clicáveis
- [ ] Verificar que formulários são preenchíveis

---

## ✅ DOCUMENTAÇÃO

### Código
- [ ] Verificar que `MotoboyAuthorizationService` tem JSDoc
- [ ] Verificar que `RequestMotoboyButton` tem JSDoc
- [ ] Verificar que `AdminMotoboyOperations` tem comentários

### Arquitetura
- [ ] Ler `ADR-001-ssot-motoboy-ride-requests.md`
- [ ] Confirmar que decisão está clara
- [ ] Confirmar que rationale está documentado

### Progresso
- [ ] Ler `MOBILIDADE_IMPLEMENTACAO_PROGRESSO.md`
- [ ] Confirmar que todas as fases estão documentadas
- [ ] Confirmar que pendências estão claras

---

## 🚨 BLOQUEADORES CRÍTICOS

Se qualquer item abaixo falhar, **NÃO PROSSEGUIR PARA PRODUÇÃO**:

- [ ] Migrações aplicadas sem erro
- [ ] RLS policies ativas e funcionando
- [ ] Autorização backend funcionando
- [ ] Fluxo E2E completo funciona
- [ ] Admin consegue visualizar e cancelar entregas
- [ ] Logs de auditoria funcionando

---

## ✅ CRITÉRIO DE APROVAÇÃO

### Mínimo para Staging
- [ ] Todas as checagens de Fase 0-2 passam
- [ ] Fluxo E2E básico funciona
- [ ] Admin operacional funciona
- [ ] Sem erros críticos de console

### Mínimo para Produção
- [ ] Todas as checagens acima passam
- [ ] Testes E2E críticos passam
- [ ] Segurança validada
- [ ] Performance aceitável
- [ ] UX mobile validada
- [ ] Documentação completa

---

## 📝 REGISTRO DE VALIDAÇÃO

**Data**: ___________  
**Validador**: ___________  
**Ambiente**: [ ] Local [ ] Staging [ ] Produção

### Resultado
- [ ] ✅ Aprovado para próxima fase
- [ ] ⚠️ Aprovado com ressalvas (listar abaixo)
- [ ] ❌ Reprovado (listar bloqueadores abaixo)

### Observações
```
[Espaço para notas do validador]
```

### Bloqueadores Encontrados
```
[Listar bloqueadores que impedem aprovação]
```

### Ressalvas
```
[Listar itens que precisam atenção mas não bloqueiam]
```

---

**Última atualização**: 2026-04-19  
**Versão**: 1.0
