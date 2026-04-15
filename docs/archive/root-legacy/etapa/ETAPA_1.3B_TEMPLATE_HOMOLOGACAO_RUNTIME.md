# ETAPA 1.3B - TEMPLATE HOMOLOGAÇÃO RUNTIME

**Data**: ___________  
**URL**: http://localhost:8081/mapa  
**Testador**: ___________

---

## TESTE 1: MODO RAIO COM PONTOS TURÍSTICOS

**Passos**:
1. Abrir /mapa
2. Clicar botão de localização
3. Permitir GPS
4. Verificar controle de raio
5. Ajustar raio (1km, 5km, 10km)

**Resultado Observado**:
- Marcador verde apareceu: [ ] SIM [ ] NÃO
- Controle de raio apareceu: [ ] SIM [ ] NÃO
- Contador "Pontos Turísticos: X" visível: [ ] SIM [ ] NÃO
- Contador atualiza ao mudar raio: [ ] SIM [ ] NÃO
- Marcadores aparecem/desaparecem: [ ] SIM [ ] NÃO

**Problemas Observados**:
```
[DESCREVER ou escrever NENHUM]
```

**Logs do Console**:
```
[COLAR LOGS RELEVANTES]
```

**Evidência Visual**: [ ] Screenshot anexado

---

## TESTE 2: POPUP COM DISTÂNCIA

**Passos**:
1. Com modo raio ativo
2. Clicar em marcador de ponto turístico
3. Verificar popup

**Resultado Observado**:
- Popup abriu: [ ] SIM [ ] NÃO
- Nome do ponto turístico correto: [ ] SIM [ ] NÃO
- Distância visível: [ ] SIM [ ] NÃO
- Formato da distância: __________ (ex: "1.2 km")

**Problemas Observados**:
```
[DESCREVER ou escrever NENHUM]
```

**Logs do Console**:
```
[COLAR LOGS RELEVANTES]
```

**Evidência Visual**: [ ] Screenshot anexado

---

## TESTE 3: LAYER CONTROL INTERATIVO

**Passos**:
1. Desativar modo raio
2. Localizar controle de camadas
3. Desativar "Pontos Turísticos"
4. Fazer zoom/pan
5. Reativar "Pontos Turísticos"

**Resultado Observado**:
- Opção "Pontos Turísticos" visível: [ ] SIM [ ] NÃO
- Desativar remove marcadores: [ ] SIM [ ] NÃO
- Marcadores permanecem ocultos durante zoom/pan: [ ] SIM [ ] NÃO
- Reativar traz marcadores de volta: [ ] SIM [ ] NÃO
- Flickering durante transições: [ ] SIM [ ] NÃO

**Problemas Observados**:
```
[DESCREVER ou escrever NENHUM]
```

**Logs do Console**:
```
[COLAR LOGS RELEVANTES]
```

**Evidência Visual**: [ ] Screenshot anexado

---

## TESTE 4: SEMÂNTICA COMPLETA

**Passos**:
1. Modo normal: verificar 3 pontos turísticos
2. Ativar raio: verificar filtro por raio
3. Desativar raio: verificar volta ao normal
4. Layer off: verificar pontos ocultos
5. Layer on: verificar pontos voltam

**Resultado Observado**:
- Transições entre modos suaves: [ ] SIM [ ] NÃO
- Comportamento consistente: [ ] SIM [ ] NÃO
- Estabilidade visual durante zoom/pan: [ ] SIM [ ] NÃO

**Problemas Observados**:
```
[DESCREVER ou escrever NENHUM]
```

**Logs do Console**:
```
[COLAR LOGS RELEVANTES]
```

**Evidência Visual**: [ ] Screenshot anexado

---

## RESULTADO FINAL

**Status**: [ ] HOMOLOGADO [ ] REPROVADO

**Falhas Encontradas**:
```
[LISTAR OBJETIVAMENTE ou escrever NENHUMA]
```

---

**Testador**: ___________  
**Data**: ___________
