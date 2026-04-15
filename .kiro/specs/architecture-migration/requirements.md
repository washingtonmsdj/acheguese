# Documento de Requisitos

## Introdução

Este documento define os requisitos para migrar a base de código de uma arquitetura baseada em camadas (organizada por tipo técnico: components/, services/, hooks/, pages/) para uma arquitetura feature-first (organizada por domínio/funcionalidade: app/, core/, modules/, shared/, integrations/). A migração deve preservar toda a funcionalidade existente, manter os padrões SSOT, permitir implantação sem tempo de inatividade e suportar rollback em qualquer ponto durante o        processo.

## Glossário

- **Migration_System**: As ferramentas automatizadas e processos que executam a migração de arquitetura
- **Compatibility_Layer**: Aliases temporários e re-exports que mantêm compatibilidade retroativa durante a migração
- **SSOT**: Single Source of Truth - o padrão arquitetural que garante que cada dado/lógica tenha exatamente uma localização autoritativa
- **Feature_Module**: Um diretório autocontido contendo todo o código relacionado a um domínio específico (components, services, hooks, types, pages)
- **Core_System**: Sistemas transversais usados em múltiplas features (auth, users, profiles, permissions, notifications, messaging, moderation, media, reputation, audit, search, location)
- **Barrel_Export**: Um arquivo index.ts que re-exporta APIs públicas de um módulo
- **Tree_Shaking**: Otimização de build que remove código não utilizado do bundle final
- **Migration_Phase**: Uma etapa discreta no processo de migração (app, shared, core, modules, integrations)
- **Rollback_Point**: Um estado de commit onde o sistema pode reverter com segurança para a arquitetura anterior
- **Cross_Module_Import**: Um import de um módulo de feature para outro (proibido na nova arquitetura)
- **Import_Rule**: Regras ESLint que impõem padrões de import permitidos na nova arquitetura

## Requisitos

### Requisito 1: Execução Sequencial da Migração

**História de Usuário:** Como desenvolvedor, quero que a migração siga uma ordem sequencial estrita, para que as dependências sejam resolvidas corretamente e o sistema permaneça funcional durante todo o processo.

#### Critérios de Aceitação

1. O Migration_System DEVE executar as fases de migração nesta ordem exata: app → shared → core → modules → integrations
2. QUANDO uma fase de migração é iniciada, O Migration_System DEVE completar essa fase antes de iniciar a próxima fase
3. O Migration_System DEVE migrar os módulos nesta ordem: dashboard → profile → business → services → classifieds → mobility → admin
4. SE uma fase de migração falhar na validação, ENTÃO O Migration_System DEVE interromper a execução e impedir que fases subsequentes sejam iniciadas
5. PARA TODAS as fases de migração, completar a fase N e então a fase N+1 DEVE produzir um sistema funcional (sequential correctness property)

### Requisito 2: Migração Sem Tempo de Inatividade

**História de Usuário:** Como product owner, quero que a aplicação permaneça totalmente funcional durante a migração, para que os usuários não experimentem nenhuma interrupção de serviço.

#### Critérios de Aceitação

1. ENQUANTO qualquer fase de migração estiver em progresso, O Migration_System DEVE manter toda a funcionalidade existente
2. QUANDO arquivos são movidos para novos locais, O Compatibility_Layer DEVE fornecer aliases para os caminhos de import antigos
3. O Migration_System DEVE criar arquivos Barrel_Export antes de mover o conteúdo dos módulos
4. QUANDO um arquivo é movido, O Migration_System DEVE atualizar todos os imports que referenciam esse arquivo
5. PARA TODOS os arquivos movidos, caminhos de import antigos DEVEM resolver para o mesmo módulo que os novos caminhos de import (import equivalence property)
6. O Migration_System DEVE validar que a aplicação compila com sucesso após cada movimentação de arquivo

### Requisito 3: Preservação do Padrão SSOT

**História de Usuário:** Como desenvolvedor, quero que os padrões SSOT sejam preservados durante a migração, para que a integridade dos dados e a manutenibilidade do código sejam mantidas.

#### Critérios de Aceitação

