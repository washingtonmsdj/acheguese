# Identidade visual do Achegue-se

## Fonte de verdade

A autoridade executável da identidade visual é `src/index.css`. Esse arquivo possui os primitivos de marca, a família tipográfica, tokens semânticos, aliases territoriais, estados e temas. `tailwind.config.ts` apenas expõe essas variáveis em classes utilitárias; `src/styles/theme.ts` apenas fornece uma fachada TypeScript sobre a mesma origem. Não deve existir uma segunda paleta ou uma segunda declaração de fonte em componentes, páginas ou configuração do Tailwind.

A fonte única do produto é **Plus Jakarta Sans**, incluindo títulos, corpo, formulários, navegação e marca textual. O bootstrap em `index.html` solicita os pesos 400, 500, 600, 700 e 800. O stack canônico é `--font-sans`; `--font-heading` é um alias do mesmo stack. Peso 800 fica reservado a display/wordmark ou hierarquias explicitamente aprovadas no concept.

## Tokens de marca

Os HEX abaixo são a referência humana da marca e os HSL são a representação executável correspondente em `src/index.css`.

| Uso | Token | HEX | HSL canônico |
| --- | --- | --- | --- |
| Ações principais e identidade | `--brand-petroleum` | `#123E3D` | `178.636 55% 15.686%` |
| Destaque pontual | `--brand-solar` | `#F3CB4C` | `45.629 87.435% 62.549%` |
| Fundo claro | `--brand-surface` | `#FAFBF7` | `75 33.333% 97.647%` |
| Texto principal | `--brand-text` | `#203534` | `177.143 24.706% 16.667%` |
| Texto secundário | `--brand-text-secondary` | `#61736C` | `156.667 8.491% 41.569%` |
| Texto secundário compacto | `--brand-text-secondary-strong` | variante de contraste | semântico em `src/index.css` |

Em superfícies claras, `--primary`, `--accent`, `--background`, `--foreground`, `--card` e seus aliases consomem os primitivos acima conforme sua função. Alterar uma referência de marca deve ser feito em `src/index.css`, nunca página por página.

## Estados, categorias e cores operacionais

Marca não substitui semântica. Erro (`--semantic-error`), sucesso (`--semantic-success`), aviso (`--semantic-warning`), informação (`--semantic-info`), foco (`--semantic-focus`), seleção e estados desabilitados têm tokens próprios. Categorias de conteúdo usam `--category-*` e o helper `src/shared/design-system/contentCategories.ts`.

Mapas, gráficos e interfaces operacionais podem preservar cores necessárias à leitura dos dados. Nesses casos, a cor deve expressar uma função real e permanecer separada da paleta de marca. Não se deve transformar toda cor funcional em Petróleo ou Solar. O mapa mantém seu estilo cartográfico; a identidade controla moldura, texto, navegação, foco e ações quando aplicável.

## Temas

- Claro: a identidade de marca é aplicada diretamente às superfícies e aliases semânticos.
- Escuro: mantém contraste e legibilidade próprios; não deve ser uma simples inversão ou aplicação cega do Petróleo sobre fundo escuro.
- Alto contraste: `src/styles/accessibility-core.css` sobrescreve os tokens necessários e deve continuar cobrindo componentes genéricos, territoriais e elementos renderizados em portais.

`--territory-*` é uma camada de aliases de intenção dentro da mesma SSOT, não um tema concorrente. `--territory-raised` é compatibilidade semântica para `--territory-surface-raised` e existe na origem global para que consumidores antigos não apontem para variável inexistente.

## E-mails

Clientes de e-mail não carregam a CSS da aplicação. Por isso `supabase/templates/confirmation.html` e o shell de `src/core/notifications/services/EmailService.ts` usam uma projeção literal e restrita dos mesmos HEX de marca, com Plus Jakarta Sans como primeira opção e fallbacks seguros. Essa projeção não autoriza criar uma segunda paleta. Mudanças de marca exigem atualizar a origem e sua projeção de e-mail no mesmo corte.

## Validação automática

`tools/architecture/validate-visual-ssot.ts` protege os primitivos canônicos, o ownership tipográfico, superfícies já migradas e a projeção dos e-mails. `npm run validate:visual:ssot` executa essa regra e `npm run validate:ssot` a inclui junto às demais validações de SSOT.

A migração é incremental e proporcional: superfícies já declaradas no validador não podem receber novamente HEX/RGB arbitrário ou famílias antigas; domínios ainda não migrados são auditados e convertidos conforme sua função para evitar substituição global cega.

## Validação de acessibilidade

- Fonte migrada para Plus Jakarta Sans, com 400 para texto, 500–600 para controles, 700 para títulos e 800 reservado a display/wordmark quando o concept exige ênfase extra.
- Áreas de toque e controles preservam o mínimo de 44px definido pelo sistema de acessibilidade existente.
- Foco visível usa `--semantic-focus`; movimento reduzido continua desabilitando transições e animações.
- `#123E3D` sobre `#FAFBF7`: contraste aproximado 11,34:1.
- `#203534` sobre `#F3CB4C`: contraste aproximado 8,31:1.
- `#203534` sobre `#FAFBF7`: contraste aproximado 12,47:1.
- `#61736C` sobre `#FAFBF7`: contraste aproximado 4,84:1; atende AA para texto normal e AAA para texto grande, mas não AAA para texto normal. Textos compactos essenciais devem usar `--brand-text-secondary-strong` ou `--brand-text` quando o contraste real exigir.

Ainda é necessário verificar com leitor de tela, zoom real a 200%, teclado virtual e combinações de navegador/OS antes de declarar conformidade WCAG AAA completa. Testes automáticos não são suficientes para essa declaração.

## Estado de migração

Já consomem o contrato consolidado: shell de autenticação, login, cadastro, confirmação de cadastro, primeiro acesso, aceite de termos, recuperação de senha, confirmação de troca de e-mail, página pública de pré-lançamento e e-mails transacionais. A página de pré-lançamento preserva diferenças editoriais usando tokens de categoria, sem reintroduzir Manrope/Bricolage.

A página operacional de cidade/comunidade ainda possui uma paleta escura funcional própria. Sua tipografia e papéis de marca devem migrar sem destruir a semântica de mapa, métricas, alertas, categorias e estados. Esse domínio não deve ser marcado como totalmente migrado enquanto os valores funcionais não estiverem classificados em tokens explícitos.

## Regra para novas alterações

1. Defina ou altere o valor em `src/index.css` quando ele for global.
2. Consuma via Tailwind, `THEME` ou variável CSS semântica; não repita o valor literal.
3. Use `--category-*` para categorias e tokens operacionais próprios para mapas/dados.
4. Não carregue outra família tipográfica em uma página.
5. Ao migrar uma superfície, adicione-a ao gate visual para impedir regressão.
6. Não declare AAA apenas porque as cores principais passam em contraste; valide a combinação real e a interação completa.
