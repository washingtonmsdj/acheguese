# 🔍 Monitoramento Pós-Rollout - Identidade Pública

## Objetivo: Acompanhamento dos Primeiros 7 Dias em Produção

---

## 📅 Cronograma de Monitoramento

### Dia 1 (D+0) - Lançamento
**Frequência:** A cada 2 horas
**Foco:** Detecção imediata de problemas críticos

### Dias 2-3 (D+1 a D+2)
**Frequência:** A cada 4 horas
**Foco:** Estabilização e ajustes rápidos

### Dias 4-7 (D+3 a D+6)
**Frequência:** 2x por dia (manhã e tarde)
**Foco:** Tendências e otimizações

---

## 1. Erros de Disponibilidade

### O que Monitorar
```sql
-- Erros de checkAvailability nas últimas 2h
SELECT COUNT(*) as error_count
FROM logs
WHERE 
  level = 'error'
  AND message LIKE '[PublicIdentityService] checkAvailability error%'
  AND timestamp > NOW() - INTERVAL 2 HOUR;
```

### Critérios de Alerta
- 🔴 **Crítico:** > 10 erros em 2h
- ⚠️ **Atenção:** > 5 erros em 2h
- ✅ **Normal:** < 5 erros em 2h

### Ações
- **Crítico:** 
  - Verificar conectividade com banco de dados
  - Verificar se tabelas existem e têm dados
  - Considerar rollback se persistir > 1h

- **Atenção:**
  - Investigar logs de erro específicos
  - Verificar se é erro pontual ou padrão
  - Documentar para análise posterior

---

## 2. Erros de Save

### O que Monitorar
```sql
-- Taxa de erro de save nas últimas 2h
SELECT 
  COUNT(CASE WHEN message LIKE '%save_error%' THEN 1 END) as errors,
  COUNT(CASE WHEN message LIKE '%save_attempt%' THEN 1 END) as attempts,
  (COUNT(CASE WHEN message LIKE '%save_error%' THEN 1 END) * 100.0 / 
   NULLIF(COUNT(CASE WHEN message LIKE '%save_attempt%' THEN 1 END), 0)) as error_rate
FROM logs
WHERE 
  message LIKE '%identity_change_save%'
  AND timestamp > NOW() - INTERVAL 2 HOUR;
```

### Critérios de Alerta
- 🔴 **Crítico:** Taxa de erro > 5%
- ⚠️ **Atenção:** Taxa de erro > 2%
- ✅ **Normal:** Taxa de erro < 2%

### Ações
- **Crítico:**
  - Verificar triggers de histórico
  - Verificar constraints de banco
  - Verificar se cooldown está funcionando
  - Rollback se > 10% de erro

- **Atenção:**
  - Analisar erros específicos
  - Verificar se há padrão (domínio, horário)
  - Preparar hotfix se necessário

---

## 3. Páginas Públicas com 404 Inesperado

### O que Monitorar
```sql
-- Taxa de 404 por domínio nas últimas 2h
SELECT 
  JSON_EXTRACT(metadata, '$.entityType') as entity_type,
  COUNT(*) as not_found_count,
  (SELECT COUNT(*) FROM logs WHERE message LIKE '[PublicPage] page_view%' 
   AND JSON_EXTRACT(metadata, '$.entityType') = entity_type
   AND timestamp > NOW() - INTERVAL 2 HOUR) as total_views,
  (COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM logs WHERE message LIKE '[PublicPage] page_view%' 
   AND JSON_EXTRACT(metadata, '$.entityType') = entity_type
   AND timestamp > NOW() - INTERVAL 2 HOUR), 0)) as not_found_rate
FROM logs
WHERE 
  message LIKE '[PublicPage] page_not_found%'
  AND timestamp > NOW() - INTERVAL 2 HOUR
GROUP BY entity_type;
```

### Critérios de Alerta
- 🔴 **Crítico:** Taxa de 404 > 15%
- ⚠️ **Atenção:** Taxa de 404 > 8%
- ✅ **Normal:** Taxa de 404 < 8%

### Ações
- **Crítico:**
  - Verificar se redirect está funcionando (business)
  - Verificar se dados estão sendo salvos corretamente
  - Verificar rotas e resolvers
  - Considerar desabilitar feature se > 20%

