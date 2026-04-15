# ✅ Checklist de Produção - Identidade Pública

## Status: VALIDAÇÃO PRÉ-PRODUÇÃO

---

## 1. Business (Empresa)

### Criação de Slug
- [ ] **Criar empresa nova**
  - Acessar: `/empresas/criar`
  - Preencher nome: "Padaria Teste Produção"
  - Verificar auto-sugestão de slug: `padaria-teste-producao`
  - Alterar slug manualmente se necessário
  - Verificar badge de disponibilidade (verde/vermelho)
  - Salvar empresa
  - **Resultado esperado:** Empresa criada com slug único

- [ ] **Validar slug reservado**
  - Tentar criar com slug: `admin`, `api`, `dashboard`
  - **Resultado esperado:** Badge vermelho "Reservado pelo sistema"

- [ ] **Validar slug já usado**
  - Tentar criar com slug de empresa existente
  - **Resultado esperado:** Badge vermelho "Já está em uso"

### Edição de Slug
- [ ] **Editar slug existente**
  - Acessar: `/empresas/editar/:id`
  - Alterar slug de `padaria-teste-producao` para `padaria-teste-novo`
  - **Resultado esperado:** 
    - Aviso azul persistente aparece
    - Comparação: link antigo → novo link
    - Mensagem: "links antigos continuarão sendo redirecionados"

- [ ] **Confirmar mudança de slug**
  - Clicar em "Salvar"
  - **Resultado esperado:** Dialog de confirmação abre
  - Título: "Confirmar alteração de link público"
  - Texto: "Links antigos continuarão funcionando..."
  - Clicar em "Confirmar alteração"
  - **Resultado esperado:** Save executado, slug atualizado

- [ ] **Cancelar mudança de slug**
  - Alterar slug novamente
  - Clicar em "Salvar"
  - Clicar em "Cancelar" no dialog
  - **Resultado esperado:** Dialog fecha, save não executado

- [ ] **Validar cooldown**
  - Tentar alterar slug novamente imediatamente
  - **Resultado esperado:** 
    - Campo desabilitado OU
    - Mensagem: "Você poderá alterar novamente em X dias"
    - Badge de cooldown visível

### Página Pública Business
- [ ] **Acessar página pública**
  - URL: `/empresas/:uf/:cidade/:slug`
  - Exemplo: `/empresas/ba/salvador/padaria-teste-novo`
  - **Resultado esperado:** Página carrega com dados da empresa

- [ ] **Validar redirect de slug antigo**
  - URL antiga: `/empresas/ba/salvador/padaria-teste-producao`
  - **Resultado esperado:** Redirect 301 para novo slug
  - URL final: `/empresas/ba/salvador/padaria-teste-novo`

- [ ] **Validar 404 para slug inexistente**
  - URL: `/empresas/ba/salvador/nao-existe-xyz`
  - **Resultado esperado:** Página 404 ou mensagem "Empresa não encontrada"

---

## 2. Profile (Perfil Pessoal)

### Criação de Username
- [ ] **Criar perfil pessoal**
  - Acessar: `/perfil/criar` ou signup
  - Preencher nome: "João Teste"
  - Verificar auto-sugestão de username: `joao_teste`
  - Alterar username manualmente se necessário
  - Verificar badge de disponibilidade
  - Salvar perfil
  - **Resultado esperado:** Perfil criado com username único

- [ ] **Validar username reservado**
  - Tentar criar com username: `admin`, `root`, `system`
  - **Resultado esperado:** Badge vermelho "Reservado pelo sistema"

### Edição de Username
- [ ] **Editar username existente**
  - Acessar: `/perfil/editar/:id`
  - Alterar username de `joao_teste` para `joao_teste_novo`
  - **Resultado esperado:**
    - Aviso amarelo persistente aparece
    - Comparação: `/u/joao_teste` → `/u/joao_teste_novo`
    - Mensagem: "links antigos podem parar de funcionar"
    - Menção a: "QR Code, cartão ou materiais"

- [ ] **Confirmar mudança de username**
  - Clicar em "Salvar"
  - **Resultado esperado:** Dialog de confirmação abre
  - Título: "Confirmar alteração de nome de usuário"
  - Texto: "Links antigos podem deixar de funcionar..."
  - Clicar em "Confirmar alteração"
  - **Resultado esperado:** Save executado, username atualizado

- [ ] **Validar cooldown**
  - Tentar alterar username novamente
  - **Resultado esperado:** Bloqueio por cooldown (30 dias)

### Página Pública Profile
- [ ] **Acessar página pública por username**
  - URL: `/u/:username`
  - Exemplo: `/u/joao_teste_novo`
  - **Resultado esperado:** Página carrega com dados do perfil

- [ ] **Validar que username antigo NÃO redireciona**
  - URL antiga: `/u/joao_teste`
  - **Resultado esperado:** 404 ou "Perfil não encontrado"
  - **IMPORTANTE:** Profile não tem redirect automático

- [ ] **Acessar página pública por handle**
  - URL: `/p/:handle`
  - Exemplo: `/p/joao_teste_novo`
  - **Resultado esperado:** Página carrega (se is_public=true)

---

## 3. Professional (Profissional)

### Criação de Slug
- [ ] **Criar profissional novo**
  - Acessar: `/servicos/cadastrar`
  - Preencher nome: "João Eletricista Teste"
  - Verificar auto-sugestão de slug: `joao-eletricista-teste`
  - Alterar slug manualmente se necessário
  - Verificar badge de disponibilidade
  - Salvar profissional
  - **Resultado esperado:** Profissional criado com slug único

