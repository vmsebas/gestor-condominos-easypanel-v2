/**
 * Convocatória Print View - HTML/CSS Print Version
 * Uses browser native print functionality for perfect A4 layout
 */

import React from 'react';

interface AgendaItem {
  item_number: number;
  title: string;
  description?: string;
  type?: string;
}

interface ConvocatoriaPrintViewProps {
  data: {
    convocatoria_number?: string;
    assembly_type: 'ordinary' | 'extraordinary';
    building_name: string;
    building_address: string;
    meeting_date: string;
    meeting_time: string;
    first_call_time?: string;
    second_call_time?: string;
    location: string;
    agenda_items: AgendaItem[];
    sender_name?: string;
    sender_role?: string;
  };
}

const ConvocatoriaPrintView: React.FC<ConvocatoriaPrintViewProps> = ({ data }) => {
  const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  const assemblyNumber = data.convocatoria_number || '';
  const firstCallTime = data.first_call_time || data.meeting_time;

  // Calculate second call time (30 minutes after first call)
  const calculateSecondCallTime = (firstTime: string) => {
    if (!firstTime) return '19h30';

    try {
      const [hours, minutes] = firstTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + 30;
      const newHours = Math.floor(totalMinutes / 60);
      const newMinutes = totalMinutes % 60;
      return `${newHours}h${newMinutes.toString().padStart(2, '0')}`;
    } catch {
      return '19h30';
    }
  };

  const secondCallTime = data.second_call_time || calculateSecondCallTime(firstCallTime);

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

  // Extract city from address or use default
  // For "Estrada da Circunvalação, nº 1" the city is Buraca (Amadora)
  const extractCity = (address: string) => {
    if (!address) return 'Buraca';

    const knownCities = ['Buraca', 'Amadora', 'Lisboa', 'Porto', 'Sintra', 'Cascais', 'Oeiras'];
    const parts = address.split(',').map(p => p.trim());

    for (const part of parts) {
      const found = knownCities.find(city => part.toLowerCase().includes(city.toLowerCase()));
      if (found) return found;
    }

    // Default for this building
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
            page-break-inside: avoid;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            line-height: 1.25;
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

          .greeting {
            font-size: 9pt;
            margin-bottom: 4mm;
          }

          .legal-text {
            font-size: 9pt;
            margin-bottom: 4mm;
            text-align: justify;
            line-height: 1.3;
          }

          .building-address {
            font-weight: bold;
            color: #800080;
            margin-bottom: 4mm;
          }

          .meeting-info {
            margin-bottom: 5mm;
          }

          .meeting-info .date {
            font-weight: bold;
            color: #006400;
            margin-bottom: 3mm;
          }

          .meeting-info .time {
            font-weight: bold;
            color: #0000FF;
          }

          .section-title {
            text-align: center;
            font-weight: bold;
            font-style: italic;
            font-size: 10pt;
            margin: 5mm 0 3mm 0;
          }

          .agenda-items {
            margin-bottom: 4mm;
          }

          .agenda-item {
            margin-bottom: 2.5mm;
            page-break-inside: avoid;
          }

          .agenda-item-title {
            font-weight: bold;
            margin-bottom: 0.5mm;
          }

          .agenda-item-description {
            font-weight: normal;
            margin-left: 0;
            font-size: 8.5pt;
            line-height: 1.2;
          }

          .quorum-text {
            text-align: justify;
            margin-bottom: 3mm;
            font-size: 8.5pt;
            line-height: 1.3;
          }

          .alternative-date {
            font-weight: bold;
            margin-bottom: 2.5mm;
          }

          .notes {
            margin-bottom: 4mm;
          }

          .note {
            margin-bottom: 2mm;
            text-align: justify;
            font-size: 8.5pt;
            line-height: 1.3;
          }

          .signatures {
            margin-top: 4mm;
          }

          .signature-line {
            font-style: italic;
            margin-bottom: 3mm;
            font-size: 9pt;
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

          .greeting {
            margin-bottom: 5mm;
          }

          .legal-text {
            margin-bottom: 5mm;
            text-align: justify;
          }

          .building-address {
            font-weight: bold;
            color: #800080;
            margin-bottom: 5mm;
          }

          .meeting-info {
            margin-bottom: 7mm;
          }

          .meeting-info .date {
            font-weight: bold;
            color: #006400;
            margin-bottom: 4mm;
          }

          .meeting-info .time {
            font-weight: bold;
            color: #0000FF;
          }

          .section-title {
            text-align: center;
            font-weight: bold;
            font-style: italic;
            font-size: 11pt;
            margin: 6mm 0 4mm 0;
          }

          .agenda-items {
            margin-bottom: 5mm;
          }

          .agenda-item {
            margin-bottom: 3mm;
          }

          .agenda-item-title {
            font-weight: bold;
            margin-bottom: 1mm;
          }

          .quorum-text {
            text-align: justify;
            margin-bottom: 4mm;
          }

          .alternative-date {
            font-weight: bold;
            margin-bottom: 3mm;
          }

          .notes {
            margin-bottom: 6mm;
          }

          .note {
            margin-bottom: 3mm;
            text-align: justify;
          }

          .signatures {
            margin-top: 6mm;
          }

          .signature-line {
            font-style: italic;
            margin-bottom: 5mm;
          }
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <span>ADMINISTRAÇÃO DO PRÉDIO</span>
        <span>{data.building_address}</span>
      </div>

      {/* Title */}
      <div className="title">CONVOCATÓRIA</div>

      {/* Subtitle */}
      <div className="subtitle">
        {assemblyNumber}ª ASSEMBLEIA GERAL {assemblyType.toUpperCase()} DE CONDÓMINOS
      </div>

      {/* Greeting */}
      <div className="greeting">
        Exmos. Senhores Condóminos,
      </div>

      {/* Legal text */}
      <div className="legal-text">
        Conforme o disposto no artigo 1432.º do Código Civil e de acordo com as normas que regulam
        o regime da propriedade horizontal, convoca-se V. Exa. para participar na {assemblyNumber}ª Assembleia
        Geral {assemblyType} de Condóminos do prédio sito na:
      </div>

      {/* Building address */}
      <div className="building-address">
        {data.building_address}. ({data.location || 'Hall do Prédio.'})
      </div>

      {/* Meeting info */}
      <div className="meeting-info">
        <div className="date">Data: {formatDate(data.meeting_date)}</div>
        <div className="time">Hora: {firstCallTime}</div>
      </div>

      {/* Agenda */}
      <div className="section-title">ORDEM DE TRABALHOS</div>
      <div className="agenda-items">
        {data.agenda_items && data.agenda_items.length > 0 ? (
          data.agenda_items.map((item, index) => (
            <div key={item.item_number || index} className="agenda-item">
              <div className="agenda-item-title">
                {item.item_number || index + 1}. {item.title}
              </div>
              {item.description && (
                <div className="agenda-item-description">
                  {item.description}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="agenda-item">
            <div className="agenda-item-title">
              (Consultar convocatória ou administração)
            </div>
          </div>
        )}
      </div>

      {/* Quorum */}
      <div className="section-title">DISPOSIÇÕES SOBRE QUÓRUM</div>
      <div className="quorum-text">
        Caso, na data e hora designadas, não estejam presentes ou representados condóminos que,
        em conjunto, representem a maioria do valor total do prédio, ou não seja possível constituir
        o quórum mínimo previsto no n.º 4 do artigo 1432.º do Código Civil, fica desde já convocada
        uma segunda reunião da Assembleia Geral, a realizar-se em:
      </div>

      <div className="alternative-date">
        Data Alternativa: {formatDate(data.meeting_date)}
      </div>
      <div className="alternative-date">
        Hora Alternativa: {secondCallTime}
      </div>

      <div className="quorum-text">
        Nesta segunda convocatória, a assembleia deliberará com base na maioria dos votos dos condóminos
        presentes ou representados, desde que estes representem, no mínimo, um quarto do valor total do
        prédio, conforme previsto no referido artigo.
      </div>

      {/* Important notes */}
      <div className="section-title">NOTAS IMPORTANTES</div>
      <div className="notes">
        <div className="note">
          - A presente convocatória é emitida em estrita conformidade com os dispositivos do Código Civil
          (art. 1432.º e seguintes), bem como com as normas aplicáveis ao regime de propriedade horizontal
          em Portugal.
        </div>
        <div className="note">
          - A participação de todos os condóminos é fundamental para a gestão e manutenção do nosso
          patrimônio comum.
        </div>
      </div>

      {/* Signatures */}
      <div className="signatures">
        <div className="signature-line">{city}, {today}</div>
        <div className="signature-line">*Administrador, {data.sender_name || 'Vítor Rodrigues'}*</div>
        <div className="signature-line">* Secretário, João Longo*</div>
      </div>
    </div>
  );
};

export default ConvocatoriaPrintView;
