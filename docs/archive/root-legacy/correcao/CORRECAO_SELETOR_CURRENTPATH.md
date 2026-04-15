# Correção: Seletor não atualiza ao mudar território

## Problema Identificado

O `TerritorySelectorV2` não atualizava visualmente quando o usuário navegava de cidade para bairro. O seletor continuava mostrando "Salvador" mesmo após navegar para um bairro.

### Causa Raiz

Nas linhas 340, 360 e 375 do `TerritorySelectorV2.tsx`, havia referências a uma variável `currentPath` que não existia mais:

```tsx
// ❌ ERRO: currentPath não definido
isActive={currentPath === territory.path}
```

A prop `currentPath` havia sido removida da interface do componente, mas as referências internas não foram atualizadas.

## Solução Implementada

Substituído `currentPath` por comparação usando `activeLocation` do store (SSOT):

```tsx
// ✅ CORRETO: Usa activeLocation do store
isActive={activeLocation?.geographic_path.replace(/^\/br/, '') === territory.path}
```

### Arquivos Modificados

1. **src/core/location/components/TerritorySelectorV2.tsx**
   - Linha ~340: Resultados de busca
   - Linha ~360: Territórios do usuário
   - Linha ~375: Territórios disponíveis

## Validação

- ✅ Sem erros de TypeScript
- ✅ Usa SSOT (`activeLocation` do store)
- ✅ Sem gambiarras ou parsing de strings
- ✅ Comparação consistente em todas as seções do seletor

## Comportamento Esperado

1. Usuário está em `/ba/salvador` → Seletor mostra "Salvador" ativo
2. Usuário navega para `/ba/salvador/barra` → Seletor atualiza para "Barra" ativo
3. Usuário abre o seletor → "Barra" aparece destacado como território ativo
4. Navegação contextual preservada (módulos mantêm sufixo na URL)

## Arquitetura

A solução segue o padrão SSOT estabelecido:
- `activeLocation` é a única fonte de verdade para território ativo
- Todos os componentes consomem do store, não de props estáticas
- Comparação de paths normalizada (remove `/br` prefix)
- Reatividade automática via `useSyncExternalStore`
