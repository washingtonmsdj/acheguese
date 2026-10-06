# Education — readiness pós-MVP

Data: 2026-10-06  
Branch de trabalho: `education/post-mvp-readiness`  
Status: **hardening pós-MVP; módulo permanece pausado no lançamento**

## Objetivo

Preparar a vertical Education para entrar depois do MVP sem reativar rotas,
sem criar um segundo owner de domínio e sem introduzir mudanças de banco
durante a estabilização atual do data plane.

## Baseline confirmado

- `education` continua `paused` em `productModuleRegistry.ts`;
- rotas públicas e privadas Education continuam fora dos grafos ativos;
- contratos, queries, mutations, tracking e observabilidade canônicos pertencem
  a `src/core/education`;
- a camada `src/modules/business/education` permanece sem acesso direto ao
  Supabase;
- o frontend preservado já possui Explorer, detalhe público, dashboard, setup,
  programas, leads, eventos, analytics e planos;
- nenhuma migration nova faz parte desta frente.

## Problemas encontrados na primeira auditoria

1. O componente de erro administrativo mostrava `error.message` bruto, podendo
   expor detalhes internos de SQL, RLS ou provider no frontend.
2. O dashboard não distinguia bem o estado de instituição ainda sem perfil
   Education configurado.
3. A página de Leads não oferecia retorno consistente ao dashboard da vertical.
4. O formulário público coletava campos opcionais de aluno sem uma orientação
   explícita de minimização de dados e tinha pares de campos apertados em telas
   pequenas.
5. A proteção de privacidade desses campos não estava registrada como ratchet
   arquitetural.

## Correções desta tranche

- mensagens administrativas agora passam por vocabulário seguro e não exibem
  o erro bruto de infraestrutura;
- estado de erro ganhou semântica `role=alert` e mensagem acionável;
- dashboard ganhou onboarding explícito quando o perfil Education ainda não
  existe;
- Leads ganhou navegação canônica de retorno para a gestão Education;
- formulário público passou a orientar que CPF, documentos, diagnóstico,
  prontuário e outros dados sensíveis de aluno não sejam enviados;
- nome de aluno foi apresentado como **primeiro nome opcional**;
- limites de tamanho e autocomplete foram reforçados nos campos públicos;
- pares de campos passaram a empilhar no mobile;
- cards da vitrine respeitam `prefers-reduced-motion` e deixam de aplicar deslocamento visual quando redução de movimento está ativa;
- área de ações do modo lista usa separação horizontal no mobile e lateral apenas a partir de `md`;
- link principal do card recebeu foco visível consistente com os tokens territoriais;
- testes protegem sanitização de erro e minimização de dados.

## Restrições desta frente

- não mudar `education.status` para ativo;
- não adicionar Education aos lazy imports ativos;
- não criar migrations/DDL enquanto a reconciliação do data plane não estiver
  liberada;
- não duplicar services de `src/core/education` dentro do módulo;
- não considerar UI renderizando como prova de readiness de produção.

## Tranche adicional — assinatura, Analytics e frontend

- `EducationSubscriptionService.getSubscriptionStatus` passou a propagar falhas de
  resolução de Business, assinatura e catálogo: erro de infraestrutura não deve
  virar `PlanTier.FREE` sintético.
- Teste comportamental dedicado prova falha de identidade Business, falha de
  assinatura e falha de catálogo sem fallback para Free; ausência de policy no
  catálogo pode usar baseline de entitlements apenas para o **mesmo tier
  canônico**.
- `useEducationSubscription` também preserva estado desconhecido: enquanto
  não existe status canônico resolvido, `planTier` e `isActive` permanecem
  indefinidos em vez de assumir Free/inativo.
- `useEducationSubscription` expõe `refetch` canônico para retry de leitura.
- `useEducationAnalytics` reutiliza a mesma assinatura cacheada da vertical,
  sem uma segunda consulta de entitlement; métricas só são lidas quando a
  assinatura ativa autoriza analytics.
- Analytics distingue configuração pendente, consulta de assinatura falha,
  acesso legítimo negado, consulta de métricas falha e dados reais carregados.
  Nenhuma resposta ausente é apresentada como cartões de contagem zero.
- Planos distingue erro de assinatura e erro do catálogo: não escolhe mais o
  primeiro plano do catálogo como se fosse o plano atual do usuário.
- Falha de resolução de autoridade owner/gestor ganhou estado de erro próprio
  com retry; ausência de role por erro de infraestrutura não é mais apresentada
  como **Gestor: assinatura somente leitura**.
- O checkout é serializado por plano: enquanto uma sessão está sendo aberta,
  novas tentativas ficam bloqueadas e o botão mostra **Abrindo checkout...**.
- `expiresAt = null` não é mais exibido como “Sem data de expiração”; a UI
  diferencia assinatura ativa sem data de renovação informada de assinatura
  sem período ativo.
- Analytics ganhou navegação de retorno para o dashboard canônico, foco
  visível por teclado, espaçamento responsivo e identificação explícita
  do relatório CSV.
- Testes novos: leitura de assinatura sem fallback fictício e hook de
  Analytics com permissões reais, falha, revogação e métricas positivas.
- Ratchet de erros privados alinhado ao componente atual que sanitiza
  mensagens técnicas.
- `enrollment_open = null` permanece **não informado** no read model de
  Analytics; não é mais convertido em `false`/“fechado”.
- Na exportação CSV, estado de matrícula desconhecido produz célula vazia,
  preservando a diferença entre ausência de informação e valor negativo.
