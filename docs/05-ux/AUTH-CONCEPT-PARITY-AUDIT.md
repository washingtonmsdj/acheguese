# Conta e acesso — auditoria de paridade com o concept

> SSOT visual: pranchas aprovadas de **Conta e acesso — Mobile**, **Recuperar acesso — Mobile** e **Conta e acesso — Desktop** fornecidas para esta implementação.
>
> Esta auditoria separa **paridade confirmável pelo código/asset** de **paridade pixel a pixel**. A segunda só pode ser declarada depois de comparar screenshots renderizados do app com as pranchas no mesmo viewport.

## Critério

- **OK** — estrutura/copy/comportamento verificável corresponde ao concept.
- **PARCIAL** — direção correta, mas ainda existe diferença visível, de copy ou de estado.
- **FALHA** — divergência objetiva bloqueia a fidelidade.
- Funcionalidade real e segurança vencem estados meramente demonstrativos da prancha. Não fingir sucesso, captcha, confirmação ou reenvio.

## Mobile — Conta e acesso

### 01 · Entrar

| Item | Estado | Pente fino |
| --- | --- | --- |
| Logo central + voltar | OK | Cabeçalho mobile centralizado, botão voltar próprio e safe-area superior. |
| Título e subtítulo | OK | `Bom ter você por aqui.` + `Entre para continuar sua conversa.` |
| Retorno ao contexto | PARCIAL | O card aparece quando existe retorno, mas usa fallback `onde parou`; a prancha demonstra um destino legível (`Sabores da Ana`). |
| E-mail ou @usuário | OK | Login aceita os dois tipos de identificador. |
| Senha + mostrar/ocultar | OK | Controle acessível e sem SVG/Lucide. |
| Esqueci minha senha | OK | Abre o fluxo de recuperação e reaproveita o e-mail quando possível. |
| Google | OK funcional | Só aparece quando o provedor está realmente habilitado; não existe botão decorativo. |
| Criar conta | OK | Preserva retorno interno seguro. |
| Explorar sem conta | OK | Mantido no mobile público. |
| Segurança | OK | Copy/hierarquia do concept. |
| Termos · Privacidade · Ajuda | OK | Rodapé exclusivo do login mobile, como na prancha. |

### 02 · Criar conta

| Item | Estado | Pente fino |
| --- | --- | --- |
| Cadastro em uma única tela | OK | Território e confirmação de senha não bloqueiam a criação inicial. |
| Nome / usuário / e-mail / senha | OK | Estrutura igual ao concept. |
| `@ana.oliveira` demonstrativo | PARCIAL | O domínio real aceita letras minúsculas, números e `_`, mas não ponto. Como a prancha declara dados demonstrativos, não afrouxar apenas a UI sem decisão de produto e migração end-to-end. |
| Política da senha | OK funcional | Regra central: 12+, maiúscula, minúscula, número e símbolo. |
| Termos | OK | Obrigatórios e vinculados a páginas reais. |
| Como usamos seus dados | OK | Disclosure mobile preservado; desktop usa link compacto. |
| CTA | OK | Estado desabilitado acompanha termos + anti-bot real. |

### 03 · Confirmar e-mail

| Item | Estado | Pente fino |
| --- | --- | --- |
| Envelope central | OK | `confirm-envelope.webp` usa o recorte 120×115 aprovado. |
| Título / e-mail / 3 passos | OK | Estrutura e ordem do concept. |
| Spam | OK | Aviso presente. |
| Reenviar | OK funcional | Tem estado real de envio e cooldown após sucesso. |
| E-mail errado | OK | Reinicia cadastro de forma segura; não altera identidade pendente silenciosamente. |
| Conta aguardando confirmação | OK | Estado explícito. |
| Voltar / ajuda | OK | Ações reais. |

### 04 · Primeiro acesso

| Item | Estado | Pente fino |
| --- | --- | --- |
| Sucesso + perfil pessoal | OK | Implementado. |
| Retomar conversa | OK funcional | Preserva o retorno interno seguro. |
| Nome da conversa/negócio | PARCIAL | O destino é preservado, mas a copy ainda é genérica quando não existe metadado amigável. |
| Território opcional | OK | Estado → cidade → bairro depois da conta; não bloqueia cadastro. |
| Privacidade territorial | OK | Visibilidade pública começa oculta. |
| Agora não | OK | Usuário pode seguir sem território. |
| Outros perfis | OK | Link para gestão de perfis. |

## Mobile — Recuperar acesso

### 01 · Solicitar recuperação

| Item | Estado | Pente fino |
| --- | --- | --- |
| Voltar com texto | OK | Fluxo `/reset-password` mostra seta + `Voltar`, sem alterar login/cadastro/confirmar. |
| Logo central | OK | O botão é absoluto e não desloca a marca. |
| Título / subtítulo | OK | Composição correspondente. |
| E-mail | OK | Recuperação é por e-mail mesmo para quem entra com @usuário. |
| Segurança | OK | Gate real quando habilitado. |
| CTA | OK | Só avança após resposta real do serviço. |
| Mensagem neutra | OK | Não confirma existência de conta. |
| Ajuda sem acesso ao e-mail | OK | Link real de suporte. |

### 02 · Conferir e-mail

Estrutura principal, e-mail informado, spam, reenvio, usar outro e-mail e voltar para entrar estão implementados. **OK funcional**.

### 03 · Nova senha

