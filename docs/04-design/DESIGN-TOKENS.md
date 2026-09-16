# DESIGN-TOKENS.md — SSOT Visual do Achegue-se

Documento oficial dos tokens visuais do produto. Toda decisão de cor, tipografia,
espaçamento, raio, sombra e ícone consulta este arquivo. Componentes não devem
introduzir valores concorrentes ao sistema.

Status: a identidade **Achegue-se / Território Vivo** está consolidada em uma
única origem executável. Autenticação, onboarding, e-mails, pré-lançamento,
superfícies selecionadas de comunidade e mobilidade e uma parte ampla do Admin
já foram migrados e protegidos pelo gate visual. Domínios ainda não listados no
gate continuam em migração progressiva para preservar cores funcionais de mapas,
métricas, categorias e estados em vez de aplicar substituições cegas.

---

## 1. Fontes da verdade

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Primitivos e tokens globais | `src/index.css` | **Owner executável** de marca, tipografia, semântica, temas e aliases territoriais. |
| Tailwind | `tailwind.config.ts` | Consome CSS vars; não redefine fonte nem paleta. |
| Fachada tipada | `src/styles/theme.ts` | `THEME`, `INLINE_STYLES`, `TAILWIND_CLASSES`, sempre sobre CSS vars. |
| Categorias semânticas | `src/shared/design-system/contentCategories.ts` | `getCategoryTokens(type)` — SSOT de cor por tipo de conteúdo. |
| Alto contraste | `src/styles/accessibility-core.css` | Overrides semânticos do modo de alto contraste. |
| Bootstrap da fonte | `index.html` | Carrega Plus Jakarta Sans 400/500/600/700/800 sem criar tokens. |
| Gate visual | `tools/architecture/validate-visual-ssot.ts` | Bloqueia regressões nas superfícies já migradas e na projeção de e-mail. |
| Empty state SSOT | `src/shared/components/EmptyState.tsx` | Estado vazio contextual em telas legadas. |
| Primitives territoriais | `src/app/components/territory-vivo/` + `src/shared/components/territory-vivo/` | Superfícies territoriais reutilizáveis. |

> Regra: componentes já migrados não usam `#hex`, `rgb()` ou classes arbitrárias
> de cor. Use token/classe semântica. Exceções são projeções de e-mail, estilos de
> mapa/dados ou superfícies ainda em migração; toda exceção precisa ter função
> explícita e não pode virar uma segunda paleta de marca.

### Onde editar

- Para mudar **cor/fonte global**, edite o primitivo correspondente em
  `src/index.css`. Não replique o valor em Tailwind, componentes ou páginas.
- Para disponibilizar um token em classes utilitárias, faça
  `tailwind.config.ts` consumir a CSS var existente; Tailwind não é owner do
  valor.
- Para uso programático, exponha o token por `src/styles/theme.ts`; não coloque
  HEX/HSL como segunda definição.
- Para uma cor que represente **categoria de conteúdo**, use
  `contentCategories.ts`/`--category-*`.
- Para mapa, gráfico ou outro dado operacional cuja cor carregue significado,
  mantenha esse significado e crie/reutilize um token de função quando houver
  repetição. Não transforme tudo em Petróleo/Solar.
- HTML de e-mail não recebe as CSS vars do app. Nesses arquivos, os HEX de marca
  são uma **projeção deliberada da SSOT** e o gate verifica que essa projeção não
  divergiu.

---

## 2. Primitivos de marca

Os HEX são a referência humana. Os HSL abaixo são a representação executável
**exata** em `src/index.css`.

| Token | Uso | HEX | HSL canônico |
| --- | --- | --- | --- |
| `--brand-petroleum` | Marca e ações principais | `#123E3D` | `178.636 55% 15.686%` |
| `--brand-solar` | Destaque pontual | `#F3CB4C` | `45.629 87.435% 62.549%` |
| `--brand-surface` | Marfim / fundo claro | `#FAFBF7` | `75 33.333% 97.647%` |
| `--brand-text` | Texto principal | `#203534` | `177.143 24.706% 16.667%` |
| `--brand-text-secondary` | Texto secundário | `#61736C` | `156.667 8.491% 41.569%` |

No tema claro, os tokens semânticos (`--background`, `--foreground`, `--primary`,
`--accent`, `--card` etc.) apontam para esses primitivos conforme o papel. O tema
escuro preserva valores próprios de contraste; não é uma aplicação cega dos HEX
claros.

Estados funcionais (`--semantic-success`, `--semantic-warning`,
`--semantic-error`, `--semantic-info`, `--semantic-focus`, seleção e disabled)
são independentes da marca.

### Extensão semântica Território Vivo

Esses tokens são aliases de intenção dentro da mesma SSOT; não são um tema
concorrente.

