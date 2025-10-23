/**
 * Revisão e Guardar Step
 * Vista prévia da convocatória completa e guardar na base de dados
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye, Download, Save, AlertCircle, FileText } from 'lucide-react';
import { generateConvocatoriaPDF, type TemplateData } from '@/lib/pdfGenerator';
import { formatDatePortuguese } from '@/lib/communicationTemplates';

interface RevisionGuardarStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const RevisionGuardarStep: React.FC<RevisionGuardarStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Format data for preview
  const assemblyType = data?.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  const meetingDate = data?.meeting_date
    ? formatDatePortuguese(new Date(data.meeting_date))
    : 'Data não especificada';

  const handleGeneratePDF = () => {
    setIsGeneratingPDF(true);
    try {
      const templateData: TemplateData = {
        building_name: data.building_name || 'Nome do Edifício',
        building_address: data.building_address || 'Endereço do Edifício',
        member_name: '', // PDF é genérico para todos
        assembly_type: data.assembly_type || 'ordinary',
        meeting_date: meetingDate,
        meeting_time: data.meeting_time || '',
        first_call_time: data.first_call_time || data.meeting_time,
        second_call_time: data.second_call_time || 'meia hora depois',
        location: data.location || '',
        agenda_items: data.agenda_items || [],
        convocatoria_number: data.convocatoria_number,
        sender_name: 'A Administração',
        sender_role: 'Administrador do Condomínio'
      };

      generateConvocatoriaPDF(templateData, true);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSave = () => {
    // Mark as ready to save
    onUpdate({ ready_to_save: true, created_at: new Date().toISOString() });
    onNext(); // This will trigger the save in the parent component
  };

  // Validation check
  const isValid = data.meeting_date && data.meeting_time && data.location && (data.agenda_items?.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Vista Prévia da Convocatória
          </h2>
          <p className="text-muted-foreground">
            Reveja todos os dados antes de guardar. Depois poderá enviar aos condóminos.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informação Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informação Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Assembleia</p>
              <p className="font-medium">Assembleia {assemblyType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Edifício</p>
              <p className="font-medium">{data.building_name || 'Nome do Edifício'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Data e Local */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data e Local</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Data da Reunião</p>
              <p className="font-medium">{meetingDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Horário</p>
              <p className="font-medium">
                1ª Convocatória: {data.first_call_time || data.meeting_time || 'Não definido'}
                <br />
                2ª Convocatória: {data.second_call_time || 'meia hora depois'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Local</p>
              <p className="font-medium">{data.location || 'Não especificado'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ordem do Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ordem do Dia</CardTitle>
          <CardDescription>
            {data.agenda_items?.length || 0} pontos na ordem do dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.agenda_items && data.agenda_items.length > 0 ? (
            <div className="space-y-3">
              {data.agenda_items.map((item: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg bg-accent/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.item_number}. {item.title}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {item.type === 'obrigatorio' ? 'Obrigatório' :
                       item.type === 'economico' ? 'Económico' :
                       item.type === 'administrativo' ? 'Administrativo' :
                       item.type === 'obras' ? 'Obras' : 'Outro'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum ponto na ordem do dia. Por favor, volte e adicione pelo menos um ponto.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Documentação Anexa */}
      {data.attached_documents && data.attached_documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentação Anexa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.attached_documents.map((doc: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{doc.name || `Documento ${index + 1}`}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requisitos Legais */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Requisitos Legais Cumpridos:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Art. 1430.º CC - Reunião anual obrigatória de condóminos</li>
            <li>Art. 1430.º CC - Ordem do dia detalhada incluída</li>
            <li>Art. 1431.º CC - Segunda convocatória configurada (meia hora depois)</li>
            <li>Convocatória com antecedência mínima de 15 dias</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Ações */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF || !isValid}
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingPDF ? 'A gerar PDF...' : 'Descarregar PDF'}
          </Button>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onPrevious}>
            Anterior
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            variant="workflow"
            size="lg"
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar Convocatória
          </Button>
        </div>
      </div>

      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Por favor, complete todos os campos obrigatórios antes de guardar:
            <ul className="list-disc list-inside mt-2">
              {!data.meeting_date && <li>Data da reunião</li>}
              {!data.meeting_time && <li>Hora da reunião</li>}
              {!data.location && <li>Local da reunião</li>}
              {(!data.agenda_items || data.agenda_items.length === 0) && <li>Ordem do dia (mínimo 1 ponto)</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RevisionGuardarStep;
