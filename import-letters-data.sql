-- Script para importar plantillas de cartas y crear datos de ejemplo
-- Gestor Condominios - Importación de Cartas y Documentos

BEGIN;

-- 1. Importar plantillas de cartas (letter_templates)
INSERT INTO letter_templates (id, building_id, name, type, subject, content, variables, is_active, legal_basis, title, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    'Carta de Cobranza de Quotas',
    'late_payment',
    'Quotas de Condomínio em Atraso',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .building-info { text-align: center; margin-bottom: 20px; font-size: 14px; }
        .date { text-align: right; margin-bottom: 30px; }
        .recipient { margin-bottom: 20px; }
        .subject { font-weight: bold; font-size: 16px; margin-bottom: 20px; background-color: #f5f5f5; padding: 10px; border-left: 4px solid #cc0000; }
        .content { margin-bottom: 30px; text-align: justify; }
        .signature { margin-top: 40px; }
        .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        .important { color: #cc0000; font-weight: bold; }
        .legal-notice { font-size: 12px; background-color: #f9f9f9; padding: 10px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
<div class="header">
    <h2>Condomínio {{building.name}}</h2>
    <div class="building-info">
        {{building.address}}, {{building.postalCode}}, {{building.city}}<br>
        <strong>IBAN:</strong> {{building.iban}}
    </div>
</div>
<div class="date">{{building.city}}, {{date.formatted}}</div>
<div class="recipient">
    <strong>Exmo(a). Sr(a).</strong> {{member.name}}<br>
    <strong>Fracção:</strong> {{member.fraction}} ({{member.permillage}}‰)
</div>
<div class="subject">Assunto: Quotas de Condomínio em Atraso - {{payment.period}}</div>
<div class="content">
    <p>Venho por este meio informar que, de acordo com os nossos registos, V. Exa. tem em dívida o valor de <span class="important">{{payment.due}}€</span> referente às quotas de condomínio do período <strong>{{payment.period}}</strong>.</p>
    <p>Este valor corresponde aos seguintes meses em atraso:</p>
    <ul>
        <li>Período: <strong>{{payment.period}}</strong></li>
        <li>Valor em dívida: <strong>{{payment.due}}€</strong></li>
        <li>Data limite de pagamento original: <strong>{{payment.originalDueDate}}</strong></li>
    </ul>
    <p>Conforme o artigo 6º do Decreto-Lei n.º 268/94, de 25 de Outubro, e o Regulamento do Condomínio, solicito a regularização deste valor até <strong>{{payment.dueDate}}</strong>.</p>
    <div class="legal-notice">
        <p>Lembramos que, de acordo com a legislação em vigor, o não pagamento das quotas de condomínio pode resultar em:</p>
        <ol>
            <li>Aplicação de juros de mora à taxa legal;</li>
            <li>Procedimento judicial para cobrança coerciva dos valores em dívida;</li>
            <li>Inclusão das despesas judiciais e honorários de advogado no montante a cobrar.</li>
        </ol>
    </div>
    <p>Para efectuar o pagamento, poderá realizar uma transferência bancária para o IBAN acima indicado, mencionando a sua fracção na descrição.</p>
    <p>Caso necessite de esclarecimentos adicionais ou pretenda estabelecer um plano de pagamento, por favor entre em contacto com a administração através do telefone <strong>{{building.adminPhone}}</strong> ou e-mail <strong>{{building.adminEmail}}</strong>.</p>
    <p>Caso já tenha procedido à regularização desta situação após a emissão desta comunicação, por favor desconsidere este aviso.</p>
</div>
<div class="signature">
    <p>Com os melhores cumprimentos,</p>
    <p><strong>{{building.administrator}}</strong><br>
    Administração do Condomínio {{building.name}}</p>
</div>
<div class="footer">
    {{building.name}} | {{building.address}}, {{building.city}}, {{building.postalCode}} | Tel: {{building.adminPhone}} | Email: {{building.adminEmail}}
</div>
</body>
</html>',
    ARRAY['member.name', 'member.fraction', 'member.permillage', 'payment.due', 'payment.period', 'payment.dueDate', 'payment.originalDueDate', 'building.name', 'building.address', 'building.city', 'building.postalCode', 'building.iban', 'building.administrator', 'building.adminPhone', 'building.adminEmail'],
    true,
    'Decreto-Lei n.º 268/94, de 25 de Outubro',
    'Carta de Cobranza - Quotas em Atraso',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    'Aprovação de Orçamento',
    'budget_approval',
    'Aprovação do Orçamento para o Exercício',
    '<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="text-align: right; margin-bottom: 20px;">
    <div>{{building.name}}</div>
    <div>{{building.address}}</div>
    <div>Lisboa, {{date.today}}</div>
  </div>
  <div style="margin-bottom: 30px;">
    <div><strong>Estimado/a Sr./Sra. {{member.name}}</strong></div>
    <div>Fracção: {{member.fraction}}</div>
    <div>Permilagem: {{member.permillage}}‰</div>
  </div>
  <div style="margin-bottom: 20px;">
    <div><strong>Assunto: Aprovação do Orçamento para o Exercício {{date.year}} – Assembleia n.º {{assembly.number}}/{{date.year}}</strong></div>
  </div>
  <div style="margin-bottom: 30px;">
    <div>Por meio da presente, informamos que na assembleia geral de condóminos n.º {{assembly.number}}/{{date.year}}, celebrada no dia {{assembly.date}}, com a ordem do dia "{{assembly.agenda}}", foi aprovado por maioria o novo orçamento do condomínio, segundo consta na ata n.º {{assembly.number}}/{{date.year}}.</div>
    <div style="margin-top: 15px;">De acordo com o decidido, a quota correspondente à sua fracção foi estabelecida em <strong>{{payment.newQuota}}€</strong> ({{payment.period}}) em função da sua permilagem.</div>
    <div style="margin-top: 15px;">Para sua comodidade, o pagamento poderá ser realizado de forma anual ou em quotas mensais de <strong>{{payment.monthlyQuota}}€</strong>, com início a partir de {{payment.startDate}}. O pagamento deverá ser efectuado até ao dia {{payment.dueDate}} mediante transferência bancária para a conta:</div>
    <div style="margin-left: 20px; margin-top: 15px;"><strong>IBAN: {{payment.iban}}</strong></div>
    <div style="margin-top: 15px;">Detalhe do orçamento aprovado:</div>
    <ul>
      <li>Orçamento operativo: {{payment.operativeBudgetQuota}}€</li>
      <li>Fundo de reserva: {{payment.reserveFundQuota}}€</li>
      <li><strong>Total anual: {{payment.newQuota}}€</strong></li>
    </ul>
  </div>
  <div style="margin-top: 40px;">
    <div>Ficamos à sua disposição para qualquer consulta ou esclarecimento adicional.</div>
    <div style="margin-top: 15px;">Receba um cordial cumprimento,</div>
    <div style="margin-top: 15px;"><strong>A Administração do Condomínio</strong></div>
    <div>{{building.name}}</div>
  </div>
</div>',
    ARRAY['member.name', 'member.fraction', 'member.permillage', 'assembly.number', 'assembly.date', 'assembly.agenda', 'payment.newQuota', 'payment.period', 'payment.monthlyQuota', 'payment.startDate', 'payment.dueDate', 'payment.iban', 'payment.operativeBudgetQuota', 'payment.reserveFundQuota', 'building.name', 'building.address', 'date.today', 'date.year'],
    true,
    'Lei da Propriedade Horizontal',
    'Aprovação de Orçamento Anual',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    'Convocatória para Assembleia',
    'meeting_notice',
    'Convocatória - Assembleia de Condóminos',
    '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2>CONVOCATÓRIA</h2>
    <h3>Assembleia de Condóminos</h3>
    <h3>{{building.name}}</h3>
  </div>
  <div style="margin-bottom: 20px;">
    <p>Exmo(a) Sr(a). <strong>{{member.name}}</strong></p>
    <p>Fracção: {{member.fraction}}</p>
  </div>
  <div style="margin-bottom: 30px;">
    <p>Nos termos da Lei e do Regulamento do Condomínio, convoco V. Exa. para a Assembleia {{assembly.type}} de Condóminos, a realizar-se no próximo dia <strong>{{meeting.date}}</strong>, às <strong>{{meeting.time}}</strong>, no <strong>{{meeting.location}}</strong>, com a seguinte:</p>
  </div>
  <div style="background-color: #f5f5f5; padding: 20px; margin-bottom: 30px;">
    <h4>ORDEM DE TRABALHOS:</h4>
    <ol>
      <li>Aprovação da ata da assembleia anterior</li>
      <li>Apresentação e aprovação do relatório de contas</li>
      <li>Discussão e aprovação do orçamento para o próximo exercício</li>
      <li>Eleição dos órgãos sociais</li>
      <li>Outros assuntos de interesse geral</li>
    </ol>
  </div>
  <div style="margin-bottom: 30px;">
    <p><strong>Nota Importante:</strong> Caso não se verifique quórum na hora marcada, a Assembleia reunirá em segunda convocatória, meia hora depois, com qualquer número de presentes, conforme previsto no Regulamento do Condomínio.</p>
  </div>
  <div style="margin-bottom: 30px;">
    <p>A sua presença é fundamental para as decisões que afetam o nosso condomínio.</p>
  </div>
  <div style="margin-top: 40px;">
    <p>Com os melhores cumprimentos,</p>
    <p><strong>{{building.administrator}}</strong></p>
    <p>Administração do Condomínio</p>
    <p>{{date.today}}</p>
  </div>
</div>',
    ARRAY['member.name', 'member.fraction', 'assembly.type', 'meeting.date', 'meeting.time', 'meeting.location', 'building.name', 'building.administrator', 'date.today'],
    true,
    'Código Civil - Propriedade Horizontal',
    'Convocatória para Assembleia',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Crear algunos documentos de ejemplo
INSERT INTO documents (building_id, member_id, name, original_name, file_path, file_size, mime_type, file_extension, category, description, uploaded_by, created_at, updated_at)
VALUES 
  (
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Regulamento do Condomínio',
    'regulamento_condominio_2025.pdf',
    '/documents/regulamento_condominio_2025.pdf',
    524288,
    'application/pdf',
    'pdf',
    'legal',
    'Regulamento interno do condomínio aprovado em assembleia',
    'admin@example.com',
    '2025-01-15 10:00:00',
    '2025-01-15 10:00:00'
  ),
  (
    gen_random_uuid(),
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Ata Assembleia Nº 28',
    'ata_assembleia_28_2025.pdf',
    '/documents/ata_assembleia_28_2025.pdf',
    312456,
    'application/pdf',
    'pdf',
    'minutes',
    'Ata da assembleia ordinária número 28 realizada em 10/02/2025',
    'admin@example.com',
    '2025-02-11 09:30:00',
    '2025-02-11 09:30:00'
  ),
  (
    gen_random_uuid(),
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Orçamento 2025',
    'orcamento_2025_aprovado.xlsx',
    '/documents/orcamento_2025_aprovado.xlsx',
    45678,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsx',
    'financial',
    'Orçamento aprovado para o exercício de 2025',
    'admin@example.com',
    '2025-02-10 15:00:00',
    '2025-02-10 15:00:00'
  ),
  (
    gen_random_uuid(),
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Contrato Limpeza',
    'contrato_limpeza_2025.pdf',
    '/documents/contrato_limpeza_2025.pdf',
    234567,
    'application/pdf',
    'pdf',
    'contracts',
    'Contrato com empresa de limpeza para 2025',
    'admin@example.com',
    '2025-01-05 11:00:00',
    '2025-01-05 11:00:00'
  ),
  (
    gen_random_uuid(),
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    NULL,
    'Apólice de Seguro',
    'apolice_seguro_2025.pdf',
    '/documents/apolice_seguro_2025.pdf',
    456789,
    'application/pdf',
    'pdf',
    'insurance',
    'Apólice de seguro multirriscos do condomínio',
    'admin@example.com',
    '2025-01-10 14:30:00',
    '2025-01-10 14:30:00'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Crear registros de cartas enviadas (sent_letters si existe la tabla)
-- Nota: Esta tabla podría no existir en la estructura actual
-- Si existe, descomentar las siguientes líneas:

/*
INSERT INTO sent_letters (id, building_id, member_id, template_id, subject, content, sent_date, sent_by, status, created_at, updated_at)
VALUES 
  (
    'letter-001',
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    '1dfa75cd-fafd-43cd-a0f7-038c2ad76812',
    'tpl-001-late-payment',
    'Quotas em Atraso - Março 2025',
    '[Contenido HTML de la carta generada]',
    '2025-03-15 10:00:00',
    'admin@example.com',
    'sent',
    '2025-03-15 10:00:00',
    '2025-03-15 10:00:00'
  ),
  (
    'letter-002',
    'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc',
    '6a62625e-1264-4588-b6bf-a7a8ca0771bd',
    'tpl-002-budget-approval',
    'Aprovação Orçamento 2025',
    '[Contenido HTML de la carta generada]',
    '2025-02-20 11:30:00',
    'admin@example.com',
    'sent',
    '2025-02-20 11:30:00',
    '2025-02-20 11:30:00'
  )
ON CONFLICT (id) DO NOTHING;
*/

-- 4. Verificar los datos importados
DO $$
DECLARE
  v_templates_count INTEGER;
  v_documents_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_templates_count FROM letter_templates;
  SELECT COUNT(*) INTO v_documents_count FROM documents;
  
  RAISE NOTICE '✅ Importación completada:';
  RAISE NOTICE '📄 Plantillas de cartas: %', v_templates_count;
  RAISE NOTICE '📁 Documentos: %', v_documents_count;
  RAISE NOTICE '';
  RAISE NOTICE '💡 Las plantillas de cartas están disponibles para generar comunicaciones';
  RAISE NOTICE '💡 Los documentos de ejemplo han sido creados en la base de datos';
END $$;

COMMIT;