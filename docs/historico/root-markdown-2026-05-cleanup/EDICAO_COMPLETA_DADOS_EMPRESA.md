# 📝 EDIÇÃO COMPLETA: Todos os Dados da Página Pública Editáveis no Dashboard

## 🎯 Objetivo

**Garantir que TODOS os dados exibidos na página pública da empresa possam ser editados diretamente no dashboard de gestão.**

## 📊 Análise: Dados Exibidos na Página Pública

### 1. **HERO / CABEÇALHO**
- ✅ Logo da empresa
- ✅ Banner/Capa
- ✅ Nome da empresa
- ✅ Slug (@identificador)
- ✅ Categoria
- ✅ Subcategoria
- ✅ Localização (bairro, cidade, estado)
- ✅ Rating (avaliação)
- ✅ Total de avaliações
- ✅ Anos de atividade
- ✅ Status (Aberto/Fechado)
- ✅ Horário de hoje
- ✅ Badges (Premium, Verificado, Featured)
- ✅ Modos de atendimento (Presencial, Delivery, Domicílio, Online)
- ✅ Badge de cobertura

### 2. **SOBRE A EMPRESA**
- ✅ Descrição completa
- ✅ Especialidades (lista)
- ✅ Anos no bairro
- ✅ Status de verificação

### 3. **INFORMAÇÕES PRÁTICAS**

#### Endereço e Localização
- ✅ Rua
- ✅ Número
- ✅ Complemento
- ✅ CEP
- ✅ Bairro/Cidade/Estado
- ✅ Latitude/Longitude (para mapa)

#### Horário de Funcionamento
- ✅ Segunda-feira (abertura/fechamento)
- ✅ Terça-feira
- ✅ Quarta-feira
- ✅ Quinta-feira
- ✅ Sexta-feira
- ✅ Sábado
- ✅ Domingo
- ✅ Dias especiais/fechamentos

#### Formas de Atendimento
- ✅ Presencial
- ✅ Delivery
- ✅ Atendimento a domicílio
- ✅ Atendimento online
- ✅ Áreas de entrega/atendimento (lista de bairros)

#### Formas de Pagamento
- ✅ PIX
- ✅ Cartão de crédito
- ✅ Cartão de débito
- ✅ Dinheiro
- ✅ Vale refeição
- ✅ Outras formas (lista customizável)

### 4. **CONTATO**
- ✅ Telefone
- ✅ WhatsApp
- ✅ Email
- ✅ Website
- ✅ Instagram
- ✅ Facebook
- ✅ Outras redes sociais

### 5. **FACILIDADES**
- ✅ Wi-Fi grátis
- ✅ Estacionamento
- ✅ Acessibilidade
- ✅ Espaço Kids
- ✅ Pet Friendly
- ✅ Outras facilidades

### 6. **PRODUTOS/CARDÁPIO** (se gastronomia)
- ✅ Nome do produto
- ✅ Descrição
- ✅ Preço
- ✅ Preço promocional
- ✅ Categoria
- ✅ Imagem
- ✅ Destaque (featured)
- ✅ Status (ativo/inativo)

### 7. **FOTOS DA EMPRESA**
- ✅ Galeria de fotos
- ✅ Upload de múltiplas imagens
- ✅ Ordem das fotos

### 8. **REDE DE FILIAIS**
- ✅ Filiais vinculadas
- ✅ Estrutura de rede

## 🔍 Análise: O Que Já Existe no Dashboard

### Dashboard Atual (`/dashboard/business/:profileId`)

#### Aba "Configurações" (SettingsTab)
Vou verificar o que já está implementado:

```typescript
// Arquivo: src/modules/dashboard/components/SettingsTab.tsx
```

**Campos Editáveis Atuais:**
- Nome da empresa
- Categoria
- Descrição
- Logo (upload)
- Alguns campos básicos

**FALTANDO:**
- Banner/Capa
- Subcategoria
- Especialidades
- Horário de funcionamento completo
- Formas de pagamento
- Facilidades
- Modos de atendimento
- Áreas de entrega
- Redes sociais
- Endereço completo
- Galeria de fotos

