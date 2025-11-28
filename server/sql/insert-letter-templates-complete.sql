-- ========================================
-- TEMPLATES PROFESIONALES DE CARTAS
-- Sistema Completo de Comunicaciones
-- ========================================

BEGIN;

-- 1. AVISO DE TRABALHOS / OBRAS (Works Notice)
INSERT INTO letter_templates (
  id, building_id, name, type, subject, content, variables, is_active, legal_basis, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
  'Aviso de Trabalhos/Obras',
  'works_notice',
  'Aviso de Trabalhos no Condomínio',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
        .building-info { text-align: center; margin-bottom: 20px; font-size: 14px; color: #666; }
        .subject { font-weight: bold; font-size: 16px; background-color: #eff6ff;
                   padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .content { margin: 20px 0; }
        .works-details { background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .important { color: #dc2626; font-weight: bold; }
        .info-box { background-color: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
    </style>
</head>
<body>
<div class="header">
    <h2>{{building.name}}</h2>
    <div class="building-info">
        {{building.address}}, {{building.postalCode}}, {{building.city}}
    </div>
</div>

<div class="recipient">
    <strong>Exmo(a). Sr(a).</strong> {{member.name}}<br>
    <strong>Fração:</strong> {{member.fraction}}
</div>

<div class="subject">Assunto: Aviso de Trabalhos - {{works.title}}</div>

<div class="content">
    <p>Vimos por este meio informar que serão realizados trabalhos no condomínio conforme detalhes abaixo:</p>

    <div class="works-details">
        <p><strong>📋 Descrição dos Trabalhos:</strong><br>
        {{works.description}}</p>

        <p><strong>📅 Data de Início:</strong> {{works.startDate}}<br>
        <strong>⏰ Horário:</strong> {{works.schedule}}</p>

        <p><strong>⏱️ Duração Prevista:</strong> {{works.duration}}</p>

        <p><strong>🏢 Local:</strong> {{works.location}}</p>

        <p><strong>👷 Empresa Responsável:</strong> {{works.company}}</p>
    </div>

    <div class="info-box">
        <p><strong>⚠️ INFORMAÇÕES IMPORTANTES:</strong></p>
        <ul>
            <li>Durante os trabalhos poderá haver ruído e incómodos temporários</li>
            <li>Solicitamos a colaboração de todos os condóminos</li>
            <li>Em caso de emergência, contactar a administração</li>
            {{#works.specialNotes}}
            <li>{{works.specialNotes}}</li>
            {{/works.specialNotes}}
        </ul>
    </div>

    <p>Agradecemos a vossa compreensão e colaboração.</p>
</div>

<div class="footer">
    <p><strong>A Administração</strong><br>
    {{building.administrator}}<br>
    Telefone: {{building.adminPhone}} | Email: {{building.adminEmail}}</p>
</div>
</body>
</html>',
  ARRAY['member.name', 'member.fraction', 'works.title', 'works.description', 'works.startDate',
        'works.schedule', 'works.duration', 'works.location', 'works.company', 'works.specialNotes',
        'building.name', 'building.address', 'building.city', 'building.postalCode',
        'building.administrator', 'building.adminPhone', 'building.adminEmail'],
  true,
  'Decreto-Lei n.º 268/94 (Lei da Propriedade Horizontal) - Art. 8º',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. CONVOCAÇÃO ASSEMBLEIA EXTRAORDINÁRIA (Urgent)
INSERT INTO letter_templates (
  id, building_id, name, type, subject, content, variables, is_active, legal_basis, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
  'Convocação Assembleia Urgente',
  'urgent_assembly',
  'Convocação URGENTE - Assembleia Extraordinária',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
        .urgent-header { background-color: #dc2626; color: white; text-align: center;
                        padding: 20px; margin: -40px -40px 30px -40px; }
        .urgent-badge { display: inline-block; background-color: #fef2f2; color: #dc2626;
                       padding: 8px 15px; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .building-info { text-align: center; margin-bottom: 20px; font-size: 14px; }
        .subject { font-weight: bold; font-size: 16px; background-color: #fee2e2;
                   padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
        .assembly-box { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .agenda { background-color: #f9fafb; padding: 15px; border-left: 3px solid #2563eb; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
<div class="urgent-header">
    <h1>⚠️ CONVOCAÇÃO URGENTE ⚠️</h1>
    <p style="margin: 5px 0;">ASSEMBLEIA EXTRAORDINÁRIA DE CONDÓMINOS</p>
</div>

<div class="building-info">
    <h3>{{building.name}}</h3>
    {{building.address}}, {{building.postalCode}}, {{building.city}}
</div>

<div class="urgent-badge">🔴 ASSUNTO URGENTE - PRESENÇA RECOMENDADA</div>

<div class="recipient">
    <strong>Exmo(a). Sr(a).</strong> {{member.name}}<br>
    <strong>Fração:</strong> {{member.fraction}} ({{member.permillage}}‰)
</div>

<div class="subject">
    Assunto: {{assembly.subject}}
</div>

<div class="content">
    <p>Nos termos do artigo 16.º do Decreto-Lei n.º 268/94, convoco V. Exa. para participar numa
    <strong>Assembleia Extraordinária URGENTE</strong> de condóminos, que terá lugar:</p>

    <div class="assembly-box">
        <p><strong>📅 Data:</strong> {{assembly.date}}</p>
        <p><strong>⏰ Hora (1ª Convocatória):</strong> {{assembly.firstCallTime}}</p>
        <p><strong>⏰ Hora (2ª Convocatória):</strong> {{assembly.secondCallTime}}</p>
        <p><strong>📍 Local:</strong> {{assembly.location}}</p>
    </div>

    <p><strong>MOTIVO DA URGÊNCIA:</strong></p>
    <p>{{assembly.urgencyReason}}</p>

    <div class="agenda">
        <h4>ORDEM DO DIA:</h4>
        <ol>
            {{#assembly.agendaItems}}
            <li>{{.}}</li>
            {{/assembly.agendaItems}}
        </ol>
    </div>

    <p class="important">⚠️ Dada a urgência do assunto, solicitamos a presença de todos os condóminos
    ou, na impossibilidade, que se façam representar mediante procuração.</p>
</div>

<div class="footer">
    <p><strong>O Administrador</strong><br>
    {{building.administrator}}<br>
    Data: {{current.date}}</p>
</div>
</body>
</html>',
  ARRAY['member.name', 'member.fraction', 'member.permillage', 'assembly.subject', 'assembly.date',
        'assembly.firstCallTime', 'assembly.secondCallTime', 'assembly.location', 'assembly.urgencyReason',
        'assembly.agendaItems', 'building.name', 'building.address', 'building.city', 'building.postalCode',
        'building.administrator', 'current.date'],
  true,
  'Decreto-Lei n.º 268/94 - Art. 16º e 17º',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. LEMBRETE DE PAGAMENTO (Payment Reminder)
INSERT INTO letter_templates (
  id, building_id, name, type, subject, content, variables, is_active, legal_basis, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
  'Lembrete de Pagamento de Quotas',
  'payment_reminder',
  'Lembrete Amigável - Pagamento de Quotas',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .subject { font-weight: bold; font-size: 16px; background-color: #fef3c7;
                   padding: 15px; border-left: 4px solid #f59e0b; }
        .payment-box { background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 24px; color: #2563eb; font-weight: bold; text-align: center; margin: 15px 0; }
        .payment-details { background-color: #f9fafb; padding: 15px; border-radius: 5px; }
        .info { background-color: #ecfdf5; padding: 12px; border-left: 4px solid #10b981; margin: 15px 0; }
    </style>
</head>
<body>
<div class="header">
    <h2>{{building.name}}</h2>
    <p>{{building.address}}, {{building.postalCode}}, {{building.city}}</p>
</div>

<div class="recipient">
    <strong>Exmo(a). Sr(a).</strong> {{member.name}}<br>
    <strong>Fração:</strong> {{member.fraction}}
</div>

<div class="subject">Assunto: Lembrete de Pagamento - {{payment.period}}</div>

<div class="content">
    <p>Vimos por este meio relembrar que se aproxima o prazo de pagamento das quotas de condomínio:</p>

    <div class="payment-box">
        <p><strong>📅 Período:</strong> {{payment.period}}</p>
        <p><strong>⏰ Prazo de Pagamento:</strong> {{payment.dueDate}}</p>

        <div class="amount">
            💶 {{payment.amount}}€
        </div>

        <div class="payment-details">
            <p><strong>💳 DADOS PARA TRANSFERÊNCIA:</strong></p>
            <p><strong>IBAN:</strong> {{building.iban}}<br>
            <strong>Referência:</strong> {{payment.reference}}<br>
            <strong>Titular:</strong> {{building.accountHolder}}</p>
        </div>
    </div>

    <div class="info">
        <p><strong>ℹ️ INFORMAÇÃO IMPORTANTE:</strong></p>
        <p>Para evitar o pagamento de juros de mora, solicitamos que o pagamento seja efetuado
        até à data indicada.</p>
        <p>Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.</p>
    </div>

    <p>Para qualquer esclarecimento, não hesite em contactar-nos.</p>
</div>

<div class="footer">
    <p><strong>A Administração</strong><br>
    {{building.administrator}}<br>
    Tel: {{building.adminPhone}} | Email: {{building.adminEmail}}</p>
</div>
</body>
</html>',
  ARRAY['member.name', 'member.fraction', 'payment.period', 'payment.dueDate', 'payment.amount',
        'payment.reference', 'building.name', 'building.address', 'building.city', 'building.postalCode',
        'building.iban', 'building.accountHolder', 'building.administrator', 'building.adminPhone', 'building.adminEmail'],
  true,
  'Decreto-Lei n.º 268/94 - Art. 4º (Pagamento de quotas)',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. APROVAÇÃO DE DESPESA EXTRAORDINÁRIA
INSERT INTO letter_templates (
  id, building_id, name, type, subject, content, variables, is_active, legal_basis, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
  'Aprovação de Despesa Extraordinária',
  'extraordinary_expense',
  'Aprovação e Rateio de Despesa Extraordinária',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; background-color: #eff6ff; padding: 20px; }
        .expense-card { background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;
                       border-left: 4px solid #f59e0b; }
        .your-share { background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;
                     text-align: center; }
        .amount-big { font-size: 32px; color: #059669; font-weight: bold; }
        .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .details-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .details-table td:first-child { font-weight: bold; width: 40%; }
    </style>
</head>
<body>
<div class="header">
    <h2>{{building.name}}</h2>
    <p>{{building.address}}, {{building.postalCode}}, {{building.city}}</p>
</div>

<div class="recipient">
    <strong>Exmo(a). Sr(a).</strong> {{member.name}}<br>
    <strong>Fração:</strong> {{member.fraction}} (Permilagem: {{member.permillage}}‰)
</div>

<div class="subject">Assunto: Despesa Extraordinária Aprovada - {{expense.title}}</div>

<div class="content">
    <p>Informamos que em Assembleia de Condóminos realizada em {{assembly.date}}, foi aprovada
    uma despesa extraordinária com os seguintes detalhes:</p>

    <div class="expense-card">
        <h3>📋 DETALHES DA DESPESA</h3>
        <table class="details-table">
            <tr>
                <td>Descrição:</td>
                <td>{{expense.description}}</td>
            </tr>
            <tr>
                <td>Fornecedor:</td>
                <td>{{expense.supplier}}</td>
            </tr>
            <tr>
                <td>Valor Total:</td>
                <td><strong>{{expense.totalAmount}}€</strong></td>
            </tr>
            <tr>
                <td>Data Prevista:</td>
                <td>{{expense.scheduledDate}}</td>
            </tr>
            <tr>
                <td>Votação:</td>
                <td>{{expense.votingResult}}</td>
            </tr>
        </table>
    </div>

    <div class="your-share">
        <h3>💶 A SUA QUOTA</h3>
        <p>Com base na sua permilagem ({{member.permillage}}‰), o valor a pagar é:</p>
        <div class="amount-big">{{expense.yourShare}}€</div>
        <p><strong>Prazo de Pagamento:</strong> {{payment.dueDate}}</p>
    </div>

    <div class="payment-details">
        <h4>💳 DADOS PARA PAGAMENTO:</h4>
        <p><strong>IBAN:</strong> {{building.iban}}<br>
        <strong>Referência:</strong> {{payment.reference}}<br>
        <strong>Descrição:</strong> Despesa Extraordinária - {{expense.title}}</p>
    </div>

    <p><em>Nota: Esta despesa foi aprovada democraticamente em assembleia, conforme previsto
    na Lei da Propriedade Horizontal.</em></p>
</div>

<div class="footer">
    <p><strong>A Administração</strong><br>
    {{building.administrator}}<br>
    Tel: {{building.adminPhone}} | Email: {{building.adminEmail}}</p>
</div>
</body>
</html>',
  ARRAY['member.name', 'member.fraction', 'member.permillage', 'expense.title', 'expense.description',
        'expense.supplier', 'expense.totalAmount', 'expense.scheduledDate', 'expense.votingResult',
        'expense.yourShare', 'payment.dueDate', 'payment.reference', 'assembly.date',
        'building.name', 'building.address', 'building.city', 'building.postalCode',
        'building.iban', 'building.administrator', 'building.adminPhone', 'building.adminEmail'],
  true,
  'Decreto-Lei n.º 268/94 - Art. 4º e 16º',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. NOTIFICAÇÃO DE INCUMPRIMENTO DE REGRAS
INSERT INTO letter_templates (
  id, building_id, name, type, subject, content, variables, is_active, legal_basis, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
  'Notificação de Incumprimento',
  'rule_violation',
  'Notificação de Incumprimento do Regulamento',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .subject { font-weight: bold; font-size: 16px; background-color: #fee2e2;
                   padding: 15px; border-left: 4px solid #dc2626; }
        .violation-box { background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .rules-reference { background-color: #f3f4f6; padding: 15px; border-left: 3px solid #6b7280; }
        .action-required { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    </style>
</head>
<body>
<div class="header">
    <h2>{{building.name}}</h2>
    <p>{{building.address}}, {{building.postalCode}}, {{building.city}}</p>
</div>

<div class="recipient">
    <strong>Exmo(a). Sr(a).</strong> {{member.name}}<br>
    <strong>Fração:</strong> {{member.fraction}}
</div>

<div class="subject">Assunto: Notificação de Incumprimento - {{violation.type}}</div>

<div class="content">
    <p>Vimos por este meio notificar V. Exa. de que foi constatada a seguinte situação:</p>

    <div class="violation-box">
        <h4>⚠️ DESCRIÇÃO DA SITUAÇÃO</h4>
        <p>{{violation.description}}</p>
        <p><strong>Data da Ocorrência:</strong> {{violation.date}}<br>
        <strong>Local:</strong> {{violation.location}}</p>
    </div>

    <div class="rules-reference">
        <h4>📋 ENQUADRAMENTO LEGAL</h4>
        <p>Esta situação constitui incumprimento do seguinte:</p>
        <ul>
            {{#violation.rulesViolated}}
            <li>{{.}}</li>
            {{/violation.rulesViolated}}
        </ul>
    </div>

    <div class="action-required">
        <h4>✅ AÇÃO REQUERIDA</h4>
        <p>{{violation.actionRequired}}</p>
        <p><strong>Prazo para Regularização:</strong> {{violation.deadline}}</p>
    </div>

    <p>Caso não seja possível a regularização voluntária no prazo indicado, a administração
    verá necessidade de tomar as medidas previstas no regulamento do condomínio e na lei.</p>

    <p>Estamos disponíveis para qualquer esclarecimento que se mostre necessário.</p>
</div>

<div class="footer">
    <p><strong>A Administração</strong><br>
    {{building.administrator}}<br>
    Tel: {{building.adminPhone}} | Email: {{building.adminEmail}}<br>
    Data: {{current.date}}</p>
</div>
</body>
</html>',
  ARRAY['member.name', 'member.fraction', 'violation.type', 'violation.description', 'violation.date',
        'violation.location', 'violation.rulesViolated', 'violation.actionRequired', 'violation.deadline',
        'building.name', 'building.address', 'building.city', 'building.postalCode',
        'building.administrator', 'building.adminPhone', 'building.adminEmail', 'current.date'],
  true,
  'Decreto-Lei n.º 268/94 - Art. 8º (Deveres dos condóminos)',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. CERTIFICADO DE NÃO DÍVIDA (Debt Certificate)
INSERT INTO letter_templates (
  id, building_id, name, type, subject, content, variables, is_active, legal_basis, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
  'Certificado de Não Dívida',
  'no_debt_certificate',
  'Certificado de Não Dívida ao Condomínio',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border: 3px solid #2563eb;
                 padding: 25px; background-color: #eff6ff; }
        .certificate-number { text-align: right; font-size: 12px; color: #666; margin-bottom: 20px; }
        .certificate-seal { text-align: center; margin: 30px 0; }
        .seal-text { display: inline-block; border: 2px solid #10b981; border-radius: 50%;
                    padding: 30px; color: #10b981; font-weight: bold; font-size: 18px; }
        .declaration { background-color: #ecfdf5; padding: 20px; border-left: 4px solid #10b981;
                      margin: 20px 0; }
        .signature-area { margin-top: 50px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #2563eb;
                 font-size: 11px; color: #666; }
    </style>
</head>
<body>
<div class="header">
    <h1>CERTIFICADO</h1>
    <h2>DE NÃO DÍVIDA</h2>
    <p style="margin: 10px 0;">{{building.name}}</p>
</div>

<div class="certificate-number">
    Certificado N.º {{certificate.number}} | Data: {{certificate.date}}
</div>

<div class="content">
    <div class="declaration">
        <p style="text-align: center; margin-bottom: 20px;">
            <strong>DECLARAÇÃO</strong>
        </p>

        <p>A Administração do condomínio <strong>{{building.name}}</strong>, sito em
        {{building.address}}, {{building.postalCode}} {{building.city}}, registado na
        Conservatória do Registo Predial sob o n.º {{building.registrationNumber}},</p>

        <p><strong>CERTIFICA QUE:</strong></p>

        <p>O(A) proprietário(a) <strong>{{member.name}}</strong>, titular da fração
        <strong>{{member.fraction}}</strong>, com a permilagem de <strong>{{member.permillage}}‰</strong>,
        <strong>NÃO TEM QUALQUER DÍVIDA</strong> perante o condomínio até à presente data.</p>

        <p>O presente certificado é válido até <strong>{{certificate.validUntil}}</strong> e destina-se a:
        <br><strong>{{certificate.purpose}}</strong></p>
    </div>

    <div class="certificate-seal">
        <div class="seal-text">
            ✓ VÁLIDO<br>SEM DÍVIDAS
        </div>
    </div>

    <p><em>Este certificado confirma que, à data de emissão, não existem quotas de condomínio em atraso,
    dívidas por despesas extraordinárias, ou quaisquer outros valores devidos ao condomínio.</em></p>
</div>

<div class="signature-area">
    <p>{{building.city}}, {{certificate.date}}</p>
    <br><br>
    <p>_________________________________________<br>
    <strong>{{building.administrator}}</strong><br>
    Administrador do Condomínio</p>
</div>

<div class="footer">
    <p>{{building.name}} | {{building.address}}, {{building.postalCode}} {{building.city}}<br>
    Email: {{building.adminEmail}} | Telefone: {{building.adminPhone}}<br>
    NIF: {{building.nif}}</p>
</div>
</body>
</html>',
  ARRAY['member.name', 'member.fraction', 'member.permillage', 'certificate.number', 'certificate.date',
        'certificate.validUntil', 'certificate.purpose', 'building.name', 'building.address',
        'building.city', 'building.postalCode', 'building.registrationNumber', 'building.nif',
        'building.administrator', 'building.adminEmail', 'building.adminPhone'],
  true,
  'Decreto-Lei n.º 268/94',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar inserção
DO $$
DECLARE
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count
    FROM letter_templates
    WHERE building_id = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';

    RAISE NOTICE '✅ Total de templates de cartas: %', template_count;
END $$;

COMMIT;
