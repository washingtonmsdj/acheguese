# Meus vínculos e participação — especificação complementar
Atualizado em 17/09/2026. As pranchas 091 e 092 são referência principal da área pessoal. As 083–085 são complementos anteriores para solicitação e gestão; não implementar diferenças sem conciliar este documento.

## Base inspecionada
- src/core/community-experience/access/CommunityAccessPolicy.ts: níveis de acesso e capacidades por ação; não apenas um booleano de morador.
- src/modules/profile/components/ResidentVerificationCard.tsx: leitura de estados aprovado/pendente/rejeitado; upload de documento intencionalmente indisponível.
A auditoria desta entrega não certifica backend, fluxo de análise, API de alteração de vínculo nem métodos de verificação futuros.

## Entrada e organização
Acessível em Minha conta e pelo bloqueio de ação na comunidade. Manter destino de retorno após conclusão, reavaliando acesso; nunca publicar automaticamente o texto que motivou a verificação.
Selecionar perfil no topo. Mostrar vínculo ao Complexo e bairro interno. Uma conta pode possuir outros perfis; não herdar permissões automaticamente. No lançamento, não mostrar lista fictícia de outras cidades ativas. Interesse em expansão é separado de vínculo.

## Abas
Permissões: ações calculadas para perfil e território, com razão quando restritas. Histórico: eventos reais da solicitação, data e situação; não expor notas internas de moderação. As abas são propostas e precisam de dados próprios.
Participação em grupos depende também da disponibilidade e regras do grupo. Vínculo confirmado não concede acesso universal a grupos privados.

## Estados e ações
- Sem vínculo: explicar benefício e métodos efetivamente disponíveis.
- Método desativado: não abrir seletor de arquivo nem aceitar submissão. Mostrar orientação e continuar explorando.
- Em análise: protocolo/data quando existentes, sem prazo inventado ou botão duplicado de solicitar.
- Confirmado: vínculo e capacidades; atualizar dados quando suportado.
- Complementação solicitada: proposta futura, diferente de rejeição; explicar campo necessário e reenvio somente com método habilitado.
- Não aprovado: motivo comunicável, orientação e canal de revisão quando existir; não prometer recurso não implementado.
- Bloqueado: informar restrição sem expor investigação; ajuda conforme política.
- Erro de consulta: tentar novamente, sem inferir ausência de vínculo.
- Alteração de bairro: revisar informação e eventual nova análise. Não manter privilégios indevidos nem destruir aprovação anterior de forma implícita.
- Encerrar vínculo: evolução opcional com confirmação de consequências, não apagar conta ou histórico por consequência automática.

## Métodos futuros
Moradia, trabalho e estudo podem ter evidências e permissões diferentes. Trabalho/estudo não geram selo de residente. Upload privado só após autoridade validada; aceitar endereço digitado ou GPS não comprova residência. Não solicitar documentos indiscriminadamente nem sugerir coleta enquanto recurso desativado.
Prancha desktop inferior apresenta fluxo futuro habilitado. No produto real, esconder opções não disponíveis; badges de proposta são explicação da prancha, não texto permanente da interface.

## Contratos para implementação
Separar vínculo, evidência de verificação e papel/representação. Autorização no servidor por comunidade/perfil/ação. Proteger evidências e impedir autoaprovação. Transições devem ser auditadas, com operação pendente e erro recuperável. Desativar método não falsifica status de solicitações já registradas.
Permissões mostradas são exemplo de perfil elegível, nunca regra hardcoded para todos. Conciliar voto com a política atual que distingue ações de participação. Representação oficial é concedida por processo próprio.

## Correções e validação
A prancha é ilustrativa: fotos não comprovam geografia; use acervo autorizado. “Forma de residência” deve ser “Relação com a comunidade” quando novos tipos forem habilitados. No MVP com um território, seletor não sugere cidades disponíveis inexistentes.
Testar estados com dados reais de teste, troca de perfil, retorno à ação bloqueada, ausência de método e operação concorrente. Garantir foco/teclado/contraste, fonte legível e nenhuma evidência privada em perfil público.

O domínio e as rotas desenhados na barra do navegador são ilustrativos, não definem domínio oficial nem rotas existentes. Usar a configuração real do projeto. “Para manter seu vínculo” só se aplica a revalidação de vínculo existente; na primeira solicitação, usar “Para analisar sua solicitação”.