- **Atenção:**
  - Analisar quais identifiers estão dando 404
  - Verificar se são tentativas de acesso a slugs antigos
  - Documentar padrões para análise

---

## 4. Falhas de Rota

### O que Monitorar
```bash
# Verificar erros de rota no console do navegador
# Acessar manualmente:
- /empresas/ba/salvador/teste-slug
- /p/teste-slug
- /u/teste-username
- /profissionais/ba/salvador/teste-slug
```

### Critérios de Alerta
- 🔴 **Crítico:** Qualquer rota retorna erro 500
- ⚠️ **Atenção:** Rota carrega mas com dados incorretos
- ✅ **Normal:** Todas as rotas carregam corretamente

### Ações
- **Crítico:**
  - Verificar logs do servidor
  - Verificar se resolvers estão funcionando
  - Rollback imediato se múltiplas rotas falhando

- **Atenção:**
  - Verificar mapeamento de dados
  - Verificar se adapters estão retornando dados corretos
  - Preparar correção

---

## 5. Regressões em Forms

### O que Monitorar
```bash
# Testar manualmente cada form:
1. Criar empresa nova
2. Editar empresa existente
3. Criar perfil pessoal
4. Editar perfil pessoal
5. Criar profissional
6. Editar profissional
```

### Checklist de Validação
- [ ] Campo de slug/username aparece
- [ ] Badge de disponibilidade funciona
- [ ] Auto-sugestão funciona
- [ ] Validação de formato funciona
- [ ] Save funciona sem mudança de slug
- [ ] Save funciona com mudança de slug
- [ ] Dialog de confirmação aparece quando deve
- [ ] Cooldown bloqueia quando deve
- [ ] Mensagens de erro são claras

### Critérios de Alerta
- 🔴 **Crítico:** Qualquer funcionalidade core quebrada
- ⚠️ **Atenção:** Funcionalidade secundária com problema
- ✅ **Normal:** Tudo funcionando

### Ações
- **Crítico:**
  - Rollback imediato
  - Investigar causa raiz
  - Preparar hotfix

- **Atenção:**
  - Documentar problema
  - Avaliar impacto
  - Planejar correção

---

## 6. Problemas de UX no Dialog de Confirmação

### O que Monitorar
```sql
-- Taxa de cancelamento do dialog nas últimas 2h
SELECT 
  JSON_EXTRACT(metadata, '$.entityType') as entity_type,
  COUNT(CASE WHEN message LIKE '%confirmed%' THEN 1 END) as confirmed,
  COUNT(CASE WHEN message LIKE '%cancelled%' THEN 1 END) as cancelled,
  COUNT(CASE WHEN message LIKE '%opened%' THEN 1 END) as opened,
  (COUNT(CASE WHEN message LIKE '%cancelled%' THEN 1 END) * 100.0 / 
   NULLIF(COUNT(CASE WHEN message LIKE '%opened%' THEN 1 END), 0)) as cancel_rate
FROM logs
WHERE 
  message LIKE '[IdentityChangeConfirmDialog]%'
  AND timestamp > NOW() - INTERVAL 2 HOUR
GROUP BY entity_type;
```

### Critérios de Alerta
- 🔴 **Crítico:** Taxa de cancelamento > 60%
- ⚠️ **Atenção:** Taxa de cancelamento > 40%
- ✅ **Normal:** Taxa de cancelamento < 40%

### Ações
- **Crítico:**
  - Revisar texto do dialog
  - Verificar se está assustando usuários
  - Considerar ajustar mensagem

- **Atenção:**
  - Coletar feedback de usuários
  - Analisar por domínio (business vs profile)
  - Planejar melhorias de UX

---

## 7. Performance e Latência

### O que Monitorar
```sql
-- Tempo médio de resposta de checkAvailability
SELECT 
  AVG(TIMESTAMPDIFF(MICROSECOND, 
    LAG(timestamp) OVER (ORDER BY timestamp), 
    timestamp)) / 1000 as avg_response_ms
FROM logs
WHERE 
  message LIKE '[PublicIdentityService] checkAvailability%'
  AND timestamp > NOW() - INTERVAL 2 HOUR;
```

