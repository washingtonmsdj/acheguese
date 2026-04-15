# Índice de Documentação do Projeto

**Última atualização**: 2026-03-23  
**Status**: ✅ Organizado e Consolidado

---

## 📚 Documentação Principal (Raiz)

### Essenciais
- **[README.md](./README.md)** - Guia principal do projeto
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura feature-first completa
- **[SSOT_REGRA_DEFINITIVA.md](./SSOT_REGRA_DEFINITIVA.md)** - Regras SSOT obrigatórias
- **[SECURITY.md](./SECURITY.md)** - Políticas de segurança

---

## 📁 Documentação Técnica (/docs)

### Guias de Desenvolvimento
- **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** - Como começar
- **[docs/ONBOARDING_DEVS.md](./docs/ONBOARDING_DEVS.md)** - Onboarding de desenvolvedores
- **[docs/CURRENT_RULES.md](./docs/CURRENT_RULES.md)** - Regras vigentes
- **[docs/HUSKY_HOOKS.md](./docs/HUSKY_HOOKS.md)** - Git Hooks e Conventional Commits

### Arquitetura e Design
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Detalhes arquiteturais
- **[docs/DATA_MODELING.md](./docs/DATA_MODELING.md)** - Modelagem de dados
- **[docs/OWNERSHIP_CONTEXT_PERMISSIONS.md](./docs/OWNERSHIP_CONTEXT_PERMISSIONS.md)** - Ownership e permissões

### Funcionalidades Específicas
- **[src/core/banners/docs/SISTEMA_BANNERS.md](../../src/core/banners/docs/SISTEMA_BANNERS.md)** - Sistema de banners
- **[docs/HEADER_RESPONSIVO.md](./docs/HEADER_RESPONSIVO.md)** - Header responsivo
- **[docs/TABELAS_ADMIN_SSOT.md](./docs/TABELAS_ADMIN_SSOT.md)** - Tabelas admin SSOT

### Banco de Dados
- **[docs/MIGRATIONS.md](./docs/MIGRATIONS.md)** - Migrações de banco
- **[docs/SETUP_EXEC_SQL_GUIDE.md](./docs/SETUP_EXEC_SQL_GUIDE.md)** - Guia de SQL

### Qualidade
- **[docs/CHECKLIST_CODE_REVIEW.md](./docs/CHECKLIST_CODE_REVIEW.md)** - Checklist de code review
- **[docs/GUIA_PRATICO_USO.md](./docs/GUIA_PRATICO_USO.md)** - Guia prático de uso

---

## 🗄️ Documentação Histórica (/docs/archive)

### Migrações
- **[docs/archive/migrations/](./docs/archive/migrations/)** - Histórico de migrações
  - Migração SSOT estrutural
  - Migração incremental
  - Migração de mocks SSOT
  - Planos de migração feature-first

### Auditorias
- **[docs/archive/audits/](./docs/archive/audits/)** - Auditorias realizadas
  - Auditoria de arquitetura
  - Auditoria de camadas arquiteturais

### Relatórios de Progresso
- **[docs/archive/reports/](./docs/archive/reports/)** - Relatórios históricos
  - Progresso SSOT
  - Status de migrações
  - Correções executadas
  - Análises e propostas
  - Testes e validações

### Gates de Qualidade
- **[docs/archive/gates/](./docs/archive/gates/)** - Gates de estabilização
  - Gate de estabilização
  - Gates de lotes (1, 2, 3)
  - Resumos executivos

### Planos de Ação
- **[docs/archive/plans/](./docs/archive/plans/)** - Planos históricos
  - Planos de correção
  - Planos de limpeza
  - Instruções de reinício

### Logs
- **[docs/archive/logs/](./docs/archive/logs/)** - Logs de validação
  - Outputs de lint
  - Validações de dependências
  - Resultados de testes

---

## 🎯 Documentação por Contexto

### Para Novos Desenvolvedores
1. [README.md](./README.md) - Visão geral
2. [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) - Setup inicial
3. [docs/ONBOARDING_DEVS.md](./docs/ONBOARDING_DEVS.md) - Onboarding completo
4. [ARCHITECTURE.md](./ARCHITECTURE.md) - Entender arquitetura
5. [docs/CURRENT_RULES.md](./docs/CURRENT_RULES.md) - Regras a seguir
6. [docs/HUSKY_HOOKS.md](./docs/HUSKY_HOOKS.md) - Git Hooks

### Para Desenvolvimento
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Estrutura do projeto
2. [SSOT_REGRA_DEFINITIVA.md](./SSOT_REGRA_DEFINITIVA.md) - Regras SSOT
3. [docs/DATA_MODELING.md](./docs/DATA_MODELING.md) - Modelagem de dados
4. [docs/OWNERSHIP_CONTEXT_PERMISSIONS.md](./docs/OWNERSHIP_CONTEXT_PERMISSIONS.md) - Permissões
5. [docs/CHECKLIST_CODE_REVIEW.md](./docs/CHECKLIST_CODE_REVIEW.md) - Code review

