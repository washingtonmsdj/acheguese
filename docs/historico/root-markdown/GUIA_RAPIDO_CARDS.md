# 🚀 Guia Rápido - Cards AAA

## 📋 Uso Básico

### GastronomyCard

```typescript
import { GastronomyCard } from '@/modules/gastronomy';

// Grid variant (padrão)
<GastronomyCard
  business={restaurant}
  variant="grid"
  onClick={() => navigate(`/gastronomia/${restaurant.id}`)}
/>

// List variant (compacto)
<GastronomyCard
  business={restaurant}
  variant="list"
  onClick={() => navigate(`/gastronomia/${restaurant.id}`)}
/>

// Compact variant (carrossel)
<GastronomyCard
  business={restaurant}
  variant="compact"
  onClick={() => navigate(`/gastronomia/${restaurant.id}`)}
/>
```

---

### ServiceCardEnhanced

```typescript
import { ServiceCardEnhanced } from '@/modules/services';
// ou
import { ServiceCard } from '@/modules/services'; // Alias

// Grid variant
<ServiceCardEnhanced
  professional={professional}
  variant="grid"
  featured={true}
  onProfessionalClick={handleClick}
/>

// List variant (padrão)
<ServiceCardEnhanced
  professional={professional}
  variant="list"
  onProfessionalClick={handleClick}
/>

// Compact variant
<ServiceCardEnhanced
  professional={professional}
  variant="compact"
  onProfessionalClick={handleClick}
/>
```

---

### ClassificadoCard

```typescript
import { ClassificadoCard } from '@/modules/classifieds';

// Grid variant (padrão)
<ClassificadoCard
  classificado={item}
  variant="grid"
  onClick={() => navigate(`/classificados/${item.id}`)}
  onToggleFavorite={handleFavorite}
  isFavorite={favorites.includes(item.id)}
/>

// List variant
<ClassificadoCard
  classificado={item}
  variant="list"
  onClick={() => navigate(`/classificados/${item.id}`)}
  onToggleFavorite={handleFavorite}
  isFavorite={favorites.includes(item.id)}
/>
```

---

## 🎨 Layouts Recomendados

### Grade de Cards (Grid Variant)

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map((item, index) => (
    <Card
      key={item.id}
      item={item}
      variant="grid"
      index={index}
      onClick={handleClick}
    />
  ))}
</div>
```

### Lista Vertical (List Variant)

```typescript
<div className="flex flex-col gap-3">
  {items.map((item, index) => (
    <Card
      key={item.id}
      item={item}
      variant="list"
      index={index}
      onClick={handleClick}
    />
  ))}
</div>
```

### Carrossel Horizontal (Compact Variant)

```typescript
<div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
  {items.map((item, index) => (
    <Card
      key={item.id}
      item={item}
      variant="compact"
      index={index}
      onClick={handleClick}
      className="flex-shrink-0 w-32"
    />
  ))}
</div>
```

---

## 🎯 Quando Usar Cada Variante

### Grid Variant
**Use quando:**
- Página principal do módulo
- Grade de 2-4 colunas
- Desktop/tablet
- Quer mostrar todas as informações

**Não use quando:**
- Mobile com lista vertical
- Espaço limitado
- Carrossel horizontal

### List Variant
**Use quando:**
- Lista de resultados de busca
- Mobile (scroll vertical)
- Espaço limitado
- Quer mostrar muitos itens

**Não use quando:**
- Grade de múltiplas colunas
- Quer destacar imagens
- Carrossel horizontal

### Compact Variant
**Use quando:**
- Carrossel horizontal
- Seção de destaques
- Sidebar
- Preview rápido

**Não use quando:**
- Lista principal
- Quer mostrar todas as informações
- Desktop com espaço disponível

---

## 💡 Dicas de Performance

### 1. Use index para Animação Escalonada
```typescript
{items.map((item, index) => (
  <Card
    key={item.id}
    item={item}
    index={index} // ✅ Animação escalonada
    onClick={handleClick}
  />
))}
```

### 2. Memoize Handlers
```typescript
const handleClick = useCallback((item) => {
  navigate(`/path/${item.id}`);
}, [navigate]);
```

### 3. Use Keys Estáveis
```typescript
// ✅ Bom
<Card key={item.id} item={item} />

// ❌ Ruim
<Card key={index} item={item} />
```

---

## 🎨 Customização

### Classes Adicionais
```typescript
<Card
  item={item}
  className="shadow-2xl border-2 border-primary"
/>
```

### Featured/Destaque
```typescript
<ServiceCardEnhanced
  professional={professional}
  featured={true} // ✅ Adiciona badge e ring
