# POST-CONTENT — Sprint POST.1

Estratégia editorial da PostPage (entregue via `PostDetailModal`). Estende `docs/ux/HOME-CONTENT.md` e `docs/ux/FEED-CONTENT.md`. Mesma voz, mesmo vocabulário.

## Princípios

1. **O post é uma conversa do bairro, não um "item"**. Nunca dizer "publicação", "conteúdo", "registro", "item".
2. **A ação principal é responder**, não "comentar". "Comentar" é jargão de portal de notícia; "responder" é o que a pessoa realmente faz.
3. **Contagem humanizada**: números viram gente. `12` → `12 vizinhos comentaram`. `0` → `Ainda ninguém comentou`.
4. **O território é implícito** — o usuário já sabe que está no bairro. Só reforçar quando ajudar a decidir.

## Vocabulário

| ❌ Evitar | ✅ Preferir |
|-----------|-------------|
| Detalhes da publicação | Post do bairro |
| Comentários (12) | 12 vizinhos comentaram |
| Nenhum comentário | Ainda ninguém comentou. Seja o primeiro. |
| Escreva um comentário | Escreva pro seu bairro |
| Responder {nome}... | Responder pra {nome}... |
| Faça login para comentar | Entre pra responder aqui do bairro |
| Respondendo @{nome} | Você está respondendo a @{nome} |
| Enviar / Comentar (botão) | Responder |
| Verifique sua residência para comentar | Confirme seu bairro pra responder por aqui |
| Excluir comentário? | Apagar essa resposta? |

## Copy por bloco

### Header do modal
- `DialogTitle`: **"Post do bairro"**
- `DialogDescription` (sr-only): **"Publicação completa e conversa dos vizinhos."**

### Cabeçalho da conversa
- Com respostas: **`{N} vizinhos comentaram`** (singular: `1 vizinho comentou`).
- Sem respostas: **`Ainda ninguém comentou · Seja o primeiro`**.

### Composer
- Placeholder padrão: **"Escreva pro seu bairro..."**
- Placeholder resposta: **"Responder pra {nome}..."**
- Placeholder sem login: **"Entre pra responder aqui do bairro"**
- Placeholder bloqueado: **"Confirme seu bairro pra responder por aqui"**
- Botão: **"Responder"** (carregando: **"Enviando..."**)
- Aviso de reply: **"Você está respondendo a @{nome}"** · ação **"Cancelar"**

### Diálogos de confirmação
- Excluir comentário — título: **"Apagar essa resposta?"** — descrição: **"Isso remove a resposta e o que os vizinhos escreveram nela. Não dá pra desfazer."** — confirmar: **"Apagar"** — cancelar: **"Deixa"**.
  *(fora do escopo direto — anotado para POST.1.b.)*

## Tom por estado

- **Vazio** → convite curto, primeira pessoa do bairro. Nunca "nenhum".
- **Bloqueado** (sem residência confirmada) → explicar em uma frase e apontar o próximo passo, sem sermão jurídico.
- **Erro** → assumir o problema ("A gente não conseguiu enviar. Tenta de novo?") — não usar códigos.
- **Sucesso** → silencioso; a resposta aparecendo na lista já é o feedback.

## Regras aplicadas

- **Uma CTA visível por vez**: no Post, é o composer no rodapé. Métricas continuam clicáveis mas não competem editorialmente.
- **Sem jargão de portal**: nada de "publicação", "comentários" como rótulo, "denunciar" isolado (mantido no dropdown por convenção legal).
- **Território é ambiente, não título**: o header não repete "Pituba" — o Feed anterior já contextualizou.
- **Contador é gente**: sempre que houver `N`, dizer `N vizinhos`, não `N comentários`.

## O que NÃO muda

- Rotas.
- Ordem dos blocos.
- Comportamento de like/save/share/report/delete.
- Rótulos legais no dropdown ("Denunciar", "Excluir").
- Componentes de conteúdo, poll, tags e métricas.
