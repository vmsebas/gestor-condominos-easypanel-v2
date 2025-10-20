# 🔄 Sincronização Automática: Local → Neon

## ✅ Sistema Configurado e Funcionando!

A tua base de dados está configurada com **sincronização automática** para a cloud (Neon).

---

## 📊 Configuração Atual

### Base de Dados Principal (Local)
- **Tipo**: PostgreSQL 16.9 (Docker)
- **Host**: localhost:5432
- **Database**: gestor_condominos
- **Uso**: Trabalho diário, desenvolvimento

### Base de Dados Backup (Cloud - Neon)
- **Tipo**: PostgreSQL (Neon Serverless)
- **Região**: EU-West-2 (London)
- **Database**: Condominio_v2
- **Uso**: Backup automático, acesso remoto
- **URL**: `postgresql://Condominio_v2_owner:***@ep-mute-bird-ab4qk19x-pooler.eu-west-2.aws.neon.tech/Condominio_v2`

---

## 🚀 Como Usar

### Sincronização Manual (A qualquer momento)

```bash
cd /Users/mini-server/docker-apps/apps/gestor-condominos
./scripts/sync-to-neon.sh
```

Isto vai:
1. ✅ Criar backup da BD local
2. ✅ Sincronizar para Neon (cloud)
3. ✅ Verificar que tudo correu bem
4. ✅ Guardar backup local comprimido

---

## ⏰ Configurar Sincronização Automática

### Opção 1: Via Cron (Recomendado)

```bash
# 1. Abrir crontab
crontab -e

# 2. Adicionar esta linha (sync diário às 3:00 AM):
0 3 * * * /Users/mini-server/docker-apps/apps/gestor-condominos/scripts/sync-to-neon.sh >> /Users/mini-server/docker-apps/apps/gestor-condominos/logs/neon-sync.log 2>&1

# 3. Guardar e sair (ESC :wq no vim)
```

### Opção 2: Via launchd (macOS nativo)

Criar ficheiro: `~/Library/LaunchAgents/com.gestor-condominos.neon-sync.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gestor-condominos.neon-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/mini-server/docker-apps/apps/gestor-condominos/scripts/sync-to-neon.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>3</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/mini-server/docker-apps/apps/gestor-condominos/logs/neon-sync.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/mini-server/docker-apps/apps/gestor-condominos/logs/neon-sync-error.log</string>
</dict>
</plist>
```

Depois:
```bash
launchctl load ~/Library/LaunchAgents/com.gestor-condominos.neon-sync.plist
```

---

## 📝 Ver Logs

```bash
# Ver logs em tempo real
tail -f /Users/mini-server/docker-apps/apps/gestor-condominos/logs/neon-sync.log

# Ver últimas sincronizações
cat /Users/mini-server/docker-apps/apps/gestor-condominos/logs/neon-sync.log
```

---

## 🔍 Verificar Dados na Neon

### Via CLI (psql):
```bash
psql 'postgresql://Condominio_v2_owner:npg_VhvBFy7M1UeS@ep-mute-bird-ab4qk19x-pooler.eu-west-2.aws.neon.tech/Condominio_v2?sslmode=require'

# Depois no psql:
\dt                                    # Ver todas as tabelas
SELECT COUNT(*) FROM buildings;        # Contar edifícios
SELECT COUNT(*) FROM members;          # Contar condóminos
SELECT COUNT(*) FROM attendance_sheets;# Ver folhas de presença
```

### Via Neon Console:
1. Vai a: https://console.neon.tech
2. Login com a tua conta
3. Seleciona projeto: **Condominio_v2**
4. Usa o SQL Editor para queries

---

## 📦 Backups Guardados

Cada sincronização cria um backup local comprimido em:
```
/Users/mini-server/docker-apps/apps/gestor-condominos/backups/sync_to_neon_YYYYMMDD_HHMMSS.sql.gz
```

Para restaurar um backup:
```bash
# Descomprimir
gunzip backups/sync_to_neon_20251020_225855.sql.gz

# Restaurar localmente
docker exec -i postgres-master psql -U postgres < backups/sync_to_neon_20251020_225855.sql
```

---

## 🎯 Benefícios

✅ **BD Local (Primária)**:
- Performance máxima (localhost)
- Sem latência
- Desenvolvimento rápido

✅ **BD Neon (Backup)**:
- Backups automáticos da Neon
- Acesso de qualquer lugar
- SSL/TLS automático
- Escalabilidade
- Disaster recovery

---

## ⚠️ Notas Importantes

1. **A BD local é sempre a principal** - trabalhas normalmente
2. **Neon é só backup/clone** - sincroniza automaticamente
3. **Sincronização sobrescreve Neon** - não edites dados lá diretamente
4. **Backups locais guardados** - cada sync cria um backup local também
5. **URL Neon tem password** - não partilhes publicamente

---

## 🆘 Troubleshooting

### Erro de conexão ao Docker:
```bash
docker ps | grep postgres-master
# Se não estiver a correr:
cd /Users/mini-server/docker-apps
docker-compose up -d postgres-master
```

### Erro de conexão à Neon:
```bash
# Testar conexão
psql 'postgresql://Condominio_v2_owner:npg_VhvBFy7M1UeS@ep-mute-bird-ab4qk19x-pooler.eu-west-2.aws.neon.tech/Condominio_v2?sslmode=require' -c "SELECT 1"
```

### Ver estado do cron job:
```bash
crontab -l | grep neon-sync
```

---

## 📞 Suporte

Repositório: https://github.com/vmsebas/gestor-condominos-easypanel-v2
Última sincronização: 2025-10-20 22:59:22
Tabelas sincronizadas: 28
Backup size: 160KB

---

**🎉 Sistema de backup configurado e funcionando!**
