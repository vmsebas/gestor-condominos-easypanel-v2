/**
 * Acta Print View - HTML/CSS Print Version
 * Uses browser native print functionality for perfect A4 layout
 * Legal compliance: LPH Art. 16-20, Código Civil Art. 1430º-1431º
 */

import React from 'react';

interface AgendaItem {
  item_number: number;
  title: string;
  description?: string;
  type?: string;
  discussion?: string;
  decision?: string;
  votes_in_favor?: number;
  votes_against?: number;
  abstentions?: number;
  requiredMajority?: string;
  voters_in_favor?: string[];
  voters_against?: string[];
  voters_abstained?: string[];
}

interface Attendee {
  member_name: string;
  apartment?: string;
  fraction?: string;
  attendance_type: 'present' | 'represented' | 'absent';
  representative_name?: string;
  permilage?: number;
  votes?: number;
}

interface ActaPrintViewProps {
  data: {
    minute_number: string;
    assembly_type: 'ordinary' | 'extraordinary';
    building_name: string;
    building_address: string;
    meeting_date: string;
    meeting_time: string;
    location: string;
    president_name?: string;
    secretary_name?: string;
    president_signature?: string; // Base64 PNG from SignaturePad
    secretary_signature?: string; // Base64 PNG from SignaturePad
    agenda_items: AgendaItem[];
    notes?: string;
    attendees?: Attendee[];
    quorum_info?: {
      total_members: number;
      present_members: number;
      represented_members: number;
      quorum_percentage: number;
      total_permilage_present: number;
    };
  };
}

