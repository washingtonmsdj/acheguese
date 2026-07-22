# HOME-CONTENT — Sprint HOME.1.5

Estratégia editorial da Territory Home. Sem mudanças de arquitetura, backend, tokens ou funcionalidades.

Meta: a Home deve **soar como o bairro conversando**, não como um painel administrativo. Toda copy é escrita para uma pessoa real que abriu o app em pé no ponto de ônibus, não para um usuário-modelo em uma spec.

## Princípios editoriais

1. **Fale como vizinho, não como sistema.** Nada de "Módulo", "Seção", "Registros", "Itens".
2. **Verbos no presente.** "Acontecendo", "Aberto agora", "Rolando". A Home é sobre o agora.
3. **Território no nome.** Sempre que possível, cite o bairro ("Hoje na Pituba", "Perto de você na Pituba").
4. **Uma CTA por bloco.** Se precisar de duas, uma vira link fantasma ("Ver tudo") e a outra fica silenciosa.
5. **Sem jargão de produto.** "Destaques", "Explorar", "Feed" são palavras internas — traduzir para linguagem humana antes de sair.
6. **Empty states com convite, nunca com desculpa.** Em vez de "Nenhum item encontrado", escrever "Ainda está quieto por aqui. Que tal começar?".
7. **Números só quando importam.** "8 respostas" ok. "128 avaliações" ok. Evitar contadores decorativos.

## Vocabulário: proibido vs. preferido

| Não usar | Usar |
|----------|------|
| Destaques | Vale conferir · Rolando agora · O que o bairro está falando |
| Explorar | Descobrir · Passear pelo bairro · O que mais tem por aqui |
| Módulos / Seções | (remover — nomear pelo conteúdo) |
| Ações rápidas | Atalhos · O que você quer fazer agora |
| Notificações | Novidades |
| Buscar | Procurar algo no bairro |
| Ver tudo | Ver tudo (ok) · Abrir feed do bairro |
| Trocar bairro | Mudar de bairro |
| Alerta / Evento / Discussão (etiqueta em CAPS) | Manter — funciona como carimbo semântico, não como copy |
| "Nenhum resultado encontrado" | "Ainda está quieto por aqui." |
| "Carregando..." | "Ouvindo o bairro..." |

## Copy por bloco

### 1. Header territorial

| Elemento | Antes | Depois |
|----------|-------|--------|
| Nome do território | "Pituba" | **"Pituba"** (mantido — é o herói) |
| Linha secundária | "Salvador, BA" | **"Salvador, BA"** (mantido) |
| aria-label do botão | "Trocar território. Atual: Pituba" | **"Mudar de bairro. Você está na Pituba."** |
| aria-label do sino | "Notificações, 3 não lidas" | **"3 novidades para você"** / "Ver novidades" |

### 2. Busca

| Antes | Depois |
|-------|--------|
| Placeholder: "O que você procura no bairro?" | **"Procurar no bairro: pizza, chaveiro, feira..."** |
| sr-only label: "O que você procura no bairro?" | **"Procurar algo na Pituba"** |

Motivo: exemplos concretos ensinam o que buscar melhor que uma pergunta aberta.

### 3. Hoje

| Elemento | Antes | Depois |
|----------|-------|--------|
| Título | "Hoje na Pituba" | **"Hoje na Pituba"** (mantido — é a copy-chave) |
| CTA lateral | "Ver tudo" | **"Abrir o bairro"** |
| CTA do destaque | "Ver no mapa" / "Ver detalhes" / "Ver conversas" | mantidos — já são verbos naturais |
| Etiquetas | ALERTA / EVENTO / DISCUSSÃO | mantidas (carimbo semântico) |

### 4. Destaques → **"Vale conferir"**

| Antes | Depois |
|-------|--------|
| Título: "Destaques do seu bairro" | **"Vale conferir"** |
| CTA lateral: "Ver todos" | **"Ver mais do bairro"** |
| Card empresa: "Aberto · 450 m" | **"Aberto agora · a 450 m de você"** |
| Card empresa: "★ 4,7 (128)" | **"★ 4,7 — 128 vizinhos avaliaram"** |
| Card post: "8 respostas · Pituba" | **"8 vizinhos comentaram"** |
| Card evento: "Praça Ana Lúcia · 10h" | **"Praça Ana Lúcia, sábado às 10h"** |

### 5. Ações rápidas → **"O que você quer fazer?"**

| Antes | Depois |
|-------|--------|
| Título: "Ações rápidas" | **"O que você quer fazer?"** |
| Label "Buscar" | **"Procurar algo"** |
| Label "Perto de mim" | **"Perto de mim"** (mantido) |
| Label "Comer agora" | **"Comer agora"** (mantido) |
| Label "Mobilidade" | **"Como chegar"** |

### 6. Explore → **"Passear pelo bairro"**

| Antes | Depois |
|-------|--------|
| Título: "Explore o bairro" | **"Passear pelo bairro"** |
| CTA lateral: "Buscar" | **"Procurar"** |
| Chips | mantidos (nomes das verticais são âncoras universais) |

### 7. Empty states (referência para HOME.2)

| Contexto | Copy |
|----------|------|
| Sem alerta hoje | "Nenhum alerta na Pituba agora. Bom sinal." |
| Sem evento hoje | "Nada marcado ainda. Que tal criar um encontro?" |
| Feed vazio | "Ainda está quieto por aqui. Publique o primeiro." |
| Sem posts perto | "Ninguém publicou perto de você hoje. Amplie para o bairro todo?" |

### 8. Loading

- Skeleton: sem texto.
- Se demorar > 2s: **"Ouvindo o bairro..."**
- Se demorar > 6s: **"Está demorando mais que o normal. Tentar de novo?"**

## Regras de tom

- **1ª ou 2ª pessoa direta.** "Você", "seu bairro", "perto de você". Nunca "o usuário".
- **Sem exclamação decorativa.** Uma exclamação por tela, no máximo — reservada para bom humor real ("Bom sinal.").
- **Português brasileiro coloquial padrão.** Sem gírias regionais que envelheçam.
- **Números por extenso quando ≤ 10 e não forem dado técnico.** "oito vizinhos" ok em corpo; "8" ok em contadores.
- **Sem emoji na Home.** Ícones já carregam o afeto visual.

## O que NÃO mudou

- Estrutura de blocos (Território · Busca · Hoje · Vale conferir · O que você quer fazer · Passear pelo bairro).
- Hierarquia visual definida em HOME-REVIEW.md.
- Tokens semânticos por categoria.
- Rotas, hooks, dados.

## Próximo (HOME.2, fora desta sprint)

Aplicar os empty states reais quando o feed do território estiver conectado a dados vivos, com fallback textual por bloco (Hoje/Vale conferir).
