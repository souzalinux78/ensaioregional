-- CreateTable
CREATE TABLE `user_regionais` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `regional_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_regionais_user_id_regional_id_key`(`user_id`, `regional_id`),
    INDEX `user_regionais_user_id_idx`(`user_id`),
    INDEX `user_regionais_regional_id_idx`(`regional_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_regionais` ADD CONSTRAINT `user_regionais_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_regionais` ADD CONSTRAINT `user_regionais_regional_id_fkey` FOREIGN KEY (`regional_id`) REFERENCES `regionais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Migração de dados: usuários que já têm regional_id ganham registro em user_regionais (idempotente)
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