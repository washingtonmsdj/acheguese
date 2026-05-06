# Checklist de Validação Visual - Fase 3.3

**Data:** 2026-05-06  
**Status:** ⏳ PENDENTE (validação em navegador)

---

## 1. Rotas Principais

### 1.1 /central
- [ ] Carrega sem erros
- [ ] Layout CentralLayout renderiza corretamente
- [ ] Sidebar visível
- [ ] Breadcrumb "Central" correto
- [ ] CentralHubPage renderiza

### 1.2 /central/empresas
- [ ] Carrega sem erros
- [ ] CentralEmpresasPage renderiza
- [ ] Lista de empresas visível
- [ ] Breadcrumb "Central > Empresas" correto
- [ ] Botão "Criar empresa" visível

### 1.3 /central/empresas/:businessId
- [ ] Carrega sem erros
- [ ] BusinessAdminGuard bloqueia usuários sem acesso
- [ ] BusinessDashboardShellPage renderiza
- [ ] Breadcrumb "Central > Empresas > {nome}" correto
- [ ] Visão geral da empresa visível

### 1.4 /central/profissional
- [ ] Carrega sem erros
- [ ] ProfessionalGuard bloqueia usuários sem perfil profissional
- [ ] CentralProfissionalPage renderiza
- [ ] Breadcrumb "Central > Profissional" correto
- [ ] Empty state com CTA correto se não tiver perfil

### 1.5 /central/motorista
- [ ] Carrega sem erros
- [ ] DriverGuard bloqueia usuários sem driver_data
- [ ] CentralMotoristaPage renderiza
- [ ] Breadcrumb "Central > Motorista" correto
- [ ] Empty state com CTA "Cadastrar como Motorista" se não tiver perfil

### 1.6 /central/motoboy
- [ ] Carrega sem erros
- [ ] DriverGuard bloqueia usuários sem driver_data
- [ ] CentralMotoboyPage renderiza
- [ ] Breadcrumb "Central > Motoboy" correto
- [ ] Empty state com CTA "Cadastrar como Motoboy" se não tiver perfil

---

## 2. Subrotas de Empresa

### 2.1 /central/empresas/:businessId/dados
- [ ] Carrega sem erros
- [ ] BusinessDetailsPage renderiza
- [ ] Breadcrumb "Central > Empresas > {nome} > Dados da empresa" correto
- [ ] Formulário de dados visível

### 2.2 /central/empresas/:businessId/gastronomia
- [ ] Carrega sem erros
- [ ] GastronomyDashboardPage renderiza
- [ ] Breadcrumb "Central > Empresas > {nome} > Gastronomia" correto
- [ ] Subitens de Gastronomia visíveis na navegação contextual

### 2.3 /central/empresas/:businessId/gastronomia/cardapio
- [ ] Carrega sem erros
- [ ] MenuManagementPage renderiza
- [ ] Breadcrumb "Central > Empresas > {nome} > Gastronomia > Cardápio" correto
- [ ] Lista de categorias visível

### 2.4 /central/empresas/:businessId/gastronomia/pedidos
- [ ] Carrega sem erros
- [ ] OrdersPage renderiza
- [ ] Breadcrumb "Central > Empresas > {nome} > Gastronomia > Pedidos" correto
- [ ] Lista de pedidos visível

### 2.5 /central/empresas/:businessId/education
- [ ] Carrega sem erros
- [ ] EducationDashboardPage renderiza
- [ ] Breadcrumb "Central > Empresas > {nome} > Educação" correto
- [ ] Subitens de Education visíveis na navegação contextual

### 2.6 /central/empresas/:businessId/education/programas
- [ ] Carrega sem erros
- [ ] EducationProgramsPage renderiza
- [ ] Breadcrumb "Central > Empresas > {nome} > Educação > Programas" correto
- [ ] Lista de programas visível

### 2.7 /central/empresas/:businessId/education/leads
- [ ] Carrega sem erros
- [ ] EducationLeadsPage renderiza
- [ ] Breadcrumb "Central > Empresas > {nome} > Educação > Leads" correto
- [ ] Pipeline de leads visível

---

## 3. Subrotas de Mobilidade

