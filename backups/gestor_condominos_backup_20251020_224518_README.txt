=================================================================
BACKUP DA BASE DE DADOS - Gestor de Condomínios
=================================================================

Data do Backup: 2025-10-20 22:45:18
Base de Dados: gestor_condominos
Servidor: postgres-master (PostgreSQL 16.9)

FICHEIROS:
- gestor_condominos_backup_20251020_224518.sql (154 KB)
- gestor_condominos_backup_20251020_224518.sql.gz (23 KB) - COMPRIMIDO

CONTEÚDO:
- 28 tabelas (incluindo schema e dados)
- Novas tabelas do sistema de Attendance Sheets:
  ✅ attendance_sheets
  ✅ attendees

TABELAS PRINCIPAIS COM DADOS:
- buildings (2 registos)
- members (9 registos)
- users (2 registos)
- convocatorias (4 registos)
- minutes (3 registos)
- transactions (4 registos)
- tasks (5 registos)
- documents (5 registos)
- attendance_sheets (0 registos - nova tabela)
- attendees (0 registos - nova tabela)

FEATURES INCLUÍDAS:
✅ Sistema de Comunicações (email, PDF, procurações)
✅ Sistema de Folhas de Presença com assinaturas digitais
✅ Sistema de Actas e Convocatórias
✅ Gestão de Condóminos e Frações
✅ Gestão Financeira e Transações
✅ Sistema de Tarefas e Documentos

RESTAURAR BACKUP:
# Descomprimir:
gunzip gestor_condominos_backup_20251020_224518.sql.gz

# Restaurar na base de dados local:
docker exec -i postgres-master psql -U postgres < gestor_condominos_backup_20251020_224518.sql

# Ou restaurar criando nova BD:
docker exec -i postgres-master psql -U postgres -c "DROP DATABASE IF EXISTS gestor_condominos_restore;"
docker exec -i postgres-master psql -U postgres < gestor_condominos_backup_20251020_224518.sql

NOTAS:
- Backup inclui DROP e CREATE statements
- Inclui todos os dados, schema, constraints e indexes
- Compatível com PostgreSQL 16+
- Tamanho comprimido: 23 KB (redução de 85%)

COMMIT GITHUB RELACIONADO:
Commit: 95e41f2
Mensagem: feat: implementação completa do sistema de Folhas de Presença
Repositório: https://github.com/vmsebas/gestor-condominos-easypanel-v2

=================================================================
Gerado automaticamente por Claude Code
Data: $(date)
=================================================================
