# Checkpoint G157 — entrada MVP centrada na primeira comunidade

Data: 2026-09-14

## Objetivo

Integrar o conceito visual do Codex na `main` sem transportar a regressão funcional da branch visual. A primeira tela pública deve refletir o MVP real: lançamento inicial no Complexo do Nordeste de Amaralina.

## Entregue

- Entrada raiz simplificada para o Complexo, sem busca por cidade e sem geolocalização nessa primeira tela.
- Mantido mapa compacto no mobile e mapa territorial no desktop.
- Copy alinhada ao conceito: "Nossa primeira comunidade", "Sem cadastro para explorar" e expansão por etapas.
- Removida a aparência de seleção de múltiplas comunidades enquanto só existe uma superfície de lançamento.
- Criado caminho explícito para criação de conta sem transformar cadastro em seleção territorial.
- Indicação de comunidade passou a usar o serviço canônico de registro de interesse (`register-community-interest`), com anti-spam/Turnstile quando configurado, em vez de confirmação fictícia local.
- Indicação aceita cidade e bairro e permite marcar, separadamente, interesse em receber novidades.
- Navegação territorial deixa de exibir superfícies públicas pausadas, preservando `mobility=false` e `education=false`.

## Preservado

- Fluxo real de descoberta territorial e mapa necessários para renderizar o território de lançamento.
- Roteamento canônico e `LAUNCH_URLS`.
- Capacidade de explorar o Complexo sem autenticação.
- Mobilidade continua pausada e não foi ativada por causa do conceito visual.

## Próxima frente

Aplicar o mesmo princípio às demais telas conceituais do Codex: usar o visual como camada de apresentação, migrando cada mock para dados/owners reais e mantendo funcionalidades existentes. Não fazer merge integral da branch visual.

## Provider gate

Após os commits deste checkpoint, Vercel criou novos deployments automáticos. No momento do checkpoint, os deployments mais recentes estavam em fila/building e não havia eventos de erro nos logs consultados. Isso não constitui certificação verde até `READY` no mesmo SHA.
