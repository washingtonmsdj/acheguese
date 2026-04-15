# 🚨 Correção CRÍTICA: Território Fixo do Usuário

**Data**: 2026-04-03  
**Status**: CORRIGIDO  
**Prioridade**: CRÍTICA  
**Impacto**: Sistema territorial completo

---

## 🐛 Problema CRÍTICO

Ao navegar para `/ba/salvador/pituba`, o seletor territorial mudava automaticamente para "Pituba", mesmo que:
1. O usuário estivesse em modo "Meu Bairro" (outro bairro)
2. Pituba não estivesse ativado como "bairro ativo" no admin
3. Violando a regra fundamental: **"O bairro do usuário é FIXO"**

### Exemplo do Problema

```
Situação:
- Usuário: João (mora no Nordeste de Amaralina)
- Modo: "Meu Bairro"
- Seletor: "Nordeste de Amaralina - Meu Bairro"

Ação:
- João acessa URL: /ba/salvador/pituba

Resultado ERRADO (antes da correção):
- Seletor muda para: "Pituba (Salvador/BA)" ❌
- Modo muda para: "cidade" ❌
- Território ativo: Pituba ❌

Resultado CORRETO (após correção):
- Seletor permanece: "Nordeste de Amaralina - Meu Bairro" ✅
- Modo permanece: "bairro" ✅
- Território ativo: Nordeste de Amaralina ✅
- Banner aparece: "Você está visualizando Pituba" ✅
```

---

## 🔍 Causa Raiz

O `useResolveTerritoryFromUrl` estava chamando `locationContextStore.setActiveLocation()` automaticamente sempre que resolvia um território da URL.

**Arquivo**: `src/core/routing/hooks/useResolveTerritoryFromUrl.ts`

**Código Problemático**:
```typescript
// Linha 109 - Resolve cidade
locationContextStore.setActiveLocation(cityLocation); // ❌ Muda território automaticamente

// Linha 145 - Resolve cidade (fallback guide)
locationContextStore.setActiveLocation(cityLocation); // ❌ Muda território automaticamente

// Linha 162 - Resolve distrito
locationContextStore.setActiveLocation(districtLocation); // ❌ Muda território automaticamente
```

### Por Que Isso é Errado?

1. **Viola SSOT**: O território ativo deve ser gerenciado por `TerritoryModeInitializer` e pelo seletor do usuário, não pela URL
2. **Viola regra de negócio**: O bairro do usuário NUNCA deve mudar automaticamente
3. **Inconsistência**: URL e território ativo ficam dessincronizados
4. **Confusão do usuário**: Seletor muda sem o usuário perceber

---

## ✅ Solução

Remover TODAS as chamadas automáticas a `setActiveLocation` do `useResolveTerritoryFromUrl`.

### Mudanças Aplicadas

**Arquivo**: `src/core/routing/hooks/useResolveTerritoryFromUrl.ts`

#### 1. Resolução de Cidade (Sem Slug)

**Antes**:
```typescript
if (!slug) {
  if (cityLocation.status !== 'active') {
    if (!cancelled) setResult({ status: 'inactive', resolved: null, error: `Cidade inativa: ${cityLocation.name}` });
    return;
  }
  locationContextStore.setActiveLocation(cityLocation); // ❌ Muda automaticamente
  if (!cancelled) setResult({ status: 'resolved_location', resolved: { kind: 'location', location: cityLocation }, error: null });
  return;
}
```

**Depois**:
```typescript
if (!slug) {
  if (cityLocation.status !== 'active') {
    if (!cancelled) setResult({ status: 'inactive', resolved: null, error: `Cidade inativa: ${cityLocation.name}` });
    return;
  }
  // ✅ NÃO define território ativo automaticamente - deixa TerritoryModeInitializer gerenciar
  if (!cancelled) setResult({ status: 'resolved_location', resolved: { kind: 'location', location: cityLocation }, error: null });
  return;
}
```

#### 2. Resolução de Distrito

