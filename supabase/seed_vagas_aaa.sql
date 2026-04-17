-- ═════════════════════════════════════════════════════════════════════════════
-- SEED: Vagas de Exemplo Nível AAA
-- ═════════════════════════════════════════════════════════════════════════════
-- 
-- Execute este seed após aplicar a migration 20260416170000_vagas_domain_aaa.sql
-- para popular o banco com vagas de exemplo para desenvolvimento.
--
-- Comando: psql $DATABASE_URL -f supabase/seed_vagas_aaa.sql
-- ═════════════════════════════════════════════════════════════════════════════

-- Primeiro, precisamos de empresas e localizações para referenciar
-- Este seed assume que você já tem:
-- - Empresas cadastradas na tabela empresas
-- - Localizações na tabela locations
-- - Perfis na tabela profiles

-- ═════════════════════════════════════════════════════════════════════════════
-- VAGAS DE EXEMPLO — Setor de Tecnologia
-- ═════════════════════════════════════════════════════════════════════════════

-- Inserir vagas de exemplo (substitua os UUIDs pelos IDs reais do seu banco)
INSERT INTO vagas (
    id,
    slug,
    titulo,
    empresa_id,
    empresa_nome,
    owner_profile_id,
    location_id,
    bairro_id,
    descricao,
    responsabilidades,
    requisitos,
    diferenciais,
    beneficios,
    contrato,
    modalidade,
    nivel,
    salario_mode,
    salario_min,
    salario_max,
    salario_texto,
    jornada_horas_semana,
    jornada_observacoes,
    vagas_quantidade,
    application_channel,
    application_whatsapp,
    application_email,
    application_url,
    application_phone,
    application_observacoes,
    status,
    urgencia,
    highlight_type,
    published_at,
    expires_at,
    meta_title,
    meta_description,
    og_image_url
) VALUES 
-- Vaga 1: Desenvolvedor Frontend Sênior (Remoto)
(
    gen_random_uuid(),
    'desenvolvedor-frontend-senior-remoto-tech-solutions',
    'Desenvolvedor Frontend Sênior (React/TypeScript)',
    (SELECT id FROM empresas WHERE nome ILIKE '%tech%' LIMIT 1),
    'Tech Solutions Brasil',
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM locations LIMIT 1),
    NULL,
    'Buscamos um desenvolvedor frontend sênior para liderar projetos de alta complexidade. Você trabalhará com React, TypeScript, Next.js e tecnologias modernas em um ambiente colaborativo e inovador.',
    ARRAY['Desenvolver interfaces de usuário escaláveis', 'Liderar code reviews e mentorar devs júnior', 'Colaborar com designers e product managers', 'Otimizar performance de aplicações'],
    ARRAY['5+ anos com React', 'TypeScript avançado', 'Next.js e SSR/SSG', 'Tailwind CSS ou similar', 'Git e CI/CD'],
    ARRAY['Experiência com micro-frontends', 'Conhecimento em GraphQL', 'Inglês técnico fluente', 'Contribuições open source'],
    ARRAY['Salário competitivo', 'VR/VA flexível', 'Plano de saúde e odontológico', 'Home office full', 'Horário flexível', 'Budget para educação'],
    'clt',
    'remoto',
    'senior',
    'range',
    1800000,
    3500000,
    NULL,
    40,
    'Horário flexível, core hours 10h-15h',
    2,
    'email',
    NULL,
    'vagas@techsolutions.com.br',
    NULL,
    NULL,
    'Enviar CV com portfólio de projetos',
    'published',
    'normal',
    'premium',
    NOW(),
    NOW() + INTERVAL '30 days',
    'Desenvolvedor Frontend Sênior Remoto | Tech Solutions',
    'Oportunidade para desenvolvedor frontend sênior trabalhar remotamente com React, TypeScript e Next.js. Salário até R$ 35.000.',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200'
),