1. QUANDO um arquivo contendo lógica SSOT é movido, O Migration_System DEVE verificar que nenhuma definição duplicada foi criada
2. O Migration_System DEVE manter as regras ESLint SSOT existentes durante toda a migração
3. SE uma violação SSOT for detectada após uma etapa de migração, ENTÃO O Migration_System DEVE reportar a violação e interromper
4. O Migration_System DEVE atualizar os arquivos de configuração SSOT para referenciar os novos locais dos arquivos
5. PARA TODAS as entidades SSOT, DEVE existir exatamente uma definição autoritativa antes e depois da migração (SSOT invariant property)

### Requisito 4: Capacidade de Rollback

**História de Usuário:** Como desenvolvedor, quero fazer rollback para qualquer estado anterior da migração, para que eu possa me recuperar de problemas inesperados sem perda de dados.

#### Critérios de Aceitação

1. QUANDO uma fase de migração é completada, O Migration_System DEVE criar um Rollback_Point com uma mensagem de commit descritiva
2. O Migration_System DEVE marcar cada Rollback_Point com o nome da fase e timestamp
3. QUANDO um rollback é solicitado, O Migration_System DEVE restaurar a base de código para o Rollback_Point especificado
4. O Migration_System DEVE verificar que o código revertido compila e passa nos testes
5. PARA TODOS os Rollback_Points, reverter para o ponto N DEVE restaurar o estado exato após completar a fase N (rollback correctness property)

### Requisito 5: Validação Após Cada Etapa

**História de Usuário:** Como desenvolvedor, quero validação automática após cada etapa de migração, para que problemas sejam detectados imediatamente e não se acumulem.

#### Critérios de Aceitação

1. QUANDO um arquivo é movido, O Migration_System DEVE executar a compilação TypeScript para verificar que não há erros de tipo
2. QUANDO uma etapa de migração é completada, O Migration_System DEVE executar todos os testes automatizados
3. QUANDO uma etapa de migração é completada, O Migration_System DEVE verificar que a aplicação compila com sucesso
4. SE qualquer verificação de validação falhar, ENTÃO O Migration_System DEVE interromper e reportar a falha específica
5. O Migration_System DEVE verificar que o tamanho do bundle não aumenta mais de 5% após qualquer etapa
6. PARA TODAS as etapas de migração, validação passando na etapa N DEVE garantir que o sistema está em um estado válido (validation soundness property)

### Requisito 6: Gerenciamento da Camada de Compatibilidade

**História de Usuário:** Como desenvolvedor, quero aliases de import temporários durante a migração, para que eu possa migrar incrementalmente sem quebrar o código existente.

#### Critérios de Aceitação

1. QUANDO a migração inicia, O Migration_System DEVE configurar mapeamentos de caminho no tsconfig.json para todos os novos diretórios
2. QUANDO a migração inicia, O Migration_System DEVE configurar aliases Vite para todos os novos diretórios
3. QUANDO um arquivo é movido, O Compatibility_Layer DEVE criar re-exports no local antigo apontando para o novo local
4. QUANDO todos os arquivos de um diretório são migrados, O Migration_System DEVE remover os aliases de compatibilidade para esse diretório
5. QUANDO a migração é completada, O Migration_System DEVE remover todos os aliases e re-exports do Compatibility_Layer
6. PARA TODOS os caminhos de import, resolver através de aliases de compatibilidade DEVE produzir o mesmo módulo que imports diretos (alias transparency property)

### Requisito 7: Imposição de Regras de Import

**História de Usuário:** Como desenvolvedor, quero regras de import impostas na nova arquitetura, para que dependências entre módulos sejam prevenidas e a organização do código seja mantida.

#### Critérios de Aceitação

