# E-mail de autenticação em produção

Este documento é a referência operacional para o e-mail enviado pelo Supabase Auth no Achegue-se. Ele cobre a fronteira entre URL Configuration, DNS, Resend, Supabase Auth, identidade visual e a aplicação. Segredos reais nunca pertencem ao repositório.

## Owners

- `supabase/config.toml`: autoridade executável de `site_url` e `additional_redirect_urls` do Auth.
- `.github/workflows/supabase-auth-url-config.yml`: sincroniza a autoridade versionada de URLs com o projeto Supabase hospedado.
- `supabase/templates/confirmation.html`: SSOT versionado do conteúdo e da apresentação do e-mail de confirmação de cadastro.
- `src/index.css`: SSOT dos primitivos/tokens visuais do produto; templates de e-mail mantêm uma projeção literal compatível porque clientes de e-mail não consomem CSS variables da aplicação.
- `src/core/notifications/services/EmailService.ts`: shell visual compartilhado para os e-mails transacionais enviados pelas Edge Functions, usando a mesma projeção de marca do Auth.
- DNS do domínio `acheguese.com.br`: prova de domínio e de envio.
- Resend: provedor SMTP e autoridade sobre a verificação do domínio.
- Supabase Auth: gera e envia os e-mails de confirmação, recuperação e demais fluxos de autenticação usando o SMTP configurado.
- `.github/workflows/supabase-auth-email-config.yml`: único comando versionado autorizado a alterar identidade do remetente/template de confirmação em produção.
- Frontend: apenas inicia o fluxo e apresenta estado/erros; não possui credencial de e-mail nem implementa SMTP.

As Edge Functions que enviam outros e-mails continuam seguindo `EDGE_FUNCTION_SECRETS.md`. Não misturar o runtime de Edge Functions com o SMTP interno do Supabase Auth.

## Identidade visual dos e-mails

A família visual acompanha o produto, sem transformar mensagens de autenticação em material de marketing:

- fonte preferencial: `Plus Jakarta Sans`, com fallbacks `Arial`, `Helvetica`, `sans-serif`;
- Petróleo `#123E3D`: marca e ação principal;
- Solar `#F3CB4C`: destaque curto;
- Marfim `#FAFBF7`: fundo externo;
- Texto `#203534`;
- Texto secundário `#61736C`;
- cards/superfícies principais: branco.

O HTML de e-mail precisa continuar autocontido, com tabelas e estilos inline. Não importar CSS do aplicativo, não depender de Tailwind e não usar CSS variables, porque esses recursos não são uma autoridade transportável para Gmail/Outlook. A projeção literal de cores deve permanecer sincronizada com os primitivos canônicos e é coberta pelo validador `tools/architecture/validate-visual-ssot.ts`.

O e-mail de autenticação deve permanecer curto e transacional: uma ação principal, sem promoções, sem múltiplas CTAs concorrentes e sem personalização baseada em dados não sanitizados do usuário.

## Dois gates independentes

A confirmação de cadastro depende de duas configurações diferentes e ambas precisam estar corretas:

1. **URL Configuration do Supabase Auth** — decide se `emailRedirectTo`/`redirectTo` solicitado pela aplicação é aceito. Se o callback não estiver autorizado, o Auth substitui pelo `site_url`.
2. **DNS + identidade SMTP do Resend** — decide se a mensagem pode ser enviada para destinatários reais usando o domínio do Achegue-se.

Não tratar esses problemas como equivalentes. Um callback incorreto não é causado pelo DNS, e um `403` de test mode do Resend não é corrigido alterando a allowlist.

## URL Configuration canônica

O SSOT é `supabase/config.toml`:

- `site_url = "https://acheguese.com.br"`;
- `additional_redirect_urls` contém os callbacks oficiais para:
  - `https://acheguese.com.br`;
  - `https://acheguese.vercel.app`;
  - `http://localhost:5175`;
  - `http://127.0.0.1:5175`.

Os fluxos versionados incluem:

- Google/OAuth → `/aceitar-termos`;
- confirmação de cadastro → `/login?confirmed=1`;
- troca de e-mail → `/conta/confirmar-email?emailChange=1`;
- recuperação de senha → `/reset-password?mode=recovery`.

O workflow `Supabase Auth URL Config` lê o `supabase/config.toml` do SHA exato, aplica `site_url` e `uri_allow_list` via Management API e relê o estado remoto para provar igualdade com o SSOT. Ele não lê nem altera credenciais SMTP ou segredo do Google.

### Evidência do drift encontrado em 2026-09-16

Mesmo com o frontend de produção solicitando `https://acheguese.com.br/login?confirmed=1`, um envio real observado no Resend chegou com `redirect_to=https://www.acheguese.com.br/`. Isso demonstra que o projeto hospedado não estava honrando o callback canônico e estava caindo na Site URL remota. A correção desse drift pertence ao gate de URL acima.

## Identidade canônica de e-mail

