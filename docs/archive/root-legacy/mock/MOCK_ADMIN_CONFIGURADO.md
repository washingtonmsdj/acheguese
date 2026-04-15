# ✅ Permissões de Admin Configuradas no Modo MOCK

## O que foi feito

Configurei o usuário mock (`mock-user-123`) com permissões de **admin** no sistema de mock.

### Alteração realizada:

**Arquivo:** `src/integrations/supabase/mockData.ts`

```typescript
export const mockUserRoles = [
  {
    id: "role-1",
    user_id: "mock-user-123",
    role: "admin", // ✅ Agora é admin
    is_active: true,
    granted_at: "2024-01-15T10:30:00.000Z",
    granted_by: null,
  },
  {
    id: "role-2",
    user_id: "mock-user-123",
    role: "user", // ✅ Também mantém role de usuário
    is_active: true,
    granted_at: "2024-01-15T10:30:00.000Z",
    granted_by: null,
  },
];
```

---

## Como testar

### 1. Recarregue a aplicação
```bash
# Se estiver rodando, pare e reinicie
npm run dev
```

### 2. Acesse áreas administrativas

Agora você deve ter acesso a:

#### ✅ Painel Admin Principal
```
URL: /admin
```

#### ✅ Painel de Conteúdo Territorial
```
URL: /admin/territory-content
```

#### ✅ Outras páginas admin
- `/admin/highlights` - Gerenciar destaques
- `/admin/ssot` - Visualizar SSOT
- `/admin/motoristas` - Gerenciar motoristas
- `/admin/mensagens` - Gerenciar mensagens
- `/admin/reports-passageiros` - Reports de passageiros

### 3. Verificar permissões

O sistema agora deve reconhecer você como admin:

```typescript
// Em qualquer componente
const { user } = useAuth();
const isAdmin = await AuthService.isAdmin(user.id);
// Deve retornar: true
```

---

## Dados do usuário mock

### Credenciais
- **Email:** `joao.silva@mock.com`
- **User ID:** `mock-user-123`
- **Profile ID:** `mock-profile-123`

### Roles
- ✅ `admin` - Acesso total ao sistema
- ✅ `user` - Permissões básicas de usuário

### Perfis disponíveis
1. **Perfil Pessoal** (`mock-profile-123`)
   - Tipo: `personal`
   - Nome: João Silva
   - Bairro: Nordeste de Amaralina

2. **Perfil Business** (`mock-business-profile-456`)
   - Tipo: `business`
   - Nome: Padaria do João

---

## Verificação de funcionamento

### Console do navegador

Você deve ver nos logs:
```
🎭 Modo MOCK ativado - Usando dados simulados
💡 Para usar Supabase real, configure .env.local com suas credenciais
```

### Verificar role no console

Abra o console do navegador e execute:
```javascript
// Verificar roles do usuário
const { data } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', 'mock-user-123');
console.log('Roles:', data);
```

Deve retornar:
```javascript
[
  { id: "role-1", user_id: "mock-user-123", role: "admin", ... },
  { id: "role-2", user_id: "mock-user-123", role: "user", ... }
]
```

---

## Funcionalidades admin disponíveis

Com permissões de admin, você pode:

### ✅ Gerenciamento de Conteúdo
- Editar conteúdo territorial gerado por IA
- Regenerar conteúdo com IA
- Gerenciar destaques editoriais
- Moderar posts e comentários

### ✅ Gerenciamento de Usuários
- Ver lista de usuários
- Banir/suspender usuários
- Verificar usuários
- Gerenciar roles

### ✅ Gerenciamento de Negócios
- Ver todos os negócios
- Editar qualquer negócio
- Aprovar/rejeitar negócios

### ✅ Moderação
- Ver reports pendentes
- Aprovar/rejeitar denúncias
- Remover conteúdo
- Avisar usuários

### ✅ Analytics
- Ver estatísticas do sistema
- Monitorar atividades
- Gerar relatórios

---

## Troubleshooting

### Ainda aparece "Sem permissão de admin"?

1. **Limpe o cache do navegador**
   ```
   Ctrl + Shift + Delete (Windows/Linux)
   Cmd + Shift + Delete (Mac)
   ```

2. **Limpe o cache do AuthService**
   ```javascript
   // No console do navegador
   AuthService.clearAdminCache();
   ```

3. **Recarregue a página**
   ```
   Ctrl + R (Windows/Linux)
   Cmd + R (Mac)
   ```

4. **Verifique se está em modo mock**
   - Deve aparecer no console: "🎭 Modo MOCK ativado"
   - Se não aparecer, verifique `.env.local`

### Erro "AuthService is not defined"

Execute no console:
```javascript
import { AuthService } from '@/core/auth/services/AuthService';
await AuthService.isAdmin('mock-user-123');
```

### Página admin redireciona para home

Verifique se o componente `AdminLayout` está verificando corretamente:
```typescript
// src/modules/admin/pages/AdminLayout.tsx
// Deve usar AuthService.isAdmin(user.id)
```

---

## Modo de desenvolvimento vs produção

### Modo MOCK (atual)
- ✅ Não precisa de Supabase configurado
- ✅ Dados simulados em memória
- ✅ Perfeito para desenvolvimento
- ❌ Dados não persistem (recarregar = reset)
- ❌ Edge Functions não funcionam

### Modo REAL (produção)
Para usar Supabase real, configure `.env.local`:
```env
VITE_SUPABASE_URL=sua-url-aqui
VITE_SUPABASE_ANON_KEY=sua-key-aqui
```

---

## Próximos passos

### Para testar o sistema de Territory AI Content:

1. **Acesse o painel admin**
   ```
   /admin/territory-content
   ```

2. **Configure um território**
   - Slug: `nordeste-de-amaralina`
   - Nome: `Nordeste de Amaralina`

3. **Tente editar os campos**
   - Descrição
   - História
   - Demografia
   - Eventos

4. **Salve as alterações**
   - Clique em "Salvar"
   - Verifique se aparece mensagem de sucesso

⚠️ **Nota:** No modo MOCK, a Edge Function de IA não funciona. O botão "Regenerar com IA" não vai funcionar até configurar Supabase real.

---

## Resumo

✅ **Usuário mock agora é admin**  
✅ **Acesso a todas as páginas admin**  
✅ **Permissões completas no sistema**  
✅ **Pronto para testar funcionalidades admin**

**Próximo passo:** Recarregue a aplicação e acesse `/admin/territory-content`

---

**Data:** 25/03/2026  
**Alteração:** Adicionada role "admin" ao usuário mock  
**Arquivo modificado:** `src/integrations/supabase/mockData.ts`
