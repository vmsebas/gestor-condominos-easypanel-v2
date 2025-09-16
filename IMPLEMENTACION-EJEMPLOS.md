# 🚀 Ejemplos de Implementación - Flujos de Trabajo

## 1. Sistema de Notificaciones por Email Automático

### 📧 Configuración del Servicio de Email (server/services/emailService.cjs)

```javascript
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { pool } = require('../config/database.cjs');

class EmailService {
  constructor() {
    // Configurar transporte de email (usar SendGrid, AWS SES, o SMTP)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Enviar email individual
  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: `"${process.env.CONDO_NAME}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Registrar en base de datos
      await this.logEmailSent(to, subject, info.messageId);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error enviando email:', error);
      await this.logEmailError(to, subject, error.message);
      return { success: false, error: error.message };
    }
  }

  // Registrar email enviado
  async logEmailSent(to, subject, messageId) {
    const query = `
      INSERT INTO email_logs (recipient, subject, message_id, status, sent_at)
      VALUES ($1, $2, $3, 'sent', NOW())
    `;
    await pool.query(query, [to, subject, messageId]);
  }

  // Registrar error de email
  async logEmailError(to, subject, error) {
    const query = `
      INSERT INTO email_logs (recipient, subject, status, error_message, sent_at)
      VALUES ($1, $2, 'failed', $3, NOW())
    `;
    await pool.query(query, [to, subject, error]);
  }

  // Plantilla de email para cuotas
  generateQuotaEmailHTML(member, quota) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
          .btn { display: inline-block; padding: 10px 20px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; }
          .amount { font-size: 24px; font-weight: bold; color: #2c3e50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.CONDO_NAME}</h1>
            <p>Aviso de Quota Mensal</p>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${member.name}</strong>,</p>
            
            <p>Informamos que a quota do condomínio referente ao mês de <strong>${quota.month}/${quota.year}</strong> já está disponível para pagamento.</p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
              <p>Valor a pagar:</p>
              <p class="amount">${quota.amount}€</p>
              <p>Vencimento: <strong>${quota.dueDate}</strong></p>
            </div>
            
            <p><strong>Dados para pagamento:</strong></p>
            <ul>
              <li>IBAN: ${process.env.CONDO_IBAN}</li>
              <li>Referência: ${quota.reference}</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}/portal/pay/${quota.id}" class="btn">Pagar Online</a>
            </div>
            
            <p>Pode também aceder ao portal do condómino para:</p>
            <ul>
              <li>Consultar o histórico de pagamentos</li>
              <li>Descarregar recibos</li>
              <li>Atualizar os seus dados</li>
            </ul>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>Para questões, contacte: ${process.env.ADMIN_EMAIL}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
```

### 🔄 Sistema de Tarefas Programadas (server/services/cronJobs.cjs)

```javascript
const cron = require('node-cron');
const emailService = require('./emailService.cjs');
const { pool } = require('../config/database.cjs');

class CronJobManager {
  initializeJobs() {
    // Ejecutar el día 1 de cada mes a las 9:00
    this.monthlyQuotaGeneration();
    
    // Ejecutar el día 5 de cada mes a las 10:00
    this.sendQuotaEmails();
    
    // Ejecutar el día 15 de cada mes a las 10:00
    this.sendFirstReminder();
    
    // Ejecutar el día 25 de cada mes a las 10:00
    this.sendSecondReminder();
    
    // Ejecutar todos los días a las 18:00
    this.dailyNotifications();
  }

