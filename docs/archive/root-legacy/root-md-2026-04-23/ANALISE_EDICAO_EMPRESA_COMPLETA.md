# 🔍 Análise Minuciosa: Página/Modal de Editar Empresa

**Data**: 2026-04-23  
**Status**: ⚠️ INCOMPLETA - Faltam campos importantes

---

## 📋 Resumo Executivo

A funcionalidade de edição de empresa existe em **DUAS VERSÕES**:

1. **EditarEmpresaPage** (`/edit-business/:profileId`) - Página completa com wizard de 3 passos
2. **EmpresaEditSheet** - Sheet/modal usado em contextos específicos (admin, header)

**Problemas Identificados:**
- ❌ Campos importantes do schema **NÃO estão sendo editados**
- ❌ Inconsistência entre as duas versões
- ❌ Upload de imagens não funcional na página principal
- ❌ Campos de endereço estruturado não estão disponíveis
- ❌ Campos de empresa (CNPJ, razão social, etc) não estão disponíveis

---

## 🆚 Comparação: Duas Versões de Edição

### 1. EditarEmpresaPage (Página Completa)

**Localização**: `src/modules/business/pages/EditarEmpresaPage.tsx`  
**Rota**: `/edit-business/:profileId`  
**Formato**: Wizard de 3 passos

#### ✅ Campos Disponíveis

**Passo 1 - Informações Básicas:**
- ✅ Nome (`name`)
- ✅ Descrição (`description`)
- ✅ Categoria (`category`)
- ✅ Logo (preview, mas upload não funciona)
- ✅ Slug (via BusinessSlugSection)

**Passo 2 - Contato:**
- ✅ Telefone (`phone`)
- ✅ WhatsApp (`whatsapp`)
- ✅ Email (`email`)
- ✅ Endereço (`address` - campo legado)
- ✅ Horários (`schedules` - mas não salva)
- ✅ Modos de atendimento (`modos_atendimento`)

**Passo 3 - Extras:**
- ✅ Capa/Banner (preview, mas upload não funciona)
- ✅ Website (`website`)
- ✅ Instagram (`instagram`)
- ✅ Facebook (`facebook`)
- ✅ Formas de pagamento (`formas_pagamento`)
- ✅ Especialidades (`especialidades`)
- ✅ Facilidades (`facilidades`)
- ✅ Área de Cobertura (via CoverageSettingsForm)

#### ❌ Campos Faltando

**Dados da Empresa:**
- ❌ Razão social (`legal_name`)
- ❌ CNPJ (`cnpj`)
- ❌ Tipo de empresa (`company_type`: MEI, LTDA, SA, etc)
- ❌ Segmento/Indústria (`industry`)
- ❌ Número de funcionários (`employee_count`)
- ❌ Ano de fundação (`founded_year`)

**Endereço Estruturado:**
- ❌ Rua (`address_street`)
- ❌ Número (`address_number`)
- ❌ Complemento (`address_complement`)
- ❌ CEP (`postal_code`)
- ❌ Cidade (`city`)
- ❌ Estado (`state`)
- ❌ Location ID (`location_id`)
- ❌ Address ID (`address_id`)

**Coordenadas:**
- ❌ Latitude (`latitude`)
- ❌ Longitude (`longitude`)

**Hierarquia de Empresas:**
- ❌ Papel da empresa (`business_role`: standalone, brand_hub, branch)
- ❌ Empresa matriz (`parent_business_id`)
- ❌ É matriz? (`is_headquarters`)
- ❌ Nome da unidade (`unit_name`)

**Horários Estruturados:**
- ❌ Horário de funcionamento estruturado (`horario_funcionamento`)
- Nota: Existe campo `schedules` mas é texto livre, não estruturado

**Recursos:**
- ❌ Tem delivery? (`tem_delivery`)
- ❌ Aceita cartão? (`aceita_cartao`)
- ❌ Aceita PIX? (`aceita_pix`)
- ❌ Pode postar vagas? (`can_post_vagas`)

