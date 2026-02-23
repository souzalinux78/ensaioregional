-- CreateIndex
-- Índice para otimizar filtros por regional na listagem de usuários (isolamento ADMIN_REGIONAL)
CREATE INDEX `users_regional_id_idx` ON `users`(`regional_id`);
