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
/comunidade/:state/:city                      # Comunidade municipal (canonica publica)
/comunidade/:state/:city/feed                 # Feed comunitario municipal
/empresas/:state/:city/:district/:businessSlug # Detalhe especifico de empresa
```

Regra de intencao:

- Rotas diretas de modulo (`/empresas/...`, `/servicos/...`) sao vitrines publicas e SEO.
- Rotas dentro de `/comunidade/...` sao experiencia social/local com contexto comunitario.
- Em comunidade, a URL publica nao expoe tipo tecnico (`district` vs `territorial_group`):
  `/comunidade/:state/:city`.
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