- Analytics reutiliza `enrollment_open` do perfil já carregado pela página e
  inclui esse valor na chave da query; não faz uma segunda leitura do perfil
  apenas para compor a métrica escolar.
- Média de dias até o primeiro contato agora é `null` quando não existe
  nenhuma amostra válida, em vez de inventar `0 dias`; a UI mostra
  **Sem contatos medidos** e o CSV mantém a célula vazia.
- Teste direto de `getLeadPipelineMetrics` prova `null` sem amostra válida,
  média apenas de timestamps não negativos, propagação de erro de leitura e
  rejeição de profile ID inválido antes da query.
- A exportação CSV já tem testes para células vazias em métricas desconhecidas e
  neutralização de fórmulas; a pendência restante é a prova de browser com
  entitlement pago real no candidato de release.
- O card foi renomeado para **Distribuição do pipeline**, pois seus percentuais
  representam participação atual por status, não taxa de passagem entre etapas.
- Skeletons dos cards de Analytics usam animação apenas com
  `motion-safe`.
- Taxa média de ocupação de programas é `null` quando não existe capacidade
  conhecida; o CSV mantém célula vazia em vez de inventar `0%`.

## Tranche adicional — Programas, Eventos e Leads

- Programas, Eventos e Leads agora distinguem explicitamente uma instituição
  sem perfil Education de uma instituição configurada sem registros.
- Programas consome os validadores canônicos de `src/core/education` antes de
  disparar mutation, mantendo frontend e write model no mesmo contrato de nome,
  vagas e preço.
- As consultas de Billing/Niche em Programas e Eventos não são iniciadas quando
  ainda não existe perfil Education.
- O pipeline de Leads bloqueia novas transições enquanto uma mudança está em
  andamento e apresenta feedback seguro quando a mutation falha.
- O pipeline respeita `prefers-reduced-motion`.
- Datas de evento vindas de `datetime-local` passaram a usar parser estrito:
  datas impossíveis que o JavaScript normalizaria silenciosamente são rejeitadas
  antes da conversão para UTC.
- Testes unitários cobrem datas locais impossíveis e o ratchet arquitetural
  protege os novos estados administrativos e o bloqueio de dupla transição.
- Programas passou a distinguir valor numérico ausente de valor zero:
  `null` significa não informado, `0` continua sendo um valor válido para
  vagas e preço. Programa com preço zero é apresentado como **Gratuito**.
- Vagas, capacidade e número de matriculados são validados como inteiros não
  negativos; quando capacidade e matrícula são conhecidas, matrícula não pode
  superar a capacidade.
- Updates parciais de capacidade/matrícula combinam o valor novo com o valor
  existente antes da validação, sem bloquear alterações alheias em registros
  legados.
- No detalhe público, capacidade conhecida com matrícula desconhecida mostra
  apenas a capacidade; `null` não é inventado como **0 matriculados**.
- `available_slots = 0` aparece como **Sem vagas** com estado visual de
  atenção, em vez de um badge verde de disponibilidade.
- Diálogos de Programas e Eventos ganharam altura máxima, rolagem interna e
  ações empilhadas no mobile para evitar campos ou botões inacessíveis em telas
  pequenas.
- Programas e Eventos respeitam `prefers-reduced-motion` no shell e nos
  cards administrativos.
- Tipos de evento usam o owner compartilhado de `../constants`; a página de
  Eventos deixou de manter uma segunda tabela local de labels/opções.
- Sobreposição de horários ganhou detecção canônica no core e aviso consultivo
  no formulário administrativo. A UI não bloqueia atividades simultâneas porque
  o domínio ainda não possui conceito de sala/recurso que justificaria uma
  restrição obrigatória; durante edição, o próprio evento é excluído da
  comparação.
- Estado temporal de evento foi centralizado no core como `upcoming`,
  `ongoing`, `past` ou `invalid`; evento já iniciado mas ainda não
  encerrado não é mais tratado como passado.
- O painel administrativo mostra **Em andamento** e sinaliza registros legados
  com cronologia inválida como **Revisar data**.
- A vitrine pública usa um filtro `active` separado para incluir eventos em
  andamento, sem mudar silenciosamente a semântica da métrica `upcoming` de
  Analytics.

## Tranche adicional — Setup e integridade do perfil

- Setup passou a usar um único caminho de persistência: o botão principal é
  `type="submit"` e delega ao `onSubmit` do formulário.
- O facade não expõe mais `getOrCreateProfile`: leitura não pode criar draft
  implicitamente. A criação compensável de perfil fica restrita ao submit
  explícito de `saveSetupProfile`.
- Faixa etária e código INEP ganharam validação canônica em
  `src/core/education/profileValidation.ts`, consumida pelo frontend e pelo
  write model.
- Idades aceitas precisam ser inteiras entre 0 e 120 anos, e a idade mínima
  não pode ser maior que a máxima.
- Código INEP, quando informado, precisa conter exatamente 8 dígitos e é
  normalizado com `trim()` antes da persistência.
- Testes unitários e ratchet arquitetural protegem essas invariantes.
- Fonte pública, quando informada, precisa ser uma URL absoluta `http` ou
  `https` válida e é normalizada antes da persistência.
- `school_source_updated_at` pertence ao write model: salvar configurações com
  a mesma URL preserva o timestamp anterior; trocar a fonte gera novo timestamp;
  remover a fonte limpa a proveniência.
- Atualização isolada de `school_source_updated_at` sem alteração da URL é
  ignorada, evitando afirmar uma revisão de fonte que não ocorreu.
- Validação do write model ficou null-safe para `summary` e
  `whatsapp_number`; campos opcionais nulos não podem provocar exceção.
