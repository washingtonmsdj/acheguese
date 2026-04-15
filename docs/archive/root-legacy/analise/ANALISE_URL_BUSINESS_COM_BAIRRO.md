# Análise: URLs de Empresas com Bairro Específico

**Data**: 2026-03-29  
**Status**: 🔍 Análise  
**Questão**: Empresas deveriam ter URLs com bairro específico?

---

## Situação Atual

### Implementação
```typescript
// BusinessUrlService.ts - extractTerritorySegments()
// Ex: '/br/ba/salvador/pituba' → { uf: 'ba', cidade: 'salvador' }
// Ex: '/br/ba/salvador'        → { uf: 'ba', cidade: 'salvador' }

// URL gerada: /empresas/ba/salvador/:slug
// Bairro é IGNORADO mesmo que location_id aponte para district
```

### Dados no Banco
```sql
-- business_data
location_id → pode apontar para:
  - Cidade (ex: Salvador)
  - Bairro (ex: Pituba)

-- locations
geographic_path:
  - Cidade: /br/ba/salvador
  - Bairro: /br/ba/salvador/pituba
```

---

## Cenários

### Cenário A: Empresa em Cidade (location_id = cidade)
```
location_id → Salvador
geographic_path: /br/ba/salvador
URL atual: /empresas/ba/salvador/padaria-joao ✅
URL com bairro: /empresas/ba/salvador/padaria-joao ✅
```
**Resultado**: Idêntico, sem problema.

### Cenário B: Empresa em Bairro (location_id = bairro)
```
location_id → Pituba
geographic_path: /br/ba/salvador/pituba
URL atual: /empresas/ba/salvador/padaria-joao ❌
URL com bairro: /empresas/ba/salvador/pituba/padaria-joao ✅
```
**Problema**: URL não reflete a localização específica da empresa.

---

## Impactos de Incluir Bairro na URL

### ✅ Vantagens

1. **SEO Hiperlocal**
   - URLs mais específicas: `/empresas/ba/salvador/pituba/padaria-joao`
   - Melhor ranqueamento para buscas locais: "padaria em Pituba"
   - Google entende melhor a localização geográfica

2. **UX Transparente**
   - Usuário vê o bairro na URL antes de clicar
   - Evita frustração de clicar em empresa de bairro distante
   - URL comunica localização exata

3. **Consistência Territorial**
   - Rotas territoriais já usam bairro: `/empresas/ba/salvador/pituba`
   - Empresas individuais deveriam seguir o mesmo padrão
   - Hierarquia clara: país > estado > cidade > bairro > empresa

4. **Slug History Preciso**
   - Histórico registra mudança de bairro corretamente
   - Redirect 308 funciona mesmo se empresa mudar de bairro
   - Exemplo: `/empresas/ba/salvador/pituba/padaria` → `/empresas/ba/salvador/rio-vermelho/padaria`

### ❌ Desvantagens

1. **URLs Mais Longas**
   - `/empresas/ba/salvador/pituba/padaria-joao` vs `/empresas/ba/salvador/padaria-joao`
   - Menos amigável para compartilhamento manual
   - Mais caracteres em redes sociais

2. **Complexidade de Roteamento**
   - Precisa diferenciar 3 vs 4 segmentos na URL
   - `/empresas/ba/salvador/pituba` → página territorial de Pituba
   - `/empresas/ba/salvador/pituba/padaria` → empresa específica
   - Ambiguidade: "pituba" é bairro ou slug de empresa?

3. **Breaking Change**
   - URLs existentes mudariam: `/empresas/ba/salvador/padaria` → `/empresas/ba/salvador/pituba/padaria`
   - Precisa migration de slug_history
   - Links externos quebrariam (mitigado com redirect 308)

4. **Empresas Sem Bairro**
   - Empresas com location_id = cidade não teriam bairro na URL
   - Inconsistência: algumas com bairro, outras sem
   - Exemplo: `/empresas/ba/salvador/empresa-a` vs `/empresas/ba/salvador/pituba/empresa-b`

---

## Decisão Arquitetural Recomendada

### Opção 1: Manter URL Sem Bairro (Status Quo)
```
URL: /empresas/:uf/:cidade/:slug
Exemplo: /empresas/ba/salvador/padaria-joao
```

**Justificativa**:
- Simplicidade de implementação
- URLs mais curtas e amigáveis
- Sem breaking changes
- Bairro já está visível na página da empresa
- SEO de cidade já é suficiente para maioria dos casos

**Quando usar**: Se o foco é simplicidade e não há demanda forte por SEO hiperlocal.

### Opção 2: Incluir Bairro Quando Disponível (Recomendado)
```
URL: /empresas/:uf/:cidade/:bairro?/:slug
Exemplos:
  - /empresas/ba/salvador/pituba/padaria-joao (com bairro)
  - /empresas/ba/salvador/padaria-maria (sem bairro)
```

