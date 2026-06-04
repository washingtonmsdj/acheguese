# Sistema de Rotas

> Configuração centralizada de rotas da plataforma
> 
> Este módulo foi refatorado em Abril 2026 para reduzir a complexidade do App.tsx

---

## Estrutura

```
src/app/routes/
├── index.ts          # Exportações públicas
├── lazyImports.ts    # Lazy imports organizados por domínio
├── AppRoutes.tsx     # Componente de rotas principal
└── README.md         # Esta documentação
```

---

## Arquitetura

### Princípios

1. **Separação de Responsabilidades**: Rotas separadas do componente App
2. **Organização por Domínio**: Imports lazy organizados por funcionalidade
3. **Lazy Loading Otimizado**: Todas as páginas não-críticas são lazy-loaded
4. **Critical Path**: Apenas componentes essenciais para FCP são eager-loaded

### Critical vs Lazy

**Eager (Carregados Imediatamente):**
- `LoginPage` - Página de entrada
- `TerritorialLayout` - Layout base territorial
- `Territorial*Page` - Páginas territoriais canônicas

**Lazy (Carregados Sob Demanda):**
- Todas as páginas de admin (40+)
- Todas as páginas de módulos (mobilidade, gastronomia, etc.)
- Páginas de detalhe e formulários

---

## Como Adicionar Novas Rotas

### 1. Adicionar o Lazy Import

No arquivo `lazyImports.ts`, adicione na seção apropriada:

```typescript
// ============================================================
// 🆕 NOVO MÓDULO
// ============================================================
export const NovaPaginaPage = lazy(() => import("@/modules/novo/pages/NovaPaginaPage"));
```

### 2. Adicionar a Rota

No arquivo `AppRoutes.tsx`, adicione dentro do componente `Routes`:

```tsx
<Route path="/nova-rota" element={<P.NovaPaginaPage />} />
```

### 3. Considerações

- Use `AppLayoutSidebar` como wrapper para rotas que precisam do layout padrão
- Rotas territoriais devem usar `TerritorialLayout`
- Sempre use lazy loading para páginas não-críticas

---

## Padrões de Rota

### Territorial (Geográfica)

```
/:state/:city                                  # Hub publico da cidade
/:state/:city/:district                       # Hub publico do bairro
/:state/:city/:groupSlug                      # Hub publico do grupo territorial
/empresas/:state/:city                        # Vitrine publica do modulo na cidade
/empresas/:state/:city/:district              # Vitrine publica do modulo no bairro
/empresas/:state/:city/:groupSlug             # Vitrine publica do modulo no grupo
/:communitySlug                               # URL curta publica da comunidade
/:communitySlug/empresas                      # Empresas da comunidade
/:communitySlug/:slug                         # Detalhe publico preferencial de empresa/restaurante
/:communitySlug/empresas/:slug                # Alias legado; redireciona para /:communitySlug/:slug
/:communitySlug/gastronomia                   # Gastronomia da comunidade
/:communitySlug/gastronomia/:slug             # Alias legado; redireciona para /:communitySlug/:slug
/comunidade/:state/:city                      # Fallback tecnico de comunidade municipal
/comunidade/:state/:city/:communitySlug       # Fallback tecnico de bairro/grupo
/comunidade/:state/:city/feed                 # Fallback tecnico do feed comunitario municipal
/empresas/:state/:city/:district/:businessSlug # Fallback legado de detalhe; redireciona se houver alias
/gastronomia/:state/:city/:district/:slug     # Fallback legado de detalhe; redireciona para URL publica da empresa
/p/:slug                                      # Mini-site premium, separado da URL publica da empresa
```

Regra de intencao:

- Rotas diretas de modulo (`/empresas/...`, `/servicos/...`) sao vitrines publicas e SEO.
- Rotas curtas `/:communitySlug/...` sao a experiencia social/local com contexto comunitario.
- `/:communitySlug` so e valido quando existe alias publico unico em
  `community_public_aliases`; em caso de colisao, a rota territorial fica como fallback tecnico.
- Detalhes publicos de empresa e restaurante usam `/:communitySlug/:slug`.
- Detalhes em `/:communitySlug/empresas/:slug`,
  `/:communitySlug/gastronomia/:slug` e
  `/empresas/:state/:city/:district/:slug` sao aliases legados e redirecionam
  para a URL curta quando ha alias publico resolvido pelo SSOT territorial.
- Detalhe em `/gastronomia/:state/:city/:district/:slug` e legado; quando o
  snapshot resolve a empresa, redireciona para a URL publica da empresa.
- `/comunidade/:communitySlug...` e alias legado; deve redirecionar para
  `/:communitySlug...`.
- Em comunidade, a URL publica nao expoe tipo tecnico (`district` vs `territorial_group`):
  `/:communitySlug` ou `/comunidade/:state/:city/:communitySlug` como fallback tecnico.
- O premium usa `/p/:slug`; ele nao substitui a URL publica canonica da empresa.
- Nenhuma rota publica de comunidade usa `/area/`.
- Rotas operacionais ficam em `/central`.
- Rotas de identidade/configuracao pessoal ficam em `/conta`.

### Admin

```
/admin
/admin/:module
/admin/:module/:acao
```

### Módulos

```
/mobilidade/passageiro
/central
/central/motorista
/central/motoboy
```

---

## Manutenção

### Quando Modificar

- **Novas páginas**: Adicionar lazy import + rota
- **Remover páginas**: Remover lazy import + rota
- **Renomear rotas**: Atualizar path canônico único (sem manter padrão legado durante desenvolvimento)

### Validar Alterações

```bash
npm run typecheck
npm run lint
npm run test
```

---

## Histórico

| Data | Mudança | Autor |
|------|---------|-------|
| 2026-04-16 | Criação do sistema de rotas separado | Cascade |
| 2026-04-16 | Refatoração App.tsx (604 → 73 linhas) | Cascade |

---

*Documento mantido pela equipe de Frontend*
