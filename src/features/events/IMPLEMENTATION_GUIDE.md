# 🚀 Guia de Implementação - Events V2

## 📦 O que foi criado

### Estrutura Completa

```
src/features/events-v2/
├── components/
│   ├── EventHero.tsx          ✅ Hero premium com banner
│   ├── EventTickets.tsx       ✅ Sistema de ingressos
│   ├── EventDescription.tsx   ✅ Descrição rica
│   ├── EventSchedule.tsx      ✅ Programação/agenda
│   ├── EventCTA.tsx          ✅ CTA sticky configurável
│   └── EventCardV2.tsx       ✅ Card para listagens
├── pages/
│   └── EventDetailPageV2.tsx ✅ Página completa
├── types/
│   └── index.ts              ✅ Tipos TypeScript
├── hooks/                     📝 (preparado para hooks)
├── utils/                     📝 (preparado para utils)
├── README.md                  ✅ Documentação completa
├── IMPLEMENTATION_GUIDE.md    ✅ Este arquivo
└── demo-route.example.tsx     ✅ Exemplo de rota
```

## 🎯 Como Testar Agora

### Opção 1: Adicionar Rota Temporária

1. Abra o arquivo de rotas principal (ex: `src/app/routes/index.tsx`)

2. Adicione o import:
```typescript
import EventDetailPageV2 from '@/features/events-v2/pages/EventDetailPageV2';
```

3. Adicione a rota:
```typescript
{
  path: '/eventos/demo',
  element: <EventDetailPageV2 />
}
```

4. Acesse: `http://localhost:5173/eventos/demo`

### Opção 2: Link Direto

Adicione um link em qualquer página:

```typescript
import { Link } from 'react-router-dom';

<Link to="/eventos/demo">
  <Button>Ver Evento V2 (Demo)</Button>
</Link>
```

## 🎨 Features Implementadas

### ✅ Página de Detalhes Completa

- **Hero Section**
  - Banner full-width com overlay
  - Badges de categoria, tipo, status
  - Informações principais destacadas
  - Card lateral com ações
  - Contador de participantes
  - Barra de progresso de ocupação

- **Sistema de Ingressos**
  - Suporte para gratuito, pago e híbrido
  - Cards interativos com hover
  - Progress bar de vendas
  - Badges de status (esgotado, últimas vagas)
  - Informações de quantidade e limites

- **Descrição Rica**
  - HTML formatado
  - Requisitos e informações adicionais
  - Features do evento
  - Acessibilidade

- **Programação**
  - Timeline visual
  - Horários e durações
  - Palestrantes e locais
  - Animações de entrada

- **Localização**
  - Endereço completo
  - Instruções de acesso
  - Integração Google Maps

- **Organizador**
  - Perfil completo
  - Estatísticas
  - Badge de verificação

- **CTA Sticky**
  - Sempre visível
  - Múltiplos canais de contato
  - Indicadores de confiança

### ✅ Componentes Reutilizáveis

- **EventCardV2**
  - 3 variantes: default, compact, featured
  - Animações Framer Motion
  - Hover effects
  - Badges dinâmicos

## 🔧 Próximos Passos para Integração

### 1. Criar Hooks de Dados

```typescript
// src/features/events-v2/hooks/useEventV2.ts
import { useQuery } from '@tanstack/react-query';

export function useEventV2(eventId: string) {
  return useQuery({
    queryKey: ['event-v2', eventId],
    queryFn: () => fetchEventV2(eventId),
  });
}
```

### 2. Conectar com Backend

```typescript
// src/features/events-v2/services/eventsV2Service.ts
export async function fetchEventV2(eventId: string): Promise<EventV2> {
  const { data, error } = await supabase
    .from('events_v2')
    .select('*')
    .eq('id', eventId)
    .single();
    
  if (error) throw error;
  return data;
}
```

### 3. Adicionar Rotas Dinâmicas

```typescript
// Rota com parâmetro
{
  path: '/eventos/:eventId',
  element: <EventDetailPageV2 />
}

// No componente
const { eventId } = useParams();
const { data: event } = useEventV2(eventId);
```

### 4. Implementar Ações

```typescript
// Favoritar
const { mutate: favoriteEvent } = useFavoriteEvent();

// Inscrever
const { mutate: registerForEvent } = useRegisterForEvent();

// Compartilhar
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: event.title,
      text: event.short_description,
      url: window.location.href
    });
  }
};
```

## 📊 Migração da V1 para V2

### Estratégia Recomendada

1. **Fase 1: Validação** (Atual)
   - V2 isolada para testes
   - Feedback visual e UX
   - Ajustes de design

2. **Fase 2: Integração Backend**
   - Criar tabelas/views necessárias
   - Implementar hooks
   - Conectar com dados reais