  // Generar cuotas mensuales
  monthlyQuotaGeneration() {
    cron.schedule('0 9 1 * *', async () => {
      console.log('🔄 Generando cuotas mensuales...');
      
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Obtener todos los miembros activos
        const membersQuery = `
          SELECT m.*, b.monthly_quota_amount 
          FROM members m
          JOIN buildings b ON m.building_id = b.id
          WHERE m.is_active = true
        `;
        const members = await pool.query(membersQuery);
        
        for (const member of members.rows) {
          // Calcular cuota basada en permillaje
          const quotaAmount = member.monthly_quota_amount * (member.permillage / 1000);
          
          // Generar referencia única
          const reference = `${currentYear}${String(currentMonth).padStart(2, '0')}${member.id.substr(0, 8)}`;
          
          // Insertar cuota en la base de datos
          const insertQuery = `
            INSERT INTO quotas (
              member_id, building_id, amount, month, year, 
              due_date, reference, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
          `;
          
          const dueDate = new Date(currentYear, currentMonth - 1, 10); // Día 10 del mes
          
          await pool.query(insertQuery, [
            member.id,
            member.building_id,
            quotaAmount,
            currentMonth,
            currentYear,
            dueDate,
            reference
          ]);
        }
        
        console.log('✅ Cuotas generadas exitosamente');
      } catch (error) {
        console.error('❌ Error generando cuotas:', error);
      }
    });
  }

  // Enviar emails de cuotas (día 5)
  sendQuotaEmails() {
    cron.schedule('0 10 5 * *', async () => {
      console.log('📧 Enviando emails de cuotas...');
      
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Obtener cuotas pendientes del mes actual
        const quotasQuery = `
          SELECT q.*, m.name, m.email 
          FROM quotas q
          JOIN members m ON q.member_id = m.id
          WHERE q.month = $1 AND q.year = $2 AND q.status = 'pending'
          AND m.email IS NOT NULL
        `;
        
        const quotas = await pool.query(quotasQuery, [currentMonth, currentYear]);
        
        for (const quota of quotas.rows) {
          const emailHTML = emailService.generateQuotaEmailHTML(
            { name: quota.name },
            {
              amount: quota.amount,
              month: quota.month,
              year: quota.year,
              dueDate: new Date(quota.due_date).toLocaleDateString('pt-PT'),
              reference: quota.reference,
              id: quota.id
            }
          );
          
          await emailService.sendEmail(
            quota.email,
            `Quota Condomínio - ${quota.month}/${quota.year}`,
            emailHTML
          );
          
          // Pequeña pausa entre emails para evitar límites
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`✅ ${quotas.rows.length} emails de cuotas enviados`);
      } catch (error) {
        console.error('❌ Error enviando emails de cuotas:', error);
      }
    });
  }

  // Primer recordatorio (día 15)
  sendFirstReminder() {
    cron.schedule('0 10 15 * *', async () => {
      console.log('🔔 Enviando primer recordatorio...');
      
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Obtener cuotas aún pendientes
        const quotasQuery = `
          SELECT q.*, m.name, m.email, m.phone 
          FROM quotas q
          JOIN members m ON q.member_id = m.id
          WHERE q.month = $1 AND q.year = $2 AND q.status = 'pending'
        `;
        
        const quotas = await pool.query(quotasQuery, [currentMonth, currentYear]);
        
        for (const quota of quotas.rows) {
          // Enviar email si tiene
          if (quota.email) {
            const reminderHTML = `
              <h2>Recordatorio de Pago</h2>
              <p>Estimado/a ${quota.name},</p>
              <p>Le recordamos que tiene pendiente el pago de la cuota del condominio:</p>
              <ul>
                <li>Importe: <strong>${quota.amount}€</strong></li>
                <li>Vencimiento: <strong>${new Date(quota.due_date).toLocaleDateString('pt-PT')}</strong></li>
                <li>Referencia: <strong>${quota.reference}</strong></li>
              </ul>
              <p>Por favor, regularice su situación lo antes posible.</p>
            `;
            
            await emailService.sendEmail(
              quota.email,
              `⚠️ Recordatorio - Quota Pendiente ${quota.month}/${quota.year}`,
              reminderHTML
            );
          }
          
          // Si tiene teléfono, preparar para SMS (integración futura)
          if (quota.phone) {
            // await smsService.send(quota.phone, `Recordatorio: Quota condominio pendiente. Importe: ${quota.amount}€`);
          }
        }
        
        console.log(`✅ ${quotas.rows.length} recordatorios enviados`);
      } catch (error) {
        console.error('❌ Error enviando recordatorios:', error);
      }
    });
  }

  // Segundo recordatorio con recargo (día 25)
  sendSecondReminder() {
    cron.schedule('0 10 25 * *', async () => {
      console.log('🚨 Enviando segundo recordatorio con recargo...');
      
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Obtener cuotas aún pendientes y aplicar recargo
        const quotasQuery = `
          SELECT q.*, m.name, m.email 
          FROM quotas q
          JOIN members m ON q.member_id = m.id
          WHERE q.month = $1 AND q.year = $2 AND q.status = 'pending'
        `;
        
        const quotas = await pool.query(quotasQuery, [currentMonth, currentYear]);
        
        for (const quota of quotas.rows) {
          // Aplicar recargo del 10%
          const surcharge = quota.amount * 0.10;
          const totalAmount = quota.amount + surcharge;
          
          // Actualizar en base de datos
          await pool.query(
            'UPDATE quotas SET surcharge = $1, total_amount = $2 WHERE id = $3',
            [surcharge, totalAmount, quota.id]
          );
          
          if (quota.email) {
            const finalReminderHTML = `
              <div style="border: 2px solid #e74c3c; padding: 20px; background: #fff5f5;">
                <h2 style="color: #e74c3c;">⚠️ AVISO IMPORTANTE - Segundo Recordatorio</h2>
                <p>Estimado/a ${quota.name},</p>
                <p><strong>Su cuota del condominio continúa pendiente de pago.</strong></p>
                <p>De acuerdo con el reglamento interno, se ha aplicado un recargo por mora:</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td>Cuota original:</td>
                    <td style="text-align: right;">${quota.amount}€</td>
                  </tr>
                  <tr>
                    <td>Recargo (10%):</td>
                    <td style="text-align: right;">${surcharge.toFixed(2)}€</td>
                  </tr>
                  <tr style="font-weight: bold; border-top: 2px solid #333;">
                    <td>TOTAL A PAGAR:</td>
                    <td style="text-align: right; color: #e74c3c;">${totalAmount.toFixed(2)}€</td>
                  </tr>
                </table>
                <p><strong>Si no regulariza su situación antes del final del mes, 
                se iniciará el procedimiento de cobro judicial.</strong></p>
              </div>
            `;
            
            await emailService.sendEmail(
              quota.email,
              `🚨 URGENTE - Quota con Recargo ${quota.month}/${quota.year}`,
              finalReminderHTML
            );
          }
        }
        
        console.log(`✅ ${quotas.rows.length} avisos con recargo enviados`);
      } catch (error) {
        console.error('❌ Error enviando avisos con recargo:', error);
      }
    });
  }

  // Notificaciones diarias
  dailyNotifications() {
    cron.schedule('0 18 * * *', async () => {
      console.log('📬 Procesando notificaciones diarias...');
      
      try {
        // Verificar incidencias críticas sin resolver > 48h
        const criticalIncidents = await pool.query(`
          SELECT i.*, m.email, m.name
          FROM incidents i
          JOIN members m ON i.reported_by = m.id
          WHERE i.priority = 'urgent' 
          AND i.status = 'open'
          AND i.created_at < NOW() - INTERVAL '48 hours'
        `);
        
        for (const incident of criticalIncidents.rows) {
          // Notificar al administrador
          await emailService.sendEmail(
            process.env.ADMIN_EMAIL,
            `⚠️ Incidencia Urgente sin Resolver - ${incident.title}`,
            `<p>La siguiente incidencia urgente lleva más de 48 horas sin resolver:</p>
             <ul>
               <li>Título: ${incident.title}</li>
               <li>Reportada por: ${incident.name}</li>
               <li>Fecha: ${new Date(incident.created_at).toLocaleDateString('pt-PT')}</li>
             </ul>
             <p>Por favor, tome acción inmediata.</p>`
          );
        }
        
        // Verificar documentos próximos a vencer
        const expiringDocs = await pool.query(`
          SELECT * FROM documents
          WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
          AND notification_sent = false
        `);
        
        for (const doc of expiringDocs.rows) {
          // Notificar vencimiento próximo
          await emailService.sendEmail(
            process.env.ADMIN_EMAIL,
            `📋 Documento Próximo a Vencer - ${doc.name}`,
            `<p>El documento <strong>${doc.name}</strong> vence el ${new Date(doc.expiry_date).toLocaleDateString('pt-PT')}.</p>
             <p>Por favor, gestione su renovación.</p>`
          );
          
          // Marcar como notificado
          await pool.query(
            'UPDATE documents SET notification_sent = true WHERE id = $1',
            [doc.id]
          );
        }
        
        console.log('✅ Notificaciones diarias procesadas');
      } catch (error) {
        console.error('❌ Error en notificaciones diarias:', error);
      }
    });
  }
}

