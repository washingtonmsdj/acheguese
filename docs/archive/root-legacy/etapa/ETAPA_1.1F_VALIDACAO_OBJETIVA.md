# ETAPA 1.1F - VALIDAÇÃO OBJETIVA

**Data**: 04/04/2026  
**Responsável**: QA / Desenvolvedor

---

## 🎯 OBJETIVO

Validar correções de inconsistências técnicas e de comportamento do modo raio.

---

## ✅ CHECKLIST DE VALIDAÇÃO

### 1. Formato de Dados Correto

**Objetivo**: Validar que RPC retorna formato correto e código usa campos corretos

**Pré-requisito**: Ter empresas, eventos e alertas cadastrados com coordenadas

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Abrir DevTools (F12) → Console
3. Permitir localização
4. Arrastar slider para 10 km
5. Aguardar marcadores aparecerem
6. Verificar console

**Resultado Esperado**:
- [ ] Marcadores aparecem no mapa
- [ ] Console NÃO mostra erros de `undefined` ou `null`
- [ ] Console NÃO mostra avisos de `entity_id` ou `entity_data`
- [ ] Marcadores têm nome correto (não "undefined" ou "[object Object]")
- [ ] Marcadores têm coordenadas corretas (aparecem no lugar certo)
- [ ] Marcadores têm tipo correto (emoji de empresa/evento/alerta)

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 2. Loading Não Mostra Marcadores Incorretos

**Objetivo**: Validar que durante loading, mapa não volta para marcadores normais

**Pré-requisito**: Conexão lenta ou muitos dados (para ver loading)

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para 50 km (busca lenta)
4. Observar comportamento IMEDIATAMENTE após arrastar
5. Aguardar loading terminar

**Resultado Esperado**:
- [ ] Durante loading: mapa mostra ZERO marcadores (não volta para viewport)
- [ ] Durante loading: indicador aparece no centro do mapa
- [ ] Durante loading: mensagem diz "Buscando..."
- [ ] Durante loading: mensagem diz "Procurando empresas, eventos e alertas em 50 km"
- [ ] Após loading: marcadores aparecem normalmente
- [ ] Após loading: indicador desaparece

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 3. Erro Não Mostra Marcadores Incorretos

**Objetivo**: Validar que em caso de erro, mapa não volta para marcadores normais

**Pré-requisito**: Simular erro (desconectar internet ou modificar RPC)

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Desconectar internet (ou desabilitar Wi-Fi)
4. Arrastar slider para 10 km
5. Aguardar erro aparecer
6. Verificar comportamento

**Resultado Esperado**:
- [ ] Mapa mostra ZERO marcadores (não volta para viewport)
- [ ] Indicador de erro aparece no centro do mapa
- [ ] Mensagem diz "Erro na busca"
- [ ] Mensagem diz "Não foi possível buscar entidades próximas"
- [ ] Mensagem sugere "Tente novamente ou desative o filtro"
- [ ] Botão "Desativar filtro" funciona (volta para modo normal)

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 4. Intervalo do Slider Correto

**Objetivo**: Validar que slider só permite valores inteiros de 1–50 km

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para MÍNIMO
4. Verificar valor exibido
5. Arrastar slider LENTAMENTE para direita
6. Observar valores intermediários
7. Arrastar slider para MÁXIMO
8. Verificar valor exibido

**Resultado Esperado**:
- [ ] Valor mínimo é 1 km (não 0 km, não 0.5 km)
- [ ] Valores intermediários são INTEIROS (2, 3, 4, 5, ...)
- [ ] Valores intermediários NÃO são fracionários (não 1.5, 2.5, 3.5, ...)
- [ ] Valor máximo é 50 km (não 51 km, não 100 km)
- [ ] Indicador mostra valores inteiros (ex: "5 km", não "5.5 km")
- [ ] Slider se move suavemente (sem pulos)

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 5. Zero Resultados Mostra Mensagem Correta

**Objetivo**: Validar mensagem quando não há resultados no raio

**Pré-requisito**: Estar em local sem empresas/eventos/alertas próximos

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para 1 km (muito pequeno)
4. Aguardar busca terminar
5. Verificar mensagem

**Resultado Esperado**:
- [ ] Mapa mostra ZERO marcadores
- [ ] Indicador aparece no centro do mapa
- [ ] Mensagem diz "Nada encontrado"
- [ ] Mensagem diz "Não há empresas, eventos ou alertas em um raio de 1 km"
- [ ] Mensagem sugere "Tente aumentar o raio de busca ou desativar o filtro"
- [ ] Badge "Ativo" ainda aparece (filtro está ativo)
- [ ] Botão "Desativar filtro" funciona

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 6. Serviços Não Aparecem no Mapa

**Objetivo**: Validar que serviços não aparecem (nem em modo normal, nem em modo raio)

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Aguardar mapa carregar (modo normal)
3. Verificar tipos de marcadores visíveis
4. Permitir localização
5. Arrastar slider para 20 km (modo raio)
6. Verificar tipos de marcadores visíveis
7. Abrir layer control (canto inferior esquerdo)
8. Verificar opção "Serviços"
9. Clicar em "Serviços" (se disponível)
10. Verificar comportamento