| Token | Papel |
| --- | --- |
| `--territory-canvas` | Plano de fundo natural da experiência territorial. |
| `--territory-surface` | Navegação, campos e agrupamentos primários. |
| `--territory-surface-raised` | Contraste discreto para itens e estados. |
| `--territory-raised` | Alias de compatibilidade para `--territory-surface-raised`. |
| `--territory-ink` | Texto principal. |
| `--territory-muted` | Texto secundário. |
| `--territory-muted-strong` | Texto secundário mais forte. |
| `--territory-brand` / `--territory-brand-strong` | Identidade e ação. |
| `--territory-warm` / `--territory-sun` | Sinalização editorial. |
| `--territory-border` | Separação de baixa ênfase. |
| `--territory-focus` | Foco visível por teclado. |
| `--territory-error/success/warning/info` | Estados funcionais territoriais. |
| `--territory-selection` | Seleção de texto/estado. |
| `--territory-disabled*` | Estados desabilitados. |

No Tailwind, esses valores são expostos sob `territory-*`. A marca organiza
identidade e ações; ela não substitui as cores semânticas de conteúdo ou dados.

---

## 3. Paleta semântica por categoria de conteúdo

Cada tipo de conteúdo tem uma cor própria, padronizada em todo o produto.
Definidas em `src/index.css` como `--category-<name>` e expostas via Tailwind
como `bg-category-<name>`, `text-category-<name>`, etc.

| Categoria | Chave | Token CSS | Uso principal |
| --- | --- | --- | --- |
| Alerta | `alert` | `--category-alert` | Segurança, urgência |
| Evento | `event` | `--category-event` | Eventos e agenda |
| Gastronomia | `gastronomy` | `--category-gastronomy` | Restaurantes, bares, delivery |
| Mobilidade | `mobility` | `--category-mobility` | Trânsito e transporte |
| Discussão | `discussion` | `--category-discussion` | Conversas do bairro |
| Empresa | `business` | `--category-business` | Comércio local e prestadores |
| Zeladoria | `civic` | `--category-civic` | Relato cívico |
| Favor | `help` | `--category-help` | Ajuda mútua |
| Classificado | `classified` | `--category-classified` | Anúncios de venda |
| Recomendação | `recommendation` | `--category-recommendation` | Indicações positivas |
| Pergunta | `question` | `--category-question` | Dúvidas |
| Enquete | `poll` | `--category-poll` | Votações |
| Achados | `found` | `--category-found` | Achados e perdidos |
| Desapego | `giveaway` | `--category-giveaway` | Doações |
| Neutro | `neutral` | `--category-neutral` | Post sem categoria específica |

### Uso obrigatório

```tsx
import { getCategoryTokens } from "@/shared/design-system/contentCategories";

const tokens = getCategoryTokens(post.type);
<span className={tokens.badge}>{tokens.label}</span>
<div className={tokens.chip}>Chip suave</div>
<article className={`border-l-4 ${tokens.border}`}>...</article>
```

Aliases de compatibilidade cobertos pelo `resolveCategoryKey` incluem PostType,
AlertType e verticais como empresa, profissional, gastronomia e mobilidade.
Valores decorativos antigos devem migrar progressivamente para categorias ou
tokens operacionais explícitos; nada novo nasce com uma cor solta sem função.

---

## 4. Tipografia

A única família aprovada é **Plus Jakarta Sans**.

| Papel | Fonte | Peso permitido |
| --- | --- | --- |
| Corpo / formulários / navegação | `Plus Jakarta Sans` | 400, 500, 600 |
| Headings | `Plus Jakarta Sans` | 600, 700 |
| Display / wordmark do concept | `Plus Jakarta Sans` | 800 |

Regras:

- `src/index.css` é o owner: `--font-sans` contém o stack completo e
  `--font-heading` aponta para esse mesmo stack;
- `tailwind.config.ts` apenas consome `var(--font-sans)` e
  `var(--font-heading)` em `font-sans`, `font-display` e `font-heading`;
- 400 é padrão de corpo; 500–600 para controles/ênfase; 700 para títulos;
  800 reservado a display/wordmark quando o concept aprovado realmente o utiliza;
- `index.html` solicita os pesos 400, 500, 600, 700 e 800;
- não introduzir uma segunda família sem decisão de design versionada e
  atualização deste SSOT;
- o fallback global é `Arial, Helvetica, sans-serif` e continua funcional se a
  fonte web não estiver disponível.

Escala tipográfica canônica:

| Uso | Classe | Tamanho |
| --- | --- | --- |
| Título de tela | `text-2xl md:text-3xl font-semibold` | 24 / 30 px |
| Subtítulo de seção | `text-base font-semibold` | 16 px |
| Corpo | `text-sm` | 14 px |
| Meta / captions | `text-xs text-muted-foreground` | 12 px |
| Eyebrow | `text-[11px] uppercase tracking-wide` | 11 px |

---

## 5. Espaçamentos

Tokens em `src/index.css`:

| Token | Valor | Uso |
| --- | --- | --- |
| `--space-xs` | `0.25rem` | Ajustes finos, ícone↔texto |
| `--space-sm` | `0.5rem` | Gap entre chips |
| `--space-md` | `1rem` | Padding padrão de card |
| `--space-lg` | `1.5rem` | Gap entre blocos |
| `--space-xl` | `2rem` | Gap entre seções mobile |
| `--space-2xl` | `3rem` | Gap entre seções desktop |

