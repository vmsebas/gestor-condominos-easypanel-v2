import api from '@/lib/api';

export interface ConvocatoriaData {
  building_id: string;
  meeting_type: 'ordinary' | 'extraordinary';
  meeting_date: string;
  meeting_time: string;
  meeting_location: string;
  second_call_enabled: boolean;
  second_call_date?: string;
  second_call_time?: string;
  delivery_methods: string[];
  agenda_items: AgendaItem[];
  attached_documents?: string[];
  administrator_name?: string;
  secretary_name?: string;
  legal_reference?: string;
  status: 'draft' | 'sent' | 'celebrated' | 'cancelled';
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  type: 'general' | 'financial' | 'maintenance' | 'legal' | 'other';
  voting_required: boolean;
  voting_type?: 'simple' | 'qualified' | 'unanimous';
  documents?: string[];
  estimated_duration?: number;
}

export interface ConvocatoriaRecipient {
  member_id: string;
  name: string;
  email?: string;
  phone?: string;
  apartment: string;
  delivery_method: string;
  sent_at?: string;
  delivered_at?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  error_message?: string;
}

export class ConvocatoriaService {
  
  /**
   * Cria uma nova convocatória na base de dados
   */
  static async createConvocatoria(data: ConvocatoriaData): Promise<{ success: boolean; convocatoriaId?: string; error?: string }> {
    try {
      console.log('Creating convocatoria with data:', data);
      
      // Preparar dados para o endpoint (incluindo nova coluna agenda_items)
      const convocatoriaPayload = {
        building_id: data.building_id,
        assembly_type: data.meeting_type,
        meeting_date: data.meeting_date,
        time: data.meeting_time,
        location: data.meeting_location,
        second_call_enabled: data.second_call_enabled,
        second_call_date: data.second_call_date,
        second_call_time: data.second_call_time,
        administrator: data.administrator_name || 'Administrador',
        secretary: data.secretary_name,
        legal_reference: data.legal_reference || 'Código Civil Português, artigos 1430.º e seguintes',
        assembly_number: `${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`, // Número único
        agenda_items: data.agenda_items // Agora guardamos como JSONB
      };

      const response = await api.request('/convocatorias', {
        method: 'POST',
        body: JSON.stringify(convocatoriaPayload),
      });

      if (response.success && response.data) {
        console.log('Convocatoria created successfully:', response.data);
        return {
          success: true,
          convocatoriaId: response.data.id
        };
      } else {
        console.error('Failed to create convocatoria:', response);
        return {
          success: false,
          error: response.error || 'Erro desconhecido ao criar convocatória'
        };
      }
    } catch (error) {
      console.error('Error creating convocatoria:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro inesperado'
      };
    }
  }

