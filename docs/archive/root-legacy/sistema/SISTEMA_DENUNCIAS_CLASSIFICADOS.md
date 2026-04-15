# Sistema de Denúncias de Classificados

## Visão Geral

Sistema completo para denunciar anúncios suspeitos ou inadequados, com moderação administrativa.

## Arquitetura

### Backend

**Tabela: `classified_reports`**
```sql
- id: UUID (PK)
- classified_id: UUID (FK → classifieds)
- reporter_id: UUID (FK → profiles, nullable para denúncias anônimas)
- reason: TEXT (enum)
- description: TEXT (opcional)
- status: TEXT (pending, reviewed, resolved, dismissed)
- reviewed_by: UUID (FK → profiles)
- reviewed_at: TIMESTAMPTZ
- admin_notes: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Serviço: `ClassifiedReportService`**
- `createReport()` - Cria nova denúncia
- `getAllReports()` - Lista todas (admin)
- `getReportsByClassified()` - Denúncias de um anúncio
- `updateReportStatus()` - Atualiza status (admin)
- `getPendingReportsCount()` - Conta pendentes
- `getRecentReports()` - Denúncias recentes

### Frontend

**Locais do botão de denúncia:**
1. Sidebar do vendedor (principal)
2. Rodapé da página (secundário)

**Modal de denúncia:**
- Dropdown com 8 motivos pré-definidos
- Validação de campos
- Loading state
- Toast de confirmação

**Motivos de denúncia:**
- `fraud` - Fraude ou golpe
- `fake` - Produto falso ou falsificado
- `inappropriate` - Conteúdo inapropriado
- `spam` - Spam ou publicidade enganosa
- `duplicate` - Anúncio duplicado
- `wrong-category` - Categoria incorreta
- `sold` - Produto já vendido
- `other` - Outro motivo

## Fluxo de Uso

### Usuário

1. Acessa página de detalhes do classificado
2. Clica em "Denunciar anúncio" (sidebar ou rodapé)
3. Seleciona motivo no dropdown
4. Clica em "Enviar Denúncia"
5. Recebe confirmação via toast

### Administrador

1. Acessa painel admin
2. Vê contador de denúncias pendentes
3. Lista denúncias recentes
4. Analisa cada denúncia
5. Atualiza status:
   - `reviewed` - Analisada
   - `resolved` - Resolvida (ação tomada)
   - `dismissed` - Descartada (sem fundamento)
6. Adiciona notas administrativas

## Segurança (RLS)

- ✅ Usuários autenticados podem criar denúncias
- ✅ Usuários anônimos podem denunciar (sem reporter_id)
- ✅ Usuários veem apenas suas próprias denúncias
- ✅ Admins/moderadores veem todas
- ✅ Apenas admins/moderadores podem atualizar

## Próximos Passos

### Painel Admin ✅ IMPLEMENTADO

Página `/admin/classificados/denuncias` criada com:
- ✅ Tabela de denúncias pendentes
- ✅ Filtros por status (todas, pendentes, analisadas, resolvidas, descartadas)
- ✅ Busca por título, denunciante ou motivo
- ✅ Ações de moderação (analisar, resolver, descartar)
- ✅ Visualização de detalhes do anúncio denunciado
- ✅ Campo para notas administrativas
- ✅ Estatísticas em cards (total, pendentes, resolvidas, descartadas)
- ✅ Badge no menu lateral com contagem de pendentes
- ✅ Atualização automática a cada 30 segundos
- ✅ Cards expansíveis com detalhes completos
- ✅ Link direto para o anúncio denunciado
- ✅ Histórico de revisão (quem revisou e quando)

### Notificações (TODO)

- [ ] Email para admins quando nova denúncia
- [ ] Notificação in-app para moderadores
- [ ] Email para denunciante quando resolvida

### Melhorias (TODO)

- [ ] Limite de denúncias por usuário/IP
- [ ] Sistema de pontuação de confiabilidade
- [ ] Auto-moderação para múltiplas denúncias
- [ ] Histórico de denúncias do vendedor
- [ ] Exportar relatórios em CSV/PDF
- [ ] Gráficos de tendências de denúncias

## Migração

Execute a migration:
```bash
supabase migration up
```

Ou aplique manualmente:
```bash
psql -f supabase/migrations/20240101000000_create_classified_reports.sql
```

## Testes

```typescript
// Criar denúncia
const report = await classifiedReportService.createReport(userId, {
  classified_id: 'uuid-do-anuncio',
  reason: 'fraud',
});

// Listar denúncias pendentes (admin)
const pending = await classifiedReportService.getAllReports({
  status: 'pending',
  limit: 20,
});

// Atualizar status (admin)
await classifiedReportService.updateReportStatus(
  reportId,
  adminId,
  'resolved',
  'Anúncio removido por violar termos de uso'
);
```

## Arquivos Criados/Atualizados

### Backend
- `src/core/classifieds/services/ClassifiedReportService.ts` - Serviço completo de denúncias
- `supabase/migrations/20240101000000_create_classified_reports.sql` - Migration da tabela

### Frontend - Usuário
- Atualizado: `src/modules/classifieds/pages/ClassificadoDetailPage.tsx` - Botões e modal de denúncia

### Frontend - Admin
- `src/modules/admin/pages/AdminClassificadosDenuncias.tsx` - Painel completo de moderação
- Atualizado: `src/modules/admin/pages/AdminLayout.tsx` - Menu com badge de contagem
- Atualizado: `src/App.tsx` - Rota do painel admin

### Serviços
- Atualizado: `src/core/classifieds/services/index.ts` - Exports do serviço

### Documentação
- `SISTEMA_DENUNCIAS_CLASSIFICADOS.md` - Documentação completa
