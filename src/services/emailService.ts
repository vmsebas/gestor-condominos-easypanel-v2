import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export interface EmailData {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * Configura el servicio de email
   */
  configure(config: EmailConfig): void {
    this.config = config;
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure, // true para 465, false para otros puertos
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        // No fallar con certificados auto-firmados
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Configura automáticamente para Gmail
   */
  configureGmail(email: string, password: string): void {
    this.configure({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: email,
      password: password, // Usar App Password, no password normal
      from: email
    });
  }

  /**
   * Configura automáticamente para Outlook/Hotmail
   */
  configureOutlook(email: string, password: string): void {
    this.configure({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      user: email,
      password: password,
      from: email
    });
  }

  /**
   * Verifica la conexión con el servidor de email
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'Servicio de email no configurado' };
    }

    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      console.error('Error de conexión del email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Envía un email
   */
  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    if (!this.transporter || !this.config) {
      return {
        success: false,
        error: 'Servicio de email no configurado'
      };
    }

    try {
      const mailOptions = {
        from: this.config.from,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email enviado:', {
        messageId: info.messageId,
        to: emailData.to,
        subject: emailData.subject
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error enviando email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al enviar email'
      };
    }
  }

  /**
   * Envía múltiples emails con límite de velocidad
   */
  async sendBulkEmails(
    emails: EmailData[], 
    delayMs: number = 1000,
    onProgress?: (progress: number, current: EmailData, result: EmailResult) => void
  ): Promise<{ sent: number; failed: number; results: EmailResult[] }> {
    const results: EmailResult[] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      try {
        const result = await this.sendEmail(email);
        results.push(result);
        
        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        if (onProgress) {
          const progress = ((i + 1) / emails.length) * 100;
          onProgress(progress, email, result);
        }

        // Pausa entre emails para evitar spam
        if (i < emails.length - 1 && delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        const result: EmailResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        };
        results.push(result);
        failed++;

        if (onProgress) {
          const progress = ((i + 1) / emails.length) * 100;
          onProgress(progress, email, result);
        }
      }
    }

    return { sent, failed, results };
  }

  /**
   * Obtiene configuraciones de ejemplo para diferentes proveedores
   */
  static getProviderExamples(): Record<string, Partial<EmailConfig>> {
    return {
      gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        // user: 'tu-email@gmail.com',
        // password: 'tu-app-password', // Necesitas generar un App Password
      },
      outlook: {
        host: 'smtp-mail.outlook.com', 
        port: 587,
        secure: false,
        // user: 'tu-email@outlook.com',
        // password: 'tu-password',
      },
      yahoo: {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        // user: 'tu-email@yahoo.com', 
        // password: 'tu-app-password',
      },
      custom: {
        // host: 'smtp.tu-proveedor.com',
        // port: 587,
        // secure: false,
        // user: 'tu-email@tu-dominio.com',
        // password: 'tu-password',
      }
    };
  }
}

// Instancia singleton del servicio de email
export const emailService = new EmailService();