## 🎨 Solução: Formulário Completo de Edição

### Estrutura Proposta

```
Dashboard > Configurações
├── 1. Informações Básicas
│   ├── Nome da empresa
│   ├── Slug (@identificador)
│   ├── Categoria
│   ├── Subcategoria
│   └── Descrição
│
├── 2. Identidade Visual
│   ├── Logo (upload)
│   ├── Banner/Capa (upload)
│   └── Galeria de Fotos (múltiplos uploads)
│
├── 3. Localização
│   ├── CEP (busca automática)
│   ├── Rua
│   ├── Número
│   ├── Complemento
│   ├── Bairro
│   ├── Cidade
│   ├── Estado
│   └── Coordenadas (mapa interativo)
│
├── 4. Horário de Funcionamento
│   ├── Segunda-feira (abertura/fechamento)
│   ├── Terça-feira
│   ├── Quarta-feira
│   ├── Quinta-feira
│   ├── Sexta-feira
│   ├── Sábado
│   ├── Domingo
│   ├── Copiar horário para todos os dias
│   └── Dias especiais/fechamentos
│
├── 5. Contato
│   ├── Telefone
│   ├── WhatsApp
│   ├── Email
│   ├── Website
│   ├── Instagram
│   ├── Facebook
│   └── Outras redes
│
├── 6. Atendimento
│   ├── Modos de atendimento (checkboxes)
│   │   ├── ☐ Presencial
│   │   ├── ☐ Delivery
│   │   ├── ☐ Atendimento a domicílio
│   │   └── ☐ Atendimento online
│   │
│   ├── Áreas de entrega (se delivery ativo)
│   │   └── Lista de bairros atendidos
│   │
│   └── Formas de pagamento (checkboxes)
│       ├── ☐ PIX
│       ├── ☐ Cartão de crédito
│       ├── ☐ Cartão de débito
│       ├── ☐ Dinheiro
│       ├── ☐ Vale refeição
│       └── + Adicionar outra forma
│
├── 7. Especialidades e Facilidades
│   ├── Especialidades (tags)
│   │   └── Ex: Moqueca, Acarajé, Vatapá
│   │
│   └── Facilidades (checkboxes)
│       ├── ☐ Wi-Fi grátis
│       ├── ☐ Estacionamento
│       ├── ☐ Acessibilidade
│       ├── ☐ Espaço Kids
│       └── ☐ Pet Friendly
│
└── 8. Configurações Avançadas
    ├── Status da empresa (Ativa/Pausada)
    ├── Visibilidade (Pública/Privada)
    └── Configurações de SEO
```

## 💻 Implementação

### Fase 1: Melhorar SettingsTab Existente

**Arquivo:** `src/modules/dashboard/components/SettingsTab.tsx`

Adicionar seções faltantes:

1. **Upload de Banner**
2. **Galeria de Fotos**
3. **Horário de Funcionamento Completo**
4. **Formas de Pagamento**
5. **Facilidades**
6. **Modos de Atendimento**
7. **Áreas de Entrega**
8. **Redes Sociais**
9. **Especialidades**

### Fase 2: Criar Componentes Reutilizáveis

#### 1. BusinessImageUploader
```tsx
// Upload de logo, banner e galeria
<BusinessImageUploader
  type="logo" | "banner" | "gallery"
  currentImage={business.logo_url}
  onUpload={handleUpload}
  aspectRatio="1:1" | "21:9" | "free"
/>
```

#### 2. OpeningHoursEditor
```tsx
// Editor de horários com UI intuitiva
<OpeningHoursEditor
  hours={business.horario_funcionamento}
  onChange={handleHoursChange}
  features={{
    copyToAll: true,
    specialDays: true,
    closedDays: true
  }}
/>
```

#### 3. PaymentMethodsSelector
```tsx
// Seletor de formas de pagamento
<PaymentMethodsSelector
  selected={business.formas_pagamento}
  onChange={handlePaymentChange}
  allowCustom={true}
/>
```

