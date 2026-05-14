# ðŸŽ¨ Guia de Teste Visual - Events V2

## ðŸš€ Como Testar Agora

### 1ï¸âƒ£ Iniciar o Servidor

```bash
npm run dev
```

Aguarde a mensagem:
```
âžœ  Local:   http://localhost:5173/
```

---

## ðŸ“ URLs para Testar

### PÃ¡gina de Listagem
```
http://localhost:5173/eventos
```

**O que vocÃª verÃ¡:**
- ðŸŽ¨ Hero premium com background image de eventos
- ðŸ” Barra de busca grande e destacada
- ðŸ“Š 3 cards de estatÃ­sticas (Total, PrÃ³ximos, Participantes)
- ðŸ·ï¸ 9 categorias com Ã­cones e cores (Todos, Cultural, Esportivo, etc.)
- ðŸ“‹ Grid com 2 eventos mock
- ðŸ”˜ FAB (botÃ£o flutuante) no canto inferior direito

### PÃ¡gina de Detalhes (Evento 1)
```
http://localhost:5173/eventos/evt-001
```

**O que vocÃª verÃ¡:**
- ðŸŽ­ Roda de Samba no Complexo
- ðŸŽ« 2 tipos de ingressos (Gratuito + Pago R$ 20)
- ðŸ“… ProgramaÃ§Ã£o com 3 horÃ¡rios
- ðŸ“ LocalizaÃ§Ã£o com botÃ£o Google Maps
- ðŸ‘¤ InformaÃ§Ãµes do organizador

### PÃ¡gina de Detalhes (Evento 2)
```
http://localhost:5173/eventos/evt-002
```

**O que vocÃª verÃ¡:**
- ðŸ’» Workshop de Empreendedorismo Digital
- ðŸ†“ Evento 100% gratuito
- ðŸ”„ HÃ­brido (Presencial + Online)
- ðŸ“… ProgramaÃ§Ã£o com 4 horÃ¡rios
- ðŸ‘¤ InformaÃ§Ãµes do organizador

### Demo (Sempre mostra Evento 1)
```
http://localhost:5173/eventos/demo
```

---

## ðŸ“± Teste de Responsividade

### Desktop (1920px)
1. Abra em tela cheia
2. Observe:
   - Hero ocupa toda a largura
   - Grid com 3 colunas (se tiver 3+ eventos)
   - Todos os elementos bem espaÃ§ados
   - AnimaÃ§Ãµes suaves ao scroll

### Tablet (768px)
1. Redimensione o navegador para ~768px de largura
2. Observe:
   - Grid muda para 2 colunas
   - Hero se adapta
   - BotÃµes ficam maiores (touch-friendly)
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
   - FAB menor mas visÃ­vel
   - Scroll indicator oculto

---

## ðŸŽ¯ Funcionalidades para Testar

### Na PÃ¡gina de Listagem

#### 1. Busca
- [ ] Digite "samba" na busca
- [ ] Clique em "Buscar" ou pressione Enter
- [ ] Deve filtrar e mostrar apenas "Roda de Samba"
- [ ] Clique no X para limpar

#### 2. Filtros por Categoria
- [ ] Clique em "Cultural"
- [ ] Deve mostrar apenas eventos culturais
- [ ] Badge com "1" deve aparecer no botÃ£o Filtros
- [ ] Clique em "Todos" para resetar

#### 3. Toggle Grid/List
- [ ] Clique no Ã­cone de lista (â‰¡)
- [ ] Cards devem mudar para layout horizontal
- [ ] Clique no Ã­cone de grade (âŠž)
- [ ] Cards voltam para layout vertical

#### 4. NavegaÃ§Ã£o
- [ ] Clique em qualquer card de evento
- [ ] Deve navegar para pÃ¡gina de detalhes
- [ ] URL deve mudar para `/eventos/evt-XXX`

#### 5. FAB (BotÃ£o Flutuante)
- [ ] Clique no botÃ£o + no canto inferior direito
- [ ] Deve navegar para `/eventos/criar` (pÃ¡gina ainda nÃ£o existe)

