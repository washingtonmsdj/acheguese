# 🧪 Roteiro de Testes - Comunicação Territorial V2

## 🎯 Objetivo dos Testes

Validar a implementação visual, UX e arquitetura da nova versão V2 do módulo de comunicação territorial.

## 📋 Pré-requisitos

- [ ] Servidor de desenvolvimento rodando
- [ ] Navegador moderno (Chrome, Firefox, Safari, Edge)
- [ ] DevTools aberto (F12)
- [ ] Console limpo sem erros

## 🚀 Iniciando os Testes

### 1. Iniciar o Servidor

```bash
npm run dev
# ou
yarn dev
```

### 2. Acessar a V2

```
http://localhost:5173/comunicacao/v2
```

## ✅ Checklist de Testes Visuais

### Hero Section
- [ ] Gradiente escuro aparece corretamente
- [ ] 3 badges no topo (Comunicação Territorial, 127 canais, 342 publicações)
- [ ] Título grande e legível
- [ ] Descrição clara
- [ ] 2 botões (branco e outline)
- [ ] Preview de 4 canais na parte inferior
- [ ] Ícones de verificação nos canais verificados

### Filtros (Topo Sticky)
- [ ] Barra de busca funcional
- [ ] Seletor de território com ícone de mapa
- [ ] Botão de filtro
- [ ] Pills de categoria (8 categorias)
- [ ] Pills mudam de cor ao clicar
- [ ] Contador de filtros ativos aparece
- [ ] Botão "Limpar filtros" funciona

### Mídias em Destaque
- [ ] 4 cards grandes em grid 2x2
- [ ] Cada card tem imagem de capa
- [ ] Avatar sobreposto na imagem
- [ ] Badge "Ativo agora" (vermelho) quando aplicável
- [ ] Badge de verificação (azul) quando aplicável
- [ ] Nome do canal visível
- [ ] Tipo de canal em badge
- [ ] Descrição truncada em 2 linhas
- [ ] Métricas (seguidores, engajamento)
- [ ] Atividade recente
- [ ] Hover aumenta o card (scale)

### Cobertura Ativa Agora
- [ ] Título com ponto vermelho pulsante
- [ ] 3 cards horizontais
- [ ] Badge "Ao Vivo" vermelho
- [ ] Ícone de rádio pulsante
- [ ] Contador de espectadores
- [ ] Thumbnail com overlay
- [ ] Título da cobertura
- [ ] Avatar e nome do canal
- [ ] Localização e tempo

### Canais Verificados
- [ ] Título com ícone de escudo
- [ ] Grid de 6 colunas
- [ ] Avatares circulares
- [ ] Selo de verificação sobreposto
- [ ] Nome do canal
- [ ] Badge de tipo
- [ ] Número de seguidores
- [ ] Hover aumenta o card

### Trending Territorial
- [ ] Título com ícone de trending
- [ ] 3 posts em layout horizontal
- [ ] Imagem à esquerda
- [ ] Conteúdo à direita
- [ ] Avatar e nome do canal
- [ ] Timestamp
- [ ] Título do post
- [ ] Resumo truncado
- [ ] Métricas (likes, comments, shares)
- [ ] Hover muda cor do título

### Últimas Publicações
- [ ] Título com ícone de relógio
- [ ] Grid 3 colunas
- [ ] Avatar do canal
- [ ] Nome e timestamp
- [ ] Título da publicação
- [ ] Badge de categoria
- [ ] Hover aumenta o card

### Comunidades em Movimento
- [ ] Título com ícone de usuários
- [ ] 4 cards com imagens
- [ ] Badge de crescimento (verde)
- [ ] Nome da comunidade
- [ ] Número de canais
- [ ] Número de posts
- [ ] Hover aumenta o card

### Eventos & Cultura
- [ ] Título com ícone de calendário
- [ ] 3 cards com thumbnails
- [ ] Badge de categoria
- [ ] Título do evento
- [ ] Data e horário
- [ ] Localização
- [ ] Hover aumenta o card

### Notícias Locais
- [ ] Título com ícone de jornal
- [ ] 4 notícias em grid 2x2
- [ ] Fonte e timestamp
- [ ] Título da notícia
- [ ] Resumo
- [ ] Hover muda cor do título

### Utilidade Pública
- [ ] Título com ícone de alerta
- [ ] 4 alertas em lista
- [ ] Ícone circular colorido (vermelho/amarelo/azul)
- [ ] Badge de tipo
- [ ] Timestamp
- [ ] Título do alerta
- [ ] Área afetada
- [ ] Hover aumenta o card

### Conteúdo Multimídia
- [ ] Título com ícone de play
- [ ] Grid 4 colunas
- [ ] Thumbnails de vídeos
- [ ] Play button overlay
- [ ] Badge de duração
- [ ] Título do vídeo
- [ ] Nome do canal
- [ ] Visualizações
- [ ] Hover aumenta o card e play button

### Sidebar

#### CTA Card
- [ ] Gradiente azul
- [ ] Ícone de rádio
- [ ] Título e descrição
- [ ] Botão branco
- [ ] Hover no botão

#### Tópicos em Alta
- [ ] Título com ícone de trending
- [ ] 5 tópicos
- [ ] Hashtags
- [ ] Número de publicações
- [ ] Badge de ranking
- [ ] Hover muda fundo

#### Seu Território
- [ ] Título com ícone de mapa
- [ ] Localização atual
- [ ] Botão "Alterar"
- [ ] Fundo cinza claro
- [ ] 4 avatares sobrepostos
- [ ] "+8 canais"

