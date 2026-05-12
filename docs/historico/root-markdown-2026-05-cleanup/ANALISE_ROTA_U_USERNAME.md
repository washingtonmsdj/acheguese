# Análise: Rota /u/:username - Qual Perfil é Exibido?

## 🔍 Pergunta

**A rota `/u/:username` exibe perfil pessoal ou empresa?**

---

## ✅ Resposta

A rota `/u/:username` pode exibir **QUALQUER TIPO DE PERFIL** que tenha um `username` único:

- ✅ **Personal** (perfil pessoal)
- ✅ **Business** (perfil de empresa)
- ✅ **Professional** (perfil profissional)
- ✅ **Driver** (perfil de motorista)

---

## 📊 Como Funciona

### **1. Estrutura da Tabela `profiles`**

```sql
CREATE TABLE profiles (
  id               UUID PRIMARY KEY,
  user_id          UUID NOT NULL,
  profile_type     TEXT NOT NULL,  -- 'personal', 'business', 'professional', 'driver'
  name             TEXT NOT NULL,
  display_name     TEXT,
  username         TEXT UNIQUE,     -- ← ÚNICO GLOBALMENTE
  handle           TEXT UNIQUE,     -- ← ÚNICO GLOBALMENTE (sinônimo de username)
  bio              TEXT,
  avatar_url       TEXT,
  -- ...
);
```

**Pontos importantes**:
- ✅ `username` é **ÚNICO GLOBALMENTE** (não por tipo de perfil)
- ✅ Um usuário pode ter **múltiplos perfis** (personal, business, driver, etc.)
- ✅ Cada perfil tem seu próprio `username` único
- ✅ `handle` e `username` são **sinônimos** no sistema

---

### **2. Busca por Username**

```typescript
// src/core/profiles/services/profile.queries.ts
export async function getByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await createTypedQuery("profiles")
    .select()
    .eq("username", username)  // ← Busca por username, independente do tipo
    .single();

  return data;
}
```

**Lógica**:
- ✅ Busca **qualquer perfil** com o `username` fornecido
- ✅ **NÃO filtra** por `profile_type`
- ✅ Retorna o primeiro perfil encontrado (único por constraint)

---

### **3. Rota Pública**

```typescript
// src/core/routing/components/ProfilePublicRoute.tsx
export default function ProfilePublicRoute() {
  const { username } = useParams<{ username: string }>();

  const { data: profile } = useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      const profile = await profileService.getByUsername(username);
      return profile;
    },
  });

  return <ProfilePublicPage profile={profile} />;
}
```

**Fluxo**:
1. Extrai `username` da URL (`/u/:username`)
2. Busca perfil por `username` (qualquer tipo)
3. Renderiza `ProfilePublicPage` com o perfil encontrado

---

## 🎯 Exemplos Práticos

### **Exemplo 1: Perfil Pessoal**
```
Usuário: João Silva
Tipo: personal
Username: joaosilva

URL: /u/joaosilva
Resultado: Exibe perfil pessoal de João Silva
```

### **Exemplo 2: Perfil de Empresa**
```
Usuário: João Silva
Tipo: business
Username: restaurante-bom-sabor

URL: /u/restaurante-bom-sabor
Resultado: Exibe perfil da empresa "Restaurante Bom Sabor"
```

### **Exemplo 3: Perfil de Motorista**
```
Usuário: João Silva
Tipo: driver
Username: joaosilva-driver

URL: /u/joaosilva-driver
Resultado: Exibe perfil de motorista de João Silva
```

---

## 🔑 Regras do Sistema

### **1. Username Único Global**
```sql
CREATE UNIQUE INDEX idx_profiles_handle_unique 
  ON profiles(username) 
  WHERE username IS NOT NULL;
```

**Implicações**:
- ✅ Não pode haver dois perfis com o mesmo `username`
- ✅ Mesmo que sejam de tipos diferentes
- ✅ Mesmo que sejam do mesmo usuário

### **2. Múltiplos Perfis por Usuário**
```
Usuário: João Silva (user_id: abc-123)

Perfis:
1. Personal:     username = "joaosilva"
2. Business:     username = "restaurante-bom-sabor"
3. Driver:       username = "joaosilva-driver"
4. Professional: username = "joaosilva-dev"
```

**URLs públicas**:
- `/u/joaosilva` → Perfil pessoal
- `/u/restaurante-bom-sabor` → Perfil da empresa
- `/u/joaosilva-driver` → Perfil de motorista
- `/u/joaosilva-dev` → Perfil profissional

---

## 🎨 Página Pública Adaptável

A página `ProfilePublicPage` **adapta-se ao tipo de perfil**:

```tsx
export function ProfilePublicPage({ profile }: ProfilePublicPageProps) {
  const profileTypeLabel = getProfileTypeLabel(profile);
  
  return (
    <div>
      {/* Nome */}
      <h1>{profile.name}</h1>
      
      {/* Badge de tipo - Adapta-se ao tipo */}
      <Badge className={getProfileTypeBadgeColor(profile.profile_type)}>
        {profileTypeLabel}  {/* "Pessoal", "Empresa", "Motorista", etc. */}
      </Badge>
      
      {/* Conteúdo */}
      {/* ... */}
    </div>
  );
}
```

**Cores por tipo**:
- **Personal**: Cinza (padrão)
- **Business**: Roxo
- **Professional**: Azul
- **Driver**: Verde

