# Perfil público do anunciante

Conceito proposto em 18/09/2026. Pranchas mobile e desktop. Análise dos arquivos locais, sem alteração da aplicação e sem auditoria integral dos serviços.

## Evidências e lacunas

| Arquivo | Observação |
| --- | --- |
| `src/modules/classifieds/pages/VendedorPerfilPage.tsx` | Identidade, bairro público, bio, data de ingresso, anúncios, filtros e aba de avaliações |
| `src/modules/classifieds/hooks/useVendedorPerfil.ts` | Busca perfil público e anúncios; retorna taxa de resposta, média e total de avaliações fixos em zero, e avaliações vazias |
| Mesmo hook | Captura qualquer erro e retorna `null`; isso pode levar a página a informar perfil inexistente em falhas transitórias |
| Mesmo hook | Usa a data atual quando falta a data de criação; não deve apresentar essa substituição como data real de ingresso |
| `VendedorPerfilPage.tsx` | Mostra “Vendas” a partir de `total_reviews`; avaliação não comprova venda. “Resposta rápida” também não deve ser inferida de uma taxa sem medição de tempo |
| `components/profile/VendedorContactBar.tsx` | Contato visível por `useVisibleProfileContact`, WhatsApp com fallback para telefone e mensagem interna condicionada por `communityCommunication` |
| Página + barra de contato | Passa o primeiro anúncio como contexto da mensagem; proposta substitui essa escolha implícita por seleção explícita |
| `components/profile/VendedorAdFilters.tsx` | Filtros aplicados ao conjunto carregado, não prova de paginação global no servidor |

## Funcionamento

**Anúncios:** exibir itens disponíveis com foto, título, condição e preço correto ao seu tipo. Filtrar categoria, condição e preço; ordenar; limpar filtros. Preservar filtros ao voltar do detalhe. “Nenhum anúncio disponível” difere de “Nenhum resultado com estes filtros”. Para grandes catálogos, filtrar e paginar no servidor sem apresentar contagem parcial como total.

**Sobre:** identidade pública, tipo real de perfil, bio e região disponibilizada pelo perfil. Não publicar endereço residencial, coordenadas, dados da conta, outros perfis do mesmo usuário ou documento pessoal. Se houver data de ingresso real, ela pode aparecer; omitir quando desconhecida. Bairro público não certifica residência ou vínculo comunitário.

**Contato:** ao clicar em conversar, escolher o anúncio ou preservar o anúncio de origem quando houver contexto explícito. Exibir perfil remetente e texto editável; enviar somente por ação do usuário. Revalidar anúncio e permissões no servidor. Sem anúncio elegível, não escolher outro silenciosamente. O contato externo continua possível se disponibilizado pelo anunciante e permitido pela política. Não assumir que todo telefone possui WhatsApp: distinguir telefone e WhatsApp no contrato.

**Perfis próprios:** trocar a ação de conversar consigo por acesso à gestão. Perfis distintos da mesma conta não herdam automaticamente contatos, reputação ou autorização. Tipo pessoal/profissional/negócio vem do cadastro real, não do nome ou foto.

**Avaliações:** a estrutura visual já existe, mas o hook inspecionado não fornece avaliações reais. Ocultar a seção quando não implementada ou desativada. Quando implementada, mostrar “Ainda sem avaliações” se o total real for zero, nunca nota 0 como reputação ruim. Definir elegibilidade, prevenção de duplicação, moderação, contestação e vínculo com a interação antes de ativar. Não afirmar compra verificada sem comprovação transacional. Contagem de avaliações nunca vira número de vendas.

**Denúncia de perfil:** melhoria proposta nesta página, distinta da denúncia de anúncio. Exige alvo correto, motivos, autorização, confirmação de recebimento e acesso restrito da moderação. Não divulgar denunciante nem aplicar punição automática apenas por envio.

## Estados e privacidade

- Carregamento com estrutura estável; falha com tentativa; perfil indisponível com texto neutro, sem revelar motivo privado de restrição.
- O hook deve propagar falhas transitórias para distinguir erro de perfil ausente, em vez de converter tudo em `null`.
- Conferir quais anúncios o serviço devolve: o hook mapeia o conjunto recebido em `all_ads` e calcula ativos separadamente. A consulta pública deve impedir exposição de pendentes, rejeitados, removidos ou privados; filtrar na tela não substitui autorização.
- Sem contato disponível, não inventar canal alternativo nem revelar telefone privado. Login preserva a intenção e o anúncio selecionado.
- Reenvio de mensagem após timeout precisa reconciliar resultado para evitar duplicatas. Não apagar texto antes da confirmação.

## Propostas e correções das imagens

Seleção explícita do anúncio, aba Sobre, denúncia de perfil e tratamento separado de erro são propostas de evolução. O cartão “Avaliações / Recurso previsto” é anotação de conceito: ocultar totalmente no produto enquanto desativado. O contador ilustrativo de mensagem `36/500` não define limite; usar contrato real e contagem correta. Nomes, fotos e preços são demonstração.

Não transferir reputação entre perfis nem usar selo de confiança sem critério verificável. Compartilhamento deve usar URL pública canônica. As pranchas mostram o estado de perfil pessoal; a composição deve acomodar perfis de negócio com identificação explícita.

## Implementação e acessibilidade

Usar SSOT de cores e Plus Jakarta Sans. Mobile com alvos confortáveis e ação sem encobrir conteúdo; desktop com filtros e cards legíveis. Cards devem ser links com teclado, não apenas divs clicáveis. Foco previsível em modais, seleção acessível de anúncio, leitura dos erros e contraste medido. Imagem não certifica AAA.

## Próxima página

**Vagas e oportunidades da comunidade**: descoberta, detalhe e candidatura, respeitando o módulo específico de vagas.