module.exports = new CronJobManager();
```

### 🗄️ Estructura de Base de Datos para Notificaciones

```sql
-- Tabla para logs de emails
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para cuotas mensuales
CREATE TABLE quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  building_id UUID REFERENCES buildings(id),
  amount DECIMAL(10,2) NOT NULL,
  surcharge DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  reference VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_method VARCHAR(50), -- transfer, mb, card, cash
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para plantillas de notificación
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- quota, reminder, incident, assembly, etc
  subject VARCHAR(500),
  body_html TEXT,
  body_text TEXT,
  variables JSONB, -- Lista de variables disponibles
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para preferencias de notificación de usuarios
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  channel VARCHAR(50) NOT NULL, -- email, sms, whatsapp, portal
  notification_type VARCHAR(50), -- quota, reminder, incident, assembly, all
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, channel, notification_type)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_quotas_status ON quotas(status);
CREATE INDEX idx_quotas_month_year ON quotas(month, year);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_status ON email_logs(status);
```

## 2. Dashboard de Métricas en Tiempo Real

### 📊 Componente React para Dashboard (src/components/dashboard/CondoDashboard.tsx)

```typescript
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, 
  AlertTriangle, CheckCircle, Clock, Home 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

interface DashboardMetrics {
  financial: {
    monthlyIncome: number;
    monthlyExpenses: number;
    collectionRate: number;
    delinquencyRate: number;
    reserveFund: number;
    cashFlow: number;
  };
  operational: {
    openIncidents: number;
    avgResolutionTime: number;
    satisfactionScore: number;
    upcomingMaintenance: number;
  };
  members: {
    total: number;
    active: number;
    withDebt: number;
    newThisMonth: number;
  };
  compliance: {
    pendingDocuments: string[];
    upcomingDeadlines: Date[];
    legalAlerts: Alert[];
  };
}

