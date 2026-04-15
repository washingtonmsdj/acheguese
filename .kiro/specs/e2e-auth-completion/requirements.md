# Documento de Requisitos

## Introdução

Esta funcionalidade completa a suíte de testes E2E configurando credenciais de autenticação e corrigindo os 13 testes que ainda falham. Atualmente, 180 de 193 testes (93%) passam, com 13 testes bloqueados por falta de credenciais de autenticação. O objetivo é alcançar 100% de taxa de aprovação nos testes configurando contas de usuários de teste adequadas e resolvendo quaisquer problemas relacionados à autenticação.

## Glossário

- **Suite_Testes_E2E**: O conjunto completo de 193 testes end-to-end cobrindo todos os módulos da aplicação
- **Usuario_Teste**: Uma conta de usuário regular criada especificamente para fins de testes E2E
- **Admin_Teste**: Uma conta de usuário admin criada especificamente para fins de testes E2E
- **Helper_Auth**: O módulo auxiliar de autenticação localizado em `e2e/helpers/auth.ts`
- **Variaveis_Ambiente**: Valores de configuração armazenados no arquivo `.env.test` para credenciais de teste
- **Seeder_Banco**: Um script ou mecanismo para criar contas de usuários de teste no banco de dados
- **PaginaLogin**: O componente de página de autenticação que renderiza o formulário de login
- **Testes_Admin**: Os 4 testes em `e2e/admin.spec.ts` que requerem credenciais de admin
- **Testes_Auth**: Os 3 testes em `e2e/auth.spec.ts` que testam fluxos de autenticação
- **Testes_Reivindicacoes_Empresas**: Os 3 testes em `e2e/business-claims.spec.ts` que requerem autenticação de admin
- **Ambiente_Teste**: A configuração de ambiente isolado para executar testes E2E

## Requisitos

### Requisito 1: Criação de Contas de Usuários de Teste

**História de Usuário:** Como desenvolvedor, quero contas de usuários de teste criadas no banco de dados, para que os testes E2E possam autenticar com credenciais reais

#### Critérios de Aceitação

1. O Seeder_Banco DEVE criar uma conta Usuario_Teste com email e senha
2. O Seeder_Banco DEVE criar uma conta Admin_Teste com email, senha e papel de admin
3. QUANDO o Seeder_Banco executar, O Seeder_Banco DEVE verificar que as contas não existem antes da criação
4. QUANDO o Seeder_Banco completar, O Seeder_Banco DEVE exibir as credenciais das contas criadas
5. O Usuario_Teste DEVE ter todos os campos de perfil necessários preenchidos para execução dos testes
6. O Admin_Teste DEVE ter privilégios de admin no campo role da tabela profiles

### Requisito 2: Configuração de Ambiente

**História de Usuário:** Como desenvolvedor, quero credenciais de teste configuradas em variáveis de ambiente, para que o Helper_Auth possa autenticar durante a execução dos testes

#### Critérios de Aceitação

1. O Ambiente_Teste DEVE fornecer um arquivo `.env.test` com credenciais de teste
2. O arquivo `.env.test` DEVE conter a variável E2E_USER_EMAIL com o email do Usuario_Teste
3. O arquivo `.env.test` DEVE conter a variável E2E_USER_PASSWORD com a senha do Usuario_Teste
4. O arquivo `.env.test` DEVE conter a variável E2E_ADMIN_EMAIL com o email do Admin_Teste
5. O arquivo `.env.test` DEVE conter a variável E2E_ADMIN_PASSWORD com a senha do Admin_Teste
6. O arquivo `.env.example` DEVE documentar todas as variáveis de ambiente dos testes E2E
7. O arquivo `.gitignore` DEVE excluir `.env.test` do controle de versão

### Requisito 3: Execução dos Testes de Admin

**História de Usuário:** Como desenvolvedor, quero que os testes de admin passem com credenciais configuradas, para que a funcionalidade de admin seja verificada

#### Critérios de Aceitação

1. QUANDO os Testes_Admin executarem com credenciais do Admin_Teste, O teste "usuário comum não acessa /admin" DEVE passar
2. QUANDO os Testes_Admin executarem com credenciais do Admin_Teste, O teste "admin acessa dashboard" DEVE passar
3. QUANDO os Testes_Admin executarem com credenciais do Admin_Teste, O teste "admin acessa página de empresas" DEVE passar
4. QUANDO os Testes_Admin executarem com credenciais do Admin_Teste, O teste "admin acessa página de usuários" DEVE passar
5. QUANDO um Usuario_Teste tentar acessar rotas de admin, A aplicação DEVE negar acesso ou redirecionar

