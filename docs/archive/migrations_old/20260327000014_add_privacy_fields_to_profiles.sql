-- ============================================================================
-- Migration: Add privacy fields to profiles table
-- Description: Adiciona campos de configuração de privacidade aos perfis
-- Date: 2026-03-27
-- ============================================================================

-- Adicionar campos de privacidade (se não existirem)
DO $$ 
BEGIN
  -- Visibilidade do perfil
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Mostrar email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'show_email'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN show_email BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Mostrar telefone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'show_phone'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN show_phone BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Mostrar localização
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'show_location'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN show_location BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Permitir mensagens
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'allow_messages'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN allow_messages BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Mostrar atividade
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'show_activity'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN show_activity BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Mostrar empresas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'show_businesses'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN show_businesses BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.profiles.is_public IS 
  'Perfil é público e pode ser encontrado por qualquer pessoa';

COMMENT ON COLUMN public.profiles.show_email IS 
  'Mostrar email no perfil público';

COMMENT ON COLUMN public.profiles.show_phone IS 
  'Mostrar telefone no perfil público';

COMMENT ON COLUMN public.profiles.show_location IS 
  'Mostrar localização (cidade/bairro) no perfil público';

COMMENT ON COLUMN public.profiles.allow_messages IS 
  'Permitir que outros usuários enviem mensagens diretas';

COMMENT ON COLUMN public.profiles.show_activity IS 
  'Mostrar posts e comentários no perfil público';

COMMENT ON COLUMN public.profiles.show_businesses IS 
  'Mostrar empresas cadastradas no perfil público';

-- Índices para otimizar queries de privacidade
CREATE INDEX IF NOT EXISTS idx_profiles_is_public 
  ON public.profiles(is_public) 
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_profiles_allow_messages 
  ON public.profiles(allow_messages) 
  WHERE allow_messages = true;

-- ============================================================================
-- Atualizar perfis existentes com valores padrão
-- ============================================================================

-- Garantir que perfis existentes tenham valores padrão
UPDATE public.profiles
SET 
  is_public = COALESCE(is_public, true),
  show_email = COALESCE(show_email, false),
  show_phone = COALESCE(show_phone, false),
  show_location = COALESCE(show_location, true),
  allow_messages = COALESCE(allow_messages, true),
  show_activity = COALESCE(show_activity, true),
  show_businesses = COALESCE(show_businesses, true)
WHERE 
  is_public IS NULL 
  OR show_email IS NULL 
  OR show_phone IS NULL 
  OR show_location IS NULL 
  OR allow_messages IS NULL 
  OR show_activity IS NULL 
  OR show_businesses IS NULL;