### 3.1 /central/motorista/cadastro
- [ ] Carrega sem erros
- [ ] CentralMotoristaCadastroPage renderiza
- [ ] Breadcrumb "Central > Motorista > Cadastro" correto
- [ ] Formulário de cadastro visível

### 3.2 /central/motorista/disponibilidade
- [ ] Carrega sem erros
- [ ] CentralMotoristaDisponibilidadePage renderiza
- [ ] Breadcrumb "Central > Motorista > Disponibilidade" correto
- [ ] Toggle online/offline visível

### 3.3 /central/motorista/corridas
- [ ] Carrega sem erros
- [ ] CentralMotoristaCorridasPage renderiza
- [ ] Breadcrumb "Central > Motorista > Corridas" correto
- [ ] Lista de corridas visível

### 3.4 /central/motorista/ganhos
- [ ] Carrega sem erros
- [ ] CentralMotoristaGanhosPage renderiza
- [ ] Breadcrumb "Central > Motorista > Ganhos" correto
- [ ] Resumo de ganhos visível

### 3.5 /central/motorista/configuracoes
- [ ] Carrega sem erros
- [ ] CentralMotoristaConfiguracoesPage renderiza
- [ ] Breadcrumb "Central > Motorista > Configurações" correto
- [ ] Formulário de configurações visível

### 3.6 /central/motoboy/cadastro
- [ ] Carrega sem erros
- [ ] CentralMotoboyCadastroPage renderiza
- [ ] Breadcrumb "Central > Motoboy > Cadastro" correto
- [ ] Formulário de cadastro visível

### 3.7 /central/motoboy/disponibilidade
- [ ] Carrega sem erros
- [ ] CentralMotoboyDisponibilidadePage renderiza
- [ ] Breadcrumb "Central > Motoboy > Disponibilidade" correto
- [ ] Toggle online/offline visível

### 3.8 /central/motoboy/entregas
- [ ] Carrega sem erros
- [ ] CentralMotoboyEntregasPage renderiza
- [ ] Breadcrumb "Central > Motoboy > Entregas" correto
- [ ] Lista de entregas visível

### 3.9 /central/motoboy/ganhos
- [ ] Carrega sem erros
- [ ] CentralMotoboyGanhosPage renderiza
- [ ] Breadcrumb "Central > Motoboy > Ganhos" correto
- [ ] Resumo de ganhos visível

### 3.10 /central/motoboy/configuracoes
- [ ] Carrega sem erros
- [ ] CentralMotoboyConfiguracoesPage renderiza
- [ ] Breadcrumb "Central > Motoboy > Configurações" correto
- [ ] Formulário de configurações visível

---

## 4. Redirects Legados

### 4.1 /perfil/empresas → /central/empresas
- [ ] Redireciona corretamente
- [ ] URL muda para /central/empresas
- [ ] CentralEmpresasPage renderiza

### 4.2 /perfil/empresas/:businessId → /central/empresas/:businessId
- [ ] Redireciona corretamente
- [ ] URL muda para /central/empresas/:businessId
- [ ] BusinessDashboardShellPage renderiza

### 4.3 /perfil/mobilidade/motorista → /central/motorista
- [ ] Redireciona corretamente
- [ ] URL muda para /central/motorista
- [ ] CentralMotoristaPage renderiza

### 4.4 /perfil/mobilidade/motorista/corridas → /central/motorista/corridas
- [ ] Redireciona corretamente
- [ ] URL muda para /central/motorista/corridas
- [ ] CentralMotoristaCorridasPage renderiza

### 4.5 /perfil/mobilidade/motoboy → /central/motoboy
- [ ] Redireciona corretamente
- [ ] URL muda para /central/motoboy
- [ ] CentralMotoboyPage renderiza

### 4.6 /perfil/mobilidade/motoboy/entregas → /central/motoboy/entregas
- [ ] Redireciona corretamente
- [ ] URL muda para /central/motoboy/entregas
- [ ] CentralMotoboyEntregasPage renderiza

---

## 5. Rotas Pessoais Preservadas

### 5.1 /perfil
- [ ] Carrega sem erros
- [ ] PerfilPage renderiza
- [ ] Breadcrumb "Perfil" correto