**Galeria:**
- ❌ Fotos adicionais (`fotos[]`)

**Status:**
- ❌ Status (`status`: active, inactive, pending, suspended)
- ❌ Verificado (`is_verified`)
- ❌ Premium (`is_premium`)

**Subcategoria:**
- ❌ Subcategoria (`subcategoria`)

---

### 2. EmpresaEditSheet (Modal/Sheet)

**Localização**: `src/modules/business/components/EmpresaEditSheet.tsx`  
**Uso**: Admin, BusinessHeader, contextos específicos  
**Formato**: Sheet com scroll

#### ✅ Campos Disponíveis

**Dados Básicos:**
- ✅ Nome (`name`)
- ✅ Categoria (`category`)
- ✅ Descrição (`description`)

**Modos de Atendimento:**
- ✅ Presencial, Delivery, Domicílio, Online

**Endereço:**
- ✅ Endereço (`address` - campo legado)
- ✅ Bairro (`neighborhood`)
- ✅ Latitude (`latitude`)
- ✅ Longitude (`longitude`)

**Contato:**
- ✅ Telefone (`phone`)
- ✅ WhatsApp (`whatsapp`)
- ✅ Email (`email`)
- ✅ Website (`website`)
- ✅ Instagram (`instagram`)
- ✅ Facebook (`facebook`)

**Horários e Serviços:**
- ✅ Horário de funcionamento (`schedule` - texto livre)
- ✅ Horário de fechamento hoje (`schedule_fechamento`)
- ✅ Especialidades (`especialidades`)
- ✅ Formas de pagamento (`formas_pagamento`)
- ✅ Facilidades (`facilidades`)

**Sobre:**
- ✅ Ano de fundação (`ano_fundacao`)

**Imagens:**
- ✅ URL do Logo (`logo_url`)
- ✅ URL da Capa (`banner_url`)

#### ❌ Campos Faltando

Mesmos campos faltando da página, EXCETO:
- ✅ Ano de fundação (presente no sheet, ausente na página)
- ✅ Latitude/Longitude (presente no sheet, ausente na página)
- ✅ Horário de fechamento (presente no sheet, ausente na página)

---

## 🔍 Análise Detalhada dos Problemas

### 1. Upload de Imagens Não Funciona

**EditarEmpresaPage:**
```typescript
// ❌ PROBLEMA: Refs são null, onChange não faz nada
logoRef={null}
onLogoChange={() => {}}

capaRef={null}
onCapaChange={() => {}}
```

**Solução necessária:**
- Implementar refs reais
- Implementar handlers de upload
- Usar `useBusinessImageUpload` hook que já existe

### 2. Campos de Endereço Estruturado Ausentes

O schema suporta endereço estruturado:
```typescript
address_street: string
address_number: string
address_complement: string
postal_code: string (CEP)
city: string
state: string
location_id: UUID
address_id: UUID
```

Mas a UI só tem:
```typescript
address: string (campo legado, texto livre)
```

**Impacto:**
- ❌ Não aproveita o modelo canônico de endereços
- ❌ Não integra com sistema de localização
- ❌ Dificulta busca e filtros por região

### 3. Dados Empresariais Ausentes

Campos importantes para empresas formais:
```typescript
legal_name: string      // Razão social
cnpj: string           // CNPJ
company_type: enum     // MEI, LTDA, SA, EIRELI
industry: string       // Segmento
employee_count: enum   // Faixa de funcionários
```

**Impacto:**
- ❌ Empresas formais não podem cadastrar dados legais
- ❌ Impossível filtrar por porte ou segmento
- ❌ Dados incompletos para integrações B2B

### 4. Hierarquia de Empresas Não Editável

Campos de hierarquia:
```typescript
business_role: 'standalone' | 'brand_hub' | 'branch'
parent_business_id: UUID
is_headquarters: boolean
unit_name: string
```

