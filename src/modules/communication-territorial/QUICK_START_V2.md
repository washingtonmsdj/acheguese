# 🚀 Quick Start - Comunicação Territorial V2

## Acesso Rápido

### URL
```
http://localhost:5173/comunicacao/v2
```

### Comparação
- **V1 (atual)**: `/comunicacao`
- **V2 (nova)**: `/comunicacao/v2`

## ✨ O que você vai ver

### 1. **Filtros Territoriais** (Topo fixo)
- 🔍 Busca de canais e conteúdo
- 📍 Seletor de território
- 🏷️ Pills de categoria
- 🧹 Limpar filtros

### 2. **Hero Editorial**
- 📊 Métricas ao vivo (127 canais, 342 publicações)
- 🎯 CTAs principais
- ⭐ Canais em destaque com preview

### 3. **Mídias em Destaque**
- 4 cards grandes com:
  - Cover image
  - Avatar do canal
  - Badge de verificação
  - Status "Ativo agora"
  - Métricas (seguidores, engajamento)
  - Atividade recente

### 4. **Cobertura Ativa Agora** 🔴
- 3 transmissões ao vivo
- Contador de espectadores
- Localização
- Tempo de início

### 5. **Canais Verificados** ✓
- Grid 6 colunas
- Selo de verificação
- Tipo de canal
- Número de seguidores

### 6. **Trending Territorial** 📈
- Posts em alta
- Imagem + conteúdo
- Métricas de engajamento
- Canal de origem

### 7. **Últimas Publicações** 🕐
- Grid 3 colunas
- Categorização
- Timestamp
- Canal de origem

### 8. **Comunidades em Movimento** 👥
- 4 territórios ativos
- Métricas de crescimento
- Número de canais
- Número de posts

### 9. **Eventos & Cultura** 🎭
- Próximos eventos
- Data e horário
- Localização
- Categoria

### 10. **Notícias Locais** 📰
- 4 notícias recentes
- Fonte
- Timestamp
- Resumo

### 11. **Utilidade Pública** ⚠️
- Alertas priorizados
- Tipo de alerta
- Área afetada
- Timestamp

### 12. **Conteúdo Multimídia** 🎬
- Grid de vídeos
- Thumbnail
- Duração
- Visualizações
- Canal

### Sidebar (Direita)

#### **CTA Card**
- Cadastrar canal
- Gradiente azul
- Call to action destacado

#### **Tópicos em Alta**
- Top 5 hashtags
- Número de publicações
- Ranking

#### **Seu Território**
- Localização atual
- Canais ativos na região
- Avatares dos canais

#### **Próximos Eventos**
- 3 eventos
- Data e horário
- Localização

#### **Alertas Ativos**
- Alertas territoriais
- Priorização visual
- Link para ver todos

## 🎨 Destaques Visuais

### Cores por Categoria
- 🔴 Vermelho: Ao vivo / Urgente
- 🔵 Azul: Verificado / Institucional
- 🟢 Verde: Ativo / Crescimento
- 🟠 Laranja: Trending / Popular
- 🟣 Roxo: Comunidade
- 🟡 Amarelo: Alerta / Atenção
- 🩷 Rosa: Eventos / Cultura

### Badges e Indicadores
- ✓ Verificado (azul)
- 🔴 Ao vivo (vermelho pulsante)
- 📈 Crescimento (verde)
- ⚠️ Alerta (amarelo/vermelho)
- 🔥 Trending (laranja)

### Animações
- Hover scale nos cards
- Transições suaves
- Pulse em indicadores ao vivo
- Smooth scroll

## 🔍 Funcionalidades Interativas

### Filtros
1. Digite na busca
2. Selecione território
3. Clique nas pills de categoria
4. Veja resumo de filtros ativos
5. Limpe com um clique

### Navegação
- Clique em qualquer card para ver detalhes
- Clique em canais para ver perfil
- Clique em eventos para ver agenda
- Clique em alertas para ver detalhes

### Sidebar
- Scroll independente
- Sticky no topo
- Widgets contextuais
- CTAs estratégicos

## 📱 Teste Responsivo

### Desktop (>1024px)
- Layout 2 colunas (8+4)
- Sidebar visível
- Grid completo

### Tablet (768-1024px)
- Layout 2 colunas adaptado
- Sidebar colapsável
- Grid reduzido

### Mobile (<768px)
- Layout 1 coluna
- Sidebar no final
- Cards empilhados
- Filtros compactos

## 🎯 Pontos de Atenção

### ✅ Implementado
- Toda estrutura visual
- Todos os componentes
- Roteamento
- Design system
- Responsividade
- Animações

### 🚧 Mock Data
- Dados são simulados
- Imagens do Unsplash
- Avatares do DiceBear
- Métricas fictícias

### 📋 Próximos Passos
- Integrar backend real
- Conectar dados reais
- Implementar autenticação
- Sistema de publicação

## 🐛 Debug

### Se algo não aparecer:
1. Verifique console do navegador
2. Confirme que está em `/comunicacao/v2`
3. Verifique imports dos componentes
4. Confirme que shadcn/ui está instalado

### Componentes necessários:
- `@/shared/components/ui/card`
- `@/shared/components/ui/button`
- `@/shared/components/ui/badge`
- `@/shared/components/ui/avatar`
- `@/shared/components/ui/input`
- `@/shared/components/ui/select`

## 📸 Screenshots Esperados

### Hero
- Fundo escuro com gradiente
- Badges coloridos no topo
- Título grande e impactante
- 2 botões (branco + outline)
- Preview de 4 canais na parte inferior

### Mídias em Destaque
- 2x2 grid de cards grandes
- Cada card com imagem de capa
- Avatar sobreposto
- Badges de status
- Métricas na parte inferior

### Cobertura Ao Vivo
- 3 cards horizontais
- Badge vermelho "Ao Vivo"
- Contador de espectadores
- Thumbnail com overlay

### Sidebar
- Card azul no topo (CTA)
- Cards brancos abaixo
- Ícones coloridos
- Conteúdo organizado

## 🎉 Pronto!

Acesse `/comunicacao/v2` e explore o novo hub de comunicação territorial!

---

**Dúvidas?** Consulte o README.md completo na pasta `v2/`
