# UX-IMPROVEMENTS.md — Sprint UX.1

Guia de melhorias derivado de `UX-AUDIT.md`. Somente UX — sem funcionalidades novas, sem arquitetura, sem backend.

## Princípios

1. Uma tela = uma intenção primária.
2. Toda tela responde: onde estou, o que faço agora, o que vem depois.
3. Reduzir tons, densidade e chrome — sofisticação vem do vazio.
4. Consistência com Territory Home é a régua visual.
5. Empty e loading são conteúdo, não ausência.

---

## O que simplificar

- **TerritorySelector**: uma ação primária ("usar minha localização"), busca como secundária, listas manuais como terciárias (colapsáveis).
- **TerritoryExplorer**: reduzir a 3 seções — bairros, destaques, explorar. Feed vai para o Feed, empresas vão para Empresas.
- **TerritoryHome**: reduzir paleta de tons a 3 (neutro + accent + alerta). Ícones em ações rápidas em outline, tamanho único.
- **TerritoryFeed**: 3 abas no topo (Feed, Grupos, Alertas). Restantes viram filtros dentro do Feed ou destinos de "Explorar".
- **PostPage**: hierarquia de ações — "Comentar" como CTA principal, demais como ícones neutros.
- **Explorar**: colapsar filtros por padrão, busca dominante, "perto de mim" vira chip.
- **Empresas**: header enxuto (título + busca), CTA "cadastrar meu negócio" só via link no rodapé.
- **Perfil**: agrupar em 4 blocos — Identidade, Preferências, Territórios, Sessão.
- **Atividade**: unificar Mensagens e Notificações em uma tela com abas "Tudo / Mensagens / Alertas".

## O que remover

- Blocos institucionais acima da dobra em TerritorySelector e TerritoryExplorer.
- Chips e badges decorativos duplicados em cards.
- Sidebar de "posts relacionados" na PostPage mobile.
- Filtros repetidos que também aparecem como abas.
- Ícones decorativos redundantes ao lado do rótulo em ações rápidas.

## O que mover

- CTA "publicar" da Comunidade → FAB persistente (já existe em BottomNav).
- "Cadastrar empresa" → rodapé de Empresas.
- Institucional (Sobre, Termos) → footer, nunca corpo de landing.
- Analytics/gestão → fora da navegação de morador (mover para Central/Perfil).

## O que deixar contextual

- Filtros avançados (preço, avaliação, distância) — abrir só após escolha de categoria.
- Ações de moderação — só aparecer para perfis com role.
- CTAs comerciais dentro do Feed — apenas via cards de destaque no bloco "Hoje".

## O que transformar em descoberta

- Bairros dentro da cidade → carrossel horizontal em vez de grid denso.
- Categorias em Explorar → chips + resultados agrupados por tipo.
- Grupos e Comunicação → destinos acessíveis via Feed, não abas primárias.

---

## Microcopy — antes / depois

| Local | Antes | Depois |
|---|---|---|
| Bootstrap loader | "Carregando..." | "Preparando seu território..." |
| Empty feed | "Nenhum post" | "Ainda sem publicações por aqui. Seja o primeiro a compartilhar." |
| Empty search | "Nenhum resultado" | "Não encontramos isso em <bairro>. Tente ampliar para <cidade>." |
| Error geolocalização | "Erro" | "Não consegui pegar sua localização. Escolher cidade manualmente." |
| CTA Publicar | "Novo post" | "Publicar no bairro" |
| Aba Atividade | "Notificações" | "Atividade" |
| Header Feed | "Comunidade" | "Feed de <bairro>" |

---

## Consistência visual (regras de sistema)

- 1 tipografia, 2 pesos por tela.
- Border radius único (`rounded-2xl` em cards, `rounded-full` em chips).
- Elevação: `shadow-none` como padrão; `shadow-sm` só em cards de destaque.
- Espaçamento vertical entre seções: `space-y-8` mobile / `space-y-12` desktop.
- Cor: neutro (foreground/muted) + `primary` como accent único + `destructive` para alertas. Zero uso decorativo de amber/violet/pink/rose.
- Ícones: outline, tamanho 20 (inline) ou 24 (ações), stroke-width consistente.

---

## Plano de implementação (somente UX)

Fase 1 — Base de percepção (rápido, sem risco):
- Microcopy do loader e empty-states principais.
- Header consistente na TerritoryFeed com nome do bairro.
- Reduzir paleta de tons na TerritoryHome (accent único).

Fase 2 — Densidade:
- Colapsar filtros em Explorar; busca dominante.
- Reduzir seções da TerritoryExplorer.
- Enxugar header em Empresas.

Fase 3 — Consistência:
- Padronizar cards (radius, sombras, chips).
- Padronizar espaçamentos entre seções.
- Padronizar CTA principal por tela.

Fase 4 — Atividade unificada (somente UX; sem tocar dados):
- Layout único com abas Tudo / Mensagens / Alertas reusando fontes existentes.

---

## Critério de sucesso (checklist de navegação)

- [ ] Toda tela mostra território ativo no topo.
- [ ] Toda tela tem exatamente uma CTA primária visível.
- [ ] Toda lista tem empty-state com próximo passo.
- [ ] Todo loading acima de 2s mostra mensagem contextual.
- [ ] Nenhuma tela usa mais que 3 tons de cor além do neutro.
- [ ] Nenhuma barra primária tem mais que 4 itens.
