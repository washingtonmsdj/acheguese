# ETAPA 1.3B - INSTRUÇÕES PARA VALIDAÇÃO RUNTIME

**Data**: 04/04/2026  
**Status Atual**: ⏳ IMPLEMENTADA, AGUARDANDO HOMOLOGAÇÃO RUNTIME  
**URL**: http://localhost:8081/mapa

---

## ⚠️ IMPORTANTE

A ETAPA 1.3B está implementada no código, mas NÃO pode ser homologada sem validação runtime real.

**Análise de código NÃO substitui teste visual.**

---

## 📋 TESTES OBRIGATÓRIOS

Execute cada teste e registre EXATAMENTE o que observou.

---

### TESTE 1: Modo Raio com Pontos Turísticos

**Passos**:
1. Abrir http://localhost:8081/mapa
2. Clicar no botão de localização (canto superior direito)
3. Permitir acesso ao GPS
4. Aguardar marcador verde aparecer
5. Verificar se controle de raio aparece (canto inferior direito)
6. Observar se há contador "Pontos Turísticos: X"
7. Ajustar raio para 1km, 5km, 10km
8. Observar se contador atualiza

**Registrar**:
- Marcador verde apareceu? [SIM/NÃO]
- Controle de raio apareceu? [SIM/NÃO]
- Contador de pontos turísticos visível? [SIM/NÃO]
- Contador atualiza ao mudar raio? [SIM/NÃO]
- Marcadores aparecem/desaparecem? [SIM/NÃO]
- Erros no console? [COLAR LOGS]

**Evidência**: Screenshot do controle de raio com contador

---

### TESTE 2: Popup com Distância

**Passos**:
1. Com modo raio ativo (do teste anterior)
2. Clicar em um marcador de ponto turístico
3. Observar popup que abre
4. Verificar se mostra:
   - Nome do ponto turístico
   - Distância (ex: "1.2 km")
5. Clicar fora para fechar

**Registrar**:
- Popup abriu? [SIM/NÃO]
- Nome correto? [SIM/NÃO]
- Distância visível? [SIM/NÃO]
- Formato da distância: [EXEMPLO: "1.2 km"]
- Erros no console? [COLAR LOGS]

**Evidência**: Screenshot do popup com distância visível

---

### TESTE 3: Layer Control Interativo

**Passos**:
1. Desativar modo raio (clicar no X do controle)
2. Localizar controle de camadas (canto inferior esquerdo)
3. Verificar opção "Pontos Turísticos"
4. Clicar para desativar
5. Observar marcadores desaparecerem
6. Fazer zoom/pan
7. Clicar para reativar
8. Observar marcadores reaparecerem

**Registrar**:
- Opção "Pontos Turísticos" visível? [SIM/NÃO]
- Desativar remove marcadores? [SIM/NÃO]
- Marcadores permanecem ocultos durante zoom/pan? [SIM/NÃO]
- Reativar traz marcadores de volta? [SIM/NÃO]
- Flickering durante transições? [SIM/NÃO]
- Erros no console? [COLAR LOGS]

**Evidência**: Screenshot do layer control + marcadores ocultos/visíveis

---

### TESTE 4: Semântica Completa

**Passos**:
1. Modo normal: verificar 3 pontos turísticos
2. Ativar raio: verificar apenas pontos dentro do raio
3. Desativar raio: verificar volta ao modo normal
4. Layer off: verificar nenhum ponto visível
5. Layer on: verificar pontos voltam
6. Zoom/pan: verificar estabilidade

**Registrar**:
- Transições suaves? [SIM/NÃO]
- Comportamento consistente? [SIM/NÃO]
- Estabilidade visual? [SIM/NÃO]
- Erros no console? [COLAR LOGS]

**Evidência**: Console log mostrando transições

---

## 📝 TEMPLATE DE RESPOSTA

```
TESTE 1 - MODO RAIO:
- Marcador verde: [SIM/NÃO]
- Controle de raio: [SIM/NÃO]
- Contador visível: [SIM/NÃO]
- Contador atualiza: [SIM/NÃO]
- Problemas: [DESCREVER ou NENHUM]
- Screenshot: [ANEXAR]

TESTE 2 - POPUP:
- Popup abre: [SIM/NÃO]
- Nome correto: [SIM/NÃO]
- Distância visível: [SIM/NÃO]
- Formato: [EXEMPLO]
- Problemas: [DESCREVER ou NENHUM]
- Screenshot: [ANEXAR]

TESTE 3 - LAYER CONTROL:
- Opção visível: [SIM/NÃO]
- Desativar funciona: [SIM/NÃO]
- Reativar funciona: [SIM/NÃO]
- Flickering: [SIM/NÃO]
- Problemas: [DESCREVER ou NENHUM]
- Screenshot: [ANEXAR]

TESTE 4 - SEMÂNTICA:
- Transições suaves: [SIM/NÃO]
- Comportamento consistente: [SIM/NÃO]
- Estabilidade: [SIM/NÃO]
- Problemas: [DESCREVER ou NENHUM]

CONSOLE:
[COLAR TODOS OS LOGS RELEVANTES]

STATUS FINAL: [HOMOLOGADO ou REPROVADO]
```

---

## ✅ CRITÉRIO DE APROVAÇÃO

A ETAPA 1.3B será HOMOLOGADA se:
- ✅ Modo raio funciona com pontos turísticos
- ✅ Popup mostra distância corretamente
- ✅ Layer control oculta/exibe pontos turísticos
- ✅ Semântica correta em todos os fluxos
- ✅ Console sem erros bloqueadores

---

## 🚫 NÃO ACEITO

- Análise de código
- "Deve funcionar porque está implementado"
- "Testei mentalmente"
- Descrição sem evidências visuais

---

**APENAS RESULTADO OBSERVADO EM RUNTIME SERÁ ACEITO.**

