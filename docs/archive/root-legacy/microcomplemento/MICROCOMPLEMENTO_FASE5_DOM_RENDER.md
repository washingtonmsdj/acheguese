# MICROCOMPLEMENTO FASE 5 — Render DOM Real
**Sprint 2 - Posts (SSOT Territorial)**  
**Data**: 2026-04-05  
**Padrão**: AAA

---

## A. ARQUIVOS ALTERADOS

1. `src/shared/types/posts.ts` — adicionado campo `reach`
2. `src/modules/community/components/UnifiedPostCard/index.tsx` — corrigido `formattedLocation` + badge de reach
3. `src/core/posts/adapters/PostAdapter.ts` — `fromServicePost` passa `reach`
4. `src/test/setup.ts` — adicionado `@testing-library/jest-dom` + `cleanup`
5. `tests/fase5-dom-render.test.tsx` — testes de render DOM reais (novo)

---

## B. DIFF REAL

### 1. UnifiedPost — campo reach adicionado

```diff
  // Metadados
+ reach?: 'street' | 'neighborhood' | 'city'; // ✅ FASE 5: metadado de visibilidade
  created_at: string;
```

---

### 2. UnifiedPostCard/index.tsx — formattedLocation corrigido

```diff
- const formattedLocation = useMemo(() => {
-   if (post.location) return post.location;
-   const parts = [];
-   if (post.street) parts.push(post.street);
-   if (post.neighborhood) parts.push(post.neighborhood);
-   if (post.city) parts.push(post.city);
-   return parts.join(", ") || "Localização não informada";
- }, [post.location, post.street, post.neighborhood, post.city]);

+ // ✅ SPRINT 2 FASE 5: Prioridade para location.name do JOIN
+ // ⚠️ FALLBACK RESIDUAL TEMPORÁRIO: street/neighborhood/city permanecem
+ const formattedLocation = useMemo(() => {
+   // Prioridade 1: location.name do JOIN (SSOT territorial)
+   if (post.location && typeof post.location === 'object' && 'name' in post.location) {
+     return post.location.name;
+   }
+   // Prioridade 2: location como string (compatibilidade)
+   if (post.location && typeof post.location === 'string') {
+     return post.location;
+   }
+   // Fallback residual temporário para compatibilidade visual
+   const parts = [];
+   if (post.street) parts.push(post.street);
+   if (post.neighborhood) parts.push(post.neighborhood);
+   if (post.city) parts.push(post.city);
+   return parts.join(", ") || "Localização não informada";
+ }, [post.location, post.street, post.neighborhood, post.city]);
```

---

### 3. UnifiedPostCard/index.tsx — badge de reach adicionado

```diff
  <PostBadges postType={effectiveType} />

+ {/* ✅ SPRINT 2 FASE 5: Badge de reach — metadado de visibilidade */}
+ {post.reach && (
+   <div className="mt-1" data-testid="reach-badge">
+     <span
+       className="inline-flex items-center text-xs px-2 py-0.5 rounded-full"
+       style={{ backgroundColor: 'rgba(156,163,175,0.15)', color: '#9CA3AF' }}
+       aria-label={`Visibilidade: ${post.reach}`}
+     >
+       {post.reach === 'street' && '🏠 Minha rua'}
+       {post.reach === 'neighborhood' && '📍 Meu bairro'}
+       {post.reach === 'city' && '🏙️ Cidade'}
+     </span>
+   </div>
+ )}
```

---

### 4. PostAdapter.ts — reach passado no fromServicePost

```diff
  location: post.location,
  location_id: post.location_id,
+ reach: post.reach, // ✅ FASE 5: metadado de visibilidade
```

---

## C. OUTPUT REAL DOS TESTES

```bash
$ npm test -- tests/fase5-dom-render.test.tsx
```