**Resultado Esperado**:
- [ ] Modo normal: apenas empresas (🏢), eventos (📅), alertas (⚠️)
- [ ] Modo normal: SEM marcadores de serviços
- [ ] Modo raio: apenas empresas (🏢), eventos (📅), alertas (⚠️)
- [ ] Modo raio: SEM marcadores de serviços
- [ ] Layer control: opção "Serviços" pode existir mas não faz nada
- [ ] Console: sem erros relacionados a serviços

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 7. Modo Raio Ignora Filtros de Camada

**Objetivo**: Validar que filtros de camada não afetam modo raio

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Abrir layer control (canto inferior esquerdo)
3. Desmarcar "Eventos" e "Alertas" (deixar apenas "Empresas")
4. Verificar que apenas empresas aparecem
5. Permitir localização
6. Arrastar slider para 10 km (ativar modo raio)
7. Verificar tipos de marcadores visíveis

**Resultado Esperado**:
- [ ] Modo normal: apenas empresas (filtros respeitados)
- [ ] Modo raio: empresas, eventos E alertas (filtros ignorados)
- [ ] Aviso diz: "Mostrando empresas, eventos e alertas em 10 km"
- [ ] Badge "Ativo" aparece
- [ ] Desativar filtro volta para modo normal (apenas empresas)

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 8. Indicadores Visuais Corretos

**Objetivo**: Validar que todos os indicadores visuais aparecem corretamente

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para 5 km
4. Verificar indicadores no controle de raio
5. Verificar aviso sobre tipos filtrados
6. Verificar botão de desativar

**Resultado Esperado**:
- [ ] Badge "Ativo" aparece com ponto pulsante azul
- [ ] Aviso aparece: "📍 Mostrando empresas, eventos e alertas em 5 km"
- [ ] Aviso tem fundo azul claro (bg-blue-50)
- [ ] Botão "Desativar filtro" aparece
- [ ] Botão tem fundo cinza (bg-gray-100)
- [ ] Clicar no botão desativa filtro (badge e aviso desaparecem)

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 9. Múltiplos Tipos Aparecem Simultaneamente

**Objetivo**: Validar que empresas, eventos e alertas aparecem juntos no modo raio

**Pré-requisito**: Ter empresas, eventos e alertas cadastrados próximos

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para 20 km
4. Aguardar marcadores aparecerem
5. Contar marcadores por tipo (emoji)

**Resultado Esperado**:
- [ ] Marcadores de empresas aparecem (emoji 🏢)
- [ ] Marcadores de eventos aparecem (emoji 📅)
- [ ] Marcadores de alertas aparecem (emoji ⚠️)
- [ ] Todos os tipos aparecem SIMULTANEAMENTE
- [ ] Aviso diz: "Mostrando empresas, eventos e alertas em 20 km"
- [ ] Clicar em cada tipo abre popup correto

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

### 10. Desativar Filtro Volta para Modo Normal

**Objetivo**: Validar que desativar filtro restaura comportamento normal

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para 5 km
4. Verificar que apenas entidades em 5 km aparecem
5. Clicar em "Desativar filtro"
6. Verificar comportamento

**Resultado Esperado**:
- [ ] Badge "Ativo" desaparece
- [ ] Aviso de tipos desaparece
- [ ] Botão "Desativar filtro" desaparece
- [ ] Marcadores mudam (voltam para viewport)
- [ ] Mover mapa atualiza marcadores (viewport fetch ativo)
- [ ] Filtros de camada voltam a funcionar

**Critério de Sucesso**: Todos os itens marcados

**Status**: [ ] Passou [ ] Falhou

**Observações**:
```
[Espaço para notas do testador]
```

---

## 📊 RESUMO DE VALIDAÇÃO

| Teste | Status | Observações |
|-------|--------|-------------|
| 1. Formato de dados correto | [ ] | |
| 2. Loading não mostra marcadores incorretos | [ ] | |
| 3. Erro não mostra marcadores incorretos | [ ] | |
| 4. Intervalo do slider correto | [ ] | |
| 5. Zero resultados mostra mensagem correta | [ ] | |
| 6. Serviços não aparecem | [ ] | |
| 7. Modo raio ignora filtros de camada | [ ] | |
| 8. Indicadores visuais corretos | [ ] | |
| 9. Múltiplos tipos aparecem simultaneamente | [ ] | |
| 10. Desativar filtro volta para modo normal | [ ] | |

**Total**: ___/10 testes passaram

---

## 🐛 BUGS ENCONTRADOS

### Bug 1
**Descrição**:
```
[Descrever bug encontrado]
```

**Passos para Reproduzir**:
```
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]
```

**Resultado Esperado**:
```
[O que deveria acontecer]
```

**Resultado Atual**:
```
[O que aconteceu]
```

**Severidade**: [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo

---

### Bug 2
**Descrição**:
```
[Descrever bug encontrado]
```

**Passos para Reproduzir**:
```
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]
```

**Resultado Esperado**:
```
[O que deveria acontecer]
```

**Resultado Atual**:
```
[O que aconteceu]
```

**Severidade**: [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo

---

## ✅ CRITÉRIO DE ACEITE

**ETAPA 1.1F é considerada CONCLUÍDA quando**:

- [ ] Todos os 10 testes passaram (10/10)
- [ ] Nenhum bug crítico ou alto foi encontrado
- [ ] Bugs médios/baixos foram documentados (se houver)
- [ ] Código está alinhado com documentação
- [ ] Comportamento está consistente em todos os cenários

**Assinatura do Testador**: ___________________________

**Data**: ___/___/______

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026