#### Próximos Eventos
- [ ] Título com ícone de calendário
- [ ] 3 eventos
- [ ] Quadrado de data (rosa)
- [ ] Título do evento
- [ ] Horário
- [ ] Hover muda fundo

#### Alertas Ativos
- [ ] Fundo amarelo claro
- [ ] Título com ícone de sino
- [ ] Card de alerta
- [ ] Ponto amarelo
- [ ] Descrição
- [ ] Botão "Ver todos"

## 🎨 Testes de Interatividade

### Hover Effects
- [ ] Cards aumentam ao passar o mouse
- [ ] Títulos mudam de cor
- [ ] Botões mudam de cor
- [ ] Transições suaves (300ms)

### Cliques
- [ ] Todos os links são clicáveis
- [ ] Navegação funciona (mesmo que para páginas não implementadas)
- [ ] Filtros respondem ao clique
- [ ] Botões executam ações

### Scroll
- [ ] Filtros ficam fixos no topo
- [ ] Sidebar fica fixa ao rolar
- [ ] Scroll suave
- [ ] Sem quebras de layout

## 📱 Testes Responsivos

### Desktop (>1024px)
- [ ] Layout 2 colunas (8+4)
- [ ] Sidebar visível à direita
- [ ] Todos os grids completos
- [ ] Espaçamento adequado

### Tablet (768-1024px)
- [ ] Layout adaptado
- [ ] Grids reduzidos
- [ ] Sidebar ainda visível
- [ ] Filtros compactos

### Mobile (<768px)
- [ ] Layout 1 coluna
- [ ] Cards empilhados
- [ ] Sidebar no final
- [ ] Filtros responsivos
- [ ] Botões touch-friendly
- [ ] Texto legível

## 🐛 Testes de Console

### Verificar Console
- [ ] Sem erros vermelhos
- [ ] Sem warnings críticos
- [ ] Imports carregando corretamente
- [ ] Componentes renderizando

### Network
- [ ] Imagens carregando
- [ ] Lazy loading funcionando
- [ ] Sem 404s

## 🎯 Testes de Navegação

### Links Internos
- [ ] `/comunicacao/v2` carrega
- [ ] Links para canais funcionam
- [ ] Links para posts funcionam
- [ ] Links para eventos funcionam
- [ ] Voltar para V1 funciona

### Breadcrumbs
- [ ] Navegação clara
- [ ] Histórico funciona
- [ ] Botão voltar do navegador funciona

## 🔍 Testes de Acessibilidade

### Básico
- [ ] Contraste adequado
- [ ] Texto legível
- [ ] Ícones com significado claro
- [ ] Botões identificáveis

### Navegação por Teclado
- [ ] Tab navega pelos elementos
- [ ] Enter ativa links/botões
- [ ] Escape fecha modais (se houver)
- [ ] Foco visível

## 📊 Testes de Performance

### Carregamento
- [ ] Página carrega em <3s
- [ ] Imagens otimizadas
- [ ] Lazy loading ativo
- [ ] Sem travamentos

### Interação
- [ ] Hover responde instantaneamente
- [ ] Cliques respondem rápido
- [ ] Scroll suave
- [ ] Sem lag

## ✨ Testes de Qualidade Visual

### Alinhamento
- [ ] Elementos alinhados
- [ ] Espaçamento consistente
- [ ] Grid alinhado
- [ ] Texto alinhado

### Tipografia
- [ ] Hierarquia clara
- [ ] Tamanhos adequados
- [ ] Peso correto
- [ ] Legibilidade

### Cores
- [ ] Paleta consistente
- [ ] Contraste adequado
- [ ] Badges coloridos
- [ ] Status visíveis

### Imagens
- [ ] Proporções corretas
- [ ] Qualidade adequada
- [ ] Sem distorções
- [ ] Carregamento suave

## 🎉 Checklist Final

### Funcionalidade
- [ ] Todos os componentes renderizam
- [ ] Todos os links funcionam
- [ ] Filtros funcionam
- [ ] Sidebar funciona
- [ ] Navegação funciona

### Visual
- [ ] Design moderno
- [ ] Aparência AAA
- [ ] Sensação de cidade viva
- [ ] Não parece CRUD
- [ ] Não parece rede social genérica

### UX
- [ ] Intuitivo
- [ ] Fácil de navegar
- [ ] Descoberta clara
- [ ] Hierarquia visual
- [ ] Feedback visual

### Técnico
- [ ] Sem erros no console
- [ ] Performance adequada
- [ ] Responsivo
- [ ] Acessível
- [ ] Código limpo

## 📝 Relatório de Bugs

Se encontrar problemas, documente:

```markdown
### Bug #X

**Localização**: [Seção/Componente]
**Descrição**: [O que aconteceu]
**Esperado**: [O que deveria acontecer]
**Passos para reproduzir**:
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Screenshot**: [Se possível]
**Console**: [Erros do console]
**Navegador**: [Chrome/Firefox/etc]
**Resolução**: [1920x1080/etc]
```

## 🎯 Critérios de Sucesso

A V2 está pronta para próxima fase se:

- ✅ Todos os componentes renderizam corretamente
- ✅ Design é moderno e profissional
- ✅ Navegação é intuitiva
- ✅ Responsividade funciona
- ✅ Performance é adequada
- ✅ Sem erros críticos
- ✅ UX é positiva
- ✅ Sensação de "cidade viva" é alcançada

## 📞 Próximos Passos Após Testes

1. **Documentar feedback**
2. **Corrigir bugs encontrados**
3. **Ajustar design se necessário**
4. **Validar com stakeholders**
5. **Planejar integração backend**
6. **Definir roadmap de features**

---

**Boa sorte nos testes! 🚀**
