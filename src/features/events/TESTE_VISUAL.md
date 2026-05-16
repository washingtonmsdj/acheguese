# 🎨 Guia de Teste Visual - Events V2

## 🚀 Como Testar Agora

### 1️⃣ Iniciar o Servidor

```bash
npm run dev
```

Aguarde a mensagem:
```
➜  Local:   http://localhost:5173/
```

---

## 📍 URLs para Testar

### Página de Listagem
```
http://localhost:5173/eventos
```

**O que você verá:**
- 🎨 Hero premium com background image de eventos
- 🔍 Barra de busca grande e destacada
- 📊 3 cards de estatísticas (Total, Próximos, Participantes)
- 🏷️ 9 categorias com ícones e cores (Todos, Cultural, Esportivo, etc.)
- 📋 Grid com 2 eventos mock
- 🔘 FAB (botão flutuante) no canto inferior direito

### Página de Detalhes (Evento 1)
```
http://localhost:5173/eventos/evt-001
```

**O que você verá:**
- 🎭 Roda de Samba no Complexo
- 🎫 2 tipos de ingressos (Gratuito + Pago R$ 20)
- 📅 Programação com 3 horários
- 📍 Localização com botão Google Maps
- 👤 Informações do organizador

### Página de Detalhes (Evento 2)
```
http://localhost:5173/eventos/evt-002
```

**O que você verá:**
- 💻 Workshop de Empreendedorismo Digital
- 🆓 Evento 100% gratuito
- 🔄 Híbrido (Presencial + Online)
- 📅 Programação com 4 horários
- 👤 Informações do organizador

### Demo (Sempre mostra Evento 1)
```
http://localhost:5173/eventos/demo
```

---

## 📱 Teste de Responsividade

### Desktop (1920px)
1. Abra em tela cheia
2. Observe:
   - Hero ocupa toda a largura
   - Grid com 3 colunas (se tiver 3+ eventos)
   - Todos os elementos bem espaçados
   - Animações suaves ao scroll

### Tablet (768px)
1. Redimensione o navegador para ~768px de largura
2. Observe:
   - Grid muda para 2 colunas
   - Hero se adapta
   - Botões ficam maiores (touch-friendly)
   - Stats cards menores

### Mobile (375px)
1. Abra DevTools (F12)
2. Ative modo responsivo
3. Selecione "iPhone SE" ou "iPhone 12"
4. Observe:
   - Grid muda para 1 coluna
   - Hero compacto mas impactante
   - Busca ocupa toda a largura
   - Categorias em scroll horizontal
   - FAB menor mas visível
   - Scroll indicator oculto

---

## 🎯 Funcionalidades para Testar

### Na Página de Listagem

#### 1. Busca
- [ ] Digite "samba" na busca
- [ ] Clique em "Buscar" ou pressione Enter
- [ ] Deve filtrar e mostrar apenas "Roda de Samba"
- [ ] Clique no X para limpar

#### 2. Filtros por Categoria
- [ ] Clique em "Cultural"
- [ ] Deve mostrar apenas eventos culturais
- [ ] Badge com "1" deve aparecer no botão Filtros
- [ ] Clique em "Todos" para resetar

#### 3. Toggle Grid/List
- [ ] Clique no ícone de lista (≡)
- [ ] Cards devem mudar para layout horizontal
- [ ] Clique no ícone de grade (⊞)
- [ ] Cards voltam para layout vertical

#### 4. Navegação
- [ ] Clique em qualquer card de evento
- [ ] Deve navegar para página de detalhes
- [ ] URL deve mudar para `/eventos/evt-XXX`

#### 5. FAB (Botão Flutuante)
- [ ] Clique no botão + no canto inferior direito
- [ ] Deve navegar para `/eventos/criar` (página ainda não existe)

### Na Página de Detalhes

#### 1. Hero Section
- [ ] Banner deve ocupar toda a largura
- [ ] Informações principais visíveis
- [ ] Botões de favoritar e compartilhar (mock)

#### 2. Ingressos
- [ ] Cards de ingressos bem destacados
- [ ] Progress bar mostrando disponibilidade
- [ ] Botão "Selecionar" em cada ingresso
- [ ] Se gratuito, mostra "Gratuito"
- [ ] Se pago, mostra valor formatado

#### 3. Descrição
- [ ] Texto formatado e legível
- [ ] Features do evento em lista
- [ ] Requisitos (se houver)

#### 4. Programação
- [ ] Timeline visual
- [ ] Horários e atividades
- [ ] Ícones para cada tipo de atividade

#### 5. Localização
- [ ] Endereço completo
- [ ] Instruções de acesso (se houver)
- [ ] Botão "Ver no Google Maps"
- [ ] Clique deve abrir Google Maps em nova aba

#### 6. Organizador
- [ ] Avatar do organizador
- [ ] Nome e bio
- [ ] Estatísticas (eventos, participantes, rating)

#### 7. CTA Sticky
- [ ] Barra fixa no rodapé
- [ ] Sempre visível ao rolar
- [ ] Botão principal destacado
- [ ] Mostra preço ou "Gratuito"

---

## 🌓 Teste de Dark Mode