**Impacto:**
- ❌ Não é possível criar filiais
- ❌ Não é possível vincular unidades a matriz
- ❌ Não é possível gerenciar redes de empresas

### 5. Horários Não Estruturados

Existe campo `horario_funcionamento` estruturado no schema:
```typescript
horario_funcionamento: {
  monday: { open: "08:00", close: "18:00", closed: false },
  tuesday: { open: "08:00", close: "18:00", closed: false },
  // ...
}
```

Mas a UI usa texto livre:
```typescript
schedules: string // "Seg-Sex: 8h-18h"
```

**Impacto:**
- ❌ Não é possível calcular se está aberto/fechado
- ❌ Não é possível mostrar "Fecha às 18:00"
- ❌ Dados não estruturados, difícil de processar

### 6. Inconsistência Entre Versões

| Campo | EditarEmpresaPage | EmpresaEditSheet |
|-------|-------------------|------------------|
| Ano de fundação | ❌ | ✅ |
| Latitude/Longitude | ❌ | ✅ |
| Horário fechamento | ❌ | ✅ |
| Slug | ✅ | ❌ |
| Área de cobertura | ✅ | ❌ |

**Problema:** Usuário tem experiências diferentes dependendo de onde edita.

---

## 📊 Cobertura de Campos

### Schema vs UI

| Categoria | Total Campos | Editáveis | Cobertura |
|-----------|--------------|-----------|-----------|
| **Básicos** | 4 | 4 | ✅ 100% |
| **Empresa** | 6 | 0 | ❌ 0% |
| **Contato** | 6 | 6 | ✅ 100% |
| **Endereço Estruturado** | 8 | 0 | ❌ 0% |
| **Endereço Legado** | 5 | 2 | 🟡 40% |
| **Hierarquia** | 4 | 0 | ❌ 0% |
| **Horários** | 1 | 0 | ❌ 0% |
| **Recursos** | 4 | 0 | ❌ 0% |
| **Redes Sociais** | 3 | 3 | ✅ 100% |
| **Arrays** | 3 | 3 | ✅ 100% |
| **Imagens** | 3 | 0 | ❌ 0% |
| **Status** | 3 | 0 | ❌ 0% |
| **Outros** | 2 | 1 | 🟡 50% |

**Total Geral: 52 campos no schema, 19 editáveis = 36.5% de cobertura**

---

## 🚨 Problemas Críticos

### 1. Upload de Imagens Quebrado

**Severidade**: 🔴 CRÍTICA  
**Impacto**: Usuários não conseguem atualizar logo/capa

```typescript
// EditarEmpresaPage.tsx - LINHA 241
logoRef={null}  // ❌ Deveria ser useRef()
onLogoChange={() => {}}  // ❌ Deveria fazer upload
```

**Solução:**
```typescript
const logoRef = useRef<HTMLInputElement>(null);
const { mutateAsync: uploadLogo } = useBusinessImageUpload();

const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const url = await uploadLogo({ file, folder: 'logos' });
  form.setValue('logo_url', url);
};
```

### 2. Endereço Não Estruturado

**Severidade**: 🟡 MÉDIA  
**Impacto**: Não aproveita sistema de localização

**Solução:** Adicionar campos estruturados no ContactStep:
- Rua, Número, Complemento
- CEP (com busca automática)
- Cidade, Estado
- Seletor de Location ID

### 3. Dados Empresariais Ausentes

**Severidade**: 🟡 MÉDIA  
**Impacto**: Empresas formais não podem cadastrar CNPJ/razão social

**Solução:** Adicionar novo step ou expandir BasicInfoStep:
- Razão Social
- CNPJ
- Tipo de empresa (MEI, LTDA, etc)
- Segmento
- Número de funcionários

---

## ✅ O Que Está Funcionando Bem