  /**
   * Busca membros do condomínio para envio
   */
  static async getConvocatoriaRecipients(buildingId: string): Promise<ConvocatoriaRecipient[]> {
    try {
      const response = await api.request(`/members?building_id=${buildingId}`);
      
      if (response.success && response.data) {
        return response.data.map((member: any) => ({
          member_id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          apartment: member.apartment,
          delivery_method: member.email ? 'email' : 'phone',
          status: 'pending' as const
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching recipients:', error);
      return [];
    }
  }

  /**
   * Envia convocatória por email para os membros
   */
  static async sendConvocatoriaEmails(
    convocatoriaId: string, 
    recipients: ConvocatoriaRecipient[],
    convocatoriaData: ConvocatoriaData,
    onProgress?: (progress: number, currentRecipient: string) => void
  ): Promise<{ success: boolean; results: ConvocatoriaRecipient[]; error?: string }> {
    try {
      const results: ConvocatoriaRecipient[] = [...recipients];
      
      // Gerar HTML da convocatória
      const htmlContent = this.generateConvocatoriaHTML(convocatoriaData);
      
      for (let i = 0; i < results.length; i++) {
        const recipient = results[i];
        
        if (onProgress) {
          onProgress(((i + 1) / results.length) * 100, recipient.name);
        }
        
        try {
          // Enviar email real
          await this.sendEmailToRecipient(recipient, htmlContent, convocatoriaData);
          
          recipient.status = 'sent';
          recipient.sent_at = new Date().toISOString();
          
          // Para emails reais, marcamos como enviado imediatamente
          // A confirmação de entrega dependeria de webhooks do provedor de email
          recipient.status = 'delivered';
          recipient.delivered_at = new Date().toISOString();
        } catch (error) {
          recipient.status = 'failed';
          recipient.error_message = error instanceof Error ? error.message : 'Erro no envio';
        }
        
        // Pequena pausa para simular processamento real
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Atualizar status da convocatória na BD
      await this.updateConvocatoriaStatus(convocatoriaId, 'sent', results);
      
      return { success: true, results };
    } catch (error) {
      console.error('Error sending convocatoria emails:', error);
      return {
        success: false,
        results: recipients,
        error: error instanceof Error ? error.message : 'Erro no envio de emails'
      };
    }
  }

  /**
   * Envia email real usando o serviço de email do servidor
   */
  private static async sendEmailToRecipient(recipient: ConvocatoriaRecipient, htmlContent: string, convocatoriaData: ConvocatoriaData): Promise<void> {
    if (!recipient.email) {
      throw new Error('Destinatário não possui email');
    }

    const subject = `Convocatória para Assembleia ${convocatoriaData.meeting_type === 'extraordinary' ? 'Extraordinária' : 'Ordinária'} de Condóminos`;
    
    try {
      const response = await api.request('/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: recipient.email,
          subject: subject,
          html: htmlContent
        })
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro no envio do email');
      }

      console.log(`Email enviado com sucesso para ${recipient.email} (${recipient.name})`);
    } catch (error) {
      console.error(`Erro ao enviar email para ${recipient.email}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza status da convocatória na BD
   */
  private static async updateConvocatoriaStatus(
    convocatoriaId: string, 
    status: string, 
    recipients: ConvocatoriaRecipient[]
  ): Promise<void> {
    try {
      const updateData = {
        status,
        sent_at: new Date().toISOString(),
        recipients_data: JSON.stringify(recipients)
      };

      await api.request(`/convocatorias/${convocatoriaId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      console.error('Error updating convocatoria status:', error);
    }
  }

  /**
   * Gera HTML da convocatória para email
   */
  static generateConvocatoriaHTML(data: ConvocatoriaData): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-PT">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convocatória para Assembleia de Condóminos</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1f2937;
            margin: 0;
            font-size: 24px;
          }
          .info-section {
            margin-bottom: 25px;
          }
          .info-section h3 {
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .info-table td {
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .info-table td:first-child {
            font-weight: bold;
            width: 150px;
          }
          .agenda {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
          }
          .agenda ol {
            margin: 0;
            padding-left: 20px;
          }
          .agenda li {
            margin-bottom: 8px;
          }
          .legal-notice {
            background: #fffbeb;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 15px;
            margin-top: 25px;
            font-size: 14px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CONVOCATÓRIA</h1>
            <h2>Assembleia ${data.meeting_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'} de Condóminos</h2>
          </div>

          <div class="info-section">
            <h3>Informações da Reunião</h3>
            <table class="info-table">
              <tr>
                <td>Data:</td>
                <td>${new Date(data.meeting_date).toLocaleDateString('pt-PT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</td>
              </tr>
              <tr>
                <td>Hora:</td>
                <td>${data.meeting_time}</td>
              </tr>
              <tr>
                <td>Local:</td>
                <td>${data.meeting_location}</td>
              </tr>
              ${data.second_call_enabled ? `
              <tr>
                <td>Segunda Convocatória:</td>
                <td>${data.second_call_date ? new Date(data.second_call_date).toLocaleDateString('pt-PT') : 'Mesmo dia'} às ${data.second_call_time}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div class="info-section">
            <h3>Ordem do Dia</h3>
            <div class="agenda">
              <ol>
                ${data.agenda_items.map(item => `<li><strong>${item.title}</strong>${item.description ? `: ${item.description}` : ''}</li>`).join('')}
              </ol>
            </div>
          </div>

          <div class="legal-notice">
            <strong>Informação Legal:</strong><br>
            A assembleia funcionará em primeira convocatória com a presença de condóminos que representem mais de metade do valor total do prédio.
            ${data.second_call_enabled ? 'Em segunda convocatória, a assembleia funcionará com qualquer número de condóminos presentes.' : ''}
            <br><br>
            <em>Base legal: Código Civil Português, artigos 1430.º e seguintes</em>
          </div>

          <div class="footer">
            <p>Documento gerado automaticamente pelo sistema Gestor Condominios</p>
            <p>Data de geração: ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Busca convocatórias existentes
   */
  static async getConvocatorias(buildingId?: string): Promise<any[]> {
    try {
      const url = buildingId ? `/convocatorias?building_id=${buildingId}` : '/convocatorias';
      const response = await api.request(url);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching convocatorias:', error);
      return [];
    }
  }

  /**
   * Busca uma convocatória específica
   */
  static async getConvocatoria(id: string): Promise<any | null> {
    try {
      const response = await api.request(`/convocatorias/${id}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching convocatoria:', error);
      return null;
    }
  }
}

export default ConvocatoriaService;