### Requisito 4: Execução dos Testes de Autenticação

**História de Usuário:** Como desenvolvedor, quero que os testes de autenticação passem, para que os fluxos de login sejam verificados

#### Critérios de Aceitação

1. QUANDO os Testes_Auth executarem, O teste "página de login renderiza corretamente" DEVE passar
2. QUANDO os Testes_Auth executarem, O teste "exibe erro com credenciais inválidas" DEVE passar
3. QUANDO os Testes_Auth executarem, O teste "redireciona para /login ao acessar rota protegida sem auth" DEVE passar
4. QUANDO a PaginaLogin renderizar, A PaginaLogin DEVE exibir campo de email, campo de senha e botão de login
5. SE a renderização da PaginaLogin falhar, ENTÃO A aplicação DEVE registrar o erro para depuração

### Requisito 5: Execução dos Testes de Reivindicações de Empresas

**História de Usuário:** Como desenvolvedor, quero que os testes de reivindicações de empresas passem com credenciais de admin, para que o gerenciamento de reivindicações de admin seja verificado

#### Critérios de Aceitação

1. QUANDO os Testes_Reivindicacoes_Empresas executarem com credenciais do Admin_Teste, O teste "página carrega sem erro 404 na API" DEVE passar
2. QUANDO os Testes_Reivindicacoes_Empresas executarem com credenciais do Admin_Teste, O teste "exibe lista ou estado vazio" DEVE passar
3. QUANDO os Testes_Reivindicacoes_Empresas executarem com credenciais do Admin_Teste, O teste "filtros de status estão presentes" DEVE passar
4. QUANDO os Testes_Reivindicacoes_Empresas executarem com credenciais do Admin_Teste, O teste "troca de filtro não causa crash" DEVE passar

### Requisito 6: Verificação de Conclusão da Suíte de Testes

**História de Usuário:** Como desenvolvedor, quero verificar que todos os 193 testes passam, para que eu possa confirmar cobertura E2E completa

#### Critérios de Aceitação

1. QUANDO a Suite_Testes_E2E executar, A Suite_Testes_E2E DEVE executar todos os 193 testes
2. QUANDO a Suite_Testes_E2E completar, A Suite_Testes_E2E DEVE reportar 193 testes passando e 0 testes falhando
3. A Suite_Testes_E2E DEVE completar a execução em até 5 minutos
4. SE algum teste falhar, ENTÃO A Suite_Testes_E2E DEVE exibir informações detalhadas da falha
5. A Suite_Testes_E2E NÃO DEVE usar mocks ou gambiarras para autenticação
6. A Suite_Testes_E2E DEVE usar fluxos de autenticação reais através do Helper_Auth

### Requisito 7: Idempotência do Seeder de Banco

**História de Usuário:** Como desenvolvedor, quero que o seeder de banco seja idempotente, para que eu possa executá-lo múltiplas vezes com segurança

#### Critérios de Aceitação

1. QUANDO o Seeder_Banco executar e as contas de teste existirem, O Seeder_Banco DEVE pular a criação de contas
2. QUANDO o Seeder_Banco executar e as contas de teste existirem, O Seeder_Banco DEVE exibir informações das contas existentes
3. O Seeder_Banco DEVE fornecer uma opção de reset para deletar e recriar contas de teste
4. QUANDO a opção de reset do Seeder_Banco for usada, O Seeder_Banco DEVE deletar contas de teste existentes antes da criação

### Requisito 8: Documentação e Manutenção

**História de Usuário:** Como desenvolvedor, quero documentação clara para configuração de testes, para que outros desenvolvedores possam executar testes E2E

#### Critérios de Aceitação

1. O projeto DEVE fornecer um arquivo README ou documentação explicando a configuração dos testes E2E
2. A documentação DEVE incluir instruções passo a passo para criar contas de teste
3. A documentação DEVE incluir instruções para configurar variáveis de ambiente
4. A documentação DEVE incluir comandos para executar a suíte completa de testes
5. A documentação DEVE explicar como executar arquivos de teste individuais ou grupos de testes
6. A documentação DEVE documentar o uso e opções do Seeder_Banco
