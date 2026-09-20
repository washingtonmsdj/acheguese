# Revisão para implementação

Status: concluída em 20/09/2026.
Branch analisada: `codex/reformulacao-entrada-comunidade`.

| Item | Estado no concept mock |
| --- | --- |
| Persistir todos os campos exibidos e distinguir tipos de preço | Regra preservada; mock não simula persistência |
| Alinhar contato do anúncio com contato visível do perfil | Regra preservada; contato permanece opcional e condicionado |
| Uniformizar criação e edição sem perder dados | Fluxo visual representado nas etapas 1–8 |
| Rascunhos isolados por perfil com recuperação real | Não prometido; controles estão marcados como proposta |
| Gestão por status canônico e transições autorizadas | Estados ativo, em análise e pausado representados; transições não são falsificadas |
| Corrigir limites, bairros e navegação ilustrativos | Implementado: 100/2000, até 10 fotos, Santa Cruz/Chapada e navegação global |
| Verificar envio incerto e duplicatas | Implementado no texto de revisão: servidor determina publicado/em análise |
| Testar responsividade e acessibilidade | Validado em mobile 491×1108 e desktop 1707×960, sem overflow horizontal |

Consultar README antes de aplicar a imagem.

## Implementação do concept mock

Implementado em `src/app/pages/MeusAnunciosConceptMockPage.tsx`, isolado pela rota `/meus-anuncios?concept-mock=1`. A página cobre as quatro pranchas mobile — informações, fotos, revisão e gestão — além dos estados de vendido e envio não concluído, e reproduz a edição desktop da etapa de contato com prévia pública e cartões de estados.

Decisões aplicadas durante a comparação lado a lado:

- stepper mobile com pontos conectados, proporção e respiro alinhados à prancha;
- contadores corrigidos para 100 caracteres no título e 2000 na descrição;
- território restrito a bairros do Complexo, sem endereço residencial exato;
- “Pessoal” tratado como identidade do perfil, não como visibilidade;
- placeholders de telefone/WhatsApp, ação “Salvar rascunho” e estado ativo da etapa 6 adicionados ao desktop;
- envio sem sucesso fabricado: a revisão informa que o servidor determina publicado ou em análise;
- navegação inferior mantém o padrão global e usa ícones do sistema, sem símbolos improvisados.

## Verificação visual

- Mobile: viewport `491×1108`, etapas de informações, fotos e revisão navegadas; `document.documentElement.scrollWidth` e `document.body.scrollWidth` permanecem em `491`.
- Desktop: viewport `1707×960`, edição de contato e cartões inferiores conferidos; largura do documento `1687`, abaixo do viewport, sem overflow horizontal.
- A prancha usa fotos de bicicleta, mesa e cadeira que não existem como assets individuais no repositório. O mock mantém os assets territoriais disponíveis para preservar proporção, recorte e hierarquia sem inventar arquivos de produto.