- domínio de envio: `acheguese.com.br`;
- status observado no Resend em 2026-09-16: `verified`, envio habilitado, região `sa-east-1`;
- remetente de Auth desejado: `no-reply@acheguese.com.br`;
- nome: `Achegue-se`;
- assunto de confirmação: `Confirme seu e-mail | Achegue-se`;
- template versionado: `supabase/templates/confirmation.html`.

O status `verified` do domínio libera o gate do Resend, mas **não prova por si só** que o template versionado já foi aplicado no projeto Supabase hospedado. A aplicação continua sendo uma operação explícita do workflow abaixo.

## Pré-requisitos DNS do Resend

Os valores vigentes são fornecidos pelo próprio Resend e espelhados como asserts públicos no workflow de produção. No desenho atual existem três provas:

1. DKIM TXT em `resend._domainkey.acheguese.com.br`;
2. SPF TXT em `send.acheguese.com.br`, com `v=spf1 include:amazonses.com ~all`;
3. MX em `send.acheguese.com.br` apontando para `feedback-smtp.sa-east-1.amazonses.com`, prioridade `10`.

Se o Resend rotacionar DKIM ou mudar a região/Return-Path, atualizar primeiro o DNS e depois os asserts do workflow. Não manter dois conjuntos concorrentes de registros como suposta compatibilidade.

## Gate de identidade SMTP em produção

O workflow `Supabase Auth Email Config` é `workflow_dispatch` somente. Não existe aplicação automática em `push`.

Para aplicar:

1. confirmar no Resend que `acheguese.com.br` está `verified`;
2. executar o workflow na branch `main`;
3. marcar `apply=true`;
4. informar exatamente `RESEND_DOMAIN_VERIFIED` no campo de confirmação;
5. o runner faz checkout do SHA exato e valida `supabase/templates/confirmation.html`;
6. o template precisa conter `{{ .ConfirmationURL }}`, não pode hardcodar `localhost`/`127.0.0.1` e não pode conter conteúdo executável;
7. o runner comprova DKIM, SPF e MX publicamente antes de qualquer PATCH;
8. o runner lê a configuração atual do Supabase e exige que o transporte SMTP já seja Resend;
9. somente então altera remetente, nome, assunto e o conteúdo do template;
10. ao final, relê a configuração e prova igualdade exata do template persistido com o arquivo versionado.

O workflow usa `SUPABASE_ACCESS_TOKEN` apenas como secret do GitHub Actions. Ele não imprime SMTP host/user/password nem grava credenciais no repositório.

## Regra de falha segura

Qualquer uma destas condições deve bloquear a alteração de identidade SMTP:

- domínio não verificado no Resend;
- confirmação manual ausente/incorreta;
- template versionado ausente, inválido ou contendo URL local hardcoded;
- DNS esperado não resolvendo;
- projeto Supabase diferente do ref canônico;
- `SUPABASE_ACCESS_TOKEN` ausente;
- SMTP atual não sendo Resend;
- falha na verificação pós-PATCH.

Não trocar para uma identidade de produção apenas para "testar" sem as provas do gate. Não mascarar erro SMTP no frontend e não desativar confirmação de e-mail para contornar falhas de entrega.

## Teste de ponta a ponta após a liberação

Depois da URL Configuration sincronizada, do domínio verificado e do workflow de identidade concluído com sucesso, validar em produção:

1. abrir `/cadastro`;
2. criar uma conta com endereço de teste que possa receber e-mail;
3. confirmar que a UI mostra um único owner visual para eventual erro, sem mensagem duplicada;
4. inspecionar o request de envio e confirmar que `redirect_to` é `https://acheguese.com.br/login?confirmed=1`;
5. confirmar que o e-mail chega com remetente `Achegue-se <no-reply@acheguese.com.br>` e assunto em português;
6. verificar visualmente Petróleo/Solar/Marfim, Plus Jakarta Sans quando disponível e fallback legível quando não disponível;
7. clicar em `Confirmar meu e-mail`;
8. confirmar a sessão/jornada de primeiro acesso prevista pelo Auth SSOT;
9. sair e entrar novamente;
10. confirmar que a Home reflete o usuário autenticado e não apresenta a CTA pública `Entrar` como estado principal;
11. inspecionar os logs do Resend para provar aceitação/entrega e ausência de `403` de domínio/test mode.

Não considerar a integração concluída apenas porque o cadastro criou uma linha em `auth.users`; a entrega, o callback correto, a confirmação real do e-mail e a renderização aceitável nos clientes principais fazem parte do critério de aceite.

## Diagnóstico de `403` do Resend

Quando o Resend retorna mensagem equivalente a "You can only send testing emails to your own email address", o SMTP está alcançando o Resend, mas a conta está limitada ao modo de teste porque o domínio de envio ainda não está verificado e/ou o remetente ainda usa `@resend.dev`.

Nesse cenário, corrigir DNS/verificação/identidade do remetente. Não mascarar o erro no frontend, não desativar confirmação de e-mail e não introduzir um segundo provedor como fallback silencioso.
