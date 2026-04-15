# Análise Completa do Módulo de Gastronomia

## Status Geral
✅ **Módulo AAA Profissional** - Arquitetura sólida, SSOT 100%, TypeScript strict, zero duplicações

---

## 🎯 Funcionalidades Implementadas

### ✅ Backend/Banco de Dados
1. **Tabelas principais criadas:**
   - `gastronomy_profiles` - Perfis gastronômicos (extensão de business_data)
   - `menus` - Containers de cardápio
   - `menu_categories` - Categorias do cardápio
   - `menu_items` - Itens do cardápio com informações nutricionais
   - `menu_item_variants` - Variações (tamanhos, sabores)
   - `menu_item_addons` - Adicionais
   - `menu_item_availability` - Disponibilidade temporal
   - `menu_promotions` - Promoções e descontos

2. **RLS (Row Level Security):** ✅ Implementado
3. **Índices de performance:** ✅ Implementados
4. **Funções auxiliares:** ✅ Implementadas

### ✅ Frontend - Páginas
1. **GastronomyLandingPage** - Listagem principal
   - Hero com imagem imersiva
   - Painel de destino de entrega
   - Cards de categorias de culinária
   - Seções de negócios por categoria
   - Catálogo de pratos
   - Filtros avançados (preço, delivery, horário)
   - Ordenação (relevância, proximidade, avaliação)
   - Layouts grid/list
   - Paginação infinita
   - CTA para cadastro de restaurante

2. **GastronomyDetailPage** - Página de detalhes
   - Banner com imagem
   - Informações do estabelecimento
   - Avaliações (rating + total)
   - Modos de serviço (delivery, retirada, local)
   - Cardápio completo com categorias
   - Promoções ativas
   - Mapa de localização
   - Botão de compartilhar
   - Botão de favoritar (UI only - não persiste)

### ✅ Carrinho e Checkout
1. **GastronomyCartService** - Serviço de carrinho
   - Adicionar/remover itens
   - Cálculo de subtotal
   - Taxa de entrega
   - Pedido mínimo
   - Variantes e adicionais

2. **GastronomyCheckoutSheet** - Sheet de checkout
   - Revisão de itens
   - Seleção de forma de pagamento
   - Observações do pedido
   - Validação de pedido mínimo
   - Integração com módulo de delivery

3. **StickyOrderBar** - Barra fixa de pedido
   - Contador de itens
   - Total do pedido
   - Alerta de pedido mínimo

### ✅ Componentes Especializados
- `GastronomyCategoryCards` - Cards de categorias
- `GastronomyDeliveryDestinationPanel` - Painel de destino
- `MenuItemCard` - Card de item do cardápio
- `MenuItemDetailDrawer` - Drawer de detalhes do item
- `BusinessSectionCarousel` - Carrossel de negócios
- `FoodSectionCarousel` - Carrossel de pratos
- `OpeningStatusBadge` - Badge de status de abertura
- `DeliveryInfoCard` - Card de informações de entrega

### ✅ Hooks e Serviços
- `useGastronomyList` - Listagem de negócios
- `useGastronomyFoodCatalog` - Catálogo de pratos
- `useGastronomyDetail` - Detalhes do negócio
- `useMenu` - Cardápio
- `useGastronomyCart` - Carrinho
- `useGastronomyCheckout` - Checkout
- `useDeliveryDestination` - Destino de entrega
- `useGastronomyBusinessSort` - Ordenação e proximidade

### ✅ Integração com Delivery
- Adapter para criar pedidos no módulo de delivery
- Fluxo completo de checkout
- Modo: `payment_mode = direct_to_merchant`
- Modo: `delivery_mode = merchant_own_fleet`

---

## ❌ Funcionalidades FALTANDO no Frontend

### 1. 🔴 **Sistema de Avaliações (Reviews)**
**Status:** Apenas exibição de rating agregado

**O que falta:**
- [ ] Página/modal para escrever avaliação
- [ ] Listagem completa de avaliações na página de detalhes
- [ ] Filtros de avaliações (mais recentes, melhor avaliadas)
- [ ] Upload de fotos nas avaliações
- [ ] Resposta do estabelecimento às avaliações
- [ ] Denúncia de avaliações inadequadas
- [ ] Avaliações verificadas (apenas quem pediu)

**Impacto:** ALTO - Reviews são essenciais para decisão de compra

---

### 2. 🔴 **Sistema de Favoritos/Wishlist**
**Status:** Botão de "like" existe mas não persiste

**O que falta:**
- [ ] Persistência de favoritos no banco
- [ ] Página "Meus Favoritos"
- [ ] Sincronização entre dispositivos
- [ ] Notificações de promoções em favoritos
- [ ] Filtro "Apenas favoritos" na listagem

**Impacto:** MÉDIO - Melhora retenção e experiência do usuário

---

### 3. 🔴 **Histórico de Pedidos**
**Status:** Pedidos são criados mas não há visualização

