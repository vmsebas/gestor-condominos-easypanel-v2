const cron = require('node-cron');
const quotaService = require('./quotaService.cjs');
const emailService = require('./emailService.cjs');
const arrearsService = require('./arrearsService.cjs');
const arrearsTrackingService = require('./arrearsTrackingService.cjs');

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  initialize() {
    console.log('🕐 Initializing cron jobs...');
    
    // Generate monthly quotas on the 1st of each month at 00:01
    this.scheduleJob('monthly-quotas', '1 0 1 * *', async () => {
      console.log('📊 Running monthly quota generation...');
      try {
        const result = await quotaService.generateMonthlyQuotas();
        console.log(`✅ Generated ${result.count} quotas for ${result.month}`);
        
        // Send notification emails
        await emailService.sendMonthlyQuotaNotifications(result);
      } catch (error) {
        console.error('❌ Error generating monthly quotas:', error);
      }
    });

    // Check for overdue payments daily at 10:00
    this.scheduleJob('overdue-check', '0 10 * * *', async () => {
      console.log('⚠️ Checking for overdue payments...');
      try {
        // Usar el nuevo servicio de tracking mejorado
        const result = await arrearsTrackingService.checkAndUpdateOverduePayments();
        console.log(`✅ ${result.message}`);
        
        // Si hay pagos vencidos, obtener detalles para notificaciones
        if (result.processed > 0) {
          const overdueMembers = await arrearsService.checkOverduePayments();
          if (overdueMembers.length > 0) {
            console.log(`📧 Enviando notificaciones a ${overdueMembers.length} miembros`);
            await emailService.sendOverdueNotifications(overdueMembers);
          }
        }
      } catch (error) {
        console.error('❌ Error checking overdue payments:', error);
      }
    });

    // Send payment reminders on the 25th of each month
    this.scheduleJob('payment-reminders', '0 9 25 * *', async () => {
      console.log('📧 Sending payment reminders...');
      try {
        const pendingPayments = await quotaService.getPendingPaymentsForMonth();
        if (pendingPayments.length > 0) {
          await emailService.sendPaymentReminders(pendingPayments);
          console.log(`✅ Sent ${pendingPayments.length} payment reminders`);
        }
      } catch (error) {
        console.error('❌ Error sending payment reminders:', error);
      }
    });

    // Generate financial reports on the last day of each month at 23:00
    this.scheduleJob('monthly-reports', '0 23 28-31 * *', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Only run on the actual last day of the month
      if (tomorrow.getDate() === 1) {
        console.log('📈 Generating monthly financial report...');
        try {
          const report = await quotaService.generateMonthlyReport();
          await emailService.sendMonthlyReport(report);
          console.log('✅ Monthly report generated and sent');
        } catch (error) {
          console.error('❌ Error generating monthly report:', error);
        }
      }
    });

    // Backup database daily at 02:00
    this.scheduleJob('database-backup', '0 2 * * *', async () => {
      console.log('💾 Backing up database...');
      try {
        const backupService = require('./backupService.cjs');
        await backupService.performBackup();
        console.log('✅ Database backup completed');
      } catch (error) {
        console.error('❌ Error backing up database:', error);
      }
    });

    console.log('✅ Cron jobs initialized successfully');
  }

  scheduleJob(name, schedule, handler) {
    if (this.jobs.has(name)) {
      this.jobs.get(name).stop();
    }
    
    const job = cron.schedule(schedule, handler, {
      scheduled: true,
      timezone: "Europe/Lisbon"
    });
    
    this.jobs.set(name, job);
    console.log(`✅ Scheduled job: ${name} (${schedule})`);
  }

  stopJob(name) {
    if (this.jobs.has(name)) {
      this.jobs.get(name).stop();
      this.jobs.delete(name);
      console.log(`🛑 Stopped job: ${name}`);
    }
  }

  stopAll() {
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`🛑 Stopped job: ${name}`);
    }
    this.jobs.clear();
  }

  // Manual trigger for testing
  async triggerJob(name) {
    console.log(`🔧 Manually triggering job: ${name}`);
    switch (name) {
      case 'monthly-quotas':
        return await quotaService.generateMonthlyQuotas();
      case 'overdue-check':
        return await arrearsService.checkOverduePayments();
      case 'payment-reminders':
        return await quotaService.getPendingPaymentsForMonth();
      case 'monthly-reports':
        return await quotaService.generateMonthlyReport();
      default:
        throw new Error(`Unknown job: ${name}`);
    }
  }
}

module.exports = new CronService();