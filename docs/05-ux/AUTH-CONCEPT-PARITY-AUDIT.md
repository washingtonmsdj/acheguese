# Conta e acesso — auditoria de paridade com o concept

> SSOT visual: pranchas aprovadas de **Conta e acesso — Mobile**, **Recuperar acesso — Mobile** e **Conta e acesso — Desktop** fornecidas para esta implementação.
>
> Esta auditoria separa **paridade confirmável pelo código/asset** de **paridade pixel a pixel**. A segunda só pode ser declarada depois de comparar screenshots renderizados do app com as pranchas no mesmo viewport.

## Critério

- **OK** — estrutura/copy/comportamento do código corresponde ao concept.
- **PARCIAL** — direção correta, mas há diferença visível ou comportamento incompleto.
- **FALHA** — existe divergência objetiva que impede a tela de ser considerada fiel.
- Funcionalidade real e segurança vencem estados meramente demonstrativos da prancha. Não fingir sucesso, captcha, confirmação ou reenvio.

## Mobile — Conta e acesso

### 01 · Entrar

| Item | Estado | Pente fino |
| --- | --- | --- |
| Logo central + voltar | OK | Cabeçalho mobile centralizado, com botão voltar próprio. |
| Título e subtítulo | OK | `Bom ter você por aqui.` + `Entre para continuar sua conversa.` |
| Retorno ao contexto | PARCIAL | O card aparece quando existe retorno, mas ainda mostra `onde parou`; a prancha demonstra um destino legível (`Sabores da Ana`). |
| E-mail ou @usuário | OK | Login aceita os dois tipos de identificador. |
| Senha + mostrar/ocultar | OK | Controle acessível e sem ícone SVG genérico. |
| Esqueci minha senha | OK | Abre o fluxo de recuperação e reaproveita o e-mail quando possível. |
| Google | OK funcional | Só aparece quando o provedor está realmente habilitado; não exibir botão decorativo. |
| Criar conta | OK | Preserva retorno seguro quando existe. |
| Explorar sem conta | OK | Disponível somente no contexto público. |
| Segurança | OK | Copy e hierarquia do concept. |
| Termos · Privacidade · Ajuda | OK | Rodapé exclusivo do login mobile, como na prancha. |

### 02 · Criar conta

| Item | Estado | Pente fino |
| --- | --- | --- |
| Cadastro em uma única tela | OK | Território e confirmação de senha não bloqueiam a criação inicial. |
| Nome / usuário / e-mail / senha | OK | Estrutura igual ao concept. |
| `@ana.oliveira` da prancha | **FALHA de contrato** | O domínio real aceita `^[a-z][a-z0-9_]{2,29}$`; ponto não é aceito no frontend, policy, Edge Function e RPC SQL. Não afrouxar só a UI. |
| Política da senha | OK funcional | Regra central: 12+, maiúscula, minúscula, número e símbolo. |
| Termos | OK | Obrigatórios e vinculados a páginas reais. |
| Como usamos seus dados | OK | Disclosure mobile preservado. |
| CTA | OK | Estado desabilitado acompanha termos + anti-bot real. |

### 03 · Confirmar e-mail

| Item | Estado | Pente fino |
| --- | --- | --- |
| Envelope central | **FALHA de asset** | `public/auth/confirm-envelope.webp` está associado a uma arte hero maior, não ao envelope mobile. |
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
| Território opcional | OK | Estado → cidade → bairro após a conta; não bloqueia cadastro. |
| Privacidade territorial | OK | Visibilidade pública começa oculta. |
| Agora não | OK | Usuário pode seguir sem território. |
| Outros perfis | OK | Link para gestão de perfis. |

## Mobile — Recuperar acesso

### 01 · Solicitar recuperação

| Item | Estado | Pente fino |
| --- | --- | --- |
| Voltar com texto | PARCIAL | A prancha mostra seta + `Voltar`; o cabeçalho compartilhado hoje mostra apenas a seta. |
| Título / subtítulo | OK | Composição correspondente. |
| E-mail | OK | Recuperação é feita por e-mail mesmo para quem entra por @usuário. |
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
| Checklist visual | PARCIAL | O concept agrupa em 3 linhas (`12+`, `maiúscula e minúscula`, `número e símbolo`); a UI hoje apresenta os 5 requisitos canônicos separadamente. A validação deve continuar centralizada; só a apresentação precisa ser agrupada. |
| Senha comprometida | OK extra necessário | Checagem real não aparece na prancha, mas deve continuar. |
| CTA / termos | OK | Funcionais. |
| Sucesso | OK funcional | Após salvar, a aplicação troca para sucesso real; não simula os dois estados ao mesmo tempo. |