### Para Banco de Dados
1. [docs/MIGRATIONS.md](./docs/MIGRATIONS.md) - Migrações
2. [docs/SETUP_EXEC_SQL_GUIDE.md](./docs/SETUP_EXEC_SQL_GUIDE.md) - Guia SQL
3. [docs/TABELAS_ADMIN_SSOT.md](./docs/TABELAS_ADMIN_SSOT.md) - Tabelas admin
4. [docs/DATA_MODELING.md](./docs/DATA_MODELING.md) - Modelagem

### Para Segurança
1. [SECURITY.md](./SECURITY.md) - Políticas de segurança
2. [docs/OWNERSHIP_CONTEXT_PERMISSIONS.md](./docs/OWNERSHIP_CONTEXT_PERMISSIONS.md) - Permissões
3. [SSOT_REGRA_DEFINITIVA.md](./SSOT_REGRA_DEFINITIVA.md) - Regras SSOT

---

## 🔍 Como Encontrar Documentação

### Por Tópico

#### Arquitetura
- Visão geral: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Detalhes: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Histórico: [docs/archive/audits/](./docs/archive/audits/)

#### SSOT (Single Source of Truth)
- Regras: [SSOT_REGRA_DEFINITIVA.md](./SSOT_REGRA_DEFINITIVA.md)
- Modelagem: [docs/DATA_MODELING.md](./docs/DATA_MODELING.md)
- Migrações: [docs/archive/migrations/](./docs/archive/migrations/)

#### Mocks
- Organização atual: [docs/archive/reports/MIGRACAO_MOCKS_SSOT_RESULTADO.md](./docs/archive/reports/MIGRACAO_MOCKS_SSOT_RESULTADO.md)
- Análise estratégica: [docs/archive/reports/ANALISE_ESTRATEGIA_MOCKS.md](./docs/archive/reports/ANALISE_ESTRATEGIA_MOCKS.md)
- Proposta: [docs/archive/reports/PROPOSTA_ORGANIZACAO_MOCKS_SSOT.md](./docs/archive/reports/PROPOSTA_ORGANIZACAO_MOCKS_SSOT.md)

#### Funcionalidades
- Banners: [src/core/banners/docs/SISTEMA_BANNERS.md](../../src/core/banners/docs/SISTEMA_BANNERS.md)
- Header: [docs/HEADER_RESPONSIVO.md](./docs/HEADER_RESPONSIVO.md)
- Admin: [docs/TABELAS_ADMIN_SSOT.md](./docs/TABELAS_ADMIN_SSOT.md)

---

## 📊 Estado Atual do Projeto

### ✅ Estável
- Build passando (0 erros TypeScript)
- Servidor rodando sem erros
- HMR funcionando
- Conformidade SSOT: 100%
- Mocks organizados por domínio

### 🔄 Em Progresso
- Remoção gradual de @ts-nocheck
- Migração de dados legados restantes

### 📋 Documentação
- ✅ Organizada e consolidada
- ✅ Histórico arquivado
- ✅ Índice criado
- ✅ Estrutura clara

---

## 🛠️ Manutenção da Documentação

### Regras
1. Documentação ativa fica em `/docs` ou raiz
2. Documentação histórica vai para `/docs/archive`
3. Sempre atualizar este índice ao adicionar docs
4. Manter README.md como ponto de entrada principal

### Estrutura de Arquivos
```
/
├── README.md                    # Ponto de entrada
├── ARCHITECTURE.md              # Arquitetura principal
├── SSOT_REGRA_DEFINITIVA.md    # Regras SSOT
├── SECURITY.md                  # Segurança
├── DOCUMENTATION_INDEX.md       # Este arquivo
│
├── docs/                        # Documentação técnica ativa
│   ├── GETTING_STARTED.md
│   ├── ONBOARDING_DEVS.md
│   ├── CURRENT_RULES.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODELING.md
│   ├── MIGRATIONS.md
│   └── ...
│
└── docs/archive/                # Documentação histórica
    ├── migrations/              # Migrações passadas
    ├── audits/                  # Auditorias
    ├── reports/                 # Relatórios
    ├── gates/                   # Gates de qualidade
    ├── plans/                   # Planos de ação
    └── logs/                    # Logs e validações
```

---

## 📞 Suporte

Para dúvidas sobre documentação:
1. Consulte este índice
2. Verifique [docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md)
3. Leia [README.md](./README.md)
4. Abra uma issue no GitHub

---

**Versão**: 1.1.0  
**Última atualização**: 2026-03-23  
**Status**: ✅ Organizado
