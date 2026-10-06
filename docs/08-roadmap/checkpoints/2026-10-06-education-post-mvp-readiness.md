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
- `useEducationSubscription` também preserva estado desconhecido: enquanto
  não existe status canônico resolvido, `planTier`, `planType` e
  `isActive` permanecem indefinidos em vez de assumir Free/inativo.
- `useEducationSubscription` expõe `refetch` canônico para retry de leitura.
- `useEducationAnalytics` reutiliza a mesma assinatura cacheada da vertical,
  sem uma segunda consulta de entitlement; métricas só são lidas quando a
  assinatura ativa autoriza analytics.
- Analytics distingue configuração pendente, consulta de assinatura falha,
  acesso legítimo negado, consulta de métricas falha e dados reais carregados.
  Nenhuma resposta ausente é apresentada como cartões de contagem zero.
- Planos distingue erro de assinatura e erro do catálogo: não escolhe mais o
  primeiro plano do catálogo como se fosse o plano atual do usuário.
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
- Diálogos de Programas e Eventos ganharam altura máxima, rolagem interna e
  ações empilhadas no mobile para evitar campos ou botões inacessíveis em telas
  pequenas.
- Programas e Eventos respeitam `prefers-reduced-motion` no shell e nos
  cards administrativos.
- Tipos de evento usam o owner compartilhado de `../constants`; a página de
  Eventos deixou de manter uma segunda tabela local de labels/opções.

## Tranche adicional — Setup e integridade do perfil

- Setup passou a usar um único caminho de persistência: o botão principal é
  `type="submit"` e delega ao `onSubmit` do formulário.
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
- Cards destacados e seções de marketing respeitam `prefers-reduced-motion`.
- O bloco que apenas mostra uma amostra dos primeiros resultados deixou de se
  apresentar como **curadoria/destaque** não comprovado.
- Fallback de nome público usa nome do nicho ou **Instituição educacional**;
  `institution_type` técnico não é exibido ao visitante.
- Níveis educacionais usam labels pt-BR do owner compartilhado e não vazam
  códigos como `early_childhood` ou `elementary_2`.
- Rede escolar no bloco público usa o mapa de labels já existente.
- Ratchets visual e de constantes protegem essas semânticas.
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

## Tranche adicional — ownership de validação

- Validadores legados de perfil, programa, lead e evento foram removidos do
  `EducationService`; eles não tinham callers reais além dos próprios testes e
  duplicavam regras já pertencentes ao core/write model.
- O facade volta a orquestrar operações sem manter uma segunda autoridade de
  validação.
- Ratchet arquitetural impede o retorno desses quatro validadores locais.

### Gates ainda pendentes

Os commits desta tranche **não** ativam Educação. São necessários typecheck,
lint, testes direcionados e E2E da branch; certificação de auth/RLS/schema,
probes remotos e deployment no mesmo SHA só após a liberação do data plane.
Não declarar `ready` apenas por alteração de código ou CI parcial.

## Próximas etapas

1. executar typecheck, lint e testes Education/arquitetura no SHA da branch;
2. consolidar o shell administrativo de Education para cabeçalhos, navegação,
   loading, empty e error states consistentes;
3. revisar Programs e Events para validação de formulário, conflitos de data,
   limites e estados de mutation;
4. revisar Leads para minimização operacional, transições de pipeline e
   feedback de mutation;
5. revisar Analytics para estados sem dados, exportação e semântica das
   métricas;
6. continuar a validação de Explorer e Detail em mobile, teclado e leitura por
   screen reader; reduced-motion dos cards do Explorer já foi corrigido;
7. somente após liberação do data plane, reconciliar schema/RLS/RPCs e rodar
   probes remotos;
8. fechar com E2E completo e deployment do mesmo SHA antes de qualquer
   despausa.

## Definition of Done para entrada pós-MVP

Education só poderá ser candidata a ativação quando frontend, contratos,
autorização, banco reconciliado, E2E, responsividade, acessibilidade e
deployment estiverem comprovados juntos no mesmo SHA.
