import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, FileText, Users, Clock, MapPin } from 'lucide-react';

interface PreparacionReunionStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  mandatory: boolean;
  checked: boolean;
}

const PreparacionReunionStep: React.FC<PreparacionReunionStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'convocatoria',
      label: 'Convocatória enviada',
      description: 'Convocatória enviada a todos os condóminos com 15-30 dias de antecedência',
      mandatory: true,
      checked: data?.preparation?.convocatoria || false
    },
    {
      id: 'order_day',
      label: 'Ordem do dia preparada',
      description: 'Ordem do dia detalhada com todos os pontos a tratar',
      mandatory: true,
      checked: data?.preparation?.order_day || false
    },
    {
      id: 'documents',
      label: 'Documentos anexos',
      description: 'Orçamentos, relatórios financeiros e outros documentos necessários',
      mandatory: true,
      checked: data?.preparation?.documents || false
    },
    {
      id: 'meeting_room',
      label: 'Sala preparada',
      description: 'Local da reunião preparado com mesas, cadeiras e projetor',
      mandatory: false,
      checked: data?.preparation?.meeting_room || false
    },
    {
      id: 'attendance_sheet',
      label: 'Folha de presenças',
      description: 'Folha de presenças impressa com lista de todos os condóminos',
      mandatory: true,
      checked: data?.preparation?.attendance_sheet || false
    },
    {
      id: 'voting_cards',
      label: 'Cartões de votação',
      description: 'Cartões preparados para votação em cada ponto da ordem do dia',
      mandatory: false,
      checked: data?.preparation?.voting_cards || false
    },
    {
      id: 'minute_book',
      label: 'Livro de actas',
      description: 'Livro de actas disponível para assinatura',
      mandatory: true,
      checked: data?.preparation?.minute_book || false
    },
    {
      id: 'statutes',
      label: 'Estatutos do condomínio',
      description: 'Cópia dos estatutos disponível para consulta',
      mandatory: false,
      checked: data?.preparation?.statutes || false
    }
  ]);

  const handleCheckChange = (itemId: string, checked: boolean) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, checked } : item
    );
    setChecklist(updatedChecklist);

    // Atualizar datos en el workflow
    const preparationData = updatedChecklist.reduce((acc, item) => {
      acc[item.id] = item.checked;
      return acc;
    }, {} as Record<string, boolean>);

    onUpdate({ preparation: preparationData });
  };

  const mandatoryItems = checklist.filter(item => item.mandatory);
  const mandatoryCompleted = mandatoryItems.filter(item => item.checked).length;
  const allMandatoryCompleted = mandatoryCompleted === mandatoryItems.length;
  const totalCompleted = checklist.filter(item => item.checked).length;
  const completionPercentage = Math.round((totalCompleted / checklist.length) * 100);

  const handleContinue = () => {
    // Guardar checklist completo antes de avanzar
    const preparationData = checklist.reduce((acc, item) => {
      acc[item.id] = item.checked;
      return acc;
    }, {} as Record<string, boolean>);

    onUpdate({
      preparation: preparationData,
      preparationCompletedAt: new Date().toISOString()
    });

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header with Minute Number */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">Preparação da Reunião</h2>
          <p className="text-muted-foreground">
            Configure a sala, documentos e material necessário para a assembleia
          </p>
        </div>
        {data?.minute_number && (
          <div className="text-right ml-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Acta #{data.minute_number}
            </Badge>
          </div>
        )}
      </div>

      {/* Informações da Reunião */}
      {(data?.meeting_date || data?.location) && (
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {data?.meeting_date && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data e Hora</p>
                    <p className="font-semibold">
                      {new Date(data.meeting_date).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                      {data?.meeting_time && ` às ${data.meeting_time}`}
                    </p>
                  </div>
                </div>
              )}
              {data?.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="font-semibold">{data.location}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progresso da Preparação</CardTitle>
            <Badge variant={allMandatoryCompleted ? "success" : "secondary"}>
              {completionPercentage}%
            </Badge>
          </div>
          <CardDescription>
            {mandatoryCompleted} de {mandatoryItems.length} itens obrigatórios completos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                allMandatoryCompleted ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist de Preparação</CardTitle>
          <CardDescription>
            Marque os itens à medida que os prepara. Os itens marcados com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border ${
                  item.checked
                    ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    : 'bg-muted/30 border-muted-foreground/20'
                }`}
              >
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={item.id}
                    className="text-base font-medium cursor-pointer flex items-center space-x-2"
                  >
                    <span>{item.label}</span>
                    {item.mandatory && (
                      <span className="text-red-500 text-lg">*</span>
                    )}
                    {item.checked && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert se faltam itens obrigatórios */}
      {!allMandatoryCompleted && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Itens Obrigatórios Pendentes</AlertTitle>
          <AlertDescription>
            Complete todos os itens obrigatórios (*) antes de prosseguir para a celebração da assembleia.
            Faltam {mandatoryItems.length - mandatoryCompleted} {mandatoryItems.length - mandatoryCompleted === 1 ? 'item' : 'itens'}.
          </AlertDescription>
        </Alert>
      )}

      {/* Alert informativo */}
      {allMandatoryCompleted && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Preparação Concluída
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Todos os itens obrigatórios foram marcados. Pode prosseguir para o controlo de presenças
            no início da assembleia.
          </AlertDescription>
        </Alert>
      )}

      {/* Requisito Legal */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Requisitos Legais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p><strong>Art. 1430.º do Código Civil:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Convocatória deve ser enviada com 15 a 30 dias de antecedência</li>
            <li>Ordem do dia deve ser detalhada e incluir todos os assuntos a tratar</li>
            <li>Documentação de suporte deve estar disponível para consulta</li>
          </ul>
          <p className="mt-3"><strong>Art. 19.º LPH:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Acta deve ser lavrada e assinada pelo Presidente e Secretário</li>
            <li>Livro de actas deve estar disponível para assinatura imediata</li>
          </ul>
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious} disabled>
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          variant="workflow"
          size="lg"
          disabled={!allMandatoryCompleted}
        >
          {allMandatoryCompleted
            ? 'Iniciar Controlo de Presenças'
            : `Faltam ${mandatoryItems.length - mandatoryCompleted} itens obrigatórios`
          }
        </Button>
      </div>
    </div>
  );
};

export default PreparacionReunionStep;
