# HARDENING - INSTRUÇÕES PARA APLICAR POLICIES

## SITUAÇÃO ATUAL

✅ **7/11 tabelas OK:**
- pricing_rules
- pricing_peak_hour_multipliers
- pricing_additional_fees
- pricing_audit_log
- emergency_alerts
- emergency_contacts
- emergency_delivery_log

⚠️ **4/11 tabelas BLOQUEADAS (RLS ativo sem policies):**
- ride_shares
- safety_incidents
- safety_evidence
- safety_audit_log

---

## AÇÃO NECESSÁRIA

### 1. Abrir SQL Editor do Supabase

Dashboard → SQL Editor → New Query

### 2. Copiar e executar o arquivo

`HARDENING_2_CRIAR_POLICIES_SAFETY.sql`

### 3. Validar resultado

Executar novamente:
```bash
node verificar_rls_completo.mjs
```

Resultado esperado: **11/11 tabelas OK**

---

## POLICIES CRIADAS

### ride_shares
- service_role: acesso total
- authenticated: CRUD próprios shares (created_by = auth.uid())

### safety_incidents
- service_role: acesso total
- authenticated: CRUD próprios incidentes (reported_by = auth.uid())

### safety_evidence
- service_role: acesso total
- authenticated: CR próprias evidências (uploaded_by = auth.uid())

### safety_audit_log
- service_role: acesso total
- authenticated: CR próprios logs (performed_by = auth.uid())

---

## CRITÉRIO DE ACEITE

✅ Todas as 11 tabelas críticas acessíveis
✅ Service role com acesso total
✅ Authenticated com acesso restrito aos próprios dados
✅ Fluxos principais continuam funcionando

---

## PRÓXIMOS PASSOS APÓS APLICAR

1. Validar RLS: `node verificar_rls_completo.mjs`
2. Testar fluxos E2E
3. Validar observabilidade
4. Limpar legado
5. Relatório final de hardening