- Setup reforça semântica de entrada com INEP numérico de 8 dígitos, URL de
  proveniência tipada e WhatsApp como telefone, mantendo o core como autoridade
  final.

## Tranche adicional — detalhe público e métricas de leitura

- Cards de programas deixaram de anunciar a ação inexistente **Ver detalhes** e
  perderam cursor/hover de elemento navegável quando não há rota de detalhe.
- `program_view` e `event_view` passam a representar impressão real do
  conteúdo em viewport, com deduplicação por item durante a sessão da página,
  em vez de depender de clique sem destino.
- O card de programa respeita `prefers-reduced-motion`.
- Preço `0` é preservado na página pública e apresentado como **Gratuito**;
  ausência de preço continua sendo ausência de informação.
- Ratchet visual impede o retorno da falsa affordance.
- Modalidade e turno de programas usam labels compartilhados da vertical;
  códigos técnicos como `in_person` e `morning` não vazam para a UI.
- Modalidade ausente não é mais inventada como **Presencial**.
- Ocupação conhecida com zero matrículas preserva o valor real `0%`.

## Tranche adicional — Dashboard administrativo

- Sem perfil Education, o Dashboard expõe somente **Configuração**; Programas,
  Leads, Eventos e Analytics deixam de parecer utilizáveis antes do setup.
- Status do perfil usa o componente canônico com labels pt-BR em vez de exibir
  valores técnicos como `draft` ou `published`.
- O cabeçalho não exibe `institution_type` bruto; usa o nome do nicho quando
  conhecido.
- Infraestrutura `null` é exibida como **Não informado**; somente arrays
  realmente carregados são contados, preservando a diferença entre ausência de
  informação e zero itens.
- Animações do Dashboard respeitam `prefers-reduced-motion`.

## Tranche adicional — Pipeline de Leads

- A etapa **Perdido** deixou de ser apenas visual: o painel agora expõe uma
  transição explícita para `lost`, já permitida pelo domínio canônico.
- Marcar um lead como perdido exige motivo operacional validado pelo
  `src/core/education`; o frontend consome a mesma regra e encaminha
  `lostReason` pela mutation existente, preservando auditoria sem criar uma
  segunda autoridade.
- O diálogo orienta explicitamente a não registrar CPF, documentos,
  diagnóstico, prontuário ou outros dados sensíveis no motivo da perda.
- O pipeline bloqueia ações concorrentes enquanto uma mutation está em curso.
- Leads administrativos têm paginação explícita de 25 itens; as contagens por
  etapa continuam refletindo o pipeline inteiro.
- A identidade da query inclui `pageSize`, evitando reaproveitamento incorreto
  de cache quando o tamanho da página variar.
- Ratchet arquitetural protege o motivo operacional, a minimização de dados e
  a paginação.
- Conversão para **Matriculado** preserva o status anterior já lido pelo write
  model e o reutiliza no evento `education_lead_converted`; a métrica não
  registra mais `enrolled` como se fosse o status anterior.
- Retry idempotente `enrolled → enrolled` não dispara uma segunda conversão,
  evitando inflação de analytics por repetição da mesma mutation.
- `updateEducationLead` usa o contrato canônico
  `EducationLeadAdminPatch`, que expõe apenas campos administrativos
  editáveis e exclui status, IDs, timestamps, origem, primeiro contato e motivo
  de perda; a guarda runtime continua rejeitando `status`.
- Toda transição passa exclusivamente por `moveLeadToStatus`, preservando
  regras, motivo de perda e auditoria.
- `first_contact_at` só é preenchido na transição real para `contacted`;
  retry idempotente `contacted → contacted` não renova o timestamp do primeiro
  contato.
- A máquina de estados do pipeline foi centralizada em
  `core/education/leadPipelineValidation.ts`; facade e write model usam o
  mesmo owner. `enrolled` e `lost` não expõem próximos passos, eliminando a
  divergência que antes sugeria `enrolled → lost` na helper de UI.
- O helper sem base observada `calculateLeadConversionProbability` foi removido;
  a vertical não apresenta propensão de conversão hardcoded por etapa como se
  fosse uma métrica real.
- O helper legado `isProgramAvailable` também foi removido: ele tratava
  `available_slots = null` como `0`, confundindo quantidade de vagas não
  informada com indisponibilidade real.

## Tranche adicional — Acessibilidade de movimento

- Dashboard, Explorer, detalhe público, Programas, Eventos, Leads, Planos e
  cabeçalho do Setup respeitam `prefers-reduced-motion`.
- CTAs do detalhe público também respeitam redução de movimento ao rolar/focar
  o formulário de interesse; scroll suave só é usado quando permitido pelo
  sistema.
- Animações de entrada deixam de ser requisito para compreender ou operar a
  interface quando redução de movimento está ativa.
- Ratchet arquitetural protege as superfícies administrativas restantes.

## Tranche adicional — formulário público de interesse

- O formulário público respeita `prefers-reduced-motion` tanto no estado de
  edição quanto no sucesso.
- Telefone é validado no cliente pelo mesmo intervalo aceito pelo broker
  público (10 a 15 dígitos), reduzindo round-trips de erro sem deslocar a
  autoridade final do RPC.
- Turnos desejados reutilizam o owner compartilhado de labels da vertical.
- O sucesso informa apenas que a solicitação foi registrada para análise e
  explicita que isso não confirma matrícula, vaga ou prazo de resposta.
- Respostas deduplicadas do broker (`created: false`) não disparam
  `trackLeadSubmitted`, evitando inflar conversões com reenvios do mesmo lead.