const ActaPrintView: React.FC<ActaPrintViewProps> = ({ data }) => {
  const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Data não definida';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const today = formatDate(new Date().toISOString());

  // Extract city from address
  const extractCity = (address: string) => {
    if (!address) return 'Buraca';
    const knownCities = ['Buraca', 'Amadora', 'Lisboa', 'Porto', 'Sintra', 'Cascais', 'Oeiras'];
    const parts = address.split(',').map(p => p.trim());
    for (const part of parts) {
      const found = knownCities.find(city => part.toLowerCase().includes(city.toLowerCase()));
      if (found) return found;
    }
    return 'Buraca';
  };

  const city = extractCity(data.building_address);

  return (
    <div className="print-container">
      <style>{`
        @page {
          size: A4;
          margin: 15mm;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .print-container {
            width: 100%;
            height: 100%;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            line-height: 1.3;
            color: #000;
          }

          .no-print {
            display: none !important;
          }

          .header {
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            font-weight: bold;
            margin-bottom: 8mm;
          }

          .title {
            text-align: center;
            color: #0000FF;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 4mm;
          }

          .subtitle {
            text-align: center;
            color: #0000FF;
            font-size: 11pt;
            font-weight: bold;
            font-style: italic;
            margin-bottom: 6mm;
          }

          .section {
            margin-bottom: 4mm;
          }

          .section-title {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 2mm;
            border-bottom: 1px solid #333;
            padding-bottom: 1mm;
          }

          .meeting-info {
            margin-bottom: 4mm;
            font-size: 9pt;
          }

          .info-row {
            display: flex;
            margin-bottom: 1.5mm;
          }

          .info-label {
            font-weight: bold;
            min-width: 80px;
          }

          .quorum-section {
            background-color: #f0f0f0;
            padding: 3mm;
            margin-bottom: 4mm;
            border-left: 3px solid #0000FF;
          }

          .quorum-title {
            font-weight: bold;
            margin-bottom: 2mm;
          }

          .agenda-items {
            margin-bottom: 4mm;
          }

          .agenda-item {
            margin-bottom: 4mm;
            page-break-inside: avoid;
            border: 1px solid #ddd;
            padding: 3mm;
          }

          .agenda-item-header {
            font-weight: bold;
            margin-bottom: 2mm;
            font-size: 9.5pt;
          }

          .agenda-item-description {
            margin-bottom: 2mm;
            font-size: 8.5pt;
            text-align: justify;
          }

          .discussion {
            background-color: #f9f9f9;
            padding: 2mm;
            margin: 2mm 0;
            font-size: 8.5pt;
            font-style: italic;
          }

          .voting-results {
            display: flex;
            justify-content: space-around;
            margin: 2mm 0;
            padding: 2mm;
            background-color: #f5f5f5;
            border-radius: 2mm;
          }

          .vote-count {
            text-align: center;
            font-size: 8.5pt;
          }

          .vote-label {
            font-weight: bold;
            display: block;
            margin-bottom: 1mm;
          }

          .decision {
            font-weight: bold;
            margin-top: 2mm;
            padding: 2mm;
            border-radius: 2mm;
          }

          .decision.approved {
            background-color: #d4edda;
            color: #155724;
          }

          .decision.rejected {
            background-color: #f8d7da;
            color: #721c24;
          }

          .notes-section {
            margin: 4mm 0;
            padding: 3mm;
            background-color: #fffdf0;
            border-left: 3px solid #ffc107;
          }

          .signatures {
            margin-top: 8mm;
            page-break-inside: avoid;
          }

          .signature-block {
            display: flex;
            justify-content: space-between;
            margin-top: 15mm;
          }

          .signature-line {
            text-align: center;
            width: 45%;
          }

          .signature-space {
            border-top: 1px solid #000;
            margin-top: 10mm;
            padding-top: 2mm;
            font-size: 8.5pt;
          }

          .legal-footer {
            margin-top: 6mm;
            font-size: 7.5pt;
            text-align: justify;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 3mm;
          }

          .attendees-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
            font-size: 8pt;
          }

          .attendees-table thead {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .attendees-table th,
          .attendees-table td {
            border: 1px solid #ddd;
            padding: 2mm;
            text-align: left;
          }

          .attendees-table th {
            font-size: 8.5pt;
          }

          .attendees-table .attendance-status {
            text-align: center;
          }

          .attendance-badge {
            display: inline-block;
            padding: 1mm 2mm;
            border-radius: 2mm;
            font-size: 7.5pt;
            font-weight: bold;
          }

          .attendance-badge.present {
            background-color: #d4edda;
            color: #155724;
          }

          .attendance-badge.represented {
            background-color: #d1ecf1;
            color: #0c5460;
          }

          .attendance-badge.absent {
            background-color: #f8d7da;
            color: #721c24;
          }

          .voters-detail {
            margin-top: 2mm;
            padding: 2mm;
            background-color: #f9f9f9;
            border-radius: 2mm;
            font-size: 7.5pt;
            line-height: 1.4;
          }

          .voters-detail-title {
            font-weight: bold;
            margin-bottom: 1mm;
            font-size: 8pt;
          }

          .voters-list {
            margin-left: 3mm;
          }

          .voter-name {
            display: inline;
          }
        }

        /* Screen preview styles */
        @media screen {
          .print-container {
            max-width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            padding: 15mm;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            line-height: 1.3;
          }

          .header {
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            font-weight: bold;
            margin-bottom: 10mm;
          }

          .title {
            text-align: center;
            color: #0000FF;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5mm;
          }

          .subtitle {
            text-align: center;
            color: #0000FF;
            font-size: 12pt;
            font-weight: bold;
            font-style: italic;
            margin-bottom: 8mm;
          }

          .section {
            margin-bottom: 5mm;
          }

          .section-title {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 3mm;
            border-bottom: 1px solid #333;
            padding-bottom: 1mm;
          }

          .agenda-item {
            margin-bottom: 5mm;
            border: 1px solid #ddd;
            padding: 4mm;
          }

          .signatures {
            margin-top: 10mm;
          }

          .signature-block {
            display: flex;
            justify-content: space-between;
            margin-top: 20mm;
          }
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <span>ACTA DA ASSEMBLEIA GERAL</span>
        <span>{data.building_address}</span>
      </div>

      {/* Title */}
      <div className="title">ACTA Nº {data.minute_number}</div>

      {/* Subtitle */}
      <div className="subtitle">
        ASSEMBLEIA GERAL {assemblyType.toUpperCase()} DE CONDÓMINOS
      </div>

      {/* Meeting Information */}
      <div className="section meeting-info">
        <div className="info-row">
          <span className="info-label">Data:</span>
          <span>{formatDate(data.meeting_date)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Hora:</span>
          <span>{data.meeting_time}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Local:</span>
          <span>{data.location}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Prédio:</span>
          <span>{data.building_name} - {data.building_address}</span>
        </div>
      </div>

      {/* Quorum Information */}
      {data.quorum_info && (
        <div className="quorum-section">
          <div className="quorum-title">VERIFICAÇÃO DE QUÓRUM</div>
          <div className="info-row">
            <span className="info-label">Total de condóminos:</span>
            <span>{data.quorum_info.total_members}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Presentes:</span>
            <span>{data.quorum_info.present_members}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Representados:</span>
            <span>{data.quorum_info.represented_members}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Quórum alcançado:</span>
            <span>{data.quorum_info.quorum_percentage.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Mesa */}
      <div className="section">
        <div className="section-title">MESA DA ASSEMBLEIA</div>
        <div className="info-row">
          <span className="info-label">Presidente:</span>
          <span>{data.president_name || 'Não designado'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Secretário:</span>
          <span>{data.secretary_name || 'Não designado'}</span>
        </div>
      </div>

      {/* Lista de Presenças */}
      {data.attendees && data.attendees.length > 0 && (
        <div className="section">
          <div className="section-title">LISTA DE PRESENÇAS</div>
          <table className="attendees-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>Nº</th>
                <th style={{ width: '30%' }}>Nome do Condómino</th>
                <th style={{ width: '15%' }}>Fração</th>
                <th style={{ width: '12%' }}>Permilagem</th>
                <th style={{ width: '13%' }}>Situação</th>
                <th style={{ width: '25%' }}>Representante</th>
              </tr>
            </thead>
            <tbody>
              {data.attendees.map((attendee, index) => {
                const statusLabel = {
                  'present': 'Presente',
                  'represented': 'Representado',
                  'absent': 'Ausente'
                }[attendee.attendance_type];

                return (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>{attendee.member_name}</td>
                    <td>{attendee.fraction || attendee.apartment || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{attendee.permilage?.toFixed(2) || '-'}‰</td>
                    <td className="attendance-status">
                      <span className={`attendance-badge ${attendee.attendance_type}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ fontSize: '7.5pt' }}>
                      {attendee.representative_name || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                <td colSpan={2}>TOTAL</td>
                <td style={{ textAlign: 'center' }}>
                  {data.attendees.length} condóminos
                </td>
                <td style={{ textAlign: 'center' }}>
                  {data.attendees
                    .filter(a => a.attendance_type !== 'absent')
                    .reduce((sum, a) => sum + (a.permilage || 0), 0)
                    .toFixed(2)}‰
                </td>
                <td colSpan={2} style={{ textAlign: 'center' }}>
                  Presentes: {data.attendees.filter(a => a.attendance_type === 'present').length} |
                  Representados: {data.attendees.filter(a => a.attendance_type === 'represented').length} |
                  Ausentes: {data.attendees.filter(a => a.attendance_type === 'absent').length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Agenda and Deliberations */}
      <div className="section">
        <div className="section-title">ORDEM DE TRABALHOS E DELIBERAÇÕES</div>
        <div className="agenda-items">
          {data.agenda_items && data.agenda_items.length > 0 ? (
            data.agenda_items.map((item, index) => {
              const hasVotes = (item.votes_in_favor || 0) + (item.votes_against || 0) + (item.abstentions || 0) > 0;

              return (
                <div key={item.item_number || index} className="agenda-item">
                  <div className="agenda-item-header">
                    {item.item_number}. {item.title}
                  </div>

                  {item.description && (
                    <div className="agenda-item-description">
                      {item.description}
                    </div>
                  )}

                  {item.discussion && (
                    <div className="discussion">
                      <strong>Discussão:</strong> {item.discussion}
                    </div>
                  )}

                  {hasVotes && (
                    <>
                      <div className="voting-results">
                        <div className="vote-count">
                          <span className="vote-label">A Favor</span>
                          {item.votes_in_favor || 0}
                        </div>
                        <div className="vote-count">
                          <span className="vote-label">Contra</span>
                          {item.votes_against || 0}
                        </div>
                        <div className="vote-count">
                          <span className="vote-label">Abstenções</span>
                          {item.abstentions || 0}
                        </div>
                      </div>

                      {/* Detailed list of voters */}
                      {(item.voters_in_favor?.length || item.voters_against?.length || item.voters_abstained?.length) && (
                        <div className="voters-detail">
                          <div className="voters-detail-title">Detalhamento da Votação:</div>

                          {item.voters_in_favor && item.voters_in_favor.length > 0 && (
                            <div className="voters-list">
                              <strong>Votaram A FAVOR:</strong> {item.voters_in_favor.join(', ')}
                            </div>
                          )}

                          {item.voters_against && item.voters_against.length > 0 && (
                            <div className="voters-list">
                              <strong>Votaram CONTRA:</strong> {item.voters_against.join(', ')}
                            </div>
                          )}

                          {item.voters_abstained && item.voters_abstained.length > 0 && (
                            <div className="voters-list">
                              <strong>ABSTENÇÕES:</strong> {item.voters_abstained.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {item.decision && (
                    <div className={`decision ${item.decision.includes('APROVADO') ? 'approved' : item.decision.includes('REJEITADO') ? 'rejected' : ''}`}>
                      <strong>Deliberação:</strong> {item.decision}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="agenda-item">
              <div className="agenda-item-description">
                Não foram registados pontos da ordem de trabalhos.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="notes-section">
          <div className="section-title">OBSERVAÇÕES</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '8.5pt' }}>
            {data.notes}
          </div>
        </div>
      )}

      {/* Encerramento */}
      <div className="section">
        <p style={{ textAlign: 'justify', fontSize: '8.5pt' }}>
          Nada mais havendo a tratar, o Presidente da Mesa declarou encerrada a reunião, da qual se
          lavrou a presente Acta que, depois de lida e aprovada, vai ser assinada pelo Presidente e
          pelo Secretário da Mesa.
        </p>
      </div>

      {/* Signatures */}
      <div className="signatures">
        <div style={{ marginBottom: '3mm', fontSize: '8.5pt' }}>
          {city}, {today}
        </div>

        <div className="signature-block">
          <div className="signature-line">
            <div className="signature-space">
              <strong>O Presidente da Mesa</strong><br />
              {data.president_signature ? (
                <div style={{ marginTop: '3mm', marginBottom: '2mm' }}>
                  <img
                    src={data.president_signature}
                    alt="Assinatura do Presidente"
                    style={{
                      maxWidth: '60mm',
                      maxHeight: '20mm',
                      border: '0.5pt solid #ccc',
                      padding: '1mm',
                      background: '#fff'
                    }}
                  />
                </div>
              ) : null}
              <span style={{ fontSize: '8.5pt' }}>
                {data.president_name || '_______________________'}
              </span>
            </div>
          </div>
          <div className="signature-line">
            <div className="signature-space">
              <strong>O Secretário da Mesa</strong><br />
              {data.secretary_signature ? (
                <div style={{ marginTop: '3mm', marginBottom: '2mm' }}>
                  <img
                    src={data.secretary_signature}
                    alt="Assinatura do Secretário"
                    style={{
                      maxWidth: '60mm',
                      maxHeight: '20mm',
                      border: '0.5pt solid #ccc',
                      padding: '1mm',
                      background: '#fff'
                    }}
                  />
                </div>
              ) : null}
              <span style={{ fontSize: '8.5pt' }}>
                {data.secretary_name || '_______________________'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="legal-footer">
        Acta lavrada em conformidade com o disposto no Código Civil Português (Art. 1430.º e seguintes)
        e na Lei da Propriedade Horizontal (Decreto-Lei n.º 267/94, Art. 16.º a 20.º). Documento válido
        para todos os efeitos legais.
      </div>
    </div>
  );
};

export default ActaPrintView;