**Justificativa**:
- SEO hiperlocal superior
- Consistência com rotas territoriais
- UX mais transparente
- Slug history mais preciso
- Alinhado com visão de "comunidade hiperlocal"

**Implementação**:
1. Atualizar `extractTerritorySegments()` para incluir bairro opcional
2. Atualizar rotas para aceitar 3 ou 4 segmentos
3. Migration de `business_slug_history` para incluir bairro
4. Redirect 308 de URLs antigas para novas

**Quando usar**: Se o foco é SEO hiperlocal e experiência territorial consistente.

### Opção 3: Bairro Apenas em Rotas Territoriais
```
Rota territorial: /empresas/ba/salvador/pituba (lista empresas de Pituba)
Rota individual: /empresas/ba/salvador/padaria-joao (sem bairro)
```

**Justificativa**:
- Separação clara entre listagem territorial e página individual
- URLs individuais mais curtas
- Rotas territoriais mantêm contexto geográfico
- Sem ambiguidade de roteamento

**Quando usar**: Se quiser manter URLs individuais simples mas preservar navegação territorial.

---

## Recomendação Final

**Opção 2: Incluir Bairro Quando Disponível**

**Motivos**:
1. Alinhado com visão de "comunidade hiperlocal" do projeto
2. SEO hiperlocal é vantagem competitiva
3. Consistência com rotas territoriais já implementadas
4. Slug history mais preciso para mudanças de localização
5. UX mais transparente (usuário vê bairro antes de clicar)

**Próximos Passos**:
1. Validar decisão com stakeholders
2. Planejar migration de URLs existentes
3. Implementar suporte a bairro opcional em `BusinessUrlService`
4. Atualizar rotas e resolver ambiguidade
5. Migration de `business_slug_history`
6. Testes e2e com ambos os formatos

---

## Implementação Proposta

### 1. Atualizar extractTerritorySegments
```typescript
function extractTerritorySegments(
  geoPath: string,
): { uf: string; cidade: string; bairro?: string } | null {
  const parts = geoPath.replace(/^\//, '').split('/');
  // [country, state, city, district?]
  if (parts.length < 3) return null;
  
  return {
    uf: parts[1],
    cidade: parts[2],
    bairro: parts[3] || undefined, // Opcional
  };
}
```

### 2. Atualizar buildUrls
```typescript
static buildUrls(ctx: BusinessUrlContext): ResolvedBusinessUrl {
  const { id, slug, is_premium, geographic_path } = ctx;

  let canonical: string;

  if (geographic_path) {
    const territory = extractTerritorySegments(geographic_path);
    if (territory) {
      // Inclui bairro se disponível
      canonical = territory.bairro
        ? `/empresas/${territory.uf}/${territory.cidade}/${territory.bairro}/${slug}`
        : `/empresas/${territory.uf}/${territory.cidade}/${slug}`;
    } else {
      canonical = `/empresas/ba/salvador/${slug}`;
    }
  } else {
    canonical = `/empresas/ba/salvador/${slug}`;
  }

  return {
    canonical,
    premium: is_premium ? `/p/${slug}` : null,
    legacy: `/business/${slug}`,
    dashboard: `/dashboard/business/${id}`,
  };
}
```

### 3. Atualizar Rotas
```tsx
// App.tsx
// Rota com bairro (4 segmentos)
<Route path="/empresas/:state/:city/:district/:slug" element={<BusinessRouteResolver />} />

// Rota sem bairro (3 segmentos)
<Route path="/empresas/:state/:city/:slug" element={<BusinessRouteResolver />} />

// Rotas territoriais (sem slug de empresa)
<Route path="/empresas/:state/:city/:district" element={<TerritorialLayout />}>
  <Route index element={<TerritorialBusinessPage />} />
</Route>
```

### 4. Atualizar BusinessRouteResolver
```typescript
export default function BusinessRouteResolver() {
  const { state, city, district, slug } = useParams<{
    state: string;
    city: string;
    district?: string;
    slug: string;
  }>();

  useEffect(() => {
    async function resolve() {
      // Se tem district, tenta resolver com bairro
      if (district) {
        const ctx = await BusinessUrlService.resolveByTerritoryAndSlug(
          state,
          city,
          slug, // último segmento é sempre o slug
          district // penúltimo é o bairro
        );
        if (ctx) {
          setResolved('business');
          return;
        }
      }
      
      // Fallback: tenta sem bairro ou delega para territorial
      // ...
    }
    resolve();
  }, [state, city, district, slug]);
}
```

---

**Decisão pendente de aprovação antes de implementar.**