/>
```

---

## ♿ Acessibilidade

### Todos os cards já incluem:
- ✅ `role="article"`
- ✅ `aria-label` descritivo
- ✅ Keyboard navigation
- ✅ Contraste WCAG AAA
- ✅ Touch-friendly (44px mínimo)

### Não precisa adicionar nada! 🎉

---

## 📱 Responsividade

### Todos os cards são mobile-first:
```typescript
// Funciona automaticamente em todos os tamanhos
<Card item={item} variant="grid" />
```

### Breakpoints automáticos:
- Mobile: `< 640px`
- Tablet: `>= 640px`
- Desktop: `>= 1024px`

---

## 🔄 Migração de Cards Antigos

### Antes (ServiceCard antigo)
```typescript
import { ServiceCard } from '@/modules/services';

<ServiceCard
  professional={professional}
  index={index}
  onProfessionalClick={handleClick}
/>
```

### Depois (ServiceCardEnhanced)
```typescript
import { ServiceCardEnhanced } from '@/modules/services';

<ServiceCardEnhanced
  professional={professional}
  variant="list" // ✅ Adicionar variante
  index={index}
  onProfessionalClick={handleClick}
/>
```

### Ou use o alias (compatibilidade)
```typescript
import { ServiceCard } from '@/modules/services'; // ✅ Funciona!

<ServiceCard
  professional={professional}
  variant="list"
  index={index}
  onProfessionalClick={handleClick}
/>
```

---

## 🎯 Exemplos Completos

### Página de Gastronomia
```typescript
import { GastronomyCard } from '@/modules/gastronomy';

function GastronomiaPage() {
  const { businesses } = useGastronomy();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Restaurantes</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business, index) => (
          <GastronomyCard
            key={business.id}
            business={business}
            variant="grid"
            index={index}
            onClick={() => navigate(`/gastronomia/${business.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Página de Serviços
```typescript
import { ServiceCardEnhanced } from '@/modules/services';

function ServicosPage() {
  const { professionals } = useServicos();
  const navigate = useNavigate();

  const handleClick = useCallback((professional) => {
    navigate(`/servicos/${professional.id}`);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Profissionais</h1>
      
      <div className="flex flex-col gap-3">
        {professionals.map((professional, index) => (
          <ServiceCardEnhanced
            key={professional.id}
            professional={professional}
            variant="list"
            index={index}
            onProfessionalClick={handleClick}
          />
        ))}
      </div>
    </div>
  );
}
```

### Página de Classificados
```typescript
import { ClassificadoCard } from '@/modules/classifieds';
import { useFavorites } from '@/hooks/useFavorites';

function ClassificadosPage() {
  const { classificados } = useClassificados();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Classificados</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {classificados.map((item, index) => (
          <ClassificadoCard
            key={item.id}
            classificado={item}
            variant="grid"
            index={index}
            onClick={() => navigate(`/classificados/${item.id}`)}
            onToggleFavorite={toggleFavorite}
            isFavorite={favorites.includes(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Card não aparece
```typescript
// ✅ Verifique se tem dados
{items.length > 0 && items.map(...)}

// ✅ Verifique a key
<Card key={item.id} item={item} />
```

### Animação não funciona
```typescript
// ✅ Passe o index
<Card index={index} item={item} />
```

### Imagem não carrega
```typescript
// ✅ Cards já têm fallback automático
// Não precisa fazer nada!
```

### Hover não funciona
```typescript
// ✅ Verifique se não tem z-index conflitante
// ✅ Verifique se não tem pointer-events: none
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- `IMPLEMENTACAO_CARDS_AAA_COMPLETA.md` - Documentação completa
- `CARDS_REDESIGN_SUMMARY.md` - Overview de todos os cards
- `GASTRONOMY_CARD_REDESIGN_SUMMARY.md` - Detalhes gastronomia
- `SERVICE_CARD_REDESIGN.md` - Detalhes serviços
- `CLASSIFICADO_CARD_REDESIGN.md` - Detalhes classificados

---

## ✅ Checklist de Uso

Ao usar os cards, certifique-se de:

- [ ] Importar do módulo correto
- [ ] Passar todas as props obrigatórias
- [ ] Escolher a variante adequada
- [ ] Usar key estável (item.id)
- [ ] Passar index para animação
- [ ] Memoizar handlers se necessário
- [ ] Testar em mobile e desktop

---

## 🎉 Pronto!

Agora você sabe usar todos os cards AAA do projeto! 🚀

**Dúvidas?** Consulte a documentação completa ou os exemplos acima.

**Problemas?** Verifique o troubleshooting ou abra uma issue.

**Sugestões?** Contribuições são bem-vindas! 💙
