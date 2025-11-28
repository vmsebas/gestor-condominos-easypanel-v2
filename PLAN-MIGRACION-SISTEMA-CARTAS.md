# 📋 PLAN DETALLADO: Migración y Mejora del Sistema de Cartas

**Fecha**: 21 Noviembre 2025
**Analista**: Claude Code
**Estado**: ⏸️ ESPERANDO APROBACIÓN DEL USUARIO

---

## 🎯 OBJETIVO

Migrar y adaptar el **sistema completo de comunicaciones** del proyecto antiguo al proyecto actual, mejorándolo y adaptándolo a las necesidades específicas, **sin crear nada desde cero**, solo reutilizando y mejorando lo que ya existe.

---

## 📊 RESUMEN EJECUTIVO

### Lo Que VOY A USAR (del proyecto antiguo):

**Ubicación base**: `/Users/mini-server/proyectos/server/apps/gestor-condominos/gestor-condominos-easypanel-v2/`

| Componente | Tamaño | Qué Voy a Hacer |
|------------|--------|-----------------|
| **CommunicationsHub.tsx** | 20K | ✅ Migrar completo + adaptar UI |
| **MessageComposer.tsx** | 25K | ✅ Migrar + integrar workflow visual actual |
| **TemplateManager.tsx** | 25K | ✅ Migrar + conectar a BD actual |
| **CampaignManager.tsx** | 31K | ⏸️ Fase 2 (opcional) |
| **CommunicationHistory.tsx** | 22K | ✅ Migrar + adaptar filtros |
| **AutomationManager.tsx** | 30K | ⏸️ Fase 3 (opcional) |
| **letterGenerator.ts** | 270 líneas | ✅ Sustituir el actual (avanzado) |
| **emailService.ts** | 236 líneas | ✅ Migrar completo |
| **pdfExporter.ts** | 255 líneas | ✅ Migrar para HTML→PDF |
| **communicationTypes.ts** | 429 líneas | ✅ Migrar tipos + templates |

### Lo Que VOY A CONSERVAR (del proyecto actual):

| Componente | Razón |
|------------|-------|
| **LetterWorkflow.tsx** | Workflow visual muy bueno, solo adaptarlo |
| **SelectTemplateStep.tsx** | UI moderna, conectarla a templates antiguos |
| **EditContentStep.tsx** | Editor limpio, mejorarlo con sistema antiguo |
| **PreviewStep.tsx** | Bien hecho, mantenerlo |
| **SendStep.tsx** | Mantener estructura, mejorar envío |

---

## 📝 FASE 1: MIGRACIÓN BASE (Alta Prioridad)

### ✅ Paso 1.1: Preparar Estructura de Directorios

**Objetivo**: Organizar archivos antes de copiar

**Comandos a ejecutar**:
```bash
# Crear directorios necesarios
mkdir -p src/types/communications
mkdir -p src/services/email
mkdir -p src/utils/pdf
mkdir -p src/components/communications
mkdir -p src/hooks/communications

# Backup del sistema actual
cp -r src/components/letters src/components/letters_BACKUP_$(date +%Y%m%d)
cp src/lib/letterGenerator.ts src/lib/letterGenerator_BACKUP_$(date +%Y%m%d).ts
```

**Resultado esperado**:
- ✅ Directorios creados
- ✅ Backup completo del sistema actual
- ✅ Sin pérdida de código actual

---

### ✅ Paso 1.2: Migrar Sistema de Tipos y Templates

**Archivo origen**: `/proyectos/.../src/types/communicationTypes.ts` (429 líneas)

**Archivo destino**: `src/types/communications/index.ts`

**Qué contém**:
```typescript
// 8 TEMPLATES PREDEFINIDOS completos:

1. payment_reminder (Lembrete de Pagamento)
   Variáveis: memberName, month, quotaAmount, dueDate, paymentInstructions

2. meeting_notice (Aviso de Reunião)
   Variáveis: memberName, meetingType, meetingDate, meetingTime, agenda

3. maintenance_alert (Alerta de Manutenção)
   Variáveis: maintenanceType, maintenanceDate, estimatedDuration

4. general_announcement (Anúncio Geral)
   Variáveis: announcementTitle, announcementContent

5. emergency (Comunicação de Emergência)
   Variáveis: emergencyType, emergencyMessage, instructions

6. arrears_notice (Aviso de Morosidade)
   Variáveis: arrearAmount, oldestDueDate, arrearCount

7. document_ready (Documento Disponível)
   Variáveis: documentType, issueDate, downloadLink

8. system_notification (Notificação do Sistema)
   Variáveis: notificationType, notificationMessage
```