#### 4. FacilitiesSelector
```tsx
// Seletor de facilidades
<FacilitiesSelector
  selected={business.facilidades}
  onChange={handleFacilitiesChange}
  options={[
    { id: 'wifi', label: 'Wi-Fi grátis', icon: Wifi },
    { id: 'estacionamento', label: 'Estacionamento', icon: ParkingSquare },
    // ...
  ]}
/>
```

#### 5. ServiceModesSelector
```tsx
// Seletor de modos de atendimento
<ServiceModesSelector
  selected={business.modos_atendimento}
  onChange={handleModesChange}
  onDeliveryAreasChange={handleAreasChange}
  deliveryAreas={business.areas_entrega}
/>
```

#### 6. SpecialtiesEditor
```tsx
// Editor de especialidades (tags)
<SpecialtiesEditor
  specialties={business.especialidades}
  onChange={handleSpecialtiesChange}
  maxTags={10}
/>
```

#### 7. SocialMediaEditor
```tsx
// Editor de redes sociais
<SocialMediaEditor
  social={{
    instagram: business.instagram,
    facebook: business.facebook,
    // ...
  }}
  onChange={handleSocialChange}
/>
```

#### 8. AddressEditor
```tsx
// Editor de endereço com busca por CEP
<AddressEditor
  address={business.address}
  onChange={handleAddressChange}
  features={{
    cepLookup: true,
    mapPicker: true,
    coordinates: true
  }}
/>
```

### Fase 3: Layout do Formulário

```tsx
// src/modules/dashboard/components/SettingsTab.tsx (melhorado)

export function SettingsTab({ businessId }: { businessId: string }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [activeSection, setActiveSection] = useState<string>("basico");

  const sections = [
    { id: "basico", label: "Informações Básicas", icon: Info },
    { id: "visual", label: "Identidade Visual", icon: ImageIcon },
    { id: "localizacao", label: "Localização", icon: MapPin },
    { id: "horarios", label: "Horários", icon: Clock },
    { id: "contato", label: "Contato", icon: Phone },
    { id: "atendimento", label: "Atendimento", icon: Store },
    { id: "especialidades", label: "Especialidades", icon: Award },
    { id: "avancado", label: "Avançado", icon: Settings },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
      {/* Sidebar de navegação */}
      <aside className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              activeSection === section.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            )}
          >
            <section.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{section.label}</span>
          </button>
        ))}
      </aside>

      {/* Conteúdo */}
      <main className="space-y-6">
        {activeSection === "basico" && (
          <BasicInfoSection business={business} onChange={handleChange} />
        )}
        {activeSection === "visual" && (
          <VisualIdentitySection business={business} onChange={handleChange} />
        )}
        {activeSection === "localizacao" && (
          <LocationSection business={business} onChange={handleChange} />
        )}
        {activeSection === "horarios" && (
          <OpeningHoursSection business={business} onChange={handleChange} />
        )}
        {activeSection === "contato" && (
          <ContactSection business={business} onChange={handleChange} />
        )}
        {activeSection === "atendimento" && (
          <ServiceSection business={business} onChange={handleChange} />
        )}
        {activeSection === "especialidades" && (
          <SpecialtiesSection business={business} onChange={handleChange} />
        )}
        {activeSection === "avancado" && (
          <AdvancedSection business={business} onChange={handleChange} />
        )}

        {/* Botões de ação */}
        <div className="flex gap-3 pt-6 border-t">
          <Button onClick={handleSave} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </main>
    </div>
  );
}
```

## 📋 Checklist de Implementação

### Componentes Base
- [ ] `BusinessImageUploader` - Upload de imagens
- [ ] `OpeningHoursEditor` - Editor de horários
- [ ] `PaymentMethodsSelector` - Seletor de pagamentos
- [ ] `FacilitiesSelector` - Seletor de facilidades
- [ ] `ServiceModesSelector` - Seletor de modos de atendimento
- [ ] `SpecialtiesEditor` - Editor de especialidades
- [ ] `SocialMediaEditor` - Editor de redes sociais
- [ ] `AddressEditor` - Editor de endereço

