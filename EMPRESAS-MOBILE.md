# Empresas Mobile - Prototipo de alta fidelidade

Status: especificacao visual textual. Sem implementacao.

## Objetivo da tela

Ajudar o usuario a encontrar, avaliar e contatar negocios locais.

## Estrutura completa da tela

1. Top bar com territorio.
2. Busca por empresa ou necessidade.
3. Filtros rapidos.
4. Categorias comerciais.
5. Secao "Abertas agora".
6. Lista de empresas.
7. Mapa compacto.
8. CTA para cadastrar empresa.
9. Bottom navigation.

## Componentes

### Top bar

Conteudo:

- "Empresas na Pituba"
- Trocar territorio.
- Busca.

### Busca

Placeholder:

- "Buscar mercado, farmacia, salao..."

### Filtros rapidos

Chips:

- Aberto agora.
- Perto de mim.
- Bem avaliadas.
- Entrega.
- Promocoes.

### Categorias

Categorias iniciais:

- Mercado.
- Farmacia.
- Beleza.
- Saude.
- Restaurantes.
- Pet.
- Casa.
- Outros.

### Card de empresa

Conteudo:

- Logo/foto.
- Nome.
- Categoria.
- Distancia.
- Status aberto/fechado.
- Sinal de confianca/recomendacao.
- CTAs: Ver, Ligar, Rota.

### Mapa compacto

Funcao:

- Mostrar distribuicao sem dominar.

### Cadastro de empresa

CTA secundario:

- "Tem uma empresa? Cadastre aqui"

Deve ser discreto, nao competir com busca.

## Hierarquia

1. Busca.
2. Filtros.
3. Categorias.
4. Empresas abertas/proximas.
5. Lista.
6. Mapa.
7. Cadastro.

## Espacamento

- Filtros em linha horizontal.
- Categorias em blocos compactos.
- Cards de empresa com altura media.
- CTAs do card sempre visiveis, mas secundarios ao nome/status.

## Prioridades

Prioridade maxima:

- Encontrar empresa.
- Ver se esta aberta.
- Entrar em contato ou rota.

Prioridade media:

- Avaliacao.
- Promocoes.
- Mapa.

Prioridade baixa:

- Cadastrar empresa.

## Microinteracoes

- Tocar em "Aberto agora" atualiza lista.
- Tocar em "Rota" abre contexto de mapa.
- Tocar em "Ligar" pede confirmacao se necessario.
- Salvar empresa muda estado visual.
- Scroll preserva filtros no topo quando util.

## Estados vazios

Mensagem:

> "Nao encontramos empresas desse tipo na Pituba."

CTAs:

- "Ver Salvador inteiro"
- "Trocar categoria"
- "Cadastrar empresa"

## Loading

Skeleton:

- Filtros estaticos.
- Cards de empresa em skeleton.
- Mapa em bloco neutro.

Mensagem:

> "Buscando empresas na Pituba..."

## Erros

Mensagem:

> "Nao conseguimos carregar empresas agora."

CTA principal:

- "Tentar novamente"

CTA secundario:

- "Ver categorias"

## CTA principal

- "Ver empresa" no card.

## CTA secundario

- "Rota" ou "Ligar", dependendo do contexto.

## Wireframe ASCII detalhado

```text
┌────────────────────────────────────────┐
│  Empresas na Pituba v         (bell)   │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 🔎 mercado, farmacia, salao...   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Aberto] [Perto] [Avaliadas] [Promo] │
│                                        │
│  CATEGORIAS                            │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Mercado │ │Farmacia│ │Beleza  │     │
│  └────────┘ └────────┘ └────────┘     │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Saude   │ │Pet     │ │Casa    │     │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
│  ABERTAS AGORA                         │
│  ┌──────────────────────────────────┐  │
│  │ [logo] Mercado Bom Dia           │  │
│  │ Mercado · 450m · Aberto          │  │
│  │ Recomendado por moradores        │  │
│  │ [Ver]        [Ligar]     [Rota]  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [logo] Farmacia Central          │  │
│  │ Farmacia · 800m · Aberta         │  │
│  │ [Ver]        [Ligar]     [Rota]  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ mapa compacto · ver empresas     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Tem uma empresa? Cadastre aqui         │
├────────────────────────────────────────┤
│ Hoje   Explorar   Comunidade   Ativ.   │
│                 Conta                  │
└────────────────────────────────────────┘
```

