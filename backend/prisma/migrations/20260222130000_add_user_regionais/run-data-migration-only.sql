-- Execute apenas se a tabela user_regionais já existir mas estiver vazia ou faltar dados.
-- Idempotente: não duplica registros.

INSERT INTO `user_regionais` (`id`, `user_id`, `regional_id`, `created_at`)
SELECT
    UUID(),
    u.`id`,
    u.`regional_id`,
    COALESCE(u.`created_at`, CURRENT_TIMESTAMP(3))
FROM `users` u
WHERE u.`regional_id` IS NOT NULL
  AND u.`deleted_at` IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM `user_regionais` ur
    WHERE ur.`user_id` = u.`id` AND ur.`regional_id` = u.`regional_id`
  );
