# FEED-CONTENT — Sprint FEED.1

Estratégia editorial do Territory Feed. Mesma metodologia usada em HOME-CONTENT.md, aplicada agora à timeline do território.

Sem mudanças de arquitetura, backend, dados ou funcionalidades. Só a voz muda — e ela precisa ser a **mesma voz da Home**.

Meta: quando o usuário passa da Home para o Feed, ele deve sentir que **continua no mesmo bairro conversando**, não que abriu um painel de administração de posts.

## Princípios editoriais (herdados da Home)

1. **Fale como vizinho, não como sistema.** Nada de "Post", "Registro", "Item", "Feed" nas telas.
2. **Verbos no presente.** "Rolando agora", "Acabou de publicar", "Quieto por aqui".
3. **Território no nome.** Sempre citar o bairro quando fizer sentido ("Agora na Pituba", "Publique na Pituba").
4. **Uma CTA por bloco.** O Feed tem UMA CTA primária: **Publicar no bairro** (FAB). Todo resto é secundário.
5. **Sem jargão de produto.** "Ordenar por", "Filtrar por tipo", "Categoria" — traduzir ou remover.
6. **Empty states com convite, nunca desculpa.**
7. **Números só quando importam.** "8 vizinhos comentaram" > "8 comentários".

## Vocabulário: proibido vs. preferido

| Não usar | Usar |
|----------|------|
| Comunidade (como título de tela) | Nome do território ("Pituba") · "Feed do bairro" |
| Post / Publicação | Post (ok em contadores) · "algo" · "conversa" no corpo |
| Criar Post | **Publicar no bairro** · **Publicar** · "+" |
| Feed | (remover do texto — a tela é o próprio feed) |
| Ordenar por | Mais recentes · Populares · Perto de mim (chips diretos) |
| Filtrar por tipo | Categorias (label pequena, ou remover) |
| ORDENAR POR / FILTRAR POR TIPO (CAPS) | Remover — não são carimbo semântico, são label de admin |
| Nenhum post encontrado | "Ainda está quieto por aqui." |
| Nenhum resultado | "Ainda está quieto na [Bairro]." |
| Carregando... | "Ouvindo o bairro..." |
| Erro ao carregar feed | "Não consegui ouvir o bairro agora." |
| Tentar novamente | Tentar de novo |
| Comentar | Comentar (ok) |
| N comentários | "N vizinhos comentaram" (até 10) / "N comentários" (>10) |
| Ver comentários | Abrir a conversa |
| 0 comentários | "Comente você o primeiro." |
| Curtir | Curtir (ok) |
| Compartilhar | Compartilhar (ok) |
| Denunciar | Denunciar (ok) |

## Copy por bloco

### 1. Header do Feed

| Elemento | Antes | Depois |
|----------|-------|--------|
| Título | "Comunidade" | **Nome do território** ("Pituba") |
| Subtítulo | (nenhum) | **"Feed do bairro"** / "Feed da cidade" / "Feed da comunidade" |
| aria-label do voltar | "Voltar" | **"Voltar para a home do bairro"** |
| aria-label do botão criar | "Criar Post" | **"Publicar no bairro"** |

O `TerritoryFeedHeader` já existente cobre esse padrão — usá-lo como header oficial do Feed.

### 2. Composer / CTA de publicação

Uma só CTA visível: **FAB**.

| Contexto | Copy |
|----------|------|
| FAB (mobile) | ícone `+`, aria-label **"Publicar no bairro"** |
| FAB (desktop) | ícone `+` + texto **"Publicar"** |
| Botão fantasma no header (desktop) | **"Publicar no bairro"** — link, sem preenchimento |
| CTA no empty state | **"Publicar o primeiro"** |
| CTA no modal (submit) | **"Publicar"** (estado normal) · **"Publicando..."** (loading) |

### 3. Cards

| Elemento | Antes | Depois |
|----------|-------|--------|
| Etiqueta CAPS | ALERTA / EVENTO / DISCUSSÃO / DICA | mantidas — carimbo semântico |
| Meta autor | "por João · 2h" | **"João · 2h · Pituba"** (autor · tempo · território) |
| Ações inferiores | "Curtir · Comentar · Compartilhar" | mantidas |
| Contador de likes | "12 curtidas" | **"12"** (só o número, ícone comunica) |
| Contador de comentários | "8 comentários" | **"8 vizinhos comentaram"** (≤10) / **"128 comentários"** (>10) |
| Distância | "450 m" | **"a 450 m de você"** |
| Tag ativa | "Filtrando por: #tag" | **"Vendo só #tag"** |
| Remover tag | "Remover filtro" | **"Limpar"** |

### 4. Comentários