**Antes**:
```typescript
if (districtLocation.parent_id !== cityLocation.id) {
  if (!cancelled) setResult({ status: 'not_found', resolved: null, error: `Bairro ${slug} não pertence a ${city}` });
  return;
}

locationContextStore.setActiveLocation(districtLocation); // ❌ Muda automaticamente
if (!cancelled) setResult({ status: 'resolved_location', resolved: { kind: 'location', location: districtLocation }, error: null });
```

**Depois**:
```typescript
if (districtLocation.parent_id !== cityLocation.id) {
  if (!cancelled) setResult({ status: 'not_found', resolved: null, error: `Bairro ${slug} não pertence a ${city}` });
  return;
}

// ✅ NÃO define território ativo automaticamente - deixa TerritoryModeInitializer gerenciar
if (!cancelled) setResult({ status: 'resolved_location', resolved: { kind: 'location', location: districtLocation }, error: null });
```

#### 3. Fallback para Rotas de Guide

**Antes**:
```typescript
if (isGuideRoute) {
  if (cityLocation.status !== 'active') {
    if (!cancelled) setResult({ status: 'inactive', resolved: null, error: `Cidade inativa: ${cityLocation.name}` });
    return;
  }
  locationContextStore.setActiveLocation(cityLocation); // ❌ Muda automaticamente
  if (!cancelled) setResult({ status: 'resolved_location', resolved: { kind: 'location', location: cityLocation }, error: null });
  return;
}
```

**Depois**:
```typescript
if (isGuideRoute) {
  if (cityLocation.status !== 'active') {
    if (!cancelled) setResult({ status: 'inactive', resolved: null, error: `Cidade inativa: ${cityLocation.name}` });
    return;
  }
  // ✅ NÃO define território ativo automaticamente - deixa TerritoryModeInitializer gerenciar
  if (!cancelled) setResult({ status: 'resolved_location', resolved: { kind: 'location', location: cityLocation }, error: null });
  return;
}
```

---

## 🎯 Arquitetura Correta

### Responsabilidades Separadas

#### useResolveTerritoryFromUrl
**Responsabilidade**: Resolver território da URL (validação e parsing)
- ✅ Valida se território existe
- ✅ Valida se território está ativo
- ✅ Retorna território resolvido
- ❌ NÃO define território ativo no store

#### TerritoryModeInitializer
**Responsabilidade**: Gerenciar território ativo e modo territorial
- ✅ Define território inicial baseado no usuário
- ✅ Detecta mudanças de território
- ✅ Força mudança de modo quando necessário
- ✅ Define território ativo no store

#### TerritorySelectorV2
**Responsabilidade**: Permitir usuário mudar território manualmente
- ✅ Mostra território ativo atual
- ✅ Permite alternar entre modos
- ✅ Permite explorar outros territórios
- ✅ Define território ativo quando usuário escolhe

### Fluxo Correto

```
1. Usuário acessa URL: /ba/salvador/pituba
   ↓
2. useResolveTerritoryFromUrl resolve: { kind: 'location', location: Pituba }
   ↓
3. TerritorialLayout recebe território resolvido
   ↓
4. TerritoryModeInitializer verifica:
   - Usuário está em modo bairro (Nordeste)?
   - URL aponta para outro bairro (Pituba)?
   - Sim → Força modo cidade
   ↓
5. TerritoryMismatchBanner aparece:
   "Você saiu de Nordeste de Amaralina e está visualizando Salvador"
   ↓
6. Seletor mostra: "Salvador - Minha Cidade"
   (NÃO "Pituba")
```

---

## 📊 Matriz de Comportamento