- Ratchet arquitetural protege essas semânticas e a minimização de dados.
- Estado de sucesso é anunciado com `role="status"`/`aria-live`, o formulário
  expõe `aria-busy` durante o envio e mensagens de erro antigas são removidas
  assim que o usuário volta a editar os campos.

## Tranche adicional — Explorer/vitrine pública

- A interface pública não expõe mais o sufixo interno **V3** em título ou badge.
- Estados de erro, carregamento e resultado vazio do Explorer anunciam sua
  semântica para tecnologias assistivas.
- Cards de categoria expõem `aria-pressed` e nome acessível, refletindo o
  estado real do filtro sem depender apenas de aparência visual.
- Chips de nicho também expõem `aria-pressed`; a busca principal ganhou
  rótulo acessível persistente e a contagem de resultados é anunciada com
  `role="status"`/`aria-live="polite"`.
- CTAs repetidos dos cards usam nome acessível contextualizado pela instituição
  (**Ver detalhes de …** / **Abrir WhatsApp de …**), evitando listas de links
  indistinguíveis em leitores de tela.
- Cards destacados e seções de marketing respeitam `prefers-reduced-motion`.
- O bloco que apenas mostra uma amostra dos primeiros resultados deixou de se
  apresentar como **curadoria/destaque** não comprovado.
- Fallback de nome público usa nome do nicho ou **Instituição educacional**;
  `institution_type` técnico não é exibido ao visitante.
- Níveis educacionais usam labels pt-BR do owner compartilhado e não vazam
  códigos como `early_childhood` ou `elementary_2`.
- Rede escolar no bloco público usa o mapa de labels já existente.
- Ratchets visual e de constantes protegem essas semânticas.
- As tabs fixas do detalhe público agora navegam de fato até a seção
  correspondente, respeitam `prefers-reduced-motion` e expõem
  `aria-controls`, `aria-current="location"` e foco visível por teclado.
- Breadcrumb, favorito e compartilhar no hero também expõem foco visível
  consistente; o breadcrumb ganhou rótulo de navegação para tecnologias
  assistivas.
- Compartilhamento público tem fallback explícito quando o navegador não
  oferece Web Share nem Clipboard API; o botão não termina silenciosamente.
- Tabs do detalhe, favorito/compartilhar, chips de nicho e botão móvel de
  filtros usam alvo de toque mínimo de 44 px nas superfícies públicas
  principais.
- O detalhe público também evita `institution_type` como fallback visível:
  usa o nome do nicho ou **Instituição educacional**.
- Badge de escola pública exibe somente o identificador **INEP**, sem sugerir
  que o perfil inteiro foi oficialmente verificado.
- Timestamp de proveniência aparece como **Referência atualizada em**, sem
  afirmar uma revisão humana que o dado não comprova.

## Tranche adicional — owners compartilhados de contato

- `EducationUrlService.buildWhatsAppLink` permanece apenas como adapter de
  compatibilidade e delega a construção/normalização ao
  `src/shared/utils/contactLinks.ts`.
- A vertical não mantém mais uma segunda implementação de `wa.me`; telefones
  sem dígitos utilizáveis retornam `null` e números locais seguem a
  normalização compartilhada do produto.
- Ratchet visual impede a reintrodução de URL WhatsApp montada manualmente no
  service Education.

## Tranche adicional — integridade de dados e segurança de CI

- O teste de allowlists do Gitleaks deixou de embutir uma string de conexão
  detectável; o único falso positivo histórico foi registrado pelo fingerprint
  exato no baseline, sem liberar arquivo inteiro ou ampliar regex de exceção.
- O Security Scan isolado do fix de Gitleaks passou verde.
- Taxa média de ocupação permanece `null` quando não há capacidade conhecida;
  o CSV não converte esse estado em `0%`.
- O formatter monetário compartilhado preserva `0` como valor válido e
  diferencia preço zero de preço ausente.
- O pipeline administrativo prefere `student_name/student_age` aos campos
  legados e preserva idade `0`; teste de renderização cobre esse caso.

## Tranche adicional — E2E autenticado e inventário de cobertura

- O inventário em `tests/e2e/education/README.md` deixou de declarar cobertura
  completa inexistente: separa suite operacional, smoke legado, público pausado
  e diagnóstico não-certificante.
- `education-dashboard-debug.spec.ts` fica explicitamente fora da certificação.
- A suite autenticada dedicada do lifecycle continua operando sem service-role
  no browser e foi ampliada para provar por UI + banco:
  - persistência de INEP e fonte pública;
  - idade mínima `0` e idade máxima;
  - programa com `available_slots = 0`;
  - preço `0` preservado em vez de virar ausência.
- Ratchet de lifecycle exige essas provas e mantém a suite pública em
  `describe.skip` enquanto Education estiver `paused`.
- Essas mudanças fortalecem a prova disponível, mas a execução hosted same-SHA
  da suite autenticada continua obrigatória antes de qualquer ativação.

## Tranche adicional — reivindicação institucional pública

- O campo de comprovação institucional reutiliza
  `resolveSafeHttpUrl` do owner compartilhado antes do submit.
- URL vazia ou inválida bloqueia a ação e produz feedback acessível no próprio
  formulário; o usuário não precisa descobrir o erro apenas depois da chamada.
- A URL normalizada é encaminhada ao `BusinessClaimService`, que permanece a
  autoridade final para limite, protocolo, normalização e persistência da
  evidência; o frontend não força HTTPS sobre uma fonte `http` válida.
- A vertical não introduz parser próprio nem reduz as validações centrais.

## Tranche adicional — owner de captação pública de Leads