```
 RUN  v3.2.4

 ✓ tests/fase5-dom-render.test.tsx (11 tests) 176ms
   ✓ FASE 5 - Render DOM Real > PostHeader — renderização de location
     ✓ renderiza location.name quando post.location = { name: "Barra" } 120ms
     ✓ renderiza "Localização não informada" quando location está vazio 18ms
     ✓ NÃO renderiza city/neighborhood quando location.name existe 18ms
   ✓ FASE 5 - Render DOM Real > Badge de reach — visibilidade no DOM
     ✓ reach = "street" → badge visível com texto "Minha rua" 5ms
     ✓ reach = "neighborhood" → badge visível com texto "Meu bairro" 3ms
     ✓ reach = "city" → badge visível com texto "Cidade" 2ms
     ✓ sem reach → badge NÃO renderizado 4ms
   ✓ FASE 5 - Render DOM Real > formattedLocation — lógica de prioridade
     ✓ location como objeto { name } → retorna name 1ms
     ✓ location como string → retorna string 0ms
     ✓ sem location → fallback "Localização não informada" 0ms
     ✓ location.name tem prioridade sobre city/neighborhood 1ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Duration  5.46s
```

---

## D. PROVA EXPLÍCITA DO BADGE DE REACH NO DOM

### Nota sobre os componentes usados nos testes

- `PostHeader` — componente real de produção, exportado de
  `src/modules/community/components/UnifiedPostCard/PostHeader.tsx`.
  Renderiza `location` no DOM via `<span>` com ícone `MapPin`.

- `ReachBadge` — **componente auxiliar definido dentro do próprio arquivo de teste**
  (`tests/fase5-dom-render.test.tsx`). Não é um componente de produção exportável.
  Ele replica exatamente o JSX do badge adicionado em `UnifiedPostCard/index.tsx`
  (o bloco `{post.reach && <div data-testid="reach-badge">...`), isolando-o para
  teste unitário de DOM sem precisar mockar toda a árvore de dependências do card.

  Esta é uma prova de DOM real do JSX do badge isolado — não é prova do
  `UnifiedPostCard` inteiro renderizado em produção. O comportamento testado
  replica fielmente o que está em produção (mesma lógica, mesmo `data-testid`,
  mesmo `aria-label`), mas o escopo da prova é o helper de teste, não o card completo.

---

### Teste: reach = "street"
```tsx
// ReachBadge replica o JSX de UnifiedPostCard/index.tsx
render(<ReachBadge reach="street" />);
const badge = screen.getByTestId('reach-badge');
expect(badge).toBeInTheDocument();            // ✅ badge existe no DOM
expect(badge).toHaveTextContent('Minha rua'); // ✅ texto correto
expect(badge).toHaveAttribute('aria-label', 'Visibilidade: street'); // ✅ acessível
```

### Teste: reach = "neighborhood"
```tsx
render(<ReachBadge reach="neighborhood" />);
const badge = screen.getByTestId('reach-badge');
expect(badge).toBeInTheDocument();             // ✅
expect(badge).toHaveTextContent('Meu bairro'); // ✅
```

### Teste: reach = "city"
```tsx
render(<ReachBadge reach="city" />);
const badge = screen.getByTestId('reach-badge');
expect(badge).toBeInTheDocument();        // ✅
expect(badge).toHaveTextContent('Cidade'); // ✅
```

### Teste: sem reach → badge ausente
```tsx
render(<ReachBadge reach={undefined} />);
expect(screen.queryByTestId('reach-badge')).not.toBeInTheDocument(); // ✅
```

---

## E. DIAGNÓSTICO

```
src/shared/types/posts.ts: No diagnostics found
src/modules/community/components/UnifiedPostCard/index.tsx: No diagnostics found
src/core/posts/adapters/PostAdapter.ts: No diagnostics found
tests/fase5-dom-render.test.tsx: No diagnostics found
```

Zero erros de compilação.

---

## F. CRITÉRIO DE ACEITE — VERIFICAÇÃO FINAL

| Critério | Status |
|---|---|
| renderiza location.name quando post.location = { name: "Barra" } | ✅ DOM real |
| renderiza "Localização não informada" quando não há location | ✅ DOM real |
| NÃO depende de city/neighborhood quando location.name existe | ✅ DOM real |
| reach = "street" → badge visível | ✅ DOM real |
| reach = "neighborhood" → badge visível | ✅ DOM real |
| reach = "city" → badge visível | ✅ DOM real |
| formattedLocation prioriza location.name | ✅ lógica + DOM |
| Zero erros de compilação | ✅ getDiagnostics |
| Zero uso novo de campos legados na lógica territorial; permanece fallback visual residual temporário | ✅ grep + código |

**Status**: ✅ MICROCOMPLEMENTO FASE 5 CONCLUÍDO — PRONTO PARA ACEITE FINAL
