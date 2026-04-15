# Decisão Necessária - Blindagem Arquitetural Maps

## Situação Atual

Após tentativas de implementação, **o enforcement automatizado via ESLint não está funcional**.

### O que Foi Tentado

✅ Regras adicionadas ao `eslint.config.js` (flat config)
✅ Múltiplos blocos de configuração testados
✅ Paths e patterns testados
✅ Testes de violação criados e executados
🔴 **Nenhuma violação foi detectada**

### Causa Raiz

ESLint flat config (v9+) tem limitações conhecidas com:
- Path aliases do TypeScript (`@/...`)
- Patterns com wildcards em `no-restricted-imports`
- Detecção de imports relativos complexos

**Evidência completa**: `EVIDENCIA_BLINDAGEM_MAPS.md`

---

## Opções Disponíveis

### Opção A: Plugin ESLint Customizado

**Desenvolver `eslint-plugin-maps.cjs`** similar aos plugins existentes.

**Prós**:
- ✅ Enforcement real e automatizado
- ✅ Funciona com path aliases
- ✅ Mensagens customizadas
- ✅ Roda em CI/CD
- ✅ Previne violações durante desenvolvimento

**Contras**:
- ⏱️ Tempo: 4-8 horas de desenvolvimento
- 🔧 Manutenção adicional
- 📚 Curva de aprendizado

**Quando usar**: Se enforcement automatizado é crítico

---

### Opção B: Code Review Manual

**Confiar em code review** para detectar violações.

**Prós**:
- ⚡ Imediato (pode iniciar Etapa 2 agora)
- 💰 Sem custo de desenvolvimento
- 📝 Documentação já existe

**Contras**:
- 👤 Depende de humanos (erro possível)
- 📈 Não escala bem
- ⚠️ Violações podem passar
- 🔄 Correção após o fato

**Quando usar**: Se velocidade é mais importante que garantia

---

### Opção C: Híbrida (Recomendada)

**Code review agora + plugin em paralelo**.

**Prós**:
- ⚡ Inicia Etapa 2 imediatamente
- 🛡️ Proteção via code review
- 🔧 Plugin desenvolvido em paralelo
- 📈 Melhora incremental

**Contras**:
- 🔄 Período de transição com risco
- 👥 Requer disciplina do time

**Quando usar**: Balancear velocidade e qualidade

---

## Recomendação

### Opção C: Híbrida

**Fase 1 (Imediato)**:
1. ✅ Documentação completa criada
2. ✅ Regras definidas em `BLINDAGEM_ARQUITETURAL.md`
3. ✅ Code review checklist criado
4. ⏳ Iniciar Etapa 2 com code review rigoroso

**Fase 2 (Paralelo)**:
5. ⏳ Desenvolver `eslint-plugin-maps.cjs`
6. ⏳ Testar plugin
7. ⏳ Integrar em CI/CD
8. ⏳ Ativar enforcement automatizado

**Fase 3 (Futuro)**:
9. ⏳ Auditar código existente
10. ⏳ Corrigir violações encontradas
11. ⏳ Enforcement 100% automatizado

---

## Code Review Checklist

### Para Todos os PRs de Maps

**Imports**:
- [ ] Nenhum import direto de `@/integrations/maps/providers/*`
- [ ] Nenhum import direto de `../integrations/maps/providers/*`
- [ ] Modules não importam de `@/integrations/maps`
- [ ] Apenas `@/core/maps` é usado em modules

**Projeção de Entidades**:
- [ ] Usa `mapEntityProjection.projectBusiness()` etc
- [ ] Não cria objetos `MapMarker` manualmente
- [ ] Não duplica lógica de transformação

**Providers**:
- [ ] Usa `providerRegistry.getTileProvider()` etc
- [ ] Não instancia providers diretamente
- [ ] Não importa providers fora de `setup.ts`

**Arquitetura**:
- [ ] Respeita SSOT (Database → Services → Hooks → Components)
- [ ] Não chama Supabase diretamente em componentes
- [ ] Não duplica lógica em múltiplos lugares

---

## Integração com CI

### Mesmo Sem Plugin

**Adicionar ao workflow**:

```yaml
# .github/workflows/ci.yml
- name: Code Review Checklist
  run: |
    echo "⚠️ ATENÇÃO: Enforcement automatizado de maps não está ativo"
    echo "Revisar manualmente:"
    echo "- Imports de providers"
    echo "- Projeção de entidades"
    echo "- Separação de camadas"
    
- name: Lint
  run: npm run lint
  
- name: TypeCheck
  run: npm run typecheck
```

---

## Próximos Passos

### Se Escolher Opção A (Plugin)

1. Criar `eslint-plugin-maps.cjs`
2. Implementar regras:
   - `no-direct-provider-import`
   - `no-cross-layer-import`
   - `no-manual-projection` (opcional)
3. Testar com violações
4. Integrar em `eslint.config.js`
5. Validar em CI
6. Então iniciar Etapa 2

**Tempo**: 4-8 horas

---

### Se Escolher Opção B (Code Review)

1. ✅ Documentação já existe
2. ✅ Checklist já criado
3. Treinar time nas regras
4. Iniciar Etapa 2 imediatamente
5. Code review rigoroso em todos os PRs

**Tempo**: Imediato

---

### Se Escolher Opção C (Híbrida) - RECOMENDADA

1. ✅ Documentação já existe
2. ✅ Checklist já criado
3. Iniciar Etapa 2 com code review
4. Desenvolver plugin em paralelo
5. Ativar plugin quando pronto
6. Auditar código existente

**Tempo**: Imediato para Etapa 2, plugin em 1-2 semanas

---

## Sua Decisão

**Qual opção você escolhe?**

- [ ] **Opção A**: Desenvolver plugin antes de Etapa 2 (4-8h)
- [ ] **Opção B**: Code review manual, iniciar Etapa 2 agora
- [ ] **Opção C**: Híbrida - code review + plugin paralelo (RECOMENDADA)

**Ou outra abordagem?**

---

**Aguardando sua decisão para prosseguir.**

**Data**: 2026-04-03
**Status**: Decisão pendente
