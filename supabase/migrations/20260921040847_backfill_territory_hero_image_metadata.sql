with location_heroes(geographic_path, hero_image_url) as (
  values
    ('/br/ba/salvador', '/territory/heroes/salvador.jpg'),
    ('/br/ba/salvador/barra', '/territory/heroes/barra.jpg'),
    ('/br/ba/salvador/chapada-do-rio-vermelho', '/territory/heroes/chapada-do-rio-vermelho.jpg'),
    ('/br/ba/salvador/nordeste-de-amaralina', '/territory/heroes/nordeste-de-amaralina.jpg'),
    ('/br/ba/salvador/ondina', '/territory/heroes/ondina.jpg'),
    ('/br/ba/salvador/pituba', '/territory/heroes/pituba.jpg'),
    ('/br/ba/salvador/rio-vermelho', '/territory/heroes/rio-vermelho.jpg'),
    ('/br/ba/salvador/santa-cruz', '/territory/heroes/santa-cruz.jpg'),
    ('/br/ba/salvador/stiep', '/territory/heroes/stiep.jpg'),
    ('/br/ba/salvador/vale-das-pedrinhas', '/territory/heroes/vale-das-pedrinhas.jpg')
)
update public.locations as l
set metadata = coalesce(l.metadata, '{}'::jsonb)
  || jsonb_build_object('hero_image_url', h.hero_image_url)
from location_heroes as h
where l.geographic_path = h.geographic_path
  and coalesce(l.metadata->>'hero_image_url', '') is distinct from h.hero_image_url;

update public.territorial_groups as g
set metadata = coalesce(g.metadata, '{}'::jsonb)
  || jsonb_build_object(
    'hero_image_url',
    '/territory/heroes/complexo-do-nordeste-de-amaralina.jpg'
  )
where g.slug = 'complexo-do-nordeste-de-amaralina'
  and coalesce(g.metadata->>'hero_image_url', '') is distinct from
    '/territory/heroes/complexo-do-nordeste-de-amaralina.jpg';
