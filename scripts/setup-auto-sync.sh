#!/bin/bash

#############################################################
# Configurar Sincronização Automática para Neon
# Cria um cron job que sincroniza a BD local → Neon
#############################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_PATH="/Users/mini-server/docker-apps/apps/gestor-condominos/scripts/sync-to-neon.sh"
LOG_PATH="/Users/mini-server/docker-apps/apps/gestor-condominos/logs/neon-sync.log"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Configurar Sincronização Automática${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Criar diretório de logs
mkdir -p "$(dirname "$LOG_PATH")"

# Verificar se já existe cron job
if crontab -l 2>/dev/null | grep -q "sync-to-neon.sh"; then
    echo -e "${YELLOW}⚠${NC}  Já existe um cron job configurado"
    echo ""
    echo "Cron jobs atuais:"
    crontab -l | grep "sync-to-neon"
    echo ""
    read -p "Queres substituir? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado."
        exit 0
    fi
    # Remove existing cron job
    crontab -l | grep -v "sync-to-neon.sh" | crontab -
fi

# Adicionar novo cron job
# Executa todos os dias às 3:00 AM
CRON_JOB="0 3 * * * $SCRIPT_PATH >> $LOG_PATH 2>&1"

(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✓${NC} Cron job configurado com sucesso!"
echo ""
echo -e "${BLUE}Configuração:${NC}"
echo -e "  📅 Frequência: Diariamente às 3:00 AM"
echo -e "  📝 Script: $SCRIPT_PATH"
echo -e "  📄 Logs: $LOG_PATH"
echo ""
echo -e "${GREEN}A sincronização vai acontecer automaticamente!${NC}"
echo ""
echo -e "${BLUE}Comandos úteis:${NC}"
echo -e "  • Ver cron jobs: ${YELLOW}crontab -l${NC}"
echo -e "  • Ver logs: ${YELLOW}tail -f $LOG_PATH${NC}"
echo -e "  • Sync manual: ${YELLOW}$SCRIPT_PATH${NC}"
echo -e "  • Remover auto-sync: ${YELLOW}crontab -e${NC} (e apagar a linha)"
echo ""
