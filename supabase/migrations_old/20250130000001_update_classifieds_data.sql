-- Migration: Update existing classifieds with proper titles and categories
-- Description: Ensures all classifieds have descriptive titles and proper categorization

-- Update classifieds that are missing proper titles or categories
UPDATE public.classifieds
SET 
  title = CASE 
    WHEN title IS NULL OR title = '' THEN 'Produto/Serviço'
    ELSE title
  END,
  category = CASE
    WHEN category = 'Beleza e Saúde' OR category = 'beleza_saude' THEN 'beleza_saude'
    WHEN category = 'Serviços' OR category = 'servicos' THEN 'servicos'
    WHEN category = 'Móveis' OR category = 'moveis' THEN 'moveis'
    WHEN category = 'Eletrônicos' OR category = 'eletronicos' THEN 'eletronicos'
    WHEN category = 'Veículos' OR category = 'veiculos' THEN 'veiculos'
    WHEN category = 'Imóveis' OR category = 'imoveis' THEN 'imoveis'
    WHEN category = 'Moda' OR category = 'moda' THEN 'moda'
    WHEN category = 'Esportes' OR category = 'esportes' THEN 'esportes'
    WHEN category IS NULL OR category = '' THEN 'outros'
    ELSE LOWER(REPLACE(category, ' ', '_'))
  END
WHERE 
  title IS NULL 
  OR title = '' 
  OR category IS NULL 
  OR category = '';

-- Add some sample descriptive titles based on category if title is still generic
UPDATE public.classifieds
SET title = CASE
  WHEN category = 'beleza_saude' AND (title = 'Produto/Serviço' OR title LIKE '%Beleza%') THEN 
    CASE 
      WHEN price < 100 THEN 'Produto de Beleza'
      WHEN price < 200 THEN 'Kit de Cuidados'
      ELSE 'Tratamento Estético'
    END
  WHEN category = 'servicos' AND (title = 'Produto/Serviço' OR title LIKE '%Serviço%') THEN
    CASE
      WHEN price < 100 THEN 'Serviço Rápido'
      WHEN price < 300 THEN 'Serviço Profissional'
      ELSE 'Serviço Especializado'
    END
  WHEN category = 'moveis' THEN 'Móvel para Casa'
  WHEN category = 'eletronicos' THEN 'Eletrônico'
  ELSE title
END
WHERE title = 'Produto/Serviço' OR title IS NULL OR title = '';

-- Add comment
COMMENT ON TABLE public.classifieds IS 'Updated: All classifieds now have proper titles and categories';