**Adaptaciones que voy a hacer**:
1. ✅ Renombrar para español (manteniendo compatibilidad)
2. ✅ Añadir templates de `insert-letter-templates-complete.sql` que faltan
3. ✅ Combinar lo mejor de ambos sistemas
4. ✅ Mantener estructura de tipos completa

**Resultado**:
- ✅ `src/types/communications/index.ts` creado
- ✅ 8 templates predefinidos + 11 de la BD = **19 templates total**
- ✅ Todos los tipos: CommunicationType, CommunicationStatus, etc.

---

### ✅ Paso 1.3: Migrar Generador de PDF Avanzado

**Archivo origen**: `/proyectos/.../src/utils/letters/letterGenerator.ts` (270 líneas)

**Archivo destino**: `src/utils/pdf/letterGenerator.ts`

**Funcionalidades AVANZADAS que tiene**:

```typescript
// 1. SUSTITUCIÓN DE VARIABLES con DOS sintaxes:
{{variable}}      // Sintaxe principal
${variable}       // Sintaxe alternativa

// 2. FILTROS en variables:
{{date.today | year}}         → "2025"
{{amount | currency}}         → "1.234,56 €"
{{text | uppercase}}          → "TEXTO"
{{text | lowercase}}          → "texto"

// 3. PROPIEDADES ANINHADAS:
{{building.address.street}}  → Navega em objetos
{{member.fraction.number}}   → Acesso profundo

// 4. FUNCIÓN HELPER:
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) =>
    current?.[key] ?? '', obj
  );
};

// 5. APLICAR FILTROS:
const applyFilter = (value: any, filter: string): string => {
  switch (filter.trim()) {
    case 'uppercase': return String(value).toUpperCase();
    case 'lowercase': return String(value).toLowerCase();
    case 'year': return new Date(value).getFullYear().toString();
    case 'currency': return formatCurrency(value);
    default: return String(value);
  }
};
```

**Mejoras que voy a aplicar**:
1. ✅ Mantener TODAS las funcionalidades avanzadas
2. ✅ Combinar con paginación del sistema actual
3. ✅ Añadir más filtros útiles:
   - `| date` → Formatar fecha portugués
   - `| phone` → Formatar teléfono
   - `| iban` → Formatar IBAN
4. ✅ Mejorar tipado TypeScript
5. ✅ Añadir JSDoc completo

**Resultado**:
- ✅ Sistema de variables 5x más potente que el actual
- ✅ Backward compatible con templates existentes
- ✅ Filtros personalizables

---

### ✅ Paso 1.4: Migrar Email Service con Nodemailer

**Archivo origen**: `/proyectos/.../src/services/emailService.ts` (236 líneas)

**Archivo destino**: `src/services/email/emailService.ts`

**Funcionalidades COMPLETAS**:

```typescript
class EmailService {
  // 1. CONFIGURACIÓN AUTOMÁTICA para proveedores:
  configureGmail(email: string, appPassword: string)
  configureOutlook(email: string, password: string)
  configureCustom(config: EmailConfig)

  // 2. TEST DE CONEXIÓN:
  async testConnection(): Promise<{ success: boolean; error?: string }>

  // 3. ENVÍO SIMPLE:
  async sendEmail(emailData: EmailData): Promise<EmailResult>

  // 4. ENVÍO EN LOTE (BULK):
  async sendBulkEmails(
    emails: EmailData[],
    delayMs: number = 1000,  // Anti-spam
    onProgress?: (progress: number, current: EmailData, result: EmailResult) => void
  ): Promise<{ sent: number; failed: number; results: EmailResult[] }>
}
```

**Features incluidas**:
- ✅ Retry automático en caso de fallo
- ✅ Rate limiting (delay entre emails)
- ✅ Progress callbacks para UI
- ✅ Soporte CC, BCC, attachments
- ✅ Validación de conexión antes de enviar
- ✅ Logs detalhados

