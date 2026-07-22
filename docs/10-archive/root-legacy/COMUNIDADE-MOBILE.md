# Comunidade Mobile - Prototipo de alta fidelidade

Status: especificacao visual textual. Sem implementacao.

## Objetivo da tela

Concentrar participacao social: feed, perguntas, grupos, alertas e conversas originadas na comunidade.

## Estrutura completa da tela

1. Top bar comunitaria.
2. Composer compacto.
3. Tabs leves.
4. Feed social.
5. Cards de grupos ou alertas.
6. FAB de publicacao.
7. Bottom navigation.

## Componentes

### Top bar comunitaria

Conteudo:

- "Comunidade da Pituba"
- Subtexto opcional: "Moradores, grupos e avisos"
- Busca.

### Composer compacto

Microcopy:

- "O que voce quer compartilhar?"

Estados:

- Visitante: "Entre para publicar no bairro"
- Autenticado: campo ativo.

### Tabs leves

Tabs:

- Feed.
- Grupos.
- Alertas.

Nao usar muitas tabs.

### Feed social

Tipos de card:

- Pergunta.
- Postagem.
- Alerta.
- Evento comunitario.
- Classificado leve.

Cada card deve conter:

- Autor/contexto.
- Territorio.
- Conteudo.
- Acoes: Curtir, Comentar, Compartilhar, Salvar.

### FAB

Label:

- Publicar.

Ao abrir:

- Perguntar.
- Avisar.
- Vender.
- Divulgar evento.

## Hierarquia

1. Composer/FAB.
2. Feed.
3. Alertas importantes.
4. Grupos sugeridos.
5. Acoes sociais.

## Espacamento

- Composer proximo ao topo.
- Tabs logo abaixo do composer.
- Cards com respiro suficiente para leitura.
- Acoes sociais alinhadas e sempre com label.

## Prioridades

Prioridade maxima:

- Publicar.
- Ler feed.
- Comentar.

Prioridade media:

- Entrar em grupos.
- Compartilhar.

Prioridade baixa:

- Promocoes e classificados dentro do feed.

## Microinteracoes

- Curtir muda estado imediatamente.
- Comentar abre painel inferior.
- Compartilhar abre opcoes: copiar link, enviar.
- FAB abre sheet por intencao.
- Alertas importantes fixam no topo temporariamente.

## Estados vazios

Mensagem:

> "Ainda esta quieto na Pituba."

CTAs:

- "Fazer uma pergunta"
- "Criar grupo"
- "Explorar bairro"

## Loading

Comportamento:

- Preservar feed anterior.
- Skeleton apenas para novos cards.

Mensagem longa:

> "Atualizando conversas da Pituba..."

## Erros

Mensagem:

> "Nao conseguimos carregar a comunidade agora."

CTA principal:

- "Tentar novamente"

CTA secundario:

- "Ir para Hoje"

## CTA principal

- "Publicar"

## CTA secundario

- "Ver grupos"

## Wireframe ASCII detalhado

```text
┌────────────────────────────────────────┐
│  Comunidade da Pituba         [Busca]  │
│  Moradores, grupos e avisos            │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ O que voce quer compartilhar?    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Feed] [Grupos] [Alertas]             │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Juliana · Pituba                 │  │
│  │ Alguem recomenda eletricista?    │  │
│  │                                  │  │
│  │ Curtir  Comentar  Compartilhar   │  │
│  │ 8 respostas                      │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Alerta                           │  │
│  │ Rua X com transito lento         │  │
│  │ Confirmar · Compartilhar         │  │
│  └──────────────────────────────────┘  │
│                                        │
│  GRUPOS ATIVOS                         │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ Mae e pais   │ │ Vizinhos     │     │
│  │ 128 membros  │ │ 84 membros   │     │
│  └──────────────┘ └──────────────┘     │
│                                        │
│                         ┌──────────┐   │
│                         │ Publicar │   │
│                         └──────────┘   │
├────────────────────────────────────────┤
│ Hoje   Explorar   Comunidade   Ativ.   │
│                 Conta                  │
└────────────────────────────────────────┘
```

