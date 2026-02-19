#!/bin/bash

# Script de Deploy Automático para Ensaios Regionais
# Este script deve ser executado na raiz do projeto na VPS

# Interromper o script em caso de qualquer erro
set -e

echo "--- Iniciando Atualização do Servidor ---"

# 1. Validar Ambiente
if [ ! -f "backend/.env" ]; then
    echo "❌ Erro: Arquivo backend/.env não encontrado!"
    echo "Crie o arquivo na pasta backend com DATABASE_URL e JWT_SECRET antes de rodar o deploy."
    exit 1
fi

# 2. Atualizar código do repositório
echo ">>> Puxando atualizações do GitHub..."
git pull origin main

# 3. Configurar Backend
echo ">>> Configurando Backend..."
cd backend
npm install
npx prisma generate
npm run build
# npx prisma db push é mais resiliente para o deploy inicial com banco já populado
npx prisma db push
cd ..

# 4. Configurar Frontend
echo ">>> Configurando Frontend..."
cd frontend
npm install
npm run build
cd ..

# 5. Gerenciar Processo com PM2
echo ">>> Reiniciando serviços no PM2..."
cd backend
pm2 startOrRestart ecosystem.config.js --env production
cd ..

# 6. Salvar configuração do PM2
pm2 save

echo "--- Deploy Concluído com Sucesso! ---"
