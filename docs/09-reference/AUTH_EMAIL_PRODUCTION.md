# E-mail de autenticação em produção

Este documento é a referência operacional para o e-mail enviado pelo Supabase Auth no Achegue-se. Ele cobre a fronteira entre DNS, Resend, Supabase Auth e a aplicação. Segredos reais nunca pertencem ao repositório.

## Owners

- DNS do domínio `acheguese.com.br`: prova de domínio e de envio.
- Resend: provedor SMTP e autoridade sobre a verificação do domínio.
- Supabase Auth: gera e envia os e-mails de confirmação, recuperação e demais fluxos de autenticação usando o SMTP configurado.
- `.github/workflows/supabase-auth-email-config.yml`: único comando versionado autorizado a alterar identidade do remetente/template de confirmação em produção.
- Frontend: apenas inicia o fluxo e apresenta estado/erros; não possui credencial de e-mail nem implementa SMTP.

As Edge Functions que enviam outros e-mails continuam seguindo `EDGE_FUNCTION_SECRETS.md`. Não misturar o runtime de Edge Functions com o SMTP interno do Supabase Auth.

## Identidade canônica

- domínio de envio: `acheguese.com.br`;
- remetente de Auth desejado: `no-reply@acheguese.com.br`;
- nome: `Achegue-se`;
- assunto de confirmação: `Confirme seu e-mail | Achegue-se`.

A identidade só pode ser aplicada depois que o Resend marcar o domínio como `verified`.

## Pré-requisitos DNS do Resend

Os valores vigentes são fornecidos pelo próprio Resend e espelhados como asserts públicos no workflow de produção. No desenho atual existem três provas:

1. DKIM TXT em `resend._domainkey.acheguese.com.br`;
2. SPF TXT em `send.acheguese.com.br`, com `v=spf1 include:amazonses.com ~all`;
3. MX em `send.acheguese.com.br` apontando para `feedback-smtp.sa-east-1.amazonses.com`, prioridade `10`.

Se o Resend rotacionar DKIM ou mudar a região/Return-Path, atualizar primeiro o DNS e depois os asserts do workflow. Não manter dois conjuntos concorrentes de registros como suposta compatibilidade.

## Gate de produção

O workflow `Supabase Auth Email Config` é `workflow_dispatch` somente. Não existe aplicação automática em `push`.

Para aplicar:

1. confirmar no Resend que `acheguese.com.br` está `verified`;
2. executar o workflow na branch `main`;
3. marcar `apply=true`;
4. informar exatamente `RESEND_DOMAIN_VERIFIED` no campo de confirmação;
5. o runner comprova DKIM, SPF e MX publicamente antes de qualquer PATCH;
6. o runner lê a configuração atual do Supabase e exige que o transporte SMTP já seja Resend;
7. somente então altera remetente, nome e template de confirmação;
8. ao final, relê a configuração e prova que os valores esperados foram persistidos.

O workflow usa `SUPABASE_ACCESS_TOKEN` apenas como secret do GitHub Actions. Ele não imprime SMTP host/user/password nem grava credenciais no repositório.

## Regra de falha segura

Qualquer uma destas condições deve bloquear a alteração:

- domínio ainda não verificado no Resend;
- confirmação manual ausente/incorreta;
- DNS esperado não resolvendo;
- projeto Supabase diferente do ref canônico;
- `SUPABASE_ACCESS_TOKEN` ausente;
- SMTP atual não sendo Resend;
- falha na verificação pós-PATCH.

Não trocar para `no-reply@acheguese.com.br` apenas para "testar" enquanto o domínio estiver pendente. Isso pode fazer o Supabase gerar e-mail corretamente, mas o Resend rejeitar a entrega.

## Teste de ponta a ponta após a liberação

Depois do domínio verificado e do workflow concluído com sucesso, validar em produção:

1. abrir `/cadastro`;
2. criar uma conta com endereço de teste que possa receber e-mail;
3. confirmar que a UI mostra um único owner visual para eventual erro, sem mensagem duplicada;
4. confirmar que o e-mail chega com remetente `Achegue-se <no-reply@acheguese.com.br>` e assunto em português;
5. clicar em `Confirmar meu e-mail`;
6. confirmar a sessão/jornada de primeiro acesso prevista pelo Auth SSOT;
7. sair e entrar novamente;
8. confirmar que a Home reflete o usuário autenticado e não apresenta a CTA pública `Entrar` como estado principal;
9. inspecionar os logs do Resend para provar aceitação/entrega e ausência de `403` de domínio/test mode.

Não considerar a integração concluída apenas porque o cadastro criou uma linha em `auth.users`; a entrega e a confirmação real do e-mail fazem parte do critério de aceite.

## Diagnóstico de `403` do Resend

Quando o Resend retorna mensagem equivalente a "You can only send testing emails to your own email address", o SMTP está alcançando o Resend, mas a conta está limitada ao modo de teste porque o domínio de envio ainda não está verificado e/ou o remetente ainda usa `@resend.dev`.

Nesse cenário, corrigir DNS/verificação/identidade do remetente. Não mascarar o erro no frontend, não desativar confirmação de e-mail e não introduzir um segundo provedor como fallback silencioso.