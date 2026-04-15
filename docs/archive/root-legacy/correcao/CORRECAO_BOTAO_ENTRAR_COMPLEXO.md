# Correção: Botão "Entrar no Complexo"

**Data**: 2026-03-29  
**Problema**: Usuário não logado batia na tela de login ao clicar em "Entrar no Complexo"  
**Status**: ✅ Corrigido

---

## 🐛 Problema Identificado

### Comportamento Anterior
1. Botão "Entrar no Complexo" na HomePage apontava para `LAUNCH_URLS.community`
2. URL destino: `/comunidade/ba/salvador`
3. Página de comunidade requer autenticação
4. Usuário não logado era redirecionado para `/login`
5. Experiência ruim: usuário clica para "entrar" mas é bloqueado

### Causa Raiz
```typescript
// HomePage.tsx - ANTES
onClick={() => navigate(LAUNCH_URLS.community)}
// Apontava para: /comunidade/ba/salvador (requer auth)
```

---

## ✅ Solução Implementada

### Mudança
Botão "Entrar no Complexo" agora aponta para a **landing page territorial**, que é pública e não requer autenticação.

```typescript
// HomePage.tsx - DEPOIS
onClick={() => navigate(`/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`)}
// Aponta para: /ba/salvador (landing page pública)
```

### Arquitetura de URLs

**Landing Page Territorial** (`/ba/salvador`):
- ✅ Pública (não requer auth)
- ✅ Mostra visão geral do território
- ✅ Exibe módulos disponíveis (empresas, serviços, etc)
- ✅ Permite navegação para módulos específicos
- ✅ Corresponde ao "Início" na sidebar

**Página de Comunidade** (`/comunidade/ba/salvador`):
- ⚠️ Requer autenticação
- ⚠️ Mostra feed de moradores
- ⚠️ Permite postar e comentar
- ⚠️ Acesso restrito a usuários logados

---

## 📝 Arquivos Modificados

### 1. `src/app/pages/HomePage.tsx`

**Mudança 1 - CTA Desktop**:
```typescript
// ANTES
onClick={() => navigate(LAUNCH_URLS.community)}

// DEPOIS
onClick={() => navigate(`/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`)}
```

**Mudança 2 - CTA Mobile**:
```typescript
// ANTES
onClick={() => navigate(LAUNCH_URLS.community)}

// DEPOIS
onClick={() => navigate(`/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`)}
```

---

## 🎯 Fluxo de Navegação Corrigido

### Usuário NÃO Logado
1. Acessa HomePage (`/`)
2. Clica em "Entrar no Complexo"
3. ✅ Vai para `/ba/salvador` (landing page territorial)
4. ✅ Vê visão geral do território
5. ✅ Pode navegar para empresas, serviços, etc (públicos)
6. Se quiser acessar comunidade:
   - Clica em "Comunidade" na sidebar
   - Vê convite para fazer login
   - Clica em "Entrar / Criar conta"
   - Faz login
   - Acessa comunidade

### Usuário Logado
1. Acessa HomePage (`/`)
2. Clica em "Entrar no Complexo"
3. ✅ Vai para `/ba/salvador` (landing page territorial)
4. ✅ Vê visão geral do território
5. ✅ Pode navegar para qualquer módulo (incluindo comunidade)

---

## 🔍 Validação

### Checklist de Testes

**Usuário não logado**:
- [ ] Clicar em "Entrar no Complexo" (desktop)
- [ ] Deve ir para `/ba/salvador`
- [ ] Não deve mostrar tela de login
- [ ] Deve ver landing page territorial
- [ ] Sidebar deve mostrar "Início" ativo
- [ ] Clicar em "Comunidade" na sidebar
- [ ] Deve ver convite para fazer login

**Usuário logado**:
- [ ] Clicar em "Entrar no Complexo" (desktop)
- [ ] Deve ir para `/ba/salvador`
- [ ] Deve ver landing page territorial
- [ ] Sidebar deve mostrar "Início" ativo
- [ ] Clicar em "Comunidade" na sidebar
- [ ] Deve acessar comunidade diretamente

**Mobile**:
- [ ] Clicar em "Entrar no Complexo" (mobile)
- [ ] Deve ir para `/ba/salvador`
- [ ] Não deve mostrar tela de login
- [ ] Deve ver landing page territorial

---

## 📊 Impacto

### Positivo
- ✅ Usuário não logado não bate mais na tela de login
- ✅ Experiência mais fluida e convidativa
- ✅ Landing page territorial mostra visão geral do território
- ✅ Usuário pode explorar conteúdo público antes de fazer login
- ✅ Alinhado com a arquitetura de "Início" na sidebar

### Sem Impacto Negativo
- ✅ Usuário logado continua tendo acesso a tudo
- ✅ Comunidade continua protegida por autenticação
- ✅ Fluxo de login continua funcionando normalmente

---

## 🎯 Conclusão

Correção simples mas importante para melhorar a experiência do usuário. O botão "Entrar no Complexo" agora leva para a landing page territorial pública, permitindo que usuários não logados explorem o território antes de decidir fazer login.

**Status**: ✅ Implementado e pronto para testes