### Seções do Formulário
- [ ] `BasicInfoSection` - Nome, categoria, descrição
- [ ] `VisualIdentitySection` - Logo, banner, galeria
- [ ] `LocationSection` - Endereço completo
- [ ] `OpeningHoursSection` - Horários de funcionamento
- [ ] `ContactSection` - Telefone, email, redes
- [ ] `ServiceSection` - Modos, áreas, pagamentos
- [ ] `SpecialtiesSection` - Especialidades e facilidades
- [ ] `AdvancedSection` - Configurações avançadas

### Funcionalidades
- [ ] Auto-save (salvar automaticamente)
- [ ] Preview em tempo real
- [ ] Validação de campos
- [ ] Upload de múltiplas imagens
- [ ] Busca de CEP automática
- [ ] Seletor de coordenadas no mapa
- [ ] Copiar horário para todos os dias
- [ ] Importar/Exportar configurações

## 🎯 Prioridades

### ALTA (Implementar Primeiro)
1. ✅ Informações Básicas (nome, categoria, descrição)
2. ✅ Upload de Logo e Banner
3. ✅ Horário de Funcionamento
4. ✅ Contato (telefone, WhatsApp, email)
5. ✅ Endereço Completo

### MÉDIA (Implementar em Seguida)
6. ✅ Formas de Pagamento
7. ✅ Modos de Atendimento
8. ✅ Facilidades
9. ✅ Redes Sociais
10. ✅ Especialidades

### BAIXA (Implementar Depois)
11. ✅ Galeria de Fotos
12. ✅ Áreas de Entrega
13. ✅ Configurações Avançadas
14. ✅ SEO

## 🔄 Fluxo de Edição

```
1. Dono acessa Dashboard
   ↓
2. Clica em "Configurações"
   ↓
3. Navega pelas seções (sidebar)
   ↓
4. Edita os campos desejados
   ↓
5. Vê preview em tempo real (opcional)
   ↓
6. Clica em "Salvar Alterações"
   ↓
7. Sistema valida os dados
   ↓
8. Salva no banco de dados
   ↓
9. Atualiza página pública automaticamente
   ↓
10. Mostra confirmação de sucesso
```

## 📊 Mapeamento de Dados

### Tabela: business_data

```sql
-- Campos que precisam ser editáveis
name                    -- Nome da empresa
slug                    -- Identificador público
category                -- Categoria
subcategoria            -- Subcategoria
description             -- Descrição
logo_url                -- URL do logo
banner_url              -- URL do banner
phone                   -- Telefone
whatsapp                -- WhatsApp
email                   -- Email
website                 -- Website
instagram               -- Instagram
facebook                -- Facebook
address                 -- Endereço (JSON)
  ├── street            -- Rua
  ├── number            -- Número
  ├── complement        -- Complemento
  ├── postal_code       -- CEP
  ├── latitude          -- Latitude
  └── longitude         -- Longitude
horario_funcionamento   -- Horários (JSON)
  ├── segunda           -- Segunda-feira
  ├── terca             -- Terça-feira
  ├── quarta            -- Quarta-feira
  ├── quinta            -- Quinta-feira
  ├── sexta             -- Sexta-feira
  ├── sabado            -- Sábado
  └── domingo           -- Domingo
modos_atendimento       -- Array de modos
formas_pagamento        -- Array de formas
especialidades          -- Array de especialidades
facilidades             -- Array de facilidades
areas_entrega           -- Array de áreas (se delivery)
fotos                   -- Array de URLs de fotos
tem_delivery            -- Boolean
aceita_cartao           -- Boolean
aceita_pix              -- Boolean
status                  -- Status (active/paused)
```

## 🚀 Próximos Passos

1. **Criar componentes base** (BusinessImageUploader, OpeningHoursEditor, etc)
2. **Melhorar SettingsTab** com navegação por seções
3. **Implementar cada seção** do formulário
4. **Adicionar validações** e feedback visual
5. **Testar fluxo completo** de edição
6. **Documentar** para usuários

---

**Status:** 📝 PLANEJAMENTO COMPLETO
**Próxima Ação:** Implementar componentes base
**Impacto:** ALTO - Donos poderão gerenciar 100% dos dados públicos