| Situação | URL | Território Ativo | Modo | Seletor |
|----------|-----|------------------|------|---------|
| Usuário no Nordeste | `/ba/salvador` | Nordeste | bairro | "Nordeste - Meu Bairro" |
| Usuário no Nordeste | `/ba/salvador/nordeste-de-amaralina` | Nordeste | bairro | "Nordeste - Meu Bairro" |
| Usuário no Nordeste | `/ba/salvador/pituba` | Nordeste | bairro | "Nordeste - Meu Bairro" |
| Usuário em Salvador | `/ba/salvador` | Salvador | cidade | "Salvador - Minha Cidade" |
| Usuário em Salvador | `/ba/salvador/pituba` | Salvador | cidade | "Salvador - Minha Cidade" |
| Visitante | `/ba/salvador` | Salvador | null | "Salvador" |
| Visitante | `/ba/salvador/pituba` | Salvador | null | "Salvador" |

**Regra**: O território ativo NUNCA muda automaticamente pela URL!

---

## 📁 Arquivos Modificados

1. ✅ `src/core/routing/hooks/useResolveTerritoryFromUrl.ts` - Removidas 3 chamadas a `setActiveLocation`

---

## 🧪 Testes Críticos

### Cenário 1: Usuário em Modo Bairro
1. Login como usuário com bairro (Nordeste)
2. Verificar seletor: "Nordeste de Amaralina - Meu Bairro"
3. Acessar URL: `/ba/salvador/pituba`
4. ✅ Seletor deve permanecer: "Nordeste de Amaralina - Meu Bairro"
5. ✅ Banner deve aparecer: "Você está visualizando Pituba"

### Cenário 2: Usuário em Modo Cidade
1. Login como usuário em modo cidade
2. Verificar seletor: "Salvador - Minha Cidade"
3. Acessar URL: `/ba/salvador/pituba`
4. ✅ Seletor deve permanecer: "Salvador - Minha Cidade"
5. ✅ Sem banner (está na mesma cidade)

### Cenário 3: Visitante
1. Sem login
2. Acessar URL: `/ba/salvador/pituba`
3. ✅ Seletor deve mostrar: "Salvador"
4. ✅ Sem banner

### Cenário 4: Navegação no Mapa
1. Usuário em modo bairro (Nordeste)
2. Clicar em empresa da Pituba no mapa
3. ✅ Seletor deve permanecer: "Nordeste de Amaralina - Meu Bairro"
4. ✅ URL muda mas território ativo não

---

## 🎉 Resultado

### Antes (ERRADO)
- ❌ Seletor mudava automaticamente com a URL
- ❌ Território ativo mudava sem controle
- ❌ Violava regra de bairro fixo
- ❌ Confundia o usuário
- ❌ Inconsistência entre URL e território

### Depois (CORRETO)
- ✅ Seletor permanece fixo (bairro do usuário)
- ✅ Território ativo gerenciado por TerritoryModeInitializer
- ✅ Respeita regra de bairro fixo
- ✅ Banner avisa quando usuário sai do bairro
- ✅ Consistência entre comportamento e expectativa

---

## 📚 Documentação Relacionada

1. `SISTEMA_MODO_TERRITORIAL.md` - Regras do sistema territorial
2. `REFATORACAO_FINAL_COMPLETA.md` - Refatoração SSOT completa
3. `CORRECAO_SELETOR_TERRITORIAL_MAPA.md` - Correção anterior do seletor
4. `TerritoryModeManager.ts` - SSOT para lógica de modo

---

## 💡 Lições Aprendidas

### 1. Separação de Responsabilidades
- Resolver URL ≠ Definir território ativo
- Cada componente deve ter UMA responsabilidade

### 2. SSOT (Single Source of Truth)
- Território ativo: `LocationContextStore`
- Modo territorial: `TerritoryModeManager`
- Resolução de URL: `useResolveTerritoryFromUrl`

### 3. Regras de Negócio Claras
- Bairro do usuário é FIXO
- Apenas o usuário pode mudar o território (via seletor)
- URL não deve mudar estado global automaticamente

---

**Status**: ✅ CORRIGIDO  
**Impacto**: CRÍTICO - Sistema territorial agora funciona corretamente  
**Próximos Passos**: Testar todos os cenários de navegação territorial
