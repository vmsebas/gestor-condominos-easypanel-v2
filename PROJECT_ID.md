# 🏢 GESTOR DE CONDÓMINOS - PROJECT IDENTIFICATION

## ⚠️ THIS IS: "gestor-condominos-dark" v2.2.0 (PRODUCTION)

### Quick Identification
```bash
pwd
# Should be: /Users/mini-server/docker-apps/apps/gestor-condominos

cat package.json | grep '"name"'
# Should show: "gestor-condominos-dark"

git remote -v | grep origin
# Should show: gestor-condominos-easypanel-v2
```

### Active Features in THIS Version:
| Feature | Status | Description |
|---------|--------|-------------|
| Soft Delete | ✅ | All entities (convocatorias, members, minutes, etc.) |
| Dark Theme | ✅ | Default dark theme (no black pages) |
| PostgreSQL | ✅ | Docker container `postgres-master` |
| Attendance Sheets | ✅ | Digital signatures for assemblies |
| Communication Logs | ✅ | RGPD-compliant email/WhatsApp tracking |
| Workflows Actas | ✅ | 6-step meeting minutes workflow |

### Docker Services:
- **Container**: `gestor-condominos-app-1`
- **API Port**: 3002
- **Frontend Port**: 5173
- **Database**: `postgres-master:5432` → `gestor_condominos`

### GitHub:
- **Repo**: `vmsebas/gestor-condominos-easypanel-v2`
- **Branch**: `master`
- **Last Major Update**: October 30, 2025 (Soft Delete + Signatures)

### To Work on Other Versions:
If you need to work on a **different** version of gestor-condominos:

1. **Check current location**:
   ```bash
   pwd
   cat PROJECT_ID.md  # This file!
   ```

2. **Other versions locations**:
   - `gestor-condominos_OLD` → `/Users/mini-server/docker-apps/apps/gestor-condominos_OLD`
   - Any other version → Create new directory with clear name

3. **Before starting work, ALWAYS verify**:
   ```bash
   cat package.json | head -10
   git remote -v
   docker ps | grep gestor
   ```

### Quick Commands:
```bash
# Start development
npm run dev:all

# Check status
docker ps --filter "name=gestor-condominos-app-1"
docker logs gestor-condominos-app-1 --tail 20

# Database access
docker exec -it postgres-master psql -U postgres -d gestor_condominos

# Run tests
curl http://localhost:3002/api/health
```

---
**Created**: October 30, 2025  
**Purpose**: Prevent confusion between multiple gestor-condominos repositories
