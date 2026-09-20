# MVP — Vagas e Eventos: auditoria estática de superfície pública — 2026-09-19

Status: **SOURCE-AUDITED / EXECUTABLE CERTIFICATION PENDING**

Base: `6b88c984f054332d7f8af74be4fc51965d430178` ou descendente.

Este checkpoint registra somente o que foi comprovado no código-fonte e no runtime remoto disponível. Não substitui CI/E2E/smoke do SHA candidato.

## Eventos

Fechamentos relevantes já integrados:

- inscrição gratuita só confirma sucesso depois do `joinEvent` real;
- cancelamento só confirma depois do `leaveEvent` real;
- ingressos pagos continuam informativos/fail-closed enquanto não existe checkout;
- salvar evento sem perfil autenticado não fica silencioso: orienta login;
- compartilhamento não marca link como copiado antes do `clipboard.writeText`;
- falha de clipboard e geração de QR Code fica visível;
- opção/import morto de Instagram removido;
- nenhum `concept-mock`/fake data runtime foi encontrado na passagem do módulo público.

Conclusão de source: **nenhum blocker de veracidade conhecido para manter `events:true`**.

## Vagas

Fechamentos relevantes já integrados:

- candidatura interna persiste em `vaga_applications` antes do sucesso;
- candidatura externa só confirma “canal aberto” quando WhatsApp/e-mail/URL/telefone realmente abre;
- cancelamento de share nativo não vira falso clipboard success;
- salvar vaga persiste via `ProfileSavedEntityService` e exige perfil;
- denúncia exige autenticação e só confirma após persistência;
- perfil público da empresa deixou de montar `/empresa/:id` manualmente e agora resolve via `BusinessUrlService.resolveById` + URL pública canônica;
- contador público de candidaturas aparece apenas para `applicationChannel === "internal"` e é rotulado “Candidaturas no Achegue-se”; o produto não finge conhecer candidaturas concluídas em canais externos;
- “Vagas semelhantes” usa o `locationId` real da vaga quando não há override;
- SEO deixou de prometer “Candidate-se agora!” independentemente do status;
- nenhum `concept-mock`/fake data runtime foi encontrado na passagem do módulo público.

Conclusão de source: **nenhum blocker de veracidade conhecido para manter `jobs:true`**.

## Gate que permanece

Eventos e Vagas continuam **condicionais no release** até existir certificação executável no SHA candidato:

1. Actions/runner realmente executar;
2. testes de arquitetura/regressão passarem;
3. E2E público passar;
4. build/deploy exact-SHA existir;
5. smoke no domínio de produção confirmar os fluxos reais.

Se qualquer uma das duas superfícies não passar pelo mesmo gate do núcleo, a ação correta continua sendo pausar somente o respectivo owner em `launchScope.ts`, sem remover o código.
