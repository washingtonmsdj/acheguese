# Auditoria do Modulo Profissionais e Servicos

Data: 2026-05-06
Escopo: servicos, profissionais, cadastro, pagina publica, central profissional, reputacao, orcamentos, agenda e monetizacao.

## Prompt profissional executado

```text
Atue como auditor senior de produto e arquitetura para um marketplace hiperlocal de profissionais. Audite cadastro, edicao, pagina publica, listagem, busca, leads, orcamentos, agenda, reputacao, verificacao, planos, notificacoes e painel operacional. Compare com boas praticas de marketplaces locais sem copiar recursos desnecessarios. Classifique lacunas por P0/P1/P2/P3 e diga o que precisa existir para o modulo ser profissional.
```

## Veredito

O modulo de servicos/profissionais existe como funil publico e cadastro, mas o cockpit profissional ainda esta incompleto. A evidencia mais clara e `src/modules/central/pages/CentralProfissionalPage.tsx`, que declara ser placeholder funcional e diz que o fluxo profissional completo nao sera criado nesta fase.

Isso significa que o usuario consegue iniciar presenca profissional, mas o profissional ainda nao tem um sistema operacional completo para trabalhar.

## O Que Existe

- Pagina de cadastro de servico.
- Pagina de edicao de servico.
- Landing/listagem de servicos.
- Pagina publica de profissional.
- Pagina de detalhe de profissional.
- Servicos canonicos em `src/core/professional`.
- Gerenciamento de areas de atendimento em `src/core/service-areas`.

## Lacunas P0

- [ ] P0: substituir placeholder da Central Profissional por dashboard real.
- [ ] P0: definir fonte canonica entre `src/modules/professionals`, `src/core/professional` e Central.
- [ ] P0: criar funil de lead: visitante solicita contato, profissional recebe, responde, fecha ou perde.
- [ ] P0: criar notificacao transacional para novo lead, nova mensagem, pedido de orcamento e avaliacao.
- [ ] P0: criar regras de visibilidade por localidade e categoria.
- [ ] P0: remover `confirm()` nativo de acoes destrutivas em areas de atendimento.

## Lacunas P1

- [ ] P1: criar dashboard profissional com cards: novos pedidos, orcamentos abertos, agenda, reputacao, desempenho e plano.
- [ ] P1: criar orcamento estruturado: descricao, fotos, categoria, urgencia, bairro, faixa de preco, disponibilidade.
- [ ] P1: criar agenda simples: disponibilidade, indisponivel, visita marcada, lembrete e reagendamento.
- [ ] P1: criar reputacao unificada do prestador: avaliacoes, tempo de resposta, servicos concluidos, verificacao e denuncias.
- [ ] P1: criar selo de verificacao local: documento, telefone, residencia/atuacao, CNPJ/MEI opcional.
- [ ] P1: criar resposta rapida e templates de proposta.
- [ ] P1: conectar servicos ao feed/comunidade: recomendacao vira lead rastreavel.

## Lacunas P2

- [ ] P2: criar ranking por bairro e categoria.
- [ ] P2: criar plano pago para destaque, areas extras, resposta prioritaria e analytics.
- [ ] P2: criar portfolio com fotos antes/depois.
- [ ] P2: criar recorrencia: diarista, manutencao mensal, jardinagem, aulas, personal.
- [ ] P2: criar garantia/mediacao para conflitos de servico.

## Definicao de Pronto

O modulo so deve ser tratado como profissional quando:

- O prestador tiver painel proprio na Central.
- Leads e orcamentos forem rastreados.
- O cliente conseguir comparar, contatar e avaliar.
- A plataforma medir conversao e reputacao.
- Area de atendimento, agenda e notificacoes estiverem funcionando.

## Evidencias Tecnicas

- `src/modules/central/pages/CentralProfissionalPage.tsx`: placeholder funcional, sem fluxo profissional completo.
- `src/core/service-areas/components/ServiceAreasManager.tsx`: uso de `confirm()` nativo.
- `src/core/professional/services/ProfessionalService.ts`: presenca de `supabase as any` e metodos canonicos/legados convivendo.
- `src/core/professional/README.md` e `src/core/professional/MIGRATION_GUIDE.md`: ainda citam migracao/legado de localizacao.

## Prioridade Final

- P0: transformar Central Profissional em cockpit real.
- P0: fechar lead/orcamento/notificacao.
- P1: reputacao, agenda e verificacao.
- P2: monetizacao e recorrencia.
