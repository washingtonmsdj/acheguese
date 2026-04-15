# Roteamento: Cidade vs Bairro

## ✅ Problema Resolvido

Quando o usuário acessa `/ba/salvador`, agora o sistema mostra a **CidadeLandingPage** ao invés da **TerritorialLandingPage**.

## 🐛 Problema Encontrado e Corrigido

### Erro Inicial
O código estava verificando `resolved.location.level === 'city'`, mas o campo correto é `resolved.location.type`.

### Correção Aplicada
Mudado de `location.level` para `location.type` no arquivo `TerritorialIndexPage.tsx`.

## Lógica de Roteamento

### Antes
- `/ba/salvador` → TerritorialLandingPage (página genérica para bairros)
- `/ba/salvador/nordeste-de-amaralina` → TerritorialLandingPage

### Depois
- `/ba/salvador` → **CidadeLandingPage** (conteúdo rico para cidades)
- `/ba/salvador/nordeste-de-amaralina` → TerritorialLandingPage (mantém para bairros)

## Implementação

### Arquivo Modificado
`src/core/routing/components/TerritorialIndexPage.tsx`

### Código
```typescript
export function TerritorialIndexPage() {
  const { resolved } = useTerritorialContext();

  // Se for uma cidade (location com type='city'), mostra CidadeLandingPage
  if (resolved?.kind === 'location' && resolved.location.type === 'city') {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <CidadeLandingPage />
      </Suspense>
    );
  }

  // Caso contrário (bairro ou grupo), mostra TerritorialLandingPage
  return <TerritorialLandingPage />;
}
```

### Correção Importante
O campo correto é `location.type` (não `location.level`). Os valores possíveis são:
- `'city'` - Cidade
- `'district'` - Bairro
- `'state'` - Estado
- `'country'` - País

## Como Funciona

1. O `TerritorialLayout` resolve o território a partir da URL usando `useResolveTerritoryFromUrl`
2. O resultado pode ser:
   - `{ kind: 'location', location: { type: 'city', ... } }` → Cidade
   - `{ kind: 'location', location: { type: 'district', ... } }` → Bairro
   - `{ kind: 'group', group: { ... } }` → Grupo territorial
3. O `TerritorialIndexPage` verifica o tipo do território resolvido
4. Se for cidade (`type === 'city'`), renderiza `CidadeLandingPage` (lazy loaded)
5. Caso contrário, renderiza `TerritorialLandingPage`

## Benefícios

- **Conteúdo Rico para Cidades**: A CidadeLandingPage tem seções específicas como:
  - Estatísticas da cidade (população, bairros, empresas)
  - Bairros em destaque
  - Vagas de emprego
  - Pontos turísticos
  - Políticos eleitos
  - Contatos úteis
  - Dados da prefeitura

- **Mantém Compatibilidade**: Bairros e grupos continuam usando a TerritorialLandingPage

- **Lazy Loading**: A CidadeLandingPage só é carregada quando necessário

## Rotas Afetadas

Todas as rotas de cidade no formato `/:state/:city` agora mostram a CidadeLandingPage:
- `/ba/salvador`
- `/sp/sao-paulo`
- `/rj/rio-de-janeiro`
- etc.

## Testes Recomendados

1. Acessar `/ba/salvador` → Deve mostrar CidadeLandingPage
2. Acessar `/ba/salvador/nordeste-de-amaralina` → Deve mostrar TerritorialLandingPage
3. Verificar que os dados da cidade são carregados corretamente
4. Verificar que a navegação entre bairros funciona
