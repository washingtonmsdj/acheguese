# 🚀 Onboarding - Guia para Novos Desenvolvedores

Bem-vindo ao projeto! Este guia vai te ajudar a entender a arquitetura e começar a contribuir rapidamente.

---

## 📚 Documentos Essenciais (Leitura Obrigatória)

### 1. **SSOT_REGISTRY.md** 🎯 CRÍTICO
**Tempo de leitura**: 15 minutos  
**Por que ler**: Define a arquitetura fundamental do projeto

Este é o documento mais importante. Ele lista todos os SSOTs (Single Source of Truth) do projeto e como usá-los corretamente.

**Regra de Ouro**: Nunca faça queries diretas ao Supabase. Sempre use o serviço SSOT correspondente.

```typescript
// ❌ NUNCA FAÇA ISSO
const { data } = await supabase.from('locations').select('*');

// ✅ SEMPRE FAÇA ISSO
const { location } = await locationService.getLocationById({ id: 'uuid' });
```

### 2. **README_SSOT_URLS.md**
**Tempo de leitura**: 10 minutos  
**Por que ler**: Entender como URLs são geradas no projeto

### 3. **SSOT_CORRECTION_REPORT.md**
**Tempo de leitura**: 5 minutos  
**Por que ler**: Ver exemplo real de correção profissional

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Diretórios

```
src/
├── core/                    # Lógica de negócio central (SSOTs)
│   ├── location/           # SSOT para locations
│   ├── profiles/           # SSOT para perfis
│   ├── business/           # SSOT para empresas
│   ├── professional/       # SSOT para profissionais
│   ├── mobility/           # SSOT para mobilidade
│   └── ...
├── modules/                # Features específicas (UI + lógica)
│   ├── business/
│   ├── gastronomy/
│   └── ...
├── shared/                 # Componentes e utils compartilhados
└── integrations/           # Integrações externas (Supabase, etc)
```

### Regras de Dependência

```
modules → core → shared → integrations
   ↓       ↓       ↓          ↓
  UI    Business  Utils   External
```

**Importante:**
- ✅ Modules PODEM importar de core
- ✅ Core PODE importar de shared
- ❌ Core NÃO PODE importar de modules
- ❌ Shared NÃO PODE importar de core ou modules

---

## 🎯 Princípios Fundamentais

### 1. SSOT (Single Source of Truth)
Cada entidade tem UM único serviço responsável por acessá-la.

**Exemplo:**
```typescript
// Locations → LocationService
// Profiles → ProfileService
// Business → BusinessService
```

### 2. Separation of Concerns
- **Services**: Lógica de negócio e acesso a dados
- **Components**: UI e apresentação
- **Hooks**: Estado e side effects
- **Utils**: Funções puras e helpers

### 3. Type Safety
- Use TypeScript rigorosamente
- Evite `any` e `@ts-nocheck`
- Defina interfaces claras

---

## 🛠️ Setup do Ambiente

### 1. Instalação
```bash
npm install
```

### 2. Configuração
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Configure as variáveis necessárias
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
```

### 3. Executar
```bash
npm run dev
```

### 4. Testes
```bash
npm run test
npm run test:e2e
```

---

## ✅ Checklist Antes do Primeiro Commit

### Conhecimento
- [ ] Li o SSOT_REGISTRY.md completamente
- [ ] Entendi a estrutura de diretórios
- [ ] Sei qual SSOT usar para cada entidade
- [ ] Entendi as regras de dependência

### Ambiente
- [ ] Projeto rodando localmente
- [ ] Testes passando
- [ ] ESLint configurado no editor
- [ ] Git configurado com meu nome/email

### Ferramentas
- [ ] Instalei as extensões recomendadas do VSCode
- [ ] Configurei o pre-commit hook
- [ ] Testei o comando de lint

---

## 🚨 Erros Comuns de Iniciantes

### 1. Query Direta ao Supabase ❌
```typescript
// ❌ ERRADO
const { data } = await supabase.from('profiles').select('*');

// ✅ CORRETO
const context = await profileService.getProfileContext(userId);
```

### 2. Importar de Modules no Core ❌
```typescript
// ❌ ERRADO (core importando de modules)
import { BusinessCard } from '@/modules/business/components/BusinessCard';

// ✅ CORRETO (modules importando de core)
import { BusinessService } from '@/core/business/services/BusinessService';
```

### 3. Lógica de Negócio no Componente ❌
```typescript
// ❌ ERRADO
function MyComponent() {
  const calculatePrice = () => {
    // lógica complexa aqui
  };
}