### Na PÃ¡gina de Detalhes

#### 1. Hero Section
- [ ] Banner deve ocupar toda a largura
- [ ] InformaÃ§Ãµes principais visÃ­veis
- [ ] BotÃµes de favoritar e compartilhar (mock)

#### 2. Ingressos
- [ ] Cards de ingressos bem destacados
- [ ] Progress bar mostrando disponibilidade
- [ ] BotÃ£o "Selecionar" em cada ingresso
- [ ] Se gratuito, mostra "Gratuito"
- [ ] Se pago, mostra valor formatado

#### 3. DescriÃ§Ã£o
- [ ] Texto formatado e legÃ­vel
- [ ] Features do evento em lista
- [ ] Requisitos (se houver)

#### 4. ProgramaÃ§Ã£o
- [ ] Timeline visual
- [ ] HorÃ¡rios e atividades
- [ ] Ãcones para cada tipo de atividade

#### 5. LocalizaÃ§Ã£o
- [ ] EndereÃ§o completo
- [ ] InstruÃ§Ãµes de acesso (se houver)
- [ ] BotÃ£o "Ver no Google Maps"
- [ ] Clique deve abrir Google Maps em nova aba

#### 6. Organizador
- [ ] Avatar do organizador
- [ ] Nome e bio
- [ ] EstatÃ­sticas (eventos, participantes, rating)

#### 7. CTA Sticky
- [ ] Barra fixa no rodapÃ©
- [ ] Sempre visÃ­vel ao rolar
- [ ] BotÃ£o principal destacado
- [ ] Mostra preÃ§o ou "Gratuito"

---

## ðŸŒ“ Teste de Dark Mode

### Ativar Dark Mode
1. Procure o toggle de tema na interface
2. Ou use as configuraÃ§Ãµes do sistema
3. Observe:
   - Cores se adaptam automaticamente
   - Contraste mantido
   - Gradientes ajustados
   - Legibilidade preservada

### Elementos para Verificar
- [ ] Hero com overlay escuro
- [ ] Cards com fundo escuro
- [ ] Texto legÃ­vel em ambos os temas
- [ ] Bordas visÃ­veis
- [ ] BotÃµes com contraste adequado

---

## âœ¨ AnimaÃ§Ãµes para Observar

### Scroll Animations
- [ ] Hero aparece com fade-in
- [ ] Stats cards animam ao entrar na tela
- [ ] SeÃ§Ãµes aparecem suavemente ao rolar
- [ ] Scroll indicator pulsa (desktop)

### Hover Effects
- [ ] Cards elevam ao passar o mouse
- [ ] BotÃµes mudam de cor suavemente
- [ ] Categorias destacam ao hover
- [ ] Links sublinhados ao hover

### Click Animations
- [ ] BotÃµes tÃªm feedback visual
- [ ] Categorias tÃªm scale ao clicar
- [ ] FAB pulsa ao aparecer
- [ ] TransiÃ§Ãµes suaves entre pÃ¡ginas

---

## ðŸ› PossÃ­veis Problemas e SoluÃ§Ãµes

### PÃ¡gina em Branco
**Problema**: PÃ¡gina nÃ£o carrega  
**SoluÃ§Ã£o**: 
1. Verifique o console (F12)
2. Procure por erros em vermelho
3. Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### Estilos NÃ£o Aparecem
**Problema**: PÃ¡gina sem cores/layout  
**SoluÃ§Ã£o**:
1. Verifique se Tailwind estÃ¡ configurado
2. Limpe o cache: `npm run build` e reinicie
3. Verifique se `tailwind.config.js` inclui `src/features/**`

### Imagens NÃ£o Carregam
**Problema**: Imagens quebradas  
**SoluÃ§Ã£o**:
1. Verifique conexÃ£o com internet (usa Unsplash)
2. Abra DevTools â†’ Network â†’ veja se hÃ¡ erros
3. Imagens sÃ£o externas, podem demorar

