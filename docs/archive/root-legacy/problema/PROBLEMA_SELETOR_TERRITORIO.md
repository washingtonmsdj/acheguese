# Correção: Seletor de Território Manual (SSOT)

## Problema Identificado

O seletor de território estava mudando automaticamente quando o usuário navegava para produtos de outros bairros, violando o princípio de que o seletor deve ser MANUAL.

**Comportamento incorreto:**
- Usuário em modo "Minha Cidade" (Salvador)
- Clica em produto na Barra
- Seletor muda automaticamente para "Salvador > Barra" ❌

## Regras Corretas (SSOT)

1. **Seletor só muda MANUALMENTE** - Usuário deve clicar no seletor para mudar
2. **Navegação NÃO afeta o seletor** - Clicar em produtos de outros bairros não muda o seletor
3. **Modo persiste** - Se está em "Minha Cidade", continua em "Minha Cidade" mesmo vendo produtos do seu bairro
4. **Bairro do usuário é FIXO** - Não muda para outro bairro automaticamente

## Exemplos de Comportamento Correto

### Cenário 1: Usuário em modo "Minha Cidade"
- Usuário: Pituba (bairro fixo)
- Modo atual: "Minha Cidade" (Salvador)
- Ação: Clica em produto na Barra
- Resultado: Seletor continua mostrando "Salvador" ✅
- Razão: Usuário quer ver produtos de toda a cidade

### Cenário 2: Usuário em modo "Minha Cidade" vê produto do próprio bairro
- Usuário: Pituba (bairro fixo)
- Modo atual: "Minha Cidade" (Salvador)
- Ação: Clica em produto em Pituba
- Resultado: Seletor continua mostrando "Salvador" ✅
- Razão: Usuário não mudou manualmente para "Meu Bairro"

### Cenário 3: Usuário quer ver apenas seu bairro
- Usuário: Pituba (bairro fixo)
- Modo atual: "Minha Cidade" (Salvador)
- Ação: Clica no seletor e escolhe "Meu Bairro"
- Resultado: Seletor muda para "Pituba" ✅
- Razão: Mudança MANUAL pelo usuário

## Mudanças Implementadas

### 1. `useTerritoryModeInitializer.ts`
- **Removido:** Dependência de `activeLocation` no useEffect
- **Removido:** Lógica automática baseada em `TerritoryModeManager.getInitialMode()`
- **Adicionado:** Modo padrão fixo 'cidade' para usuários cadastrados
- **Resultado:** Modo só é definido uma vez no login, nunca muda automaticamente

### 2. `TerritoryModeManager.ts`
- **Removido:** Métodos `getInitialMode()`, `detectMismatch()`, `shouldForceModeChange()`
- **Mantido:** Apenas métodos de validação e utilitários
- **Resultado:** Sem lógica automática de mudança de modo

### 3. Conceitos Separados

**Território da URL** (viewing territory):
- Representa o bairro/cidade do produto sendo visualizado
- Vem dos parâmetros da URL
- Usado apenas para filtrar conteúdo da página

**Território do Usuário** (user territory):
- Representa o bairro/cidade fixo do usuário
- Armazenado no perfil do usuário
- Mostrado no seletor
- Só muda quando usuário clica no seletor

## Fluxo de Navegação

```
1. Usuário faz login
   → Modo inicializado como 'cidade' (padrão)
   → Seletor mostra "Minha Cidade"

2. Usuário navega para /gastronomia/ba/salvador/barra/burger-house
   → URL resolve: Barra (viewing territory)
   → Seletor continua mostrando "Salvador" (user territory)
   → Conteúdo filtrado pela URL (Barra)

3. Usuário quer ver apenas seu bairro
   → Clica no seletor
   → Escolhe "Meu Bairro"
   → Seletor muda para "Pituba"
   → Navega para /gastronomia/ba/salvador/pituba
   → Conteúdo filtrado por Pituba

4. Usuário quer ver toda a cidade novamente
   → Clica no seletor
   → Escolhe "Minha Cidade"
   → Seletor muda para "Salvador"
   → Navega para /gastronomia/ba/salvador
   → Conteúdo de toda a cidade
```

## Testes Necessários

1. ✅ Usuário em modo cidade clica em produto de outro bairro → seletor não muda
2. ✅ Usuário em modo cidade clica em produto do próprio bairro → seletor não muda
3. ✅ Usuário muda manualmente para modo bairro → seletor muda
4. ✅ Usuário muda manualmente para modo cidade → seletor muda
5. ✅ Visitante navega entre bairros → seletor mostra o bairro da URL
6. ✅ Usuário faz logout e login → modo volta para 'cidade' (padrão)

## Arquivos Modificados

- `src/core/location/hooks/useTerritoryModeInitializer.ts` - Removida lógica automática
- `src/core/location/services/TerritoryModeManager.ts` - Removidos métodos automáticos
- `PROBLEMA_SELETOR_TERRITORIO.md` - Atualizado com solução correta
