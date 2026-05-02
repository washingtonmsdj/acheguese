# Código das Categorias para Educação

## 1. Adicionar constante EDUCATION_CATEGORIES (linha ~80, antes de NICHE_ICONS)

```typescript
// Categorias de educação (estilo gastronomia - filtros visuais)
const EDUCATION_CATEGORIES = [
  { id: 'regular_school', emoji: '🏫', label: 'Escolas', nicheKey: 'regular_school', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
  { id: 'daycare', emoji: '👶', label: 'Creches', nicheKey: 'daycare', color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/20' },
  { id: 'language_school', emoji: '🌍', label: 'Idiomas', nicheKey: 'language_school', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  { id: 'prep_course', emoji: '📐', label: 'Cursinhos', nicheKey: 'prep_course', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/20' },
  { id: 'technical_school', emoji: '🔧', label: 'Técnico', nicheKey: 'technical_school', color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/20' },
  { id: 'tutoring_center', emoji: '📚', label: 'Reforço', nicheKey: 'tutoring_center', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/20' },
  { id: 'music_school', emoji: '🎵', label: 'Música', nicheKey: 'music_school', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15 border-fuchsia-500/20' },
  { id: 'sports_school', emoji: '⚽', label: 'Esportes', nicheKey: 'sports_school', color: 'text-lime-400', bg: 'bg-lime-500/15 border-lime-500/20' },
];
```

## 2. Adicionar seção de categorias (linha ~1795, logo após o Hero section e ANTES do FilterBar)

```tsx
      {/* ── CATEGORIAS (ESTILO GASTRONOMIA - TOPO) ───────────────── */}
      <section className="w-full bg-card/50 border-b border-border py-4">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex justify-center gap-3 pb-1 px-4 min-w-max mx-auto">
            {EDUCATION_CATEGORIES.map((cat, i) => {
              const isActive = filters.niches.includes(cat.nicheKey);
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      niches: isActive
                        ? prev.niches.filter((v) => v !== cat.nicheKey)
                        : [...prev.niches, cat.nicheKey],
                    }))
                  }
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 group shrink-0 min-w-[60px] ${cat.bg} ${isActive ? 'ring-2 ring-primary/40' : ''}`}
                >
                  <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>
                    <span className={`text-2xl ${cat.color}`}>{cat.emoji}</span>
                  </motion.div>
                  <span className="text-[10px] font-semibold text-foreground leading-tight text-center whitespace-nowrap">
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>
```

## Posição Exata

Adicionar APÓS:
```tsx
        </div>
      </section>
```
(fim do Hero)

E ANTES de:
```tsx
      {/* ==========================================================================
          FILTER BAR — sticky, refinada
```

## Resultado Final

A ordem dos elementos será:
1. Hero (busca + quick chips)
2. **CATEGORIAS** (🏫🎵⚽ etc) ← NOVO
3. FilterBar (sticky)
4. Main Layout (cards)
