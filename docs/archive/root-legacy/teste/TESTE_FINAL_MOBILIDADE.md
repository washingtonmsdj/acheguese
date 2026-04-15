# TESTE FINAL - MOBILIDADE PASSAGEIRO

## PREPARAÇÃO

1. Abrir navegador em: http://localhost:8080/mobilidade/passageiro
2. Abrir DevTools (F12)
3. Ir para aba Console
4. Limpar console (Ctrl+L)

---

## TESTE 1: Criar Corrida Tipo "Viagem"

### Passos:
1. Clicar em "Solicitar Viagem"
2. Selecionar tipo: "Viagem"
3. Preencher origem: "Rua Exemplo, 123"
4. Preencher destino: "Avenida Teste, 456"
5. Verificar que campo "Data e hora" NÃO aparece
6. Verificar que preço é calculado automaticamente
7. Clicar em "Solicitar Viagem"

### Resultado Esperado:
```
Console:
✅ ℹ️  [INFO] useMobilidade.createRide - profile found | {"profileId":"...", "userId":"..."}
✅ ℹ️  [INFO] RideOperationalService.createRide - success | {"rideId":"..."}
✅ Toast: "Corrida solicitada! Buscando motorista..."

Banco:
✅ Registro criado em ride_requests
✅ Status: "searching_driver"
✅ pickup_location: {"address":"Rua Exemplo, 123", "lat":..., "lng":...}
✅ dropoff_location: {"address":"Avenida Teste, 456", "lat":..., "lng":...}
✅ Registro criado em ride_state_audit
```

### Se der erro:
- ❌ "Perfil não encontrado" → Usuário não tem profile
- ❌ "403 Forbidden" → RLS ainda bloqueando (verificar profile_id)
- ❌ "null value in column" → Coluna NOT NULL faltando

---

## TESTE 2: Criar Corrida Tipo "Agendada"

### Passos:
1. Clicar em "Solicitar Viagem"
2. Selecionar tipo: "Agendada"
3. Preencher origem: "Rua Exemplo, 123"
4. Preencher destino: "Avenida Teste, 456"
5. Verificar que campo "Data e hora" APARECE
6. Selecionar data/hora futura
7. Clicar em "Solicitar Viagem"

### Resultado Esperado:
```
Console:
✅ ℹ️  [INFO] useMobilidade.createRide - profile found
✅ ℹ️  [INFO] RideOperationalService.createRide - success
✅ Toast: "Corrida solicitada! Buscando motorista..."

Banco:
✅ Registro criado com departure_time correto
```

---

## TESTE 3: Validação de Campos

### Teste 3.1: Origem vazia
1. Deixar origem vazia
2. Preencher destino
3. Tentar submeter
4. ✅ Formulário não submete (validação HTML5)

### Teste 3.2: Destino vazio
1. Preencher origem
2. Deixar destino vazio
3. Tentar submeter
4. ✅ Formulário não submete

### Teste 3.3: Preço vazio
1. Preencher origem e destino
2. Limpar preço
3. Tentar submeter
4. ✅ Formulário não submete

### Teste 3.4: Horário vazio (agendada)
1. Selecionar tipo "Agendada"
2. Preencher origem, destino, preço
3. Deixar horário vazio
4. Tentar submeter
5. ✅ Formulário não submete

---

## TESTE 4: Geocodificação Automática

### Passos:
1. Clicar em "Usar minha localização" na origem
2. Aguardar GPS capturar
3. Verificar que endereço é preenchido automaticamente
4. Verificar que território é detectado
5. ✅ Campo origem preenchido com endereço reverso

---

## TESTE 5: Cálculo de Preço Automático

### Passos:
1. Preencher origem com GPS
2. Preencher destino com GPS
3. Aguardar cálculo
4. Verificar que preço aparece automaticamente
5. ✅ Campo preço preenchido
6. ✅ Card de estimativa aparece com breakdown

---

## VERIFICAÇÃO NO BANCO

### SQL para verificar corridas criadas:
```sql
SELECT 
  id,
  passenger_profile_id,
  status,
  pickup_location,
  dropoff_location,
  suggested_price,
  created_at
FROM ride_requests
ORDER BY created_at DESC
LIMIT 5;
```

### SQL para verificar auditoria:
```sql
SELECT 
  ride_id,
  from_state,
  to_state,
  changed_by,
  reason,
  created_at
FROM ride_state_audit
ORDER BY created_at DESC
LIMIT 10;
```

---

## CHECKLIST FINAL

### Funcionalidades:
- [ ] Criar corrida tipo "viagem"
- [ ] Criar corrida tipo "agendada"
- [ ] Criar corrida tipo "entrega"
- [ ] Criar corrida tipo "carona_compartilhada"
- [ ] Geocodificação automática
- [ ] Cálculo de preço automático
- [ ] Validação de campos
- [ ] Mensagens de erro claras

### Banco de dados:
- [ ] INSERT funciona sem erro RLS
- [ ] Colunas NOT NULL preenchidas
- [ ] Status inicial correto
- [ ] Auditoria registrada
- [ ] Transição de estado funciona

### UI/UX:
- [ ] Campo horário só aparece para "agendada"
- [ ] Validação não bloqueia viagens imediatas
- [ ] Toast de sucesso aparece
- [ ] Loading states funcionam
- [ ] Responsivo mobile

---

## PROBLEMAS CONHECIDOS E SOLUÇÕES

### Problema: "Perfil não encontrado"
**Causa:** Usuário não tem registro na tabela `profiles`
**Solução:** Criar profile via SQL:
```sql
INSERT INTO profiles (user_id, display_name)
VALUES (auth.uid(), 'Nome do Usuário');
```

### Problema: "403 Forbidden"
**Causa:** RLS bloqueando INSERT
**Solução:** Verificar política:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'ride_requests' 
AND policyname = 'Passengers create rides';
```

### Problema: "null value in column"
**Causa:** Coluna NOT NULL não preenchida
**Solução:** Verificar estrutura da tabela e código do INSERT

---

## LOGS ESPERADOS NO CONSOLE

### Sucesso:
```
✅ Supabase inicializado
✅ onAuthStateChange: SIGNED_IN user=...
✅ [GeolocationService] GPS sucesso: 55956m precisão
✅ [INFO] useMobilidade.createRide - profile found
✅ [INFO] RideOperationalService.createRide - success
```

### Erro:
```
❌ [ERROR] RideOperationalService.createRide
❌ [ERROR] useMobilidade.createRide
```

---

## CONCLUSÃO

Após executar todos os testes:
1. Documentar resultados
2. Reportar bugs encontrados
3. Validar que motor operacional funciona end-to-end
4. Confirmar que SSOT está sendo respeitado
