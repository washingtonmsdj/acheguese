# USER JOURNEY REVIEW — Sprint JOURNEY.1

Referência oficial de UX: Territory Home + Territory Feed + PostPage.
Este documento não analisa telas isoladas. Analisa a **continuidade entre elas**.

Critério: o usuário deve sentir que está dentro de **um único produto** — nunca em módulos diferentes.

---

## Metodologia

Para cada jornada mapeamos:

- **Início:** onde o usuário aparece.
- **Intenção:** o que ele quer.
- **Cliques:** quantos passos até resolver.
- **Perda:** onde não sabe o próximo passo.
- **Excesso:** onde há mais informação do que decisão.
- **Contexto:** onde há mudança brusca de tela.
- **Linguagem:** onde a voz muda (editorial ↔ admin).
- **Identidade:** onde o visual muda.
- **CTA:** onde o botão principal muda de forma/nome.
- **Continuidade:** onde o fluxo quebra.

---

## 1. Primeira visita

- **Início:** `/` → `RootRouteEntry` → `TerritoryEntryPage` quando não há contexto anterior.
- **Intenção:** entender o que é o Achegue-se.
- **Cliques até valor:** 2 (selecionar cidade → ver bairro).
- **Perdido:** o seletor de cidade é a home. O visitante não sabe se já está "dentro" ou "fora" do produto.
- **Excesso:** stats de cidade competem com a única decisão relevante (escolher bairro).
- **Contexto:** salto Splash → Selector → Territory Home muda plano de fundo e densidade.
- **Linguagem:** Selector fala "cidade/estado" (admin). Home fala "seu bairro" (editorial). **Ruptura.**
- **Identidade:** blobs neon no Selector, cards editoriais na Home. **Ruptura.**
- **CTA:** "Ver cidade" / "Ver meu bairro" no Splash → não bate com "Abrir o bairro" da Home.
- **Continuidade:** quebra na transição Splash → Selector → Home.

## 2. Primeiro login

- **Início:** `/login` (via CTA "entrar" ou proteção de rota).
- **Intenção:** acessar sua conta.
- **Cliques:** 1 submit + 1 redirect.
- **Perdido:** após login, o usuário cai onde? Se veio de um post, volta ao post? Hoje volta ao root.
- **Excesso:** footer legal + rodapé + skip-link em uma tela que precisa ser respiro.
- **Linguagem:** "Entrar" (botão) e "Acessar" (título) coexistem.
- **CTA:** ok — "Entrar" é único.
- **Continuidade:** falta preservar `?redirect=` na volta.

## 3. Escolher território

- **Início:** `/` ou trocar bairro na Home.
- **Intenção:** definir onde está.
- **Cliques:** 3 (permitir localização → cidade → bairro) — ou 4 se manual.
- **Perdido:** quando geolocation falha silenciosamente.
- **Excesso:** lista de 170 bairros sem ancoragem alfabética visível.
- **Linguagem:** "Território ativo" vs "seu bairro" vs "comunidade". **Três nomes para o mesmo objeto.**
- **CTA:** varia entre "Selecionar", "Confirmar", "Ver bairro".
- **Continuidade:** onboarding e header da Home usam trocador diferente.

## 4. Conhecer o bairro

- **Início:** Territory Home.
- **Intenção:** entender o que rola aqui.
- **Cliques:** 0 — a Home entrega. **Referência.**
- **Perdido:** não se perde. A Home é a régua.
- **Continuidade:** ao clicar "Abrir o bairro" cai no Feed com header diferente do da Home. **Micro-ruptura.**

## 5. Ler uma conversa

- **Início:** Feed → card de post.
- **Intenção:** ler e talvez responder.
- **Cliques:** 1 (abre modal).
- **Perdido:** modal cobre o feed; ao fechar perde scroll position ocasionalmente.
- **Linguagem:** Post fala "Conversa no post" (editorial). Feed fala "publicação" em alguns cards. **Alinhar.**
- **Continuidade:** modal quebra sensação de página. Aceitável, mas o header do modal deveria espelhar o header do Feed.

## 6. Publicar

- **Início:** Bottom nav "Postar" → `/novo-post`.
- **Intenção:** compartilhar algo com o bairro.
- **Cliques:** 3 (abrir → escrever → publicar).
- **Perdido:** volta para onde após publicar? Hoje vai para `/comunidade`. Deveria voltar para o Feed do território atual.
- **Excesso:** rascunho + turnstile + termos disputam espaço com o campo principal.
- **Linguagem:** "Publicar no bairro" (bom, alinhado com Feed).
- **CTA:** ok.
- **Continuidade:** entrada consistente, **saída inconsistente** — post publicado não é destacado no feed de volta.

