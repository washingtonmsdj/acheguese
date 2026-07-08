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
/comunidade/:communitySlug                    # Portal publico/preview da comunidade
/comunidade/:communitySlug/empresas           # Empresas dentro do contexto da comunidade
/comunidade/:communitySlug/empresas/:slug     # Empresa com acoes comunitarias
/comunidade/:communitySlug/gastronomia        # Gastronomia dentro do contexto da comunidade
/comunidade/:communitySlug/gastronomia/:slug  # Gastronomia com acoes comunitarias
/:communitySlug                               # Alias curto legado do portal; normaliza para /comunidade/:communitySlug quando inequivoco
/:communitySlug/empresas/:slug                # Alias legado de entidade; nao e superficie canonica e falha quando nao canonico
/:communitySlug/gastronomia/:slug             # Alias legado de entidade; nao e superficie canonica e falha quando nao canonico
/comunidade/:state/:city                      # Fallback tecnico de comunidade municipal
/comunidade/:state/:city/:communitySlug       # Fallback tecnico de bairro/grupo
/comunidade/:state/:city/feed                 # Fallback tecnico do feed comunitario municipal
/empresas/:state/:city/:district/:businessSlug # Detalhe publico canonico de empresa
/gastronomia/:state/:city/:district/:slug     # Detalhe publico de gastronomia quando existir; senao resolve empresa
/p/:slug                                      # Mini-site premium, separado da URL publica da empresa
```

Regra de intencao:

- Rotas diretas de modulo (`/empresas/...`, `/servicos/...`) sao vitrines publicas e SEO.
- Rotas em `/comunidade/:communitySlug/...` sao a experiencia social/local com contexto comunitario.
- `/:communitySlug` e compatibilidade curta do portal e so e valido quando existe alias publico
  unico em `community_public_aliases`; em caso de colisao, a rota territorial fica como fallback
  tecnico.
- Detalhes publicos de empresa e restaurante usam `/empresas/:state/:city/:district/:slug`.
- Detalhes em `/:communitySlug/empresas/:slug`,
  `/:communitySlug/gastronomia/:slug` e `/:communitySlug/:slug` sao aliases
  legados de entidade, nao sao emitidos por codigo novo e falham visivelmente quando nao
  correspondem a uma rota comunitaria canonica.
- Detalhe em `/gastronomia/:state/:city/:district/:slug` deve permanecer publico;
  se a vertical nao tiver detalhe proprio, resolve para a URL publica da empresa.
- `/comunidade/:communitySlug...` e rota canonica do portal comunitario.
- Em comunidade, a URL canonica do portal nao expoe tipo tecnico (`district` vs `territorial_group`).
  O alias curto `/:communitySlug` permanece somente como compatibilidade; o fallback tecnico
  continua em `/comunidade/:state/:city/:communitySlug`.
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
