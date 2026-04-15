# 🚀 GUIA RÁPIDO DE USO - MULTI-PERFIL

---

## INICIAR APLICAÇÃO

```bash
npm run dev
```

Acesse: http://localhost:5173

---

## CRIAR PERFIL

### Via UI (Recomendado)
1. Faça login
2. Procure opção "Criar Perfil" ou "Novo Perfil"
3. Escolha o tipo (personal, business, professional, driver)
4. Preencha:
   - Handle (único, ex: `joao-silva`)
   - Nome de exibição
   - Dados específicos do tipo

### Via Service (Programático)

```typescript
import { MultiProfileService } from '@/core/profiles/services/multi-profile';

// Criar perfil personal
const profile = await MultiProfileService.createProfile({
  profile_type: 'personal',
  handle: 'joao-silva',
  display_name: 'João Silva',
  extension_data: {}
});

// Criar perfil business
const business = await MultiProfileService.createProfile({
  profile_type: 'business',
  handle: 'minha-empresa',
  display_name: 'Minha Empresa',
  extension_data: {
    cnpj: '12345678000190',
    business_name: 'Minha Empresa LTDA',
    category: 'Tecnologia'
  }
});
```

---

## ACESSAR PERFIL PÚBLICO

### URL
```
https://seu-dominio.com/p/joao-silva
```

### O que aparece
- Nome de exibição
- Tipo de perfil
- Dados da extensão (se business/professional/driver)
- Vínculos públicos
- Estatísticas (se privacidade permitir)

---

## CONFIGURAR PRIVACIDADE

### Acessar
```
https://seu-dominio.com/perfil/configuracoes
```

### Tab: Privacidade
6 toggles disponíveis:
- Mostrar email
- Mostrar telefone
- Mostrar localização
- Mostrar estatísticas
- Mostrar avaliações
- Mostrar atividade

### Tab: Vínculos
Adicionar links públicos:
- Website
- Instagram
- Facebook
- LinkedIn
- Twitter
- WhatsApp
- Outros

Cada vínculo pode ser:
- Público (aparece em `/p/:handle`)
- Privado (não aparece)

### Tab: Membros
Gerenciar equipe (apenas business/professional):
- Adicionar membros (por email)
- Definir roles (owner, manager, member)
- Remover membros

---

## TROCAR PERFIL ATIVO

### Via UI
Use o componente `MultiProfileSwitcher` (geralmente no header)

### Via Hook
```typescript
import { useActiveProfile } from '@/core/profiles/hooks/useActiveProfile';

function MyComponent() {
  const { activeProfile, switchProfile } = useActiveProfile();
  
  // Trocar para outro perfil
  await switchProfile('outro-profile-id');
}
```

---

## GESTÃO DE MEMBROS

### Adicionar Membro
```typescript
import { useProfileMembers } from '@/core/profiles/hooks/useProfileMembers';

const { addMember } = useProfileMembers(profileId);

await addMember({
  member_profile_id: 'uuid-do-perfil-membro',
  role: 'manager' // ou 'member'
});
```

### Roles
- **owner**: Controle total (apenas 1 por perfil)
- **manager**: Pode editar perfil e gerenciar membros
- **member**: Pode visualizar apenas

---

## GESTÃO DE VÍNCULOS

### Adicionar Vínculo
```typescript
import { useProfileLinks } from '@/core/profiles/hooks/useProfileLinks';

const { createLink } = useProfileLinks(profileId);

await createLink({
  link_type: 'website',
  url: 'https://meusite.com',
  label: 'Meu Site',
  is_public: true
});
```

### Tipos de Vínculo
- website
- instagram
- facebook
- linkedin
- twitter
- whatsapp
- other

---

## ADMIN FUNCTIONS

### Verificar Perfil
```typescript
import { AdminService } from '@/core/profiles/services/multi-profile';

await AdminService.verifyProfile(profileId, adminUserId);
```

### Suspender Perfil
```typescript
await AdminService.suspendProfile(
  profileId,
  adminUserId,
  'Violação de termos',
  7 // dias
);
```

**NOTA**: Requer que o usuário esteja cadastrado em `admin_users`

---

## QUERIES ÚTEIS

### Ver Perfis
```typescript
import { MultiProfileService } from '@/core/profiles/services/multi-profile';

// Listar meus perfis
const profiles = await MultiProfileService.listProfiles();

// Buscar por handle
const profile = await MultiProfileService.getProfileByHandle('joao-silva');

// Ver perfil público
const publicProfile = await MultiProfileService.getPublicProfile('joao-silva');
```

### Ver Extensões
```typescript
import { BusinessService } from '@/core/profiles/services/multi-profile';

// Dados business
const business = await BusinessService.getBusinessData(profileId);

// Atualizar business
await BusinessService.updateBusinessData(profileId, {
  category: 'Nova Categoria',
  opening_hours: { seg: '08:00-18:00' }
});
```

---

## PERFIS EXISTENTES

Atualmente há 4 perfis personal no banco:
- @personal-16f9f5da
- @personal-2e5477c5
- @personal-fd104d83
- @personal-6e83f499

Você pode acessá-los em:
```
http://localhost:5173/p/personal-16f9f5da
```

---

## TROUBLESHOOTING

### Perfil não aparece na rota pública
- Verifique se `is_suspended = false`
- Verifique se o handle está correto
- Perfis privados retornam 404

### Não consigo criar perfil
- Verifique se está autenticado
- Handle deve ser único
- Handle deve ter formato válido (letras, números, hífen)

### Não consigo adicionar membro
- Apenas owner pode adicionar membros
- Perfil do membro deve existir
- Perfil deve ser business ou professional

---

## COMANDOS ÚTEIS

```bash
# Ver perfis
npx tsx scripts/inspect-profiles.ts

# Validar sistema
npx tsx scripts/validate-implementation.ts

# Iniciar dev
npm run dev

# Build
npm run build
```

---

**Sistema pronto para uso. Boa sorte! 🎉**

