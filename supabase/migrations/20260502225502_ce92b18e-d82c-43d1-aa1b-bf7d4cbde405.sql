
-- Table
CREATE TABLE public.tryon_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_image_url text NOT NULL,
  category text NOT NULL CHECK (category IN ('clothing_upper','clothing_lower','clothing_full','footwear','accessory_eyewear','accessory_headwear','accessory_other','swimwear')),
  target_gender text NOT NULL DEFAULT 'neutral' CHECK (target_gender IN ('male','female','neutral')),
  style text NOT NULL DEFAULT 'casual',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  provider text NOT NULL DEFAULT 'lovable-ai',
  generated_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_url text,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tryon_generations_user ON public.tryon_generations(user_id, created_at DESC);
CREATE INDEX idx_tryon_generations_status ON public.tryon_generations(status);

ALTER TABLE public.tryon_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tryon select own" ON public.tryon_generations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tryon insert own" ON public.tryon_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tryon update own" ON public.tryon_generations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tryon delete own" ON public.tryon_generations
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_tryon_updated_at
  BEFORE UPDATE ON public.tryon_generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tryon', 'tryon', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "tryon storage public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tryon');

CREATE POLICY "tryon storage user upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tryon' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "tryon storage user update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tryon' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "tryon storage user delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tryon' AND auth.uid()::text = (storage.foldername(name))[1]);
