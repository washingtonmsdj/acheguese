# UI Concept - Achegue-se

Status: conceito aprovado e fundacao implementada em React/Tailwind na Home
territorial e em Explorar (Fase 4.2).

## Direcao visual principal

Conceito oficial:

> Territorio Vivo — uma experiencia Hybrid com base Territory First.

O produto deve parecer uma camada viva do bairro: proximo, organizado, util e confiavel. A interface nao deve parecer uma rede social generica, nem marketplace puro, nem painel administrativo.

A implementacao canônica fica em `src/app/components/territory-vivo/` e usa os
tokens do tema existente. O nome identifica uma familia de primitives e um
contrato de layout; nao cria um segundo design system.

## Personalidade visual

### Sensacao desejada

- Local.
- Clara.
- Cotidiana.
- Humana.
- Confiavel.
- Leve, mas nao infantil.
- Util antes de promocional.

### Sensacao a evitar

- Super app cheio de atalhos.
- Portal municipal burocratico.
- Rede social com excesso de cards.
- Marketplace agressivo.
- Dashboard tecnico.

## Linguagem visual

### Estrutura

A tela deve ter uma composicao em camadas:

1. Territorio: onde estou.
2. Busca/intencao: o que quero fazer.
3. Hoje: o que importa agora.
4. Conteudo/contexto: caminhos relevantes.
5. Navegacao: modos estaveis.

### Peso visual

O maior peso deve estar no territorio e na busca. Conteudos devem ter peso medio. Navegacao deve ser sempre presente, mas discreta.

Ordem de peso:

1. Nome do territorio.
2. Campo de busca.
3. Bloco "Hoje".
4. CTA primario.
5. Cards de conteudo.
6. Filtros e chips.
7. Navegacao inferior.

### Espacamento

Ritmo recomendado:

- Margem lateral mobile: generosa, suficiente para respirar, sem parecer tablet.
- Entre secoes: separacao clara.
- Dentro de cards: compacta, mas com hierarquia.
- Entre chips: proximos, para sugerir conjunto.
- Bottom nav: sempre isolada do conteudo com respiro inferior.

Principio:

> Poucos blocos por tela. Mais profundidade por toque.

### Cards

Cards devem representar objetos ou destinos:

- Post.
- Empresa.
- Evento.
- Classificado.
- Grupo.
- Notificacao.

Cards nao devem embrulhar secoes inteiras sem necessidade.

Tipos de cards:

- Card editorial: destaque do dia.
- Card compacto: resultado ou item de lista.
- Card de acao: iniciar fluxo.
- Card contextual: explica vazio, erro ou proximo passo.

### Icones

Icones devem funcionar como pistas rapidas, nao como unica linguagem.

Uso recomendado:

- Busca.
- Localizacao.
- Notificacao.
- Mensagem.
- Rota.
- Publicar.
- Filtros.
- Salvar.

Regra:

- Toda acao critica precisa de texto ou nome claro.

## Microcopy

Tom:

- Direto.
- Local.
- Conversacional sem excesso.
- Sem jargoes internos.

Exemplos:

- "Hoje na Pituba"
- "Buscar no bairro"
- "Perto de mim"
- "Ver Salvador inteiro"
- "Publicar no bairro"
- "Ainda nao encontramos isso aqui"
- "Tente ampliar para a cidade"

Evitar:

- "Modulo"
- "Surface"
- "Hub", exceto documentos internos.
- "Gestao" para usuario comum.
- "Comunicacao territorial" como label primario.

## Movimento e animacoes

Animacoes devem orientar espaco e estado.

### Permitidas

- Sheet subindo do bottom para troca de bairro.
- Campo de busca expandindo.
- Chips entrando com leve atraso.
- Skeleton sutil em listas.
- FAB abrindo opcoes por intencao.
- Resultado de busca reordenando com transicao curta.

### Evitar

- Animacoes decorativas sem funcao.
- Transicoes longas.
- Cards saltando ou mudando tamanho.
- Conteudo sumindo durante refresh.

## Estados globais

### Empty state

Sempre deve responder:

1. Onde estou?
2. O que nao foi encontrado?
3. O que posso tentar agora?

Modelo:

> "Ainda nao encontramos [coisa] em [territorio]. Tente ampliar para [cidade] ou pedir recomendacao na comunidade."

### Loading

Loading curto:

- Skeleton estrutural.

Loading medio:

- Mensagem contextual: "Buscando novidades na Pituba..."

Loading longo:

- Explicacao + alternativa: "Esta demorando mais que o normal. Tentar novamente ou explorar categorias."

### Erro

Erro deve ser humano e acionavel.

Modelo:

> "Nao conseguimos carregar agora. Sua conexao pode estar instavel. Tente novamente."

Nunca deixar tela vazia sem proximo passo.

## Sistema de prioridades por tela

### Home

Prioridade:

1. Territorio.
2. Busca.
3. Resumo de hoje.
4. Acoes rapidas.
5. Destaques mistos.

### Explorar

Prioridade:

1. Busca.
2. Filtros rapidos.
3. Categorias.
4. Colecoes.
5. Resultados.

### Comunidade

Prioridade:

1. Composer/FAB.
2. Feed.
3. Grupos.
4. Alertas.
5. Participacao.

### Empresas

Prioridade:

1. Busca por necessidade.
2. Aberto agora/perto de mim.
3. Categorias.
4. Lista.
5. Mapa.

### Atividade

Prioridade:

1. Itens que exigem resposta.
2. Mensagens.
3. Notificacoes.
4. Alertas.
5. Historico.

### Conta

Prioridade:

1. Identidade.
2. Completar perfil.
3. Preferencias.
4. Gestao se aplicavel.
5. Sair/suporte.

## Wireframe global de navegacao mobile

```text
┌──────────────────────────────────────┐
│ [Territorio v]              [Busca]  │
│                                      │
│  Conteudo do modo atual              │
│                                      │
│                                      │
│                                      │
│                          [FAB]       │
├──────────────────────────────────────┤
│ Hoje   Explorar   Comunidade   Ativ. │
│                  Conta               │
└──────────────────────────────────────┘
```

## Layout adaptativo implementado

- Mobile: topbar territorial, conteudo editorial e bottom navigation.
- Tablet: navigation rail; nunca herda o vazio lateral do desktop sem navegacao.
- Desktop: sidebar de modos, conteudo principal e rail contextual quando util.
- Home: densidade baixa, informacao real e estados honestos.
- Explorar: densidade media, busca, filtros, colecoes e mapa carregado sob demanda.

O desktop adiciona contexto e composicao; nao e uma coluna mobile apenas mais
larga. Bordas separam superficies, sombras sao excepcionais e cards representam
objetos, destinos ou estados — nunca uma arvore de cards aninhados.

## Decisao final

O visual deve fazer o usuario pensar:

> "Este e o meu bairro organizado para eu descobrir, resolver e participar."

Nao:

> "Este app tem muitos modulos."
