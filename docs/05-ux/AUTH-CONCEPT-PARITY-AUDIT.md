# Conta e acesso — auditoria de paridade com o concept

> SSOT visual: pranchas aprovadas de **Conta e acesso — Mobile**, **Recuperar acesso — Mobile** e **Conta e acesso — Desktop** fornecidas para esta implementação.
>
> Esta auditoria separa **paridade confirmável pelo código/asset** de **paridade pixel a pixel**. A segunda só pode ser declarada depois de comparar screenshots renderizados do app com as pranchas no mesmo viewport.

## Critério

- **OK** — estrutura/copy/comportamento verificável corresponde ao concept.
- **PARCIAL** — direção correta, mas ainda existe diferença visível, de copy ou de estado.
- **FALHA** — divergência objetiva bloqueia a fidelidade.
- Funcionalidade real e segurança vencem estados meramente demonstrativos da prancha. Não fingir sucesso, captcha, confirmação ou reenvio.
- O concept não é um inventário completo do produto: estados de erro, OAuth, disponibilidade, segurança, SEO técnico e recuperação precisam existir mesmo quando não foram desenhados.

## Mobile — Conta e acesso

### 01 · Entrar

| Item | Estado | Pente fino |
| --- | --- | --- |
| Logo central + voltar | OK | Cabeçalho mobile centralizado, botão voltar próprio e safe-area superior. |
| Título e subtítulo | OK | `Bom ter você por aqui.` + `Entre para continuar sua conversa.` |
| Retorno ao contexto | OK seguro | Destinos conhecidos agora recebem nome legível (`/p/sabores-da-ana` → `Sabores da Ana`, `/mensagens` → `Conversas`); rotas desconhecidas mantêm fallback neutro. |
| E-mail ou @usuário | OK | Login aceita os dois tipos de identificador. |
| Senha + mostrar/ocultar | OK | Controle acessível, Caps Lock detectado e sem SVG/Lucide. |
| Esqueci minha senha | OK | Abre o fluxo de recuperação e reaproveita o e-mail quando possível. |
| Google | OK no frontend | O CTA usa OAuth Supabase real. Produção e o template remoto agora habilitam `VITE_AUTH_GOOGLE_ENABLED=true`; o provider Google ainda precisa permanecer ativo no projeto Supabase remoto. |
| Criar conta | OK | Preserva retorno interno seguro. |
| Explorar sem conta | OK | Mantido no mobile público. |
| Segurança | OK | Copy/hierarquia do concept. |
| Termos · Privacidade · Ajuda | OK | Rodapé exclusivo do login mobile, como na prancha. |
| Indexação | OK extra | Login usa `noindex, nofollow`; não deve competir com páginas públicas do produto em busca. |

### 02 · Criar conta

| Item | Estado | Pente fino |
| --- | --- | --- |
| Cadastro em uma única tela | OK | Território e confirmação de senha não bloqueiam a criação inicial. |
| Nome / usuário / e-mail / senha | OK | Estrutura igual ao concept. |
| Disponibilidade do @usuário | OK extra | Verificação debounced mostra disponível/ocupado/reservado e sugestão; o submit repete a verificação no SSOT do hook antes do signup. |
| `@ana.oliveira` demonstrativo | PARCIAL | O domínio real aceita letras minúsculas, números e `_`, mas não ponto. Como a prancha declara dados demonstrativos, não afrouxar apenas a UI sem decisão de produto e migração end-to-end. |
| Google | OK no frontend | Cadastro também oferece `Continuar com Google`; após OAuth/aceite legal o novo usuário segue para Primeiro acesso e preserva o destino original. |
| Política da senha | OK funcional | Regra central: 12+, maiúscula, minúscula, número e símbolo. |
| Termos | OK | Obrigatórios e vinculados a páginas reais. OAuth usa a rota real de aceite antes de continuar. |
| Como usamos seus dados | OK | Disclosure mobile preservado; desktop usa link compacto. |
| CTA | OK | Estado desabilitado acompanha termos, disponibilidade conhecida e anti-bot real. |
| Já tem conta? | OK extra | Link de retorno para Login preserva o destino seguro. |
| Indexação | OK extra | Cadastro usa `noindex, nofollow`. |

### 03 · Confirmar e-mail

| Item | Estado | Pente fino |
| --- | --- | --- |
| Envelope central | OK | `confirm-envelope.webp` usa o recorte 120×115 aprovado. |
| Título / e-mail / 3 passos | OK | Estrutura e ordem do concept. |
| Spam | OK | Aviso presente. |
| Reenviar | OK funcional | Tem estado real de envio e cooldown após sucesso. |
| E-mail errado | OK | Reinicia cadastro de forma segura; não altera identidade pendente silenciosamente. |
| Contexto ausente | OK extra | Se sessionStorage/state não tiver o e-mail pendente, não mostra instrução falsa; oferece reiniciar cadastro, entrar ou pedir ajuda. |
| Conta aguardando confirmação | OK | Estado explícito. |
| Voltar / ajuda | OK | Ações reais. |
| Indexação | OK extra | Confirmação usa `noindex, nofollow`. |

### 04 · Primeiro acesso