## 7. Encontrar uma empresa

- **Início:** Home → "Passear pelo bairro" → Empresas, ou bottom nav.
- **Intenção:** achar comércio local.
- **Cliques:** 2-3.
- **Perdido:** Empresas usa layout de listagem clássico, não parece filho da Home.
- **Excesso:** filtros de categoria + busca + mapa disputam a dobra.
- **Linguagem:** "Empresas" (admin) vs "comércios do bairro" (editorial). **Alinhar.**
- **Identidade:** cards de empresa não usam tokens semânticos por categoria. **Ruptura.**
- **CTA:** "Ver detalhes" / "Abrir" / "Ver empresa" — três variantes.

## 8. Entrar em contato com empresa

- **Início:** detalhe da empresa.
- **Intenção:** WhatsApp, telefone, endereço.
- **Cliques:** 1 se CTA claro; 2-3 hoje.
- **Perdido:** múltiplos CTAs secundários competem com o primário.
- **CTA:** deveria ser único e óbvio ("Falar no WhatsApp").
- **Continuidade:** ao voltar, perde posição na lista.

## 9. Descobrir um evento

- **Início:** Home → "Hoje na Pituba" (hoje pode ser um evento) ou módulo Eventos.
- **Intenção:** ver o que acontece.
- **Estado atual:** módulo Eventos pausado (`LaunchPausedPage`). Jornada **incompleta por design**.
- **Perdido:** o usuário vê "Eventos" no bottom/menu e chega em página pausada. **Fricção alta.**
- **Continuidade:** quebra total.

## 10. Trocar de bairro

- **Início:** header da Territory Home.
- **Intenção:** mudar contexto.
- **Cliques:** 3 (abrir seletor → cidade → bairro) — mesma jornada 3.
- **Perdido:** usuário não sabe se troca visita temporária ou permanente.
- **Linguagem:** "Trocar de bairro" (Home) vs "Selecionar território" (Selector).
- **Continuidade:** volta para Home do novo bairro — bom. Mas o estado "visitante em viagem" não é comunicado.

## 11. Buscar algo

- **Início:** barra de busca da Home ou `/busca`.
- **Intenção:** encontrar algo específico.
- **Cliques:** 1 + digitar.
- **Perdido:** `/busca` tem hero acadêmica ("Busca inteligente / linguagem natural") que quebra a voz.
- **Linguagem:** Home diz "Procurar no bairro: pizza, chaveiro, feira..." (perfeito). `/busca` diz "Encontre no território usando linguagem natural" (admin). **Ruptura crítica.**
- **Identidade:** `/busca` usa gradiente próprio, não os tokens da Home.
- **CTA:** ok.

## 12. Receber uma notificação

- **Início:** badge no header da Home / sino no bottom.
- **Intenção:** ver o que aconteceu.
- **Cliques:** 1 até a lista, +1 até o item.
- **Perdido:** notificação leva a rota canônica? Ou a listagem?
- **Linguagem:** títulos das notificações misturam formal e editorial.
- **Continuidade:** deep-link nem sempre reabre o post no contexto do Feed.

## 13. Voltar ao aplicativo

- **Início:** reabrir aba/PWA.
- **Intenção:** continuar de onde parou.
- **Cliques:** 0 ideal.
- **Perdido:** hoje volta para `/` (Selector) mesmo se o usuário já tem bairro salvo. **Ruptura crítica de continuidade.**
- **Continuidade:** deveria abrir a última Territory Home ativa.

---

## Padrões transversais observados

1. **Três nomes para território:** "bairro" (Home/Feed) · "comunidade" (rotas/backend) · "território" (docs). O usuário vê os três.
2. **Duas vozes:** editorial (Home/Feed/Post) e admin (Busca/Empresas/Eventos/Selector).
3. **Três formas de CTA "abrir":** "Ver mais", "Abrir", "Ver detalhes".
4. **Retorno inconsistente:** publicar, logar, trocar bairro — todos voltam para lugares diferentes.
5. **Empty/Loading:** Home e Feed têm voz de vizinho. Empresas e Busca ainda usam spinners neutros.