-- Vaga 2: Product Designer (Híbrido)
(
    gen_random_uuid(),
    'product-designer-pleno-hibrido-inovacao-digital',
    'Product Designer Pleno',
    (SELECT id FROM empresas WHERE nome ILIKE '%inova%' LIMIT 1),
    'Inovação Digital',
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM locations LIMIT 1),
    NULL,
    'Procuramos um Product Designer para criar experiências digitais excepcionais. Você fará parte de um time multidisciplinar trabalhando em produtos que impactam milhões de usuários.',
    ARRAY['Criar wireframes, protótipos e interfaces', 'Conduzir pesquisas com usuários', 'Colaborar com desenvolvedores na implementação', 'Defender decisões de design com dados'],
    ARRAY['3+ anos em Product Design', 'Figma avançado', 'Design System', 'Research de usuários', 'Prototipagem interativa'],
    ARRAY['Experiência em Design Ops', 'Motion design', 'Front-end básico (HTML/CSS)', 'Certificação UX'],
    ARRAY['VR/VA R$ 1.200', 'Plano de saúde top', 'Gympass', 'Day off no aniversário', 'Trabalho híbrido 3x/semana'],
    'clt',
    'hibrido',
    'pleno',
    'fixed',
    1200000,
    NULL,
    NULL,
    40,
    'Presencial 3x/semana, seg, qua, sex',
    1,
    'whatsapp',
    '5511999998888',
    NULL,
    NULL,
    NULL,
    'Enviar portfólio via WhatsApp',
    'published',
    'urgente',
    'featured',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '28 days',
    'Product Designer Pleno | Inovação Digital',
    'Vaga urgente para Product Designer em modelo híbrido. Envie seu portfólio pelo WhatsApp.',
    NULL
),

-- Vaga 3: Analista de Marketing Digital (Presencial)
(
    gen_random_uuid(),
    'analista-marketing-digital-junior-agencia-criativa',
    'Analista de Marketing Digital',
    (SELECT id FROM empresas WHERE nome ILIKE '%agencia%' LIMIT 1),
    'Agência Criativa SP',
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM locations LIMIT 1),
    NULL,
    'Oportunidade para quem quer começar na área de marketing digital. Oferecemos treinamento completo e possibilidade de crescimento rápido.',
    ARRAY['Criar campanhas em Meta Ads e Google Ads', 'Analisar métricas e relatórios', 'Produzir conteúdo para redes sociais', 'Auxiliar em estratégias de SEO'],
    ARRAY['Conhecimento básico de marketing digital', 'Noções de design (Canva)', 'Boa comunicação escrita', 'Excel intermediário'],
    ARRAY['Certificações Google/Meta', 'Experiência com copywriting', 'Conhecimento em automação'],
    ARRAY['Salário compatível + VT', 'VR R$ 35/dia', 'Plano de saúde após 3 meses', 'Happy hour mensal'],
    'clt',
    'presencial',
    'junior',
    'fixed',
    350000,
    NULL,
    NULL,
    44,
    'Segunda a sexta, 9h às 18h',
    3,
    'external_url',
    NULL,
    NULL,
    'https://agenciacriativa.com.br/trabalhe-conosco',
    NULL,
    NULL,
    'published',
    'normal',
    'none',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '25 days',
    'Analista de Marketing Digital Júnior | Agência Criativa',
    'Vaga júnior para quem quer começar em marketing digital. Treinamento completo oferecido.',
    NULL
),

-- Vaga 4: Gerente de Projetos de TI (Remoto)
(
    gen_random_uuid(),
    'gerente-projetos-ti-senior-remoto-consultoria-gti',
    'Gerente de Projetos de TI',
    (SELECT id FROM empresas WHERE nome ILIKE '%consultoria%' LIMIT 1),
    'Consultoria GTI',
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM locations LIMIT 1),
    NULL,
    'Buscamos um gerente de projetos experiente para liderar iniciativas de transformação digital. Projetos desafiadores em clientes de grande porte.',
    ARRAY['Liderar projetos de TI de grande porte', 'Gerenciar stakeholders e expectativas', 'Aplicar metodologias ágeis e tradicionais', 'Garantir entregas no prazo, escopo e orçamento'],
    ARRAY['7+ anos em gestão de projetos TI', 'Certificação PMP ou Scrum Master', 'Experiência com governança ITIL', 'Inglês avançado', 'Liderança de equipes multidisciplinares'],
    ARRAY['MBA em Gestão', 'Experiência internacional', 'Certificações AWS/Azure', 'Metodologias ágeis avançadas'],
    ARRAY['Salário acima da média', 'Bônus por entrega', 'Plano de saúde internacional', 'Carro corporativo', 'Home office permanente'],
    'pj',
    'remoto',
    'gerente',
    'range',
    2500000,
    4500000,
    NULL,
    40,
    'Flexível, com reuniões síncronas',
    1,
    'email',
    NULL,
    'talentos@consultoriagti.com',
    NULL,
    NULL,
    'published',
    'extrema',
    'sponsored',
    NOW(),
    NOW() + INTERVAL '15 days',
    'Gerente de Projetos TI Sênior | Consultoria GTI',
    'Oportunidade sênior para gestão de projetos de TI em modelo PJ remoto. Urgente!',
    NULL
),