**O que falta:**
- [ ] Página "Meus Pedidos"
- [ ] Listagem de pedidos anteriores
- [ ] Detalhes de cada pedido
- [ ] Status de entrega em tempo real
- [ ] Botão "Pedir novamente"
- [ ] Filtros (em andamento, concluídos, cancelados)
- [ ] Busca no histórico

**Impacto:** CRÍTICO - Usuário não consegue acompanhar seus pedidos

---

### 4. 🟡 **Rastreamento de Pedido em Tempo Real**
**Status:** Não implementado

**O que falta:**
- [ ] Página de rastreamento do pedido
- [ ] Mapa com localização do entregador
- [ ] Timeline de status (confirmado → preparando → saiu para entrega → entregue)
- [ ] Notificações push de mudança de status
- [ ] Tempo estimado de chegada
- [ ] Contato com entregador

**Impacto:** ALTO - Transparência e confiança na entrega

---

### 5. 🟡 **Sistema de Cupons/Vouchers**
**Status:** Promoções existem mas não há aplicação de cupons

**O que falta:**
- [ ] Campo para inserir código de cupom no checkout
- [ ] Validação de cupons
- [ ] Listagem de cupons disponíveis
- [ ] Cupons de primeira compra
- [ ] Cupons de fidelidade
- [ ] Cupons por categoria/estabelecimento

**Impacto:** MÉDIO - Importante para marketing e conversão

---

### 6. 🟡 **Programa de Fidelidade**
**Status:** Não implementado

**O que falta:**
- [ ] Sistema de pontos por pedido
- [ ] Níveis de fidelidade (bronze, prata, ouro)
- [ ] Recompensas e benefícios
- [ ] Página "Meus Pontos"
- [ ] Histórico de pontos ganhos/gastos

**Impacto:** MÉDIO - Aumenta retenção e lifetime value

---

### 7. 🟡 **Agendamento de Pedidos**
**Status:** Não implementado

**O que falta:**
- [ ] Opção de agendar pedido para data/hora futura
- [ ] Validação de horário de funcionamento
- [ ] Confirmação de agendamento
- [ ] Lembretes antes do horário agendado
- [ ] Gestão de pedidos agendados

**Impacto:** MÉDIO - Conveniência para o usuário

---

### 8. 🟢 **Busca Avançada**
**Status:** Busca básica implementada

**O que poderia melhorar:**
- [ ] Busca por ingredientes
- [ ] Busca por restrições alimentares (vegano, sem glúten, etc.)
- [ ] Busca por faixa de preço
- [ ] Sugestões de busca (autocomplete)
- [ ] Histórico de buscas
- [ ] Buscas populares

**Impacto:** BAIXO - Busca atual é funcional

---

### 9. 🟢 **Comparação de Estabelecimentos**
**Status:** Não implementado

**O que falta:**
- [ ] Selecionar múltiplos estabelecimentos
- [ ] Comparar lado a lado (preço, tempo, avaliação)
- [ ] Comparar itens similares

**Impacto:** BAIXO - Nice to have

---

### 10. 🟢 **Recomendações Personalizadas**
**Status:** Não implementado

**O que falta:**
- [ ] "Recomendado para você" baseado em histórico
- [ ] "Clientes que pediram X também pediram Y"
- [ ] Sugestões baseadas em horário/dia
- [ ] Pratos populares no seu bairro

**Impacto:** BAIXO - Melhora descoberta mas não é essencial

---

### 11. 🔴 **Notificações**
**Status:** Não implementado

**O que falta:**
- [ ] Notificações de mudança de status do pedido
- [ ] Notificações de promoções
- [ ] Notificações de novos estabelecimentos
- [ ] Configurações de notificações
- [ ] Centro de notificações

**Impacto:** ALTO - Comunicação essencial com o usuário

---

### 12. 🟡 **Suporte/Ajuda**
**Status:** Não implementado

**O que falta:**
- [ ] Chat de suporte
- [ ] FAQ específico de gastronomia
- [ ] Reportar problema com pedido
- [ ] Solicitar reembolso
- [ ] Avaliar atendimento

**Impacto:** MÉDIO - Importante para resolver problemas

---

### 13. 🟢 **Compartilhamento Social**
**Status:** Botão de compartilhar existe

**O que poderia melhorar:**
- [ ] Compartilhar prato específico
- [ ] Compartilhar promoção
- [ ] Compartilhar avaliação
- [ ] Preview bonito para redes sociais (Open Graph)

**Impacto:** BAIXO - Funcionalidade básica já existe

---

### 14. 🟡 **Filtros de Acessibilidade**
**Status:** Dados existem no perfil mas não há filtro

**O que falta:**
- [ ] Filtro "Tem estacionamento"
- [ ] Filtro "Acessível para cadeirantes"
- [ ] Filtro "Tem área kids"
- [ ] Filtro "Aceita reservas"
- [ ] Filtro "Tem música ao vivo"
- [ ] Filtro "Tem WiFi"

