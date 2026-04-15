# Mock Classifieds Data

## 📦 Descrição

Dados mock de classificados para desenvolvimento, testes e demonstração da plataforma.

## 📊 Dados Incluídos

O arquivo `mock-classifieds.ts` contém **22 anúncios** variados cobrindo todas as categorias:

### Categorias

- **Eletrônicos** (7 anúncios)
  - iPhone 14 Pro Max
  - Notebook Dell Inspiron
  - Smart TV Samsung 55"
  - Ar Condicionado Split
  - Câmera Canon EOS Rebel T7

- **Móveis** (5 anúncios)
  - Sofá 3 lugares
  - Mesa de jantar 6 lugares
  - Guarda-roupa 6 portas
  - Mesa de escritório em L

- **Veículos** (2 anúncios)
  - Honda Civic 2020
  - Moto Honda CG 160

- **Games** (3 anúncios)
  - PlayStation 5 + jogos
  - Xbox Series S
  - Nintendo Switch OLED

- **Roupas** (3 anúncios)
  - Vestido de festa
  - Tênis Nike Air Max
  - Jaqueta de couro

- **Imóveis** (1 anúncio)
  - Apartamento 2 quartos para aluguel

- **Serviços** (1 anúncio)
  - Pintura residencial

- **Outros** (4 anúncios)
  - Bicicleta MTB
  - Geladeira Brastemp
  - Máquina de lavar

## 🎯 Características dos Dados

### Realismo
- Preços variados (R$ 80 a R$ 98.000)
- Descrições detalhadas e realistas
- Bairros reais de Salvador/BA
- WhatsApp formatado corretamente
- Avaliações e reviews dos vendedores

### Diversidade
- Diferentes faixas de preço
- Vários bairros de Salvador
- Produtos novos e seminovos
- Vendedores com diferentes reputações

### Imagens
- URLs do Unsplash com imagens reais
- Parâmetros de crop e tamanho otimizados
- Múltiplas fotos para alguns produtos

## 🔧 Uso

### Importação
```typescript
import { MOCK_CLASSIFIEDS } from "@/modules/classifieds/data/mock-classifieds";
```

### Na ClassificadosLandingPage
A página usa automaticamente os dados mock como fallback quando não há dados do banco:

```typescript
const { classificados: classificadosFromDB, initialLoading } = useClassificados({
  sortBy: "recente",
  filter: selectedCategory !== "todos" ? selectedCategory : undefined,
  search: searchQuery,
  routeResolved: resolved,
  activeMemberIds,
});

// Usa dados mock como fallback
const classificados = classificadosFromDB.length > 0 ? classificadosFromDB : MOCK_CLASSIFIEDS;
```

### Em Testes
```typescript
import { MOCK_CLASSIFIEDS } from "@/modules/classifieds/data/mock-classifieds";

// Usar em testes unitários
const mockAd = MOCK_CLASSIFIEDS[0];

// Filtrar por categoria
const eletronicos = MOCK_CLASSIFIEDS.filter(ad => ad.categoria === "eletrônicos");
```

## 📋 Estrutura dos Dados

Cada anúncio segue a interface `ClassificadoWithVendedor`:

```typescript
{
  id: string;                    // ID único
  titulo: string;                // Título do anúncio
  descricao: string;             // Descrição detalhada
  preco: number;                 // Preço em reais
  categoria: string;             // Categoria do produto
  fotos: string[];               // Array de URLs de imagens
  bairro: string;                // Bairro em Salvador
  cidade: string;                // Cidade (Salvador)
  estado: string;                // Estado (BA)
  status: "active" | "reserved" | "sold";
  vendedor_id: string;           // ID do vendedor
  vendedor_name: string;         // Nome do vendedor
  vendedor_avatar: string | null;
  vendedor_whatsapp: string;     // WhatsApp (71XXXXXXXXX)
  vendedor_rating: number;       // Avaliação (0-5)
  vendedor_reviews_count: number;// Quantidade de avaliações
  created_at: string;            // Data de criação (ISO)
  updated_at: string;            // Data de atualização (ISO)
}
```

## 🎨 Bairros Incluídos

Os anúncios estão distribuídos por diversos bairros de Salvador:
- Pituba
- Barra
- Itaigara
- Rio Vermelho
- Caminho das Árvores
- Graça
- Ondina
- Vitória
- Brotas
- Paralela
- Imbuí
- Costa Azul
- Cabula
- Pernambués
- Stella Maris
- Cajazeiras
- Mussurunga
- Federação
- Amaralina
- Jardim Armação
- Patamares
- Lauro de Freitas

## 🔄 Atualização

Para adicionar novos anúncios mock:

1. Abra `src/modules/classifieds/data/mock-classifieds.ts`
2. Adicione um novo objeto ao array `MOCK_CLASSIFIEDS`
3. Siga a estrutura existente
4. Use imagens do Unsplash relacionadas ao produto
5. Mantenha preços realistas
6. Varie os bairros e vendedores

## ⚠️ Importante

- Estes dados são apenas para desenvolvimento
- Em produção, os dados virão do banco de dados
- As imagens do Unsplash são para demonstração
- Os números de WhatsApp são fictícios
- Os vendedores são fictícios

## 🚀 Próximos Passos

- [ ] Adicionar mais categorias (pets, livros, etc)
- [ ] Criar variações de status (reservado, vendido)
- [ ] Adicionar mais fotos por produto
- [ ] Incluir produtos de outras cidades
- [ ] Adicionar timestamps mais variados
