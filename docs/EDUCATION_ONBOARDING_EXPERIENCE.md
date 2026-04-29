# 📚 EDUCATION MODULE - EXPERIÊNCIA DE CADASTRO

**O que uma instituição de ensino encontra ao se cadastrar**

---

## 🎯 PÁGINA DE CADASTRO/SETUP

**Rota**: `/perfil/empresas/:businessId/education/setup`

---

## 📋 FORMULÁRIO DE CADASTRO

### 1️⃣ TIPO DE INSTITUIÇÃO

**Campo**: Dropdown "Tipo de Instituição"

**Opções disponíveis**:
- 🏫 **Escola** - Escolas regulares de ensino fundamental/médio
- 🎓 **Universidade** - Instituições de ensino superior
- 📖 **Curso/Preparatório** - Cursos preparatórios (vestibular, concursos)
- 🌍 **Escola de Idiomas** - Ensino de línguas estrangeiras
- 👶 **Creche/Berçário** - Educação infantil (0-3 anos)
- ➕ **Outro** - Outros tipos de instituição

**Obrigatório**: ✅ Sim

---

### 2️⃣ NICHO

**Campo**: Dropdown "Nicho"

**Opções disponíveis**:

#### ✅ Nichos MVP (Completos)
- **Escola Regular** 
  - Status: 🟢 Básico
  - Limites: 20 programas, 10 eventos, 500 leads/mês
  - Capabilities: 6 ativas

- **Creche/Berçário**
  - Status: 🟢 Básico
  - Limites: 15 programas, 8 eventos, 300 leads/mês
  - Capabilities: 5 ativas

- **Escola de Idiomas**
  - Status: 🟢 Básico
  - Limites: 25 programas, 12 eventos, 600 leads/mês
  - Capabilities: 6 ativas

- **Curso Preparatório**
  - Status: 🟢 Básico
  - Limites: 30 programas, 15 eventos, 800 leads/mês
  - Capabilities: 7 ativas

#### ⚠️ Nichos Beta (Parciais)
- **Escola Técnica** - Status: 🟡 Beta
- **Centro de Reforço** - Status: 🟡 Beta
- **Escola de Música** - Status: 🟡 Beta
- **Escola de Esportes** - Status: 🟡 Beta

**Obrigatório**: ✅ Sim

**Ajuda**: "O nicho define as funcionalidades disponíveis para sua instituição."

---

### 3️⃣ DETALHES DO NICHO SELECIONADO

**Quando um nicho é selecionado, aparece um card com**:

```
┌─────────────────────────────────────────┐
│ 🏫 Escola Regular              [Básico] │
│                                         │
│ Instituições de ensino fundamental e    │
│ médio com foco em educação regular.     │
│ ─────────────────────────────────────── │
│ Limites: 20 programas, 10 eventos,      │
│          500 leads/mês                  │
│ Capabilities: 6 ativas                  │
└─────────────────────────────────────────┘
```

**Se for nicho Beta, aparece banner**:
```
⚠️ Este nicho está em Beta
Algumas funcionalidades podem estar limitadas.
[Saiba mais sobre upgrade]
```

---

### 4️⃣ DESCRIÇÃO

**Campo**: Textarea "Sobre a instituição"

**Placeholder**: "Descreva sua instituição, diferenciais, metodologia..."

**Características**:
- Máximo: 500 caracteres
- Contador: "0/500 caracteres"
- Opcional: ⚪ Não obrigatório

**Exemplo do que escrever**:
```
"Escola com 25 anos de tradição em educação de qualidade.
Metodologia construtivista, professores especializados,
infraestrutura completa com laboratórios e quadra esportiva.
Turmas reduzidas para melhor acompanhamento individual."
```

---

### 5️⃣ CONTATO

**Campo**: Input "WhatsApp"

**Placeholder**: "+5588999999999"

**Formato esperado**: +55 (DDD) 9XXXX-XXXX

**Ajuda**: "Número que será exibido para contato na página pública."

**Opcional**: ⚪ Não obrigatório (mas recomendado)

---

## 🎨 VISUAL DA PÁGINA

```
┌────────────────────────────────────────────────────┐
│ ← Voltar                                           │
│                                                    │
│ ⚙️  Configurar Educação                            │
│    Configure os dados da sua instituição          │
│                                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ 🏫 Tipo de Instituição                      │   │
│ │                                             │   │
│ │ Tipo: [Selecione o tipo ▼]                 │   │
│ │                                             │   │
│ │ Nicho: [Selecione o nicho ▼]               │   │
│ │ O nicho define as funcionalidades...       │   │
│ │                                             │   │
│ │ [Card com detalhes do nicho selecionado]   │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ 📄 Descrição                                │   │
│ │                                             │   │
│ │ Sobre a instituição:                        │   │
│ │ ┌─────────────────────────────────────┐    │   │
│ │ │ Descreva sua instituição...         │    │   │
│ │ │                                     │    │   │
│ │ │                                     │    │   │
│ │ └─────────────────────────────────────┘    │   │
│ │                              0/500 caracteres│   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ 📞 Contato                                  │   │
│ │                                             │   │
│ │ WhatsApp: [+5588999999999]                 │   │
│ │ Número que será exibido na página pública  │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ [💾 Salvar Configurações]  [Cancelar]             │
└────────────────────────────────────────────────────┘
```

