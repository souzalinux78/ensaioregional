/*
  Warnings:

  - Made the column `data_hora_fim` on table `ensaios_regionais` required. This step will fail if there are existing NULL values in that column.
  - Made the column `data_hora_inicio` on table `ensaios_regionais` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ensaios_regionais` MODIFY `data_hora_fim` DATETIME(3) NOT NULL,
    MODIFY `data_hora_inicio` DATETIME(3) NOT NULL;
