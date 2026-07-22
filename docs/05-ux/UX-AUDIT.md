# UX-AUDIT.md — Sprint UX.1

Status: auditoria de experiência. Nenhuma implementação neste documento.
Escopo: telas existentes, sem alterar arquitetura, backend, banco ou regras.
Critérios avaliados por tela (10 perguntas do briefing) → severidade (Crítico / Alto / Médio / Baixo).

Legenda de severidade:
- 🔴 Crítico: prejudica compreensão ou uso primário.
- 🟠 Alto: gera fricção clara em fluxos comuns.
- 🟡 Médio: prejudica polimento e percepção de qualidade.
- 🟢 Baixo: refinamento fino.

---

## 1. TerritorySelectorPage (`AchegueSeHomePage`)

Papel: escolher cidade/território antes de entrar no produto.

| # | Pergunta | Diagnóstico |
|---|---|---|
| 1 | Onde estou? | Parcial. Título "Achegue-se" não comunica que é uma etapa de seleção. |
| 2 | Objetivo claro? | Não totalmente. Compete "detectar por GPS" com "buscar cidade" e "escolher manualmente" no mesmo peso visual. |
| 3 | Excesso de informação? | Sim, blocos secundários acima da dobra empurram a busca. |
| 4 | Competição visual? | Sim: geolocalizar, buscar, listar estados/cidades competem pelo mesmo foco. |
| 5 | CTA principal? | Ambígua. Deveria ser "usar minha localização" ou "buscar minha cidade". |
| 6 | Hierarquia clara? | Frágil. Faltam grupos visuais entre "automático" e "manual". |
| 7 | Conteúdo desnecessário? | Sim: institucional e explicações longas nesta etapa. |
| 8 | Carga cognitiva? | Alta para uma tela de seleção. |
| 9 | Consistência com Territory Home? | Não usa o mesmo header/chip de território (não deve — mas o tom tipográfico deveria ser o mesmo). |
| 10 | Percepção premium? | Ainda parece uma landing genérica. |

Problemas:
- 🔴 Duas ações primárias competindo (GPS + busca manual).
- 🟠 Excesso de copy institucional antes da escolha.
- 🟠 Falta separação visual entre "automático" e "manual".
- 🟡 Título não expressa intenção da tela.
- 🟡 Estados de erro de geolocalização sem próximo passo claro.

---

## 2. TerritoryExplorerPage (`PublicCityLandingPage`, 1300+ linhas)

Papel: explorar um território amplo (cidade), ver bairros, destaques, mapa.

| # | Diagnóstico |
|---|---|
| 1 | Onde estou? | Ok (nome da cidade), mas o header tem elementos demais. |
| 2 | Objetivo claro? | Confuso: mistura descoberta de bairros, feed, empresas e institucional. |
| 3 | Excesso? | 🔴 Sim, muitas seções por tela. |
| 4 | Competição visual? | 🔴 Sim, cards de bairros, feed, empresas e eventos disputam a atenção. |
| 5 | CTA principal? | Ausente. Nenhum "próximo passo" óbvio. |
| 6 | Hierarquia? | Fraca — várias seções com peso similar. |
| 7 | Conteúdo desnecessário? | Sim: seções institucionais e promocionais. |
| 8 | Carga cognitiva? | 🔴 Muito alta. |
| 9 | Consistência com Territory Home? | Divergente: tipografia, densidade e chips são diferentes. |
| 10 | Premium? | Não — parece um portal municipal. |

Problemas:
- 🔴 Arquivo monolítico gera densidade excessiva.
- 🔴 Falta CTA principal ("escolher meu bairro").
- 🟠 Header sobrecarregado.
- 🟠 Feed e catálogo competem por atenção — deveriam ser destinos, não coabitar a tela.
- 🟡 Padrões de card divergem entre seções.

---

## 3. TerritoryHomePage

Papel: home oficial do território ativo (bairro). "O que importa aqui agora?"

| # | Diagnóstico |
|---|---|
| 1 | Onde estou? | ✅ Sim, chip de território é claro. |
| 2 | Objetivo? | ✅ Claro. |
| 3 | Excesso? | 🟡 Ações rápidas + destaques + explore geram muitos blocos. |
| 4 | Competição visual? | 🟡 Muitos "tones" coloridos (amber/green/violet/blue/orange/pink/rose) reduzem hierarquia. |
| 5 | CTA principal? | Busca + "Publicar" — ambígua. |
| 6 | Hierarquia? | Boa, mas o bloco "Hoje" precisa ganhar mais peso. |
| 7 | Conteúdo desnecessário? | Alguns micro-badges e ícones redundantes. |
| 8 | Carga cognitiva? | Média. |
| 9 | Consistência? | ✅ É a referência. |
| 10 | Premium? | Perto disso, mas paleta multi-cor tira sofisticação. |

