# Governance Authorities

Status: ativo
Data: 2026-07-07

Este diretorio registra autoridades tecnicas do projeto. Uma Authority e um
ponto de entrada operacional para regras, evidencias e validacoes de uma area
critica. Ela nao substitui os SSOTs existentes; ela aponta para eles e define
quando cada um deve ser consultado.

## Authority Ativa

- [Security Authority](./security/SECURITY_AUTHORITY.md)

## Decisao Atual

Somente a Security Authority esta ativa neste momento.

Nao criar diretorios vazios para Architecture, UX, Performance, AI, Frontend ou
Backend enquanto nao houver processo executavel real para cada area. Novas
authorities so devem nascer quando houver:

- risco recorrente e relevante;
- regras canonicas ja existentes ou claramente necessarias;
- validacao manual ou automatica que sera usada de fato;
- dono operacional definido;
- criterio de pronto e criterio de excecao.

## Modelo Padrao

Toda Authority deve declarar:

- objetivo;
- escopo;
- fora de escopo;
- fontes canonicas;
- regras obrigatorias;
- niveis de risco;
- evidencias obrigatorias;
- validadores ou comandos;
- processo de excecao;
- plano de manutencao.

## Regras De Governanca

- A Authority nunca deve duplicar um SSOT sem link para a origem.
- Regra executavel deve viver em script, teste, migration, CI ou configuracao.
- Regra humana deve ser curta, revisavel e ligada a evidencia.
- Excecao deve ter validade, responsavel, mitigacao e plano de remocao.
- Mudanca critica sem evidencia deve ser tratada como incompleta.

## Plano De Implementacao

O plano operacional desta entrega esta em:

- [Security Authority - plano de implementacao](../../plans/SECURITY_AUTHORITY_IMPLEMENTATION_PLAN.md)

