# Home Mobile - Prototipo de alta fidelidade

Status: especificacao visual textual. Sem implementacao.

## Objetivo da tela

Fazer o usuario entender em ate 5 segundos:

- Qual territorio esta vendo.
- O que esta acontecendo hoje.
- O que pode fazer agora.
- Para onde ir se quiser explorar mais.

## Estrutura completa da tela

1. Top bar territorial.
2. Busca curta.
3. Resumo "Hoje em [territorio]".
4. Acoes rapidas por intencao.
5. Destaques mistos.
6. Convite para explorar.
7. Bottom navigation.
8. FAB contextual.

## Componentes

### Top bar territorial

Conteudo:

- Chip de territorio: "Pituba".
- Texto secundario: "Salvador, BA" quando houver espaco.
- Icone de dropdown.
- Icone de busca ou atalho de atividade.

Hierarquia:

- Territorio e o elemento mais importante.
- Icones sao secundarios.

Microcopy:

- "Pituba"
- "Trocar bairro"

### Busca curta

Conteudo:

- Campo com placeholder: "O que voce procura no bairro?"
- Icone de lupa.

Hierarquia:

- Segundo maior peso da tela.

Prioridade:

- Deve aparecer antes dos cards.

### Resumo de hoje

Conteudo:

- Titulo: "Hoje na Pituba"
- Subtexto: "Atualizacoes, lugares e conversas perto de voce."
- 2 a 3 linhas de destaque.

Tipos:

- Alerta.
- Evento.
- Movimento da comunidade.
- Empresa/servico util.

### Acoes rapidas

Acoes:

- Procurar.
- Publicar.
- Perto de mim.
- Comunidade.

Cada acao tem:

- Icone.
- Label curto.
- Pequena descricao opcional em telas maiores.

### Destaques mistos

Cards:

- Postagem relevante.
- Empresa recomendada.
- Evento ou classificado.

Regra:

- No maximo 3 destaques antes de pedir scroll profundo.

## Hierarquia

1. Territorio.
2. Busca.
3. Hoje.
4. Acoes.
5. Destaques.
6. Navegacao.

## Espacamento

- Top bar compacta, mas com respiro vertical.
- Busca separada do topo por pouco espaco para parecer conectada ao territorio.
- Resumo de hoje com respiro maior.
- Acoes rapidas em linha horizontal, sem parecer grade de modulos.
- Cards com distancia suficiente para leitura individual.

## Prioridades

Prioridade maxima:

- Territorio correto.
- Busca clara.
- Conteudo de hoje.

Prioridade media:

- Acoes rapidas.
- Destaques.

Prioridade baixa:

- Links "ver tudo".
- Conteudo comercial secundario.

## Microinteracoes

- Tocar no territorio abre seletor em sheet.
- Tocar na busca expande para tela de busca.
- Pull-to-refresh preserva conteudo anterior enquanto atualiza.
- FAB abre seletor de intencao.
- Cards de destaque tem feedback de toque leve.

## Estados vazios

Texto:

> "Ainda ha pouca atividade na Pituba hoje."

Acoes:

- "Explorar categorias"
- "Publicar uma pergunta"
- "Ver Salvador inteiro"

## Loading

Estado inicial:

- Skeleton para busca, resumo e 2 cards.

Apos demora:

> "Buscando novidades na Pituba..."

Apos demora longa:

> "Esta demorando mais que o normal."

CTAs:

- "Tentar novamente"
- "Explorar categorias"

## Erros

Mensagem:

> "Nao conseguimos carregar as novidades agora."

CTA principal:

- "Tentar novamente"

CTA secundario:

- "Abrir Explorar"

## CTA principal

- "Publicar" via FAB.

## CTA secundario

- "Explorar tudo"

## Wireframe ASCII detalhado

```text
┌────────────────────────────────────────┐
│  Pituba v                     (bell)   │
│  Salvador, BA                           │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 🔎  O que voce procura no bairro?│  │
│  └──────────────────────────────────┘  │
│                                        │
│  HOJE NA PITUBA                         │
│  Atualizacoes perto de voce             │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Alerta                           │  │
│  │ Mutirao na praca as 16h          │  │
│  │ Ver detalhes                     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Procurar│ │Publicar│ │Perto   │     │
│  │algo    │ │        │ │de mim  │     │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
│  DESTAQUES                              │
│  ┌──────────────────────────────────┐  │
│  │ Post                             │  │
│  │ Alguem recomenda chaveiro?       │  │
│  │ 8 respostas  ·  Pituba           │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Empresa aberta agora             │  │
│  │ Mercado Bom Dia                  │  │
│  │ 450m · Ver rota                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│                         ┌──────────┐   │
│                         │ Publicar │   │
│                         └──────────┘   │
├────────────────────────────────────────┤
│ Hoje   Explorar   Comunidade   Ativ.   │
│                 Conta                  │
└────────────────────────────────────────┘
```

