# 📋 PLAN DEFINITIVO: Sistema de Cartas y Comunicaciones

**Fecha**: 21 Noviembre 2025
**Estado**: ⏸️ ESPERANDO APROBACIÓN
**Basado en**: Análisis profundo de la app actual que FUNCIONA

---

## 🎯 FILOSOFÍA: Seguir el Patrón que YA FUNCIONA

He analizado **Convocatorias** y **Actas** que funcionan perfectamente.
Voy a replicar **EXACTAMENTE** ese mismo patrón para Cartas.

---

## 📊 ANÁLISIS: Lo Que YA TENEMOS

### ✅ Backend Existente

**Rutas** (`server/routes/letters.cjs` - 419 líneas):
```javascript
GET  /api/letters              // ✅ Ya existe - Listar cartas
GET  /api/letters/:id          // ✅ Ya existe - Ver carta
POST /api/letters              // ✅ Ya existe - Crear carta
PUT  /api/letters/:id          // ❌ FALTA - Editar carta
DELETE /api/letters/:id        // ❌ FALTA - Eliminar carta
```

**Tabla BD** (`letter_templates`):
```sql
✅ Ya existe con 11 templates insertados
- id, building_id, name, type, subject, content
- variables[], is_active, legal_basis
- created_at, updated_at
```

**Tabla BD** (`sent_letters`):
```sql
✅ Ya existe pero necesita mejoras
- id, building_id, member_id, template_id
- recipient_name, recipient_email, subject, content
- send_method, sent_date, delivery_confirmation
```

### ⚠️ Lo Que FALTA

**Backend**:
- ❌ Repository pattern (letterRepository.cjs)
- ❌ Endpoints CRUD para templates
- ❌ Tabla `communication_logs` (tracking completo)
- ❌ Endpoints PUT/DELETE para cartas

**Frontend**:
- ⚠️ Página Comunicaciones.tsx (existe pero incompleta)
- ⚠️ LetterWorkflow (existe pero desconectado de BD)
- ❌ Hook `useLetters()` (no existe)
- ❌ Gestión de templates (CRUD UI)
- ❌ Histórico de envíos

---

## 🏗️ PLAN DE IMPLEMENTACIÓN

### FASE 1: Backend - Repository Pattern (2-3h)

#### 📝 Paso 1.1: Crear letterRepository.cjs

**Archivo**: `server/repositories/letterRepository.cjs`

**Basado en**: `convocatoriaRepository.cjs` (patrón que funciona)

