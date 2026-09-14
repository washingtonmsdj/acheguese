# Conta e acesso — auditoria de paridade com o concept

> SSOT visual: pranchas aprovadas de **Conta e acesso — Mobile**, **Recuperar acesso — Mobile** e **Conta e acesso — Desktop**.
>
> Regra: o concept define a linguagem visual, mas **não limita o produto**. OAuth, erros, segurança, acessibilidade, consentimento, estados sem sessão e retorno seguro continuam obrigatórios mesmo quando a prancha não os desenhou.

## Estado executivo — 2026-09-14

A superfície pública de conta/acesso já está consolidada no mesmo sistema visual do concept para:

- `/login`;
- `/cadastro`;
- `/cadastro/confirmacao`;
- `/cadastro/primeiro-acesso`;
- `/reset-password` e seus estados;
- `/aceitar-termos`, tela necessária ao OAuth e não desenhada na prancha original.

**Não declarar paridade pixel a pixel ainda.** O repositório já possui capturas automatizadas e contrato responsivo, mas a comparação visual lado a lado com as pranchas fonte ainda precisa ser concluída com o navegador executando normalmente.

## Entrar

| Item | Estado | Observação |
| --- | --- | --- |
| Header e safe-area | OK | Logo, voltar mobile, skip link e ações públicas desktop. |
| E-mail ou `@usuário` | OK | Ambos usam autenticação real. |
| Senha | OK | Mostrar/ocultar, Caps Lock, autocomplete e erro associado ao campo. |
| Esqueci minha senha | OK | Reaproveita e-mail quando disponível e abre recuperação real. |
| Retorno ao destino | OK | `redirect` é sanitizado e destinos conhecidos recebem nome amigável. |
| Google | OK frontend | `Continuar com Google` está visível por padrão e usa Supabase OAuth real. |
| Google + retorno | OK | Antes de abrir OAuth, Login grava o retorno seguro; após termos o usuário volta ao destino. |
| Cancelamento/erro Google | OK | Callback com erro mostra estado recuperável próprio, preserva destino e não reflete `error_description` arbitrário da URL. |
| Criar conta | OK | Preserva o retorno interno seguro. |
| Explorar sem conta | OK | Mantido no mobile. |
| `noindex` | OK | Superfície transacional não concorre com páginas públicas. |

## Criar conta

| Item | Estado | Observação |
| --- | --- | --- |
| Conta primeiro | OK | Nome, usuário, e-mail e senha; território fica para depois. |
| Google | OK frontend | CTA aparece antes do formulário de e-mail. |
| OAuth de cadastro | OK | Google segue para `/aceitar-termos` e depois `/cadastro/primeiro-acesso`; o destino original fica preservado separadamente. |
| Disponibilidade do `@usuário` | OK | Feedback debounced + verificação autoritativa antes do signup. |
| Username escolhido | OK no repositório | Migration atualizada protege o `handle` escolhido no trigger de criação do perfil. |
| Senha | OK | Política canônica 12+, maiúscula/minúscula, número e símbolo. |
| Termos | OK | Cadastro por e-mail exige aceite; Google passa pelo aceite versionado após OAuth. |
| Anti-bot | OK quando configurado | Turnstile é gate real, não decoração. |
| Ponto no username | DECISÃO DE PRODUTO | A prancha usa exemplo com ponto, mas o domínio atual aceita minúsculas, números e `_`. Não mudar só a UI. |

## Confirmar e-mail

- envelope mobile usa o asset aprovado `confirm-envelope.webp`;
- instruções, spam, reenvio e cooldown são funcionais;
- contexto ausente é recuperável e não inventa um e-mail;
- usuário pode reiniciar cadastro ou entrar;
- confirmação concluída sempre passa pelo Primeiro acesso antes do destino original.

## Primeiro acesso

A tela existe porque o produto precisa completar o fluxo real, embora não haja uma prancha desktop equivalente. Ela segue a mesma linguagem visual sem inventar hero genérico.

- retorno original é preservado;
- destino conhecido ganha nome amigável;
- cidade e bairro são opcionais;
- visibilidade territorial pública começa oculta;
- perfil ainda indisponível possui retry e ajuda;
- usuário pode continuar e completar depois.

## Recuperar acesso

O fluxo cobre estados reais, não apenas a prancha:

1. solicitar recuperação;
2. e-mail enviado;
3. validar sessão/token de recuperação;
4. cadastrar nova senha;
5. sucesso;
6. link expirado, inválido ou usado.

A UI mantém a composição do concept, mas conserva checagem de senha comprometida, Caps Lock, mensagens neutras e suporte.

## Aceitar termos — tela necessária fora do concept

`/aceitar-termos` pertence oficialmente ao sistema de Conta e acesso.