**Mejoras que voy a aplicar**:
1. ✅ Añadir soporte para múltiples proveedores simultâneos
2. ✅ Queue system para grandes volumes
3. ✅ Templates HTML para emails
4. ✅ Preview de email antes de enviar
5. ✅ Estadísticas de envío
6. ✅ Integración con communication_logs

**Resultado**:
- ✅ Sistema de email profesional
- ✅ Sustituye mailto: por envío real
- ✅ Control total sobre envíos

---

### ✅ Paso 1.5: Migrar PDF Exporter (HTML → PDF)

**Archivo origen**: `/proyectos/.../src/utils/letters/pdfExporter.ts` (255 líneas)

**Archivo destino**: `src/utils/pdf/pdfExporter.ts`

**Funcionalidades**:
```typescript
// 1. EXPORTAR HTML para PDF:
exportHTMLToPDF(
  contentHtml: string,
  options: PDFExportOptions
): Promise<Blob>

// 2. EXPORTAR MÚLTIPLOS HTML:
exportMultipleHTMLToPDF(
  contentsHtml: string[],
  options: PDFExportOptions
): Promise<Blob>

// 3. GUARDAR BLOB:
saveBlob(blob: Blob, filename: string): void
```

**Uso**:
- ✅ Converte React components para PDF via html2canvas
- ✅ Suporta múltiplas páginas automáticas
- ✅ Margens configuráveis
- ✅ Orientação (portrait/landscape)
- ✅ Formato de página (A4, Letter, etc)

**Quando usar esto en vez de letterGenerator**:
- Templates HTML complexos com CSS
- Layouts personalizados
- Cartas com imagens/logos
- Preview visual exato antes de gerar PDF

**Resultado**:
- ✅ Opção adicional para gerar PDFs
- ✅ Melhor para layouts complexos
- ✅ Complementa letterGenerator.ts

---

## 📝 FASE 2: MIGRAÇÃO DE COMPONENTES UI (Alta Prioridad)

### ✅ Paso 2.1: Adaptar MessageComposer

**Archivo origen**: `/proyectos/.../src/components/communications/MessageComposer.tsx` (25K)

**Destino**: `src/components/communications/MessageComposer.tsx`

**O que este componente faz**:
```typescript
interface MessageComposerProps {
  templates: CommunicationTemplate[];
  onSend: (message: any) => Promise<void>;
  onCancel: () => void;
}

// Features completas:
1. Carregamento automático de membros
2. Filtros de membros:
   - Por tipo (owner/resident)
   - Por canal (email/sms/whatsapp)
   - Por apartamento
3. Seleção de template com preview
4. Editor rico com:
   - Inserção de variáveis
   - Preview em tempo real
   - Contador de caracteres
5. Seleção de membros com checkboxes
6. Programação de envío (scheduledFor)
7. Prioridade da mensagem
8. Tipo de canal (email/sms/whatsapp)
```

**Adaptaciones que voy a hacer**:
1. ✅ **Integrar con LetterWorkflow actual**:
   - Usar MessageComposer DENTRO de EditContentStep
   - Manter workflow visual de 4 pasos
   - MessageComposer substitui só a parte de edição

2. ✅ **Simplificar UI**:
   - Remover filtros avançados (manter só básicos)
   - UI mais limpa e moderna
   - Mantener funcionalidades core

3. ✅ **Conectar con emailService**:
   - Botón "Test Email Connection"
   - Progress bar durante envío bulk
   - Retry automático

4. ✅ **Mejorar inserción de variables**:
   - Panel lateral colapsable
   - Búsqueda de variables
   - Categorias (Edifício, Membro, Data, etc)

**Resultado**:
- ✅ EditContentStep.tsx atual substituído por MessageComposer
- ✅ Funcionalidades 5x más completas
- ✅ Workflow visual mantido

---

### ✅ Paso 2.2: Migrar TemplateManager

**Archivo origen**: `/proyectos/.../src/components/communications/TemplateManager.tsx` (25K)

**Destino**: `src/components/communications/TemplateManager.tsx`

**O que faz**:
```typescript
// CRUD COMPLETO de templates:
1. Listar templates por categoria
2. Criar novo template
3. Editar template existente
4. Eliminar template
5. Duplicar template
6. Carregar DEFAULT_TEMPLATES predefinidos
7. Extrair variáveis automaticamente do conteúdo
8. Preview do template antes de guardar
9. Ativar/desativar templates
10. Estatísticas de uso (useCount)
```

