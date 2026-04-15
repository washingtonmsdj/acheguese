# ETAPA 1.3B - Template de Homologação Runtime

**Data**: ___________  
**Testador**: ___________

---

## TESTE 1: Preview do Círculo

**Passos:**
1. Abrir mapa
2. Clicar em "1km"
3. Clicar em "5km"
4. Clicar em "10km"

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| Círculo aparece ao clicar em "1km" | |
| Círculo muda ao clicar em "5km" | |
| Círculo muda ao clicar em "10km" | |
| Círculo NÃO pisca durante pan/zoom | |
| Sem múltiplas requisições ao Supabase | |

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

**Evidência visual capturada:** [ ] SIM [ ] NÃO

---

## TESTE 2: Busca por Raio

**Passos:**
1. Clicar em "5km"
2. Clicar em "Aplicar busca em 5 km"
3. Aguardar resultados

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| Busca executada após clicar "Aplicar" | |
| Marcadores aparecem no mapa | |
| Contadores mostram números corretos | |
| Círculo permanece visível | |
| Mensagem de loading aparece | |

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

**Evidência visual capturada:** [ ] SIM [ ] NÃO

---

## TESTE 3: Marcador de Localização

**Passos:**
1. Atualizar página (F5)
2. Observar mapa

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| Pino de localização aparece automaticamente | |
| Pino aparece em < 2 segundos | |
| Pino não some ao atualizar página | |
| Cache usado (ver logs) | |

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

**Evidência visual capturada:** [ ] SIM [ ] NÃO

---

## TESTE 4: Mensagens e Botão Fechar

**Passos:**
1. Ativar busca em área sem resultados
2. Clicar no "X" da mensagem

**Resultados:**

| Item | SIM/NÃO |
|------|---------|
| Mensagem "Nada encontrado" aparece | |
| Botão "X" visível no canto superior direito | |
| Clicar "X" fecha mensagem | |
| Clicar "X" desativa filtro de raio | |
| Mapa volta ao modo normal | |

**Problemas observados:**
```
[escrever aqui]
```

**Logs do console:**
```
[colar logs relevantes]
```

**Evidência visual capturada:** [ ] SIM [ ] NÃO

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
