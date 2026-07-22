# HOME-SPEC.md — Especificação Oficial da Territory Home

> **Status:** SSOT (Single Source of Truth) da Territory Home.
> **Base:** `docs/05-ux/HOME-INVENTORY.md` (inventário).
> **Escopo:** Especificação de produto. Nenhum código, wireframe ou mockup.
> **Regra:** Qualquer implementação futura da Home deve seguir exclusivamente este documento. Divergências exigem nova sprint de spec.

---

## 1. Missão da Territory Home

> **Em uma frase:** A Territory Home mostra em segundos o que está acontecendo no bairro do usuário e o convida a participar.

---

## 2. Personas e comportamento esperado na Home

### 2.1 Visitante (não autenticado)
- Vê a Home do território público (cidade ou bairro navegado).
- Enxerga conteúdo real do bairro em modo leitura.
- CTAs de participação (publicar, reagir, comentar) apontam para cadastro/login.
- Home nunca bloqueia leitura; apenas gatilha cadastro em ações de contribuição.

### 2.2 Morador (autenticado, com bairro definido)
- Home carrega automaticamente o bairro salvo no perfil.
- Vê feed, alertas, eventos e ações rápidas do próprio bairro.
- Pode publicar, reagir e comentar direto da Home.
- Recebe notificações contextuais do território ativo.

### 2.3 Empresário (autenticado, perfil de negócio)
- Vê a Home como morador + destaque para desempenho da própria empresa quando existir.
- CTAs adicionais: publicar novidade da empresa, ver métricas do bairro.
- Nunca substitui a Home do bairro; o painel de negócio permanece em rota própria.

### 2.4 Moderador/Admin
- Vê a Home idêntica ao morador (sem UI de moderação embutida).
- Ferramentas de moderação são acessadas por rota dedicada, nunca via Home.

---

## 3. Hierarquia oficial da tela

Ordem canônica dos blocos, do topo para a base:

1. **Header do território**
2. **Busca**
3. **Hoje no bairro**
4. **Ações rápidas**
5. **Vale conferir**
6. **Passear pelo bairro (Explore)**
7. **Feed resumido do bairro**
8. **Rodapé de continuidade** (cidade / expansão / cadastro)
9. **Bottom Navigation** (persistente, fora do fluxo)

### Motivo da posição de cada bloco

| # | Bloco | Motivo |
|---|-------|--------|
| 1 | Header | Confirma imediatamente onde o usuário está (território ativo). |
| 2 | Busca | Atalho universal; segunda decisão mais comum depois de "onde estou". |
| 3 | Hoje | Responde "o que está acontecendo agora?" — motor da recorrência. |
| 4 | Ações rápidas | Reduz fricção para a próxima ação (publicar, alertar, ver empresas). |
| 5 | Vale conferir | Curadoria editorial; dá alma de bairro vivo. |
| 6 | Explore | Descoberta lateral (empresas, gastronomia, eventos). |
| 7 | Feed resumido | Prova social contínua; leva ao Feed completo. |
| 8 | Rodapé | Continuidade quando o bairro tem pouco conteúdo (expansão, cidade). |
| 9 | Bottom Nav | Persistente; navegação global independente da Home. |

---

## 4. Especificação por bloco

### 4.1 Header do território
- **Objetivo:** confirmar território ativo e permitir troca.
- **Importância:** crítica — sem contexto territorial a Home não existe.
- **Dados:** nome do bairro, nome da cidade, status (ativo / em expansão).
- **Origem:** `useActiveTerritory`.
- **Componentes reutilizados:** header já existente da `TerritoryHomePage`.
- **Estados:** território definido, sem território, cidade não suportada.
- **CTA principal:** "Trocar de bairro".
- **Destinos:** `TerritorySelectorPage`.
- **Atualização:** ao trocar de território ou reabrir o app.

### 4.2 Busca
- **Objetivo:** entrada rápida para qualquer conteúdo do bairro.
- **Importância:** alta — reduz cliques em navegação profunda.
- **Dados:** placeholder contextual ("Procurar no [Bairro]").
- **Origem:** rota `/busca` existente.
- **Componentes reutilizados:** input de busca já usado na Home atual.
- **Estados:** ativo, desabilitado (bairro não suportado).
- **CTA principal:** submissão da busca.
- **Destinos:** `BuscarPage`.
- **Atualização:** instantânea (não requer dados).

