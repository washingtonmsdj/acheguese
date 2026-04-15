# ✅ Organização do Módulo Community

## Status: Páginas Já Organizadas Corretamente

Todas as páginas de comunidade já estão no local correto: `src/modules/community/pages/`

## Estrutura Atual

```
src/modules/community/pages/
├── ComunidadePage.tsx              ✅ Feed principal da comunidade
├── RecomendacoesPage.tsx           ✅ Perguntas e respostas (Q&A)
├── AchadosPerdidosPage.tsx         ✅ Achados e perdidos
├── NovaRecomendacaoPage.tsx        ✅ Criar nova pergunta
├── RecomendacaoDetailPage.tsx      ✅ Detalhes da pergunta
├── NovoAchadoPerdidoPage.tsx       ✅ Criar novo achado/perdido
├── AchadoPerdidoDetailPage.tsx     ✅ Detalhes do achado/perdido
├── AlertasPage.tsx                 ✅ Alertas de segurança
├── EventosPage.tsx                 ✅ Eventos da comunidade
├── EventoDetailPage.tsx            ✅ Detalhes do evento
├── GruposPage.tsx                  ✅ Grupos da comunidade
├── GrupoDetailPage.tsx             ✅ Detalhes do grupo
└── ExamplePostPage.tsx             ✅ Exemplo de post
```

## Rotas Configuradas

### Feed
- `/comunidade` → `ComunidadePage`
- `/comunidade/alertas` → `AlertasPage`

### Recomendações (Q&A)
- `/recomendacoes` → `RecomendacoesPage`
- `/recomendacoes/nova` → `NovaRecomendacaoPage`
- `/recomendacoes/:id` → `RecomendacaoDetailPage`

### Achados e Perdidos
- `/achados-perdidos` → `AchadosPerdidosPage`
- `/achados-perdidos/novo` → `NovoAchadoPerdidoPage`
- `/achados-perdidos/:id` → `AchadoPerdidoDetailPage`

### Eventos
- `/eventos` → `EventosPage`
- `/eventos/:id` → `EventoDetailPage`

### Grupos
- `/grupos` → `GruposPage`
- `/grupos/:id` → `GrupoDetailPage`

## Arquitetura do Módulo

```
src/modules/community/
├── pages/                          ✅ Todas as páginas da comunidade
├── components/                     ✅ Componentes específicos
│   ├── feed/                      ✅ Componentes do feed
│   ├── post/                      ✅ Componentes de posts
│   ├── alerts/                    ✅ Componentes de alertas
│   └── ...
├── hooks/                          ✅ Hooks do módulo
│   ├── page/                      ✅ Hooks de páginas
│   ├── feed/                      ✅ Hooks do feed
│   └── ...
└── index.ts                        ✅ Exports centralizados
```

## Serviços Utilizados (SSOT)

As páginas usam serviços centralizados do `core`:

### Feed (ComunidadePage)
- `PostService` - CRUD de posts
- `CommentService` - Comentários
- `ProfileService` - Dados de perfis

### Recomendações (RecomendacoesPage)
- `CommunityQAService` - Perguntas e respostas
- `ProfileService` - Dados de autores
- `ProfessionalService` - Menções de profissionais

### Achados (AchadosPerdidosPage)
- `PostService` - Posts de achados/perdidos
- `ProfileService` - Dados de autores

## Navegação entre Páginas

### Menu Principal
O menu principal da aplicação inclui links para:
- Feed (`/comunidade`)
- Recomendações (`/recomendacoes`)
- Achados (`/achados-perdidos`)
- Eventos (`/eventos`)
- Grupos (`/grupos`)

### Navegação Interna
Dentro do módulo community, há navegação entre:
- Feed → Detalhes do post
- Recomendações → Nova pergunta → Detalhes
- Achados → Novo achado → Detalhes
- Eventos → Detalhes do evento
- Grupos → Detalhes do grupo

## Componentes Compartilhados

### Usados por Múltiplas Páginas
- `UnifiedPostCard` - Card de post usado no feed
- `PostForm` - Formulário de criação de posts
- `CommentList` - Lista de comentários
- `CreatePostButton` - Botão de criar post
- `CommunityRightSidebar` - Sidebar direita

### Específicos de Cada Página
- `QuestionsList` - Lista de perguntas (Recomendações)
- `CategoryFilters` - Filtros de categoria (Recomendações)
- `AlertCard` - Card de alerta (Alertas)
- `EventCard` - Card de evento (Eventos)
- `GroupCard` - Card de grupo (Grupos)

## Hooks Especializados

### Hooks de Página
- `useComunidadePage` - Lógica da página de feed
- `useRecomendacoes` - Lógica da página de recomendações
- `useRecomendacaoDetail` - Detalhes de pergunta
- `useAchadosPerdidos` - Lógica de achados/perdidos

### Hooks de Funcionalidade
- `useCommunityFeed` - Feed de posts
- `usePost` - Operações com posts
- `useComments` - Operações com comentários
- `useCommunityLocation` - Localização da comunidade

## Integração com Core

Todas as páginas seguem o padrão SSOT:

```typescript
// ❌ NÃO fazer acesso direto ao Supabase
const { data } = await supabase.from('posts').select('*');

// ✅ Usar serviços do core
const posts = await PostService.getPosts(filters);
```

## Verificação de Conformidade

✅ Todas as páginas estão em `src/modules/community/pages/`  
✅ Todas as páginas usam serviços do `core`  
✅ Todas as páginas usam hooks especializados  
✅ Todas as páginas seguem o padrão SSOT  
✅ Todas as rotas estão configuradas em `App.tsx`  
✅ Todas as páginas têm lazy loading  

## Conclusão

A organização do módulo `community` está correta e seguindo as melhores práticas:

1. **Separação clara:** Páginas, componentes e hooks bem organizados
2. **SSOT:** Uso de serviços centralizados
3. **Reutilização:** Componentes compartilhados entre páginas
4. **Performance:** Lazy loading de páginas
5. **Manutenibilidade:** Estrutura clara e documentada

Não é necessário mover nenhum arquivo. A estrutura já está otimizada! ✨

---

**Data:** 2026-03-31  
**Status:** ✅ Organização Validada
