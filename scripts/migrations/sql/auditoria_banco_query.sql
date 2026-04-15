-- Auditoria Quantitativa: posts
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2)
  END as coverage_percent
FROM posts;