### Rotas NÃ£o Funcionam
**Problema**: 404 ao navegar  
**SoluÃ§Ã£o**:
1. Verifique se estÃ¡ usando `npm run dev` (nÃ£o `npm start`)
2. Verifique se as rotas estÃ£o em `AppRoutes.tsx`
3. Limpe o cache do navegador

---

## ðŸ“Š Checklist de ValidaÃ§Ã£o Visual

### Design Geral
- [ ] Layout profissional e moderno
- [ ] Cores harmoniosas
- [ ] Tipografia legÃ­vel
- [ ] EspaÃ§amento adequado
- [ ] Hierarquia visual clara

### Hero Section
- [ ] Impactante e atrativo
- [ ] InformaÃ§Ãµes principais visÃ­veis
- [ ] CTA claro
- [ ] Background image carrega
- [ ] Overlay nÃ£o esconde conteÃºdo

### Cards de Evento
- [ ] Imagem de destaque visÃ­vel
- [ ] InformaÃ§Ãµes organizadas
- [ ] Categoria destacada
- [ ] Data e hora legÃ­veis
- [ ] Hover effect funciona

### Ingressos
- [ ] Cards bem destacados
- [ ] PreÃ§os claros
- [ ] Disponibilidade visÃ­vel
- [ ] CTAs evidentes
- [ ] Progress bar funciona

### Responsividade
- [ ] Desktop (1920px) âœ“
- [ ] Laptop (1366px) âœ“
- [ ] Tablet (768px) âœ“
- [ ] Mobile (375px) âœ“
- [ ] Mobile pequeno (320px) âœ“

### Performance
- [ ] Carrega rÃ¡pido (<3s)
- [ ] AnimaÃ§Ãµes suaves (60fps)
- [ ] Scroll fluido
- [ ] Sem travamentos
- [ ] Imagens otimizadas

### Acessibilidade
- [ ] Contraste adequado
- [ ] Textos legÃ­veis
- [ ] BotÃµes grandes o suficiente
- [ ] NavegaÃ§Ã£o por teclado funciona
- [ ] Alt text em imagens

---

## ðŸ’¡ Dicas de Teste

### Use Diferentes Navegadores
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (se disponÃ­vel)

### Teste em Dispositivos Reais
- [ ] Smartphone Android
- [ ] iPhone
- [ ] Tablet

### Teste Diferentes CenÃ¡rios
- [ ] ConexÃ£o lenta (throttling)
- [ ] Sem JavaScript (improvÃ¡vel)
- [ ] Zoom 150%
- [ ] Modo de alto contraste

---

## ðŸ“ Feedback

Ao testar, anote:

### O que funcionou bem âœ…
- Design
- Performance
- Usabilidade
- AnimaÃ§Ãµes

### O que pode melhorar ðŸ”„
- Layout
- Cores
- Textos
- Funcionalidades

### Bugs encontrados ðŸ›
- DescriÃ§Ã£o
- Como reproduzir
- Navegador/dispositivo
- Screenshot (se possÃ­vel)

---

## ðŸŽ‰ PrÃ³ximos Passos

ApÃ³s validar visualmente:

1. **Coletar Feedback**
   - Mostrar para stakeholders
   - Anotar sugestÃµes
   - Priorizar melhorias

2. **Ajustes Finos**
   - Cores
   - EspaÃ§amentos
   - Textos
   - AnimaÃ§Ãµes

3. **IntegraÃ§Ã£o Backend**
   - Conectar com API
   - Dados reais
   - AutenticaÃ§Ã£o
   - Pagamentos

4. **Deploy**
   - Feature flag
   - Rollout gradual
   - Monitoramento
   - Analytics

---

**Boa sorte com os testes! ðŸš€**

Se encontrar problemas, consulte:
- `README.md` - DocumentaÃ§Ã£o completa
- `STATUS.md` - Status de implementaÃ§Ã£o
- `QUICK_START.md` - Guia rÃ¡pido
