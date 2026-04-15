# GATE 5: VEREDITO FINAL - DIVERGÊNCIA SCHEMA LOCAL vs REMOTO

**Data:** 08/04/2026  
**Descoberta:** Banco remoto está MAIS AVANÇADO que o código local

---

## PROBLEMA IDENTIFICADO

### Banco Remoto (Produção)
```
❌ ERROR: column "pickup_location" does not exist
```

**Conclusão:** O banco remoto JÁ APLICOU a ETAPA 12 (hardening) e REMOVEU os campos legados.

### Código Local (Repositório)
```sql
-- Migration base: 20260325000000_base_schema.sql
pickup_location       JSONB NOT NULL  -- LEGADO
dropoff_location      JSONB NOT NULL  -- LEGADO
```

**Conclusão:** O código local ainda tem a migration base com campos legados.

---

## DIVERGÊNCIA CRÍTICA

| Item | Local | Remoto |
|------|-------|--------|
| `pickup_location` | ✅ Existe | ❌ NÃO existe |
| `dropoff_location` | ✅ Existe | ❌ NÃO existe |
| `pickup_address_id` | ⚠️ Opcional | ✅ Obrigatório |
| `dropoff_address_id` | ⚠️ Opcional | ✅ Obrigatório |
| `pickup_location_id` | ⚠️ Opcional | ✅ Obrigatório |
| `dropoff_location_id` | ⚠️ Opcional | ✅ Obrigatório |

**VEREDITO:** Banco remoto está na ETAPA 12, código local está na ETAPA 0.

---

## CAUSA RAIZ

1. ✅ Migration `20260328000026_harden_ride_requests_schema.sql` FOI APLICADA no remoto
2. ❌ Migration NÃO está refletida no código local
3. ❌ Testes foram escritos assumindo schema local (legado)
4. ❌ Fixtures usam campos que não existem no remoto

---

## AÇÕES NECESSÁRIAS

### OPÇÃO 1: Atualizar Testes para Modelo Canônico (RECOMENDADO)

**Vantagem:** Testes ficam alinhados com produção (futuro-proof)

**Ação:**
1. ✅ Executar `GATE_5_DIAGNOSTICO_REMOTO_URGENTE.sql` para confirmar schema
2. ✅ Executar `GATE_5_CRIAR_CORRIDAS_CANONICO.sql` para criar corridas
3. ✅ Atualizar `scripts/setup-gate5-test-data.mjs` para usar modelo canônico
4. ✅ Executar testes

---

### OPÇÃO 2: Reverter Banco Remoto para Legado (NÃO RECOMENDADO)

**Desvantagem:** Reintroduz legado em produção

**Ação:**
1. ❌ Criar migration para adicionar `pickup_location/dropoff_location`
2. ❌ Tornar campos canônicos opcionais novamente
3. ❌ Executar testes

**VEREDITO:** NÃO FAZER. Banco remoto está correto.

---

## DECISÃO FINAL

✅ **ATUALIZAR TESTES PARA MODELO CANÔNICO**

**Justificativa:**
1. Banco remoto está correto (ETAPA 12 aplicada)
2. Código local precisa se atualizar
3. Testes devem validar o schema de produção
4. Não reintroduzir legado

---

## PRÓXIMOS PASSOS

1. ⏳ Executar `GATE_5_DIAGNOSTICO_REMOTO_URGENTE.sql` (confirmar schema)
2. ⏳ Executar `GATE_5_CRIAR_CORRIDAS_CANONICO.sql` (criar corridas)
3. ⏳ Atualizar `scripts/setup-gate5-test-data.mjs` (modelo canônico)
4. ⏳ Executar testes
5. ⏳ Documentar divergência local vs remoto

---

## LIÇÕES APRENDIDAS

1. ❌ **Assumir schema local = remoto** - Falhou
2. ✅ **Diagnosticar remoto primeiro** - Deveria ter feito
3. ✅ **Testes devem validar produção** - Confirmado
4. ⚠️ **Migrations aplicadas fora do repo** - Problema de processo

---

**STATUS:** GATE 5 BLOQUEADO - AGUARDANDO ATUALIZAÇÃO DE FIXTURES PARA MODELO CANÔNICO