Regra: espaçamento vertical entre seções `space-y-8` mobile, `space-y-12`
desktop. Padding de card padrão `p-4 md:p-6`.

---

## 6. Raios

| Token | Valor | Uso |
| --- | --- | --- |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Inputs, chips discretos |
| `--radius-md` | `calc(var(--radius) - 2px)` | Botões |
| `--radius-lg` | `var(--radius)` | Cards padrão |
| `--radius-xl` | `calc(var(--radius) + 4px)` | Cards de destaque |
| `--radius-full` | `9999px` | Avatares, chips, tags |

A fundação territorial expõe também `rounded-territory` e
`rounded-territory-highlight`. Valores arbitrários devem desaparecer conforme a
superfície é migrada, sem substituição global cega.

---

## 7. Sombras

| Token | Uso |
| --- | --- |
| `--shadow-sm` | Destaque leve. |
| `--shadow-md` | Popovers. |
| `--shadow-lg` | Modais/drawers. |
| `--shadow-xl` | Overlays. |
| `--shadow-accent` | CTA de destaque com moderação. |
| `--shadow-glow-primary(-strong)` | Destaques animados. |
| `shadow-territory-highlight` | Elevação territorial discreta. |

Padrão default: `shadow-none`. Sombra existe quando comunica elevação real.

---

## 8. Ícones

- Biblioteca padrão: `lucide-react` para ícones de interface.
- Estilo: outline.
- Tamanho canônico: `h-5 w-5` inline / `h-6 w-6` em ações primárias.
- Cor via token semântico, nunca uma cor de marca duplicada localmente.
- Assets ilustrativos e marcas oficiais são exceções ao contrato de ícones de UI.

---

## 9. CTA primária

Cada superfície deve ter hierarquia clara de ação. A CTA primária usa o token de
ação apropriado ao tema; Solar é destaque, não substituto universal para toda ação.
Ações secundárias/terciárias devem manter hierarquia e foco acessível.

---

## 10. Empty states

Superfícies legadas usam `<EmptyState />`. Superfícies Território Vivo usam
`<TerritoryState />` quando aplicável. Estado vazio deve explicar contexto,
próximo passo e nunca inventar dados.

Microcopy padrão:

| Local | Copy |
| --- | --- |
| Feed vazio | "Ainda sem publicações em <bairro>. Seja o primeiro a compartilhar." |
| Busca vazia | "Não encontramos isso em <bairro>. Tente ampliar para <cidade>." |
| Erro geo | "Não consegui pegar sua localização. Escolher cidade manualmente." |
| Loader bootstrap | "Preparando seu território..." |

---

## 11. Checklist de conformidade

Ao criar/alterar qualquer componente:

- [ ] Nenhuma nova cor literal para papel já coberto por token.
- [ ] Cores de conteúdo passam por `getCategoryTokens` quando representam categoria.
- [ ] Cores de mapa/gráfico/dado permanecem funcionais e recebem token próprio quando reutilizadas.
- [ ] Textos usam tokens semânticos adequados ao tema.
- [ ] Superfícies territoriais usam `TerritorySurface`/`territory-*` quando compatível.
- [ ] Foco visível usa o contrato semântico.
- [ ] Uma hierarquia clara de CTA por tela.
- [ ] Empty state possui contexto e próximo passo.
- [ ] Tipografia usa Plus Jakarta Sans via `font-sans`/`font-heading`/tokens; nenhuma segunda família sem decisão versionada.
- [ ] Máx. 3 níveis de peso tipográfico por tela; 800 só para display/wordmark aprovado pelo concept, nunca por conveniência.
- [ ] Superfície migrada adicionada a `validate-visual-ssot.ts`.
- [ ] Claro, escuro e alto contraste revisados antes de declarar a migração encerrada.

Descumprimento bloqueia review. Este documento deve acompanhar qualquer mudança
no contrato visual executável.

---

## 12. Cobertura de migração

A lista **executável e atual** de superfícies protegidas fica em
`MIGRATED_RUNTIME_FILES`, dentro de `tools/architecture/validate-visual-ssot.ts`.
Esse array é a autoridade para dizer que uma superfície já não pode voltar a
receber HEX/RGB ou famílias tipográficas legadas.

Na cobertura atual estão, entre outras:

- autenticação e onboarding;
- pré-lançamento;
- confirmação de e-mail e projeções de e-mail transacional;
- comentários e grupos da comunidade já migrados;
- chat e sidebars de mobilidade já migrados;
- shell do Admin, cupons, eventos, mensagens, moderação, operações,
  analytics/realtime de mobilidade, reivindicações, serviços e pontos de embarque;
- gestão de motoristas e as abas de detalhe administrativo já migradas.

Não interprete esta lista como declaração de que **todo o produto** terminou a
migração. Uma página/componente só entra nesse conjunto depois que seus usos de
cor e tipografia são revisados por função. Mapas, gráficos, categorias e estados
operacionais podem manter cores distintas quando elas carregam significado.
