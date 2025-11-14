# 🚀 Configuração de Deploy Automático na VPS

## Opção 1: Script de Deploy Manual (Simples)

### 1. Copiar script para a VPS

```bash
# Na sua máquina local, copie o script para a VPS:
scp deploy.sh seu-usuario@ip-da-vps:/var/www/digital-hera/

# Ou faça pull do git na VPS e o script estará lá
```

### 2. Dar permissão de execução

```bash
# Na VPS:
cd /var/www/digital-hera
chmod +x deploy.sh
```

### 3. Ajustar o script

Edite o `deploy.sh` na VPS e ajuste:
- `PROJECT_DIR`: caminho correto do projeto
- Comando de restart (PM2, systemd ou node)

### 4. Executar deploy

```bash
# Na VPS, sempre que quiser fazer deploy:
cd /var/www/digital-hera
./deploy.sh
```

---

## Opção 2: Deploy Automático via GitHub Actions (Recomendado)

### 1. Configurar SSH Key na VPS

```bash
# Na VPS, crie uma chave SSH (se ainda não tiver):
ssh-keygen -t rsa -b 4096 -C "deploy@digital-hera"

# Adicione a chave pública ao authorized_keys:
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# Copie a chave privada (você vai precisar dela):
cat ~/.ssh/id_rsa
```

### 2. Adicionar Secrets no GitHub

Vá em: **Settings → Secrets and variables → Actions → New repository secret**

Adicione os seguintes secrets:

- `VPS_HOST`: IP ou domínio da sua VPS (ex: `123.45.67.89`)
- `VPS_USER`: seu usuário SSH (ex: `root` ou `ubuntu`)
- `VPS_SSH_KEY`: a chave privada que você copiou acima

### 3. Ajustar o workflow

Edite `.github/workflows/deploy.yml` se necessário:
- Caminho do projeto na VPS
- Branch de deploy

### 4. Testar

Faça commit e push para a branch `main`:

```bash
git add .
git commit -m "Setup auto deploy"
git push origin main
```

O GitHub Actions vai automaticamente:
1. Conectar na VPS
2. Fazer pull das mudanças
3. Instalar dependências
4. Fazer build
5. Reiniciar o servidor

---

## Opção 3: Webhook Simples na VPS

### 1. Instalar webhook listener

```bash
# Na VPS:
npm install -g webhook
```

### 2. Criar arquivo de configuração

Crie `/var/www/webhook-config.json`:

```json
[
  {
    "id": "deploy-digital-hera",
    "execute-command": "/var/www/digital-hera/deploy.sh",
    "command-working-directory": "/var/www/digital-hera",
    "response-message": "Deploy iniciado!",
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "SEU_SECRET_AQUI",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature"
        }
      }
    }
  }
]
```

### 3. Iniciar webhook listener

```bash
# Na VPS:
webhook -hooks /var/www/webhook-config.json -port 9000 -verbose
```

### 4. Configurar webhook no GitHub

Vá em: **Settings → Webhooks → Add webhook**

- URL: `http://seu-ip:9000/hooks/deploy-digital-hera`
- Content type: `application/json`
- Secret: o mesmo que você colocou no `webhook-config.json`
- Events: Just the push event

---

## Configuração do PM2 (Recomendado para produção)

Se ainda não usa PM2, configure:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Criar arquivo de configuração
```

Crie `ecosystem.config.js` na raiz do projeto:

```javascript
module.exports = {
  apps: [{
    name: 'digital-hera',
    script: './server.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

```bash
# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Salvar configuração para restart automático
pm2 save
pm2 startup
```

---

## Troubleshooting

### Erro de permissão ao executar script
```bash
chmod +x deploy.sh
```

### Git pede senha ao fazer pull
```bash
# Configure SSH key no GitHub
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"
cat ~/.ssh/id_rsa.pub
# Adicione a chave em: GitHub → Settings → SSH keys
```

### PM2 não encontrado
```bash
npm install -g pm2
# ou
sudo npm install -g pm2
```

### Build falha por falta de memória
```bash
# Aumente o limite de memória do Node:
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## Recomendação

Para máxima simplicidade e confiabilidade, use a **Opção 2 (GitHub Actions)**:
- ✅ Totalmente automático
- ✅ Deploy a cada push
- ✅ Log de cada deploy no GitHub
- ✅ Notificações em caso de erro
