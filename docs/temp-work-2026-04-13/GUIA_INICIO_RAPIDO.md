# ⚡ Guia de Início Rápido - 5 Minutos

**Objetivo**: Começar a correção do projeto em 5 minutos

---

## 🎯 PASSO 1: Entender o Problema (2 minutos)

O projeto tem **~2.100 problemas** divididos em 6 categorias:

1. 🗑️ **200+ arquivos desorganizados** na raiz
2. 💀 **100+ gambiarras** (@ts-nocheck)
3. 🚫 **29 violações SSOT** (acesso direto ao banco)
4. 🔐 **4 violações Session** (auth direto)
5. 📦 **5+ imports restritos** (Supabase direto)
6. ⚠️ **20+ parsing errors** (sintaxe)

**Total**: 1.735 erros de lint

---

## 🚀 PASSO 2: Preparar Ambiente (1 minuto)

```bash
# 1. Criar backup
git branch backup/before-cleanup

# 2. Criar branch de trabalho
git checkout -b fix/cleanup-ssot-violations

# 3. Verificar status atual
npm run lint 2>&1 | grep "error" | wc -l
# Deve mostrar ~1735 erros
```

---

## 🧹 PASSO 3: Executar Fase 1 (2 minutos)

```powershell
# Executar script de limpeza
.\scripts\cleanup-project-root.ps1

# Resultado esperado:
# ✅ 82 arquivos SQL movidos
# ✅ 53 scripts de debug movidos
# ✅ 12 scripts PowerShell movidos
# ✅ 18 arquivos arquivados
```

---

## ✅ PASSO 4: Validar e Commitar (1 minuto)

```bash
# Verificar mudanças
git status

# Adicionar tudo
git add .

# Commitar
git commit -m "chore: organizar estrutura de arquivos (Fase 1)"

# Verificar raiz limpa
ls -la
# Deve mostrar apenas arquivos essenciais
```

---

## 📚 PASSO 5: Próximos Passos

Agora você tem 3 opções:

### Opção A: Continuar Imediatamente (Recomendado)
```powershell
# Executar Fase 2
.\scripts\remove-ts-nocheck.ps1

# Depois corrigir erros TypeScript revelados
npm run typecheck
```

### Opção B: Ler Documentação Completa
```
1. LEIA-ME-PRIMEIRO.md (10 min)
2. PLANO_CORRECAO_EXECUTIVO.md (20 min)
3. scripts/fix-ssot-violations.md (15 min)
```

### Opção C: Pausar e Revisar
```bash
# Push da branch
git push origin fix/cleanup-ssot-violations

# Criar PR para revisão
# Continuar depois
```

---

## 🎯 CHECKLIST RÁPIDO

- [x] Entendi o problema
- [x] Criei backup
- [x] Criei branch
- [x] Executei Fase 1
- [x] Commitei mudanças
- [ ] Executar Fase 2
- [ ] Executar Fase 3
- [ ] Executar Fase 4
- [ ] Executar Fase 5
- [ ] Executar Fase 6
- [ ] Validar tudo
- [ ] Criar PR

---

## 📊 PROGRESSO

```
┌─────────────────────────────────────────────────────────┐
│ PROGRESSO                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  FASE 1: Limpeza Imediata           [█] 100%           │
│  FASE 2: Remover Gambiarras         [ ] 0%             │
│  FASE 3: Corrigir SSOT              [ ] 0%             │
│  FASE 4: Corrigir Session Context   [ ] 0%             │
│  FASE 5: Corrigir Imports           [ ] 0%             │
│  FASE 6: Corrigir Parsing           [ ] 0%             │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  PROGRESSO TOTAL:                   [█] 17%            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚨 PROBLEMAS COMUNS

### Problema: Script não executa
```powershell
# Solução: Permitir execução
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: Muitos erros após Fase 2
**Isso é esperado!** Os erros estavam escondidos pelo @ts-nocheck.

### Problema: Não sei como corrigir SSOT
Consultar: `scripts/fix-ssot-violations.md`

---

## 📚 DOCUMENTAÇÃO

- **LEIA-ME-PRIMEIRO.md** - Introdução completa
- **INDICE_AUDITORIA.md** - Índice de documentos
- **PLANO_CORRECAO_EXECUTIVO.md** - Plano completo
- **scripts/fix-ssot-violations.md** - Guia SSOT

---

## ✅ PRONTO!

Você completou a Fase 1! 🎉

**Próximo passo**: Executar Fase 2
```powershell
.\scripts\remove-ts-nocheck.ps1
```

---

**Tempo total**: 5 minutos  
**Progresso**: 17% (1/6 fases)  
**Faltam**: 14 dias úteis

**💪 Continue assim!**
