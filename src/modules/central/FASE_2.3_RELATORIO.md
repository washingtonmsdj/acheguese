# Relatório Fase 2.3 - Migração de Sub-rotas de Mobilidade

**Data**: 2025-01-04  
**Status**: ✅ CONCLUÍDA

---

## Objetivo

Reduzir dependência das rotas legadas /perfil/mobilidade/* criando sub-rotas reais sob /central/motorista/* e /central/motoboy/*, mantendo compatibilidade com links antigos.

---

## Arquivos Criados (10)

### Sub-rotas de Motorista (5)

**1. src/modules/central/pages/motorista/CentralMotoristaCadastroPage.tsx**
- Página wrapper para cadastro de motorista na Central (/central/motorista/cadastro)
- Redireciona para /perfil/mobilidade/motorista/cadastro
- Motivo: A migração completa do conteúdo é complexa e será feita em fases futuras

**2. src/modules/central/pages/motorista/CentralMotoristaDisponibilidadePage.tsx**
- Página wrapper para disponibilidade de motorista na Central (/central/motorista/disponibilidade)
- Redireciona para /perfil/mobilidade/motorista/disponibilidade

**3. src/modules/central/pages/motorista/CentralMotoristaCorridasPage.tsx**
- Página wrapper para corridas de motorista na Central (/central/motorista/corridas)
- Redireciona para /perfil/mobilidade/motorista/corridas

**4. src/modules/central/pages/motorista/CentralMotoristaGanhosPage.tsx**
- Página wrapper para ganhos de motorista na Central (/central/motorista/ganhos)
- Redireciona para /perfil/mobilidade/motorista/ganhos

**5. src/modules/central/pages/motorista/CentralMotoristaConfiguracoesPage.tsx**
- Página wrapper para configurações de motorista na Central (/central/motorista/configuracoes)
- Redireciona para /perfil/mobilidade/motorista/configuracoes

### Sub-rotas de Motoboy (5)

**6. src/modules/central/pages/motoboy/CentralMotoboyCadastroPage.tsx**
- Página wrapper para cadastro de motoboy na Central (/central/motoboy/cadastro)
- Redireciona para /perfil/mobilidade/motoboy/cadastro

**7. src/modules/central/pages/motoboy/CentralMotoboyDisponibilidadePage.tsx**
- Página wrapper para disponibilidade de motoboy na Central (/central/motoboy/disponibilidade)
- Redireciona para /perfil/mobilidade/motoboy/disponibilidade

**8. src/modules/central/pages/motoboy/CentralMotoboyEntregasPage.tsx**
- Página wrapper para entregas de motoboy na Central (/central/motoboy/entregas)
- Redireciona para /perfil/mobilidade/motoboy/entregas

**9. src/modules/central/pages/motoboy/CentralMotoboyGanhosPage.tsx**
- Página wrapper para ganhos de motoboy na Central (/central/motoboy/ganhos)
- Redireciona para /perfil/mobilidade/motoboy/ganhos

**10. src/modules/central/pages/motoboy/CentralMotoboyConfiguracoesPage.tsx**
- Página wrapper para configurações de motoboy na Central (/central/motoboy/configuracoes)
- Redireciona para /perfil/mobilidade/motoboy/configuracoes

---

## Arquivos Modificados (4)

### 1. src/core/mobility/hooks/useMobilityUrls.ts
**Alterações:**
- Adicionado objeto `motorista` com sub-rotas da Central:
  - home: "/central/motorista"
  - cadastro: "/central/motorista/cadastro"
  - disponibilidade: "/central/motorista/disponibilidade"
  - corridas: "/central/motorista/corridas"
  - ganhos: "/central/motorista/ganhos"
  - configuracoes: "/central/motorista/configuracoes"
- Adicionado objeto `motoboyRoutes` com sub-rotas da Central:
  - home: "/central/motoboy"
  - cadastro: "/central/motoboy/cadastro"
  - disponibilidade: "/central/motoboy/disponibilidade"
  - entregas: "/central/motoboy/entregas"
  - ganhos: "/central/motoboy/ganhos"
  - configuracoes: "/central/motoboy/configuracoes"

### 2. src/core/routing/hooks/useAppUrls.ts
**Alterações:**
- Atualizado `profile.mobilidade.motorista` para usar rotas da Central:
  - cadastro: "/central/motorista/cadastro"
  - disponibilidade: "/central/motorista/disponibilidade"
  - corridas: "/central/motorista/corridas"
  - ganhos: "/central/motorista/ganhos"
  - configuracoes: "/central/motorista/configuracoes"
- Atualizado `profile.mobilidade.motoboy` para usar rotas da Central:
  - cadastro: "/central/motoboy/cadastro"
  - disponibilidade: "/central/motoboy/disponibilidade"
  - entregas: "/central/motoboy/entregas"
  - ganhos: "/central/motoboy/ganhos"
  - configuracoes: "/central/motoboy/configuracoes"

### 3. src/modules/profile/utils/profileMobilityNavigation.ts
**Alterações:**
- Atualizado `profileMobilityRoutes.motorista` para usar rotas da Central:
  - cadastro: "/central/motorista/cadastro"
  - disponibilidade: "/central/motorista/disponibilidade"
  - corridas: "/central/motorista/corridas"
  - ganhos: "/central/motorista/ganhos"
  - configuracoes: "/central/motorista/configuracoes"
- Atualizado `profileMobilityRoutes.motoboy` para usar rotas da Central:
  - cadastro: "/central/motoboy/cadastro"
  - disponibilidade: "/central/motoboy/disponibilidade"
  - entregas: "/central/motoboy/entregas"
  - ganhos: "/central/motoboy/ganhos"
  - configuracoes: "/central/motoboy/configuracoes"

### 4. src/app/routes/lazyImports.ts
**Alterações:**
- Adicionado lazy imports para sub-rotas de motorista:
  - CentralMotoristaCadastroPage
  - CentralMotoristaDisponibilidadePage
  - CentralMotoristaCorridasPage
  - CentralMotoristaGanhosPage
  - CentralMotoristaConfiguracoesPage
- Adicionado lazy imports para sub-rotas de motoboy:
  - CentralMotoboyCadastroPage
  - CentralMotoboyDisponibilidadePage
  - CentralMotoboyEntregasPage
  - CentralMotoboyGanhosPage
  - CentralMotoboyConfiguracoesPage

### 5. src/app/routes/AppRoutes.tsx
**Alterações:**
- Adicionado sub-rotas para motorista sob DriverGuard:
  - /central/motorista/cadastro
  - /central/motorista/disponibilidade
  - /central/motorista/corridas
  - /central/motorista/ganhos
  - /central/motorista/configuracoes
- Adicionado sub-rotas para motoboy sob DriverGuard:
  - /central/motoboy/cadastro
  - /central/motoboy/disponibilidade
  - /central/motoboy/entregas
  - /central/motoboy/ganhos
  - /central/motoboy/configuracoes

---

## Sub-rotas Migradas

### Motorista (5 rotas)
| Rota Central | Rota Legada | Status |
|-------------|-------------|--------|
| /central/motorista/cadastro | /perfil/mobilidade/motorista/cadastro | ✅ Wrapper |
| /central/motorista/disponibilidade | /perfil/mobilidade/motorista/disponibilidade | ✅ Wrapper |
| /central/motorista/corridas | /perfil/mobilidade/motorista/corridas | ✅ Wrapper |
| /central/motorista/ganhos | /perfil/mobilidade/motorista/ganhos | ✅ Wrapper |
| /central/motorista/configuracoes | /perfil/mobilidade/motorista/configuracoes | ✅ Wrapper |

### Motoboy (5 rotas)
| Rota Central | Rota Legada | Status |
|-------------|-------------|--------|
| /central/motoboy/cadastro | /perfil/mobilidade/motoboy/cadastro | ✅ Wrapper |
| /central/motoboy/disponibilidade | /perfil/mobilidade/motoboy/disponibilidade | ✅ Wrapper |
| /central/motoboy/entregas | /perfil/mobilidade/motoboy/entregas | ✅ Wrapper |
| /central/motoboy/ganhos | /perfil/mobilidade/motoboy/ganhos | ✅ Wrapper |
| /central/motoboy/configuracoes | /perfil/mobilidade/motoboy/configuracoes | ✅ Wrapper |

---

## Rotas Legadas Mantidas

### Rotas Legadas que Continuam Funcionando
| Rota Legada | Status | Motivo |
|-------------|--------|--------|
| /perfil/mobilidade | ✅ Ativa | Hub de mobilidade legado |
| /perfil/mobilidade/motorista | ✅ Ativa | Fallback para links antigos |
| /perfil/mobilidade/motorista/cadastro | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motorista/disponibilidade | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motorista/corridas | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motorista/ganhos | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motorista/configuracoes | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motoboy | ✅ Ativa | Fallback para links antigos |
| /perfil/mobilidade/motoboy/cadastro | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motoboy/disponibilidade | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motoboy/entregas | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motoboy/ganhos | ✅ Ativa | Página real usada pelo wrapper |
| /perfil/mobilidade/motoboy/configuracoes | ✅ Ativa | Página real usada pelo wrapper |

---

## Cenários Testados (Análise de Código)

### 1. Motorista acessa /central/motorista/cadastro
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motorista/cadastro
- DriverGuard valida modo correto (motorista vs motoboy)
- Página legada é carregada

### 2. Motorista acessa /central/motorista/disponibilidade
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motorista/disponibilidade
- DriverGuard valida modo correto
- Página legada é carregada

### 3. Motorista acessa /central/motorista/corridas
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motorista/corridas
- DriverGuard valida modo correto
- Página legada é carregada

### 4. Motorista acessa /central/motorista/ganhos
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motorista/ganhos
- DriverGuard valida modo correto
- Página legada é carregada

### 5. Motorista acessa /central/motorista/configuracoes
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motorista/configuracoes
- DriverGuard valida modo correto
- Página legada é carregada

### 6. Motoboy acessa /central/motoboy/cadastro
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motoboy/cadastro
- DriverGuard valida modo correto (motoboy vs motorista)
- Página legada é carregada

### 7. Motoboy acessa /central/motoboy/disponibilidade
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motoboy/disponibilidade
- DriverGuard valida modo correto
- Página legada é carregada

### 8. Motoboy acessa /central/motoboy/entregas
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motoboy/entregas
- DriverGuard valida modo correto
- Página legada é carregada

### 9. Motoboy acessa /central/motoboy/ganhos
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motoboy/ganhos
- DriverGuard valida modo correto
- Página legada é carregada

### 10. Motoboy acessa /central/motoboy/configuracoes
**Resultado:** ✅
- Wrapper redireciona para /perfil/mobilidade/motoboy/configuracoes
- DriverGuard valida modo correto
- Página legada é carregada

### 11. Motorista não acessa rota exclusiva de motoboy
**Resultado:** ✅
- DriverGuard com service="motoboy" bloqueia motorista
- Motorista tentando /central/motoboy/* é bloqueado

### 12. Motoboy não acessa rota exclusiva de motorista
**Resultado:** ✅
- DriverGuard com service="motorista" bloqueia motoboy
- Motoboy tentando /central/motorista/* é bloqueado

### 13. Rotas legadas continuam funcionando
**Resultado:** ✅
- /perfil/mobilidade/motorista/* continua funcionando
- /perfil/mobilidade/motoboy/* continua funcionando
- Deep links antigos não quebram

---

## Gates Finais

**Resultados:**
- ✅ lint passou (sem warnings)
- ✅ typecheck passou
- ✅ build passou (1m 55s)

---

## Compatibilidade Mantida

### Não Apagado
- ✅ Rotas legadas em /perfil/mobilidade/*
- ✅ Sub-rotas específicas de mobilidade
- ✅ Deep links antigos

### Não Feito
- ✅ Não criar sidebar/layout complexo da Central
- ✅ Não migrar conteúdo real das páginas (apenas wrappers)
- ✅ Não refatorar billing/planos
- ✅ Não mexer no /buscar
- ✅ Não alterar modelo de banco

---

## Abordagem de Migração

### Estratégia Adotada
1. **Páginas Wrapper**: Criadas páginas wrapper simples que redirecionam para as páginas legadas
   - Motivo: A migração completa do conteúdo é complexa e arriscada
   - Benefício: Rotas da Central existem sem duplicar regra complexa
   - SSOT: Páginas legadas continuam sendo a fonte única de verdade

2. **Hooks de URL Atualizados**: useMobilityUrls, useAppUrls, profileMobilityNavigation
   - Default: Rotas da Central
   - Compatibilidade: Rotas legadas continuam funcionando
   - Benefício: Links internos apontam para /central por padrão

3. **Guards Mantidos**: DriverGuard continua protegendo as rotas
   - Valida motorista vs motoboy antes de permitir acesso
   - Executa antes do wrapper redirecionar

### Próximos Passos Recomendados

### Fase 2.4 (Sugestão)
1. Migrar conteúdo real das páginas wrapper
   - Extrair componentes compartilhados das páginas legadas
   - Criar páginas reais em /central/motorista/* e /central/motoboy/*
   - Remover wrappers após migração completa

2. Criar sidebar/layout próprio para Central
   - Navegação lateral específica para Central
   - Separar visualmente gestão de perfil pessoal

3. Remover redirecionamentos para /perfil após migração completa
   - Quando todas sub-rotas estiverem migradas
   - Manter rotas legadas apenas como fallback temporário

### Notas Importantes
- Sub-rotas da Central agora existem e são acessíveis
- Hooks de URL usam rotas da Central por padrão
- Rotas legadas continuam funcionando como fallback
- DriverGuard continua validando modo correto
- Gates de qualidade passaram sem erros
- Sem quebra de funcionalidades existentes
