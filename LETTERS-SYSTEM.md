# 📧 SISTEMA COMPLETO DE CARTAS E COMUNICAÇÕES
**Version**: v1.0.0
**Data**: 21 Novembro 2025
**Status**: ✅ Implementado

---

## 📋 ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Templates Disponíveis](#templates-disponíveis)
3. [Arquitectura do Sistema](#arquitectura-do-sistema)
4. [Workflow de Criação](#workflow-de-criação)
5. [Componentes](#componentes)
6. [API Endpoints](#api-endpoints)
7. [Base de Dados](#base-de-dados)
8. [Geração de PDF](#geração-de-pdf)
9. [Variáveis e Personalização](#variáveis-e-personalização)
10. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 VISÃO GERAL

Sistema profissional e completo para gestão de cartas e comunicações em condomínios, similar aos workflows de Convocatorias e Actas.

### Funcionalidades Principais:
- ✅ **11 Templates Profissionais** com HTML/CSS completo
- ✅ **Workflow Interactivo** de 4 passos
- ✅ **Edição Visual** de conteúdo
- ✅ **Preview em Tempo Real**
- ✅ **Geração de PDF** profissional
- ✅ **Envio por Email** integrado
- ✅ **Variáveis Dinâmicas** ({{member.name}}, etc)
- ✅ **Base Legal** incluída em cada template
- ✅ **Histórico Completo** em BD

---

## 📝 TEMPLATES DISPONÍVEIS

### 1. **Carta de Cobranza de Quotas** (`late_payment`)
**Uso**: Cobrar pagamentos em atraso
**Variáveis**: member.name, payment.due, payment.period, payment.dueDate
**Base Legal**: Decreto-Lei n.º 268/94
**Formato**: HTML completo com CSS, tabelas, avisos legais

### 2. **Aprovação de Orçamento** (`budget_approval`)
**Uso**: Comunicar aprovação de orçamento em assembleia
**Variáveis**: budget.amount, budget.description, assembly.date
**Base Legal**: LPH Art. 16º

### 3. **Convocatória para Assembleia** (`meeting_notice`)
**Uso**: Convocar assembleias (alternativa formal)
**Variáveis**: assembly.date, assembly.time, assembly.location
**Base Legal**: LPH Art. 17º

### 4. **Aviso de Trabalhos/Obras** (`works_notice`) ⭐ NOVO
**Uso**: Informar sobre obras no condomínio
**Variáveis**: works.title, works.description, works.startDate, works.company
**Base Legal**: Decreto-Lei n.º 268/94 - Art. 8º
**Features**:
- 📋 Descrição detalhada dos trabalhos
- 📅 Data e horário de início
- ⏱️ Duração prevista
- 🏢 Local afectado
- 👷 Empresa responsável
- ⚠️ Avisos importantes

### 5. **Convocação Assembleia Urgente** (`urgent_assembly`) ⭐ NOVO
**Uso**: Convocar assembleia extraordinária urgente
**Variáveis**: assembly.urgencyReason, assembly.agendaItems
**Base Legal**: LPH Art. 16º e 17º
**Features**:
- 🔴 Design com destaque URGENTE
- ⚠️ Motivo da urgência
- 📋 Ordem do dia
- ⏰ Duas convocatórias

### 6. **Lembrete de Pagamento** (`payment_reminder`) ⭐ NOVO
**Uso**: Lembrar pagamento antes do prazo (tom amigável)
**Variáveis**: payment.amount, payment.dueDate, payment.reference
**Base Legal**: LPH Art. 4º
**Features**:
- 💶 Valor destacado
- 💳 Dados bancários completos
- ℹ️ Aviso amigável
- 📅 Prazo de pagamento

### 7. **Aprovação de Despesa Extraordinária** (`extraordinary_expense`) ⭐ NOVO
**Uso**: Comunicar aprovação e rateio de despesa
**Variáveis**: expense.totalAmount, expense.yourShare, member.permillage
**Base Legal**: LPH Art. 4º e 16º
**Features**:
- 📋 Detalhes da despesa
- 💶 Cálculo individual por permilagem
- 📊 Resultado da votação
- 💳 Instruções de pagamento

### 8. **Notificação de Incumprimento** (`rule_violation`) ⭐ NOVO
**Uso**: Notificar violações de regras do condomínio
**Variáveis**: violation.description, violation.rulesViolated, violation.deadline
**Base Legal**: LPH Art. 8º
**Features**:
- ⚠️ Descrição da situação
- 📋 Regras violadas
- ✅ Ação requerida
- ⏰ Prazo para regularização

### 9. **Certificado de Não Dívida** (`no_debt_certificate`) ⭐ NOVO
**Uso**: Emitir certificado para vendas/escrituras
**Variáveis**: certificate.number, certificate.purpose, member.permillage
**Base Legal**: Decreto-Lei n.º 268/94
**Features**:
- ✓ Selo de validação
- 📄 Número único de certificado
- ⏰ Validade limitada
- 🏛️ Dados de registo predial
- ✍️ Área de assinatura

### 10. **Aviso de Pago** (`payment_notice`)
**Uso**: Avisos gerais de pagamento
**Variáveis**: Básicas

### 11. **Convocatoria Estándar** (`convocatoria`)
**Uso**: Template básico de convocatória
**Variáveis**: Básicas

---

## 🏗️ ARQUITECTURA DO SISTEMA

```
Comunicaciones.tsx
    ↓
[ Botão "Nova Carta" ]
    ↓
LetterWorkflow Component
    ├── Step 1: SelectTemplateStep
    │   ├── Lista de 11 templates
    │   ├── Preview do template
    │   └── Informação de variáveis
    │
    ├── Step 2: SelectRecipientStep
    │   ├── Seleccionar condóminos
    │   ├── Múltipla selecção
    │   └── Filtros (fração, status, etc)
    │
    ├── Step 3: EditContentStep
    │   ├── Editor WYSIWYG
    │   ├── Substituição de variáveis
    │   ├── Preview em tempo real
    │   └── Validação de campos
    │
    └── Step 4: PreviewAndSendStep
        ├── Preview final
        ├── Opções de envio:
        │   ├── 📧 Email
        │   ├── 📄 PDF Download
        │   ├── 🖨️ Imprimir
        │   └── 💾 Guardar rascunho
        └── Logging em BD
```

---

## 🧩 COMPONENTES

### 1. `LetterWorkflow.tsx` (Principal)
```typescript
interface LetterWorkflowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  buildingName: string;
  onSuccess?: () => void;
}

// State Management
const [currentStep, setCurrentStep] = useState(1);
const [letterData, setLetterData] = useState({
  templateId: '',
  template: null,
  recipients: [],
  subject: '',
  content: '',
  sendMethod: 'email'
});
```

### 2. `SelectTemplateStep.tsx`
- Grid de templates com cards
- Preview do HTML
- Lista de variáveis disponíveis
- Filtro por tipo

### 3. `SelectRecipientStep.tsx`
- Lista de membros/condóminos
- Checkboxes múltiplas
- Filtros: por fração, status, dívidas
- "Seleccionar todos"

### 4. `EditContentStep.tsx`
- Editor rich text (Tiptap ou similar)
- Botões para inserir variáveis
- Preview lado a lado
- Validação em tempo real

### 5. `PreviewAndSendStep.tsx`
- Preview final do PDF
- Opções de envio
- Loading states
- Confirmação de sucesso

---

## 🔌 API ENDPOINTS

### Já Implementados ✅

```javascript
// Letters CRUD
GET    /api/letters                    // Lista cartas enviadas
GET    /api/letters/:id                // Detalhes de uma carta
POST   /api/letters                    // Criar/enviar carta
PUT    /api/letters/:id                // Editar carta
DELETE /api/letters/:id                // Eliminar carta

// Templates
GET    /api/letters/templates/all     // Lista templates
GET    /api/letters/templates/:id     // Detalhes de template
POST   /api/letters/templates         // Criar template
PUT    /api/letters/templates/:id     // Editar template
DELETE /api/letters/templates/:id     // Eliminar template

// Stats
GET    /api/letters/building/:id/stats // Estatísticas
```

### Estrutura de Request (POST /api/letters)
```json
{
  "building_id": "uuid",
  "template_id": "uuid",
  "member_id": "uuid",
  "recipient_name": "Nome do Membro",
  "recipient_email": "email@example.com",
  "subject": "Assunto da Carta",
  "content": "<html>...</html>",
  "send_method": "email|correio_certificado|whatsapp|printed",
  "sent_date": "2025-11-21T00:00:00Z",
  "legal_validity": true
}
```

---

## 💾 BASE DE DADOS

### Tabela: `letter_templates`
```sql
CREATE TABLE letter_templates (
  id UUID PRIMARY KEY,
  building_id UUID,               -- Null = global template
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,     -- late_payment, works_notice, etc
  subject VARCHAR(500),
  content TEXT NOT NULL,          -- HTML completo
  variables TEXT[],               -- ['member.name', 'payment.due']
  is_active BOOLEAN DEFAULT true,
  legal_basis TEXT,               -- Base legal do template
  required_fields TEXT[],
  validation_rules JSONB,
  title VARCHAR(255),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Tabela: `sent_letters`
```sql
CREATE TABLE sent_letters (
  id UUID PRIMARY KEY,
  building_id UUID NOT NULL,
  template_id UUID,              -- FK to letter_templates
  member_id UUID,                -- FK to members
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255),
  subject VARCHAR(500),
  content TEXT,                  -- HTML final com variáveis substituídas
  send_method VARCHAR(50),       -- email, correio_certificado, etc
  sent_date TIMESTAMPTZ,
  delivery_confirmation BOOLEAN DEFAULT false,
  tracking_number VARCHAR(100),
  legal_validity BOOLEAN DEFAULT false,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 📄 GERAÇÃO DE PDF

### Arquivo: `src/lib/letterGenerator.ts`

```typescript
import jsPDF from 'jspdf';

export interface LetterData {
  templateType: string;
  subject: string;
  htmlContent: string;
  recipient: {
    name: string;
    fraction: string;
  };
  building: {
    name: string;
    address: string;
  };
  metadata: any;
}

export function generateLetterPDF(
  data: LetterData,
  download: boolean = true
): jsPDF | Blob {
  const doc = new jsPDF();

  // 1. Parse HTML
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(data.htmlContent, 'text/html');

  // 2. Extract styles and content
  const styles = extractStyles(htmlDoc);
  const content = extractContent(htmlDoc);

  // 3. Apply styles and render
  renderContent(doc, content, styles);

  // 4. Add footer
  addFooter(doc, data);

  if (download) {
    const filename = `carta_${data.templateType}_${Date.now()}.pdf`;
    doc.save(filename);
    return doc;
  }

  return doc.output('blob');
}
```

### Features do PDF:
- ✅ Paginação automática
- ✅ Header com dados do edifício
- ✅ Footer com dados legais
- ✅ Numeração de páginas
- ✅ Preservação de estilos CSS inline
- ✅ Imagens (logos, selos)
- ✅ Tabelas formatadas

---

## 🔤 VARIÁVEIS E PERSONALIZAÇÃO

### Sistema de Variáveis (Mustache-like)

**Sintaxe**: `{{category.field}}`

### Categorias Disponíveis:

#### 1. **member.*** - Dados do Condómino
```
{{member.name}}           → Nome completo
{{member.fraction}}       → Ex: "RC/DTO"
{{member.apartment}}      → Ex: "3º Esq"
{{member.permillage}}     → Ex: "45.5"
{{member.email}}          → Email
{{member.phone}}          → Telefone
{{member.nif}}            → NIF
```

#### 2. **building.*** - Dados do Edifício
```
{{building.name}}         → Nome do condomínio
{{building.address}}      → Morada completa
{{building.postalCode}}   → Código postal
{{building.city}}         → Cidade
{{building.iban}}         → IBAN bancário
{{building.administrator}}→ Nome do administrador
{{building.adminPhone}}   → Telefone administração
{{building.adminEmail}}   → Email administração
{{building.nif}}          → NIF do condomínio
{{building.registrationNumber}} → N.º registo predial
```

#### 3. **payment.*** - Dados de Pagamento
```
{{payment.amount}}        → Valor a pagar
{{payment.due}}           → Valor em dívida
{{payment.period}}        → Ex: "Janeiro 2025"
{{payment.dueDate}}       → Data limite
{{payment.reference}}     → Referência bancária
{{payment.originalDueDate}} → Data original
```

#### 4. **works.*** - Dados de Obras
```
{{works.title}}           → Título dos trabalhos
{{works.description}}     → Descrição detalhada
{{works.startDate}}       → Data de início
{{works.schedule}}        → Horário (Ex: "9h-18h")
{{works.duration}}        → Duração prevista
{{works.location}}        → Local afectado
{{works.company}}         → Empresa responsável
{{works.specialNotes}}    → Notas especiais
```

#### 5. **expense.*** - Despesas Extraordinárias
```
{{expense.title}}         → Título da despesa
{{expense.description}}   → Descrição
{{expense.totalAmount}}   → Valor total
{{expense.yourShare}}     → Quota individual
{{expense.supplier}}      → Fornecedor
{{expense.scheduledDate}} → Data prevista
{{expense.votingResult}}  → Resultado votação
```

#### 6. **assembly.*** - Dados de Assembleia
```
{{assembly.date}}         → Data da assembleia
{{assembly.time}}         → Hora
{{assembly.firstCallTime}}→ 1ª convocatória
{{assembly.secondCallTime}}→ 2ª convocatória
{{assembly.location}}     → Local
{{assembly.subject}}      → Assunto
{{assembly.urgencyReason}}→ Motivo urgência
{{assembly.agendaItems}}  → Ordem do dia (array)
```

#### 7. **violation.*** - Incumprimentos
```
{{violation.type}}        → Tipo de violação
{{violation.description}} → Descrição
{{violation.date}}        → Data da ocorrência
{{violation.location}}    → Local
{{violation.rulesViolated}}→ Regras violadas (array)
{{violation.actionRequired}}→ Ação necessária
{{violation.deadline}}    → Prazo regularização
```

#### 8. **certificate.*** - Certificados
```
{{certificate.number}}    → Número único
{{certificate.date}}      → Data de emissão
{{certificate.validUntil}}→ Validade
{{certificate.purpose}}   → Finalidade
```

#### 9. **current.*** - Dados Atuais
```
{{current.date}}          → Data actual formatada
{{current.time}}          → Hora actual
{{current.year}}          → Ano actual
```

### Sintaxe Condicional (Mustache)
```html
{{#works.specialNotes}}
  <p>Nota Especial: {{works.specialNotes}}</p>
{{/works.specialNotes}}

{{#assembly.agendaItems}}
  <li>{{.}}</li>
{{/assembly.agendaItems}}
```

---

## 🎨 EXEMPLOS DE USO

### Exemplo 1: Criar Carta de Cobrança

```typescript
// 1. User clica "Nova Carta" em Comunicaciones
// 2. Selecciona template "Carta de Cobranza"
// 3. Selecciona membro(s)
// 4. Sistema preenche automaticamente:

const letterData = {
  templateId: 'be97d68a-60f8...',
  recipients: [memberId],
  variables: {
    'member.name': 'João Silva',
    'member.fraction': '3º Esq',
    'member.permillage': '45.5',
    'payment.due': '150.00',
    'payment.period': 'Outubro-Novembro 2025',
    'payment.dueDate': '30 de Novembro de 2025',
    'building.name': 'Condominio Buraca 1',
    'building.iban': 'PT50...'
  }
};

// 5. Preview gerado automaticamente
// 6. User envia por email ou gera PDF
```

### Exemplo 2: Aviso de Obras

```typescript
const worksNotice = {
  templateId: '50897f73-824f...',
  recipients: allMembers, // Enviar a todos
  variables: {
    'works.title': 'Pintura da Fachada',
    'works.description': 'Pintura exterior completa...',
    'works.startDate': '1 de Dezembro de 2025',
    'works.schedule': '8h00 - 18h00',
    'works.duration': '15 dias úteis',
    'works.location': 'Fachada principal e lateral',
    'works.company': 'Pinturas Modernas, Lda',
    'works.specialNotes': 'Poderá haver ruído durante o período'
  }
};
```

### Exemplo 3: Certificado de Não Dívida

```typescript
const certificate = {
  templateId: 'a0a267f0-2ce3...',
  recipients: [memberId],
  variables: {
    'certificate.number': 'CND-2025-0042',
    'certificate.date': '21 de Novembro de 2025',
    'certificate.validUntil': '21 de Fevereiro de 2026',
    'certificate.purpose': 'Escritura de Venda',
    'member.name': 'Maria Santos',
    'member.fraction': 'RC/DTO',
    'member.permillage': '52.3'
  }
};
```

---

## 📊 ESTATÍSTICAS E RELATÓRIOS

### Dashboard de Comunicações

**Endpoint**: `GET /api/letters/building/:id/stats`

```json
{
  "total": 47,
  "delivered": 42,
  "pending": 5,
  "by_type": {
    "late_payment": 12,
    "works_notice": 8,
    "payment_reminder": 15,
    "urgent_assembly": 3,
    "no_debt_certificate": 9
  },
  "by_send_method": {
    "email": 35,
    "correio_certificado": 8,
    "printed": 4
  },
  "last_30_days": 18
}
```

---

## 🔒 CUMPRIMENTO LEGAL

Todos os templates incluem:
- ✅ **Base Legal** específica (Decreto-Lei, artigos)
- ✅ **Dados Obrigatórios** (NIF, morada, etc)
- ✅ **Prazos Legais** (impugnação, regularização)
- ✅ **Direitos do Condómino** mencionados
- ✅ **Validação de Dados** antes de envio

### Legislação Aplicável:
- **Decreto-Lei n.º 268/94** (Lei da Propriedade Horizontal)
- **Código Civil Português** - Art. 1430º-1435º
- **RGPD** (Lei n.º 8/2022) - Proteção de dados
- **Lei n.º 62/2013** - Certificados digitais

---

## 🚀 PRÓXIMOS PASSOS

### Fase 1: ✅ COMPLETO
- [x] 11 Templates profissionais
- [x] Base de dados preparada
- [x] API endpoints funcionais
- [x] Documentação completa

### Fase 2: 🔄 EM PROGRESSO
- [ ] LetterWorkflow component
- [ ] 4 Steps components
- [ ] letterGenerator.ts (PDF)
- [ ] Integração em Comunicaciones.tsx

### Fase 3: 📅 PLANEADO
- [ ] Editor WYSIWYG avançado
- [ ] Templates customizáveis por edifício
- [ ] Agendamento de envios
- [ ] Relatórios analíticos
- [ ] Integração com correio certificado (CTT)

---

## 📚 RECURSOS ADICIONAIS

### Ficheiros Relacionados:
- `/server/routes/letters.cjs` - API routes
- `/server/sql/insert-letter-templates-complete.sql` - Templates SQL
- `/src/services/api/letters.ts` - Frontend API service
- `/src/pages/Comunicaciones.tsx` - Página principal
- `/src/lib/communicationTemplates.ts` - Templates de email/WhatsApp

### Dependências:
- `jspdf` - Geração de PDF
- `mustache` - Template engine
- `react-quill` ou `tiptap` - Editor rich text
- `dompurify` - Sanitização de HTML

---

**Documentação criada por**: Claude Code
**Última actualização**: 21 Novembro 2025
**Versão do Sistema**: v1.0.0