**Templates predefinidos incluídos**:
```typescript
DEFAULT_TEMPLATES = {
  payment_reminder: {
    name: 'Lembrete de Pagamento',
    subject: 'Lembrete: Quota do mês {{month}} - {{buildingName}}',
    content: `Caro(a) {{memberName}},

Este é um lembrete amigável de que a quota de condomínio do mês {{month}}
no valor de {{quotaAmount}} tem vencimento em {{dueDate}}.

Para evitar juros de mora, solicitamos que efetue o pagamento até à data indicada.

Dados para pagamento:
{{paymentInstructions}}

Em caso de dúvidas, contacte a administração.`,
    variables: ['memberName', 'month', 'quotaAmount', 'dueDate', 'paymentInstructions'],
    priority: 'normal'
  },
  // ... 7 templates más
}
```

**Adaptaciones**:
1. ✅ **Añadir a Comunicaciones.tsx como TAB**:
   ```tsx
   <Tabs>
     <TabsContent value="letters">Cartas Enviadas</TabsContent>
     <TabsContent value="templates">Modelos ← AQUÍ</TabsContent>
     <TabsContent value="history">Histórico</TabsContent>
   </Tabs>
   ```

2. ✅ **Conectar con BD actual**:
   - Endpoint: `POST /api/letter-templates`
   - Guardar en tabla `letter_templates`
   - Cargar DEFAULT_TEMPLATES na primeira vez

3. ✅ **UI moderna**:
   - Cards con preview
   - Categorias con badges
   - Search bar
   - Botón "Usar Template" → abre workflow

4. ✅ **Extração automática de variáveis**:
   ```typescript
   extractVariables(content: string): string[] {
     const regex = /\{\{([^}]+)\}\}/g;
     const matches = content.matchAll(regex);
     return [...new Set([...matches].map(m => m[1]))];
   }
   ```

**Resultado**:
- ✅ CRUD completo de templates
- ✅ 8 templates predefinidos cargados
- ✅ UI integrada en Comunicaciones.tsx

---

### ✅ Paso 2.3: Migrar CommunicationHistory

**Archivo origen**: `/proyectos/.../src/components/communications/CommunicationHistory.tsx` (22K)

**Destino**: `src/components/communications/CommunicationHistory.tsx`

**O que faz**:
```typescript
// HISTÓRICO COMPLETO de todas as comunicações:
1. Listar todas as comunicações (cartas, emails, whatsapp)
2. Filtros avançados:
   - Por data (range)
   - Por tipo (convocatoria, acta, quota, note)
   - Por canal (email, whatsapp, correio)
   - Por estado (sent, delivered, read, failed)
   - Por membro específico
3. View detalhes de cada comunicação
4. Reenviar comunicação
5. Marcar como lida/confirmada
6. Exportar para CSV/Excel
7. Estatísticas:
   - Total enviadas
   - Taxa de entrega
   - Taxa de leitura
   - Falhas
```

**Estructura de datos (communication_logs)**:
```typescript
interface CommunicationLog {
  id: string;
  member_id: string;
  building_id: string;

  // Tipo e canal
  communication_type: 'convocatoria' | 'acta' | 'quota' | 'note';
  communication_subtype: string;
  channel: 'email' | 'whatsapp' | 'correio_certificado';

  // Contenido
  subject: string;
  body_preview: string; // Primeiros 200 chars
  full_content: string;

  // PDF anexado
  pdf_url: string;
  pdf_filename: string;

  // Relacionamentos
  related_convocatoria_id?: string;
  related_minute_id?: string;
  related_transaction_id?: string;

  // Tracking de estados
  status: 'draft_created' | 'sent' | 'opened' | 'confirmed' | 'failed';
  draft_created_at: Date;
  sent_at?: Date;
  opened_at?: Date;
  confirmed_at?: Date;

  // Metadata adicional
  metadata: {
    ip_address?: string;
    user_agent?: string;
    error_message?: string;
  };
}
```

**Adaptaciones**:
1. ✅ **Añadir como TAB en Comunicaciones.tsx**:
   ```tsx
   <TabsContent value="history">
     <CommunicationHistory />
   </TabsContent>
   ```

2. ✅ **Criar tabela communication_logs**:
   ```sql
   CREATE TABLE communication_logs (
     -- Todos os campos acima
   );
   ```

