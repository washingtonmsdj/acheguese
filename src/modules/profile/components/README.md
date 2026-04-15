# Profile Components

Componentes React para a página de perfil do usuário.

## 📦 Componentes Disponíveis

### ProfileSidebar

Sidebar principal com informações do perfil e navegação.

**Props:**

```typescript
interface ProfileSidebarProps {
  profile: Profile;
  stats: ProfileStats;
  roles: string[];
  activeSection: ProfileSection;
  dark: boolean;
  avatarUploading: boolean;
  onSectionChange: (section: ProfileSection) => void;
  onAvatarChange: (file: File) => void;
  onThemeToggle: () => void;
  onDownloadData: () => void;
  onViewData: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onLogout: () => void;
}
```

**Uso:**

```tsx
<ProfileSidebar
  profile={profile}
  stats={stats}
  roles={roles}
  activeSection="perfil"
  dark={false}
  avatarUploading={false}
  onSectionChange={setActiveSection}
  onAvatarChange={handleAvatarChange}
  onThemeToggle={handleThemeToggle}
  onDownloadData={() => setDownloadOpen(true)}
  onViewData={() => setViewOpen(true)}
  onDeactivate={() => setDeactivateOpen(true)}
  onDelete={() => setDeleteOpen(true)}
  onLogout={handleLogout}
/>
```

---

### GamificationCard

Card de gamificação com progresso e conquistas.

**Props:**

```typescript
interface GamificationCardProps {
  profile: Profile;
  onViewRanking: () => void;
}
```

**Uso:**

```tsx
<GamificationCard
  profile={profile}
  onViewRanking={() => navigate("/ranking")}
/>
```

---

### EditProfileForm

Formulário de edição de perfil.

**Props:**

```typescript
interface EditProfileFormProps {
  editData: ProfileEditData;
  loading: boolean;
  onFieldChange: (field: keyof ProfileEditData, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}
```

**Uso:**

```tsx
<EditProfileForm
  editData={editData}
  loading={loading}
  onFieldChange={updateField}
  onSave={saveProfile}
  onCancel={() => setActiveSection("perfil")}
/>
```

---

### ChangePasswordForm

Formulário de alteração de senha.

**Props:**

```typescript
interface ChangePasswordFormProps {
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  loading: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
  onCancel: () => void;
}
```

**Uso:**

```tsx
<ChangePasswordForm
  newPassword={newPassword}
  confirmPassword={confirmPassword}
  showPassword={showPassword}
  loading={loading}
  onNewPasswordChange={setNewPassword}
  onConfirmPasswordChange={setConfirmPassword}
  onToggleShow={() => setShowPassword(!showPassword)}
  onSave={changePassword}
  onCancel={() => setActiveSection("perfil")}
/>
```

---

### BusinessList

Lista de empresas do usuário.

**Props:**

```typescript
interface BusinessListProps {
  businesses: Business[];
  onBusinessClick: (business: Business) => void;
  onEditClick: (e: React.MouseEvent, business: Business) => void;
  onDashboardClick: (e: React.MouseEvent, businessId: string) => void;
  onCreateNew: () => void;
}
```

**Uso:**

```tsx
<BusinessList
  businesses={myBusinesses}
  onBusinessClick={handleBusinessClick}
  onEditClick={handleEditBusiness}
  onDashboardClick={handleDashboardBusiness}
  onCreateNew={() => navigate("/empresas")}
/>
```

---

### FavoritesList

Lista de favoritos do usuário.

**Props:**

```typescript
interface FavoritesListProps {
  favorites: Business[];
  loading: boolean;
  onBusinessClick: (business: Business) => void;
  onExplore: () => void;
}
```

**Uso:**

```tsx
<FavoritesList
  favorites={favorites}
  loading={loading}
  onBusinessClick={handleBusinessClick}
  onExplore={() => navigate("/empresas")}
/>
```

---

### DataManagementDialogs

Dialogs de gerenciamento de dados.

**Props:**

```typescript
interface DataManagementDialogsProps {
  profile: Profile | null;
  stats: ProfileStats;
  businesses: Business[];
  userEmail?: string;
  downloadOpen: boolean;
  viewOpen: boolean;
  deactivateOpen: boolean;
  deleteOpen: boolean;
  deleteConfirm: string;
  onDownloadOpenChange: (open: boolean) => void;
  onViewOpenChange: (open: boolean) => void;
  onDeactivateOpenChange: (open: boolean) => void;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirmChange: (value: string) => void;
  onDownload: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}
```

**Uso:**

```tsx
<DataManagementDialogs
  profile={profile}
  stats={stats}
  businesses={myBusinesses}
  userEmail={user?.email}
  downloadOpen={downloadOpen}
  viewOpen={viewOpen}
  deactivateOpen={deactivateOpen}
  deleteOpen={deleteOpen}
  deleteConfirm={deleteConfirm}
  onDownloadOpenChange={setDownloadOpen}
  onViewOpenChange={setViewOpen}
  onDeactivateOpenChange={setDeactivateOpen}
  onDeleteOpenChange={setDeleteOpen}
  onDeleteConfirmChange={setDeleteConfirm}
  onDownload={handleDownloadData}
  onDeactivate={handleDeactivateAccount}
  onDelete={handleDeleteAccount}
/>
```

---

## 🎨 Padrões de Design

### Composition

Todos os componentes seguem o padrão de composição, recebendo dados e callbacks via props.

### Controlled Components

Formulários são controlados, com estado gerenciado pelo componente pai.

### Separation of Concerns

- Componentes focam apenas em UI
- Lógica de negócio nos hooks
- Tipos definidos em `@/types/profile`

---

## 📚 Documentação Adicional

- [Documentação Completa](../../../REFATORACAO_PERFIL_AAA.md)
- [Guia de Migração](../../../GUIA_MIGRACAO_PERFIL_V2_V3.md)
- [Types](../../types/profile.ts)
- [Hooks](../../hooks/)
