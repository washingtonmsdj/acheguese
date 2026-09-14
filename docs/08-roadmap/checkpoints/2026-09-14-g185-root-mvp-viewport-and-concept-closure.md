# G185 — public root MVP viewport and concept closure

Data: 2026-09-14

## Objetivo

Fechar a `/` como entrega do MVP community-first, sem abrir novas frentes de infraestrutura e sem mascarar layout com `!important` ou um segundo owner de CSS.

## Implementado

### Mobile viewport e conteúdo alcançável

`TerritoryEntryPage.tsx` agora possui um scroll owner interno exclusivo para mobile:

- o wrapper usa `display: contents` no desktop, portanto o grid aprovado continua intacto;
- abaixo de 768 px ele vira coluna flexível e `overflow-y-auto`;
- `overscroll-contain` limita o scroll à superfície da entrada;
- `safe-area-inset-bottom` é reservado no final do conteúdo;
- `safe-area-inset-top` é reservado antes do primeiro conteúdo;
- nenhum `!important` foi introduzido.

Isso remove a dependência de todo o conteúdo caber dentro do `100dvh` fechado do owner CSS atual.

### Topbar em devices com notch

A topbar móvel recebe altura mínima de `3.5rem + env(safe-area-inset-top)`.

O scroll owner reserva o mesmo inset antes do conteúdo, evitando que a topbar expandida cubra o hero.

### Fidelidade ao HOME-SPEC

A implementação foi conferida contra `docs/05-ux/HOME-SPEC.md` 4.4:

- permanece uma única entrada canônica em `TerritoryEntryPage`;
- não existe busca por cidade nem geolocalização nessa superfície;
- “Nossa primeira comunidade” e “Seu lugar, mais perto.” permanecem como headline do concept;
- o Complexo é a única comunidade apresentada como lançada;
- os quatro territórios são derivados do grupo canônico;
- CTA principal continua `LAUNCH_URLS.community` e resulta em “Explorar o Complexo” pela metadata pública;
- cadastro continua separado;
- indicação continua em `/indicar-comunidade`;
- o rodapé agora usa a microcopy canônica de expansão por etapas.

### Copy territorial

Foi removida a construção gramatical “histórias de Complexo”.

A página deriva a preposição do artigo público do grupo:

- `do Complexo`;
- `da <comunidade>` quando aplicável;
- `de <comunidade>` como fallback.

A geografia canônica não foi renomeada: `Complexo do Nordeste de Amaralina` e `Chapada do Rio Vermelho` continuam íntegros nos dados; apenas os labels públicos explícitos permanecem `Complexo` e `Chapada`.

### Menu móvel

O botão do menu agora declara `aria-haspopup="true"`, preservando os contratos já existentes de `aria-expanded`, `aria-controls`, Escape, foco inicial e fechamento por clique externo.

## Regressões adicionadas

- `root-entry-community-first.test.ts` protege o scroll owner mobile e proíbe `max-md:!overflow-y-auto`;
- `root-entry-home-spec-contract.test.ts` cruza a página com o HOME-SPEC e protege:
  - escopo community-first;
  - ausência de busca/geolocalização;
  - CTA/cadastro/indicação;
  - labels públicos versus nomes canônicos;
  - safe areas e reachability em viewport baixo.

## O que não foi feito

`src/index.css` ainda contém duas gerações históricas de regras da entrada. A limpeza física continua desejável, mas deixou de ser bloqueadora para reachability mobile porque o scroll owner atual corrige o comportamento sem override importante.

Também permanecem referências antigas a `var(--territory-raised)` em regras legadas. Não foi criado alias `--territory-raised`; o token canônico continua `--territory-surface-raised` e as utilities Tailwind ativas já usam o mapeamento correto.

Não foi criada nova camada de CSS, stylesheet paralelo ou bridge visual.

## Certificação

Verificado por inspeção do source e regressões versionadas.

Não executado nesta sessão:

- Vitest;
- typecheck;
- lint;
- build;
- E2E;
- captura visual lado a lado.

O status remoto do SHA mais recente continua mostrando Vercel `build-rate-limit`. Isso é condição do provider e não certifica nem reprova o source.

## Estado da `/` após G185

A raiz deve ser tratada como **feature-complete no source para o contrato atual do MVP**.

Próximos passos da `/` são de validação e manutenção, não de invenção de novas funcionalidades:

1. executar build/test/E2E quando houver runner;
2. fazer captura visual em viewports-alvo;
3. limpar fisicamente o CSS legado quando houver edição segura do blob completo.
