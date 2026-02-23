#!/bin/bash
# Baseline: marca migrações já refletidas no banco como "aplicadas".
# Use quando o banco já existe e o Prisma nunca rodou migrations (erro P3005).
# Execute a partir da raiz do backend: ./prisma/baseline-migrations.sh

set -e
cd "$(dirname "$0")/.."

echo "Baseline: marcando migrações existentes como aplicadas..."

npx prisma migrate resolve --applied "20260219113200_init_auth"
npx prisma migrate resolve --applied "20260219125148_add_audit_log"
npx prisma migrate resolve --applied "20260219141148_add_funcoes_ministerio"
npx prisma migrate resolve --applied "20260219143957_add_ensaio_official_fields"
npx prisma migrate resolve --applied "20260219150010_add_regional_2_field"
npx prisma migrate resolve --applied "20260219175659_add_event_period_and_summoning_soft"
npx prisma migrate resolve --applied "20260219175926_make_event_period_required"
npx prisma migrate resolve --applied "20260219183024_init_or_update"
npx prisma migrate resolve --applied "20260219184902_init_or_update"

echo "Baseline concluído. Aplicando migrações pendentes..."
npx prisma migrate deploy
