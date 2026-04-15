# ETAPA 1.3B - GUIA DE VALIDAÇÃO

**Data**: 04/04/2026  
**URL**: http://localhost:8081/mapa  
**Objetivo**: Validar fluxos complementares de pontos turísticos

---

## 📋 CHECKLIST DE VALIDAÇÃO

Execute cada validação na ordem e anote os resultados observados.

---

### ✅ VALIDAÇÃO 1: Modo Raio com Pontos Turísticos

**Passos**:
1. Abrir `/mapa`
2. Clicar no botão de localização (canto superior direito)
3. Permitir acesso ao GPS quando solicitado
4. Aguardar marcador verde aparecer
5. Verificar se controle de raio aparece (canto inferior direito)
6. Observar contador de pontos turísticos no controle
7. Ajustar raio para 1km
8. Observar contador atualizar
9. Ajustar raio para 5km
10. Observar contador atualizar
11. Ajustar raio para 10km
12. Observar contador atualizar

**O Que Observar**:
- [ ] Marcador verde de localização aparece?
- [ ] Controle de raio aparece?
- [ ] Contador mostra "Pontos Turísticos: X"?
- [ ] Contador atualiza ao mudar raio?
- [ ] Marcadores de pontos turísticos aparecem/desaparecem?
- [ ] Console sem erros críticos?

**Evidências Necessárias**:
- Screenshot do controle de raio com contador visível
- Console log mostrando busca por raio

---

### ✅ VALIDAÇÃO 2: Popup com Distância

**Pré-requisito**: Modo raio ativo (da validação anterior)

**Passos**:
1. Com modo raio ativo
2. Clicar em um marcador de ponto turístico
3. Observar popup que abre
4. Verificar informações exibidas:
   - Nome do ponto turístico
   - Distância (ex: "1.2 km")
   - Outros campos
5. Clicar fora do popup para fechar
6. Verificar que popup fecha corretamente

**O Que Observar**:
- [ ] Popup abre ao clicar no marcador?
- [ ] Nome do ponto turístico está correto?
- [ ] Distância está visível e formatada?
- [ ] Popup fecha ao clicar fora?
- [ ] Console sem erros?

**Evidências Necessárias**:
- Screenshot do popup aberto com distância visível

---

### ✅ VALIDAÇÃO 3: Layer Control Interativo

**Passos**:
1. Desativar modo raio (clicar no X do controle de raio)
2. Localizar controle de camadas (canto inferior esquerdo)
3. Verificar opção "Pontos Turísticos"
4. Clicar para desativar pontos turísticos
5. Observar marcadores desaparecerem
6. Fazer zoom/pan no mapa
7. Verificar que marcadores continuam ocultos
8. Clicar para reativar pontos turísticos
9. Observar marcadores reaparecerem
10. Verificar ausência de flickering

**O Que Observar**:
- [ ] Opção "Pontos Turísticos" visível no layer control?
- [ ] Desativar remove todos os marcadores?
- [ ] Marcadores permanecem ocultos durante zoom/pan?
- [ ] Reativar traz marcadores de volta?
- [ ] Sem flickering durante transições?
- [ ] Console sem erros?

**Evidências Necessárias**:
- Screenshot do layer control com "Pontos Turísticos" desmarcado
- Screenshot dos marcadores reaparecendo

---

### ✅ VALIDAÇÃO 4: Semântica Completa

**Passos**:
1. **Modo Normal**: Verificar 3 pontos turísticos visíveis
2. **Ativar Raio**: Verificar apenas pontos dentro do raio
3. **Desativar Raio**: Verificar volta ao modo normal (3 pontos)
4. **Layer Off**: Desativar pontos turísticos no layer control
5. **Verificar**: Nenhum ponto visível
6. **Layer On**: Reativar pontos turísticos
7. **Verificar**: Pontos voltam
8. **Zoom/Pan**: Verificar estabilidade visual

**O Que Observar**:
- [ ] Transições entre modos são suaves?
- [ ] Sem estados intermediários incorretos?
- [ ] Marcadores estáveis durante zoom/pan?
- [ ] Comportamento consistente?
- [ ] Console sem erros?

**Evidências Necessárias**:
- Console log mostrando transições entre modos

---

## 📝 TEMPLATE DE RESPOSTA

Após executar todas as validações, responda com:

```
VALIDAÇÃO 1 - MODO RAIO:
- Marcador verde: [SIM/NÃO]
- Controle de raio: [SIM/NÃO]
- Contador visível: [SIM/NÃO]
- Contador atualiza: [SIM/NÃO]
- Problemas: [DESCREVER ou NENHUM]

VALIDAÇÃO 2 - POPUP:
- Popup abre: [SIM/NÃO]
- Nome correto: [SIM/NÃO]
- Distância visível: [SIM/NÃO]
- Distância formatada: [EXEMPLO: "1.2 km"]
- Problemas: [DESCREVER ou NENHUM]

VALIDAÇÃO 3 - LAYER CONTROL:
- Opção visível: [SIM/NÃO]
- Desativar funciona: [SIM/NÃO]
- Reativar funciona: [SIM/NÃO]
- Sem flickering: [SIM/NÃO]
- Problemas: [DESCREVER ou NENHUM]

VALIDAÇÃO 4 - SEMÂNTICA:
- Transições suaves: [SIM/NÃO]
- Comportamento consistente: [SIM/NÃO]
- Estabilidade visual: [SIM/NÃO]
- Problemas: [DESCREVER ou NENHUM]

CONSOLE:
[COLAR LOGS RELEVANTES]
```

---

**Importante**: Execute todas as validações e reporte EXATAMENTE o que observou, não o que esperava ver.
