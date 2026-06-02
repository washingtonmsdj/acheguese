-- ══════════════════════════════════════════════════════════════════════════
-- SEED VAGAS — Dados de Exemplo
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Descrição: Insere vagas de exemplo para desenvolvimento e testes
--            Cobre todas as categorias, contratos, modalidades e níveis
-- 
-- Autor: Sistema de Auditoria SSOT
-- Data: 2026-04-16
-- 
-- ══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- NOTA: Este seed assume que a tabela locations já existe e tem dados
-- Se locations estiver vazia, você precisará criar locations primeiro
-- ─────────────────────────────────────────────────────────────────────────

-- Verificar se já existem vagas (evitar duplicação)
DO $$
DECLARE
  vaga_count INTEGER;
  default_location_id UUID;
  country_location_id UUID;
  state_location_id UUID;
BEGIN
  -- Contar vagas existentes
  SELECT COUNT(*) INTO vaga_count FROM vagas;
  
  IF vaga_count > 0 THEN
    RAISE NOTICE 'Já existem % vagas no banco. Pulando seed.', vaga_count;
    RETURN;
  END IF;

  -- Buscar primeira location disponível
  SELECT id INTO default_location_id FROM locations LIMIT 1;
  
  IF default_location_id IS NULL THEN
    INSERT INTO locations (
      name,
      full_name,
      type,
      slug,
      geographic_path,
      parent_id,
      status,
      metadata
    )
    VALUES (
      'Brasil',
      'Brasil',
      'country',
      'br',
      '/br',
      NULL,
      'active',
      jsonb_build_object('country_code', 'BR')
    )
    ON CONFLICT (geographic_path) DO UPDATE SET
      name = EXCLUDED.name,
      full_name = EXCLUDED.full_name,
      metadata = COALESCE(locations.metadata, '{}'::jsonb) || EXCLUDED.metadata,
      status = 'active',
      updated_at = NOW()
    RETURNING id INTO country_location_id;

    INSERT INTO locations (
      name,
      full_name,
      type,
      slug,
      geographic_path,
      parent_id,
      status,
      metadata
    )
    VALUES (
      'Sao Paulo',
      'Sao Paulo, Brasil',
      'state',
      'sp',
      '/br/sp',
      country_location_id,
      'active',
      jsonb_build_object('state_code', 'SP', 'country_code', 'BR')
    )
    ON CONFLICT (geographic_path) DO UPDATE SET
      parent_id = EXCLUDED.parent_id,
      name = EXCLUDED.name,
      full_name = EXCLUDED.full_name,
      metadata = COALESCE(locations.metadata, '{}'::jsonb) || EXCLUDED.metadata,
      status = 'active',
      updated_at = NOW()
    RETURNING id INTO state_location_id;

    RAISE NOTICE 'Nenhuma location encontrada. Criando location padrão...';
    
    -- Criar location padrão se não existir
    INSERT INTO locations (
      name,
      full_name,
      type,
      slug,
      geographic_path,
      parent_id,
      status
    )
    VALUES (
      'São Paulo - SP',
      'São Paulo, SP, Brasil',
      'city',
      'sao-paulo',
      '/br/sp/sao-paulo',
      state_location_id,
      'active'
    )
    RETURNING id INTO default_location_id;
  END IF;

  RAISE NOTICE 'Inserindo vagas de exemplo usando location_id: %', default_location_id;

  -- ─────────────────────────────────────────────────────────────────────────
  -- INSERIR VAGAS DE EXEMPLO
  -- ─────────────────────────────────────────────────────────────────────────

  -- 1. Desenvolvedor Full Stack - CLT - Remoto - Pleno
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    salario_min,
    salario_max,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque,
    expires_at
  ) VALUES (
    'Desenvolvedor Full Stack',
    'Tech Solutions Ltda',
    'Buscamos desenvolvedor full stack com experiência em React, Node.js e PostgreSQL. Trabalho 100% remoto com equipe distribuída. Projetos desafiadores em fintech.',
    default_location_id,
    'CLT',
    'Remoto',
    'Pleno',
    ARRAY['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Git'],
    'R$ 6.000 - R$ 8.000',
    600000,
    800000,
    ARRAY['Vale alimentação', 'Plano de saúde', 'Home office', 'Auxílio educação'],
    'rh@techsolutions.com.br',
    'ativa',
    'normal',
    true,
    NOW() + INTERVAL '30 days'
  );

  -- 2. Designer UI/UX - PJ - Híbrido - Sênior
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    salario_min,
    salario_max,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Designer UI/UX Sênior',
    'Creative Studio',
    'Procuramos designer experiente para liderar projetos de UX/UI em aplicativos mobile e web. Trabalho híbrido com 2 dias presenciais por semana.',
    default_location_id,
    'PJ',
    'Híbrido',
    'Sênior',
    ARRAY['Figma', 'Adobe XD', 'Design System', 'Prototipagem', 'User Research'],
    'R$ 8.000 - R$ 12.000',
    800000,
    1200000,
    ARRAY['Horário flexível', 'Equipamento fornecido', 'Coworking'],
    'contato@creativestudio.com.br',
    'ativa',
    'urgente',
    true
  );

  -- 3. Analista de Dados - CLT - Presencial - Júnior
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    beneficios,
    contato_whatsapp,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Analista de Dados Júnior',
    'Data Corp',
    'Oportunidade para iniciar carreira em análise de dados. Trabalharemos com Python, SQL e ferramentas de BI. Treinamento incluso.',
    default_location_id,
    'CLT',
    'Presencial',
    'Júnior',
    ARRAY['Python', 'SQL', 'Power BI', 'Excel', 'Estatística'],
    'R$ 3.500 + benefícios',
    ARRAY['Vale transporte', 'Vale refeição', 'Plano de saúde', 'Treinamentos'],
    '11999887766',
    'ativa',
    'normal',
    false
  );

  -- 4. Gerente de Projetos - CLT - Híbrido - Especialista
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    salario_min,
    salario_max,
    beneficios,
    contato_email,
    contato_url,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Gerente de Projetos',
    'Consulting Group',
    'Gerente de projetos com certificação PMP para liderar projetos estratégicos. Experiência com metodologias ágeis e gestão de equipes multidisciplinares.',
    default_location_id,
    'CLT',
    'Híbrido',
    'Especialista',
    ARRAY['PMP', 'Scrum', 'Agile', 'Gestão de Equipes', 'Stakeholders'],
    'R$ 12.000 - R$ 18.000',
    1200000,
    1800000,
    ARRAY['Plano de saúde premium', 'Bônus anual', 'Carro da empresa', 'Previdência privada'],
    'rh@consultinggroup.com.br',
    'https://consultinggroup.com.br/carreiras',
    'ativa',
    'urgente',
    true
  );

  -- 5. Estagiário de Marketing - Estágio - Presencial - Júnior
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Estagiário de Marketing Digital',
    'Marketing Pro',
    'Estágio em marketing digital para estudantes de Marketing, Publicidade ou áreas relacionadas. Aprenda sobre redes sociais, SEO e campanhas digitais.',
    default_location_id,
    'Estágio',
    'Presencial',
    'Júnior',
    ARRAY['Redes Sociais', 'SEO', 'Google Ads', 'Canva', 'Marketing Digital'],
    'R$ 1.500 + benefícios',
    ARRAY['Vale transporte', 'Vale refeição', 'Seguro de vida'],
    'estagio@marketingpro.com.br',
    'ativa',
    'normal',
    false
  );

  -- 6. Desenvolvedor Mobile - PJ - Remoto - Pleno
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    salario_min,
    salario_max,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque,
    expires_at
  ) VALUES (
    'Desenvolvedor Mobile React Native',
    'App Factory',
    'Desenvolvedor mobile para criar aplicativos iOS e Android usando React Native. Projetos para clientes nacionais e internacionais.',
    default_location_id,
    'PJ',
    'Remoto',
    'Pleno',
    ARRAY['React Native', 'JavaScript', 'TypeScript', 'Redux', 'Firebase'],
    'R$ 7.000 - R$ 10.000',
    700000,
    1000000,
    ARRAY['Horário flexível', 'Projetos internacionais', 'Equipamento fornecido'],
    'jobs@appfactory.com.br',
    'ativa',
    'normal',
    false,
    NOW() + INTERVAL '45 days'
  );

  -- 7. Analista de Suporte - CLT - Presencial - Júnior
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    beneficios,
    contato_whatsapp,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Analista de Suporte Técnico',
    'Support Solutions',
    'Analista de suporte para atendimento N1 e N2. Conhecimento em Windows, redes e troubleshooting. Plantões ocasionais.',
    default_location_id,
    'CLT',
    'Presencial',
    'Júnior',
    ARRAY['Windows', 'Redes', 'Active Directory', 'Troubleshooting', 'Atendimento'],
    'R$ 2.800 + benefícios',
    ARRAY['Vale transporte', 'Vale refeição', 'Plano de saúde', 'Adicional noturno'],
    '11988776655',
    'ativa',
    'urgente',
    false
  );

  -- 8. Freelancer de Redação - Freelance - Remoto - Pleno
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Redator Freelancer',
    'Content Agency',
    'Redator freelancer para produção de conteúdo para blogs, redes sociais e e-books. Pagamento por projeto. Trabalho 100% remoto.',
    default_location_id,
    'Freelance',
    'Remoto',
    'Pleno',
    ARRAY['Redação', 'SEO', 'Copywriting', 'WordPress', 'Marketing de Conteúdo'],
    'R$ 50 - R$ 150 por texto',
    ARRAY['Pagamento por projeto', 'Flexibilidade total', 'Portfólio diversificado'],
    'redacao@contentagency.com.br',
    'ativa',
    'normal',
    false
  );

  -- 9. Coordenador de Vendas - CLT - Híbrido - Sênior
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    salario_min,
    salario_max,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Coordenador de Vendas',
    'Sales Corp',
    'Coordenador para liderar equipe de vendas B2B. Experiência com CRM, gestão de metas e desenvolvimento de equipe comercial.',
    default_location_id,
    'CLT',
    'Híbrido',
    'Sênior',
    ARRAY['Vendas B2B', 'CRM', 'Gestão de Equipes', 'Negociação', 'Metas'],
    'R$ 8.000 + comissões',
    800000,
    1500000,
    ARRAY['Comissões atrativas', 'Carro da empresa', 'Plano de saúde', 'Bônus por meta'],
    'rh@salescorp.com.br',
    'ativa',
    'urgente',
    true
  );

  -- 10. Assistente Administrativo - Temporário - Presencial - Júnior
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    beneficios,
    contato_whatsapp,
    status,
    urgencia,
    destaque,
    expires_at
  ) VALUES (
    'Assistente Administrativo',
    'Admin Services',
    'Contrato temporário de 6 meses para assistente administrativo. Rotinas de escritório, atendimento telefônico e organização de documentos.',
    default_location_id,
    'Temporário',
    'Presencial',
    'Júnior',
    ARRAY['Excel', 'Word', 'Atendimento', 'Organização', 'Comunicação'],
    'R$ 2.200',
    ARRAY['Vale transporte', 'Vale refeição'],
    '11977665544',
    'ativa',
    'normal',
    false,
    NOW() + INTERVAL '15 days'
  );

  -- 11. DevOps Engineer - CLT - Remoto - Sênior (PAUSADA)
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    salario_min,
    salario_max,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque
  ) VALUES (
    'DevOps Engineer',
    'Cloud Systems',
    'Engenheiro DevOps para gerenciar infraestrutura em nuvem (AWS/Azure). CI/CD, Kubernetes, Docker e automação.',
    default_location_id,
    'CLT',
    'Remoto',
    'Sênior',
    ARRAY['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform'],
    'R$ 10.000 - R$ 15.000',
    1000000,
    1500000,
    ARRAY['Home office', 'Plano de saúde', 'Auxílio educação', 'Equipamento fornecido'],
    'devops@cloudsystems.com.br',
    'pausada',
    'normal',
    false
  );

  -- 12. Product Manager - PJ - Híbrido - Especialista (ENCERRADA)
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Product Manager',
    'Product House',
    'Product Manager para liderar roadmap de produto SaaS. Experiência com discovery, métricas e gestão de backlog.',
    default_location_id,
    'PJ',
    'Híbrido',
    'Especialista',
    ARRAY['Product Management', 'Agile', 'Métricas', 'Discovery', 'Roadmap'],
    'R$ 15.000 - R$ 20.000',
    ARRAY['Horário flexível', 'Coworking', 'Projetos estratégicos'],
    'pm@producthouse.com.br',
    'encerrada',
    'normal',
    false
  );

  -- 13. Desenvolvedor Backend - CLT - Remoto - Júnior (PREENCHIDA)
  INSERT INTO vagas (
    titulo,
    empresa,
    descricao,
    location_id,
    contrato,
    modalidade,
    nivel,
    tags,
    salario_texto,
    beneficios,
    contato_email,
    status,
    urgencia,
    destaque
  ) VALUES (
    'Desenvolvedor Backend Júnior',
    'Backend Solutions',
    'Primeira oportunidade em desenvolvimento backend. Trabalharemos com Node.js, Express e MongoDB. Mentoria inclusa.',
    default_location_id,
    'CLT',
    'Remoto',
    'Júnior',
    ARRAY['Node.js', 'Express', 'MongoDB', 'REST API', 'Git'],
    'R$ 4.000 + benefícios',
    ARRAY['Home office', 'Plano de saúde', 'Mentoria', 'Treinamentos'],
    'backend@backendsolutions.com.br',
    'preenchida',
    'normal',
    false
  );

  RAISE NOTICE 'Seed concluído! 13 vagas inseridas com sucesso.';
  RAISE NOTICE 'Distribuição: 10 ativas, 1 pausada, 1 encerrada, 1 preenchida';
  RAISE NOTICE 'Contratos: CLT (7), PJ (3), Estágio (1), Freelance (1), Temporário (1)';
  RAISE NOTICE 'Modalidades: Remoto (5), Presencial (4), Híbrido (4)';
  RAISE NOTICE 'Níveis: Júnior (5), Pleno (4), Sênior (3), Especialista (2)';

END $$;