### 04 · Link expirado

**OK funcional**: erro explícito, e-mail, novo link, voltar para entrar e ajuda. O estado também cobre link inválido/usado.

## Desktop — Conta e acesso

### 01 · Entrar

| Item | Estado | Pente fino |
| --- | --- | --- |
| Coluna editorial + card | OK estrutural | Grid e card correspondem ao concept. |
| Arte da comunidade | **FALHA de asset** | `public/auth/login-hero.webp` tem o blob/tamanho do pequeno envelope mobile; portanto o desktop de login não pode estar fiel enquanto esse binário não for corrigido. |
| Cabeçalho largo | PARCIAL | Logo/nav funcionais, mas a largura do container ainda acompanha o `max-width` do conteúdo; a prancha usa header mais aberto. |
| Copy e formulário | OK | Título, subtítulo, campos, Google condicional, segurança e links legais. |

### 02 · Criar conta

Estrutura de duas colunas, card, labels desktop, CTA e arte dedicada estão presentes. **PARCIAL** até a arte `signup-hero.webp` ser verificada visualmente no render final e a tela passar pela comparação de screenshot.

### 03 · Confirmar e-mail

Estrutura está correta. `confirm-hero.webp` contém a arte correta, porém em versão comprimida; existe no repositório um blob de melhor qualidade atualmente associado por engano a `confirm-envelope.webp`. **PARCIAL**, com correção binária pendente.

### 04 · Recuperar acesso

Estrutura de duas colunas e arte territorial estão corretas no código. O asset atual é uma versão comprimida da arte correta. **PARCIAL** até a comparação renderizada.

## Assets — problema objetivo encontrado

| Arquivo atual | Tamanho observado | Diagnóstico |
| --- | ---: | --- |
| `login-hero.webp` | 2.230 B | **Errado** — corresponde ao envelope mobile. |
| `signup-hero.webp` | 14.998 B | Precisa de inspeção renderizada final. |
| `confirm-hero.webp` | 6.424 B | Arte correta, compressão baixa. |
| `recovery-hero.webp` | 8.512 B | Arte correta, compressão baixa. |
| `confirm-envelope.webp` | 14.534 B | **Errado** — contém a arte hero de confirmação. |

Não declarar `1%` de diferença enquanto `login-hero`/`confirm-envelope` estiverem trocados e enquanto não houver screenshot real por viewport.

## Pendências em ordem P0 → P2

1. **P0 — Corrigir os binários** de `login-hero.webp` e `confirm-envelope.webp`; reaproveitar a arte hero de confirmação correta que já existe no repositório.
2. **P0 — Renderizar e capturar** 390×844 e 1440×900 e comparar lado a lado com as pranchas, sem usar os próprios crops da prancha como se fossem screenshot do app.
3. **P1 — Decidir contrato de username com ponto**. Se o produto realmente quiser `@ana.oliveira`, alterar SSOT frontend + policy + Edge Function + RPC/migration + testes. Caso contrário, atualizar a prancha/demo para um username válido, como `@ana_oliveira`.
4. **P1 — Mostrar `Voltar`** por extenso apenas no fluxo de recuperação mobile.
5. **P1 — Agrupar visualmente** os requisitos da nova senha em 3 linhas sem duplicar a regra canônica.
6. **P1 — Humanizar destino** de retorno quando houver slug conhecido, mantendo fallback genérico e seguro.
7. **P2 — Ajustar header desktop** depois da comparação por screenshot (largura, alinhamento e offsets exatos).

## Regra de aceite visual

A tela só pode ser marcada como **fiel** após passar por uma captura real do navegador no viewport correspondente. A comparação deve verificar: posição do logo, margens externas, largura do card, baseline dos títulos, tamanho/altura dos inputs e CTAs, espaçamento vertical, raio, bordas, sombras, escala/crop dos assets e ausência de overflow. Teste estrutural não substitui regressão visual.