1. QUANDO o diretório core/ é criado, O Migration_System DEVE configurar Import_Rule para permitir core/* → shared/*
2. QUANDO o diretório modules/ é criado, O Migration_System DEVE configurar Import_Rule para permitir modules/* → core/*
3. QUANDO o diretório modules/ é criado, O Migration_System DEVE configurar Import_Rule para permitir modules/* → shared/*
4. QUANDO o diretório modules/ é criado, O Migration_System DEVE configurar Import_Rule para proibir Cross_Module_Import
5. O Migration_System DEVE configurar Import_Rule para proibir core/* → modules/*
6. QUANDO uma violação de Import_Rule é detectada, O Migration_System DEVE reportar a violação com localizações de arquivo e interromper
7. PARA TODOS os pares de módulos (A, B) onde A ≠ B, imports de modules/A para modules/B DEVEM ser proibidos (module isolation property)

### Requisito 8: Geração de Barrel Exports

**História de Usuário:** Como desenvolvedor, quero barrel exports para cada módulo, para que eu possa importar de APIs públicas limpas em vez de caminhos de arquivo profundos.

#### Critérios de Aceitação

1. QUANDO um Feature_Module é criado, O Migration_System DEVE gerar um arquivo Barrel_Export (index.ts) na raiz do módulo
2. O Barrel_Export DEVE re-exportar todos os componentes, serviços, hooks e tipos públicos do módulo
3. O Barrel_Export NÃO DEVE exportar detalhes de implementação interna ou utilitários privados
4. QUANDO um Feature_Module é migrado, O Migration_System DEVE atualizar o Barrel_Export para incluir exports recém-migrados
5. O Migration_System DEVE verificar que todos os arquivos Barrel_Export têm sintaxe TypeScript válida
6. PARA TODAS as APIs públicas em um módulo, importar via barrel export DEVE resolver para a mesma entidade que import direto (export equivalence property)

### Requisito 9: Otimização do Tamanho do Bundle

**História de Usuário:** Como desenvolvedor, quero que a nova arquitetura melhore o tamanho do bundle, para que a performance da aplicação seja aprimorada.

#### Critérios de Aceitação

1. QUANDO a migração é completada, O Migration_System DEVE medir o tamanho final do bundle
2. O Migration_System DEVE comparar o tamanho final do bundle com a baseline pré-migração
3. O Migration_System DEVE verificar que Tree_Shaking está habilitado para todos os exports de Feature_Module
4. O Migration_System DEVE configurar limites de code splitting no nível de Feature_Module
5. O Migration_System DEVE verificar que rotas lazy-loaded usam imports dinâmicos
6. QUANDO a migração é completada, o tamanho final do bundle DEVE ser menor ou igual ao tamanho do bundle pré-migração (bundle size optimization property)

### Requisito 10: Validação do Grafo de Dependências

**História de Usuário:** Como desenvolvedor, quero que os relacionamentos de dependência sejam validados, para que dependências circulares e violações arquiteturais sejam prevenidas.

#### Critérios de Aceitação

1. QUANDO uma fase de migração é completada, O Migration_System DEVE gerar um grafo de dependências de todos os módulos
2. O Migration_System DEVE detectar dependências circulares no grafo de dependências
3. SE uma dependência circular for detectada, ENTÃO O Migration_System DEVE reportar todos os arquivos no ciclo e interromper
4. O Migration_System DEVE verificar que a direção das dependências segue as regras de arquitetura (modules → core → shared)
5. O Migration_System DEVE verificar que nenhum Core_System depende de qualquer Feature_Module
6. PARA TODOS os módulos A e B, se A importa B e B importa A, O Migration_System DEVE detectar isso como uma dependência circular (cycle detection property)

### Requisito 11: Rastreamento do Progresso da Migração

**História de Usuário:** Como desenvolvedor, quero rastrear o progresso da migração, para que eu saiba o que foi completado e o que resta.

#### Critérios de Aceitação

1. QUANDO a migração inicia, O Migration_System DEVE criar um arquivo de status da migração listando todas as fases
2. QUANDO uma fase de migração inicia, O Migration_System DEVE atualizar o arquivo de status para marcar essa fase como "em progresso"
3. QUANDO uma fase de migração é completada, O Migration_System DEVE atualizar o arquivo de status para marcar essa fase como "completada"
4. O Migration_System DEVE registrar o timestamp e hash do commit para cada fase completada
5. O Migration_System DEVE exibir um resumo de progresso mostrando fases completadas, em progresso e pendentes
6. PARA TODAS as fases, o arquivo de status DEVE refletir com precisão se a fase foi completada (progress accuracy property)

### Requisito 12: Preservação da Suíte de Testes

**História de Usuário:** Como desenvolvedor, quero que todos os testes existentes continuem passando, para que eu possa verificar que a funcionalidade é preservada durante a migração.

#### Critérios de Aceitação

1. QUANDO um arquivo de teste é movido, O Migration_System DEVE atualizar todos os caminhos de import nesse arquivo de teste
2. QUANDO um arquivo fonte é movido, O Migration_System DEVE atualizar caminhos de import em todos os arquivos de teste que o referenciam
3. QUANDO uma fase de migração é completada, O Migration_System DEVE executar a suíte completa de testes
4. SE qualquer teste falhar após uma etapa de migração, ENTÃO O Migration_System DEVE reportar os testes que falharam e interromper
5. O Migration_System DEVE preservar a organização dos arquivos de teste paralela à organização dos arquivos fonte
6. PARA TODOS os testes que passavam antes da migração, esses testes DEVEM passar após a migração (test preservation property)

### Requisito 13: Atualizações de Documentação

**História de Usuário:** Como desenvolvedor, quero que a documentação seja atualizada para refletir a nova arquitetura, para que a equipe entenda a nova estrutura e convenções.

#### Critérios de Aceitação

1. QUANDO a migração é completada, O Migration_System DEVE gerar documentação de arquitetura descrevendo a nova estrutura
2. A documentação DEVE incluir regras de import e exemplos para cada diretório (app/, core/, modules/, shared/, integrations/)
3. A documentação DEVE incluir um guia de migração explicando como adicionar novas features na nova arquitetura
4. A documentação DEVE incluir um diagrama de dependências mostrando direções de import permitidas
5. O Migration_System DEVE atualizar o README.md para referenciar a nova documentação de arquitetura
6. A documentação DEVE incluir exemplos de padrões de import corretos e incorretos

### Requisito 14: Parser e Printer para Caminhos de Import

**História de Usuário:** Como desenvolvedor, quero transformação confiável de caminhos de import, para que todos os imports sejam corretamente atualizados durante a migração.

#### Critérios de Aceitação

1. O Migration_System DEVE fazer parse de declarações de import TypeScript para extrair caminhos de origem e destino
2. O Migration_System DEVE fazer parse tanto de imports relativos (./component) quanto de imports absolutos (@/components/component)
3. QUANDO um caminho de import é parseado, O Migration_System DEVE transformá-lo de acordo com o mapeamento da nova arquitetura
4. O Migration_System DEVE formatar caminhos de import transformados de volta em declarações de import TypeScript válidas
5. O Migration_System DEVE preservar o estilo de import (named imports, default imports, namespace imports)
6. PARA TODAS as declarações de import válidas, fazer parse então print então parse DEVE produzir uma declaração de import equivalente (round-trip property)
7. QUANDO um caminho de import não pode ser transformado, O Migration_System DEVE reportar o arquivo e número da linha

### Requisito 15: Operações Atômicas de Arquivo

**História de Usuário:** Como desenvolvedor, quero que movimentações de arquivo sejam atômicas, para que a base de código nunca fique em um estado parcialmente migrado e quebrado.

#### Critérios de Aceitação

1. QUANDO mover um arquivo, O Migration_System DEVE atualizar todos os imports que referenciam esse arquivo na mesma operação
2. SE qualquer atualização de import falhar, ENTÃO O Migration_System DEVE reverter a movimentação do arquivo e todas as atualizações de import
3. O Migration_System DEVE verificar que todos os arquivos atualizados têm sintaxe válida antes de commitar a operação
4. QUANDO uma operação de movimentação de arquivo é completada, O Migration_System DEVE commitar as mudanças com uma mensagem descritiva
5. O Migration_System DEVE verificar que a aplicação compila com sucesso após cada operação atômica
6. PARA TODAS as operações de movimentação de arquivo, ou todas as mudanças têm sucesso ou todas as mudanças são revertidas (atomicity property) são revertidas (atomicity property)
