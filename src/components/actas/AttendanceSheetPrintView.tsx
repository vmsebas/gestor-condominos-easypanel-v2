/**
 * Attendance Sheet Print View - HTML/CSS Print Version
 * Folha de Presenças para impressão em A4
 * Legal compliance: Código Civil Art. 1431º, LPH Art. 16º-17º
 */

import React from 'react';

interface Attendee {
  member_name: string;
  member_id: string;
  fraction?: string;
  apartment?: string;
  permilage: number;
  attendance_type: 'present' | 'represented' | 'absent';
  representative_name?: string;
  signature?: string; // Base64 PNG from SignaturePad
  arrival_time?: string;
}

interface AttendanceSheetPrintViewProps {
  data: {
    building_name: string;
    building_address: string;
    meeting_date: string;
    meeting_time: string;
    assembly_type: 'ordinary' | 'extraordinary';
    assembly_number?: string;
    minute_number?: string;
    attendees: Attendee[];
    total_members: number;
    present_members: number;
    represented_members: number;
    total_permilage_present: number;
    quorum_percentage: number;
  };
}

const AttendanceSheetPrintView: React.FC<AttendanceSheetPrintViewProps> = ({ data }) => {
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
            max-width: none;
          }

          .no-print {
            display: none !important;
          }

          .page-break {
            page-break-before: always;
          }
        }

        .print-container {
          font-family: 'Times New Roman', serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000;
          background: #fff;
          max-width: 210mm;
          margin: 0 auto;
          padding: 15mm;
        }

        .header {
          text-align: center;
          margin-bottom: 8mm;
          border-bottom: 1pt solid #000;
          padding-bottom: 4mm;
        }

        .header h1 {
          font-size: 14pt;
          font-weight: bold;
          margin: 0 0 2mm 0;
          text-transform: uppercase;
        }

        .header h2 {
          font-size: 11pt;
          font-weight: normal;
          margin: 0 0 1mm 0;
        }

        .header .subtitle {
          font-size: 9pt;
          margin: 1mm 0 0 0;
          color: #333;
        }

        .info-section {
          margin-bottom: 5mm;
          font-size: 9pt;
        }

        .info-row {
          display: flex;
          margin-bottom: 1.5mm;
        }

        .info-label {
          font-weight: bold;
          min-width: 35mm;
        }

        .attendance-table {
          width: 100%;
          border-collapse: collapse;
          margin: 5mm 0;
          font-size: 8.5pt;
        }

        .attendance-table th {
          background: #f0f0f0;
          border: 0.5pt solid #000;
          padding: 2mm;
          text-align: left;
          font-weight: bold;
          font-size: 8pt;
        }

        .attendance-table td {
          border: 0.5pt solid #666;
          padding: 2mm;
          vertical-align: top;
        }

        .attendance-table tr:nth-child(even) {
          background: #fafafa;
        }

        .signature-cell {
          text-align: center;
          min-height: 15mm;
        }

        .signature-img {
          max-width: 40mm;
          max-height: 12mm;
          border: 0.5pt solid #ccc;
          padding: 0.5mm;
          background: #fff;
        }

        .status-badge {
          display: inline-block;
          padding: 1mm 2mm;
          border-radius: 1mm;
          font-size: 7pt;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-present {
          background: #d4edda;
          color: #155724;
        }

        .status-represented {
          background: #d1ecf1;
          color: #0c5460;
        }

        .status-absent {
          background: #f8d7da;
          color: #721c24;
        }

        .quorum-section {
          margin: 5mm 0;
          padding: 3mm;
          border: 1pt solid #000;
          background: #f9f9f9;
        }

        .quorum-section h3 {
          margin: 0 0 2mm 0;
          font-size: 10pt;
          font-weight: bold;
        }

        .quorum-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2mm;
          font-size: 8.5pt;
        }

        .quorum-stat {
          padding: 2mm;
          background: #fff;
          border: 0.5pt solid #ccc;
        }

        .quorum-stat strong {
          font-size: 12pt;
          color: #2c5282;
        }

        .legal-footer {
          margin-top: 8mm;
          padding-top: 3mm;
          border-top: 0.5pt solid #666;
          font-size: 7pt;
          text-align: center;
          color: #666;
        }

        .signatures-section {
          margin-top: 10mm;
          padding-top: 3mm;
        }

        .signature-line {
          display: inline-block;
          width: 48%;
          margin: 0 1%;
          text-align: center;
        }

        .signature-space {
          min-height: 20mm;
          padding-top: 2mm;
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <h1>Folha de Presenças</h1>
        <h2>Assembleia {assemblyType} de Condóminos</h2>
        <div className="subtitle">{data.building_name}</div>
        {(data.minute_number || data.assembly_number) && (
          <div className="subtitle">
            Acta/Convocatória nº {data.minute_number || data.assembly_number}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="info-section">
        <div className="info-row">
          <span className="info-label">Edifício:</span>
          <span>{data.building_name}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Morada:</span>
          <span>{data.building_address}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Data da Reunião:</span>
          <span>{formatDate(data.meeting_date)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Hora:</span>
          <span>{data.meeting_time}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Tipo:</span>
          <span>Assembleia {assemblyType}</span>
        </div>
      </div>

      {/* Quorum Summary */}
      <div className="quorum-section">
        <h3>Resumo de Quórum</h3>
        <div className="quorum-stats">
          <div className="quorum-stat">
            <div>Total de Condóminos:</div>
            <strong>{data.total_members}</strong>
          </div>
          <div className="quorum-stat">
            <div>Presentes:</div>
            <strong>{data.present_members}</strong>
          </div>
          <div className="quorum-stat">
            <div>Representados:</div>
            <strong>{data.represented_members}</strong>
          </div>
          <div className="quorum-stat">
            <div>Quórum (Permilagem):</div>
            <strong>{data.quorum_percentage.toFixed(2)}%</strong>
            <div style={{ fontSize: '7pt', marginTop: '1mm' }}>
              ({data.total_permilage_present.toFixed(2)}‰)
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <table className="attendance-table">
        <thead>
          <tr>
            <th style={{ width: '8%' }}>Nº</th>
            <th style={{ width: '25%' }}>Nome do Condómino</th>
            <th style={{ width: '8%' }}>Fração</th>
            <th style={{ width: '10%' }}>Permilagem</th>
            <th style={{ width: '12%' }}>Situação</th>
            <th style={{ width: '17%' }}>Representante</th>
            <th style={{ width: '20%' }}>Assinatura</th>
          </tr>
        </thead>
        <tbody>
          {data.attendees.map((attendee, index) => {
            let statusClass = 'status-absent';
            let statusLabel = 'Ausente';

            if (attendee.attendance_type === 'present') {
              statusClass = 'status-present';
              statusLabel = 'Presente';
            } else if (attendee.attendance_type === 'represented') {
              statusClass = 'status-represented';
              statusLabel = 'Representado';
            }

            return (
              <tr key={attendee.member_id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>
                  <strong>{attendee.member_name}</strong>
                  {attendee.apartment && (
                    <div style={{ fontSize: '7pt', color: '#666' }}>
                      Apart. {attendee.apartment}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>{attendee.fraction || '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  {attendee.permilage ? `${attendee.permilage.toFixed(2)}‰` : '-'}
                </td>
                <td>
                  <span className={`status-badge ${statusClass}`}>
                    {statusLabel}
                  </span>
                  {attendee.arrival_time && (
                    <div style={{ fontSize: '7pt', marginTop: '1mm', color: '#666' }}>
                      Chegada: {attendee.arrival_time}
                    </div>
                  )}
                </td>
                <td>
                  {attendee.representative_name || '-'}
                </td>
                <td className="signature-cell">
                  {attendee.signature ? (
                    <img
                      src={attendee.signature}
                      alt={`Assinatura ${attendee.member_name}`}
                      className="signature-img"
                    />
                  ) : (
                    attendee.attendance_type !== 'absent' && (
                      <div style={{ borderBottom: '0.5pt solid #ccc', width: '80%', margin: '5mm auto' }} />
                    )
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legal Requirements */}
      <div style={{ marginTop: '5mm', padding: '3mm', background: '#f0f0f0', border: '0.5pt solid #999', fontSize: '7.5pt' }}>
        <strong>Nota Legal:</strong> Conforme o disposto no Código Civil Português (Art. 1431.º, n.º 3), qualquer condómino
        pode fazer-se representar na assembleia por outro condómino, seu cônjuge, ou pessoa estranha ao condomínio, mediante
        procuração escrita. A folha de presenças constitui prova legal da participação e quórum da assembleia (LPH Art. 16.º-17.º).
      </div>

      {/* Signatures */}
      <div className="signatures-section">
        <div style={{ marginBottom: '3mm', fontSize: '8.5pt', textAlign: 'center' }}>
          {city}, {today}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="signature-line">
            <div className="signature-space">
              <strong>O Presidente da Mesa</strong><br />
              <div style={{ marginTop: '15mm', borderTop: '0.5pt solid #000', width: '60%', margin: '15mm auto 0' }} />
            </div>
          </div>
          <div className="signature-line">
            <div className="signature-space">
              <strong>O Secretário da Mesa</strong><br />
              <div style={{ marginTop: '15mm', borderTop: '0.5pt solid #000', width: '60%', margin: '15mm auto 0' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="legal-footer">
        Folha de Presenças lavrada em conformidade com o Código Civil Português (Art. 1431.º)
        e a Lei da Propriedade Horizontal (Decreto-Lei n.º 267/94, Art. 16.º-17.º).
        Documento válido para todos os efeitos legais.
      </div>
    </div>
  );
};

export default AttendanceSheetPrintView;