3. ✅ **Conectar con SendStep**:
   - Guardar log ANTES de enviar (status: draft_created)
   - Actualizar a sent após enviar
   - Guardar PDF_URL após gerar

4. ✅ **Timeline visual**:
   - Draft → Sent → Opened → Confirmed
   - Con timestamps
   - Con iconos de estado

5. ✅ **Integración con outros módulos**:
   - Ver carta desde Convocatoria detail
   - Ver carta desde Acta detail
   - Ver carta desde Miembro detail

**Resultado**:
- ✅ Histórico completo de todas as comunicações
- ✅ Tracking de estados profissional
- ✅ Compliance RGPD (logs auditables)

---

### ✅ Paso 2.4: Integrar CommunicationsHub

**Archivo origen**: `/proyectos/.../src/components/communications/CommunicationsHub.tsx` (20K)

**Destino**: `src/pages/Comunicaciones.tsx` (sustituir actual)

**O que é CommunicationsHub**:
```typescript
// HUB CENTRAL para todo o sistema de comunicações:

1. Dashboard con estadísticas:
   - Total sent
   - Delivery rate
   - Read rate
   - Bounce rate
   - Por tipo (convocatoria, acta, quota, note)
   - Por canal (email, whatsapp, correio)
   - Este mes vs mês anterior

2. Tabs organizadas:
   - 📬 Composer (enviar nova comunicação)
   - 📋 Templates (gestão de templates)
   - 📊 History (histórico completo)
   - 🎯 Campaigns (campanhas massivas) ← Fase 3
   - ⚙️ Automation (automatizações) ← Fase 3

3. Recent Messages (últimas 10)
4. Ações rápidas:
   - Nova carta
   - Lembrete pagamento
   - Convocatória urgente
```

**Adaptaciones**:
1. ✅ **Sustituir Comunicaciones.tsx actual**:
   - Manter nome do arquivo
   - Usar CommunicationsHub como base
   - Adaptar à estrutura actual

2. ✅ **Mantener workflow visual**:
   - CommunicationsHub abre LetterWorkflow
   - MessageComposer dentro do workflow
   - Best of both worlds

3. ✅ **Dashboard com charts**:
   - Usar recharts (já está em package.json)
   - Bar chart: Enviadas por mês
   - Pie chart: Por canal
   - Line chart: Taxa de entrega

4. ✅ **Stats reais desde BD**:
   ```typescript
   const stats = {
     totalSent: await getCommunicationCount(buildingId),
     deliveryRate: await getDeliveryRate(buildingId),
     readRate: await getReadRate(buildingId),
     byType: await getCountByType(buildingId),
     byChannel: await getCountByChannel(buildingId)
   };
   ```

**Resultado**:
- ✅ Hub central completo
- ✅ Dashboard com estadísticas
- ✅ Todo integrado num só lugar

---

## 📝 FASE 3: BACKEND E BD (Alta Prioridad)

### ✅ Paso 3.1: Criar Tabela communication_logs

**Arquivo SQL**: `migrations/20251121_create_communication_logs.sql`

