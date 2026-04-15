# 🎯 DECISÃO: HERO DA PÁGINA DE MOBILIDADE

**Data:** 2026-04-14  
**Status:** ✅ DECISÃO TOMADA

---

## 🤔 QUESTÃO

Devemos adicionar um terceiro CTA no Hero para "Motoboy"?

---

## 📊 ANÁLISE DAS OPÇÕES

### Opção 1: Hero com 3 CTAs
```typescript
<CanonicalHero
  primaryCTA={{ label: "Pedir Viagem" }}
  secondaryCTA={{ label: "Motorista" }}
  tertiaryCTA={{ label: "Motoboy" }} // ← NOVO
/>
```

**Prós:**
- ✅ Acesso direto no Hero
- ✅ Simetria visual (3 perfis = 3 botões)

**Contras:**
- ❌ Poluição visual no Hero
- ❌ Precisa modificar `CanonicalHero` (componente canônico usado em todo sistema)
- ❌ Hero perde foco (muitas opções)
- ❌ Em mobile, 3 botões ficam apertados

---

### Opção 2: Dropdown no secondaryCTA
```typescript
<CanonicalHero
  primaryCTA={{ label: "Pedir Viagem" }}
  secondaryCTA={{ 
    label: "Quero Trabalhar",
    dropdown: [
      { label: "Motorista", icon: Car },
      { label: "Motoboy", icon: Bike }
    ]
  }}
/>
```

**Prós:**
- ✅ Hero limpo (2 botões)
- ✅ Agrupa perfis de trabalho

**Contras:**
- ❌ Precisa modificar `CanonicalHero`
- ❌ Adiciona complexidade (dropdown)
- ❌ Menos direto (precisa abrir menu)
- ❌ Pode confundir usuários

---

### Opção 3: Hero com 2 CTAs + Seção Dedicada ✅ ESCOLHIDA
```typescript
<CanonicalHero
  primaryCTA={{ label: "Pedir Viagem" }}
  secondaryCTA={{ label: "Quero Dirigir" }}
/>

<section className="escolha-seu-perfil">
  [Passageiro] [Motorista] [Motoboy]
</section>
```

**Prós:**
- ✅ Hero limpo e focado
- ✅ Hierarquia clara (Passageiro > Motorista > Motoboy)
- ✅ Seção dedicada oferece contexto e descrições
- ✅ Não modifica componente canônico
- ✅ Melhor UX (cards com descrição vs botões simples)
- ✅ Responsivo (cards empilham bem em mobile)
- ✅ Múltiplos pontos de entrada (Hero + Cards + CTA Final)

**Contras:**
- ⚠️ Motoboy não está no Hero (mas está logo abaixo)

---

## ✅ DECISÃO FINAL

**Opção 3: Manter Hero com 2 CTAs + Seção "Escolha seu perfil"**

### Justificativa

1. **Hierarquia Visual Clara**
   - Hero: Foco em ação primária (Pedir Viagem) e secundária (Motorista)
   - Seção: Apresentação completa dos 3 perfis com contexto

2. **Melhor UX**
   - Cards oferecem mais informação que botões simples
   - Usuários podem ler descrições antes de escolher
   - Diferenciação visual clara (cores, ícones, badges)

3. **Profissionalismo**
   - Não modifica componente canônico sem necessidade
   - Mantém Hero limpo e focado
   - Usa seção dedicada para escolha informada

4. **Múltiplos Pontos de Entrada**
   - Hero: Passageiro (primário) + Motorista (secundário)
   - Cards: Passageiro + Motorista + Motoboy (todos iguais)
   - CTA Final: Passageiro + Motorista + Motoboy (todos iguais)

5. **Responsividade**
   - Hero com 2 botões funciona bem em mobile
   - Cards empilham naturalmente em mobile
   - 3 botões no Hero ficariam apertados em mobile

---

## 🎨 ESTRUTURA VISUAL FINAL