const CondoDashboard: React.FC = () => {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 30000 // Actualizar cada 30 segundos
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="p-6 space-y-6">
      {/* Header con KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tasa de Cobro"
          value={`${metrics?.financial.collectionRate}%`}
          icon={<DollarSign />}
          trend={metrics?.financial.collectionRate > 90 ? 'up' : 'down'}
          color="green"
        />
        <MetricCard
          title="Incidencias Abiertas"
          value={metrics?.operational.openIncidents}
          icon={<AlertTriangle />}
          subtitle={`Tiempo medio: ${metrics?.operational.avgResolutionTime}h`}
          color="yellow"
        />
        <MetricCard
          title="Satisfacción"
          value={`${metrics?.operational.satisfactionScore}/5`}
          icon={<Users />}
          trend="up"
          color="blue"
        />
        <MetricCard
          title="Fondo de Reserva"
          value={`${metrics?.financial.reserveFund.toLocaleString()}€`}
          icon={<Home />}
          subtitle="Min. legal cumplido"
          color="purple"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Caja - Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={metrics?.financial} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Cuotas</CardTitle>
          </CardHeader>
          <CardContent>
            <QuotaStatusChart data={metrics?.members} />
          </CardContent>
        </Card>
      </div>

      {/* Alertas y Notificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alertas del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsList alerts={metrics?.compliance.legalAlerts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Vencimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingDeadlines deadlines={metrics?.compliance.upcomingDeadlines} />
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Morosos */}
      <Card>
        <CardHeader>
          <CardTitle>Propietarios con Deuda</CardTitle>
        </CardHeader>
        <CardContent>
          <DebtorsTable />
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para métricas individuales
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  subtitle?: string;
  color: string;
}> = ({ title, value, icon, trend, subtitle, color }) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span className="text-sm">
              {trend === 'up' ? 'Mejorando' : 'Requiere atención'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CondoDashboard;
```

### 🔌 API Endpoints para el Dashboard (server/routes/dashboard.cjs)

```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');

// GET /api/dashboard/metrics
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const buildingId = req.user.building_id;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Métricas financieras
    const financialMetrics = await getFinancialMetrics(buildingId, currentMonth, currentYear);
    
    // Métricas operacionales
    const operationalMetrics = await getOperationalMetrics(buildingId);
    
    // Métricas de miembros
    const memberMetrics = await getMemberMetrics(buildingId);
    
    // Alertas de cumplimiento
    const complianceAlerts = await getComplianceAlerts(buildingId);

    res.json({
      success: true,
      data: {
        financial: financialMetrics,
        operational: operationalMetrics,
        members: memberMetrics,
        compliance: complianceAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, error: 'Error fetching metrics' });
  }
});