3. **Fase 3: Rollout Gradual**
   - Feature flag para alternar V1/V2
   - A/B testing
   - Monitoramento de métricas

4. **Fase 4: Migração Completa**
   - Substituir V1 por V2
   - Remover código legado
   - Documentação final

### Compatibilidade

A V2 foi projetada para ser **100% compatível** com a estrutura existente:

- ✅ Não altera rotas atuais
- ✅ Não modifica componentes existentes
- ✅ Não afeta hooks ou serviços atuais
- ✅ Pode coexistir com V1
- ✅ Migração gradual possível

## 🎨 Customização

### Temas e Cores

Todos os componentes usam o design system existente:

```typescript
// Cores principais
- primary: Cor principal do tema
- secondary: Cor secundária
- muted: Cor de fundo suave
- border: Cor das bordas

// Gradientes
- from-primary to-purple-600
- from-emerald-500 to-green-500
```

### Variantes de Componentes

```typescript
// EventCardV2
<EventCardV2 variant="default" />   // Card completo
<EventCardV2 variant="compact" />   // Card compacto
<EventCardV2 variant="featured" />  // Card destaque

// EventHero
<EventHero className="custom-class" />

// EventTickets
<EventTickets onSelectTicket={handler} />
```

## 📱 Responsividade

Todos os componentes são **mobile-first**:

- Breakpoints: sm (640px), md (768px), lg (1024px)
- Grid adaptativo
- Touch-friendly (44px mínimo)
- Scroll horizontal em mobile
- Sticky CTA otimizado

## ⚡ Performance

### Otimizações Implementadas

- ✅ Lazy loading de imagens
- ✅ Framer Motion otimizado
- ✅ Memoização de componentes
- ✅ Viewport-based animations
- ✅ CSS-in-JS otimizado

### Métricas Esperadas

- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- TTI: < 3.5s

## 🔒 Segurança

### Boas Práticas

- ✅ Sanitização de HTML (dangerouslySetInnerHTML apenas onde necessário)
- ✅ Validação de tipos TypeScript
- ✅ Props validation
- ✅ Error boundaries (recomendado adicionar)

## 📈 Métricas e Analytics

### Eventos para Tracking

```typescript
// Visualização
trackEvent('event_v2_view', { eventId, category });

// Favoritar
trackEvent('event_v2_favorite', { eventId });

// Compartilhar
trackEvent('event_v2_share', { eventId, method });

// Selecionar ingresso
trackEvent('event_v2_ticket_select', { eventId, ticketId });

// CTA click
trackEvent('event_v2_cta_click', { eventId, ctaType });
```

## 🐛 Troubleshooting

### Problema: Componentes não aparecem

**Solução**: Verificar se a rota foi adicionada corretamente

### Problema: Estilos não aplicados

**Solução**: Verificar se Tailwind está configurado para incluir `src/features/**`

### Problema: Tipos não reconhecidos

**Solução**: Verificar tsconfig.json e paths

### Problema: Imagens não carregam

**Solução**: Substituir `/placeholder.svg` por URLs reais

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte o README.md
2. Verifique os tipos em types/index.ts
3. Veja exemplos em demo-route.example.tsx
4. Analise o código dos componentes

## ✅ Checklist de Implementação

### Fase 1: Validação Visual ✅
- [x] Estrutura de arquivos criada
- [x] Componentes implementados
- [x] Tipos definidos
- [x] Documentação completa
- [x] Exemplo de rota

### Fase 2: Integração Backend 📝
- [ ] Criar hooks de dados
- [ ] Conectar com Supabase
- [ ] Implementar mutations
- [ ] Adicionar error handling
- [ ] Criar loading states

### Fase 3: Features Adicionais 📝
- [ ] Galeria de fotos
- [ ] FAQ section
- [ ] Eventos relacionados
- [ ] Sistema de avaliações
- [ ] Compartilhamento social
- [ ] Calendário (iCal)

### Fase 4: Otimizações 📝
- [ ] Image optimization
- [ ] Code splitting
- [ ] Cache strategy
- [ ] Analytics integration
- [ ] Error boundaries
- [ ] Loading skeletons

### Fase 5: Testes 📝
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Accessibility tests
- [ ] Performance tests

### Fase 6: Deploy 📝
- [ ] Feature flag
- [ ] A/B testing
- [ ] Monitoring
- [ ] Rollback plan
- [ ] Documentation

## 🎉 Conclusão

A V2 está **pronta para validação visual**! 

Todos os componentes estão implementados, documentados e isolados da versão atual. Você pode testar a interface, validar o design e fazer ajustes antes da integração definitiva com o backend.

**Próximo passo**: Adicionar a rota de demonstração e acessar `/eventos/demo` para ver a página em ação! 🚀