```sql
-- TABELA PRINCIPAL para histórico
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  -- Tipo e canal
  communication_type VARCHAR(50) NOT NULL,
    -- 'convocatoria', 'acta', 'quota', 'note', 'letter'
  communication_subtype VARCHAR(50),
  channel VARCHAR(50) NOT NULL,
    -- 'email', 'whatsapp', 'correio_certificado', 'sms'

  -- Conteúdo
  subject TEXT NOT NULL,
  body_preview TEXT, -- Primeiros 200 caracteres
  full_content TEXT,

  -- PDF anexado
  pdf_url VARCHAR(500),
  pdf_filename VARCHAR(255),
  pdf_size_bytes INTEGER,

  -- Relacionamentos com outros módulos
  related_convocatoria_id UUID REFERENCES convocatorias(id) ON DELETE SET NULL,
  related_minute_id UUID REFERENCES minutes(id) ON DELETE SET NULL,
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Tracking de estados
  status VARCHAR(50) NOT NULL DEFAULT 'draft_created',
    -- 'draft_created', 'sent', 'delivered', 'opened', 'read', 'confirmed', 'failed', 'bounced'

  -- Timestamps de estados
  draft_created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  read_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  failed_at TIMESTAMP,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP,

  -- Metadata adicional (JSONB para flexibilidade)
  metadata JSONB DEFAULT '{}',
    -- Pode conter: ip_address, user_agent, email_provider, etc

  -- Timestamps padrão
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Soft delete (RGPD compliance)
  deleted_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_communication_logs_building ON communication_logs(building_id);
CREATE INDEX idx_communication_logs_member ON communication_logs(member_id);
CREATE INDEX idx_communication_logs_type ON communication_logs(communication_type);
CREATE INDEX idx_communication_logs_channel ON communication_logs(channel);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_created ON communication_logs(created_at DESC);
CREATE INDEX idx_communication_logs_convocatoria ON communication_logs(related_convocatoria_id);
CREATE INDEX idx_communication_logs_minute ON communication_logs(related_minute_id);

-- Trigger para updated_at
CREATE TRIGGER update_communication_logs_updated_at
  BEFORE UPDATE ON communication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Resultado**:
- ✅ Tabela completa para tracking
- ✅ Relacionamentos com todos os módulos
- ✅ Estados detalhados
- ✅ RGPD compliant (soft delete)

---

### ✅ Paso 3.2: Criar Endpoints API

**Archivo**: `server/routes/communications.cjs` (novo)

```javascript
const express = require('express');
const router = express.Router();

// 1. CRIAR/REGISTAR nova comunicação
router.post('/api/communications/log', async (req, res) => {
  // Guardar em communication_logs
  // Status inicial: draft_created
});

// 2. LISTAR comunicações com filtros
router.get('/api/communications/logs', async (req, res) => {
  // Query params:
  // - building_id (required)
  // - member_id (optional)
  // - communication_type (optional)
  // - channel (optional)
  // - status (optional)
  // - date_from, date_to (optional)
  // - limit, offset (pagination)
});

// 3. GET single comunicação por ID
router.get('/api/communications/logs/:id', async (req, res) => {
  // Retornar dados completos + relacionamentos
});

// 4. ATUALIZAR estado da comunicação
router.patch('/api/communications/logs/:id/status', async (req, res) => {
  // Actualizar status + timestamp correspondente
  // Ex: status='sent' → atualizar sent_at
});

// 5. REENVIAR comunicação
router.post('/api/communications/logs/:id/resend', async (req, res) => {
  // Incrementar retry_count
  // Actualizar last_retry_at
  // Chamar emailService.sendEmail()
});

// 6. ESTATÍSTICAS por building
router.get('/api/communications/stats/:building_id', async (req, res) => {
  // Retornar:
  // - totalSent, deliveryRate, readRate, bounceRate
  // - byType: { convocatoria: 10, acta: 5, ... }
  // - byChannel: { email: 8, whatsapp: 7, ... }
  // - thisMonth, thisYear
  // - topTemplates: [{ templateId, name, useCount }]
});

// 7. ELIMINAR comunicação (soft delete)
router.delete('/api/communications/logs/:id', async (req, res) => {
  // Soft delete: SET deleted_at = NOW()
  // RGPD compliance
});

module.exports = router;
```

**Registrar en app.cjs**:
```javascript
// server/app.cjs
const communicationsRoutes = require('./routes/communications.cjs');
app.use(communicationsRoutes);
```

**Resultado**:
- ✅ 7 endpoints RESTful
- ✅ CRUD completo
- ✅ Estadísticas incluídas

---

### ✅ Paso 3.3: Integrar emailService en SendStep

**Archivo a modificar**: `src/components/letters/SendStep.tsx`

**ANTES** (actual):
```typescript
const sendViaEmail = async () => {
  // Abre mailto: ❌
  window.open(`mailto:${recipients}?subject=${subject}&body=${body}`, '_blank');

  // PDF não anexado automaticamente ❌
  toast.info('Email aberto. Por favor anexe o PDF descarregado.');
};
```

**DEPOIS** (con emailService):
```typescript
import { emailService } from '@/services/email/emailService';