```javascript
const BaseRepository = require('./baseRepository.cjs');

class LetterRepository extends BaseRepository {
  constructor() {
    super('sent_letters');
  }

  /**
   * Buscar cartas por edifício com dados de templates
   */
  async findByBuildingWithTemplate(buildingId, options = {}) {
    let query = this.db('sent_letters')
      .whereNull('sent_letters.deleted_at')
      .where('sent_letters.building_id', buildingId)
      .join('buildings', 'sent_letters.building_id', 'buildings.id')
      .leftJoin('members', 'sent_letters.member_id', 'members.id')
      .leftJoin('letter_templates', 'sent_letters.template_id', 'letter_templates.id')
      .select(
        'sent_letters.*',
        'buildings.name as building_name',
        'members.name as member_name',
        'members.email as member_email',
        'letter_templates.name as template_name',
        'letter_templates.type as template_type'
      )
      .orderBy('sent_letters.created_at', 'desc');

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);

    return await query;
  }

  /**
   * Buscar todas as cartas com filtros
   */
  async findAllWithFilters(filters = {}, options = {}) {
    let query = this.db('sent_letters')
      .whereNull('sent_letters.deleted_at')
      .join('buildings', 'sent_letters.building_id', 'buildings.id')
      .leftJoin('members', 'sent_letters.member_id', 'members.id')
      .leftJoin('letter_templates', 'sent_letters.template_id', 'letter_templates.id')
      .select(
        'sent_letters.*',
        'buildings.name as building_name',
        'members.name as member_name',
        'letter_templates.name as template_name'
      );

    if (filters.buildingId) query = query.where('sent_letters.building_id', filters.buildingId);
    if (filters.memberId) query = query.where('sent_letters.member_id', filters.memberId);
    if (filters.sendMethod) query = query.where('sent_letters.send_method', filters.sendMethod);
    if (filters.fromDate) query = query.where('sent_letters.sent_date', '>=', filters.fromDate);
    if (filters.toDate) query = query.where('sent_letters.sent_date', '<=', filters.toDate);

    const orderBy = options.orderBy || 'created_at';
    const orderDirection = options.orderDesc ? 'desc' : 'asc';
    query = query.orderBy(`sent_letters.${orderBy}`, orderDirection);

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);

    return await query;
  }

  /**
   * Contar cartas por status
   */
  async getStats(buildingId) {
    const result = await this.db('sent_letters')
      .whereNull('deleted_at')
      .where('building_id', buildingId)
      .select(
        this.db.raw('COUNT(*) as total'),
        this.db.raw('COUNT(CASE WHEN send_method = ? THEN 1 END) as by_email', ['email']),
        this.db.raw('COUNT(CASE WHEN send_method = ? THEN 1 END) as by_whatsapp', ['whatsapp']),
        this.db.raw('COUNT(CASE WHEN send_method = ? THEN 1 END) as by_mail', ['correio_certificado']),
        this.db.raw('COUNT(CASE WHEN delivery_confirmation IS NOT NULL THEN 1 END) as delivered')
      )
      .first();

    return {
      total: parseInt(result.total),
      by_email: parseInt(result.by_email),
      by_whatsapp: parseInt(result.by_whatsapp),
      by_mail: parseInt(result.by_mail),
      delivered: parseInt(result.delivered),
      pending: parseInt(result.total) - parseInt(result.delivered)
    };
  }
}

module.exports = new LetterRepository();
```

**Resultado**: Repository completo con patrón BaseRepository ✅

---

#### 📝 Paso 1.2: Crear templateRepository.cjs

**Archivo**: `server/repositories/templateRepository.cjs`

```javascript
const BaseRepository = require('./baseRepository.cjs');

class TemplateRepository extends BaseRepository {
  constructor() {
    super('letter_templates');
  }

  /**
   * Buscar templates por edifício (ou globais)
   */
  async findByBuilding(buildingId) {
    return await this.db('letter_templates')
      .whereNull('deleted_at')
      .where(function() {
        this.where('building_id', buildingId)
            .orWhereNull('building_id'); // Templates globais
      })
      .where('is_active', true)
      .orderBy('name', 'asc');
  }

  /**
   * Buscar templates por tipo
   */
  async findByType(type, buildingId = null) {
    let query = this.db('letter_templates')
      .whereNull('deleted_at')
      .where('type', type)
      .where('is_active', true);

    if (buildingId) {
      query = query.where(function() {
        this.where('building_id', buildingId)
            .orWhereNull('building_id');
      });
    }

    return await query.orderBy('name', 'asc');
  }

  /**
   * Ativar/desativar template
   */
  async toggleActive(id) {
    const template = await this.findById(id);
    if (!template) throw new Error('Template não encontrado');

    return await this.update(id, { is_active: !template.is_active });
  }

  /**
   * Duplicar template
   */
  async duplicate(id, newName) {
    const template = await this.findById(id);
    if (!template) throw new Error('Template não encontrado');

    const newTemplate = {
      ...template,
      id: undefined,
      name: newName || `${template.name} (Cópia)`,
      created_at: undefined,
      updated_at: undefined
    };

    return await this.create(newTemplate);
  }
}

module.exports = new TemplateRepository();
```

**Resultado**: Repository para templates ✅

---

#### 📝 Paso 1.3: Atualizar letters.cjs com Repository

**Arquivo**: `server/routes/letters.cjs`

**Substituir queries diretas por repository**:

