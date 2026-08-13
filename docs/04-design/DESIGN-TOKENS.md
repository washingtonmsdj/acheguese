# DESIGN-TOKENS.md — SSOT Visual do Achegue-se

Documento oficial dos tokens visuais do produto. Toda decisão de cor, tipografia,
espaçamento, raio, sombra e ícone consulta este arquivo. Componentes NÃO podem
introduzir valores fora deste sistema.

Status: fundação **Território Vivo** implementada na Home territorial e em
Explorar na Fase 4.2. Os tokens legados continuam válidos para superfícies ainda
não migradas; novas superfícies territoriais usam a extensão semântica abaixo,
sem criar um segundo tema independente.

---

## 1. Fontes da verdade

| Camada                         | Arquivo                                                      | Papel                                                           |
| ------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------- |
| Tokens raiz (CSS vars)         | `src/index.css`                                              | Definição HSL de todos os tokens (dark + light).                |
| Tailwind (classes utilitárias) | `tailwind.config.ts`                                         | Mapeia tokens para `bg-*`, `text-*`, `border-*`.                |
| Facade tipada                  | `src/styles/theme.ts`                                        | `THEME`, `INLINE_STYLES`, `TAILWIND_CLASSES`.                   |
| Categorias semânticas          | `src/shared/design-system/contentCategories.ts`              | `getCategoryTokens(type)` — SSOT de cor por tipo de conteúdo.   |
| Empty state SSOT               | `src/shared/components/EmptyState.tsx`                       | Estado vazio contextual em todas as telas.                      |
| Primitives territoriais        | `src/app/components/territory-vivo/`                         | Superfície, busca, estado, topbar, mapa e navegação adaptativa. |
| Header territorial atual       | `src/app/components/territory-vivo/TerritoryTopbar.tsx`      | Contexto e troca de território na Home/Explorar.                |
| Header social legado           | `src/core/community/components/feed/TerritoryFeedHeader.tsx` | Cabeçalho do Feed até sua migração visual posterior.            |

> Regra: NENHUM componente usa `#hex`, `rgb()`, ou classes arbitrárias
> `bg-[#...]`. Sempre via token ou classe utilitária Tailwind semântica.

---

## 2. Paleta neutra (base do sistema)

| Token                | Uso                     | Dark                 | Light         |
| -------------------- | ----------------------- | -------------------- | ------------- |
| `--background`       | Fundo geral da tela     | `200 20% 9%`         | `0 0% 100%`   |
| `--foreground`       | Texto principal         | `0 0% 98%`           | `0 0% 5%`     |
| `--card`             | Superfície de card      | `202 15% 14%`        | `0 0% 100%`   |
| `--muted`            | Fundos discretos        | `202 15% 14%`        | `0 0% 96%`    |
| `--muted-foreground` | Texto secundário        | `0 0% 60%`           | `0 0% 45%`    |
| `--border`           | Bordas                  | `0 0% 20%`           | `0 0% 90%`    |
| `--primary`          | Cor da marca (accent 1) | `171 77% 56%` (teal) | `171 77% 40%` |
| `--accent`           | Accent complementar     | `188 78% 47%`        | `188 78% 40%` |

Status: `--success` (verde), `--warning` (âmbar), `--destructive` (vermelho),
`--info` (azul). Reservados exclusivamente para feedback funcional.

### Extensão semântica Território Vivo

Esses tokens são aliases de intenção dentro do mesmo `:root`/`.light`; não são
um tema concorrente. Eles permitem migrar superfícies por etapas sem alterar
Community, Feed, Perfil e módulos ainda fora do escopo.

| Token                                            | Papel                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| `--territory-canvas`                             | Plano de fundo natural da experiência territorial. |
| `--territory-surface`                            | Navegação, campos e agrupamentos primários.        |
| `--territory-surface-raised`                     | Contraste discreto para itens e estados.           |
| `--territory-ink`                                | Texto principal.                                   |
| `--territory-muted`                              | Texto secundário com contraste acessível.          |
| `--territory-brand` / `--territory-brand-strong` | Identidade e ação primária.                        |
| `--territory-warm` / `--territory-sun`           | Sinalização editorial semântica.                   |
| `--territory-border`                             | Separação de baixa ênfase.                         |
| `--territory-focus`                              | Foco visível por teclado.                          |

No Tailwind, esses valores são expostos sob `territory-*`. Verde identifica
contexto, seleção e ação; não colore indiscriminadamente todo o conteúdo.

---

## 3. Paleta semântica por categoria de conteúdo

Cada tipo de conteúdo tem uma cor própria, padronizada em todo o produto.
Definidas em `src/index.css` como `--category-<name>` e expostas via Tailwind
como `bg-category-<name>`, `text-category-<name>`, etc.

