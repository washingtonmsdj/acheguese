# ✅ Correção: Hero Personalizado na Página de Classificados

## Problema Identificado

A página de Classificados (`ClassificadosPage.tsx`) estava exibindo um hero genérico:
- **Título**: "Classificados perto de você" (fixo)
- **Não mostrava** o nome do bairro ou cidade

Enquanto outras páginas (Vagas, Serviços, Empresas, Mobilidade) já tinham personalização territorial implementada.

## Causa Raiz

Existem DUAS páginas de classificados no projeto:

1. **`ClassificadosPage.tsx`** (em uso) - Estava SEM personalização territorial
2. **`ClassificadosLandingPage.tsx`** - JÁ tinha personalização territorial

O arquivo `TerritorialModulePages.tsx` estava importando a `ClassificadosPage`, que não tinha a extração do `territoryName`.

## Solução Aplicada

Adicionei a personalização territorial na `ClassificadosPage.tsx` seguindo o mesmo padrão das outras páginas:

### 1. Extração do Nome do Território

```typescript
// ✅ Extrair nome do território resolvido
const territoryName = useMemo(() => {
  if (!resolved) return "Sua Região";
  const name = resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
  return name;
}, [resolved]);
```

### 2. Uso no Hero

```tsx
<CanonicalHero
  moduleName="Classificados"
  moduleIcon={ShoppingBag}
  territoryName={territoryName}
  territoryFallback="Sua Região"
  title="Compre e Venda"
  titleHighlight={`em ${territoryName}`}
  subtitle={activeCount > 0
    ? `${activeCount} anúncios disponíveis em ${territoryName}`
    : `Móveis, eletrônicos, veículos e muito mais. Anúncios gratuitos de pessoas da sua comunidade.`}
  primaryCTA={{
    label: "Anunciar Grátis",
    icon: Plus,
    onClick: handleNewClassificado,
  }}
/>
```

## Resultado

### Antes ❌
- Título: "Classificados perto de você"
- Subtítulo: "X anúncios disponíveis na sua região"

### Depois ✅
- Título: "Compre e Venda **em Complexo do Nordeste de Amaralina**"
- Subtítulo: "X anúncios disponíveis em **Complexo do Nordeste de Amaralina**"

## Status de Personalização Territorial por Página

| Página | Status | Padrão de Título |
|--------|--------|------------------|
| ✅ Vagas | Implementado | "Vagas de Emprego em {território}" |
| ✅ Serviços | Implementado | "Encontre o Profissional Ideal no/na {território}" |
| ✅ Empresas | Implementado | "Empresas de {território}" |
| ✅ Classificados | **CORRIGIDO** | "Compre e Venda em {território}" |
| ✅ Mobilidade | Implementado | "{território} em movimento" |
| ✅ Gastronomia | Implementado | Usa `full_name` do território |
| ✅ Pontos Turísticos | Implementado | "O que você quer visitar hoje?" + subtítulo com território |

## Situação das Páginas de Classificados

O projeto tem DUAS páginas de classificados válidas:

1. **`ClassificadosPage.tsx`** - Página principal em uso nas rotas territoriais
   - Importada em `TerritorialModulePages.tsx`
   - Tem seções: Em Alta, Mais Procurados, Destaques
   - Categorias de destaque visuais
   - ✅ CORRIGIDA com personalização territorial

2. **`ClassificadosLandingPage.tsx`** - Página alternativa/complementar
   - Também tem personalização territorial implementada
   - Experiência item-first
   - Pode ser usada em outras rotas

Ambas são páginas válidas, mas a `ClassificadosPage.tsx` é a principal em uso.

## Arquivos Modificados

- `src/modules/classifieds/pages/ClassificadosPage.tsx`
  - Adicionado `useMemo` para extrair `territoryName`
  - Atualizado `CanonicalHero` com `territoryName` e `titleHighlight` dinâmico
  - Atualizado subtítulo para incluir o nome do território

## Como Testar

1. Acesse qualquer URL territorial de classificados:
   - `/br/ba/salvador/classificados`
   - `/br/ba/salvador/pituba/classificados`
   - `/br/ba/salvador/complexo-do-nordeste-de-amaralina/classificados`

2. Verifique que o hero mostra:
   - Título: "Compre e Venda em {nome do bairro/cidade}"
   - Subtítulo com o nome do território

3. Mude de bairro usando o seletor territorial e veja o hero atualizar automaticamente

## Padrão Estabelecido

Todas as páginas de módulo agora seguem o mesmo padrão:

```typescript
// 1. Extrair território
const territoryName = useMemo(() => {
  if (!resolved) return "Fallback";
  return resolved.kind === 'location' 
    ? resolved.location.name 
    : resolved.group.name;
}, [resolved]);

// 2. Usar no hero com preposição adequada
<CanonicalHero
  territoryName={territoryName}
  title="Título Principal"
  titleHighlight={`preposição ${territoryName}`}
/>
```

## Benefícios

1. **Consistência**: Todas as páginas seguem o mesmo padrão
2. **SEO**: Títulos específicos por localização melhoram ranqueamento
3. **UX**: Usuários veem imediatamente que o conteúdo é da região deles
4. **Escalabilidade**: Funciona automaticamente para qualquer território
