# ETAPA 1.3B - Homologação de Pontos Turísticos

**Data**: ___________  
**Testador**: ___________

---

## TESTE 1: Pontos Turísticos no Modo Normal

**Passos:**
1. Abrir mapa (modo normal, sem raio)
2. Observar marcadores no mapa
3. Verificar console

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| 3 pontos turísticos aparecem no mapa | |
| Marcadores têm ícone correto (🏛️) | |
| Marcadores não piscam durante pan/zoom | |
| Console mostra `[useTouristPointsByBounds] results: (3)` | |

**Pontos esperados:**
- Praia do Porto da Barra
- Farol da Barra
- Pelourinho

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

---

## TESTE 2: Pontos Turísticos no Modo Raio

**Passos:**
1. Clicar em "10km"
2. Clicar em "Aplicar busca em 10 km"
3. Aguardar resultados
4. Verificar contador de pontos turísticos

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| Pontos turísticos aparecem nos resultados | |
| Contador mostra número correto (🏛️ X) | |
| RPC `search_entities_by_radius` executado | |
| Pontos turísticos têm campo `distance_meters` | |

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

---

## TESTE 3: Popup com Distância

**Passos:**
1. Ativar modo raio (10km)
2. Clicar em marcador de ponto turístico
3. Observar popup

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| Popup abre ao clicar | |
| Popup mostra nome do ponto turístico | |
| Popup mostra distância em metros/km | |
| Distância está correta (calculada pelo RPC) | |

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

---

## TESTE 4: Layer Control

**Passos:**
1. Abrir layer control (canto inferior esquerdo)
2. Desmarcar "Pontos Turísticos"
3. Marcar "Pontos Turísticos" novamente

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| Layer control mostra opção "Pontos Turísticos" | |
| Desmarcar oculta pontos turísticos do mapa | |
| Marcar exibe pontos turísticos novamente | |
| Outros marcadores não são afetados | |

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

---

## TESTE 5: Semântica Completa

**Passos:**
1. Verificar dados no Supabase
2. Verificar RPC `search_entities_by_bounds`
3. Verificar RPC `search_entities_by_radius`
4. Verificar hook `useTouristPointsByBounds`

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| Tabela `tourist_points` tem 3 registros | |
| Coluna `point` (GEOMETRY) existe | |
| Índice espacial GIST existe | |
| RPC `search_entities_by_bounds` funciona | |
| RPC `search_entities_by_radius` funciona | |
| Hook usa `placeholderData` (sem flickering) | |

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

---

## RESULTADO FINAL

**Status:** [ ] HOMOLOGADO [ ] REPROVADO

**Falhas encontradas:**
1. 
2. 
3. 

**Observações adicionais:**
```
[escrever aqui]
```

---

**Assinatura:** ___________
