# POST-REVIEW — Sprint POST.1

Status: revisão da PostPage (hoje entregue via `PostDetailModal` — modal aberto a partir do Territory Feed). Sem alteração de arquitetura, backend, dados ou domínio.

Meta: o Post deve ser uma **continuação natural** do Feed. Ao abrir, o usuário deve sentir "ainda estou no meu bairro, agora leio essa conversa" — nunca "abri outra aplicação".

Régua: Territory Home (aprovada) → Territory Feed (aprovado) → **Post (esta revisão)**.

## Bloco a bloco

Cada bloco responde às 6 perguntas obrigatórias.

### 1. Header (DialogHeader)

- **Estado anterior**: `DialogTitle = "Detalhes da publicacao"` + `DialogDescription = "Publicacao completa e comentarios da comunidade"`. Descrição escondida em `sr-only`.
- **Onde estou?** Nome técnico ("publicação") não situa: não diz território, não diz tipo. Usuário perde o vínculo com o Feed do bairro.
- **O que devo fazer?** Nada explícito. Header é apenas ornamento.
- **CTA principal?** Ausente no header — apenas o "X" de fechar (padrão Dialog).
- **Excesso?** Sim: "Detalhes da publicação" é rótulo técnico; título e descrição repetem a mesma ideia.
- **Competição visual?** Baixa, mas o header ocupa altura sem entregar contexto territorial.
- **Linguagem técnica?** Sim ("publicação", "comunidade" como jargão).
- **Decisão**: título editorial curto ("Post do bairro") + `DialogDescription` (sr-only) reformulada para leitores de tela ("Publicação completa e conversa dos vizinhos.").

### 2. Conteúdo (PostContent)

- **Estado atual**: prefixos detectados (`PET PERDIDO:`, `ENQUETE:`, etc.) em ciano bold, texto em branco, `whitespace-pre-wrap`.
- **Onde estou?** OK — o prefixo já sinaliza o tipo.
- **O que devo fazer?** Ler. Correto.
- **CTA principal?** Não se aplica ao bloco de conteúdo em si.
- **Excesso?** Não.
- **Competição visual?** Aceitável — o único destaque é o prefixo.
- **Linguagem técnica?** Não.
- **Decisão**: **manter**. Este é o único bloco que já respeita a régua editorial do Feed.

### 3. Autor + Território (PostHeader dentro do modal)

- **Estado atual**: Avatar + nome + `city / neighborhood` + `timestamp` relativo ("ha 2 h").
- **Onde estou?** Parcial — mostra bairro do autor, não deixa claro se é o **meu** bairro ativo.
- **O que devo fazer?** Nada explícito (ver mais do autor não é o foco desta sprint).
- **CTA principal?** Nenhuma — correto (a CTA do Post é comentar, não seguir o autor).
- **Excesso?** Não.
- **Competição visual?** Não.
- **Linguagem técnica?** `formatRelativeTime` produz "ha 2 h" — o "há" está sem acento e o formato é seco. Feed usa a mesma função, então corrigir aqui manteria consistência (fora do escopo desta sprint — anotado para POST.1.b).
- **Decisão**: **manter estrutura**. Sem alteração de comportamento.

### 4. Badge de tipo (só quando `alerta`)

- **Estado atual**: `PostBadge` só aparece se `type === "alerta"`. Correto — evita ruído nos posts comuns.
- **Decisão**: **manter**.

### 5. Enquete / Tags / Métricas

- **Estado atual**: cada bloco isolado, ordem lógica (conteúdo → poll → tags → métricas → comentários).
- **Onde estou?** OK.
- **CTA principal?** Métricas concentram as ações (curtir, comentar, salvar, compartilhar, denunciar) — este é o eixo do Post.
- **Excesso?** As 5 ações competem visualmente no `PostMetrics`. Fora do escopo (não alterar comportamento). Anotado para POST.2.
- **Decisão**: **manter**.

### 6. Comentários — cabeçalho

- **Estado anterior**: `<h3>Comentarios (N)</h3>` com "Comentarios" sem acento, contagem cega.
- **Onde estou?** Diz "aqui começam os comentários", mas de forma técnica.
- **O que devo fazer?** Ler / responder — não fica claro.
- **CTA principal?** Composer no rodapé é a real CTA — o header só rotula.
- **Excesso?** "Comentarios (12)" é catálogo, não conversa.
- **Linguagem técnica?** Sim + typo.
- **Decisão**: reescrever como **"Conversa no post"** com contagem humanizada ("12 vizinhos comentaram" / "Ainda ninguém comentou"). Mantém o `data-post-comments-panel` para o scroll-into-view.