- registra consentimento versionado real;
- Google não pula o aceite;
- mostra para onde o usuário voltará quando o destino é reconhecido;
- estado sem sessão oferece retorno seguro ao Login;
- cancelamento/erro OAuth possui estado próprio;
- texto do provider recebido por query/hash **não é refletido na página**;
- mobile e desktop usam a mesma tipografia, cores, cards, ícones e ritmo visual do restante da família.

## Google OAuth — contrato atual

O botão não deve desaparecer por configuração padrão do repositório:

- `.env.example`: Google habilitado;
- `.env.local.example`: Google habilitado;
- `.env.production`: Google habilitado;
- `AuthService.isGoogleAuthEnabled()`: habilitado salvo `VITE_AUTH_GOOGLE_ENABLED="false"` explícito;
- provider usado pelo serviço: `google`;
- redirect do OAuth: `/aceitar-termos`;
- `supabase/config.toml` inclui redirects de produção, Vercel e desenvolvimento para `/aceitar-termos`.

**Ainda pendente fora do código:** confirmar no painel/configuração remota do Supabase que o provider Google, Client ID/secret e origens autorizadas continuam ativos. O conector disponível nesta auditoria expõe projeto/SQL, mas não expõe leitura da configuração de providers Auth; portanto não marcar isso como verificado sem evidência externa.

## Responsividade protegida

A suíte E2E cobre as superfícies públicas principais nos limites:

`320`, `360`, `390`, `430`, `767`, `768`, `1024` e `1440` px.

Os contratos verificam:

- ausência de overflow horizontal;
- composição mobile de uma coluna;
- composição desktop em duas colunas quando prevista;
- largura do card desktop;
- presença e escala dos heroes oficiais;
- Google visível em Login/Cadastro;
- ausência de SVG/Lucide genérico nas áreas controladas pelo concept;
- `/aceitar-termos` integrado ao mesmo sistema;
- recuperação de callback OAuth com erro.

## Assets protegidos

| Asset | Crop aprovado |
| --- | ---: |
| `public/auth/login-hero.webp` | 376×264 |
| `public/auth/signup-hero.webp` | 340×186 |
| `public/auth/confirm-hero.webp` | 355×188 |
| `public/auth/recovery-hero.webp` | 368×149 |
| `public/auth/confirm-envelope.webp` | 120×115 |

No desktop os arquivos são ampliados responsivamente pelo `auth-concept-layout.css`; não substituir por arte genérica ou SVG.

## QA automatizado

### Contratos

- `tests/regression/auth-concept-flow.test.ts`
- `tests/regression/auth-return-context.test.ts`
- `tests/regression/auth-google-oauth.test.ts`

### Browser

- `tests/e2e/auth-concept-layout.spec.ts`
- `tests/e2e/auth-concept-capture.spec.ts`
- `tests/e2e/auth-oauth-recovery.spec.ts`

### Capturas previstas

Mobile e desktop geram imagens para Login, Cadastro, Confirmação, Recuperação, Termos sem sessão e cancelamento do Google.

**Situação de CI em 2026-09-14:** o workflow `Auth Concept Regression` está sendo criado corretamente, porém os jobs encerram antes de qualquer step, com `runner_id=0` e lista de steps vazia. Portanto a falha atual do workflow não demonstra falha de teste; o código sequer começou a executar. O status Vercel também está bloqueado por limite de builds. Reexecutar a certificação quando a infraestrutura voltar a alocar runner/build.

## Próximos passos — ordem real

1. **P0 — destravar execução de CI/Vercel** e rodar os contratos + Playwright já configurados.
2. **P0 — verificar provider Google remoto** no Supabase/Google Cloud e testar o round-trip real em produção.
3. **P0 — comparar capturas renderizadas com as pranchas** em 390×844 e 1440×900; só então usar a palavra “fiel/pixel”.
4. **P1 — teclado e foco:** validar Tab/Shift+Tab, Enter/Espaço, foco visível, checkbox de termos e retorno após erros em todas as telas.
5. **P1 — autofill/password managers:** confirmar `username`, `email`, `current-password` e `new-password` nos principais navegadores.
6. **P1 — limpar contextos pendentes após caminhos alternativos** para que tentativas OAuth interrompidas nunca deixem sessão de retorno obsoleta.
7. **P1 — cooldown orientado pelo servidor** quando a camada Auth expuser `Retry-After` de forma confiável.
8. **P2 — pente fino visual:** medir offsets, baseline, espaçamento, raio, sombra e escala/crop individual dos heroes a partir das capturas reais.
9. **P2 — assets 2×:** somente se a ampliação desktop mostrar suavização perceptível em telas densas.

## Regra de aceite

Uma tela de Conta e acesso só pode ser marcada como **fiel** quando:

- funcionalidade real não foi removida para imitar a prancha;
- mobile e desktop não têm overflow/reflow quebrado;
- navegação por teclado e zoom continuam utilizáveis;
- Google e estados auxiliares permanecem acessíveis;
- screenshots do app forem comparados com a prancha no mesmo viewport;
- qualquer diferença intencional estiver documentada como necessidade funcional, não como desvio acidental.