| Categoria    | Chave            | Token CSS                   | Uso principal                                     |
| ------------ | ---------------- | --------------------------- | ------------------------------------------------- |
| Alerta       | `alert`          | `--category-alert`          | Segurança, urgência (crime, incêndio, alagamento) |
| Evento       | `event`          | `--category-event`          | Encontros, festas, agenda                         |
| Gastronomia  | `gastronomy`     | `--category-gastronomy`     | Restaurantes, bares, delivery                     |
| Mobilidade   | `mobility`       | `--category-mobility`       | Trânsito, transporte, via bloqueada               |
| Discussão    | `discussion`     | `--category-discussion`     | Conversas do bairro                               |
| Empresa      | `business`       | `--category-business`       | Comércio local, prestadores                       |
| Zeladoria    | `civic`          | `--category-civic`          | Buraco, iluminação, lixo, reporte cívico          |
| Favor        | `help`           | `--category-help`           | Empréstimo, ajuda mútua                           |
| Classificado | `classified`     | `--category-classified`     | Anúncios de venda                                 |
| Recomendação | `recommendation` | `--category-recommendation` | Indicações positivas                              |
| Pergunta     | `question`       | `--category-question`       | Dúvidas                                           |
| Enquete      | `poll`           | `--category-poll`           | Votações                                          |
| Achados      | `found`          | `--category-found`          | Achados & perdidos                                |
| Desapego     | `giveaway`       | `--category-giveaway`       | Doações                                           |
| Neutro       | `neutral`        | `--category-neutral`        | Post genérico sem categoria                       |

### Uso obrigatório

```tsx
import { getCategoryTokens } from "@/shared/design-system/contentCategories";

const tokens = getCategoryTokens(post.type); // aceita "alerta", "alert", "civic_report"...
<span className={tokens.badge}>{tokens.label}</span>
<div className={tokens.chip}>Chip suave</div>
<article className={`border-l-4 ${tokens.border}`}>...</article>
```

Aliases de compatibilidade cobertos pelo `resolveCategoryKey`:

- PostType (`alerta`, `discussao`, `civic_report`, `ride_share`, …)
- AlertType (`crime`, `flood`, `road_closure`, …)
- Verticals (`empresa`, `profissional`, `gastronomia`, `mobilidade`)

Cores decorativas hardcoded (`bg-red-100`, `text-orange-600`, `#3B82F6`) em
constantes legadas (`alertTypes.ts`, `postTypeConfig.ts`, `businessConstants.ts`,
`mapUtils.ts`) devem migrar progressivamente para `getCategoryTokens`. Enquanto
não migram, ficam bloqueadas de expansão — nada novo pode nascer com cor solta.

---

## 4. Tipografia

| Papel            | Fonte           | Peso permitido |
| ---------------- | --------------- | -------------- |
| Headings (h1–h6) | `Space Grotesk` | 500, 600       |
| Corpo / UI       | `DM Sans`       | 400, 500       |

Regra: usar `DM Sans` no corpo/UI e `Space Grotesk` na hierarquia editorial,
exposta por `font-heading`. Priorizar pesos 400, 500 e 600; 700 fica restrito a
labels compactos/eyebrows em 9–11 px quando necessário para legibilidade. Não
introduzir uma terceira família tipográfica na mesma superfície.

Escala tipográfica canônica (Tailwind default):

| Uso                 | Classe                                | Tamanho    |
| ------------------- | ------------------------------------- | ---------- |
| Título de tela      | `text-2xl md:text-3xl font-semibold`  | 24 / 30 px |
| Subtítulo de seção  | `text-base font-semibold`             | 16 px      |
| Corpo               | `text-sm`                             | 14 px      |
| Meta / captions     | `text-xs text-muted-foreground`       | 12 px      |
| Eyebrow (uppercase) | `text-[11px] uppercase tracking-wide` | 11 px      |

---

## 5. Espaçamentos

Tokens em `src/index.css`:

| Token         | Valor           | Uso                        |
| ------------- | --------------- | -------------------------- |
| `--space-xs`  | `0.25rem` (4px) | Ajustes finos, ícone↔texto |
| `--space-sm`  | `0.5rem` (8px)  | Gap entre chips            |
| `--space-md`  | `1rem` (16px)   | Padding padrão de card     |
| `--space-lg`  | `1.5rem` (24px) | Gap entre blocos           |
| `--space-xl`  | `2rem` (32px)   | Gap entre seções mobile    |
| `--space-2xl` | `3rem` (48px)   | Gap entre seções desktop   |

Regra: espaçamento vertical entre seções `space-y-8` mobile, `space-y-12`
desktop. Padding de card padrão `p-4 md:p-6`.