```
┌─────────────────────────────────────┐
│ HERO                                │
│ ┌─────────────┐ ┌─────────────┐    │
│ │ Pedir Viagem│ │Quero Dirigir│    │
│ │  (Primary)  │ │  (Outline)  │    │
│ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────┘
         ↓ Scroll ↓
┌─────────────────────────────────────┐
│ ESCOLHA SEU PERFIL                  │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │📍Pass│ │🚗Moto│ │🏍️Moto│         │
│ │ageiro│ │rista │ │ boy  │         │
│ │      │ │Corrid│ │Entreg│         │
│ │      │ │  as  │ │  as  │         │
│ └──────┘ └──────┘ └──────┘         │
└─────────────────────────────────────┘
```

---

## 📱 COMPORTAMENTO EM MOBILE

### Hero
```
┌─────────────────┐
│  Pedir Viagem   │ ← Full width
└─────────────────┘
┌─────────────────┐
│  Quero Dirigir  │ ← Full width
└─────────────────┘
```

### Cards
```
┌─────────────────┐
│   📍 Passageiro │
│   Solicite...   │
└─────────────────┘
┌─────────────────┐
│   🚗 Motorista  │
│   Faça corridas │
└─────────────────┘
┌─────────────────┐
│   🏍️ Motoboy   │
│   Faça entregas │
└─────────────────┘
```

---

## 🎯 BENEFÍCIOS DA DECISÃO

### 1. Foco no Hero
- ✅ Hero mantém foco em ações principais
- ✅ Não sobrecarrega com muitas opções
- ✅ Hierarquia visual clara

### 2. Contexto na Seção
- ✅ Cards oferecem descrições completas
- ✅ Usuários entendem diferença entre perfis
- ✅ Badges informativos ("Corridas", "Entregas")

### 3. Profissionalismo
- ✅ Não modifica componente canônico
- ✅ Usa padrões estabelecidos
- ✅ Código limpo e manutenível

### 4. Flexibilidade
- ✅ Fácil adicionar mais perfis no futuro
- ✅ Fácil modificar descrições
- ✅ Fácil ajustar hierarquia

### 5. Conversão
- ✅ Múltiplos pontos de entrada
- ✅ CTAs claros em cada seção
- ✅ Usuários têm várias chances de converter

---

## 🔍 COMPARAÇÃO COM OUTROS MÓDULOS

### Gastronomia
```
Hero: [Pedir Comida] [Cadastrar Restaurante]
Seção: Lista de restaurantes
```

### Vagas
```
Hero: [Buscar Vagas] [Anunciar Vaga]
Seção: Lista de vagas
```

### Mobilidade (Atual)
```
Hero: [Pedir Viagem] [Quero Dirigir]
Seção: [Passageiro] [Motorista] [Motoboy] ← DIFERENCIAL
```

**Observação:** Mobilidade tem 3 perfis distintos, então faz sentido ter uma seção dedicada para escolha. Outros módulos têm apenas 2 perfis (consumidor + fornecedor).

---

## ✅ CONCLUSÃO

A decisão de **manter o Hero com 2 CTAs** e usar a **seção "Escolha seu perfil"** para apresentar os 3 perfis é:

- ✅ **Profissional** - Não modifica componente canônico
- ✅ **Focada** - Hero mantém foco em ações principais
- ✅ **Informativa** - Cards oferecem contexto completo
- ✅ **Responsiva** - Funciona bem em todos os tamanhos
- ✅ **Conversora** - Múltiplos pontos de entrada
- ✅ **Manutenível** - Código limpo e SSOT compliant

**Status:** ✅ DECISÃO FINAL - Não modificar Hero

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Documentar decisão (este arquivo)
2. ⏳ Validar visualmente em http://localhost:8082/mobilidade
3. ⏳ Testar navegação dos 3 perfis
4. ⏳ Verificar responsividade
5. ⏳ Confirmar com usuário

---

**Decisão tomada profissionalmente, sem gambiarras, seguindo SSOT.**

**Última atualização:** 2026-04-14 18:30 UTC