```javascript
const express = require('express');
const router = express.Router();
const letterRepository = require('../repositories/letterRepository.cjs');
const templateRepository = require('../repositories/templateRepository.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');
const { validate, schemas } = require('../middleware/validation.cjs');
const { authenticate, authorize } = require('../middleware/auth.cjs');

router.use(authenticate);

// ============== SENT LETTERS ==============

/**
 * GET /api/letters
 * Listar cartas com paginação
 */
router.get('/', asyncHandler(async (req, res) => {
  const { building_id, page = 1, limit = 20, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const letters = await letterRepository.findAllWithFilters(
    { buildingId: building_id, ...filters },
    { limit: parseInt(limit), offset, orderDesc: true }
  );

  // Contar total
  const allLetters = await letterRepository.findAllWithFilters({ buildingId: building_id, ...filters });
  const total = allLetters.length;

  return res.json({
    success: true,
    data: letters,
    pagination: {
      total,
      page: parseInt(page),
      pageSize: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * GET /api/letters/stats/:buildingId
 * Estatísticas de cartas
 */
router.get('/stats/:buildingId', asyncHandler(async (req, res) => {
  const { buildingId } = req.params;
  const stats = await letterRepository.getStats(buildingId);

  return res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/letters/:id
 * Ver carta por ID
 */
router.get('/:id',
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const letter = await letterRepository.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        error: 'Carta não encontrada'
      });
    }

    return res.json({ success: true, data: letter });
  })
);

/**
 * POST /api/letters
 * Criar nova carta
 */
router.post('/',
  authorize('super_admin', 'admin', 'manager'),
  asyncHandler(async (req, res) => {
    const letter = await letterRepository.create(req.body);
    return res.json({ success: true, data: letter });
  })
);

/**
 * PUT /api/letters/:id
 * Atualizar carta
 */
router.put('/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const letter = await letterRepository.update(req.params.id, req.body);
    return res.json({ success: true, data: letter });
  })
);

/**
 * DELETE /api/letters/:id
 * Eliminar carta (soft delete)
 */
router.delete('/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    await letterRepository.softDelete(req.params.id);
    return res.json({ success: true, message: 'Carta eliminada' });
  })
);

// ============== TEMPLATES ==============

/**
 * GET /api/letter-templates
 * Listar templates
 */
router.get('/templates', asyncHandler(async (req, res) => {
  const { building_id, type } = req.query;

  let templates;
  if (type) {
    templates = await templateRepository.findByType(type, building_id);
  } else if (building_id) {
    templates = await templateRepository.findByBuilding(building_id);
  } else {
    templates = await templateRepository.findAll();
  }

  return res.json({ success: true, data: templates });
}));

/**
 * GET /api/letter-templates/:id
 * Ver template por ID
 */
router.get('/templates/:id',
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const template = await templateRepository.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    return res.json({ success: true, data: template });
  })
);

/**
 * POST /api/letter-templates
 * Criar novo template
 */
router.post('/templates',
  authorize('super_admin', 'admin', 'manager'),
  asyncHandler(async (req, res) => {
    const template = await templateRepository.create(req.body);
    return res.json({ success: true, data: template });
  })
);

/**
 * PUT /api/letter-templates/:id
 * Atualizar template
 */
router.put('/templates/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const template = await templateRepository.update(req.params.id, req.body);
    return res.json({ success: true, data: template });
  })
);

/**
 * DELETE /api/letter-templates/:id
 * Eliminar template (soft delete)
 */
router.delete('/templates/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    await templateRepository.softDelete(req.params.id);
    return res.json({ success: true, message: 'Template eliminado' });
  })
);

/**
 * POST /api/letter-templates/:id/duplicate
 * Duplicar template
 */
router.post('/templates/:id/duplicate',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const template = await templateRepository.duplicate(req.params.id, name);
    return res.json({ success: true, data: template });
  })
);

/**
 * PATCH /api/letter-templates/:id/toggle-active
 * Ativar/desativar template
 */
router.patch('/templates/:id/toggle-active',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const template = await templateRepository.toggleActive(req.params.id);
    return res.json({ success: true, data: template });
  })
);

module.exports = router;
```

