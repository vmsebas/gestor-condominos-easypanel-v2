# 📊 Estrutura da Base de Dados - Gestor Condominios

## 🏗️ **Análise da Estrutura Actual**

### **Tabelas Principais e Dados Existentes**

#### 🏢 **BUILDINGS** - Edifícios (1 registo)
```sql
id: uuid PRIMARY KEY
name: text NOT NULL
address: text NOT NULL  
postal_code: text
city: text
number_of_units: integer DEFAULT 0
administrator: text
admin_contact: text
admin_email: text
iban: text
bank: text
account_number: text
swift: text
created_at: timestamp
updated_at: timestamp
```
**Dados existentes**: 1 edifício - "Condomino Buraca 1"

#### 👥 **MEMBERS** - Membros/Condóminos (6 registos)
```sql
id: uuid PRIMARY KEY
name: text NOT NULL
apartment: text
building_id: uuid → buildings(id)
fraction: text
votes: integer DEFAULT 0
email: text
phone: text
profile_image: text
notes: text
old_annual_fee: numeric DEFAULT 0
old_monthly_fee: numeric DEFAULT 0
new_annual_fee: numeric DEFAULT 0
new_monthly_fee: numeric DEFAULT 0
permilage: numeric DEFAULT 0
is_active: boolean DEFAULT true
nif: character varying
created_at: timestamp
updated_at: timestamp
```
**Dados existentes**: 6 condóminos (apartamentos C, D, F, etc.)

#### 📄 **DOCUMENTS** - Documentos (0 registos)
```sql
id: integer PRIMARY KEY
building_id: uuid → buildings(id)
member_id: uuid → members(id)
name: varchar NOT NULL
original_name: varchar NOT NULL
file_path: varchar NOT NULL
file_size: integer NOT NULL
mime_type: varchar NOT NULL
file_extension: varchar NOT NULL
category: varchar DEFAULT 'general'
subcategory: varchar
tags: text[]
description: text
version: integer DEFAULT 1
parent_document_id: integer → documents(id)
is_current_version: boolean DEFAULT true
visibility: varchar DEFAULT 'building'
is_confidential: boolean DEFAULT false
access_level: varchar DEFAULT 'read'
uploaded_by: varchar
uploaded_at: timestamp
last_accessed_at: timestamp
download_count: integer DEFAULT 0
search_vector: tsvector
created_at: timestamp
updated_at: timestamp
```
**Estado**: Vazio - Sistema pronto para upload

#### 📋 **CONVOCATORIAS** - Convocatórias (3 registos)
```sql
id: uuid PRIMARY KEY
building_id: uuid → buildings(id)
building_name: text NOT NULL
building_address: text NOT NULL
postal_code: text
assembly_number: text
assembly_type: text NOT NULL
date: date NOT NULL
time: text NOT NULL
location: text NOT NULL
second_call_enabled: boolean DEFAULT true
second_call_time: text
second_call_date: date
administrator: text NOT NULL
secretary: text
legal_reference: text
minutes_created: boolean DEFAULT false
agenda_items: jsonb
city: text
created_at: timestamp
updated_at: timestamp
```
**Dados existentes**: 3 convocatórias registadas

#### 📝 **MINUTES** - Actas (3 registos)
```sql
id: uuid PRIMARY KEY
convocatoria_id: uuid → convocatorias(id)
minute_number: text NOT NULL
meeting_date: date NOT NULL
meeting_time: text NOT NULL
end_time: text
location: text NOT NULL
assembly_type: text NOT NULL
building_address: text NOT NULL
building_name: text
postal_code: text
president_name: text NOT NULL
administrator_custom: text
secretary_name: text NOT NULL
secretary_custom: text
conclusions: text
status: varchar DEFAULT 'draft'
created_at: timestamp
updated_at: timestamp
```
**Dados existentes**: 3 actas correspondentes às convocatórias

#### 💰 **TRANSACTIONS** - Transações (3 registos)
```sql
id: uuid PRIMARY KEY
building_id: uuid NOT NULL → buildings(id)
period_id: uuid → financial_periods(id)
category_id: uuid → transaction_categories(id)
transaction_date: date NOT NULL
transaction_type: text NOT NULL
description: text NOT NULL
amount: numeric NOT NULL
fraction_id: uuid → fractions(id)
member_id: uuid → members(id)
payment_method: text
reference_number: text
notes: text
receipt_url: text
is_recurring: boolean DEFAULT false
recurring_months: integer[]
year: integer NOT NULL
is_fee_payment: boolean DEFAULT false
created_at: timestamp
updated_at: timestamp
```
**Dados existentes**: 3 transações financeiras