| Item | Estado | Pente fino |
| --- | --- | --- |
| Sucesso + perfil pessoal | OK | Implementado. |
| Perfil ainda não disponível | OK extra | Estado recuperável com nova tentativa e Ajuda, importante logo após criação/OAuth. |
| Retomar conversa | OK funcional | Preserva o retorno interno seguro. |
| Nome da conversa/negócio | OK seguro | Destino conhecido usa o mesmo resolvedor seguro do Login; ex.: `Sabores da Ana`. |
| Território opcional | OK | Estado → cidade → bairro depois da conta; não bloqueia cadastro. |
| Privacidade territorial | OK | Visibilidade pública começa oculta. |
| Agora não | OK | Usuário pode seguir sem território. |
| Outros perfis | OK | Link para gestão de perfis. |
| Desktop não desenhado | MELHORADO | Como não há prancha desktop de Primeiro acesso, foi criado layout responsivo coerente com o sistema de conta, sem inventar hero genérico. |

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
| Caps Lock | OK extra | `PasswordInput` compartilhado avisa Caps Lock quando o campo está em foco. |
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

Estrutura de duas colunas, card, labels desktop e CTA estão presentes. A arte `signup-hero.webp` ocupa aproximadamente **440–520 px** no desktop. Google e verificação de disponibilidade do @usuário completam o fluxo real sem depender da prancha demonstrativa. **PARCIAL** somente porque a comparação pixel a pixel do render ainda não foi executada.

### 03 · Confirmar e-mail

Estrutura correta e hero no crop aprovado 355×188. O hero ocupa aproximadamente **450–540 px** no desktop; o envelope mobile permanece separado em 120×115. **PARCIAL** somente até screenshot real confirmar escala e offset.

### 04 · Recuperar acesso

Estrutura de duas colunas e arte territorial 368×149 estão corretas no contrato. A arte ocupa aproximadamente **470–560 px**, condizente com a presença visual da prancha. **PARCIAL** até a comparação renderizada.

## Assets — estado atual verificado

| Arquivo | Tamanho atual | Dimensão protegida | Estado |
| --- | ---: | ---: | --- |
| `login-hero.webp` | 10.528 B | 376×264 | OK de conteúdo/crop; render desktop ampliado. |
| `signup-hero.webp` | 5.626 B | 340×186 | OK de conteúdo/crop; render desktop ampliado. |
| `confirm-hero.webp` | 6.424 B | 355×188 | OK de conteúdo/crop; render desktop ampliado. |
| `recovery-hero.webp` | 8.512 B | 368×149 | OK de conteúdo/crop; render desktop ampliado. |
| `confirm-envelope.webp` | 2.230 B | 120×115 | OK; exclusivo da confirmação mobile. |

A suíte `tests/regression/auth-concept-flow.test.ts` valida RIFF/WEBP, integridade do tamanho, dimensões aprovadas, Google OAuth e referências das telas. `tests/regression/auth-return-context.test.ts` protege a transformação segura de destinos em nomes amigáveis.

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

## Funcionalidades necessárias que o concept não desenhou

1. **OAuth + aceite legal real** — o Google redireciona para `/aceitar-termos`; não basta desenhar o botão.
2. **Disponibilidade de @usuário** — feedback antecipado + verificação autoritativa antes do signup.
3. **Senha comprometida e Caps Lock** — proteção e feedback operacional.
4. **Estados sem contexto** — confirmação sem e-mail pendente e primeiro acesso sem profile carregado precisam ser recuperáveis.
5. **Retorno seguro e amigável** — preservar caminho interno e exibir nomes reconhecíveis sem refletir texto arbitrário da URL.
6. **Anti-bot e mensagens neutras** — login/cadastro/recuperação não devem simular captcha nem vazar existência de conta.
7. **`noindex` nas superfícies de autenticação** — páginas transacionais não devem ser tratadas como landing pages públicas.

## Pendências em ordem P0 → P2

1. **P0 — Verificar provider Google remoto:** frontend de produção e `.env.remote.example` estão habilitados; confirmar no Supabase Auth que o provider Google, client ID/secret e URLs autorizadas estão ativos. O repositório já contém as redirects de `/aceitar-termos` em `supabase/config.toml`.
2. **P0 — Captura real do navegador:** gerar 390×844 e 1440×900 e comparar lado a lado com as pranchas. Testes estruturais não substituem pixel diff.
3. **P1 — Username realmente escolhido no trigger de signup:** auditar o `handle_new_user()` remoto antes de alterar banco; migrations antigas derivam username de nome/UUID e podem não respeitar `raw_user_meta_data.handle`. Só aplicar migração depois de confirmar a função efetiva no projeto remoto.
4. **P1 — OAuth/Primeiro acesso:** se o username gerado automaticamente não for amigável, oferecer escolha do @usuário no Primeiro acesso sem obrigar território.
5. **P1 — Username com ponto:** decidir se é requisito real ou apenas dado demonstrativo. Se virar requisito, alterar SSOT frontend + policy + Edge Function + RPC/migration + testes em uma única mudança.
6. **P1 — Cooldown orientado pelo servidor:** substituir os 60s locais por `Retry-After` quando a camada de auth expuser esse dado de forma confiável.
7. **P2 — Ajustes finos de spacing/crop:** depois da captura real, medir offsets, baseline, borda, raio, sombra e escala; reduzir/ampliar cada hero individualmente se necessário.
8. **P2 — Qualidade raster:** se a ampliação revelar suavização perceptível em telas densas, substituir os crops por versões 2× derivadas da mesma arte do concept, sem trocar a direção visual.
9. **P2 — `/aceitar-termos`:** trazer a tela auxiliar para a mesma linguagem desktop/mobile de Conta e acesso; funcionalmente ela já registra aceite versionado e preserva retorno, mas não existe prancha dedicada.

## Regra de aceite visual

A tela só pode ser marcada como **fiel** após passar por captura real no viewport correspondente. A comparação deve verificar: posição do logo, margens externas, largura do card, baseline dos títulos, altura dos inputs e CTAs, espaçamento vertical, raio, bordas, sombras, escala/crop dos assets, safe-area e ausência de overflow. **Não declarar `≤1%` antes dessa etapa.**
