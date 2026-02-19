-- AlterTable
ALTER TABLE `ensaios_regionais` ADD COLUMN `data_hora_fim` DATETIME(3) NULL,
    ADD COLUMN `data_hora_inicio` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `evento_usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL,
    `ensaio_regional_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `convocado` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evento_usuarios_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `evento_usuarios_ensaio_regional_id_user_id_key`(`ensaio_regional_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `evento_usuarios` ADD CONSTRAINT `evento_usuarios_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_usuarios` ADD CONSTRAINT `evento_usuarios_ensaio_regional_id_fkey` FOREIGN KEY (`ensaio_regional_id`) REFERENCES `ensaios_regionais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_usuarios` ADD CONSTRAINT `evento_usuarios_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