const sendViaEmail = async () => {
  try {
    // 1. Configurar email service (uma vez só)
    if (!emailService.isConfigured()) {
      // Carregar config desde BD ou env
      const config = await getEmailConfig(buildingId);
      emailService.configure(config);
    }

    // 2. Test connection
    const { success, error } = await emailService.testConnection();
    if (!success) {
      throw new Error(`Email config error: ${error}`);
    }

    // 3. Preparar emails com progress
    const emails: EmailData[] = selectedMembers.map(member => ({
      to: member.email,
      subject: substituteVariables(data.subject, member),
      html: generateEmailHTML(data, member),
      attachments: [{
        filename: `carta_${member.name}.pdf`,
        content: pdfBlob, // Já gerado antes
        contentType: 'application/pdf'
      }]
    }));

    // 4. Enviar em lote com progress
    setProgress(0);
    const result = await emailService.sendBulkEmails(
      emails,
      1000, // 1 segundo entre emails (anti-spam)
      (progress, current, result) => {
        setProgress(progress);
        if (result.success) {
          // Log individual
          await logCommunication({
            member_id: getMemberIdFromEmail(current.to),
            status: 'sent',
            sent_at: new Date()
          });
        }
      }
    );

    // 5. Mostrar resultado
    toast.success(`${result.sent} emails enviados com sucesso!`);
    if (result.failed > 0) {
      toast.warning(`${result.failed} emails falharam`);
    }

  } catch (error) {
    console.error('Error sending emails:', error);
    toast.error('Erro ao enviar emails: ' + error.message);
  }
};
```

**Resultado**:
- ✅ Envío real de emails (no mailto:)
- ✅ Progress bar visual
- ✅ PDF anexado automaticamente
- ✅ Retry automático em falhas
- ✅ Logs guardados

---

## 📝 FASE 4: MELHORIAS E POLISH (Média Prioridad)

### ✅ Paso 4.1: Añadir Configuración de Email

**Nuevo componente**: `src/components/settings/EmailSettings.tsx`

```typescript
// Formulário para configurar email
interface EmailConfig {
  provider: 'gmail' | 'outlook' | 'custom';
  senderName: string;
  senderEmail: string;

  // Gmail
  appPassword?: string;

  // Custom SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
}

// Guardar en BD (tabla: building_settings)
// Campo: email_config (JSONB)
```

**UI**:
- Tab em Settings
- Formulário con validação
- Botón "Test Connection"
- Logs de envío

**Resultado**:
- ✅ Config persistida na BD
- ✅ Por building (cada condomínio com seu email)
- ✅ Test antes de guardar

---

### ✅ Paso 4.2: Melhorar Preview de Cartas

**Componente a melhorar**: `PreviewStep.tsx`

**Adicionar**:
1. ✅ **Preview visual HTML**:
   ```typescript
   <div className="pdf-preview">
     <iframe srcDoc={generatePreviewHTML(data)} />
   </div>
   ```

2. ✅ **Botón "Ver PDF"**:
   - Gera PDF temporário
   - Abre em nova janela
   - Permite ajustes antes de enviar

3. ✅ **Estatísticas de destinatários**:
   ```typescript
   Stats:
   - Total seleccionados: 15
   - Con email: 12 (80%)
   - Con WhatsApp: 10 (67%)
   - Sin contacto: 3 (20%)
   ```

4. ✅ **Warning para membros sem contacto**:
   - Lista de membros que não receberão
   - Sugerir atualizar dados

**Resultado**:
- ✅ Preview mais rico
- ✅ Menos erros no envío
- ✅ Melhor UX

---

### ✅ Paso 4.3: Dashboard de Estadísticas

**Componente**: `src/components/communications/CommunicationsDashboard.tsx`

**Charts a incluir**:
```typescript
1. Bar Chart: Comunicações por mês (últimos 6 meses)
2. Pie Chart: Por canal (Email 60%, WhatsApp 30%, Correio 10%)
3. Line Chart: Taxa de entrega ao longo do tempo
4. Table: Top 5 templates mais usados
5. Metrics Cards:
   - Total sent
   - Avg delivery rate
   - Avg read rate
   - Failed this month
