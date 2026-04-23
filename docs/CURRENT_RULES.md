# Regras Vigentes do Sistema

Data-base: 2026-04-20
Status: ativo
Versao documental: 3.1

## 1. Regras de identidade e ownership
- `user_id` identifica autenticacao e contexto administrativo.
- `profile_id` identifica a entidade operacional do usuario no ecossistema.
- ownership social usa colunas explicitas do tipo `*_profile_id`.
- ownership administrativo usa colunas explicitas do tipo `*_user_id`.
- username, handle e slug nao podem representar a mesma coisa em rotas diferentes sem contrato unico.

## 2. Regras de fronteira arquitetural
- Acesso ao Supabase fica restrito a `services/`, `repositories/`, `migrations/`, `scripts/` e `supabase/functions/`.
- Paginas e hooks nao devem conter regra de negocio; fazem apenas orquestracao de estado, fetch e render.
- Cada dominio deve ter um service canonico por responsabilidade. Wrappers de compatibilidade sao permitidos apenas quando explicitamente documentados.
- Tipos canonicos nao podem ser duplicados entre `shared/`, `core/` e `modules/` quando ja existir fonte oficial.
- Modulos nao podem importar implementacoes internas uns dos outros. Integracao cruzada passa por `core/`, adapters formais ou contratos compartilhados.
- `core/admin` agrega dominios; ele nao deve depender de implementacoes internas de `modules/*`.
- Rotas publicas devem ter namespace unico por entidade. O mesmo padrao nao pode servir a tipos diferentes ao mesmo tempo.

## 2.1 Regras de taxonomia (vertical vs horizontal)
- `business`/`empresas` e dominio base horizontal das entidades empresariais.
- `business` nao e vertical.
- Vertical empresarial oficial existe somente quando declarado em `src/core/verticals/config.ts`.
- Estado oficial atual: apenas `gastronomy` esta formalizada como vertical.
- Capacidade implementada em codigo nao implica reconhecimento oficial de vertical sem declaracao no SSOT.

## 3. Regras documentais
- Documento global vivo fica em `docs/`.
- Documento tecnico de dominio fica no proprio dominio.
- Historico vai para `docs/archive/` ou `docs/historico/`.
- `docs/temp-work-*` e `supabase/migrations_old` sao historicos e nao podem ser usados como SSOT de regras, schema ou contrato.
- O indice mestre da documentacao e `docs/INDEX_CANONICO.md`.
- O relatorio executivo vigente de organizacao e blindagem e `docs/audits/MASTER_REPORT.md`.
- Documentos fora do indice canonico (principalmente historico/sessao) nao substituem status oficial.

## 4. Gates obrigatorios
Execute antes de consolidacoes estruturais e antes de build:
```bash
npm run audit:architecture
npm run validate:architecture:governance
npm run validate:taxonomy
npm run validate:ssot
npm run validate:docs-structure
```

## 5. Proibicoes explicitas
- Nao criar novo service paralelo para dominio que ja possui service canonico.
- Nao acessar `supabase.from(...)` em page, hook, component ou utilitario de UI.
- Nao mover regra de negocio para hook de pagina por conveniencia.
- Nao criar nova pagina administrativa sem owner de dominio, contrato de dados e cobertura documental.
- Nao introduzir nova rota publica de identidade sem decidir o namespace oficial.

## 6. Prioridade atual de blindagem
- consolidar identidade publica e rotas de perfil
- retirar imports cruzados entre modulos
- consolidar wrappers e services duplicados
- padronizar front-end base em hero, filtros, cards, estados e tabelas admin
- fechar lacunas administrativas, especialmente em notifications, profile e map
