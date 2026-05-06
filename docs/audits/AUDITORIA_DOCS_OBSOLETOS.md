# Auditoria de Documentos Obsoletos e Governanca

Data: 2026-05-06
Escopo: documentacao raiz, `docs`, arquivos de status, relatorios historicos, guias de migracao e divergencias entre docs e codigo.

## Prompt profissional executado

```text
Atue como auditor senior de documentacao tecnica e governanca de produto. Audite todos os documentos do projeto para identificar afirmacoes obsoletas, status falsamente conclusivos, duplicidade de relatorios, documentos historicos tratados como atuais e guias que conflitam com o codigo. Classifique cada problema por risco e proponha politica de documentacao viva.
```

## Veredito

Ha documentos demais afirmando conclusao total, enquanto o codigo ainda contem TODOs, legados, placeholders, `as any`, `confirm()` nativo, validacoes de arquitetura falhando e modulos incompletos. O problema nao e existir historico; o problema e historico parecer documento atual.

O projeto precisa separar claramente:

- Documentos vivos.
- Auditorias atuais.
- Historico/archive.
- Guias de migracao ainda validos.
- Relatorios obsoletos que nao devem orientar decisao.

## Documentos com Alto Risco de Obsolescencia

- [ ] P0: revisar `docs/STATUS.md`. Ele afirma estado de completude/qualidade que conflita com a auditoria atual.
- [ ] P0: revisar `docs/VALIDACAO_FINAL_E_PROXIMOS_PASSOS.md` se ainda afirmar zero TODO/FIXME ou completude total.
- [ ] P0: revisar docs que declaram "100% pronto", "final", "concluido" ou "producao" sem bater com validacoes atuais.
- [ ] P1: revisar `docs/ROTAS_PUBLICAS_CANONICAS.md`, pois ainda ha indicacao de fase/TODO e rotas canonicas convivem com rotas antigas.
- [ ] P1: revisar docs de identidade publica/profissional que podem conflitar com a existencia atual de paginas publicas e `ProfessionalUrlService`.
- [ ] P1: revisar READMEs de `src/core/geocoding`, `src/core/residence` e `src/core/professional`, pois ainda citam migracao/legado.
- [ ] P1: revisar `src/core/community/hooks/README.md`, que ainda cita TODO de backend.

## Problemas de Governanca

- [ ] P0: impedir que relatorios antigos na raiz virem fonte de verdade.
- [ ] P0: criar um unico indice de status atual.
- [ ] P1: mover relatorios historicos para `docs/archive` ou marcar explicitamente como historicos.
- [ ] P1: adicionar data, dono, status e validade em docs decisorios.
- [ ] P1: criar regra: nenhum documento pode declarar "completo" se `typecheck`, validacoes de arquitetura/taxonomia e checklist P0 estiverem falhando.
- [ ] P2: criar changelog de auditoria por modulo.

## Politica Recomendada

Documentos vivos:

- `docs/AUDITORIA_PRODUTO_HIPERLOCAL_CHECKLIST.md`
- `docs/audits/AUDITORIA_MODULO_MOBILIDADE.md`
- `docs/audits/AUDITORIA_MODULO_PROFISSIONAIS.md`
- `docs/audits/AUDITORIA_MODULO_GASTRONOMIA_NICHOS.md`
- `docs/audits/AUDITORIA_DOCS_OBSOLETOS.md`
- Um futuro `docs/STATUS_ATUAL.md` curto, gerado a partir das validacoes reais.

Documentos historicos:

- Relatorios de fases antigas.
- Planos ja executados.
- Auditorias anteriores substituidas.
- Arquivos com "FINAL" no nome que nao forem mais verdade atual.

## Checklist de Limpeza

- [ ] P0: criar `docs/STATUS_ATUAL.md` com estado real, nao marketing interno.
- [ ] P0: marcar docs obsoletos com banner no topo: "Historico, nao usar como status atual".
- [ ] P1: mover docs soltos da raiz para `docs/archive` quando nao forem operacionais.
- [ ] P1: manter no maximo um documento de auditoria atual por tema.
- [ ] P1: linkar cada doc vivo a evidencias: scripts, arquivos e data da ultima verificacao.
- [ ] P2: automatizar checagem de termos perigosos em docs: "100%", "final", "pronto para producao", "zero TODO".

## Risco se Nao Corrigir

- Time toma decisao com base em status falso.
- Modulos incompletos sao lancados como se estivessem prontos.
- Bugs de arquitetura/taxonomia ficam invisiveis.
- Novos contribuidores se perdem entre docs atuais e docs historicos.
- Produto parece menos profissional internamente, mesmo quando a UI evolui.
