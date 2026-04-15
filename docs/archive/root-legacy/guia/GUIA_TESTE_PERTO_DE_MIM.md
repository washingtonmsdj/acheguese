# Guia de Teste - Página "Perto de Mim"

**Data**: 2026-04-04  
**Rota**: `/perto-de-mim`  
**Objetivo**: Validar funcionalidade completa da nova página

---

## Pré-requisitos

1. ✅ Aplicação rodando localmente ou em staging
2. ✅ Navegador com suporte a geolocalização
3. ✅ Dados de teste no banco (empresas, eventos, alertas, pontos turísticos)
4. ✅ Console do navegador aberto (para logs)

---

## Teste 1: Permissão de Localização

### Cenário: Primeira visita sem permissão

**Passos**:
1. Abrir `/perto-de-mim` em aba anônima
2. Observar tela inicial

**Resultado Esperado**:
- ✅ Ícone 📍 grande
- ✅ Título "Localização Necessária"
- ✅ Texto explicativo
- ✅ Botão "Permitir Localização"

**Ação**:
- Clicar em "Permitir Localização"
- Aceitar permissão no navegador

**Resultado Esperado**:
- ✅ Navegador solicita permissão
- ✅ Após aceitar, página recarrega
- ✅ Filtros e resultados aparecem

---

## Teste 2: Carregamento Inicial

### Cenário: Primeira carga com permissão concedida

**Passos**:
1. Abrir `/perto-de-mim` com permissão já concedida
2. Observar estado de loading

**Resultado Esperado**:
- ✅ Ícone 📍 animado (pulse)
- ✅ Texto "Buscando entidades próximas..."
- ✅ Sem erros no console

**Após Loading**:
- ✅ Lista de resultados aparece
- ✅ Ordenada por distância (mais próximo primeiro)
- ✅ Contador de resultados correto

---

## Teste 3: Filtro de Raio

### Cenário: Alterar raio de busca

**Passos**:
1. Observar raio inicial (5 km)
2. Clicar em botão "1 km"
3. Aguardar atualização

**Resultado Esperado**:
- ✅ Botão "1 km" fica destacado (azul)
- ✅ Lista atualiza automaticamente
- ✅ Resultados dentro de 1 km aparecem
- ✅ Contador atualiza

**Repetir para**:
- 2 km
- 10 km
- 20 km

**Observar**:
- ✅ Número de resultados aumenta com raio maior
- ✅ Distâncias máximas respeitam o raio

---

## Teste 4: Filtro de Tipo

### Cenário: Filtrar por tipo de entidade

**Passos**:
1. Observar filtros iniciais (todos marcados)
2. Desmarcar "🏢 Empresas"
3. Observar lista

**Resultado Esperado**:
- ✅ Botão "🏢 Empresas" fica cinza
- ✅ Empresas desaparecem da lista
- ✅ Outros tipos permanecem
- ✅ Contador atualiza

**Repetir**:
- Desmarcar todos os tipos
- Observar mensagem "Nenhum resultado"
- Marcar apenas "📅 Eventos"
- Observar apenas eventos na lista

---

## Teste 5: Ordenação por Distância

### Cenário: Verificar ordenação correta

**Passos**:
1. Observar lista de resultados
2. Verificar distâncias

**Resultado Esperado**:
- ✅ Primeiro item tem menor distância
- ✅ Último item tem maior distância
- ✅ Ordem crescente mantida

**Exemplo**:
```
1. Padaria do Bairro - 150m
2. Mercado Central - 320m
3. Praça da Matriz - 450m
4. Shopping Center - 1.2km
```

---

## Teste 6: Formatação de Distância

### Cenário: Verificar formatação correta

**Resultado Esperado**:

**Distâncias < 1000m**:
- ✅ "150m"
- ✅ "320m"
- ✅ "850m"

**Distâncias >= 1000m**:
- ✅ "1.2km"
- ✅ "5.8km"
- ✅ "15.3km"

---

## Teste 7: Tempo de Caminhada

### Cenário: Verificar cálculo de tempo

**Fórmula**: 5 km/h = 83 m/min

**Resultado Esperado**:

**Distâncias curtas**:
- 50m → "< 1 min"
- 150m → "2 min"
- 500m → "6 min"

**Distâncias médias**:
- 1000m → "12 min"
- 2500m → "30 min"
- 4000m → "48 min"

