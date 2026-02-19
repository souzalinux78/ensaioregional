-- AlterTable
ALTER TABLE `ensaios_regionais` ADD COLUMN `data_fim` DATETIME(3) NULL,
    ADD COLUMN `data_inicio` DATETIME(3) NULL,
    ADD COLUMN `regional_principal` VARCHAR(191) NULL,
    ADD COLUMN `regional_secundario` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `idx_evento_periodo` ON `ensaios_regionais`(`data_inicio`, `data_fim`);