**Impacto:** MÉDIO - Importante para inclusão

---

### 15. 🟢 **Modo Escuro**
**Status:** Provavelmente implementado no nível do app

**Verificar:**
- [ ] Todas as páginas de gastronomia suportam dark mode
- [ ] Imagens têm contraste adequado
- [ ] Cores de badge/status são legíveis

**Impacto:** BAIXO - Conforto visual

---

## 📊 Priorização Sugerida

### 🔥 CRÍTICO (Implementar AGORA)
1. **Histórico de Pedidos** - Usuário precisa ver seus pedidos
2. **Rastreamento em Tempo Real** - Transparência na entrega
3. **Sistema de Avaliações** - Essencial para confiança

### ⚡ ALTA PRIORIDADE (Próximas 2-4 semanas)
4. **Notificações** - Comunicação com usuário
5. **Sistema de Favoritos** - Melhora retenção
6. **Cupons/Vouchers** - Importante para marketing

### 📈 MÉDIA PRIORIDADE (1-2 meses)
7. **Suporte/Ajuda** - Resolver problemas
8. **Agendamento de Pedidos** - Conveniência
9. **Programa de Fidelidade** - Retenção de longo prazo
10. **Filtros de Acessibilidade** - Inclusão

### 💡 BAIXA PRIORIDADE (Backlog)
11. **Busca Avançada** - Melhorias incrementais
12. **Comparação de Estabelecimentos** - Nice to have
13. **Recomendações Personalizadas** - Requer dados
14. **Melhorias de Compartilhamento** - Já funcional

---

## 🏗️ Arquitetura Técnica Necessária

### Para Histórico de Pedidos
```typescript
// Novo hook necessário
useUserOrders(userId: string, filters?: OrderFilters)

// Nova página
src/modules/gastronomy/pages/MyOrdersPage.tsx
src/modules/gastronomy/pages/OrderDetailPage.tsx
```

### Para Avaliações
```typescript
// Novos hooks
useCreateReview(orderId: string)
useBusinessReviews(businessId: string)

// Novos componentes
src/modules/gastronomy/components/ReviewForm.tsx
src/modules/gastronomy/components/ReviewList.tsx
src/modules/gastronomy/components/ReviewCard.tsx
```

### Para Favoritos
```typescript
// Nova tabela no banco
CREATE TABLE user_favorite_businesses (
  user_id UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES business_data(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, business_id)
);

// Novos hooks
useToggleFavorite(businessId: string)
useUserFavorites(userId: string)
useFavoriteStatus(businessId: string)
```

### Para Rastreamento
```typescript
// Integração com módulo de delivery
useOrderTracking(orderId: string)
useDriverLocation(driverId: string)

// Nova página
src/modules/gastronomy/pages/OrderTrackingPage.tsx
```

---

## 🎨 Melhorias de UX Sugeridas

1. **Loading States:** Adicionar skeletons mais elaborados
2. **Empty States:** Melhorar mensagens quando não há dados
3. **Error States:** Feedback mais claro de erros
4. **Animações:** Transições mais suaves entre estados
5. **Acessibilidade:** Testar com leitores de tela
6. **Performance:** Lazy loading de imagens
7. **PWA:** Funcionalidade offline básica

---

## 📱 Considerações Mobile

1. **Gestos:** Swipe para remover item do carrinho
2. **Bottom Sheet:** Usar para filtros em mobile
3. **Sticky Elements:** Garantir que não bloqueiam conteúdo
4. **Touch Targets:** Mínimo 44x44px
5. **Teclado Virtual:** Ajustar viewport quando aberto

---

## 🔒 Segurança e Privacidade

1. **Dados Sensíveis:** Não expor dados de pagamento
2. **Endereços:** Criptografar endereços salvos
3. **Histórico:** Permitir deletar histórico
4. **LGPD:** Exportar/deletar dados do usuário
5. **Rate Limiting:** Prevenir spam de pedidos

---

## 📈 Métricas Sugeridas

1. **Conversão:** Taxa de checkout completado
2. **Abandono:** Taxa de abandono de carrinho
3. **Tempo Médio:** Tempo até completar pedido
4. **Retenção:** Usuários que fazem 2º pedido
5. **NPS:** Net Promoter Score
6. **Ticket Médio:** Valor médio por pedido

---

## ✅ Conclusão

O módulo de gastronomia tem uma **base sólida e profissional**, mas falta implementar funcionalidades essenciais de **pós-venda** e **engajamento do usuário**:

### Crítico:
- ❌ Histórico de pedidos
- ❌ Rastreamento em tempo real
- ❌ Sistema de avaliações completo

### Importante:
- ❌ Notificações
- ❌ Favoritos persistentes
- ❌ Sistema de cupons

O foco deve ser em **fechar o ciclo completo do pedido** antes de adicionar features de descoberta e personalização.