- O caminho privado legado `EducationService.createLead` foi aposentado porque
  não tinha caller de UI; sua única consumidora era uma mutation interna do
  hook que também não era usada por nenhuma tela.
- A captação pública permanece exclusivamente em
  `PublicEducationLeadService.create`, preservando broker/RPC, deduplicação e
  contratos de segurança já certificados.
- Regex locais de e-mail/telefone e tracking paralelo saíram do facade, evitando
  uma segunda autoridade de validação/observabilidade.
- O write model interno de Lead permanece disponível para operações autorizadas
  do domínio, mas não é exposto pela UI pública como atalho.

## Tranche adicional — fronteiras de escrita administrativas

- Programas e Eventos ganharam patches canônicos no `src/core/education`,
  equivalentes ao contrato restrito já usado por Leads.
- Patches administrativos não expõem `id`, `education_profile_id`,
  `created_at` ou `updated_at`.
- A guarda runtime do write model bloqueia campos imutáveis mesmo se um caller
  tentar contornar a tipagem por cast.
- A guarda de Lead também cobre `source_channel`, `first_contact_at` e
  `lost_reason`, além de `status`.
- Facade e hooks usam os mesmos tipos canônicos; o cast amplo de Programas foi
  removido.

## Tranche adicional — ownership de validação

- Validadores legados de perfil, programa, lead e evento foram removidos do
  `EducationService`; eles não tinham callers reais além dos próprios testes e
  duplicavam regras já pertencentes ao core/write model.
- O facade volta a orquestrar operações sem manter uma segunda autoridade de
  validação.
- `createProgram` e `createEvent` também deixaram de repetir prechecks locais de
  nome/título; os respectivos write models canônicos são a autoridade dessas
  regras.
- Ratchet arquitetural impede o retorno desses quatro validadores locais.
- O bloco legado `AUXILIARY / UTILITY METHODS` do `EducationService` foi
  removido integralmente: labels, formatação, resumo síncrono de pipeline,
  helpers de status e outros métodos sem caller real deixaram de ampliar a API
  do facade. Os dois testes que existiam apenas para essa API auto-referencial
  também foram removidos.

## Tranche adicional — E2E operacional de Eventos

- `createTestEvent` foi alinhado ao schema canônico
  (`starts_at`/`ends_at`); o helper legado ainda usava
  `start_date`/`end_date`.
- Nova suite `education-events.spec.ts` usa fixture técnica com provenance
  controlada apenas para semear dados e autentica a UI como owner/admin real.
- A suite prova renderização, edição público/privado, aviso consultivo de
  sobreposição e exclusão com confirmação.
- A criação pela UI permanece fora dessa prova porque a fixture atual é FREE;
  nenhum teste altera plano artificialmente para fazer a capability parecer
  liberada.
- Esta suite é smoke operacional dependente de ambiente e **não** substitui o
  E2E autenticado de release com entitlement pago real.

## Tranche adicional — filtro público de eventos ativos

- O filtro SQL de eventos `active` continua amplo para reduzir leitura, mas o
  read model revalida cada linha com `isEducationEventActive` antes de devolver
  resultados ao detalhe público.
- Eventos futuros ou em andamento válidos permanecem visíveis; registros
  legados com cronologia inválida não escapam para a vitrine apenas porque
  `starts_at` ainda está no futuro.
- A semântica de Analytics `upcoming` permanece separada e não foi alterada.
- Ratchet arquitetural exige que o filtro `active` continue passando pelo
  owner temporal canônico.

## Tranche adicional — visibilidade de eventos inválidos

- O resumo administrativo de Eventos passou a expor uma categoria
  **Revisar** para registros classificados como `invalid` pelo owner temporal.
- `Total`, `Próximos`, `Em andamento`, `Passados` e `Revisar` deixam
  de mascarar divergências quando existe dado legado com cronologia inválida.
- A lista já mostrava badge **Revisar data**; agora o resumo também torna esse
  estado observável sem alterar a regra de domínio nem bloquear edição.
- Timestamps impossíveis não vazam mais `Invalid Date` do runtime para o
  administrador; a apresentação usa **Data inválida**.
- Ratchet arquitetural protege a contagem de eventos inválidos.

## Tranche adicional — disponibilidade administrativa de Programas

- O card administrativo de Programa deixa de apresentar `0 vagas` como
  **“0 vagas disponíveis”**.
- `available_slots = 0` agora aparece como **Sem vagas**, alinhando o admin ao
  detalhe público e preservando a diferença entre zero e valor não informado.
- Ratchet arquitetural protege essa semântica.

## Tranche adicional — currículo de Programas

- Limites de currículo/conteúdo foram movidos para
  `src/core/education/programValidation.ts`.
- O owner canônico normaliza espaços, remove duplicatas e valida no máximo
  `50` itens com até `80` caracteres por item.
- Mutation e formulário administrativo consomem a mesma regra; o usuário recebe
  feedback antes da chamada em vez de cair em erro genérico após persistência.
- A UI apresenta os limites reais junto ao campo.
- Testes unitários e ratchet arquitetural protegem normalização e ownership.

## Tranche adicional — isolamento de suites de diagnóstico

- `education-debug.spec.ts`, `education-cookie-debug.spec.ts`,
  `education-network-debug.spec.ts` e `education-dashboard-debug.spec.ts`
  ficam explicitamente em `test.skip`.
- Esses arquivos continuam disponíveis para investigação manual, mas não podem
  ser contabilizados como smoke, aceitação ou certificação da vertical.
- O inventário E2E lista os quatro como diagnóstico não-certificante.
- Ratchet arquitetural impede a remoção acidental do `skip` sem uma decisão
  explícita de transformar o diagnóstico em teste determinístico.