-- Vaga 5: Estágio em Desenvolvimento (Presencial)
(
    gen_random_uuid(),
    'estagio-desenvolvimento-software-startup-inovadora',
    'Estágio em Desenvolvimento de Software',
    (SELECT id FROM empresas WHERE nome ILIKE '%startup%' LIMIT 1),
    'Startup Inovadora',
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM locations LIMIT 1),
    NULL,
    'Programa de estágio para estudantes de TI. Mentoria individual, projetos reais e grande possibilidade de efetivação.',
    ARRAY['Auxiliar no desenvolvimento de features', 'Corrigir bugs e fazer manutenção', 'Participar de sprints e dailies', 'Estudar e aplicar novas tecnologias'],
    ARRAY['Cursando Ciência da Computação ou similar', 'Conhecimento básico de programação', 'Vontade de aprender', 'Disponibilidade 6h/dia'],
    ARRAY['Projetos pessoais no GitHub', 'Participação em hackathons', 'Inglês técnico'],
    ARRAY['Bolsa compatível', 'VR R$ 30/dia', 'Ambiente descontraído', 'Possibilidade de efetivação'],
    'estagio',
    'presencial',
    'estagio',
    'fixed',
    180000,
    NULL,
    NULL,
    30,
    '6h diárias, flexível entre 8h-20h',
    2,
    'whatsapp',
    '5511888887777',
    NULL,
    NULL,
    NULL,
    'Estágio para estudantes de TI. Envie CV pelo WhatsApp.',
    'published',
    'normal',
    'none',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '29 days',
    'Estágio em Desenvolvimento de Software | Startup',
    'Oportunidade de estágio para estudantes de TI com mentoria e possibilidade de efetivação.',
    NULL
);

-- ═════════════════════════════════════════════════════════════════════════════
-- VIEWS ÚTEIS
-- ═════════════════════════════════════════════════════════════════════════════

-- Criar view para dashboard de vagas ativas
CREATE OR REPLACE VIEW vagas_ativas_resumidas AS
SELECT 
    v.id,
    v.slug,
    v.titulo,
    v.empresa_nome,
    v.contrato,
    v.modalidade,
    v.nivel,
    v.salario_mode,
    v.salario_min,
    v.salario_max,
    v.salario_texto,
    v.status,
    v.urgencia,
    v.highlight_type,
    v.view_count,
    v.application_count,
    v.published_at,
    v.expires_at,
    CASE 
        WHEN v.salario_mode = 'fixed' THEN v.salario_min / 100
        WHEN v.salario_mode = 'range' AND v.salario_max IS NOT NULL THEN v.salario_max / 100
        WHEN v.salario_mode = 'range' THEN v.salario_min / 100
        ELSE NULL
    END as salario_max_reais,
    CASE 
        WHEN v.expires_at < NOW() THEN true
        ELSE false
    END as is_expired
FROM vagas v
WHERE v.status = 'published'
ORDER BY v.highlight_type DESC, v.published_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- COMENTÁRIOS
-- ═════════════════════════════════════════════════════════════════════════════

COMMENT ON VIEW vagas_ativas_resumidas IS 'View resumida das vagas publicadas ativas para dashboards e listagens rápidas';

-- ═════════════════════════════════════════════════════════════════════════════
-- FIM DO SEED
-- ═════════════════════════════════════════════════════════════════════════════