```

**Usar recharts**:
```bash
npm install recharts
```

**Resultado**:
- ✅ Dashboard profissional
- ✅ Insights sobre comunicações
- ✅ Identificar problemas

---

## 📝 FASE 5: OPCIONAL - CAMPANHAS E AUTOMAÇÕES

### ⏸️ Paso 5.1: CampaignManager (Opcional)

**Cuando implementar**: Se o utilizador precisar enviar campanhas massivas recorrentes

**O que faz**:
- Campanhas com targeting avançado
- Scheduling (enviar em data específica)
- Repeat (diário, semanal, mensal, anual)
- A/B testing de templates
- Tracking de resultados

**Estimativa**: 8-10 horas

---

### ⏸️ Paso 5.2: AutomationManager (Opcional)

**Cuando implementar**: Para automatizações complexas

**O que faz**:
- Triggers: "Quando quota atrasa 7 dias"
- Actions: "Enviar email de lembrete"
- Rules: Condições e filtros
- Execuções agendadas

**Estimativa**: 10-12 horas

---

## 📊 RESUMO DO PLAN COMPLETO

### Fases e Estimativas

| Fase | Descrição | Tempo | Prioridade |
|------|-----------|-------|------------|
| **Fase 1** | Migração base (tipos, PDF, email) | 3-4h | 🔴 Alta |
| **Fase 2** | Migração UI (componentes React) | 6-8h | 🔴 Alta |
| **Fase 3** | Backend e BD (API + tabelas) | 4-5h | 🔴 Alta |
| **Fase 4** | Melhorias e polish | 3-4h | 🟡 Média |
| **Fase 5** | Campanhas e automações | 18-22h | 🟢 Baixa (opcional) |
| **TOTAL CORE** | Fases 1-4 | **16-21 horas** | |
| **TOTAL COMPLETO** | Todas as fases | **34-43 horas** | |

### O Que Vou Conseguir

**Após Fase 1-3** (Core, ~16h):
- ✅ Sistema completo de cartas migrado e funcional
- ✅ Envío real de emails (Nodemailer)
- ✅ Histórico completo com tracking
- ✅ Templates predefinidos + personalizados
- ✅ Variáveis avançadas con filtros
- ✅ PDF generation profissional
- ✅ WhatsApp integration
- ✅ RGPD compliant
- ✅ Dashboard con estadísticas básicas

**Após Fase 4** (Polish, ~20h):
- ✅ Tudo acima +
- ✅ Configuração de email por building
- ✅ Preview rica de cartas
- ✅ Dashboard avançado com charts
- ✅ Settings completos

**Após Fase 5** (Completo, ~40h):
- ✅ Tudo acima +
- ✅ Campanhas massivas
- ✅ Automações con triggers
- ✅ A/B testing
- ✅ Sistema enterprise-grade

---

## 🎯 O QUE NECESITO APROBAR

**Antes de começar, confirma**:

1. ✅ **Migrar sistema antiguo?** (Opção A - Recomendada)
   - Si: Seguir este plan completo
   - No: Criar plan alternativo (Opção B)

2. ✅ **Fases a implementar?**
   - Solo Fase 1-3 (Core, 16h) ← Recomendado para empezar
   - Fase 1-4 (Polish, 20h)
   - Todo (Fase 1-5, 40h)

3. ✅ **Manter workflow visual actual?**
   - Si: Integrar MessageComposer dentro de EditContentStep
   - No: Usar só CommunicationsHub (sin workflow visual)

4. ✅ **Provider de email inicial?**
   - Gmail (con App Password)
   - Outlook
   - Custom SMTP
   - Configurar depois

5. ✅ **Campanhas y automações?** (Fase 5)
   - Si: Necesario desde o início
   - No: Implementar se necessário mais tarde
   - Talvez: Avaliar após Fase 1-3

---

## 📝 PRÓXIMOS PASOS

**Após tu aprobación**:

1. ✅ Fazer backup completo do sistema actual
2. ✅ Criar branches Git:
   ```bash
   git checkout -b feature/communications-migration
   ```
3. ✅ Começar Fase 1.1 (Preparar estructura)
4. ✅ Commit após cada paso completado
5. ✅ Testar build após cada fase
6. ✅ Apresentar resultados passo a passo

---

**IMPORTANTE**: Este plan está **100% baseado no sistema antiguo** que encontrei. **Não vou criar nada novo**, só:
- ✅ Migrar e adaptar
- ✅ Melhorar o que já existe
- ✅ Integrar com sistema actual
- ✅ Manter best practices

---

**Aguardo tu aprobación para começar** 🚀

¿Quieres que:
- **A)** Empece con Fase 1-3 (Core, ~16h)?
- **B)** Necesitas ajustes en el plan primero?
- **C)** Prefieres implementar otra opción?
