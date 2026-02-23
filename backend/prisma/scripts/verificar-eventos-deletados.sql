-- Ver eventos que ainda aparecem como ativos (deleted_at nulo)
-- Execute no MySQL: mysql -u root -p ensaioregional_db < prisma/scripts/verificar-eventos-deletados.sql

SELECT id, nome, data_evento, deleted_at, created_at
FROM ensaios_regionais
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- Se quiser marcar TODOS como deletados (só use se tiver certeza):
-- UPDATE ensaios_regionais SET deleted_at = NOW() WHERE deleted_at IS NULL;