### 5.2 /perfil/planos
- [ ] Carrega sem erros
- [ ] PerfilPlanosPage renderiza
- [ ] Breadcrumb "Perfil > Planos" correto

### 5.3 /perfil/configuracoes
- [ ] Carrega sem erros
- [ ] ProfileSettingsPage renderiza
- [ ] Breadcrumb "Perfil > Configurações" correto

### 5.4 /perfil/conta
- [ ] Carrega sem erros
- [ ] PerfilContaPage renderiza
- [ ] Breadcrumb "Perfil > Conta" correto

### 5.5 /perfil/familia
- [ ] Carrega sem erros
- [ ] FamiliaPage renderiza
- [ ] Breadcrumb "Perfil > Família" correto

---

## 6. Regras de Acesso

### 6.1 Usuário deslogado acessa /central
- [ ] Redireciona para /login
- [ ] URL muda para /login
- [ ] LoginPage renderiza

### 6.2 Usuário sem empresa vê empty state
- [ ] Empty state visível
- [ ] CTA "Criar empresa" visível
- [ ] Breadcrumb "Central > Empresas" correto

### 6.3 Usuário sem profissional vê CTA correto
- [ ] Empty state visível
- [ ] CTA "Cadastrar serviços" aponta para /services/cadastrar
- [ ] Breadcrumb "Central > Profissional" correto

### 6.4 Usuário sem driver_data em /central/motorista
- [ ] Empty state visível
- [ ] CTA "Cadastrar como Motorista" aponta para /create-driver?type=motorista
- [ ] Breadcrumb "Central > Motorista" correto

### 6.5 Usuário sem driver_data em /central/motoboy
- [ ] Empty state visível
- [ ] CTA "Cadastrar como Motoboy" aponta para /create-driver?type=motoboy
- [ ] Breadcrumb "Central > Motoboy" correto

### 6.6 Motorista sem motoboy não acessa /central/motoboy
- [ ] Empty state visível
- [ ] Mensagem "Perfil não habilitado para Motoboy"
- [ ] CTA "Habilitar modo Motoboy" aponta para /create-driver?type=motoboy

### 6.7 Motoboy sem motorista não acessa /central/motorista
- [ ] Empty state visível
- [ ] Mensagem "Perfil não habilitado para Motorista"
- [ ] CTA "Habilitar modo Motorista" aponta para /create-driver?type=motorista

### 6.8 Usuário sem acesso a empresa é bloqueado
- [ ] Redireciona para /central/empresas
- [ ] Toast "Você não tem permissão para gerenciar esta empresa"
- [ ] URL muda para /central/empresas

---

## 7. UX Desktop/Mobile

### 7.1 Sidebar não cobre conteúdo
- [ ] Sidebar tem largura fixa
- [ ] Conteúdo principal não é coberto
- [ ] Scroll funciona corretamente

### 7.2 Breadcrumbs corretos
- [ ] Breadcrumbs visíveis em todas as páginas
- [ ] Nomes truncam corretamente
- [ ] Links funcionam

### 7.3 Nomes longos truncam corretamente
- [ ] Nomes de empresas longos truncam
- [ ] Nomes de páginas longos truncam
- [ ] Truncamento com "..." no final

### 7.4 Subitens de gastronomia/educação não poluem mobile
- [ ] Subitens colapsáveis em mobile
- [ ] Subitens não ocupam muito espaço
- [ ] Scroll horizontal funciona quando necessário

### 7.5 Item ativo correto
- [ ] Item ativo destacado na navegação
- [ ] Cor de destaque correta
- [ ] Breadcrumb reflete item ativo

### 7.6 Scroll horizontal funciona quando necessário
- [ ] Scroll horizontal em breadcrumbs
- [ ] Scroll horizontal em navegação
- [ ] Scroll horizontal em tabelas

---

## Observações

**Problemas encontrados:**
- [ ] Descrever problemas encontrados

**Correções aplicadas:**
- [ ] Descrever correções aplicadas

**Sugestões:**
- [ ] Descrever sugestões de melhoria

---

## Status Final

**Validação concluída:** [ ] SIM [ ] NÃO  
**Central homologada:** [ ] SIM [ ] NÃO  
**Pendências restantes:** [ ] SIM [ ] NÃO

**Observações finais:**
- Descrever observações finais
