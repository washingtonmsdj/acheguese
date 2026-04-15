-- Migration: Seed better classified ads with complete data
-- Description: Adds sample classifieds with proper titles and categories
-- Note: This migration only updates existing classifieds, does not insert new ones
-- New classifieds should be created through the application

-- Update existing classifieds to have better titles if they're generic
UPDATE public.classifieds
SET 
  title = CASE
    WHEN title IS NULL OR title = '' OR title = 'Produto/Serviço' THEN
      CASE category
        WHEN 'beleza_saude' THEN 'Produto de Beleza e Saúde - ' || COALESCE(description, 'Item')
        WHEN 'servicos' THEN 'Serviço Profissional - ' || COALESCE(description, 'Serviço')
        WHEN 'moveis' THEN 'Móvel para Casa - ' || COALESCE(description, 'Móvel')
        WHEN 'eletronicos' THEN 'Eletrônico - ' || COALESCE(description, 'Produto')
        WHEN 'veiculos' THEN 'Veículo - ' || COALESCE(description, 'Veículo')
        WHEN 'moda' THEN 'Artigo de Moda - ' || COALESCE(description, 'Item')
        WHEN 'esportes' THEN 'Artigo Esportivo - ' || COALESCE(description, 'Produto')
        ELSE 'Produto/Serviço - ' || COALESCE(description, 'Item')
      END
    ELSE title
  END
WHERE 
  title IS NULL 
  OR title = '' 
  OR title = 'Produto/Serviço';

-- Add comment
COMMENT ON TABLE public.classifieds IS 'Updated: Classifieds now have descriptive titles based on category and description';
