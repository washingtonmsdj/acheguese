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
- Programas e Eventos respeitam `prefers-reduced-motion` no shell
  administrativo.
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

## Tranche adicional — Acessibilidade de movimento

- Dashboard, Explorer, detalhe público, Programas, Eventos, Leads, Planos e
  cabeçalho do Setup respeitam `prefers-reduced-motion`.
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

## Tranche adicional — Explorer/vitrine pública

- A interface pública não expõe mais o sufixo interno **V3** em título ou badge.
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