## Tranche adicional — E2E operacional de Programas

- `education-programs.spec.ts` deixou de depender de waits fixos, asserts de
  “qualquer conteúdo” e skips condicionais quando a UI obrigatória não aparece.
- A fixture técnica semeia o programa; a UI autenticada prova renderização,
  edição com `available_slots = 0`, desativação e exclusão com confirmação.
- A persistência da edição/exclusão é verificada no banco pela fixture
  autorizada.
- Criação pela UI continua fora desta suite quando o entitlement real da fixture
  não autoriza o recurso; nenhum plano é falsificado para produzir um “verde”.
- Ratchet arquitetural impede o retorno dos padrões permissivos removidos.

## Tranche adicional — E2E operacional de Leads

- `education-leads.spec.ts` deixou de aceitar “qualquer conteúdo”, busca
  inexistente e skips condicionais como prova de funcionamento.
- A fixture técnica semeia leads; a UI autenticada prova:
  - renderização no pipeline;
  - transição `new → contacted` com `first_contact_at`;
  - transição para `lost` somente com motivo operacional e persistência de
    `lost_reason`;
  - paginação administrativa de 25 itens com 26 leads reais.
- As mutations são verificadas no banco pela fixture autorizada.
- Ratchet arquitetural impede o retorno de waits fixos e asserts permissivos
  removidos desta suite.

## Tranche adicional — API de Analytics

- `useEducationAnalytics` deixa de reexportar o namespace bruto
  `educationQueries`.
- O hook expõe somente dados, estados, retry e permissões necessárias à UI,
  preservando entitlement/cache como caminho canônico de acesso.
- Ratchet arquitetural impede o retorno de `queries: educationQueries`.

## Tranche adicional — superfície mínima de assinatura

- O adapter `EducationSubscriptionService` deixou de expor wrappers
  `canUsePremiumPublicPage`, `canUseShortPremiumLink`, `canUseAnalytics`
  e `canExportData` sem callers runtime.
- Consumidores usam o único snapshot canônico retornado por
  `getSubscriptionStatus`: `planTier`, `isActive`, `entitlements` e
  `expiresAt`.
- A vertical deixa de reconsultar Billing por helpers paralelos e reduz a API
  pública do adapter sem bridge de compatibilidade.
- Ratchet arquitetural impede o retorno dos wrappers removidos.

## Tranche adicional — remoção do alias planType

- `planType` foi removido de `EducationSubscriptionStatus`, do hook de
  assinatura, do hook de Analytics e dos mocks de Billing.
- Education usa somente `planTier` canônico para identificar o plano; a
  vertical não mantém mais a taxonomia paralela `free/basic/premium`.
- `resolvePlanType` deixou de existir no adapter Education.
- Ratchet arquitetural impede o retorno do alias deprecated.

## Tranche adicional — API de assinatura

- `useEducationSubscription` deixou de expor um objeto local `permissions`
  com aliases de entitlement e classificações `isPremium/isBasic/isFree`.
- A vertical consome `status`, `entitlements` e `planTier` canônicos do
  Billing, evitando uma segunda linguagem de plano dentro de Education.
- O import local de `PlanTier` deixou de ser necessário no hook.
- Ratchet arquitetural impede o retorno desses aliases.

## Tranche adicional — limites do formulário público de interesse

- Campos de nome do contato/responsável/aluno foram alinhados ao broker
  `education-lead-intake`: máximo de `160` caracteres.
- E-mail (`254`), telefone (`32`, com validação de 10–15 dígitos),
  observações (`1000`) e etapa manual (`120`) permanecem coerentes com a
  autoridade final.
- A UI deixa de rejeitar nomes entre 121 e 160 caracteres que o broker
  validava como legítimos.
- Ratchet arquitetural protege os limites principais do intake público.

## Tranche adicional — integridade de edição administrativa de Leads

- O patch administrativo de Lead passou a reutilizar validação canônica em
  `src/core/education/leadValidation.ts`.
- Nome, e-mail, telefone, idades, textos opcionais, série/etapa, turno e
  `owner_user_id` são revalidados no write model antes da persistência.
- E-mail é normalizado para lowercase e textos administrativos têm espaços
  normalizados; campos opcionais em branco viram `null` em vez de strings
  vazias.
- Edição de `desired_grade` continua respeitando o nicho real do perfil:
  etapas oficiais ou custom válidas; nenhuma regra de série foi deslocada para
  a UI.
- `moveLeadToStatus` também valida `ownerUserId` antes de alterar o owner.
- Criação interna e edição administrativa compartilham os mesmos limites
  básicos do broker público: nomes até 160, e-mail até 254, telefone até 32,
  observação até 1000, série até 120 e idades entre 0 e 120.
- Testes unitários e ratchet arquitetural protegem normalização, limites e
  ownership da validação.

## Tranche adicional — ações do pipeline orientadas pelo core

- A UI do pipeline deixou de inferir a próxima transição pela posição visual em
  `PIPELINE_STAGES`.
- `EducationPipelineView` consome `getEducationLeadNextStatuses` do core para
  decidir seta, ação **Avançar** e disponibilidade de **Perdido**.
- Ações repetidas no pipeline têm nomes acessíveis únicos, incluindo o nome do
  lead e, no avanço, a etapa de destino; leitores de tela não recebem uma lista
  ambígua de botões chamados apenas “Avançar”/“Perdido”.
- Em listas paginadas, uma etapa com leads globais mas nenhum card na página
  atual mostra **Nenhum lead desta etapa nesta página**; a UI não contradiz mais
  a contagem global exibida no cabeçalho da etapa.