async function getFinancialMetrics(buildingId, month, year) {
  // Ingresos del mes
  const incomeQuery = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE building_id = $1 
    AND EXTRACT(MONTH FROM transaction_date) = $2
    AND EXTRACT(YEAR FROM transaction_date) = $3
    AND transaction_type = 'income'
  `, [buildingId, month, year]);

  // Gastos del mes
  const expensesQuery = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE building_id = $1 
    AND EXTRACT(MONTH FROM transaction_date) = $2
    AND EXTRACT(YEAR FROM transaction_date) = $3
    AND transaction_type = 'expense'
  `, [buildingId, month, year]);

  // Tasa de cobro
  const collectionQuery = await pool.query(`
    SELECT 
      COUNT(CASE WHEN status = 'paid' THEN 1 END)::FLOAT / 
      NULLIF(COUNT(*), 0) * 100 as rate
    FROM quotas
    WHERE building_id = $1 AND month = $2 AND year = $3
  `, [buildingId, month, year]);

  // Tasa de morosidad
  const delinquencyQuery = await pool.query(`
    SELECT COUNT(*) as count
    FROM members m
    WHERE m.building_id = $1
    AND EXISTS (
      SELECT 1 FROM quotas q
      WHERE q.member_id = m.id
      AND q.status = 'pending'
      AND q.due_date < CURRENT_DATE - INTERVAL '30 days'
    )
  `, [buildingId]);

  // Fondo de reserva
  const reserveQuery = await pool.query(`
    SELECT balance FROM reserve_funds
    WHERE building_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `, [buildingId]);

  return {
    monthlyIncome: incomeQuery.rows[0]?.total || 0,
    monthlyExpenses: expensesQuery.rows[0]?.total || 0,
    collectionRate: Math.round(collectionQuery.rows[0]?.rate || 0),
    delinquencyRate: delinquencyQuery.rows[0]?.count || 0,
    reserveFund: reserveQuery.rows[0]?.balance || 0,
    cashFlow: (incomeQuery.rows[0]?.total || 0) - (expensesQuery.rows[0]?.total || 0)
  };
}

