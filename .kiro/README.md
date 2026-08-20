# Kiro workspace metadata

Status: FERRAMENTA / NAO CANONICO

`.kiro/` contem configuracao e memoria de trabalho da ferramenta Kiro.

- `settings/` pode conter configuracao necessaria para a integracao da ferramenta e deve ser tratada como configuracao de desenvolvimento, nao como arquitetura do produto.
- `specs/` preserva especificacoes e planos gerados para execucao/continuidade. Esses arquivos sao contexto historico ou operacional e **nao sao fonte de verdade** para runtime, schema, seguranca, rotas ou ownership.

## Regra de autoridade

Codigo executavel, migrations, testes, configuracao efetivamente consumida e documentacao viva/canonica em `docs/` prevalecem sobre qualquer spec em `.kiro/specs`.

Nenhum gate novo deve depender de texto literal, checklist ou status dentro de `.kiro/specs`. Se uma decisao de uma spec precisar permanecer vigente, ela deve ser promovida para o owner canonico correspondente e validada por codigo/teste/gate apropriado.
