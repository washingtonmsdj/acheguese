
-- ============================================================
-- AI Platform: governance + image generation history
-- ============================================================

-- 1) ai_usage_log -------------------------------------------------
CREATE TABLE public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  feature TEXT NOT NULL,
  capability TEXT NOT NULL, -- text | structured | vision | image | embed | moderation
  model TEXT NOT NULL,
  status TEXT NOT NULL,     -- ok | error | rate_limited | payment_required | moderated
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_estimate NUMERIC(12,6),
  latency_ms INTEGER,
  request_id TEXT,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_time ON public.ai_usage_log (user_id, created_at DESC);
CREATE INDEX idx_ai_usage_feature_time ON public.ai_usage_log (feature, created_at DESC);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage select own"
  ON public.ai_usage_log FOR SELECT
  USING (auth.uid() = user_id);

-- inserts feitos somente via service role (edge functions); nada para anon/authenticated.

-- 2) ai_rate_limits ----------------------------------------------
CREATE TABLE public.ai_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_seconds INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature, window_start, window_seconds)
);

CREATE INDEX idx_ai_rate_user_feature ON public.ai_rate_limits (user_id, feature, window_start DESC);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_rate select own"
  ON public.ai_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- 3) ai_moderation_log -------------------------------------------
CREATE TABLE public.ai_moderation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  feature TEXT NOT NULL,
  input_type TEXT NOT NULL, -- text | image
  blocked BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  severity TEXT,            -- low | medium | high
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_moderation_user_time ON public.ai_moderation_log (user_id, created_at DESC);

ALTER TABLE public.ai_moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_moderation select own"
  ON public.ai_moderation_log FOR SELECT
  USING (auth.uid() = user_id);

-- 4) ai_image_generations ----------------------------------------
CREATE TABLE public.ai_image_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,        -- module/feature consumindo (community, gastronomy, ...)
  mode TEXT NOT NULL,           -- generate | edit
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model TEXT NOT NULL,
  reference_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_img_user_time ON public.ai_image_generations (user_id, created_at DESC);
CREATE INDEX idx_ai_img_feature_time ON public.ai_image_generations (feature, created_at DESC);

ALTER TABLE public.ai_image_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_images select own"
  ON public.ai_image_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_images insert own"
  ON public.ai_image_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_images update own"
  ON public.ai_image_generations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ai_images delete own"
  ON public.ai_image_generations FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER ai_image_generations_set_updated
  BEFORE UPDATE ON public.ai_image_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER ai_rate_limits_set_updated
  BEFORE UPDATE ON public.ai_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Storage bucket: ai-images -----------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-images', 'ai-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ai-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-images');

CREATE POLICY "ai-images owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ai-images owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ai-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ai-images owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ai-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
