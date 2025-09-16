const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Initialize transporter with configuration from environment
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });
    
    this.defaultFrom = process.env.SMTP_FROM || 'Gestor Condominios <noreply@condominio.com>';
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: this.defaultFrom,
        to: to,
        subject: subject,
        html: html,
        attachments: attachments
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✉️ Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async sendMonthlyQuotaNotifications(quotaData) {
    const { count, month, year } = quotaData;
    
    try {
      // Get building administrators
      const { db: knex } = require('../config/knex.cjs');
      const administrators = await knex('users')
        .where('role', 'admin')
        .where('is_active', true)
        .select('email', 'name');
      
      for (const admin of administrators) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Quotas Mensais Geradas</h2>
            <p>Olá ${admin.name},</p>
            <p>As quotas mensais para <strong>${month} ${year}</strong> foram geradas com sucesso.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Total de quotas geradas:</strong> ${count}</p>
            </div>
            <p>Por favor, aceda ao sistema para visualizar os detalhes.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              Esta é uma mensagem automática. Por favor, não responda a este email.
            </p>
          </div>
        `;
        
        await this.sendEmail(admin.email, `Quotas Mensais - ${month} ${year}`, html);
      }
    } catch (error) {
      console.error('Error sending monthly quota notifications:', error);
      throw error;
    }
  }

  async sendOverdueNotifications(overdueMembers) {
    for (const member of overdueMembers) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Aviso de Pagamento em Atraso</h2>
          <p>Estimado(a) ${member.member_name},</p>
          <p>Informamos que tem pagamentos em atraso relativos ao condomínio <strong>${member.building_name}</strong>.</p>
          
          <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <p><strong>Unidade:</strong> ${member.unit_number}</p>
            <p><strong>Valor em atraso:</strong> €${member.total_overdue.toFixed(2)}</p>
            <p><strong>Meses em atraso:</strong> ${member.months_overdue}</p>
          </div>
          
          <p>Por favor, regularize a situação o mais brevemente possível para evitar custos adicionais.</p>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Dados para Pagamento:</h3>
            <p><strong>IBAN:</strong> PT50 0000 0000 0000 0000 0000 0</p>
            <p><strong>Referência:</strong> ${member.unit_number}-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}</p>
          </div>
          
          <p>Se já efetuou o pagamento, por favor ignore esta mensagem.</p>
          <p>Para qualquer esclarecimento, contacte a administração.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            ${member.building_name} | Administração do Condomínio
          </p>
        </div>
      `;
      
      await this.sendEmail(member.member_email, 'Aviso de Pagamento em Atraso', html);
    }
  }

  async sendPaymentReminders(pendingPayments) {
    for (const payment of pendingPayments) {
      const dueDate = new Date(payment.due_date);
      const formattedDate = dueDate.toLocaleDateString('pt-PT');
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Lembrete de Pagamento</h2>
          <p>Estimado(a) ${payment.member_name},</p>
          <p>Lembramos que o pagamento da quota mensal do condomínio vence em breve.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes do Pagamento:</h3>
            <p><strong>Condomínio:</strong> ${payment.building_name}</p>
            <p><strong>Unidade:</strong> ${payment.unit_number}</p>
            <p><strong>Valor:</strong> €${payment.amount.toFixed(2)}</p>
            <p><strong>Data de vencimento:</strong> ${formattedDate}</p>
            <p><strong>Descrição:</strong> ${payment.description}</p>
          </div>
          
          <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Como Pagar:</h3>
            <p><strong>IBAN:</strong> PT50 0000 0000 0000 0000 0000 0</p>
            <p><strong>Referência:</strong> ${payment.unit_number}-${payment.id}</p>
            <p>Ou aceda ao portal do condomínio para mais opções de pagamento.</p>
          </div>
          
          <p>Agradecemos o pagamento atempado para manter o bom funcionamento do condomínio.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            ${payment.building_name} | Administração do Condomínio
          </p>
        </div>
      `;
      
      await this.sendEmail(payment.member_email, 'Lembrete de Pagamento - Quota Mensal', html);
    }
  }

  async sendMonthlyReport(reportData) {
    const { db: knex } = require('../config/knex.cjs');
    
    // Get all administrators
    const administrators = await knex('users')
      .where('role', 'admin')
      .where('is_active', true)
      .select('email', 'name');
    
    for (const admin of administrators) {
      let buildingReports = '';
      
      for (const building of reportData.buildings) {
        buildingReports += `
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${building.building}</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Receitas:</strong></td>
                <td style="text-align: right;">€${building.income.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Despesas:</strong></td>
                <td style="text-align: right;">€${building.expenses.toFixed(2)}</td>
              </tr>
              <tr style="border-top: 2px solid #ddd;">
                <td style="padding: 8px 0;"><strong>Saldo:</strong></td>
                <td style="text-align: right; color: ${building.balance >= 0 ? '#4caf50' : '#f44336'};">
                  €${building.balance.toFixed(2)}
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
              <p style="margin: 5px 0;">
                <strong>Taxa de cobrança:</strong> ${building.collectionRate}%
              </p>
              <p style="margin: 5px 0;">
                <strong>Quotas pagas:</strong> ${building.paidQuotas.count} (€${building.paidQuotas.amount.toFixed(2)})
              </p>
              <p style="margin: 5px 0;">
                <strong>Quotas pendentes:</strong> ${building.pendingQuotas.count} (€${building.pendingQuotas.amount.toFixed(2)})
              </p>
              <p style="margin: 5px 0;">
                <strong>Fundo de reserva:</strong> €${building.reserveFundBalance.toFixed(2)}
              </p>
            </div>
          </div>
        `;
      }
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #333;">Relatório Financeiro Mensal</h2>
          <p>Olá ${admin.name},</p>
          <p>Segue o relatório financeiro de <strong>${reportData.month} ${reportData.year}</strong>.</p>
          
          ${buildingReports}
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">
              <strong>Relatório gerado em:</strong> ${new Date(reportData.generatedAt).toLocaleString('pt-PT')}
            </p>
          </div>
          
          <p>Para informações detalhadas, aceda ao portal de gestão.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Sistema de Gestão de Condomínios | Relatório Automático
          </p>
        </div>
      `;
      
      await this.sendEmail(
        admin.email, 
        `Relatório Financeiro - ${reportData.month} ${reportData.year}`, 
        html
      );
    }
  }

  async sendConvocatoriaNotification(convocatoria, members) {
    for (const member of members) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Convocatória - Assembleia de Condomínio</h2>
          <p>Estimado(a) ${member.name},</p>
          <p>Vimos por este meio convocá-lo(a) para a Assembleia ${convocatoria.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'} do condomínio.</p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Informações da Assembleia:</h3>
            <p><strong>Data:</strong> ${new Date(convocatoria.meeting_date).toLocaleDateString('pt-PT')}</p>
            <p><strong>Hora:</strong> ${convocatoria.meeting_time}</p>
            <p><strong>Local:</strong> ${convocatoria.location}</p>
            <p><strong>Edifício:</strong> ${convocatoria.building_name}</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ordem de Trabalhos:</h3>
            <ol>
              ${convocatoria.agenda_items.map(item => `<li>${item}</li>`).join('')}
            </ol>
          </div>
          
          ${convocatoria.second_call_enabled ? `
            <div style="background: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Segunda Convocatória:</strong></p>
              <p>Caso não se verifique quórum, a assembleia reunirá em segunda convocatória às ${convocatoria.second_call_time}, 
              com qualquer número de condóminos presentes.</p>
            </div>
          ` : ''}
          
          <p>A sua presença é importante para as decisões do condomínio.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            ${convocatoria.building_name} | Administração do Condomínio
          </p>
        </div>
      `;
      
      await this.sendEmail(
        member.email,
        `Convocatória - Assembleia ${convocatoria.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'}`,
        html
      );
    }
  }

  async sendWelcomeEmail(memberData) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">Bem-vindo ao Portal do Condomínio</h2>
        <p>Estimado(a) ${memberData.name},</p>
        <p>A sua conta no portal de gestão do condomínio foi criada com sucesso.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Dados de Acesso:</h3>
          <p><strong>Email:</strong> ${memberData.email}</p>
          <p><strong>Senha temporária:</strong> ${memberData.tempPassword}</p>
          <p><strong>Portal:</strong> <a href="${process.env.VITE_APP_URL}">${process.env.VITE_APP_URL}</a></p>
        </div>
        
        <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Importante:</strong> Por favor, altere a sua senha no primeiro acesso.</p>
        </div>
        
        <h3>No portal poderá:</h3>
        <ul>
          <li>Consultar as suas quotas e pagamentos</li>
          <li>Aceder a documentos do condomínio</li>
          <li>Ver convocatórias e atas de assembleias</li>
          <li>Comunicar com a administração</li>
          <li>Reportar problemas de manutenção</li>
        </ul>
        
        <p>Se tiver alguma dúvida, não hesite em contactar-nos.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          ${memberData.building_name} | Administração do Condomínio
        </p>
      </div>
    `;
    
    await this.sendEmail(
      memberData.email,
      'Bem-vindo ao Portal do Condomínio',
      html
    );
  }
}

module.exports = new EmailService();