| Item | Estado | Pente fino |
| --- | --- | --- |
| Dois campos + olho | OK | Correspondente. |
| Checklist visual | OK | A UI agrupa a política canônica nas 3 linhas da prancha (`12+`, `maiúscula e minúscula`, `número e símbolo`) sem duplicar a validação. |
| Senha comprometida | OK extra necessário | Checagem real permanece mesmo não aparecendo na prancha. |
| CTA / termos | OK | Funcionais. |
| Sucesso | OK funcional | Após salvar, troca para sucesso real; não simula dois estados ao mesmo tempo. |

### 04 · Link expirado

**OK funcional**: erro explícito, e-mail, novo link, voltar para entrar e ajuda. O estado também cobre link inválido/usado.

## Desktop — Conta e acesso

### 01 · Entrar

| Item | Estado | Pente fino |
| --- | --- | --- |
| Coluna editorial + card | OK estrutural | Grid e card correspondem ao concept. |
| Arte da comunidade | MELHORADO | `login-hero.webp` mantém o crop 376×264, mas agora é renderizado com footprint responsivo de aproximadamente 450–540 px para ocupar a coluna como na prancha. |
| Cabeçalho largo | MELHORADO | O desktop não limita o header ao mesmo `max-width` do conteúdo, mantendo logo à esquerda e ações à direita. |
| Copy e formulário | OK | Título, subtítulo, campos, Google condicional, segurança e links legais. |

### 02 · Criar conta

Estrutura de duas colunas, card, labels desktop e CTA estão presentes. A arte `signup-hero.webp` agora ocupa aproximadamente **440–520 px** no desktop, em vez de ficar presa a 390 px. **PARCIAL** somente porque a comparação pixel a pixel do render ainda não foi executada.

### 03 · Confirmar e-mail

Estrutura correta e hero no crop aprovado 355×188. O hero agora ocupa aproximadamente **450–540 px** no desktop; o envelope mobile permanece separado em 120×115. **PARCIAL** somente até screenshot real confirmar escala e offset.

### 04 · Recuperar acesso

Estrutura de duas colunas e arte territorial 368×149 estão corretas no contrato. A arte agora ocupa aproximadamente **470–560 px**, condizente com a presença visual da prancha. **PARCIAL** até a comparação renderizada.

## Assets — estado atual verificado

| Arquivo | Tamanho atual | Dimensão protegida | Estado |
| --- | ---: | ---: | --- |
| `login-hero.webp` | 10.528 B | 376×264 | OK de conteúdo/crop; render desktop ampliado. |
| `signup-hero.webp` | 5.626 B | 340×186 | OK de conteúdo/crop; render desktop ampliado. |
| `confirm-hero.webp` | 6.424 B | 355×188 | OK de conteúdo/crop; render desktop ampliado. |
| `recovery-hero.webp` | 8.512 B | 368×149 | OK de conteúdo/crop; render desktop ampliado. |
| `confirm-envelope.webp` | 2.230 B | 120×115 | OK; exclusivo da confirmação mobile. |

A suíte `tests/regression/auth-concept-flow.test.ts` valida RIFF/WEBP, integridade do tamanho, dimensões aprovadas e referências das telas, evitando novamente a troca entre hero e envelope.

## Pente fino de proporções já codificadas

| Elemento | Mobile atual | Desktop atual | Observação |
| --- | --- | --- | --- |
| Largura base | `max-w-[430px]` | `max-w-[1180px]` | Coerente com os dois concepts. |
| Padding lateral principal | `24px` | `40px` | Próximo à prancha; confirmar por screenshot. |
| Altura de input/CTA | `44px` | `44px` | Mantém ritmo consistente. |
| CTA primário | amarelo `#ffc91a` | amarelo `#ffc91a` | Direção visual correta. |
| Card desktop | `430px` | `430px` | Próximo à largura vista na prancha. |
| Hero desktop | oculto | `440–560px` conforme a tela | Aumentado para eliminar o vazio excessivo da coluna editorial. |
| Título mobile | ~`31px` | — | Próximo à hierarquia do concept. |
| Título editorial desktop | — | `46px` | Próximo à prancha. |
| Fundo | `#fffdfa` | marfim + radiais discretos | Correspondente à linguagem visual. |
| Ícones auth | HTML/CSS próprios | HTML/CSS próprios | Sem SVG/Lucide nas superfícies controladas pelo concept. |

## Pendências em ordem P0 → P2

1. **P0 — Captura real do navegador:** gerar 390×844 e 1440×900 e comparar lado a lado com as pranchas. Testes estruturais não substituem pixel diff.
2. **P1 — Contexto amigável:** mostrar nome legível (`Sabores da Ana`) quando o retorno tiver metadado/slug resolvível; manter fallback seguro.
3. **P1 — Username com ponto:** decidir se é requisito real ou apenas dado demonstrativo. Se virar requisito, alterar SSOT frontend + policy + Edge Function + RPC/migration + testes em uma única mudança.
4. **P2 — Ajustes finos de spacing/crop:** depois da captura real, medir offsets, baseline, borda, raio, sombra e escala; reduzir/ampliar cada hero individualmente se necessário.
5. **P2 — Qualidade raster:** se a ampliação revelar suavização perceptível em telas densas, substituir os crops por versões 2× derivadas da mesma arte do concept, sem trocar a direção visual.

## Regra de aceite visual

A tela só pode ser marcada como **fiel** após passar por captura real no viewport correspondente. A comparação deve verificar: posição do logo, margens externas, largura do card, baseline dos títulos, altura dos inputs e CTAs, espaçamento vertical, raio, bordas, sombras, escala/crop dos assets, safe-area e ausência de overflow. **Não declarar `≤1%` antes dessa etapa.**