async function getOperationalMetrics(buildingId) {
  // Incidencias abiertas
  const openIncidentsQuery = await pool.query(`
    SELECT COUNT(*) as count
    FROM incidents
    WHERE building_id = $1 AND status IN ('open', 'in_progress')
  `, [buildingId]);

  // Tiempo medio de resolución
  const resolutionTimeQuery = await pool.query(`
    SELECT AVG(
      EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
    ) as avg_hours
    FROM incidents
    WHERE building_id = $1 
    AND status = 'resolved'
    AND resolved_at IS NOT NULL
    AND created_at > CURRENT_DATE - INTERVAL '30 days'
  `, [buildingId]);

  // Puntuación de satisfacción
  const satisfactionQuery = await pool.query(`
    SELECT AVG(rating) as score
    FROM satisfaction_surveys
    WHERE building_id = $1
    AND created_at > CURRENT_DATE - INTERVAL '30 days'
  `, [buildingId]);

  // Mantenimientos próximos
  const upcomingMaintenanceQuery = await pool.query(`
    SELECT COUNT(*) as count
    FROM maintenance_schedule
    WHERE building_id = $1
    AND scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  `, [buildingId]);

  return {
    openIncidents: openIncidentsQuery.rows[0]?.count || 0,
    avgResolutionTime: Math.round(resolutionTimeQuery.rows[0]?.avg_hours || 0),
    satisfactionScore: parseFloat(satisfactionQuery.rows[0]?.score || 4.0).toFixed(1),
    upcomingMaintenance: upcomingMaintenanceQuery.rows[0]?.count || 0
  };
}

