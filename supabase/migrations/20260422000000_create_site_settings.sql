-- =====================================================
-- SITE SETTINGS - Configurações Globais do Site
-- =====================================================
-- Tabela para armazenar configurações globais do site
-- como logo, favicon, cores da marca, etc.
-- =====================================================

-- Criar tabela de configurações do site
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.site_settings IS 'Configurações globais do site (logo, favicon, cores, etc)';
COMMENT ON COLUMN public.site_settings.key IS 'Chave única da configuração (ex: logo_url, favicon_url, primary_color)';
COMMENT ON COLUMN public.site_settings.value IS 'Valor da configuração em formato JSON';
COMMENT ON COLUMN public.site_settings.description IS 'Descrição da configuração';

-- Índices
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_updated_at ON public.site_settings(updated_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler as configurações
CREATE POLICY "site_settings_select_public"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Política: Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "site_settings_admin_all"
  ON public.site_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Função para atualizar ou inserir configuração
CREATE OR REPLACE FUNCTION public.upsert_site_setting(
  p_key TEXT,
  p_value JSONB,
  p_description TEXT DEFAULT NULL
)
RETURNS public.site_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_setting public.site_settings;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem modificar configurações do site';
  END IF;

  -- Inserir ou atualizar
  INSERT INTO public.site_settings (key, value, description, updated_by)
  VALUES (p_key, p_value, p_description, auth.uid())
  ON CONFLICT (key) DO UPDATE
  SET 
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, site_settings.description),
    updated_by = auth.uid(),
    updated_at = NOW()
  RETURNING * INTO v_setting;

  RETURN v_setting;
END;
$$;

-- Função para obter configuração por chave
CREATE OR REPLACE FUNCTION public.get_site_setting(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM public.site_settings
  WHERE key = p_key;

  RETURN v_value;
END;
$$;

-- Função para obter todas as configurações (para o frontend)
CREATE OR REPLACE FUNCTION public.get_all_site_settings()
RETURNS TABLE (
  key TEXT,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.key,
    s.value,
    s.description,
    s.updated_at
  FROM public.site_settings s
  ORDER BY s.key;
END;
$$;

-- Seed inicial com valores padrão
INSERT INTO public.site_settings (key, value, description) VALUES
  ('logo_url', '""'::jsonb, 'URL da logo principal do site'),
  ('logo_mobile_url', '""'::jsonb, 'URL da logo para mobile'),
  ('favicon_url', '""'::jsonb, 'URL do favicon'),
  ('primary_color', '"#3b82f6"'::jsonb, 'Cor primária da marca'),
  ('secondary_color', '"#8b5cf6"'::jsonb, 'Cor secundária da marca'),
  ('site_name', '"Achegue-se"'::jsonb, 'Nome do site'),
  ('site_tagline', '"Super App de Bairro"'::jsonb, 'Slogan do site')
ON CONFLICT (key) DO NOTHING;

-- Comentários nas funções
COMMENT ON FUNCTION public.upsert_site_setting IS 'Insere ou atualiza uma configuração do site (apenas admins)';
COMMENT ON FUNCTION public.get_site_setting IS 'Obtém o valor de uma configuração por chave';
COMMENT ON FUNCTION public.get_all_site_settings IS 'Obtém todas as configurações do site';
