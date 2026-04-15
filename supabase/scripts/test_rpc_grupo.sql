SELECT rpc_get_location_descendants_ids(
  (SELECT id FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina')
);
