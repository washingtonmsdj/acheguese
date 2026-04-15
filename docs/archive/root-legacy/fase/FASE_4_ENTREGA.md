# FASE 4: HOOKS E SESSÃO - ENTREGA

**Data**: 2026-03-27 11:25  
**Status**: COMPLETA  
**Fonte**: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0

---

## OBJETIVO

Adaptar sistema de sessão para multi-perfil real, criando hooks e context para gerenciar perfil ativo e lista de perfis do usuário.

---

## ENTREGAS

### Hooks Criados

✅ **useProfiles** (`useProfiles.ts`)
- Lista todos os perfis do usuário autenticado
- Carrega automaticamente ao montar
- Fornece `refetch()` para recarregar

✅ **useActiveProfile** (`useActiveProfile.ts`)
- Gerencia perfil ativo do usuário
- Armazena em localStorage
- Fornece `switchProfile()` para trocar
- Usa personal como padrão
- Sincroniza com lista de perfis

✅ **useProfileMembers** (`useProfileMembers.ts`)
- Lista membros de um perfil
- Adiciona/remove membros
- Atualiza roles
- Recarrega automaticamente após operações

✅ **useProfileLinks** (`useProfileLinks.ts`)
- Lista vínculos de um perfil
- Cria/atualiza/deleta links
- Reordena links
- Recarrega automaticamente após operações

### Context Criado

✅ **MultiProfileContext** (`MultiProfileContext.tsx`)
- Provider para perfil ativo
- Gerencia lista de perfis
- Sincroniza com localStorage
- Fornece `switchProfile()` global

---

## ARQUIVOS CRIADOS

```
src/core/profiles/
├── hooks/
│   ├── useProfiles.ts              # Listar perfis
│   ├── useActiveProfile.ts         # Perfil ativo
│   ├── useProfileMembers.ts        # Gestão de membros
│   ├── useProfileLinks.ts          # Gestão de vínculos
│   └── index.ts                    # Export atualizado
└── contexts/
    └── MultiProfileContext.tsx     # Context de perfil ativo
```

---

## PADRÕES DE USO

### Hook useProfiles
```typescript
import { useProfiles } from '@/core/profiles/hooks';

function MyComponent() {
  const { profiles, loading, error, refetch } = useProfiles();
  
  return (
    <div>
      {profiles.map(profile => (
        <div key={profile.id}>{profile.display_name}</div>
      ))}
    </div>
  );
}
```

### Hook useActiveProfile
```typescript
import { useActiveProfile } from '@/core/profiles/hooks';

function MyComponent() {
  const { activeProfile, allProfiles, switchProfile } = useActiveProfile();
  
  const handleSwitch = async (profileId: string) => {
    const success = await switchProfile(profileId);
    if (success) {
      console.log('Profile switched!');
    }
  };
  
  return (
    <div>
      <h1>{activeProfile?.display_name}</h1>
      <select onChange={(e) => handleSwitch(e.target.value)}>
        {allProfiles.map(p => (
          <option key={p.id} value={p.id}>{p.display_name}</option>
        ))}
      </select>
    </div>
  );
}
```

### Context MultiProfileContext
```typescript
import { MultiProfileProvider, useMultiProfileContext } from '@/core/profiles/contexts/MultiProfileContext';

// No App.tsx
function App() {
  return (
    <MultiProfileProvider>
      <YourApp />
    </MultiProfileProvider>
  );
}

// Em qualquer componente
function MyComponent() {
  const { activeProfile, switchProfile } = useMultiProfileContext();
  
  return <div>{activeProfile?.display_name}</div>;
}
```

### Hook useProfileMembers
```typescript
import { useProfileMembers } from '@/core/profiles/hooks';

function MembersManager({ profileId }: { profileId: string }) {
  const { members, addMember, removeMember, updateRole } = useProfileMembers(profileId);
  
  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          {member.user_id} - {member.role}
          <button onClick={() => removeMember(member.user_id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

---

## INTEGRAÇÃO COM SESSÃO

### Estratégia de Migração

**Fase 4 (Atual)**:
- Hooks novos criados em paralelo
- Context novo criado
- Código legado mantido funcionando

**Fase 8 (Limpeza)**:
- Migrar SessionContext para usar MultiProfileContext
- Remover código legado
- Unificar em um único sistema

### Compatibilidade

Os novos hooks são independentes e não quebram código existente. Podem ser usados imediatamente em componentes novos.

---

## ARMAZENAMENTO

### localStorage
- Chave: `active_profile_id`
- Valor: UUID do perfil ativo
- Sincronizado automaticamente

### Fallback
- Se não houver perfil salvo, usa personal
- Se não houver personal, usa primeiro perfil
- Se não houver perfis, retorna null

---

## PRÓXIMOS PASSOS

### Fase 5: Rotas Públicas
- Implementar `/p/:handle`
- Páginas de perfil por tipo
- Usar `getPublicProfileByHandle()` dos services
- Usar `getPublicProfileLinks()` para vínculos

### Fase 6: Privacidade UI
- Componente de configurações de privacidade
- Usar `updateProfile()` para salvar settings
- UI de gestão de links
- Usar hooks `useProfileLinks` e `useProfileMembers`

---

## CRITÉRIO DE PRONTO

- [x] 4 hooks criados
- [x] 1 context criado
- [x] Perfil ativo gerenciado
- [x] Troca de perfil funciona
- [x] localStorage sincronizado
- [x] Compatibilidade com código legado
- [x] Documentação inline completa

---

**Fase 4 concluída em**: 2026-03-27 11:25
