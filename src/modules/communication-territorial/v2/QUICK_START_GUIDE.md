# Guia Rápido - Dashboard V2

## 🚀 Acesso Rápido

### URL
```
/central/comunicacao/v2/:channelSlug
```

### Exemplo
```
/central/comunicacao/v2/portal-nordeste
```

---

## 📋 Pré-requisitos

1. **Usuário autenticado**
2. **Ter pelo menos um canal de comunicação gerenciado**
3. **Canal deve estar ativo e aprovado**

---

## 🎯 Funcionalidades Disponíveis

### 1. Overview (Visão Geral)
**O que faz**: Mostra resumo das métricas principais  
**Como usar**: É a view padrão ao abrir o dashboard  
**Métricas**: Publicações, Territórios, Rascunhos, Alcance

### 2. Publications (Publicações)
**O que faz**: Gerencia todas as publicações publicadas  
**Como usar**: Clicar em "Publicações" na Quick Actions Bar  
**Ações**: Editar, Visualizar, Excluir publicações

### 3. Drafts (Rascunhos)
**O que faz**: Gerencia rascunhos pendentes  
**Como usar**: Clicar em "Rascunhos" na Quick Actions Bar  
**Ações**: Continuar editando, Publicar, Excluir

### 4. Analytics
**O que faz**: Mostra métricas e insights do canal  
**Como usar**: Clicar em "Analytics" na Quick Actions Bar  
**Métricas**: Visualizações, Alcance, Engajamento, Top publicações

### 5. Territories (Territórios)
**O que faz**: Gerencia territórios autorizados  
**Como usar**: Clicar em "Territórios" na Quick Actions Bar  
**Ações**: Ver detalhes, Solicitar novo território

### 6. Schedule (Calendário)
**O que faz**: Gerencia publicações agendadas  
**Como usar**: Clicar em "Calendário" na Quick Actions Bar  
**Ações**: Agendar publicação, Ver agendamentos

### 7. Team (Equipe)
**O que faz**: Gerencia membros da equipe  
**Como usar**: Clicar em "Equipe" na Quick Actions Bar  
**Ações**: Convidar membro, Remover membro

---

## 🔄 Fluxo de Trabalho Típico

### Criar Nova Publicação
1. Clicar em "Nova Publicação" no header
2. Preencher título e conteúdo
3. Selecionar território
4. Adicionar mídia (opcional)
5. Publicar ou Salvar como rascunho

### Editar Rascunho
1. Ir para view "Rascunhos"
2. Clicar em "Continuar Editando"
3. Fazer alterações
4. Publicar ou Salvar novamente

### Agendar Publicação
1. Ir para view "Calendário"
2. Clicar em "Agendar Publicação"
3. Preencher dados
4. Selecionar data/hora
5. Confirmar agendamento

### Convidar Membro da Equipe
1. Ir para view "Equipe"
2. Clicar em "Convidar Membro"
3. Preencher email
4. Selecionar função (Admin, Editor, Colaborador)
5. Enviar convite

---

## 📱 Atalhos e Dicas

### Atalhos de Teclado (futuro)
- `Ctrl + N`: Nova publicação
- `Ctrl + S`: Salvar rascunho
- `Ctrl + P`: Publicar
- `Esc`: Fechar modal

### Dicas de Uso
- **Auto-seleção**: Se você tem apenas um canal, ele é selecionado automaticamente
- **Quick Actions**: Use a barra de navegação para alternar rapidamente entre views
- **Sidebar**: Widgets da sidebar ficam fixos no desktop para acesso rápido
- **Mobile**: Em mobile, a sidebar aparece no final da página
- **Estados Vazios**: Todos os estados vazios têm CTAs para começar

---

## 🐛 Troubleshooting

### Dashboard não carrega
**Problema**: Tela branca ou erro  
**Solução**: 
1. Verificar se está autenticado
2. Verificar se tem canais gerenciados
3. Verificar console do navegador

### Não vejo meus canais
**Problema**: Dropdown de canais vazio  
**Solução**:
1. Verificar se solicitou criação de canal
2. Verificar se canal foi aprovado
3. Verificar se tem permissão de gestor

### Dados não aparecem
**Problema**: Métricas zeradas ou vazias  
**Solução**:
1. Verificar se canal está selecionado
2. Aguardar carregamento (spinner)
3. Verificar conexão com internet

### Erro ao publicar
**Problema**: Não consegue publicar  
**Solução**:
1. Verificar se tem permissão de publicação
2. Verificar se território está autorizado
3. Verificar se todos os campos obrigatórios estão preenchidos

---

## 📞 Suporte

### Documentação
- **Completa**: `DASHBOARD_V2_DOCUMENTATION.md`
- **README**: `DASHBOARD_README.md`
- **Implementação**: `IMPLEMENTATION_SUMMARY.md`

### Ajuda
- **Widget de Ajuda**: Disponível na sidebar
- **Central de Ajuda**: Link no widget
- **Tour Guiado**: Botão no widget de ajuda

---

## 🎓 Tutoriais

### Para Iniciantes
1. **Primeiro Acesso**: Como navegar no dashboard
2. **Criar Publicação**: Passo a passo completo
3. **Gerenciar Rascunhos**: Workflow editorial
4. **Entender Analytics**: Métricas e insights

### Para Avançados
1. **Agendamento**: Estratégia editorial
2. **Gestão de Equipe**: Permissões e colaboração
3. **Territórios**: Expansão de cobertura
4. **Otimização**: Melhores práticas

---

## 🔐 Permissões

### Administrador
- ✅ Acesso total
- ✅ Configurações do canal
- ✅ Gestão de equipe
- ✅ Gestão de territórios
- ✅ Publicar diretamente

### Editor
- ✅ Criar publicações
- ✅ Editar publicações
- ✅ Publicar diretamente
- ✅ Ver analytics
- ❌ Configurações
- ❌ Gestão de equipe

### Colaborador
- ✅ Criar rascunhos
- ✅ Editar próprios rascunhos
- ✅ Ver analytics básico
- ❌ Publicar diretamente
- ❌ Editar publicações de outros
- ❌ Configurações

---

## 📊 Métricas Explicadas

### Publicações
Total de publicações publicadas no canal

### Territórios
Total de territórios autorizados para cobertura

### Rascunhos
Total de rascunhos pendentes de publicação

### Alcance
Número de pessoas alcançadas pelas publicações

### Visualizações
Total de visualizações de todas as publicações

### Engajamento
Taxa de interação (comentários + compartilhamentos / visualizações)

---

## 🎨 Personalização (futuro)

### Temas
- Claro (padrão)
- Escuro
- Auto (sistema)

### Layout
- Sidebar esquerda (padrão)
- Sidebar direita
- Sem sidebar

### Densidade
- Confortável (padrão)
- Compacto
- Espaçoso

---

## 🚀 Atualizações Futuras

### Em Desenvolvimento
- Editor rico de publicações (WYSIWYG)
- Biblioteca de mídia
- Calendário interativo
- Workflow de aprovação
- Analytics avançado

### Planejado
- Integração com redes sociais
- Monetização
- White-label
- API pública

---

**Versão**: 2.0.0  
**Última atualização**: 2024-01-XX  
**Status**: ✅ Disponível