### Edição de Slug
- [ ] **Editar slug existente**
  - Acessar: `/servicos/editar/:id`
  - Alterar slug de `joao-eletricista-teste` para `joao-eletricista-novo`
  - **Resultado esperado:**
    - Aviso amarelo persistente aparece
    - Comparação: link antigo → novo link
    - Mensagem: "links antigos podem parar de funcionar"
    - Menção a: "cartões, anúncios, QR Codes"

- [ ] **Confirmar mudança de slug**
  - Clicar em "Salvar Alterações"
  - **Resultado esperado:** Dialog de confirmação abre
  - Título: "Confirmar alteração de link público"
  - Texto: "Links antigos podem deixar de funcionar..."
  - Clicar em "Confirmar alteração"
  - **Resultado esperado:** Save executado, slug atualizado

- [ ] **Validar cooldown**
  - Tentar alterar slug novamente
  - **Resultado esperado:** Bloqueio por cooldown

### Página Pública Professional
- [ ] **Acessar página pública**
  - URL: `/profissionais/:uf/:cidade/:slug`
  - Exemplo: `/profissionais/ba/salvador/joao-eletricista-novo`
  - **Resultado esperado:** Página carrega com dados do profissional

- [ ] **Validar que slug antigo NÃO redireciona**
  - URL antiga: `/profissionais/ba/salvador/joao-eletricista-teste`
  - **Resultado esperado:** 404 ou "Profissional não encontrado"
  - **IMPORTANTE:** Professional não tem redirect nesta fase

---

## 4. Histórico de Mudanças

### Business
- [ ] **Verificar histórico de slug**
  - Acessar: `/empresas/editar/:id`
  - Clicar em "Ver histórico" (se disponível)
  - **Resultado esperado:** Lista de slugs anteriores com datas

### Profile
- [ ] **Verificar histórico de username**
  - Acessar: `/perfil/editar/:id`
  - **Resultado esperado:** Histórico não é mostrado (por design)

### Professional
- [ ] **Verificar histórico de slug**
  - Acessar: `/servicos/editar/:id`
  - **Resultado esperado:** Histórico não é mostrado (por design)

---

## 5. Avisos e Dialogs

### Avisos Persistentes
- [ ] **Business: aviso azul**
  - Cor: border-blue-200, bg-blue-50
  - Ícone: Info (i)
  - Mensagem correta sobre redirect

- [ ] **Profile: aviso amarelo**
  - Cor: border-amber-200, bg-amber-50
  - Ícone: AlertTriangle (!)
  - Mensagem correta sobre quebra de links

- [ ] **Professional: aviso amarelo**
  - Cor: border-amber-200, bg-amber-50
  - Ícone: AlertTriangle (!)
  - Mensagem correta sobre quebra de links

### Dialogs de Confirmação
- [ ] **Dialog abre apenas quando há mudança real**
  - Alterar apenas descrição (não slug/username)
  - Clicar em Salvar
  - **Resultado esperado:** Save direto, sem dialog

- [ ] **Dialog não abre em criação**
  - Criar nova entidade
  - **Resultado esperado:** Save direto, sem dialog

- [ ] **ESC fecha dialog**
  - Abrir dialog de confirmação
  - Pressionar ESC
  - **Resultado esperado:** Dialog fecha, save não executado

---

## 6. Validações de Disponibilidade

### Tempo de Resposta
- [ ] **Badge de disponibilidade aparece rápido**
  - Digitar slug/username
  - **Resultado esperado:** Badge aparece em < 500ms

### Estados do Badge
- [ ] **Disponível (verde)**
  - Slug/username único e válido
  - Texto: "Disponível"

- [ ] **Já em uso (vermelho)**
  - Slug/username de outra entidade
  - Texto: "Já está em uso"

- [ ] **Reservado (vermelho)**
  - Slug/username na lista de reservados
  - Texto: "Reservado pelo sistema"

- [ ] **Inválido (vermelho)**
  - Caracteres não permitidos
  - Texto: "Formato inválido"

---

## 7. Casos de Erro

### Erros de Save
- [ ] **Erro de rede**
  - Desconectar internet
  - Tentar salvar
  - **Resultado esperado:** Mensagem de erro clara

- [ ] **Erro de validação**
  - Slug vazio ou inválido
  - **Resultado esperado:** Mensagem de erro antes do save

### Erros de Página Pública
- [ ] **404 tratado**
  - Acessar slug inexistente
  - **Resultado esperado:** Página 404 amigável

- [ ] **Erro de carregamento**
  - Simular erro de API
  - **Resultado esperado:** Mensagem de erro clara

---

## 8. Acessibilidade

### Navegação por Teclado
- [ ] **Tab entre campos**
  - Navegar por Tab
  - **Resultado esperado:** Foco visível em todos os campos

- [ ] **Enter em botões**
  - Focar botão e pressionar Enter
  - **Resultado esperado:** Ação executada

### Leitores de Tela
- [ ] **Labels corretos**
  - Todos os campos têm labels
  - Avisos têm role="note"
  - Dialogs têm role="alertdialog"

---

## ✅ Critérios de Aprovação

Para aprovar o rollout, TODOS os itens acima devem estar:
- ✅ Funcionando conforme esperado
- ✅ Sem erros de console
- ✅ Sem erros de rede inesperados
- ✅ Performance aceitável (< 500ms para validações)
- ✅ Acessibilidade funcional

---

## 📝 Registro de Validação

**Data:** _____________
**Validado por:** _____________
**Ambiente:** [ ] Staging [ ] Produção
**Status:** [ ] Aprovado [ ] Reprovado [ ] Pendente

**Observações:**
_____________________________________________
_____________________________________________
_____________________________________________

**Itens com problema:**
_____________________________________________
_____________________________________________
_____________________________________________
