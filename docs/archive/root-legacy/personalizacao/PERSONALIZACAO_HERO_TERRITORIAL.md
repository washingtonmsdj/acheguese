# Personalização do Hero por Território

## Problema Identificado

A página de Vagas já tinha personalização territorial no hero (ex: "Vagas de Emprego em Complexo do Nordeste de Amaralina"), mas outras páginas usavam textos genéricos como "Perto de Você" ou "Seu Bairro".

## Solução Implementada

Todas as páginas de landing agora extraem o nome do território resolvido e o usam no título do hero com a preposição adequada em português, seguindo o mesmo padrão da página de Vagas.

### Padrão Aplicado

```typescript
// 1. Extrair nome do território
const territoryName = useMemo(() => {
  if (!resolved) return "fallback genérico";
  const name = resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
  return name;
}, [resolved]);

// 2. Usar no hero com preposição adequada
<h1>
  Título Principal<br />
  <span className="text-primary">em {territoryName}</span>
</h1>
```

### Semântica das Preposições

Cada página usa a preposição mais natural em português:

- **"em"**: Para localização (vagas em, compre em)
- **"de"**: Para posse/origem (empresas de)
- **"no/na"**: Para contexto específico (profissional no/na)

## Páginas Atualizadas

### ✅ Vagas
- **Antes**: "Vagas de Emprego Em Salvador" (fixo)
- **Depois**: "Vagas de Emprego em {territoryName}" (dinâmico)
- **Exemplo**: "Vagas de Emprego em Complexo do Nordeste de Amaralina"
- **Arquivo**: `src/modules/vagas/pages/VagasListingPage.tsx`

### ✅ Serviços
- **Antes**: "Encontre o Profissional Ideal Perto de Você"
- **Depois**: "Encontre o Profissional Ideal no/na {territoryName}"
- **Exemplo**: "Encontre o Profissional Ideal no Complexo do Nordeste"
- **Semântica**: Usa "no" ou "na" dependendo da vogal inicial
- **Arquivo**: `src/modules/services/pages/ServicosLandingPage.tsx`

### ✅ Empresas
- **Antes**: "Empresas do Seu Bairro"
- **Depois**: "Empresas de {territoryName}"
- **Exemplo**: "Empresas de Salvador"
- **Semântica**: Usa "de" para indicar origem/pertencimento
- **Arquivo**: `src/app/pages/EmpresasLandingPage.tsx`

### ✅ Classificados
- **Antes**: "Compre e Venda No Seu Bairro"
- **Depois**: "Compre e Venda em {territoryName}"
- **Exemplo**: "Compre e Venda em Rio Vermelho"
- **Semântica**: Usa "em" para localização
- **Arquivo**: `src/modules/classifieds/pages/ClassificadosLandingPage.tsx`

### ✅ Mobilidade
- **Antes**: "Seu bairro em movimento"
- **Depois**: "{territoryName} em movimento"
- **Exemplo**: "Ondina em movimento"
- **Arquivo**: `src/modules/mobility/pages/MobilidadeLandingPage.tsx`

## Como Funciona

### Contexto Territorial

Todas as páginas recebem a prop `resolved` que contém informações sobre o território atual:

```typescript
interface ResolvedTerritory {
  kind: 'location' | 'group';
  location?: { name: string; ... };
  group?: { name: string; ... };
}
```

### Exemplos de Personalização

| URL | Território | Hero Exibido |
|-----|-----------|--------------|
| `/vagas` | Salvador | "Vagas de Emprego em Salvador" |
| `/pituba/vagas` | Pituba | "Vagas de Emprego em Pituba" |
| `/complexo-do-nordeste-de-amaralina/servicos` | Complexo do Nordeste | "Encontre o Profissional Ideal no Complexo do Nordeste de Amaralina" |
| `/empresas` | Salvador (padrão) | "Empresas de Salvador" |
| `/rio-vermelho/classificados` | Rio Vermelho | "Compre e Venda em Rio Vermelho" |
| `/ondina/mobilidade` | Ondina | "Ondina em movimento" |

### Fallback

Quando não há território resolvido (raro), cada página usa um fallback apropriado:
- Vagas: "sua região"
- Serviços: "Perto de Você"
- Empresas: "Seu Bairro"
- Classificados: "Seu Bairro"
- Mobilidade: "seu bairro"

## Benefícios

1. **Semântica Correta**: Usa preposições naturais em português ("no Complexo", "em Salvador", "de Pituba")
2. **Consistência**: Todas as páginas seguem o mesmo padrão de personalização
3. **SEO**: Títulos específicos por localização melhoram o ranqueamento local
4. **UX**: Usuários veem imediatamente que o conteúdo é relevante para sua região
5. **Escalabilidade**: Funciona automaticamente para qualquer novo território adicionado

## Detalhes de Implementação

### Serviços - Lógica "no/na"

A página de serviços usa uma lógica especial para escolher entre "no" e "na":

```typescript
const territoryName = useMemo(() => {
  if (!resolved) return "Perto de Você";
  const name = resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
  // Usar "no/na" para melhor semântica em português
  return `n${name.match(/^[aeiouáéíóú]/i) ? 'a' : 'o'} ${name}`;
}, [resolved]);
```

Exemplos:
- "Ondina" → "na Ondina"
- "Complexo do Nordeste" → "no Complexo do Nordeste"
- "Amaralina" → "na Amaralina"
- "Pituba" → "no Pituba"

### Outras Páginas - Preposição Fixa

As demais páginas usam preposições fixas no template:

```typescript
// Extração simples do nome
const territoryName = useMemo(() => {
  if (!resolved) return "fallback";
  return resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
}, [resolved]);

// Uso com preposição no template
<h1>Vagas de Emprego em {territoryName}</h1>
<h1>Empresas de {territoryName}</h1>
<h1>Compre e Venda em {territoryName}</h1>
```


## Próximos Passos

Para adicionar personalização territorial em novas páginas:

1. Certifique-se que a página recebe `resolved` como prop
2. Adicione o hook `useMemo` para extrair o nome do território
3. Escolha a preposição adequada para o contexto ("em", "de", "no/na")
4. Use `{territoryName}` no título do hero
5. Escolha um fallback apropriado para quando não houver território

## Exemplo Completo

### Com preposição fixa

```typescript
import { useMemo } from "react";

interface MinhaPageProps {
  resolved?: ResolvedTerritory;
}

export default function MinhaPage({ resolved }: MinhaPageProps) {
  const territoryName = useMemo(() => {
    if (!resolved) return "sua região";
    return resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
  }, [resolved]);

  return (
    <section>
      <h1>
        Meu Serviço<br />
        <span className="text-primary">em {territoryName}</span>
      </h1>
    </section>
  );
}
```

### Com preposição dinâmica (no/na)

```typescript
import { useMemo } from "react";

export default function MinhaPage({ resolved }: MinhaPageProps) {
  const territoryName = useMemo(() => {
    if (!resolved) return "Perto de Você";
    const name = resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
    // Escolhe "no" ou "na" baseado na primeira letra
    return `n${name.match(/^[aeiouáéíóú]/i) ? 'a' : 'o'} ${name}`;
  }, [resolved]);

  return (
    <section>
      <h1>
        Meu Serviço<br />
        <span className="text-primary">{territoryName}</span>
      </h1>
    </section>
  );
}
```