### Ativar Dark Mode
1. Procure o toggle de tema na interface
2. Ou use as configurações do sistema
3. Observe:
   - Cores se adaptam automaticamente
   - Contraste mantido
   - Gradientes ajustados
   - Legibilidade preservada

### Elementos para Verificar
- [ ] Hero com overlay escuro
- [ ] Cards com fundo escuro
- [ ] Texto legível em ambos os temas
- [ ] Bordas visíveis
- [ ] Botões com contraste adequado

---

## ✨ Animações para Observar

### Scroll Animations
- [ ] Hero aparece com fade-in
- [ ] Stats cards animam ao entrar na tela
- [ ] Seções aparecem suavemente ao rolar
- [ ] Scroll indicator pulsa (desktop)

### Hover Effects
- [ ] Cards elevam ao passar o mouse
- [ ] Botões mudam de cor suavemente
- [ ] Categorias destacam ao hover
- [ ] Links sublinhados ao hover

### Click Animations
- [ ] Botões têm feedback visual
- [ ] Categorias têm scale ao clicar
- [ ] FAB pulsa ao aparecer
- [ ] Transições suaves entre páginas

---

## 🐛 Possíveis Problemas e Soluções

### Página em Branco
**Problema**: Página não carrega  
**Solução**: 
1. Verifique o console (F12)
2. Procure por erros em vermelho
3. Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### Estilos Não Aparecem
**Problema**: Página sem cores/layout  
**Solução**:
1. Verifique se Tailwind está configurado
2. Limpe o cache: `npm run build` e reinicie
3. Verifique se `tailwind.config.js` inclui `src/features/**`

### Imagens Não Carregam
**Problema**: Imagens quebradas  
**Solução**:
1. Verifique conexão com internet (usa Unsplash)
2. Abra DevTools → Network → veja se há erros
3. Imagens são externas, podem demorar

### Rotas Não Funcionam
**Problema**: 404 ao navegar  
**Solução**:
1. Verifique se está usando `npm run dev` (não `npm start`)
2. Verifique se as rotas estão em `AppRoutes.tsx`
3. Limpe o cache do navegador

---

## 📊 Checklist de Validação Visual

### Design Geral
- [ ] Layout profissional e moderno
- [ ] Cores harmoniosas
- [ ] Tipografia legível
- [ ] Espaçamento adequado
- [ ] Hierarquia visual clara

### Hero Section
- [ ] Impactante e atrativo
- [ ] Informações principais visíveis
- [ ] CTA claro
- [ ] Background image carrega
- [ ] Overlay não esconde conteúdo

### Cards de Evento
- [ ] Imagem de destaque visível
- [ ] Informações organizadas
- [ ] Categoria destacada
- [ ] Data e hora legíveis
- [ ] Hover effect funciona

### Ingressos
- [ ] Cards bem destacados
- [ ] Preços claros
- [ ] Disponibilidade visível
- [ ] CTAs evidentes
- [ ] Progress bar funciona

### Responsividade
- [ ] Desktop (1920px) ✓
- [ ] Laptop (1366px) ✓
- [ ] Tablet (768px) ✓
- [ ] Mobile (375px) ✓
- [ ] Mobile pequeno (320px) ✓

### Performance
- [ ] Carrega rápido (<3s)
- [ ] Animações suaves (60fps)
- [ ] Scroll fluido
- [ ] Sem travamentos
- [ ] Imagens otimizadas

### Acessibilidade
- [ ] Contraste adequado
- [ ] Textos legíveis
- [ ] Botões grandes o suficiente
- [ ] Navegação por teclado funciona
- [ ] Alt text em imagens

---

## 💡 Dicas de Teste

### Use Diferentes Navegadores
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (se disponível)

### Teste em Dispositivos Reais
- [ ] Smartphone Android
- [ ] iPhone
- [ ] Tablet

### Teste Diferentes Cenários
- [ ] Conexão lenta (throttling)
- [ ] Sem JavaScript (improvável)
- [ ] Zoom 150%
- [ ] Modo de alto contraste

---

## 📝 Feedback

Ao testar, anote:

### O que funcionou bem ✅
- Design
- Performance
- Usabilidade
- Animações

### O que pode melhorar 🔄
- Layout
- Cores
- Textos
- Funcionalidades

### Bugs encontrados 🐛
- Descrição
- Como reproduzir
- Navegador/dispositivo
- Screenshot (se possível)

---

## 🎉 Próximos Passos

Após validar visualmente:

1. **Coletar Feedback**
   - Mostrar para stakeholders
   - Anotar sugestões
   - Priorizar melhorias

2. **Ajustes Finos**
   - Cores
   - Espaçamentos
   - Textos
   - Animações

3. **Integração Backend**
   - Conectar com API
   - Dados reais
   - Autenticação
   - Pagamentos

4. **Deploy**
   - Feature flag
   - Rollout gradual
   - Monitoramento
   - Analytics

---

**Boa sorte com os testes! 🚀**

Se encontrar problemas, consulte:
- `README.md` - Documentação completa
- `STATUS.md` - Status de implementação
- `QUICK_START.md` - Guia rápido