Problemas:
- 🟠 Uso de 7 tons semânticos dilui hierarquia; reduzir a 2–3.
- 🟡 Cards de destaque têm variações demais (post/empresa/evento/oferta) sem sistema unificado.
- 🟡 Ícones decorativos em ações rápidas competem com o rótulo.
- 🟢 Falta empty-state quando "Hoje" está vazio.

---

## 4. TerritoryFeedPage (`ComunidadePage`)

Papel: timeline completa do território.

| # | Diagnóstico |
|---|---|
| 1 | Onde estou? | Parcial: "Comunidade" e não "Feed de <bairro>". |
| 2 | Objetivo? | Confuso: mistura abas (posts, grupos, alertas, achados, recomendações, comunicação). |
| 3 | Excesso? | 🔴 Sim, muitas abas. |
| 4 | Competição? | 🔴 Abas + filtros + composer + feed disputam foco. |
| 5 | CTA? | "Publicar" existe mas se perde entre elementos. |
| 6 | Hierarquia? | Fraca. |
| 7 | Desnecessário? | Abas raramente usadas (achados/recomendações) na barra primária. |
| 8 | Carga cognitiva? | Alta. |
| 9 | Consistência? | Diverge da Territory Home. |
| 10 | Premium? | Não. |

Problemas:
- 🔴 Excesso de abas na barra primária.
- 🟠 Composer não é a ação óbvia.
- 🟠 Título "Comunidade" genérico; deveria ecoar o território.
- 🟡 Filtros duplicados com abas.

---

## 5. PostPage

| # | Diagnóstico |
|---|---|
| 1 | Onde estou? | Falta breadcrumb "Feed do bairro". |
| 2 | Objetivo? | Ler + interagir — ok. |
| 3 | Excesso? | 🟡 Sidebars com "posts relacionados" quebram foco. |
| 4 | Competição? | 🟡 Ações (curtir/comentar/salvar/compartilhar) sem hierarquia. |
| 5 | CTA? | Comentar deveria ser a principal. |
| 6 | Hierarquia? | Média. |
| 7 | Desnecessário? | Chips repetidos e badges. |
| 8 | Cognitiva? | Média. |
| 9 | Consistência? | Ok. |
| 10 | Premium? | Média. |

Problemas:
- 🟠 Ação "comentar" pouco destacada.
- 🟡 Faltam retorno claro ao feed e âncora ao território.

---

## 6. Explorar (`BuscaPage` / `NearbyPage`)

Problemas:
- 🟠 Duas páginas ("Buscar" e "Perto de mim") com propósitos sobrepostos.
- 🟠 Campo de busca não é o elemento dominante.
- 🟡 Filtros abertos por padrão aumentam cognição inicial.
- 🟡 Estado vazio genérico ("nenhum resultado").

---

## 7. Empresas (`EmpresasLandingPage`)

Problemas:
- 🟠 Header institucional grande antes do catálogo.
- 🟠 Cards com peso desigual (foto/logo/tags).
- 🟡 CTA de "cadastrar meu negócio" mistura audiência morador vs. dono.
- 🟡 Falta filtro "aberto agora" com destaque.

---

## 8. Perfil (`ProfileSettingsPage`)

Problemas:
- 🟠 Excesso de seções empilhadas.
- 🟠 CTA principal ambígua entre "editar perfil" e "trocar perfil".
- 🟡 Tipografia densa.
- 🟢 Falta preview do perfil público.

---

## 9. Atividade (`NotificationsPage` + `MensagensPage`)

Problemas:
- 🔴 Mensagens e notificações vivem separadas — usuário não distingue "coisa para responder" de "aviso".
- 🟠 Estado vazio pouco útil.
- 🟡 Falta agrupamento por tipo.

---

## Resumo executivo

Críticos: TerritoryExplorer densidade, TerritoryFeed abas em excesso, separação Mensagens/Notificações, ausência de CTA no Explorer.
Altos: TerritorySelector com ações competindo, paleta multi-tom da Territory Home, composer/feed sem foco na Comunidade, Empresas com header pesado, Explorar com filtros por padrão.
Médios/Baixos: microcopy, empty-states, breadcrumbs, ícones decorativos, consistência tipográfica.
