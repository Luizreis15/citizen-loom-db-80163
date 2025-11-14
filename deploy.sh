#!/bin/bash

# Script de Deploy Automático
# Este script deve ser executado na VPS

set -e  # Para em caso de erro

echo "🚀 Iniciando deploy..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do projeto (ajuste conforme necessário)
PROJECT_DIR="/var/www/digital-hera"
cd $PROJECT_DIR

echo -e "${YELLOW}📦 Fazendo pull das mudanças...${NC}"
git pull origin main

echo -e "${YELLOW}📚 Instalando dependências...${NC}"
npm install --production

echo -e "${YELLOW}🔨 Fazendo build do projeto...${NC}"
npm run build

echo -e "${YELLOW}🔄 Reiniciando servidor...${NC}"
# Ajuste o comando conforme seu setup:
# Se usar PM2:
pm2 restart digital-hera

# Se usar systemd:
# sudo systemctl restart digital-hera

# Se usar apenas node:
# pkill -f "node server.mjs"
# nohup node server.mjs > /var/log/digital-hera.log 2>&1 &

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Aplicação disponível em: http://seu-dominio.com${NC}"
