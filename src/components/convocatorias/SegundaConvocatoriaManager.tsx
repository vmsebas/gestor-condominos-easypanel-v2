import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { exportToPdfEnhanced } from '@/utils/pdfExportUtils';
import { toast } from 'sonner';
import { 
  CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Users,
  Download,
  Send
} from 'lucide-react';
import { format, addMinutes, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SegundaConvocatoriaManagerProps {
  convocatoria: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

const SegundaConvocatoriaManager: React.FC<SegundaConvocatoriaManagerProps> = ({
  convocatoria,
  onSave,
  onCancel,
}) => {
  const [enableSecondCall, setEnableSecondCall] = useState(
    convocatoria?.second_call_enabled || false
  );
  const [secondCallDate, setSecondCallDate] = useState<Date>(
    convocatoria?.second_call_date 
      ? new Date(convocatoria.second_call_date)
      : addMinutes(new Date(convocatoria?.meeting_date || new Date()), 30)
  );
  const [secondCallTime, setSecondCallTime] = useState(
    convocatoria?.second_call_time || 
    format(addMinutes(new Date(`1970-01-01T${convocatoria?.time || '10:00'}`), 30), 'HH:mm')
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleSave = () => {
    const data = {
      second_call_enabled: enableSecondCall,
      second_call_date: enableSecondCall ? format(secondCallDate, 'yyyy-MM-dd') : null,
      second_call_time: enableSecondCall ? secondCallTime : null,
    };
    
    onSave?.(data);
    toast.success('Configuração de segunda convocatória guardada!');
  };

  const handleGenerateSecondCallPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      
      const htmlContent = generateSecondCallHTML();
      
      const tempDiv = document.createElement('div');
      tempDiv.id = 'segunda-convocatoria-pdf-content';
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      document.body.appendChild(tempDiv);
      
      const fileName = `segunda-convocatoria-${convocatoria?.type}-${format(secondCallDate, 'yyyy-MM-dd')}`;
      await exportToPdfEnhanced('segunda-convocatoria-pdf-content', fileName);
      
      document.body.removeChild(tempDiv);
      
      toast.success('PDF da segunda convocatória gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateSecondCallHTML = () => {
    return `
      <div style="max-width: 800px; margin: 0 auto; background: white; padding: 40px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #dc2626; margin-bottom: 10px; font-size: 24px;">
            SEGUNDA CONVOCATÓRIA PARA ASSEMBLEIA ${convocatoria?.type?.toUpperCase() || 'GERAL'}
          </h1>
          <div style="height: 2px; background: #dc2626; margin: 20px auto; width: 300px;"></div>
          <p style="color: #991b1b; font-weight: bold; margin-top: 20px;">
            POR FALTA DE QUÓRUM NA PRIMEIRA CONVOCATÓRIA
          </p>
        </div>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 30px;">
          <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">⚠️ AVISO IMPORTANTE</h3>
          <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
            Por não ter sido possível reunir o quórum necessário na primeira convocatória, 
            convoca-se uma segunda assembleia que se realizará com qualquer número de condóminos presentes.
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Informações da Segunda Convocatória</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: bold; width: 150px;">Tipo:</td>
              <td style="padding: 10px 0;">${convocatoria?.type === 'ordinaria' ? 'Assembleia Ordinária' : 'Assembleia Extraordinária'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: bold;">Nova Data:</td>
              <td style="padding: 10px 0; color: #dc2626; font-weight: bold;">${format(secondCallDate, 'PPPP', { locale: pt })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: bold;">Nova Hora:</td>
              <td style="padding: 10px 0; color: #dc2626; font-weight: bold;">${secondCallTime}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: bold;">Local:</td>
              <td style="padding: 10px 0;">${convocatoria?.location || 'Local a confirmar'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Quórum:</td>
              <td style="padding: 10px 0; color: #059669; font-weight: bold;">Qualquer número de presenças</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Ordem do Dia</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #374151; font-style: italic;">
              A ordem do dia mantém-se igual à primeira convocatória.
            </p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
              Para consultar os pontos detalhados, veja a convocatória original.
            </p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Base Legal</h3>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border: 1px solid #7dd3fc;">
            <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
              <strong>Artigo 1430.º do Código Civil:</strong> A assembleia de condóminos funciona com a presença 
              de condóminos que representem mais de metade do valor total do prédio.
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
              <strong>Artigo 1431.º do Código Civil:</strong> Não sendo possível reunir esse quórum, 
              a assembleia pode funcionar, em segunda convocatória, com qualquer número de condóminos presentes.
            </p>
          </div>
        </div>

        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fbbf24; margin-bottom: 30px;">
          <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📋 Documentação Necessária</h4>
          <ul style="margin: 0; padding-left: 20px; color: #92400e;">
            <li>Documento de identificação</li>
            <li>Comprovativo de propriedade ou procuração</li>
            <li>Documentos relacionados com os pontos da ordem do dia</li>
          </ul>
        </div>

        <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Segunda convocatória gerada automaticamente pelo sistema Gestor Condominios
          </p>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">
            Data de geração: ${format(new Date(), 'PPP', { locale: pt })} às ${format(new Date(), 'HH:mm')}
          </p>
        </div>
      </div>
    `;
  };

  const isValidSecondCall = () => {
    if (!enableSecondCall) return true;
    
    const originalDate = new Date(convocatoria?.meeting_date || new Date());
    const originalTime = convocatoria?.time || '10:00';
    const originalDateTime = new Date(`${format(originalDate, 'yyyy-MM-dd')}T${originalTime}`);
    const secondCallDateTime = new Date(`${format(secondCallDate, 'yyyy-MM-dd')}T${secondCallTime}`);
    
    // Segunda convocatória deve ser pelo menos 30 minutos depois da primeira
    return secondCallDateTime > addMinutes(originalDateTime, 30);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span>Gestão de Segunda Convocatória</span>
          </CardTitle>
          <CardDescription>
            Configure automaticamente uma segunda convocatória caso não seja atingido o quórum necessário
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Switch para activar segunda convocatória */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">
                Activar Segunda Convocatória Automática
              </Label>
              <p className="text-sm text-muted-foreground">
                Sistema criará automaticamente uma segunda convocatória se não houver quórum
              </p>
            </div>
            <Switch
              checked={enableSecondCall}
              onCheckedChange={setEnableSecondCall}
            />
          </div>

          {enableSecondCall && (
            <>
              <Separator />
              
              {/* Data da segunda convocatória */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data da Segunda Convocatória</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !secondCallDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {secondCallDate ? format(secondCallDate, 'PPP', { locale: pt }) : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={secondCallDate}
                        onSelect={(date) => setSecondCallDate(date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="second-call-time">Hora da Segunda Convocatória</Label>
                  <Input
                    id="second-call-time"
                    type="time"
                    value={secondCallTime}
                    onChange={(e) => setSecondCallTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Validação */}
              {!isValidSecondCall() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    A segunda convocatória deve ser agendada pelo menos 30 minutos após a primeira convocatória.
                  </AlertDescription>
                </Alert>
              )}

              {/* Informações legais */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Requisitos Legais para Segunda Convocatória
                    </p>
                    <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Funciona com qualquer número de condóminos presentes</li>
                      <li>• Deve ser realizada pelo menos 30 minutos após a primeira</li>
                      <li>• Mantém a mesma ordem do dia da primeira convocatória</li>
                      <li>• Base legal: Artigo 1431.º do Código Civil Português</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Preview da segunda convocatória */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Preview da Segunda Convocatória</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Data:</span> {format(secondCallDate, 'PPP', { locale: pt })}
                  </div>
                  <div>
                    <span className="font-medium">Hora:</span> {secondCallTime}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Quórum necessário:</span> Qualquer número de presenças
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Acções */}
      <div className="flex justify-between">
        <div className="space-x-3">
          {enableSecondCall && isValidSecondCall() && (
            <Button 
              variant="outline"
              onClick={handleGenerateSecondCallPDF}
              disabled={isGeneratingPdf}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          )}
        </div>

        <div className="space-x-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={enableSecondCall && !isValidSecondCall()}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Guardar Configuração
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SegundaConvocatoriaManager;