### 7. Composer (CommentsModalComposer)

- **Estado anterior**:
  - Placeholder: `"Escreva um comentario..."` / `"Faca login para comentar"` / `"Responder {nome}..."` / `blockedMessage`.
  - Botão: `"Comentar"` → `"Enviando..."`.
  - Aviso de reply: `Respondendo @{nome}`.
- **Onde estou?** OK — está no rodapé, sticky.
- **O que devo fazer?** Escrever. O placeholder é genérico e não convida.
- **CTA principal?** ✅ Este é o CTA do Post. Está no lugar certo, mas o rótulo é técnico.
- **Excesso?** Contador `12/500` OK; gradient teal/cyan é o mesmo do Feed (consistência).
- **Competição visual?** Não.
- **Linguagem técnica?** Sim — "Comentar", "Escreva um comentário" são rótulos de formulário, não de conversa.
- **Decisão**:
  - Placeholder padrão → `"Escreva pro seu bairro..."`
  - Placeholder reply → `"Responder pra {nome}..."`
  - Placeholder logged-out → `"Entre pra responder aqui do bairro"`
  - Botão → `"Responder"` (loading: `"Enviando..."`)
  - Aviso de reply → `Você está respondendo a @{nome}` com "Cancelar" mantido.

### 8. Ações do comentário (like, responder, deletar, denunciar)

- Fora do escopo direto da revisão editorial do Post (vivem em `CommentItem`). Anotado para POST.1.b.

### 9. Estado vazio dos comentários

- **Estado anterior**: `CommentsList` provavelmente mostra vazio silencioso ou "Nenhum comentário".
- **Decisão editorial (via header)**: o próprio cabeçalho passa a dizer "Ainda ninguém comentou. Seja o primeiro." quando `count === 0`. Isso cumpre a regra UX.1 (empty é conteúdo, não ausência) sem alterar o componente da lista.

### 10. Loading

- **Estado atual**: `useComments` expõe `loading`; a `CommentsList` cuida do skeleton.
- **Decisão**: **manter** — dentro do escopo da lista, não do wrapper.

### 11. Hierarquia geral (ordem dos blocos no modal)

Hoje: Header modal → Autor → (Badge se alerta) → Conteúdo → Poll → Tags → Métricas → Comentários.

- **Onde estou?** Muito claro.
- **CTA principal?** O último bloco (composer sticky) é o alvo natural do scroll — hierarquia correta.
- **Decisão**: **manter ordem**. Nenhuma reordenação.

## Regras aplicadas (mesmas da HOME/FEED)

- **CTA única por tela**: composer no rodapé. Métricas continuam clicáveis mas não são o alvo primário.
- **Consistência de cor**: nenhum novo gradient/cor introduzida. Mantidos os tokens já usados no Feed (`#4FD1C5 → #06B6D4`), que serão migrados para `primary` num sprint dedicado a tokens.
- **Ritmo vertical**: `SPACING.sectionGap` já usado — mantido.
- **Tipografia**: 3 tamanhos (título modal, corpo, meta) — coerente com DESIGN-TOKENS.
- **Linguagem**: verbos no infinitivo/imperativo curto, sem jargão ("publicação", "comentários" como catálogo).
- **Empty como conteúdo**: contagem 0 vira frase-convite no header da conversa.

## O que NÃO mudou

- Rotas, roteamento (`/p/:id` continua sem existir — Post vive como modal, decisão fora do escopo).
- `usePostInteractions`, `useComments`, `useCommentActions`, `useCommentInteractions`, `useModeration`.
- Comportamento de like/save/share/report/delete.
- Ordem dos blocos.
- Componente `PostContent`, `PostMetrics`, `PostBadge`, `PostTags`, `PollCard`, `CommentsList`, `CommentItem`.
- Estilos base do composer (Avatar, Textarea, contador, gradient do botão).

## Próximos passos (POST.1.b/2, fora desta sprint)

1. Corrigir mojibake em `formatRelativeTime` ("ha" → "há") — vive em várias telas, precisa de decisão SSOT.
2. Rever `CommentItem` para aplicar a mesma humanização (botão "Responder", timestamp).
3. Rever `PostMetrics` para reduzir competição visual entre as 5 ações.
4. Avaliar rota dedicada `/p/:id` para deep-link/compartilhamento com página cheia (hoje o `postShare` monta URL que abre a comunidade, não o post isolado).