---

## 6. Raios

| Token           | Valor                       | Uso                     |
| --------------- | --------------------------- | ----------------------- |
| `--radius-sm`   | `calc(var(--radius) - 4px)` | Inputs, chips discretos |
| `--radius-md`   | `calc(var(--radius) - 2px)` | Botões                  |
| `--radius-lg`   | `var(--radius)` (0.75rem)   | Cards padrão            |
| `--radius-xl`   | `calc(var(--radius) + 4px)` | Cards de destaque       |
| `--radius-full` | `9999px`                    | Avatares, chips, tags   |

A fundação territorial expõe também `rounded-territory` (14 px) e
`rounded-territory-highlight` (18 px). São os dois níveis de raio da Home e de
Explorar; valores arbitrários continuam proibidos.

Regra visual: **`rounded-2xl` em cards, `rounded-full` em chips.** Nada de raios
soltos como `rounded-[10px]`.

---

## 7. Sombras

| Token                            | Uso                                                          |
| -------------------------------- | ------------------------------------------------------------ |
| `--shadow-sm`                    | Cards de destaque (opcional).                                |
| `--shadow-md`                    | Popovers.                                                    |
| `--shadow-lg`                    | Modais, drawers.                                             |
| `--shadow-xl`                    | Overlays de tela cheia.                                      |
| `--shadow-accent`                | Botão premium / CTA principal (usar com moderação).          |
| `--shadow-glow-primary(-strong)` | Estados de destaque animados.                                |
| `shadow-territory-highlight`     | Elevação mínima para busca e superfície editorial destacada. |

Padrão default: `shadow-none`. Só usar sombra em elemento que precisa saltar da
superfície (modal, toast, card de destaque no bloco "Hoje").

---

## 8. Ícones

- Biblioteca única: `lucide-react`.
- Estilo: **outline** (padrão do Lucide).
- Tamanho canônico: `h-5 w-5` (20px) inline / `h-6 w-6` (24px) em ações
  primárias.
- `strokeWidth` consistente: `1.75` (padrão) ou `2` (ênfase).
- Cor: sempre via `text-*` semântico (`text-muted-foreground`,
  `text-category-alert`, …), nunca hex.

---

## 9. CTA única por tela

Regra UX: **cada tela tem exatamente uma CTA primária visível.** Demais ações
são secundárias (`variant="outline"`) ou terciárias (`variant="ghost"`,
ícone-only).

Padrões:

- Feed: FAB "Publicar no bairro" (`BottomNav` central).
- PostPage: "Comentar" como CTA primário; reagir/salvar/compartilhar como ícones.
- Empresas: busca dominante no header; "Cadastrar meu negócio" só em rodapé.
- Explorar: busca dominante; filtros colapsados por padrão.

---

## 10. Empty states

Superfícies legadas usam `<EmptyState />` de
`src/shared/components/EmptyState.tsx`. Home e Explorar usam
`<TerritoryState />`, da mesma família visual territorial, para combinar estado,
contexto e próximo passo sem card dentro de card.

Regra: título direto no território + descrição com próximo passo + CTA opcional.

Microcopy padrão (`docs/ux/UX-IMPROVEMENTS.md`):

| Local            | Copy                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| Feed vazio       | "Ainda sem publicações em <bairro>. Seja o primeiro a compartilhar." |
| Busca vazia      | "Não encontramos isso em <bairro>. Tente ampliar para <cidade>."     |
| Erro geo         | "Não consegui pegar sua localização. Escolher cidade manualmente."   |
| Loader bootstrap | "Preparando seu território..."                                       |

---

## 11. Checklist de conformidade

Ao criar/alterar qualquer componente:

- [ ] Nenhum `#hex`, `rgb()` ou `bg-[#...]` no arquivo.
- [ ] Cores de conteúdo passam por `getCategoryTokens`.
- [ ] Textos usam `text-foreground` / `text-muted-foreground` / `text-category-*`.
- [ ] Superfícies territoriais usam `TerritorySurface`/`territory-*`; telas ainda não migradas mantêm os tokens globais.
- [ ] Chips usam `rounded-full`.
- [ ] Uma única CTA primária visível por tela.
- [ ] Empty state via `<TerritoryState />` na experiência territorial ou `<EmptyState />` no legado, sempre com próximo passo.
- [ ] Header do território presente no topo (`TerritoryTopbar` na Home/Explorar ou equivalente no domínio).
- [ ] Máx. 2 pesos tipográficos por tela.
- [ ] Ícones Lucide outline, tamanho 20 ou 24, cor semântica.

Descumprimento bloqueia review. Este documento é atualizado sempre que um novo
token entra no sistema.