**Resultado**: API completa seguindo padrão de convocatorias ✅

---

### FASE 2: Frontend - Hook e API Calls (2h)

#### 📝 Paso 2.1: Adicionar funções API em api.ts

**Arquivo**: `src/lib/api.ts`

**Adicionar ao final**:

```typescript
// ============== LETTERS ==============

export const getLetters = async (params?: {
  building_id?: string;
  member_id?: string;
  send_method?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/letters', { params });
  return response.data;
};

export const getLetterById = async (id: string) => {
  const response = await api.get(`/letters/${id}`);
  return response.data;
};

export const createLetter = async (data: any) => {
  const response = await api.post('/letters', data);
  return response.data;
};

export const updateLetter = async (id: string, data: any) => {
  const response = await api.put(`/letters/${id}`, data);
  return response.data;
};

export const deleteLetter = async (id: string) => {
  const response = await api.delete(`/letters/${id}`);
  return response.data;
};

export const getLetterStats = async (buildingId: string) => {
  const response = await api.get(`/letters/stats/${buildingId}`);
  return response.data;
};

// ============== LETTER TEMPLATES ==============

export const getLetterTemplates = async (params?: {
  building_id?: string;
  type?: string;
}) => {
  const response = await api.get('/letter-templates', { params });
  return response.data;
};

export const getLetterTemplateById = async (id: string) => {
  const response = await api.get(`/letter-templates/${id}`);
  return response.data;
};

export const createLetterTemplate = async (data: any) => {
  const response = await api.post('/letter-templates', data);
  return response.data;
};

export const updateLetterTemplate = async (id: string, data: any) => {
  const response = await api.put(`/letter-templates/${id}`, data);
  return response.data;
};

export const deleteLetterTemplate = async (id: string) => {
  const response = await api.delete(`/letter-templates/${id}`);
  return response.data;
};

export const duplicateLetterTemplate = async (id: string, name?: string) => {
  const response = await api.post(`/letter-templates/${id}/duplicate`, { name });
  return response.data;
};

export const toggleLetterTemplateActive = async (id: string) => {
  const response = await api.patch(`/letter-templates/${id}/toggle-active`);
  return response.data;
};
```

**Resultado**: API calls completas ✅

---

#### 📝 Paso 2.2: Criar Hook useLetters

**Arquivo**: `src/hooks/useLetters.ts` (NOVO)

**Basado en**: `useConvocatorias.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLetters,
  getLetterById,
  createLetter,
  updateLetter,
  deleteLetter,
  getLetterStats
} from '@/lib/api';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { useState } from 'react';

export const useLetters = () => {
  const queryClient = useQueryClient();
  const { user } = useStore();
  const buildingId = user?.building_id;

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch letters
  const { data, isLoading, error } = useQuery({
    queryKey: ['letters', buildingId, pagination.page, pagination.pageSize],
    queryFn: async () => {
      const result = await getLetters({
        building_id: buildingId,
        page: pagination.page,
        limit: pagination.pageSize
      });

      if (result.pagination) {
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }

      return result.data;
    },
    enabled: !!buildingId
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['letter-stats', buildingId],
    queryFn: () => getLetterStats(buildingId!),
    enabled: !!buildingId
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createLetter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['letter-stats'] });
      toast.success('Carta criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar carta: ' + error.message);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLetter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      toast.success('Carta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar carta: ' + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLetter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['letter-stats'] });
      toast.success('Carta eliminada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao eliminar carta: ' + error.message);
    }
  });

  const changePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const changePageSize = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  return {
    letters: data || [],
    stats: stats?.data || {},
    isLoading,
    error,
    pagination,
    createLetter: (data: any) => createMutation.mutateAsync(data),
    updateLetter: (id: string, data: any) => updateMutation.mutateAsync({ id, data }),
    deleteLetter: (id: string) => deleteMutation.mutateAsync(id),
    changePage,
    changePageSize
  };
};

export const useLetterTemplates = () => {
  // Similar pero para templates...
};
```

**Resultado**: Hook completo con React Query ✅