async function getMemberMetrics(buildingId) {
  const metricsQuery = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active,
      COUNT(CASE WHEN 
        EXISTS (
          SELECT 1 FROM quotas q 
          WHERE q.member_id = m.id 
          AND q.status = 'pending'
          AND q.due_date < CURRENT_DATE
        ) THEN 1 END
      ) as with_debt,
      COUNT(CASE WHEN 
        created_at > CURRENT_DATE - INTERVAL '30 days' 
        THEN 1 END
      ) as new_this_month
    FROM members m
    WHERE building_id = $1
  `, [buildingId]);

  return metricsQuery.rows[0];
}

async function getComplianceAlerts(buildingId) {
  const alerts = [];

  // Verificar seguro
  const insuranceCheck = await pool.query(`
    SELECT expiry_date FROM insurance_policies
    WHERE building_id = $1 AND type = 'fire'
    ORDER BY expiry_date DESC
    LIMIT 1
  `, [buildingId]);

  if (insuranceCheck.rows[0]) {
    const daysUntilExpiry = Math.floor(
      (new Date(insuranceCheck.rows[0].expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiry < 30) {
      alerts.push({
        type: 'warning',
        message: `Seguro contra incendios vence en ${daysUntilExpiry} días`,
        action: 'Renovar póliza'
      });
    }
  }

  // Verificar asamblea anual
  const lastAssembly = await pool.query(`
    SELECT MAX(date) as last_date
    FROM convocatorias
    WHERE building_id = $1 AND assembly_type = 'ordinary'
  `, [buildingId]);

  if (lastAssembly.rows[0]?.last_date) {
    const daysSinceLastAssembly = Math.floor(
      (new Date() - new Date(lastAssembly.rows[0].last_date)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastAssembly > 300) {
      alerts.push({
        type: 'error',
        message: 'Asamblea ordinaria anual pendiente',
        action: 'Convocar asamblea'
      });
    }
  }

  return {
    pendingDocuments: [],
    upcomingDeadlines: [],
    legalAlerts: alerts
  };
}

module.exports = router;
```

## 3. Sistema de WhatsApp Business API

### 📱 Integración con WhatsApp (server/services/whatsappService.cjs)

```javascript
const axios = require('axios');
const { pool } = require('../config/database.cjs');

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v17.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  }

  // Enviar mensaje de texto
  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Registrar mensaje enviado
      await this.logMessage(to, message, 'sent', response.data.messages[0].id);
      
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      await this.logMessage(to, message, 'failed', null, error.message);
      throw error;
    }
  }

  // Enviar plantilla de mensaje
  async sendTemplate(to, templateName, params = []) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt' },
            components: params.length > 0 ? [
              {
                type: 'body',
                parameters: params.map(p => ({ type: 'text', text: p }))
              }
            ] : []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp template:', error);
      throw error;
    }
  }

  // Procesar webhook de WhatsApp
  async processWebhook(body) {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0]) {
      const change = body.entry[0].changes[0];
      
      if (change.value.messages) {
        for (const message of change.value.messages) {
          await this.handleIncomingMessage(message);
        }
      }
      
      if (change.value.statuses) {
        for (const status of change.value.statuses) {
          await this.handleMessageStatus(status);
        }
      }
    }
  }

  // Manejar mensaje entrante
  async handleIncomingMessage(message) {
    const from = message.from;
    const text = message.text?.body || '';
    
    // Buscar miembro por teléfono
    const memberQuery = await pool.query(
      'SELECT * FROM members WHERE phone = $1',
      [from]
    );
    
    if (memberQuery.rows.length === 0) {
      // Número no registrado
      await this.sendMessage(from, 
        'Olá! Este número não está registrado no sistema do condomínio. ' +
        'Por favor, contacte a administração.'
      );
      return;
    }
    
    const member = memberQuery.rows[0];
    
    // Procesar comandos
    const command = text.toLowerCase().trim();
    
    switch (command) {
      case 'saldo':
      case '1':
        await this.sendBalanceInfo(from, member);
        break;
        
      case 'pagar':
      case '2':
        await this.sendPaymentInfo(from, member);
        break;
        
      case 'incidencia':
      case '3':
        await this.startIncidentReport(from, member);
        break;
        
      case 'ajuda':
      case 'menu':
      case '0':
        await this.sendMenu(from);
        break;
        
      default:
        // Verificar si está en proceso de reporte de incidencia
        const activeSession = await this.getActiveSession(from);
        if (activeSession && activeSession.type === 'incident_report') {
          await this.continueIncidentReport(from, member, text, activeSession);
        } else {
          await this.sendMenu(from);
        }
    }
  }

  // Enviar menú principal
  async sendMenu(to) {
    const menu = `
🏢 *Menu Principal - Condomínio*

Digite o número da opção desejada:

1️⃣ - Consultar saldo
2️⃣ - Informações de pagamento
3️⃣ - Reportar incidência
4️⃣ - Próximas assembleias
5️⃣ - Documentos importantes
6️⃣ - Falar com administração

0️⃣ - Ver este menu novamente

_Responda com o número da opção_
    `;
    
    await this.sendMessage(to, menu);
  }

  // Enviar información de saldo
  async sendBalanceInfo(to, member) {
    const quotasQuery = await pool.query(`
      SELECT * FROM quotas
      WHERE member_id = $1 AND status = 'pending'
      ORDER BY year DESC, month DESC
    `, [member.id]);
    
    if (quotasQuery.rows.length === 0) {
      await this.sendMessage(to, 
        '✅ *Situação Regular*\n\n' +
        'Não tem quotas pendentes.\n' +
        'Obrigado por manter os pagamentos em dia!'
      );
    } else {
      let total = 0;
      let details = '📋 *Quotas Pendentes:*\n\n';
      
      for (const quota of quotasQuery.rows) {
        total += parseFloat(quota.total_amount || quota.amount);
        details += `• ${quota.month}/${quota.year}: ${quota.amount}€\n`;
        if (quota.surcharge > 0) {
          details += `  _Juros: ${quota.surcharge}€_\n`;
        }
      }
      
      details += `\n💰 *Total a pagar: ${total.toFixed(2)}€*`;
      
      await this.sendMessage(to, details);
    }
  }

  // Registrar mensaje en base de datos
  async logMessage(to, content, status, messageId = null, error = null) {
    await pool.query(`
      INSERT INTO whatsapp_messages (
        phone_number, content, direction, status, 
        message_id, error_message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [to, content, 'outbound', status, messageId, error]);
  }
}

module.exports = new WhatsAppService();
```

---

Este documento proporciona ejemplos concretos de implementación para los flujos de trabajo propuestos, incluyendo:

1. **Sistema de notificaciones automáticas por email** con tareas programadas
2. **Dashboard de métricas en tiempo real** con componentes React y API
3. **Integración con WhatsApp Business API** para comunicación instantánea

Todos los ejemplos están listos para ser adaptados e implementados en el sistema actual.