- A etapa terminal **Matriculado** não mostra mais seta visual apontando para
  **Perdido**, eliminando uma affordance incompatível com a máquina de estados.
- Ratchet arquitetural impede o retorno do acesso
  `PIPELINE_STAGES[index + 1].status` como regra de negócio.

## Tranche adicional — feedback acessível ao marcar Lead como perdido

- O diálogo de **Marcar como perdido** continua usando a validação canônica do
  core, mas agora explica o erro depois que o campo é tocado.
- O textarea expõe `aria-invalid`, ajuda e erro via `aria-describedby`;
  a mensagem de validação usa região `aria-live="polite"`.
- Fechar ou concluir o diálogo limpa também o estado de interação, evitando
  erro residual na próxima abertura.
- Ratchet arquitetural protege a semântica acessível sem duplicar a regra de
  mínimo/máximo na UI.

## Tranche adicional — opt-in de lifecycle autenticado

- O workflow canônico `.github/workflows/ssot-tests.yml` ganhou o input manual
  `run_education_lifecycle`, desligado por padrão.
- O lifecycle autenticado de Education só é executado quando um
  `workflow_dispatch` solicita explicitamente esse input; pull requests e pushes
  normais não passam a executar a vertical pausada.
- O passo reutiliza `test:e2e:education-lifecycle-authenticated`, a fixture
  autenticada dedicada e o transporte GitHub OIDC já usados pelo release; não
  introduz service-role no job do navegador.
- A suíte autenticada agora prova que INEP malformado não passa a validação do
  formulário, que fonte pública não-http(s) e faixa etária invertida são
  rejeitadas e que essas tentativas não persistem `education_profile`.
- O mesmo lifecycle fecha CRUD real de Programas no entitlement FREE da
  fixture: criação, edição, reativação e exclusão com confirmação; a remoção é
  verificada pelo mesmo `program.id` no backend.
- O lifecycle também prova semântica numérica real: vagas/preço `0` persistem
  como zero; ao limpar os campos, ambos persistem como `null`, sem colapsar
  valor ausente em zero.