### Critérios de Alerta
- 🔴 **Crítico:** Tempo médio > 1000ms
- ⚠️ **Atenção:** Tempo médio > 500ms
- ✅ **Normal:** Tempo médio < 500ms

### Ações
- **Crítico:**
  - Verificar índices de banco de dados
  - Verificar carga do servidor
  - Considerar cache

- **Atenção:**
  - Monitorar tendência
  - Planejar otimizações
  - Verificar queries lentas

---

## 📊 Dashboard de Monitoramento

### Métricas Principais (Atualização a cada 5min)

#### Saúde Geral
- ✅ Taxa de sucesso de save: ___%
- ✅ Taxa de disponibilidade: ___%
- ✅ Taxa de 404: ___%
- ✅ Tempo médio de resposta: ___ms

#### Por Domínio
| Domínio | Saves | Erros | 404s | Cooldown |
|---------|-------|-------|------|----------|
| Business | ___ | ___ | ___ | ___ |
| Profile | ___ | ___ | ___ | ___ |
| Professional | ___ | ___ | ___ | ___ |

#### Alertas Ativos
- 🔴 Críticos: ___
- ⚠️ Atenção: ___
- ✅ Normal: ___

---

## 📝 Checklist Diário

### Manhã (9h-10h)
- [ ] Verificar dashboard de métricas
- [ ] Revisar alertas da noite
- [ ] Executar queries de monitoramento
- [ ] Testar manualmente 1 fluxo de cada domínio
- [ ] Documentar problemas encontrados

### Tarde (15h-16h)
- [ ] Verificar dashboard de métricas
- [ ] Revisar alertas do dia
- [ ] Executar queries de monitoramento
- [ ] Analisar tendências
- [ ] Planejar ações para próximo dia

### Fim do Dia
- [ ] Consolidar relatório do dia
- [ ] Atualizar status de alertas
- [ ] Comunicar problemas críticos
- [ ] Preparar ações para D+1

---

## 📋 Template de Relatório Diário

```markdown
# Relatório de Monitoramento - Dia X

**Data:** ___/___/___
**Período:** 00:00 - 23:59
**Responsável:** ___________

## Métricas Gerais
- Total de saves: ___
- Taxa de sucesso: ___%
- Total de 404s: ___
- Taxa de 404: ___%
- Erros críticos: ___

## Alertas
- 🔴 Críticos: ___ (descrição)
- ⚠️ Atenção: ___ (descrição)

## Problemas Identificados
1. ___________
2. ___________
3. ___________

## Ações Tomadas
1. ___________
2. ___________
3. ___________

## Próximos Passos
1. ___________
2. ___________
3. ___________

## Status Geral
[ ] ✅ Tudo funcionando normalmente
[ ] ⚠️ Problemas menores identificados
[ ] 🔴 Problemas críticos - ação necessária
```

---

## 🚨 Plano de Rollback

### Quando Fazer Rollback
- Taxa de erro de save > 10% por mais de 1h
- Taxa de 404 > 20% por mais de 1h
- Qualquer funcionalidade core quebrada
- Múltiplos alertas críticos simultâneos

### Como Fazer Rollback
1. Comunicar equipe e stakeholders
2. Reverter deploy para versão anterior
3. Verificar se sistema voltou ao normal
4. Documentar causa raiz
5. Planejar correção e novo deploy

### Após Rollback
1. Analisar logs e identificar causa
2. Corrigir problema em ambiente de staging
3. Testar exaustivamente
4. Planejar novo rollout com mais cautela
5. Comunicar novo cronograma

---

## ✅ Critérios de Sucesso (Após 7 Dias)

### Métricas Mínimas
- ✅ Taxa de sucesso de save > 95%
- ✅ Taxa de 404 < 8%
- ✅ Taxa de erro < 2%
- ✅ Tempo de resposta < 500ms
- ✅ Zero alertas críticos não resolvidos

### Qualitativo
- ✅ Nenhum rollback necessário
- ✅ Feedback positivo de usuários
- ✅ Equipe confiante na estabilidade
- ✅ Documentação completa e atualizada

**Se todos os critérios forem atendidos:** Feature considerada estável e pronta para uso geral.