### 1. Wizard de 3 Passos
- ✅ UX clara e progressiva
- ✅ Validação por etapa
- ✅ Navegação intuitiva

### 2. Integração com SSOT
- ✅ Usa `useBusinessEdit` hook
- ✅ Usa `BusinessService` do core
- ✅ Validação com `updateBusinessSchema`

### 3. Slug Management
- ✅ `BusinessSlugSection` component
- ✅ `useBusinessSlugSaveGuard` hook
- ✅ Confirmação de mudança de identidade
- ✅ Logging de mudanças

### 4. Área de Cobertura
- ✅ `CoverageSettingsForm` integrado
- ✅ Permite definir raio de atuação

### 5. Autoria Explícita
- ✅ `ActiveProfileBadge` mostra quem está editando
- ✅ Integração com multi-profile

---

## 🎯 Recomendações

### Prioridade ALTA (Fazer Agora)

1. **Corrigir Upload de Imagens**
   - Implementar refs e handlers
   - Usar `useBusinessImageUpload` hook existente
   - Testar upload de logo e capa

2. **Unificar Versões**
   - Decidir qual versão é a oficial
   - Migrar campos únicos para versão oficial
   - Deprecar versão redundante

3. **Adicionar Campos Críticos**
   - Latitude/Longitude (com mapa)
   - Ano de fundação
   - Subcategoria

### Prioridade MÉDIA (Próximas Sprints)

4. **Endereço Estruturado**
   - Adicionar campos de endereço canônico
   - Integrar com sistema de localização
   - Busca de CEP automática

5. **Dados Empresariais**
   - Razão social, CNPJ
   - Tipo de empresa
   - Segmento e porte

6. **Horários Estruturados**
   - Substituir texto livre por estrutura
   - Integrar com `OpeningHoursService`
   - UI de seleção de horários por dia

### Prioridade BAIXA (Backlog)

7. **Hierarquia de Empresas**
   - Suporte a filiais
   - Vinculação com matriz
   - Gestão de redes

8. **Galeria de Fotos**
   - Upload múltiplo
   - Reordenação
   - Preview

9. **Status e Flags**
   - Status da empresa
   - Flags de recursos
   - Verificação

---

## 📝 Checklist de Completude

### Campos Básicos
- [x] Nome
- [x] Descrição
- [x] Categoria
- [ ] Subcategoria

### Dados da Empresa
- [ ] Razão social
- [ ] CNPJ
- [ ] Tipo de empresa
- [ ] Segmento
- [ ] Número de funcionários
- [ ] Ano de fundação (só no sheet)

### Contato
- [x] Telefone
- [x] WhatsApp
- [x] Email
- [x] Website
- [x] Instagram
- [x] Facebook

### Endereço
- [x] Endereço (legado)
- [ ] Rua
- [ ] Número
- [ ] Complemento
- [ ] CEP
- [ ] Cidade
- [ ] Estado
- [ ] Location ID
- [ ] Latitude (só no sheet)
- [ ] Longitude (só no sheet)

### Horários
- [x] Horário texto livre
- [ ] Horário estruturado

### Recursos
- [x] Modos de atendimento
- [x] Formas de pagamento
- [x] Especialidades
- [x] Facilidades
- [ ] Tem delivery
- [ ] Aceita cartão
- [ ] Aceita PIX
- [ ] Pode postar vagas

### Imagens
- [ ] Logo (preview ok, upload quebrado)
- [ ] Capa (preview ok, upload quebrado)
- [ ] Galeria

### Identidade
- [x] Slug

### Cobertura
- [x] Área de cobertura

### Hierarquia
- [ ] Papel da empresa
- [ ] Empresa matriz
- [ ] É matriz
- [ ] Nome da unidade

### Status
- [ ] Status
- [ ] Verificado
- [ ] Premium

**Total: 19/52 campos (36.5%)**

---

## 🔧 Código de Exemplo: Como Deveria Ser

### Upload de Imagens Funcionando