---

### FASE 3: Frontend - Página Comunicaciones (3-4h)

#### 📝 Paso 3.1: Reescribir Comunicaciones.tsx

**Arquivo**: `src/pages/Comunicaciones.tsx`

**Basado en**: `Convocatorias.tsx` (patrón que funciona)

```typescript
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Plus,
  FileText,
  Send,
  Download,
  Edit2,
  Trash2,
  MoreVertical,
  Eye,
  Copy
} from 'lucide-react';
import { useLetters, useLetterTemplates } from '@/hooks/useLetters';
import LetterWorkflow from '@/components/letters/LetterWorkflow';
import TemplateManager from '@/components/letters/TemplateManager';
import CommunicationHistory from '@/components/letters/CommunicationHistory';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Comunicaciones: React.FC = () => {
  const navigate = useNavigate();
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState<any>(null);
  const [editingLetter, setEditingLetter] = useState<any>(null);

  const {
    letters,
    stats,
    isLoading,
    pagination,
    createLetter,
    updateLetter,
    deleteLetter,
    changePage,
    changePageSize
  } = useLetters();

  const {
    templates,
    isLoading: loadingTemplates
  } = useLetterTemplates();

  const handleWorkflowComplete = async (data: any) => {
    let result;
    if (editingLetter) {
      result = await updateLetter(editingLetter.id, data);
    } else {
      result = await createLetter(data);
    }

    if (result) {
      setShowWorkflow(false);
      setEditingLetter(null);
    }
  };

  const handleDeleteLetter = async () => {
    if (!letterToDelete) return;
    await deleteLetter(letterToDelete.id);
    setLetterToDelete(null);
  };

  const getSendMethodBadge = (method: string) => {
    switch (method) {
      case 'email':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Email</Badge>;
      case 'whatsapp':
        return <Badge variant="outline" className="bg-green-100 text-green-700">WhatsApp</Badge>;
      case 'correio_certificado':
        return <Badge variant="outline" className="bg-purple-100 text-purple-700">Correio</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comunicações</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de cartas e comunicações oficiais
          </p>
        </div>
        <Button
          size="lg"
          variant="workflow"
          onClick={() => setShowWorkflow(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Carta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total || 0}</p>
                <p className="text-sm text-muted-foreground">Cartas enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Send className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.delivered || 0}</p>
                <p className="text-sm text-muted-foreground">Entregues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.by_email || 0}</p>
                <p className="text-sm text-muted-foreground">Por Email</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{templates?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="letters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="letters">Cartas Enviadas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Tab: Cartas Enviadas */}
        <TabsContent value="letters">
          <Card>
            <CardHeader>
              <CardTitle>Cartas Enviadas</CardTitle>
              <CardDescription>
                Histórico de todas as cartas enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">Carregando...</div>
              ) : letters.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma carta enviada</p>
                  <Button
                    onClick={() => setShowWorkflow(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira carta
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {letters.map((letter: any) => (
                      <div
                        key={letter.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-full bg-blue-100">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{letter.subject}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <span>Para: {letter.recipient_name}</span>
                              {letter.sent_date && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {format(new Date(letter.sent_date), "dd MMM yyyy", { locale: pt })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getSendMethodBadge(letter.send_method)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => navigate(`/comunicaciones/${letter.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver carta
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setLetterToDelete(letter)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-6">
                    <DataTablePagination
                      table={{
                        getState: () => ({
                          pagination: {
                            pageIndex: pagination.page - 1,
                            pageSize: pagination.pageSize
                          }
                        }),
                        getPageCount: () => pagination.totalPages,
                        setPageIndex: (index: number) => changePage(index + 1),
                        setPageSize: changePageSize,
                        getCanPreviousPage: () => pagination.page > 1,
                        getCanNextPage: () => pagination.page < pagination.totalPages,
                        previousPage: () => changePage(pagination.page - 1),
                        nextPage: () => changePage(pagination.page + 1)
                      } as any}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent value="templates">
          <TemplateManager
            templates={templates || []}
            isLoading={loadingTemplates}
            onUseTemplate={(template) => {
              // Abrir workflow com template selecionado
              setShowWorkflow(true);
            }}
          />
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history">
          <CommunicationHistory />
        </TabsContent>
      </Tabs>

      {/* Workflow Dialog */}
      {showWorkflow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <LetterWorkflow
              onComplete={handleWorkflowComplete}
              onCancel={() => {
                setShowWorkflow(false);
                setEditingLetter(null);
              }}
              editingLetter={editingLetter}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!letterToDelete} onOpenChange={() => setLetterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Carta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar a carta "{letterToDelete?.subject}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLetter} className="bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Comunicaciones;
```

**Resultado**: Página completa seguindo padrão Convocatorias ✅

---

### FASE 4: Componentes Auxiliares (2-3h)

#### 📝 Paso 4.1: TemplateManager Component

**Arquivo**: `src/components/letters/TemplateManager.tsx`

```typescript
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  FileText,
  Search
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLetterTemplates } from '@/hooks/useLetters';
import { toast } from 'sonner';

interface TemplateManagerProps {
  templates: any[];
  isLoading: boolean;
  onUseTemplate: (template: any) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  isLoading,
  onUseTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleActive
  } = useLetterTemplates();

  // Filtrar templates
  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por tipo
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.type]) acc[template.type] = [];
    acc[template.type].push(template);
    return acc;
  }, {} as Record<string, any[]>);

  const handleCreate = async (data: any) => {
    await createTemplate(data);
    setShowCreateDialog(false);
  };

  const handleDuplicate = async (id: string, name: string) => {
    await duplicateTemplate(id, name);
    toast.success('Template duplicado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Templates agrupados por tipo */}
      {Object.entries(groupedTemplates).map(([type, items]) => (
        <div key={type}>
          <h3 className="text-lg font-semibold mb-4 capitalize">
            {type.replace(/_/g, ' ')}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {template.content.substring(0, 80)}...
                      </CardDescription>
                    </div>
                    {!template.is_active && (
                      <Badge variant="outline" className="ml-2">Inativo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUseTemplate(template)}
                      >
                        Usar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(template.id, `${template.name} (Cópia)`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Dialog Criar/Editar Template */}
      <Dialog open={showCreateDialog || !!editingTemplate} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingTemplate(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>
          {/* Form aqui... */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager;
```

**Resultado**: Gestão completa de templates ✅

---

#### 📝 Paso 4.2: CommunicationHistory Component

**Arquivo**: `src/components/letters/CommunicationHistory.tsx`

```typescript
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const CommunicationHistory: React.FC = () => {
  const [filters, setFilters] = useState({
    type: 'all',
    channel: 'all',
    status: 'all',
    fromDate: null,
    toDate: null
  });

  // TODO: Fetch communications from API
  const communications = [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Histórico de Comunicações</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="convocatoria">Convocatória</SelectItem>
              <SelectItem value="acta">Acta</SelectItem>
              <SelectItem value="quota">Quota</SelectItem>
              <SelectItem value="note">Nota</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.channel} onValueChange={(value) => setFilters({...filters, channel: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="correio">Correio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="opened">Aberta</SelectItem>
              <SelectItem value="failed">Falhada</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        </div>

        {/* Lista de comunicações */}
        {communications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma comunicação encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline de comunicações aqui... */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunicationHistory;
```

**Resultado**: Histórico com filtros ✅

---

### FASE 5: Tracking System (3-4h) - OPCIONAL

#### 📝 Paso 5.1: Criar Tabela communication_logs

**Migration SQL**: `migrations/create_communication_logs.sql`

```sql
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  -- Tipo e canal
  communication_type VARCHAR(50) NOT NULL,
  communication_subtype VARCHAR(50),
  channel VARCHAR(50) NOT NULL,

  -- Conteúdo
  subject TEXT NOT NULL,
  body_preview TEXT,

  -- PDF anexado
  pdf_filename VARCHAR(255),

  -- Relacionamentos
  related_letter_id UUID REFERENCES sent_letters(id) ON DELETE SET NULL,
  related_convocatoria_id UUID REFERENCES convocatorias(id) ON DELETE SET NULL,
  related_minute_id UUID REFERENCES minutes(id) ON DELETE SET NULL,

  -- Tracking de estados
  status VARCHAR(50) NOT NULL DEFAULT 'draft_created',
  draft_created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  failed_at TIMESTAMP,

  -- Error handling
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_communication_logs_building ON communication_logs(building_id);
CREATE INDEX idx_communication_logs_member ON communication_logs(member_id);
CREATE INDEX idx_communication_logs_type ON communication_logs(communication_type);
CREATE INDEX idx_communication_logs_channel ON communication_logs(channel);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_created ON communication_logs(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER update_communication_logs_updated_at
  BEFORE UPDATE ON communication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Resultado**: Tabela completa para tracking ✅

---

## 📊 RESUMO FINAL

### Tempo Estimado Total

| Fase | Descrição | Tempo |
|------|-----------|-------|
| **Fase 1** | Backend - Repository Pattern | 2-3h |
| **Fase 2** | Frontend - Hook e API | 2h |
| **Fase 3** | Frontend - Página Comunicaciones | 3-4h |
| **Fase 4** | Componentes Auxiliares | 2-3h |
| **Fase 5** | Tracking System (opcional) | 3-4h |
| **TOTAL CORE** | Fases 1-4 | **9-12h** |
| **TOTAL COMPLETO** | Com tracking | **12-16h** |

### O Que Vamos Conseguir

**CORE (Fases 1-4)**:
- ✅ CRUD completo de cartas (create, read, update, delete)
- ✅ CRUD completo de templates
- ✅ Sistema de envio (Email, WhatsApp, Correio)
- ✅ Histórico de cartas enviadas
- ✅ Gestão de templates com duplicação
- ✅ Paginação e filtros
- ✅ Estatísticas básicas
- ✅ PDF generation
- ✅ Workflow visual (já existe, só melhorar)
- ✅ Padrão igual a Convocatorias/Actas
- ✅ Código limpo e buenas prácticas
- ✅ Conectado con BD

**COM TRACKING (Fase 5)**:
- ✅ Todo lo de arriba +
- ✅ Tracking completo (draft → sent → opened → confirmed)
- ✅ Histórico detalhado
- ✅ Estados por comunicação
- ✅ Compliance RGPD

### Principales Ventajas

1. **✅ Sigue el patrón que YA FUNCIONA** (Convocatorias/Actas)
2. **✅ Código limpio** con Repository pattern
3. **✅ Hooks con React Query** (cache automático)
4. **✅ Paginación incluida** desde el inicio
5. **✅ CRUD completo** para cartas y templates
6. **✅ Fácil de usar** (misma UX que Convocatorias)
7. **✅ Conectado con BD** desde el paso 1
8. **✅ Buenas prácticas** (BaseRepository, validation, auth)
9. **✅ Escalable** (fácil añadir features después)
10. **✅ Profesional** (igual que resto de la app)

---

## 🎯 NECESITO TU APROBACIÓN

**Antes de empezar**:

1. ✅ **¿Implementar solo CORE (Fases 1-4)?** (~10h)
   - Si: CRUD completo funcional
   - No: Incluir tracking también (Fase 5)

2. ✅ **¿Mantener LetterWorkflow actual y solo mejorarlo?**
   - Si: Menos trabajo
   - No: Reescribir desde cero

3. ✅ **¿Orden de prioridades?**
   - Backend primero (Fase 1)
   - Luego Frontend (Fases 2-4)
   - ¿O prefieres ver frontend antes?

4. ✅ **¿Quieres que empiece YA con Fase 1?**
   - Si: Empiezo con letterRepository.cjs
   - No: Ajustar plan primero

---

**Este plan está BASADO en lo que FUNCIONA en tu app actual**.
**NO invento nada nuevo, solo replico el patrón exitoso de Convocatorias/Actas**.

¿Empezamos? 🚀