**Distâncias longas**:
- 5000m → "1h"
- 7500m → "1h 30min"
- 10000m → "2h"

---

## Teste 8: Navegação

### Cenário: Clicar em card para ver detalhes

**Passos**:
1. Clicar em card de empresa
2. Observar navegação

**Resultado Esperado**:
- ✅ Navega para `/empresas/:id`
- ✅ Página de detalhes carrega
- ✅ Informações corretas

**Repetir para**:
- Evento → `/eventos/:id`
- Alerta → `/alertas/:id`
- Ponto Turístico → `/pontos-turisticos/:id`

---

## Teste 9: Estado Vazio

### Cenário: Nenhum resultado encontrado

**Passos**:
1. Selecionar raio pequeno (1 km)
2. Desmarcar todos os tipos exceto um raro
3. Observar mensagem

**Resultado Esperado**:
- ✅ Ícone 🔍
- ✅ Texto "Nenhum resultado encontrado em X km"
- ✅ Sugestão para aumentar raio ou alterar filtros

---

## Teste 10: Estado de Erro

### Cenário: Erro na busca espacial

**Simulação**:
1. Desconectar internet
2. Recarregar página
3. Observar mensagem

**Resultado Esperado**:
- ✅ Ícone ⚠️
- ✅ Texto "Erro ao buscar entidades próximas"
- ✅ Sugestão para tentar novamente

---

## Teste 11: Performance

### Cenário: Múltiplas mudanças de filtro

**Passos**:
1. Alternar raio rapidamente (1km → 5km → 10km → 2km)
2. Alternar tipos rapidamente
3. Observar comportamento

**Resultado Esperado**:
- ✅ Sem travamentos
- ✅ Sem múltiplas requisições simultâneas
- ✅ Loading adequado
- ✅ Resultado final correto

---

## Teste 12: Responsividade

### Cenário: Diferentes tamanhos de tela

**Testar em**:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Resultado Esperado**:
- ✅ Layout adapta corretamente
- ✅ Filtros acessíveis
- ✅ Cards legíveis
- ✅ Botões clicáveis

---

## Teste 13: Acessibilidade

### Cenário: Navegação por teclado

**Passos**:
1. Usar Tab para navegar
2. Usar Enter para selecionar
3. Usar Esc para fechar (se aplicável)

**Resultado Esperado**:
- ✅ Foco visível
- ✅ Ordem lógica
- ✅ Todos os controles acessíveis

---

## Teste 14: Console Logs

### Cenário: Verificar logs de debug

**Observar no console**:
- ✅ `[useNearbyEntities] Solicitando localização...`
- ✅ `[useNearbyEntities] Localização obtida: { lat, lng }`
- ✅ `[useSpatialSearchByRadius] Buscando business em raio de 5km`
- ✅ Sem erros vermelhos
- ✅ Sem warnings amarelos

---

## Teste 15: Integração com Mapa

### Cenário: Verificar que mapa não tem mais modo raio

**Passos**:
1. Abrir `/mapa`
2. Observar controles

**Resultado Esperado**:
- ✅ Sem controle de raio
- ✅ Sem círculo no mapa
- ✅ Sem botão "Aplicar busca"
- ✅ Apenas controles básicos (busca, localização, camadas, território)

---

## Checklist Final

### Funcionalidade
- [ ] Permissão de localização funciona
- [ ] Loading aparece corretamente
- [ ] Filtro de raio funciona
- [ ] Filtro de tipo funciona
- [ ] Ordenação por distância correta
- [ ] Formatação de distância correta
- [ ] Tempo de caminhada correto
- [ ] Navegação funciona
- [ ] Estado vazio funciona
- [ ] Estado de erro funciona

### Performance
- [ ] Sem travamentos
- [ ] Sem múltiplas requisições
- [ ] Loading adequado

### UX
- [ ] Layout responsivo
- [ ] Acessibilidade adequada
- [ ] Mensagens claras
- [ ] Feedback visual

### Integração
- [ ] Mapa simplificado (sem raio)
- [ ] Navegação entre páginas funciona
- [ ] Dados consistentes

---

## Problemas Conhecidos

Nenhum problema conhecido no momento.

---

## Relatório de Teste

**Data do Teste**: ___________  
**Testador**: ___________  
**Ambiente**: ___________  

**Resultado Geral**: [ ] APROVADO [ ] REPROVADO

**Observações**:
```
(Espaço para anotações)
```

---

**Status**: Aguardando homologação runtime