```typescript
// EditarEmpresaPage.tsx
const logoRef = useRef<HTMLInputElement>(null);
const capaRef = useRef<HTMLInputElement>(null);
const { mutateAsync: uploadImage, isPending: uploading } = useBusinessImageUpload();

const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  try {
    const url = await uploadImage({ file, folder: 'logos' });
    form.setValue('logo_url', url);
    toast.success('Logo atualizado!');
  } catch (error) {
    toast.error('Erro ao fazer upload do logo');
  }
};

const handleCapaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  try {
    const url = await uploadImage({ file, folder: 'banners' });
    form.setValue('banner_url', url);
    toast.success('Capa atualizada!');
  } catch (error) {
    toast.error('Erro ao fazer upload da capa');
  }
};

// Passar refs e handlers reais
<BasicInfoStep
  logoRef={logoRef}
  onLogoChange={handleLogoChange}
  // ...
/>
```

### Endereço Estruturado

```typescript
// Novo componente: AddressStep.tsx
<div className="space-y-4">
  <div className="grid grid-cols-3 gap-2">
    <Input
      label="Rua"
      {...register('address_street')}
      className="col-span-2"
    />
    <Input
      label="Número"
      {...register('address_number')}
    />
  </div>
  
  <Input
    label="Complemento"
    {...register('address_complement')}
  />
  
  <div className="grid grid-cols-2 gap-2">
    <Input
      label="CEP"
      {...register('postal_code')}
      onBlur={handleCepSearch}
    />
    <Input
      label="Bairro"
      {...register('neighborhood')}
    />
  </div>
  
  <div className="grid grid-cols-2 gap-2">
    <Input
      label="Cidade"
      {...register('city')}
    />
    <Input
      label="Estado"
      {...register('state')}
    />
  </div>
  
  <LocationSelector
    value={form.watch('location_id')}
    onChange={(id) => form.setValue('location_id', id)}
  />
</div>
```

---

## 📚 Arquivos Relacionados

### Páginas/Componentes
- `src/modules/business/pages/EditarEmpresaPage.tsx` - Página principal
- `src/modules/business/components/EmpresaEditSheet.tsx` - Modal/sheet
- `src/modules/business/components/edit/BasicInfoStep.tsx` - Step 1
- `src/modules/business/components/edit/ContactStep.tsx` - Step 2
- `src/modules/business/components/edit/ExtrasStep.tsx` - Step 3

### Hooks
- `src/modules/business/hooks/useBusinessEdit.ts` - Hook de edição
- `src/modules/business/hooks/useBusinessImageUpload.ts` - Upload de imagens

### Services
- `src/core/business/services/BusinessService.ts` - SSOT de business
- `src/core/business/services/business.mutations.ts` - Mutations

### Schemas
- `src/shared/schemas/business/businessSchemas.ts` - Validação

### Types
- `src/modules/business/types/index.ts` - Tipos
- `src/core/business/types/index.ts` - Tipos do core

---

## 🏆 Conclusão

A funcionalidade de edição de empresa está **PARCIALMENTE IMPLEMENTADA**:

### ✅ Pontos Fortes
- Arquitetura SSOT correta
- Wizard UX bem estruturado
- Integração com services do core
- Slug management robusto
- Área de cobertura funcional

### ❌ Pontos Fracos
- **Upload de imagens quebrado** (crítico)
- **Apenas 36.5% dos campos editáveis**
- **Endereço não estruturado**
- **Dados empresariais ausentes**
- **Inconsistência entre versões**

### 🎯 Próximos Passos
1. Corrigir upload de imagens (URGENTE)
2. Adicionar campos críticos faltantes
3. Unificar as duas versões
4. Implementar endereço estruturado
5. Adicionar dados empresariais

---

**Auditado por**: Análise Manual Completa  
**Data**: 2026-04-23  
**Status**: ⚠️ REQUER MELHORIAS