### 4.3 Hoje no bairro
- **Objetivo:** mostrar o que é relevante hoje (alertas, eventos, posts do dia).
- **Importância:** protagonista — principal motivo de retorno diário.
- **Dados:** posts, alertas e eventos das últimas 24h no território ativo.
- **Origem:** `useCommunityFeed` filtrado por data + `useAlerts` + eventos do bairro.
- **Componentes reutilizados:** cards já usados no Feed.
- **Estados:** com conteúdo, vazio, carregando, erro.
- **CTA principal:** "Ver tudo do dia".
- **Destinos:** `TerritoryFeedPage`.
- **Atualização:** a cada abertura + pull-to-refresh.

### 4.4 Ações rápidas
- **Objetivo:** atalhos para as ações mais comuns no bairro.
- **Importância:** alta — converte leitura em participação.
- **Dados:** estáticos (publicar, alertar, empresas, eventos).
- **Origem:** configuração local (sem backend).
- **Componentes reutilizados:** grid de ações já existente na Home.
- **Estados:** logado (ações completas), visitante (ações levam a cadastro).
- **CTA principal:** cada ação é um CTA independente.
- **Destinos:** `/novo-post`, `/alertas`, `/empresas`, `/eventos`.
- **Atualização:** estático.

### 4.5 Vale conferir
- **Objetivo:** curadoria editorial de destaques do bairro.
- **Importância:** média — dá tom humano, transmite bairro vivo.
- **Dados:** destaques territoriais (posts, empresas, eventos selecionados).
- **Origem:** `useTerritorialHighlights`.
- **Componentes reutilizados:** cards de destaque já existentes.
- **Estados:** com destaques, vazio (esconder bloco), carregando.
- **CTA principal:** abrir o destaque.
- **Destinos:** rota do destaque (post, empresa, evento).
- **Atualização:** diária ou por decisão editorial.

### 4.6 Passear pelo bairro (Explore)
- **Objetivo:** descoberta lateral (empresas, gastronomia, serviços, eventos).
- **Importância:** média — sustenta descoberta além do feed.
- **Dados:** empresas, gastronomia, classificados e eventos em destaque.
- **Origem:** `useLandingFeatured`.
- **Componentes reutilizados:** carrosséis/grids já usados na landing.
- **Estados:** com dados, parcial (algumas categorias vazias), vazio total (esconder bloco).
- **CTA principal:** "Ver todas as empresas / eventos".
- **Destinos:** módulos correspondentes (`/empresas`, `/gastronomia`, etc.).
- **Atualização:** staleTime de 5 min (já configurado no hook).

### 4.7 Feed resumido do bairro
- **Objetivo:** prova social contínua; últimas conversas do bairro.
- **Importância:** alta — leva ao Feed completo.
- **Dados:** últimos posts do território ativo.
- **Origem:** `useCommunityFeed` (primeira página, limite reduzido).
- **Componentes reutilizados:** card de post já usado no Feed.
- **Estados:** com posts, vazio, carregando, erro.
- **CTA principal:** "Abrir o feed do bairro".
- **Destinos:** `TerritoryFeedPage`.
- **Atualização:** a cada abertura + refresh do Feed.

### 4.8 Rodapé de continuidade
- **Objetivo:** oferecer caminho quando o bairro tem pouco conteúdo ou não é suportado.
- **Importância:** baixa em bairros ativos, alta em bairros em expansão.
- **Dados:** status do território, link para cidade, link de interesse/waitlist.
- **Origem:** `useActiveTerritory` + configuração de expansão.
- **Componentes reutilizados:** blocos de "em expansão" já existentes.
- **Estados:** bairro ativo (ocultar), bairro em expansão (mostrar CTA de waitlist), visitante (mostrar CTA de cadastro).
- **CTA principal:** "Explorar a cidade" ou "Quero acompanhar o lançamento".
- **Destinos:** `TerritoryExplorerPage`, `CommunityInterestPage`, `CadastroPage`.
- **Atualização:** por território.

### 4.9 Bottom Navigation
- **Objetivo:** navegação global persistente.
- **Importância:** crítica — presente em toda a jornada.
- **Dados:** rotas fixas (Home, Feed, Postar, Buscar, Perfil).
- **Origem:** configuração local (`BottomNav`).
- **Componentes reutilizados:** `BottomNav` atual.
- **Estados:** logado, visitante (Perfil → login).
- **CTA principal:** cada item.
- **Destinos:** rotas correspondentes.
- **Atualização:** estático.