// ✅ CORRETO
function MyComponent() {
  const price = BusinessService.calculatePrice(data);
}
```

### 4. Usar `any` ou `@ts-nocheck` ❌
```typescript
// ❌ ERRADO
const data: any = await fetchData();

// ✅ CORRETO
interface MyData {
  id: string;
  name: string;
}
const data: MyData = await fetchData();
```

---

## 📝 Workflow de Desenvolvimento

### 1. Criar Branch
```bash
git checkout -b feature/minha-feature
```

### 2. Desenvolver
- Escreva código seguindo os padrões
- Use o SSOT correto
- Adicione testes se necessário

### 3. Validar Localmente
```bash
# Lint
npm run lint

# Type check
npm run type-check

# Testes
npm run test

# SSOT compliance
npm run check:ssot
```

### 4. Commit
```bash
git add .
git commit -m "feat: descrição da feature"
```

O pre-commit hook vai validar automaticamente:
- ✅ Lint
- ✅ Type check
- ✅ SSOT compliance

### 5. Push e PR
```bash
git push origin feature/minha-feature
```

Crie um Pull Request no GitHub seguindo o template.

---

## 🎓 Recursos de Aprendizado

### Documentação Interna
1. `SSOT_REGISTRY.md` - Lista de todos os SSOTs
2. `README_SSOT_URLS.md` - Sistema de URLs
3. `SSOT_CORRECTION_REPORT.md` - Exemplo de correção
4. `GASTRONOMY_ARCHITECTURE.md` - Arquitetura do módulo de gastronomia

### Exemplos de Código Bom
- `src/core/location/services/LocationService.ts` - SSOT bem implementado
- `src/core/business/services/BusinessService.ts` - Service completo
- `src/modules/gastronomy/` - Módulo bem estruturado

### Padrões de Teste
- `src/core/business/services/__tests__/NetworkService.test.ts`

---

## 🤝 Como Pedir Ajuda

### 1. Documentação
Sempre consulte a documentação primeiro:
- SSOT_REGISTRY.md para questões de arquitetura
- README.md para setup e comandos
- Código existente para exemplos

### 2. Code Review
- Faça perguntas nos PRs
- Peça revisão de código experiente
- Aprenda com os comentários

### 3. Pair Programming
- Agende sessões com desenvolvedores seniores
- Compartilhe tela para resolver problemas
- Aprenda fazendo junto

---

## 🎯 Metas dos Primeiros 30 Dias

### Semana 1: Familiarização
- [ ] Setup completo do ambiente
- [ ] Ler toda documentação essencial
- [ ] Rodar projeto localmente
- [ ] Fazer primeiro commit (pequeno)

### Semana 2: Contribuições Pequenas
- [ ] Corrigir 2-3 bugs pequenos
- [ ] Adicionar testes para código existente
- [ ] Melhorar documentação

### Semana 3: Features Simples
- [ ] Implementar feature pequena completa
- [ ] Seguir todos os padrões do projeto
- [ ] Passar por code review

### Semana 4: Autonomia
- [ ] Implementar feature média
- [ ] Ajudar outros desenvolvedores
- [ ] Propor melhorias

---

## 🔍 Checklist de Code Review

Use este checklist antes de criar um PR:

### Arquitetura
- [ ] Usei o SSOT correto para cada entidade?
- [ ] Não fiz queries diretas ao Supabase?
- [ ] Respeitei as regras de dependência?
- [ ] Coloquei lógica de negócio no lugar certo?

### Código
- [ ] Código está limpo e legível?
- [ ] Nomes de variáveis são descritivos?
- [ ] Funções são pequenas e focadas?
- [ ] Evitei duplicação de código?

### TypeScript
- [ ] Não usei `any` desnecessariamente?
- [ ] Removi `@ts-nocheck` se possível?
- [ ] Defini interfaces para tipos complexos?
- [ ] Type check passa sem erros?

### Testes
- [ ] Adicionei testes se necessário?
- [ ] Testes cobrem casos principais?
- [ ] Testes passam localmente?

### Documentação
- [ ] Atualizei README se necessário?
- [ ] Adicionei comentários em código complexo?
- [ ] Documentei novas APIs/interfaces?

---

## 🎉 Bem-vindo à Equipe!

Lembre-se:
- 🎯 Qualidade > Velocidade
- 📚 Sempre consulte a documentação
- 🤝 Peça ajuda quando precisar
- 🔄 Aprenda com code reviews
- 🚀 Melhore continuamente

**Dúvidas?** Pergunte no canal do time ou abra uma issue!

---

**Última atualização**: 2026-04-01  
**Mantenedor**: Equipe de Arquitetura