- Em viewport `390×844`, o diálogo de Programa mantém dimensões limitadas,
  rolagem interna e ações **Criar Programa**/**Cancelar** alcançáveis no
  viewport, sem persistir dados extras durante essa prova.
- Compensação de falha parcial já é provada deterministicamente por
  `EducationService.setup-compensation.test.ts`: draft criado pela tentativa
  falha é removido, perfil preexistente é preservado e sucesso não dispara
  cleanup.
- Não existe fault injection remoto de produção apenas para simular falha; uma
  prova remota adicional só deve existir se houver mecanismo explicitamente
  seguro para induzir e isolar o erro.
- Esta tranche prepara o caminho de certificação, mas **não conta como smoke de
  produção executado** até um workflow manual rodar contra o deployment do mesmo
  SHA candidato.

## Tranche adicional — fechamento operacional de Leads

- A suíte operacional de Leads agora prova idade `0` sem colapsar o valor como
  ausente.
- A UI prova apenas transições permitidas: `new` avança para `contacted`,
  `contacted` avança para `visit_scheduled`, não existe affordance de
  salto/backward e `enrolled` não expõe ações.
- Um `PATCH` abortado somente no navegador produz feedback de falha na UI e
  preserva `status = new` e `first_contact_at = null` no backend.
- A paginação 25/26 mantém a contagem global da etapa em ambas as páginas.
- Motivo de `lost`, avanço válido e `first_contact_at` já eram verificados
  com persistência real.
- Não resta gap funcional conhecido nessa fatia de source/teste; a execução em
  ambiente autorizado no SHA candidato continua obrigatória.

## Tranche adicional — fechamento operacional de Eventos

- A suíte operacional de Eventos agora rejeita término igual ao início pelo
  validador canônico e confirma que `starts_at/ends_at` persistidos permanecem
  inalterados após a tentativa inválida.
- Leitura, edição público→privado, aviso consultivo de sobreposição e exclusão
  com confirmação já possuem prova operacional autenticada.
- Datas locais impossíveis permanecem cobertas pelos testes canônicos do parser
  e do core; o E2E não manipula controles nativos para fabricar valores que o
  navegador não aceita.
- Criação de evento pela UI continua deliberadamente pendente de entitlement
  pago real; a fixture FREE não tem plano adulterado para produzir um verde.

## Tranche adicional — certificação paga read-only

- Foi adicionada uma suite autenticada separada para Analytics/Planos que só
  roda quando `E2E_EDUCATION_PAID_BUSINESS_ID` aponta para um Business
  realmente pago e owned pela fixture autenticada dedicada.
- A suite não cria assinatura, não altera plano, não usa service-role no
  navegador e não pode transformar ausência de fixture paga em skip verde.
- Analytics prova acesso autorizado e exportação CSV pelo navegador; o arquivo
  baixado precisa conter as seções canônicas de leads, programas e eventos.
- Planos prova que o plano atual está ativo e resolvido pelo catálogo canônico,
  sem fallback **Plano não identificado no catálogo**.
- Checkout não é iniciado por esta prova read-only; comportamento real de
  checkout continua exigindo uma certificação controlada separada.
- O workflow ganhou o opt-in manual `run_education_paid_lifecycle`, desligado
  por padrão e sem impacto em pull requests/pushes normais.
- Ratchet arquitetural protege o caráter read-only, o requisito de Business
  pago explícito e a ausência de service-role.

## Tranche adicional — identidade institucional canônica

- A relação entre `niche_key` e `institution_type` saiu do model da página
  de Setup e passou para `src/core/education/profileIdentity.ts`.
- Setup consome o mesmo owner canônico usado pelo domínio.
- O write model rejeita combinações incompatíveis de tipo institucional e
  nicho, impedindo persistência válida apenas pela UI.
- Updates parciais também são protegidos: ao alterar só `niche_key` ou só
  `institution_type`, o write model combina o patch com a identidade persistida
  e valida o estado final antes de gravar.
- Teste unitário e ratchet arquitetural protegem o mapeamento e a ausência de
  uma tabela paralela no frontend.

## Tranche adicional — nível de suporte canônico

- Os valores de `support_level` passaram para
  `src/core/education/supportLevel.ts`, alinhados ao constraint existente do
  banco: `full_enabled`, `basic_enabled`, `beta` e `planned`.
- A constante pública do módulo apenas reutiliza o owner do core; não mantém
  uma segunda lista local.
- O write model rejeita níveis fora do contrato antes de persistir.
- Teste unitário e ratchet arquitetural protegem o ownership e os valores.

### Gates comprovados e gates ainda pendentes

No SHA `8e3fd97533123eb785ad90bedf64e329f8a0d709`, o PR comprovou:

- Lint e TypeScript typecheck verdes;
- Canonical Release Build Preflight verde;
- Runtime Tests (Vitest) verdes;
- Phase Core Gate / SSOT verde;
- Active Visual SSOT verde;
- Security Check e Security Scan verdes;
- Heavy PR Certification verde;
- E2E fixture-backed remoto verde;
- Regression Check verde.

O job **Authenticated release E2E (Production smoke)** permaneceu **skipped**.
Por isso, estes resultados **não ativam Educação** e não autorizam marcar a
vertical como production-ready.

Ainda são obrigatórios antes de qualquer despausa:

- E2E autenticado de release no mesmo SHA candidato;
- reconciliação de schema/RLS/RPCs quando o data plane for liberado;
- probes remotos de autorização e persistência sobre o backend reconciliado;
- validação final de responsividade/acessibilidade nas rotas que serão ativadas;
- deployment do mesmo SHA que passar todos os gates de ativação.

## Tranche adicional — anti-abuso do intake público de Leads

- O formulário público de Education passou a usar o `TurnstileWidget`
  compartilhado do produto, com action canônica `education-lead`.
- O client envia `turnstileToken` e honeypot pelo
  `PublicEducationLeadService`; o token não é persistido na tabela de Leads.
- O broker `education-lead-intake` valida origem permitida, rate limit, honeypot,
  Turnstile action/hostname e IP confiável antes de consultar elegibilidade ou
  gravar PII.
- Falha de Turnstile/configuração é fail-closed e retorna mensagem pública
  sanitizada; o formulário reseta token consumido após erro.
- `verify_jwt=false` fica explícito porque o endpoint é intake público e
  auto-protegido, no mesmo modelo dos brokers públicos já canônicos; escrita
  continua exclusivamente server-side por service role.
- O broker foi renomeado de `education-lead-rpc` para
  `education-lead-intake`: o sufixo `-rpc` é reservado pela governance para
  funções JWT-authenticated e não pode receber exceção no-JWT. A migration que
  cita o nome anterior permanece intocada como registro histórico.
- `EDGE_FUNCTION_AUTH_POLICY.json` passou a ratchear origin, rate limit,
  Turnstile, honeypot, token e service-role do broker.
- O teste `public-education-lead-intake-g6.test.ts` protege o contrato
  browser → service → Edge → policy para impedir novo drift.

### Cutover remoto do broker público

O rename do source **não autoriza deploy nesta frente**. Quando o data plane for
liberado para a ativação pós-MVP, o cutover precisa ser atômico no mesmo
candidate SHA:

1. publicar `education-lead-intake` com `verify_jwt=false` e os secrets
   `TURNSTILE_SECRET_KEY` / `ALLOWED_ORIGINS` válidos;
2. provar origin, rate limit, honeypot, Turnstile action/hostname, elegibilidade,
   deduplicação e INSERT server-side;
3. validar o frontend publicado apontando para `education-lead-intake`;
4. somente após os probes verdes, retirar/desativar o broker remoto legado
   `education-lead-rpc`;
5. preservar a migration histórica que cita o nome anterior; ela não deve ser
   reescrita apenas por causa do rename.

## Próximas etapas

1. manter o PR em draft e Education em `paused`;
2. aceitar novo hardening de frontend/contratos apenas quando houver achado
   concreto de CI, E2E, revisão ou teste manual; não repetir auditorias já
   encerradas nesta branch;
3. considerar concluída, em nível de código desta frente, a rodada de
   Programs/Events sobre cronologia, estados de mutation e aviso consultivo de
   sobreposição; qualquer regra obrigatória de conflito depende de um futuro
   conceito de sala/recurso e não deve ser inventada na UI;
4. considerar concluída, em nível de código desta frente, a rodada de
   Explorer/Detail sobre teclado, screen reader, reduced-motion, nomes
   acessíveis e alvos de toque; a prova de release continua dependendo de E2E
   e validação no mesmo SHA candidato;
5. após liberação do data plane, reconciliar schema/RLS/RPCs e rodar os probes
   remotos;
6. executar o E2E autenticado de release e o deployment no mesmo SHA candidato;
7. somente então avaliar a despausa da vertical.

## Definition of Done para entrada pós-MVP

Education só poderá ser candidata a ativação quando frontend, contratos,
autorização, banco reconciliado, E2E, responsividade, acessibilidade e
deployment estiverem comprovados juntos no mesmo SHA.