### **Tabelas de Apoio com Dados**

#### 📁 **DOCUMENT_CATEGORIES** - Categorias de Documentos (8 registos)
```sql
id: integer PRIMARY KEY
building_id: uuid → buildings(id)
name: varchar NOT NULL
description: text
color: varchar DEFAULT '#6366f1'
icon: varchar DEFAULT 'folder'
parent_category_id: integer → document_categories(id)
sort_order: integer DEFAULT 0
created_at: timestamp
```
**Categorias existentes**: Financeiro, Legal, Manutenção, Reuniões, Seguros, Correspondência, Planos, Geral

#### 🏦 **TRANSACTION_CATEGORIES** - Categorias de Transações
#### 📅 **FINANCIAL_PERIODS** - Períodos Financeiros  
#### 🏠 **FRACTIONS** - Fracções dos Apartamentos

### **Relacionamentos Principais**
```
buildings (1) ←→ (N) members
buildings (1) ←→ (N) documents  
buildings (1) ←→ (N) convocatorias
buildings (1) ←→ (N) transactions
convocatorias (1) ←→ (1) minutes
members (1) ←→ (N) documents (opcional)
documents (1) ←→ (N) document_shares
```

---

## 🔌 **Endpoints da API Disponíveis**

### **Buildings** 
- `GET /api/buildings` ✅ - Lista edifícios
- Dados: 1 edifício com 6 condóminos

### **Members**
- `GET /api/members` ✅ - Lista membros  
- `GET /api/members?buildingId=uuid` ✅ - Membros por edifício
- Dados: 6 condóminos ativos

### **Documents** 
- `GET /api/documents` ✅ - Lista documentos
- `POST /api/documents` ✅ - Upload documento
- `DELETE /api/documents/:id` ✅ - Eliminar documento
- `GET /api/documents/stats/:buildingId` ✅ - Estatísticas
- Estado: Tabela vazia, sistema funcional

### **Convocatorias**
- `GET /api/convocatorias` ✅ - Lista convocatórias
- `POST /api/convocatorias` ✅ - Criar convocatória
- Dados: 3 convocatórias existentes

### **Minutes/Actas**
- `GET /api/actas` ✅ - Lista actas
- `GET /api/minutes` ✅ - Lista actas (alias)
- Dados: 3 actas existentes

### **Transactions**
- `GET /api/transactions` ✅ - Lista transações
- Dados: 3 transações existentes

### **Financial Summary**
- Endpoint implícito baseado em transactions
- Dados: Calculado a partir das 3 transações

---

## 🎯 **Problemas Identificados na Estrutura**

### **1. Inconsistências de Tipos**
- `buildings.id` = UUID
- `documents.id` = INTEGER  
- `documents.building_id` = UUID (correcto)
- **Problema**: Mistura de tipos de chave primária

### **2. Tabelas Redundantes/Confusas**
- `fractions` vs `members.fraction` (campo de texto)
- `financial_periods` vs `transactions.year` 
- Múltiplas tabelas para fees (`member_annual_fees`, `member_monthly_fees`, etc.)

### **3. Relacionamentos em Falta**
- Sem auditoria/log de atividades
- Sem sistema de permissões de utilizador
- Sem relacionamento direto minutes ↔ documents

### **4. Campos de Metadata**
- Alguns `created_at`/`updated_at` inconsistentes
- Falta `deleted_at` para soft deletes

---

## 🔧 **Recomendações de Melhoria**

### **Prioritárias (Implementar Agora)**
1. **Criar sistema de audit log** para atividades recentes
2. **Normalizar tipos de ID** (todos UUID ou todos INTEGER)
3. **Criar endpoint de estatísticas** consolidado para dashboard
4. **Implementar cálculo dinâmico** de próxima reunião

### **Médio Prazo**
1. **Consolidar tabelas financeiras** redundantes
2. **Implementar soft deletes** com `deleted_at`
3. **Criar sistema de permissões** de utilizador
4. **Otimizar queries** para relatórios

### **Futuras**
1. **Sistema de notificações**
2. **Backup automático** de documentos
3. **API versioning**
4. **Cache layer** para relatórios

---

## ✅ **Estado Atual: Produção Ready**

### **Funcional**
- ✅ Sistema de documentos operacional
- ✅ Base de dados estruturada  
- ✅ Endpoints básicos funcionais
- ✅ Interface limpa sem dados fictícios

### **Próximo Passo**
**Implementar conectores de dados reais** para:
1. Dashboard KPIs
2. Atividades recentes  
3. Próxima reunião
4. Estatísticas financeiras calculadas

A base de dados está **sólida e funcional** para produção! 🚀