---

## ✅ VALIDAÇÕES

### Ao Clicar em "Salvar"

**Campos obrigatórios**:
- ✅ Tipo de Instituição
- ✅ Nicho

**Se faltar algo**:
```
❌ Campos obrigatórios
Selecione o tipo de instituição e o nicho.
```

**Se tudo OK**:
```
✅ Configuração salva
As alterações foram salvas com sucesso.
```

**Redirecionamento**: `/perfil/empresas/:businessId/education` (Dashboard)

---

## 🎯 APÓS O CADASTRO

### O que acontece depois de salvar?

1. **Perfil criado** em status `draft` (rascunho)
2. **Redirecionado** para o Dashboard Education
3. **Pode adicionar**:
   - Programas/cursos
   - Eventos
   - Informações adicionais

4. **Quando pronto**, pode **publicar** o perfil
5. **Após publicar**, aparece na **vitrine pública**

---

## 📊 EXEMPLO COMPLETO DE CADASTRO

### Escola Regular

```yaml
Tipo de Instituição: Escola
Nicho: Escola Regular
Descrição: |
  Escola com 25 anos de tradição em educação de qualidade.
  Metodologia construtivista, professores especializados,
  infraestrutura completa com laboratórios e quadra esportiva.
  Turmas reduzidas para melhor acompanhamento individual.
WhatsApp: +5571999887766
```

**Resultado**:
- ✅ Perfil criado
- 📊 Limites: 20 programas, 10 eventos, 500 leads/mês
- 🎯 Capabilities: Gestão de programas, pipeline de leads, eventos, analytics
- 📍 Status: Rascunho (precisa publicar)

---

### Creche/Berçário

```yaml
Tipo de Instituição: Creche/Berçário
Nicho: Creche/Berçário
Descrição: |
  Creche especializada em educação infantil de 0 a 3 anos.
  Ambiente seguro e acolhedor, equipe pedagógica qualificada,
  alimentação balanceada, atividades lúdicas e educativas.
  Horário flexível para atender necessidades das famílias.
WhatsApp: +5571988776655
```

**Resultado**:
- ✅ Perfil criado
- 📊 Limites: 15 programas, 8 eventos, 300 leads/mês
- 🎯 Capabilities: Gestão de turmas, comunicação com pais, eventos
- 📍 Status: Rascunho

---

### Escola de Idiomas

```yaml
Tipo de Instituição: Escola de Idiomas
Nicho: Escola de Idiomas
Descrição: |
  Escola de idiomas com metodologia comunicativa.
  Professores nativos e certificados, turmas reduzidas,
  material didático moderno, preparação para certificações
  internacionais (TOEFL, IELTS, DELE, DELF).
WhatsApp: +5571987665544
```

**Resultado**:
- ✅ Perfil criado
- 📊 Limites: 25 programas, 12 eventos, 600 leads/mês
- 🎯 Capabilities: Gestão de cursos, níveis, certificações
- 📍 Status: Rascunho

---

## 🚀 PRÓXIMOS PASSOS APÓS CADASTRO

### No Dashboard, a instituição pode:

1. **Adicionar Programas** 📚
   - Nome do programa
   - Descrição
   - Faixa etária
   - Turno (manhã/tarde/noite)
   - Modalidade (presencial/online/híbrido)
   - Vagas disponíveis
   - Preço a partir de

2. **Criar Eventos** 📅
   - Portas abertas
   - Matrículas
   - Palestras
   - Workshops

3. **Publicar Perfil** 🌐
   - Torna visível na vitrine pública
   - Começa a receber leads

4. **Gerenciar Leads** 👥
   - Pipeline: new → contacted → visit_scheduled → enrolled
   - Acompanhar conversões

5. **Ver Analytics** 📊
   - Leads por dia
   - Taxa de conversão
   - Performance

---

## 💡 DICAS PARA INSTITUIÇÕES

### Para um bom cadastro:

1. **Escolha o nicho correto** - Define funcionalidades disponíveis
2. **Escreva uma boa descrição** - Destaque diferenciais
3. **Adicione WhatsApp** - Facilita contato de interessados
4. **Complete o perfil** - Adicione programas e eventos
5. **Publique quando pronto** - Apareça na vitrine pública

---

## 🎯 RESUMO

**O que a instituição encontra**:
- ✅ Formulário simples e intuitivo
- ✅ 4 campos principais (2 obrigatórios)
- ✅ Informações claras sobre limites e capabilities
- ✅ Validações em tempo real
- ✅ Feedback visual do nicho selecionado
- ✅ Processo rápido (< 5 minutos)

**Após cadastro**:
- ✅ Dashboard completo
- ✅ Gestão de programas, leads e eventos
- ✅ Analytics e métricas
- ✅ Página pública quando publicar

---

**Experiência**: Simples, profissional e completa! 🎉