| Elemento | Antes | Depois |
|----------|-------|--------|
| Placeholder do campo | "Escreva um comentário..." | **"Responder para [Bairro]..."** |
| Botão enviar | "Enviar" | **"Comentar"** |
| Vazio | "0 comentários" | **"Ninguém comentou ainda. Comenta você."** |
| Resposta | "Responder" | mantido |
| Editar | "Editar" | mantido |
| Excluir | "Excluir" | mantido |
| Denunciar | "Denunciar" | mantido |
| Carregando mais | "Carregar mais" | **"Ver conversa completa"** |

### 5. Filtros

| Elemento | Antes | Depois |
|----------|-------|--------|
| Título "ORDENAR POR" | visível | **remover** — chips falam por si |
| Título "FILTRAR POR TIPO" | visível | **remover** |
| Chip "Recentes" | "Recentes" | **"Mais recentes"** |
| Chip "Populares" | "Populares" | mantido |
| Chip "Próximos" | "Próximos" | **"Perto de mim"** |
| Chip "Todos" (tipo) | "Todos" | **"Tudo"** |
| Chip "Discussão" | "Discussão" | **"Conversas"** |
| Chip "Recomendação" (label "Dicas") | "Dicas" | mantido |
| Chip "Enquete" | "Enquetes" | mantido |
| Escopo "Cidade / Bairro / Rua" | chips já ok | mantido — ordenar como **Rua · Bairro · Cidade** |
| Botão "Mais filtros" | (não existe) | **"Mais filtros"** — abre categorias |

### 6. Abas

| Antes | Depois |
|-------|--------|
| "Feed" | **"Agora"** |
| "Discussões" | **"Conversas"** |
| "Grupos" | **"Grupos"** (nome do domínio, mantido) |

### 7. Estados vazios

| Contexto | Copy |
|----------|------|
| Feed sem posts (todos) | **"Ainda está quieto na [Bairro]. Publique o primeiro."** |
| Feed sem posts numa categoria | **"Nada por aqui em [Categoria]. Que tal começar?"** |
| Feed sem posts perto | **"Ninguém publicou perto de você hoje. Ampliar para o bairro todo?"** |
| Sem alerta | **"Nenhum alerta na [Bairro] agora. Bom sinal."** |
| Sem evento | **"Nada marcado ainda. Quer criar um encontro?"** |
| Sem discussão | **"Nenhuma conversa aberta. Puxe você."** |
| Visitante sem acesso | **"O bairro só aparece pra quem mora aqui. Entre para ver."** |
| Busca sem resultado | **"Nada encontrado na [Bairro] pra isso. Tenta outra palavra?"** |

### 8. Loading

- Skeleton silencioso até 2s.
- 2s–6s: **"Ouvindo o bairro..."**
- >6s: **"Está demorando mais que o normal. Tentar de novo?"** + botão.
- Paginação (loading more): **"Puxando mais posts..."**

### 9. Erros

| Contexto | Copy |
|----------|------|
| Falha de rede no feed | **"Não consegui ouvir o bairro agora."** + "Tentar de novo" |
| Falha ao publicar | **"Sua publicação não saiu. Tenta de novo?"** |
| Falha ao curtir/comentar | toast: **"Não deu pra completar. Tenta de novo."** |
| Sem permissão para publicar | **"Publicar aqui é pra quem mora no bairro. Confirme seu endereço."** |
| Sem permissão para comentar | **"Comentar exige entrar no bairro."** |

### 10. Modais

| Modal | Elemento | Copy |
|-------|----------|------|
| CreatePost | Título | **"O que rola no bairro?"** |
| CreatePost | Placeholder | **"Conta pra Pituba..."** |
| CreatePost | Botão | **"Publicar"** |
| CreatePost | Cancelar | **"Depois"** |
| Comments | Título | **"Conversa"** |
| DirectMessage | Título | **"Mensagem"** |

## Regras de tom (herdadas da Home)

- 1ª ou 2ª pessoa direta. "Você", "seu bairro", "perto de você". Nunca "o usuário".
- Uma exclamação por tela no máximo, reservada para bom humor real ("Bom sinal.").
- Português brasileiro coloquial padrão. Sem gírias regionais que envelheçam.
- Números por extenso quando ≤ 10 no corpo ("oito vizinhos"). Contadores continuam em algarismo.
- Sem emoji na UI do Feed. Ícones já carregam o afeto visual. (O 📱 do empty state atual sai.)
- Sem CAPS decorativo em labels de filtro. CAPS só como carimbo semântico em etiquetas de categoria.

## O que NÃO mudou

- Estrutura de blocos (Header · Filtro · Timeline · FAB).
- Componentes, hooks, rotas, dados.
- Domínio (Territory, Community, Group, Post).
- Comportamento de gates, modais e ações.
- Tokens semânticos de categoria já estabelecidos em DESIGN-TOKENS.md.

## Próximo (FEED.2, fora desta sprint)

Consolidar a barra de filtro em componente único (`FeedFilterBar`), migrar cores hardcoded para tokens, e substituir gradientes teal/cyan por `primary`. Sem alterar API — só CSS e composição.