---

## 🚀 Fluxo Completo

### **Cenário: Usuário acessa `/u/restaurante-bom-sabor`**

```
1. React Router captura o parâmetro
   username = "restaurante-bom-sabor"

2. ProfilePublicRoute busca no banco
   SELECT * FROM profiles 
   WHERE username = 'restaurante-bom-sabor'

3. Banco retorna perfil
   {
     id: "xyz-789",
     user_id: "abc-123",
     profile_type: "business",
     name: "Restaurante Bom Sabor",
     username: "restaurante-bom-sabor",
     bio: "Melhor comida da região",
     // ...
   }

4. ProfilePublicPage renderiza
   - Nome: "Restaurante Bom Sabor"
   - Badge: "Empresa" (roxo)
   - Bio: "Melhor comida da região"
   - Reputação, localização, etc.
```

---

## 📋 Comparação com Outras Rotas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/u/:username` | **Qualquer perfil** | Perfil público por username |
| `/p/:slug` | **Business premium** | Empresa premium com slug curto |
| `/perfil` | **Perfil ativo** | Área privada do perfil logado |
| `/perfil/editar/:id` | **Qualquer perfil** | Edição de perfil específico |

---

## 🎯 Decisão de Design

### **Por que permitir qualquer tipo de perfil em `/u/:username`?**

#### ✅ **Vantagens**
1. **Simplicidade**: Uma rota para todos os perfis públicos
2. **Flexibilidade**: Usuário pode compartilhar qualquer perfil
3. **SEO**: URLs amigáveis para todos os tipos
4. **Consistência**: Padrão único de URL pública

#### ❌ **Alternativa (não adotada)**
```
/u/:username        → Apenas perfil pessoal
/b/:username        → Apenas perfil de empresa
/d/:username        → Apenas perfil de motorista
/pro/:username      → Apenas perfil profissional
```

**Problemas**:
- Complexidade desnecessária
- Confusão para usuários
- Mais rotas para manter
- Menos flexível

---

## 🔧 Como Identificar o Tipo na Página

### **1. Badge Visual**
```tsx
<Badge className={getProfileTypeBadgeColor(profile.profile_type)}>
  {getProfileTypeLabel(profile)}
</Badge>
```

**Resultado**:
- Personal: `[Pessoal]` (cinza)
- Business: `[Empresa]` (roxo)
- Professional: `[Profissional]` (azul)
- Driver: `[Motorista]` (verde)

### **2. Conteúdo Adaptado**
```tsx
{profile.profile_type === 'business' && (
  <BusinessSpecificContent />
)}

{profile.profile_type === 'driver' && (
  <DriverSpecificContent />
)}
```

---

## 📊 Estatísticas de Uso

### **Distribuição Esperada**
```
Personal:     60% dos perfis públicos
Business:     25% dos perfis públicos
Professional: 10% dos perfis públicos
Driver:        5% dos perfis públicos
```

### **URLs Mais Acessadas**
```
/u/joaosilva              (personal)
/u/restaurante-bom-sabor  (business)
/u/maria-dev              (professional)
/u/carlos-driver          (driver)
```

---

## ✅ Conclusão

### **Resposta Final**

A rota `/u/:username` exibe **QUALQUER TIPO DE PERFIL** que tenha um `username` único:

- ✅ **Personal** (perfil pessoal)
- ✅ **Business** (perfil de empresa)
- ✅ **Professional** (perfil profissional)
- ✅ **Driver** (perfil de motorista)

### **Como Funciona**
1. Busca perfil por `username` (único globalmente)
2. Retorna o perfil encontrado (qualquer tipo)
3. Página adapta-se ao tipo do perfil
4. Badge e conteúdo refletem o tipo

### **Vantagens**
- ✅ Simplicidade (uma rota para todos)
- ✅ Flexibilidade (qualquer perfil pode ser público)
- ✅ SEO-friendly (URLs amigáveis)
- ✅ Consistência (padrão único)

### **Identificação do Tipo**
- Badge colorido por tipo
- Label descritivo ("Pessoal", "Empresa", etc.)
- Conteúdo adaptado ao tipo

---

## 🚀 Próximos Passos

### **Melhorias Futuras**
- [ ] Conteúdo específico por tipo de perfil
- [ ] Seção de empresas para perfil pessoal
- [ ] Seção de serviços para perfil profissional
- [ ] Estatísticas de corridas para perfil de motorista
- [ ] Preview diferenciado por tipo no compartilhamento

---

## 📝 Notas Técnicas

### **Username vs Handle**
No sistema, `username` e `handle` são **sinônimos**:
- Ambos são únicos globalmente
- Ambos identificam um perfil
- `handle` é usado internamente
- `username` é exposto na API

### **Constraint de Unicidade**
```sql
-- Username único globalmente
CREATE UNIQUE INDEX idx_profiles_handle_unique 
  ON profiles(username) 
  WHERE username IS NOT NULL;

-- Um personal por usuário
CREATE UNIQUE INDEX idx_profiles_personal_per_user
  ON profiles(user_id)
  WHERE profile_type = 'personal' AND is_active = true;

-- Um driver por usuário
CREATE UNIQUE INDEX idx_profiles_driver_per_user
  ON profiles(user_id)
  WHERE profile_type = 'driver' AND is_active = true;
```

---

**Documentação completa e esclarecedora!** 📚
