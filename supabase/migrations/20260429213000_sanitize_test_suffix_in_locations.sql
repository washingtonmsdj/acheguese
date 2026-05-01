-- SSOT: saneamento de nomes/slugs/caminhos de localizacoes com sufixo de teste
-- Objetivo: remover residuos como "teste fase2" e "teste-fase2" do cadastro canonico
-- Escopo: apenas tabela public.locations

begin;

-- 1) Limpar name/full_name (remove "teste faseN" no final, case-insensitive)
update public.locations
set
  name = trim(regexp_replace(name, '\s*teste\s*fase\s*\d+\s*$', '', 'i')),
  full_name = trim(regexp_replace(full_name, '\s*teste\s*fase\s*\d+\s*$', '', 'i'))
where
  name ~* 'teste\s*fase\s*\d+\s*$'
  or full_name ~* 'teste\s*fase\s*\d+\s*$';

-- 2) Limpar slug (remove "-teste-faseN" no final)
update public.locations
set slug = regexp_replace(slug, '-teste-fase\d+$', '', 'i')
where slug ~* '-teste-fase\d+$';

-- 3) Limpar geographic_path (remove "-teste-faseN" em qualquer segmento)
update public.locations
set geographic_path = regexp_replace(geographic_path, '-teste-fase\d+', '', 'ig')
where geographic_path ~* '-teste-fase\d+';

-- 4) Recalcular full_name de filhos imediatos baseado no pai + nome limpo
update public.locations c
set full_name = concat_ws(', ', c.name, p.name)
from public.locations p
where c.parent_id = p.id
  and c.type in ('district', 'city')
  and c.name is not null
  and p.name is not null;

commit;

