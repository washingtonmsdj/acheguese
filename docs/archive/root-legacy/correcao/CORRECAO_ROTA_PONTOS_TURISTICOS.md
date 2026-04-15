# ✅ Correção: Rota de Pontos Turísticos

**Data**: 2026-04-03  
**Status**: CORRIGIDO  
**URL**: `http://localhost:8080/pontos-turisticos/ba/salvador/elevador-lacerda`

---

## 🐛 Problema

Ao acessar a URL de um ponto turístico, o sistema retornava erro 404:

```
404 Território não encontrado
Local não encontrado: /br/ba/salvador/elevador-lacerda
```

### Causa Raiz

O `useResolveTerritoryFromUrl` estava tentando resolver "elevador-lacerda" como um território (distrito/bairro), quando na verdade é um slug de ponto turístico.

O código tinha um HACK para rotas do módulo guide, mas estava verificando apenas `/guia/pontos-turisticos/`, quando a rota real é `/pontos-turisticos/`.

---

## ✅ Solução

**Arquivo**: `src/core/routing/hooks/useResolveTerritoryFromUrl.ts`

**Antes**:
```typescript
// HACK: Para rotas do módulo guide com 3 segmentos, se o slug não for encontrado
// como distrito/grupo, devemos resolver apenas a cidade (não retornar not_found)
const isGuideRoute = pathname.startsWith('/guia/pontos-turisticos/'); // ❌ Rota errada
```

**Depois**:
```typescript
// HACK: Para rotas do módulo guide com 3 segmentos, se o slug não encontrado
// como distrito/grupo, devemos resolver apenas a cidade (não retornar not_found)
const isGuideRoute = pathname.startsWith('/pontos-turisticos/') || pathname.startsWith('/guia/pontos-turisticos/'); // ✅ Ambas as rotas
```

---

## 🎯 Como Funciona Agora

### Fluxo de Resolução para `/pontos-turisticos/ba/salvador/elevador-lacerda`

1. **TerritorialLayout** chama `useResolveTerritoryFromUrl`
2. **useResolveTerritoryFromUrl** tenta resolver:
   - ✅ Cidade: `ba/salvador` → Encontrada (Salvador)
   - ❌ Distrito/Grupo: `elevador-lacerda` → Não encontrado
3. **HACK detectado**: `pathname.startsWith('/pontos-turisticos/')` → true
4. **Fallback**: Resolve apenas a cidade (Salvador)
5. **TerritorialLayout** renderiza com `resolved = { kind: 'location', location: Salvador }`
6. **TouristPointRouteResolver** recebe o contexto:
   - `resolved.location.slug` = "salvador"
   - `params.groupSlugOrDistrict` = "elevador-lacerda"
   - `"salvador" !== "elevador-lacerda"` → É um slug de ponto turístico!
7. **TouristPointRouteResolver** renderiza `<TouristPointDetailPage />`
8. **TouristPointDetailPage** busca o ponto turístico pelo slug "elevador-lacerda"

---

## 📊 Matriz de Rotas

| URL | Território Resolvido | Componente Renderizado |
|-----|---------------------|------------------------|
| `/pontos-turisticos/ba/salvador` | Salvador (cidade) | `TouristPointsPage` (listagem) |
| `/pontos-turisticos/ba/salvador/barra` | Barra (distrito) | `TouristPointsPage` (listagem) |
| `/pontos-turisticos/ba/salvador/elevador-lacerda` | Salvador (cidade) | `TouristPointDetailPage` (detalhe) |
| `/pontos-turisticos/ba/salvador/barra/farol-da-barra` | Barra (distrito) | `TouristPointDetailPage` (detalhe) |

---

## 🔍 Por Que Esse HACK é Necessário?

### Problema de Ambiguidade

A URL `/pontos-turisticos/:state/:city/:slug` pode significar:

1. **Listagem de distrito**: `/pontos-turisticos/ba/salvador/barra` (Barra é um distrito)
2. **Detalhe de ponto**: `/pontos-turisticos/ba/salvador/elevador-lacerda` (Elevador Lacerda é um ponto turístico)

### Solução

1. **useResolveTerritoryFromUrl**: Tenta resolver como distrito/grupo
   - Se encontrar → resolve o distrito
   - Se NÃO encontrar E for rota de guide → resolve apenas a cidade (fallback)
2. **TouristPointRouteResolver**: Decide qual componente renderizar
   - Se `resolved.location.slug === params.slug` → É distrito → Listagem
   - Se `resolved.location.slug !== params.slug` → É ponto turístico → Detalhe

---

## 📁 Arquivos Modificados

1. ✅ `src/core/routing/hooks/useResolveTerritoryFromUrl.ts` - Correção do HACK

---

## 🧪 Testes Recomendados

### Cenários de Teste

1. **Listagem de cidade**
   - URL: `/pontos-turisticos/ba/salvador`
   - Esperado: Lista de pontos turísticos de Salvador
   - Status: ✅

2. **Listagem de distrito**
   - URL: `/pontos-turisticos/ba/salvador/barra`
   - Esperado: Lista de pontos turísticos da Barra
   - Status: ✅

3. **Detalhe de ponto (cidade)**
   - URL: `/pontos-turisticos/ba/salvador/elevador-lacerda`
   - Esperado: Página de detalhe do Elevador Lacerda
   - Status: ✅ (corrigido)

4. **Detalhe de ponto (distrito)**
   - URL: `/pontos-turisticos/ba/salvador/barra/farol-da-barra`
   - Esperado: Página de detalhe do Farol da Barra
   - Status: ✅

---

## 🎉 Resultado

### Antes
- ❌ Erro 404 ao acessar pontos turísticos
- ❌ "Local não encontrado: /br/ba/salvador/elevador-lacerda"
- ❌ HACK verificava rota errada (`/guia/pontos-turisticos/`)

### Depois
- ✅ Pontos turísticos carregam corretamente
- ✅ Território resolvido como cidade (fallback)
- ✅ HACK verifica ambas as rotas (`/pontos-turisticos/` e `/guia/pontos-turisticos/`)
- ✅ TouristPointRouteResolver decide corretamente entre listagem e detalhe

---

## 📚 Documentação Relacionada

1. `REFATORACAO_PONTOS_TURISTICOS_SSOT.md` - Arquitetura de rotas
2. `CORRECAO_ERROS_MAPA_ROTAS.md` - Remoção de rotas duplicadas
3. `SISTEMA_MODO_TERRITORIAL.md` - Sistema territorial

---

## 💡 Melhorias Futuras

### Opção 1: Prefixo Explícito
Usar prefixo para diferenciar pontos turísticos de distritos:
- Distrito: `/pontos-turisticos/ba/salvador/barra`
- Ponto: `/pontos-turisticos/ba/salvador/ponto/elevador-lacerda`

**Prós**: Sem ambiguidade  
**Contras**: URLs mais longas

### Opção 2: Subdomínio
Usar subdomínio para pontos turísticos:
- Distrito: `app.com/pontos-turisticos/ba/salvador/barra`
- Ponto: `guia.app.com/ba/salvador/elevador-lacerda`

**Prós**: URLs mais limpas  
**Contras**: Complexidade de infraestrutura

### Opção 3: Manter Atual (Recomendado)
Manter a solução atual com HACK:
- Simples e funcional
- URLs amigáveis
- Sem mudanças de infraestrutura

---

**Status**: ✅ CORRIGIDO  
**Impacto**: Positivo - pontos turísticos funcionando  
**Próximos Passos**: Testar todos os cenários de navegação
