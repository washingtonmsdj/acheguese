# Classificados da comunidade

Conceito proposto em 18/09/2026. Consulta do módulo local; não representa implementação ou validação integral do sistema. Pranchas mobile e desktop complementares.

## Fluxo

1. Explorar anúncios no território selecionado, pesquisar e filtrar. A busca aqui procura produtos; não exige que o MVP ofereça outras cidades.
2. Abrir detalhe com fotos, preço, condição, descrição, bairro, anunciante e condições declaradas de troca/entrega.
3. Fazer pergunta pública sobre o item ou iniciar conversa privada vinculada ao anúncio. Mostrar explicitamente o perfil remetente. Nunca enviar automaticamente a mensagem sugerida.
4. Quando vendido ou indisponível, substituir a ação de nova negociação por anúncios semelhantes. Conversas anteriores mantêm seu histórico conforme autorização.

## Evidências no projeto

Arquivos em `src/modules/classifieds/`:

| Referência | Recursos identificados |
| --- | --- |
| `pages/ClassificadoDetailPage.tsx` | Galeria, favoritos, relacionados, anúncios do vendedor, contato visível conforme privacidade, mensagens, denúncia e ações do proprietário |
| `pages/ClassificadoDetailStatus.ts` | Ativo, pausado, vendido, em análise, rejeitado, expirado e removido |
| `sections/types.ts` | Busca, categoria, ordenação, preço, condição, foto e localização; campos de troca e entrega |
| `pages/NovoClassificadoPage.tsx`, `pages/EditarClassificadoPage.tsx` | Fluxos próprios de criação e edição, que terão pranchas específicas |
| `pages/VendedorPerfilPage.tsx` | Perfil do anunciante |

O detalhe utiliza `ClassifiedCommentsSection`, `useVisibleProfileContact`, `classifiedMessagingService` e controle `communityCommunication`. A existência dessas integrações não prova todos os cenários de produção. Validar permissões, respostas e persistência antes de ativar.

## Regras para implementação

- Classificado é o registro canônico do módulo. Um compartilhamento no feed aponta para ele; não cria outro anúncio independente. Vagas e serviços continuam nos módulos específicos.
- Filtrar e ordenar o conjunto no servidor antes de paginar. Preservar filtros ao voltar do detalhe; exibir carregamento, falha com tentativa e vazio sem inventar anúncios.
- Não revelar endereço residencial exato nem coordenadas publicamente. Bairro basta para descoberta. Combinar retirada na conversa.
- Contato interno depende da disponibilidade do recurso e das permissões. WhatsApp somente quando o anunciante disponibilizar esse contato; não expor telefone privado como alternativa automática.
- Autenticação pode ser solicitada para favoritar, perguntar ou conversar, preservando o destino. Acesso público à descoberta segue a política vigente.
- Perfil ativo, propriedade e autorização devem ser conferidos no servidor. Não herdar permissões automaticamente entre perfis da mesma conta.
- Perguntas públicas e mensagens privadas são canais distintos. Denúncias seguem motivo, confirmação e retorno sem divulgar o denunciante.
- Não há evidência nesta análise de checkout, garantia de compra, custódia de pagamento ou entrega integrada para classificados. Não adicionar esses compromissos como recursos existentes.
- Cada estado tem mensagem própria: vendido, pausado, expirado e removido não são sinônimos. Detalhes de rejeição/moderação são privados ao proprietário e pessoas autorizadas.
- Propõe-se impedir novas perguntas em anúncios encerrados, preservando as já publicadas quando permitido. A frase da prancha mobile que diz que perguntas não estão disponíveis deve ser implementada como **novas perguntas indisponíveis**, sem apagar automaticamente o histórico.
- Selo “Membro da comunidade”, quantidade de perguntas, fotos e nomes são demonstrativos. Só exibir vínculo comprovado pelo sistema; não significam residência verificada ou garantia do vendedor. Anexos na conversa dependem de implementação real.
- Patrocínio/destaque, se habilitado, precisa de identificação explícita. Não simular avaliações, disponibilidade ou métricas.

## Melhorias propostas

Persistência dos filtros na navegação, contexto do anúncio na conversa, clareza de perfil remetente e estados consistentes de indisponibilidade. Novos recursos exigem contrato de dados, autorização e controle de ativação; recurso desativado desaparece da interface pública.

## Responsividade e acessibilidade

Mobile com conteúdo em uma coluna, filtros em painel e ação principal acessível sem cobrir o conteúdo. Desktop com galeria e informações lado a lado, mantendo ordem de leitura coerente. Permitir zoom, teclado, leitor de tela e retorno de foco ao fechar a galeria. Medir contrastes e tamanhos de alvo na implementação; a imagem não certifica conformidade AAA.

## Próxima página

**Criar e gerenciar meus anúncios**: formulário, fotos, revisão, moderação, edição, pausa, vendido e reativação.
