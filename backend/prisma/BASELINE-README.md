# Baseline de migrações (erro P3005)

Quando o banco já existe (ex.: criado manualmente ou por deploy anterior) e o Prisma nunca registrou as migrações, aparece:

```
Error: P3005
The database schema is not empty.
```

## Passos no servidor

1. **Garantir que o código está atualizado** (incluindo a pasta `migrations/20260222120000_add_users_regional_id_index`).

2. **Dar permissão e rodar o script de baseline** (a partir do diretório do projeto, ex.: `/var/www/ensaioregional`):

   ```bash
   cd backend
   chmod +x prisma/baseline-migrations.sh
   ./prisma/baseline-migrations.sh
   ```

   O script:
   - marca as 9 migrações antigas como já aplicadas (não executa SQL delas);
   - em seguida roda `prisma migrate deploy`, que aplica **só** a migração nova (índice em `users.regional_id`).

3. **Se preferir fazer à mão** (sem script):

   ```bash
   cd backend
   npx prisma migrate resolve --applied "20260219113200_init_auth"
   npx prisma migrate resolve --applied "20260219125148_add_audit_log"
   npx prisma migrate resolve --applied "20260219141148_add_funcoes_ministerio"
   npx prisma migrate resolve --applied "20260219143957_add_ensaio_official_fields"
   npx prisma migrate resolve --applied "20260219150010_add_regional_2_field"
   npx prisma migrate resolve --applied "20260219175659_add_event_period_and_summoning_soft"
   npx prisma migrate resolve --applied "20260219175926_make_event_period_required"
   npx prisma migrate resolve --applied "20260219183024_init_or_update"
   npx prisma migrate resolve --applied "20260219184902_init_or_update"
   npx prisma migrate deploy
   ```

## Só o índice (sem baseline)

Se o histórico do Prisma já estiver certo e você só quiser aplicar o índice:

```bash
cd backend
npx prisma migrate deploy
```

Se o índice já tiver sido criado à mão:

```bash
npx prisma migrate resolve --applied "20260222120000_add_users_regional_id_index"
```

## Referência

- [Prisma: Baseline existing production database](https://www.prisma.io/docs/guides/migrate/production-troubleshooting#baseline-your-production-database)
