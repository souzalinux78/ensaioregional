#!/bin/bash

# Script de Deploy Automático para Ensaios Regionais
# Este script deve ser executado na raiz do projeto na VPS

echo "--- Iniciando Atualização do Servidor ---"

# 1. Atualizar código do repositório
echo ">>> Puxando atualizações do GitHub..."
git pull origin main

# 2. Configurar Backend
echo ">>> Configurando Backend..."
cd backend
npm install
npx prisma generate
npm run build
npx prisma migrate deploy
cd ..

# 3. Configurar Frontend
echo ">>> Configurando Frontend..."
cd frontend
npm install
npm run build
cd ..

# 4. Gerenciar Processo com PM2
echo ">>> Reiniciando serviços no PM2..."
# Verifica se o processo já está no PM2, se não, inicia
if pm2 show ensaioregional-api > /dev/null 2>&1; then
    pm2 restart backend/ecosystem.config.js
else
    pm2 start backend/ecosystem.config.js
fi

# 5. Salvar configuração do PM2
pm2 save

echo "--- Deploy Concluído com Sucesso! ---"