---

## 5. Classificação das funcionalidades do inventário

### PROTAGONISTA (definem a Home)
- **Header do território** — sem ele, não há Home.
- **Feed do bairro (resumido)** — motor da recorrência.
- **Hoje no bairro (alertas + eventos + posts do dia)** — razão diária de retorno.
- **Ações rápidas** — converte leitura em participação.

**Motivo:** representam a promessa central "o que rola no meu bairro agora".

### SECUNDÁRIA (reforçam a Home)
- **Busca** — utilitária, alta frequência, mas não é o motivo do retorno.
- **Vale conferir (destaques editoriais)** — dá alma, não é indispensável.
- **Passear pelo bairro (Explore)** — descoberta, complementa mas não protagoniza.
- **Rodapé de continuidade** — ativa em cenários específicos (expansão, visitante).

**Motivo:** enriquecem a experiência sem serem a razão de existir da Home.

### DESTINO (a Home leva, mas não hospeda)
- **Feed completo** — vive em `TerritoryFeedPage`.
- **Post individual** — vive em `PostPage`.
- **Empresas, Gastronomia, Serviços, Classificados, Eventos, Vagas** — módulos próprios.
- **Alertas (listagem)** — módulo próprio.
- **Perfil, Atividade, Notificações** — telas próprias.
- **Cadastro / Login / Reset** — fluxos próprios.
- **Painel admin, moderação, waitlist admin** — rotas dedicadas.

**Motivo:** são destinos legítimos acessados a partir da Home, mas não devem ocupar espaço nela.

### NÃO PERTENCE À HOME
- Configurações de conta.
- Painéis administrativos e moderação.
- Gamificação detalhada, ranking, badges.
- AI Virtual Try-On e experimentos.
- Fluxos de pagamento.
- Formulários longos (cadastro de empresa, interesse detalhado).
- Documentação, políticas, termos.
- Onboarding completo (só o gancho de "definir bairro" pode aparecer via rodapé).

**Motivo:** poluem a Home, distraem da missão e pertencem a rotas próprias.

---

## 6. Origem oficial dos dados por bloco

| Bloco | Fonte oficial | Status |
|-------|---------------|--------|
| Header | `useActiveTerritory` | Real |
| Busca | rota `/busca` | Real |
| Hoje | `useCommunityFeed` (24h) + `useAlerts` + eventos do bairro | Real |
| Ações rápidas | Configuração local | Estático |
| Vale conferir | `useTerritorialHighlights` | Real |
| Explore | `useLandingFeatured` | Real |
| Feed resumido | `useCommunityFeed` (primeira página) | Real |
| Rodapé | `useActiveTerritory` + config de expansão | Real |
| Bottom Nav | `BottomNav` (config local) | Estático |

**Regra:** nenhum bloco pode nascer com mock permanente. Blocos sem hook/service correspondente **não entram na Home** até existir fonte real. Nenhum novo hook ou service será criado nesta especificação — apenas reutilização do que já existe.

Blocos que hoje aparecem com mock e devem migrar para fonte real antes de serem considerados prontos:
- **Hoje no bairro** → `useCommunityFeed` filtrado por 24h + `useAlerts`.
- **Vale conferir** → `useTerritorialHighlights`.
- **Explore** → `useLandingFeatured`.

Blocos que permanecem estáticos por natureza: **Ações rápidas**, **Bottom Nav**.

---

## 7. Estados oficiais da Home

| Estado | Objetivo | Mensagem | CTA |
|--------|----------|----------|-----|
| **Visitante** | Deixar explorar antes de pedir cadastro | "Você está vendo o [Bairro] como visitante." | "Entrar / Criar conta" |
| **Morador** | Experiência plena | (sem mensagem — Home padrão) | Ações contextuais |
| **Cidade suportada** | Home completa | (sem mensagem) | — |
| **Cidade não suportada** | Não frustrar; oferecer continuidade | "Ainda não estamos no seu bairro." | "Quero acompanhar o lançamento" |
| **Sem conteúdo hoje** | Manter tom vivo | "Ainda está quieto por aqui hoje." | "Publicar no bairro" |
| **Offline** | Transparência | "Você está offline. Mostrando a última visita." | "Tentar novamente" |
| **Erro** | Não travar | "Não conseguimos carregar o bairro agora." | "Tentar de novo" |
| **Primeiro acesso** | Guiar sem bloquear | "Bem-vindo ao [Bairro]." | "Escolher meu bairro" |
| **Viagem (território diferente do salvo)** | Contexto claro | "Você está vendo [Bairro visitado]. Seu bairro é [Bairro salvo]." | "Voltar para meu bairro" |

