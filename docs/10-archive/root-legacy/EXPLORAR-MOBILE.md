# Explorar Mobile - Prototipo de alta fidelidade

Status: especificacao visual textual. Sem implementacao.

## Objetivo da tela

Permitir que o usuario encontre qualquer coisa no territorio sem precisar saber o modulo correto.

## Estrutura completa da tela

1. Top bar com territorio.
2. Busca dominante.
3. Filtros rapidos.
4. Categorias por necessidade.
5. Colecoes territoriais.
6. Mapa compacto.
7. Resultados recomendados.
8. Bottom navigation.

## Componentes

### Top bar

Conteudo:

- "Explorar Pituba"
- Acao de trocar bairro.
- Atalho para atividade.

### Busca dominante

Placeholder:

- "Buscar empresas, servicos, eventos..."

Comportamento:

- Ao focar, abre busca ativa.
- Mostra recentes e sugestoes antes do usuario digitar.

### Filtros rapidos

Chips:

- Perto de mim.
- Aberto agora.
- Hoje.
- Bem avaliados.
- Mais filtros.

Hierarquia:

- Chips devem parecer ferramentas, nao categorias principais.

### Categorias por necessidade

Categorias:

- Comer.
- Comprar.
- Resolver em casa.
- Saude e beleza.
- Eventos.
- Classificados.
- Trabalho.
- Imoveis.

Regra:

- Labels devem refletir linguagem do usuario.

### Colecoes

Exemplos:

- "Abertos agora"
- "Mais procurados no bairro"
- "Recomendados por moradores"
- "Novidades perto de voce"

### Mapa compacto

Funcao:

- Mostrar proximidade sem transformar a tela em Mapa First.

CTA:

- "Ver mapa"

## Hierarquia

1. Busca.
2. Filtros rapidos.
3. Categorias.
4. Colecoes.
5. Mapa.
6. Resultados.

## Espacamento

- Busca ocupa largura quase total.
- Filtros em scroll horizontal.
- Categorias em grade compacta, com no maximo duas linhas visiveis inicialmente.
- Colecoes com cards horizontais.
- Mapa compacto com altura controlada.

## Prioridades

Prioridade maxima:

- Busca acessivel.
- Filtro territorial claro.

Prioridade media:

- Categorias e colecoes.

Prioridade baixa:

- Conteudo promocional.
- Mapa se nao houver localizacao.

## Microinteracoes

- Chip selecionado muda estado visual e atualiza resultados abaixo.
- Categoria toca e entra em uma lista filtrada.
- Mapa compacto expande para tela de mapa.
- Busca sugere termos enquanto digita.
- Se o usuario troca bairro, os filtros permanecem quando fizer sentido.

## Estados vazios

Mensagem:

> "Nao encontramos isso na Pituba."

CTAs:

- "Ver Salvador inteiro"
- "Trocar bairro"
- "Pedir recomendacao"

## Loading

Skeleton:

- Campo de busca fixo.
- Chips carregados.
- Categorias carregadas.
- Resultados em skeleton.

Mensagem:

> "Buscando opcoes perto de voce..."

## Erros

Mensagem:

> "Nao conseguimos buscar agora."

CTA principal:

- "Tentar novamente"

CTA secundario:

- "Ver categorias"

## CTA principal

- "Buscar" / campo de busca.

## CTA secundario

- "Ver mapa"

## Wireframe ASCII detalhado

```text
┌────────────────────────────────────────┐
│  Explorar Pituba v            (bell)   │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 🔎 Buscar empresas, servicos...  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Perto] [Aberto agora] [Hoje] [Mais] │
│                                        │
│  O QUE VOCE PRECISA?                   │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ Comer  │ │Comprar │ │Casa    │     │
│  └────────┘ └────────┘ └────────┘     │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Saude   │ │Eventos │ │Trabalho│     │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
│  COLECOES DA PITUBA                    │
│  ┌──────────────────────────────┐      │
│  │ Abertos agora                │      │
│  │ 12 lugares perto de voce     │      │
│  └──────────────────────────────┘      │
│  ┌──────────────────────────────┐      │
│  │ Recomendados por moradores   │      │
│  │ Servicos e lugares confiaveis│      │
│  └──────────────────────────────┘      │
│                                        │
│  PERTO DE VOCE                         │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │        mapa compacto              │  │
│  │       [ Ver mapa completo ]       │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│ Hoje   Explorar   Comunidade   Ativ.   │
│                 Conta                  │
└────────────────────────────────────────┘
```

