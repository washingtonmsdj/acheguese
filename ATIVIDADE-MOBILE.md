# Atividade Mobile - Prototipo de alta fidelidade

Status: especificacao visual textual. Sem implementacao.

## Objetivo da tela

Reunir tudo que exige continuidade: mensagens, respostas, mencoes, alertas, atualizacoes e notificacoes.

## Estrutura completa da tela

1. Top bar simples.
2. Resumo de pendencias.
3. Tabs por tipo.
4. Lista de atividade contextual.
5. Agrupamento por tempo.
6. Estado vazio orientado.
7. Bottom navigation.

## Componentes

### Top bar

Conteudo:

- "Atividade"
- Acao secundaria: preferencias.

### Resumo de pendencias

Conteudo:

- "3 coisas novas"
- "2 mensagens, 1 resposta"

So aparece quando houver atividade nova.

### Tabs

Tabs:

- Todas.
- Mensagens.
- Respostas.
- Alertas.

### Item de atividade

Conteudo:

- Icone ou avatar.
- Origem.
- Resumo.
- Tempo.
- Contexto territorial.
- Estado lido/nao lido.

Exemplos:

- "Marcos respondeu sua pergunta sobre chaveiro."
- "Mercado Bom Dia enviou mensagem."
- "Novo alerta na Pituba."

### Agrupamento por tempo

Grupos:

- Agora.
- Hoje.
- Esta semana.

## Hierarquia

1. Itens nao lidos.
2. Mensagens diretas.
3. Respostas a publicacoes.
4. Alertas territoriais.
5. Historico.

## Espacamento

- Lista deve ser densa o suficiente para leitura rapida.
- Cada item precisa de altura confortavel para toque.
- Separadores por tempo devem ser discretos.
- Nao usar cards pesados para cada notificacao; usar linhas ricas.

## Prioridades

Prioridade maxima:

- O que precisa de resposta.

Prioridade media:

- Atualizacoes de contexto.

Prioridade baixa:

- Historico lido.

## Microinteracoes

- Tocar em item abre contexto original.
- Swipe ou acao secundaria marca como lido.
- Pull-to-refresh atualiza mantendo lista.
- Tabs preservam posicao quando voltar.
- Mensagens novas aparecem com destaque sutil.

## Estados vazios

Mensagem:

> "Nada novo por enquanto."

Texto de apoio:

> "Quando alguem responder, enviar mensagem ou surgir alerta no seu bairro, aparece aqui."

CTAs:

- "Ir para Comunidade"
- "Explorar bairro"

## Loading

Skeleton:

- Linhas de atividade.
- Avatares neutros.
- Tabs ja visiveis.

Mensagem longa:

> "Atualizando sua atividade..."

## Erros

Mensagem:

> "Nao conseguimos carregar sua atividade agora."

CTA principal:

- "Tentar novamente"

CTA secundario:

- "Abrir Comunidade"

## CTA principal

- Abrir item de atividade.

## CTA secundario

- Preferencias.

## Wireframe ASCII detalhado

```text
┌────────────────────────────────────────┐
│  Atividade                    [prefs]  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 3 coisas novas                   │  │
│  │ 2 mensagens · 1 resposta         │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Todas] [Mensagens] [Respostas] [Al.]│
│                                        │
│  AGORA                                 │
│  ┌──────────────────────────────────┐  │
│  │ ● [avatar] Mercado Bom Dia       │  │
│  │   respondeu sua mensagem         │  │
│  │   Empresa · Pituba · 2 min       │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ ● [avatar] Marcos                │  │
│  │   comentou sua pergunta          │  │
│  │   Post · Pituba · 8 min          │  │
│  └──────────────────────────────────┘  │
│                                        │
│  HOJE                                  │
│  ┌──────────────────────────────────┐  │
│  │   Alerta da comunidade           │  │
│  │   Rua X com obra ate 17h         │  │
│  │   Alerta · Pituba · 1h           │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │   Novo evento perto de voce      │  │
│  │   Feira local no sabado          │  │
│  │   Evento · 4h                    │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│ Hoje   Explorar   Comunidade   Ativ.   │
│                 Conta                  │
└────────────────────────────────────────┘
```

