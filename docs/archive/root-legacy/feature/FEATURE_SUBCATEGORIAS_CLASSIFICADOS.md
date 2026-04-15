# ✅ Feature: Subcategorias Dinâmicas para Classificados

## 📋 Resumo
Implementado sistema de subcategorias dinâmicas que aparecem automaticamente quando o usuário seleciona uma categoria principal no formulário de criação de anúncios.

## 🎯 Funcionalidades

### 1. Arquivo de Constantes SSOT
**Arquivo:** `src/modules/classifieds/constants/subcategories.ts`

Define subcategorias para cada categoria principal:

- **Veículos**: Carros 🚗, Motos 🏍️, Caminhões 🚚, Ônibus 🚌, Barcos ⛵, Peças 🔧
- **Imóveis**: Apartamento 🏢, Casa 🏠, Kitnet 🏘️, Terreno 🌳, Comercial 🏪, Cobertura 🏙️, Sítio 🌾
- **Eletrônicos**: Celulares 📱, Computadores 💻, Tablets 📲, TVs 📺, Áudio 🎧, Câmeras 📷, Acessórios 🔌
- **Móveis**: Sala 🛋️, Quarto 🛏️, Cozinha 🍽️, Escritório 🪑, Decoração 🖼️, Jardim 🌿
- **Roupas**: Masculino 👔, Feminino 👗, Infantil 👶, Calçados 👟, Acessórios 👜, Esportivo 🏃
- **Games**: Consoles 🎮, Jogos 🕹️, Acessórios 🎧, PC Gaming 💻, Retro 👾
- **Serviços**: Reformas 🔨, Limpeza 🧹, Beleza 💇, Eventos 🎉, Tecnologia 💻, Educação 📚, Saúde ⚕️, Transporte 🚚
- **Vagas**: Tecnologia 💻, Vendas 💼, Administração 📊, Saúde ⚕️, Educação 📚, Serviços Gerais 🔧, Gastronomia 🍽️
- **Outros**: Livros 📚, Esportes ⚽, Animais 🐾, Instrumentos 🎸, Brinquedos 🧸, Ferramentas 🔧

### 2. Helpers Disponíveis

```typescript
// Retorna subcategorias de uma categoria
getSubcategories(categoryId: string): ClassifiedSubcategory[]

// Verifica se categoria tem subcategorias
hasSubcategories(categoryId: string): boolean

// Retorna label da subcategoria
getSubcategoryLabel(categoryId: string, subcategoryId: string): string

// Retorna emoji da subcategoria
getSubcategoryEmoji(categoryId: string, subcategoryId: string): string

// Valida subcategoria
isValidSubcategory(categoryId: string, subcategoryId: string): boolean
```

### 3. Integração no Formulário

**Arquivo:** `src/modules/classifieds/pages/NovoClassificadoPage.tsx`

- Adicionado estado `subcategory`
- Subcategorias aparecem dinamicamente após seleção da categoria
- Layout responsivo (2 colunas mobile, 3 desktop)
- Botão para limpar subcategoria selecionada
- Subcategoria é resetada ao trocar de categoria

### 4. Preview Atualizado

**Arquivo:** `src/modules/classifieds/components/create/PreviewStep.tsx`

- Exibe subcategoria como tag adicional no preview
- Mostra emoji + label da subcategoria
- Visual diferenciado (bg-primary/5) para distinguir de categoria principal

## 🎨 UI/UX

### Comportamento
1. Usuário seleciona categoria principal
2. Se categoria tiver subcategorias, elas aparecem automaticamente abaixo
3. Subcategorias são opcionais (não obrigatórias)
4. Ao trocar categoria, subcategoria é resetada
5. Botão "Limpar subcategoria" permite desselecionar

### Design
- Grid responsivo (2-3 colunas)
- Emojis para identificação visual rápida
- Estados hover e selecionado
- Texto pequeno mas legível (11px)
- Bordas arredondadas (rounded-xl)

## 📊 Exemplo de Uso

```typescript
// Usuário seleciona "Veículos"
setCategory("veículos");

// Sistema carrega subcategorias automaticamente
const subs = getSubcategories("veículos");
// Retorna: [Carros, Motos, Caminhões, Ônibus, Barcos, Peças]

// Usuário seleciona "Carros"
setSubcategory("carros");

// No preview, aparece:
// 🚗 Veículos | 🚗 Carros | 📦 Usado | 💰 Fixo
```

## ✅ Validações

- Subcategoria é opcional (não bloqueia publicação)
- Validação automática via `isValidSubcategory()`
- Subcategoria é resetada ao trocar categoria (evita inconsistências)

## 🔄 Próximos Passos (Sugestões)

1. **Backend**: Adicionar campo `subcategory` na tabela `classifieds`
2. **Filtros**: Permitir filtrar por subcategoria nas listagens
3. **URLs**: Incluir subcategoria nas URLs canônicas
4. **Analytics**: Rastrear subcategorias mais usadas
5. **Busca**: Indexar subcategorias para melhorar busca

## 📝 Notas Técnicas

- Arquitetura SSOT mantida
- Zero duplicação de código
- TypeScript com tipos seguros
- Componentes reutilizáveis
- Performance otimizada (useMemo)
- Acessibilidade mantida

## 🐛 Correções Incluídas

- Corrigido erro de `navigate()` sendo chamado fora de useEffect
- Página agora renderiza corretamente em `/classificados/novo`