Nenhum estado pode resultar em tela vazia sem mensagem e sem CTA.

---

## 8. Prioridade Visual

### Nível 1 — foco máximo (primeira dobra)
- Header do território
- Busca
- Hoje no bairro

**Atenção esperada:** o usuário deve entender em segundos onde está e o que acontece hoje.

### Nível 2 — participação e curadoria
- Ações rápidas
- Vale conferir

**Atenção esperada:** convida à próxima ação e transmite bairro vivo.

### Nível 3 — descoberta e prova social
- Passear pelo bairro (Explore)
- Feed resumido

**Atenção esperada:** rolagem exploratória; leva ao Feed e aos módulos.

### Nível 4 — continuidade e navegação global
- Rodapé de continuidade
- Bottom Navigation

**Atenção esperada:** presente, mas não compete pela atenção principal.

---

## 9. O que nunca deve existir na Home

- Configurações da conta.
- Painéis administrativos, moderação, waitlist admin.
- Cadastro/edição de empresa, serviço, evento ou classificado (só CTAs de entrada).
- Formulários longos (cadastro, interesse, reset de senha).
- Gamificação (ranking, badges, pontos).
- Documentação, termos, políticas.
- Métricas técnicas, analytics detalhado, logs.
- Experiências experimentais (AI Virtual Try-On, gamificação, testes A/B expostos).
- Pagamentos, checkout, faturas.
- Onboarding completo (apenas o gatilho "definir bairro" via rodapé).
- Notificações detalhadas (lista completa vive em rota própria).
- Perfil, atividade e histórico do usuário.
- Qualquer bloco sem fonte real de dados (mocks permanentes proibidos).

---

## 10. Checklist Final — Home pronta somente quando

- [ ] Header do território exibe bairro e cidade corretos via `useActiveTerritory`.
- [ ] Header oferece troca de território funcional.
- [ ] Busca com placeholder contextual ("Procurar no [Bairro]").
- [ ] "Hoje no bairro" alimentado por `useCommunityFeed` (24h) + `useAlerts` + eventos reais.
- [ ] "Hoje" tem estado vazio com mensagem e CTA.
- [ ] Ações rápidas cobrem: publicar, alertar, empresas, eventos.
- [ ] Ações rápidas respeitam estado de visitante (CTA → cadastro).
- [ ] "Vale conferir" alimentado por `useTerritorialHighlights` (sem mock).
- [ ] "Vale conferir" esconde-se quando não há destaques.
- [ ] "Explore" alimentado por `useLandingFeatured` (sem mock).
- [ ] "Explore" esconde categorias vazias sem quebrar layout.
- [ ] Feed resumido usa `useCommunityFeed` (primeira página) e leva ao `TerritoryFeedPage`.
- [ ] Rodapé aparece apenas em cenários de expansão, visitante ou cidade não suportada.
- [ ] Bottom Navigation persistente com todos os itens funcionais.
- [ ] Todos os 9 estados oficiais (§7) implementados e testados.
- [ ] Nenhum bloco com mock permanente.
- [ ] Nenhum item da lista §9 aparece na Home.
- [ ] Hierarquia de blocos segue exatamente a ordem definida em §3.
- [ ] Prioridade visual (§8) respeitada — Nível 1 na primeira dobra.
- [ ] Copy em tom "vizinho" (sem termos técnicos como "módulo", "endpoint", "feed" isolado).
- [ ] Nenhum CTA leva a rota inexistente ou tela vazia.
- [ ] Home carrega em ≤ 2s em conexão média (percepção de instantaneidade).
- [ ] Testes E2E cobrem: visitante, morador, cidade não suportada, viagem, offline, erro.

---

> **Fim da especificação.**
> Esta é a fonte de verdade da Territory Home. Alterações exigem nova sprint de spec (`HOME-SPEC.vN.md`) e atualização deste documento.
