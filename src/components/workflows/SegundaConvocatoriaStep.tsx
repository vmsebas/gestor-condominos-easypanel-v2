import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Info
} from 'lucide-react';
import { format, addMinutes, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SegundaConvocatoriaStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const SegundaConvocatoriaStep: React.FC<SegundaConvocatoriaStepProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onPrevious 
}) => {
  const [enableSecondCall, setEnableSecondCall] = useState(
    data.second_call_enabled !== undefined ? data.second_call_enabled : true
  );
  
  // Parse first meeting date and time
  const firstMeetingDate = data.meetingDate ? new Date(data.meetingDate) : new Date();
  const firstMeetingTime = data.meetingTime || '10:00';
  const firstDateTime = new Date(`${format(firstMeetingDate, 'yyyy-MM-dd')}T${firstMeetingTime}`);
  
  const [secondCallDate, setSecondCallDate] = useState<Date>(
    data.second_call_date 
      ? new Date(data.second_call_date)
      : firstMeetingDate
  );
  
  const [secondCallTime, setSecondCallTime] = useState(
    data.second_call_time || 
    format(addMinutes(firstDateTime, 30), 'HH:mm')
  );

  const handleEnableToggle = (enabled: boolean) => {
    setEnableSecondCall(enabled);
    onUpdate({
      second_call_enabled: enabled,
      second_call_date: enabled ? format(secondCallDate, 'yyyy-MM-dd') : null,
      second_call_time: enabled ? secondCallTime : null,
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSecondCallDate(date);
      onUpdate({
        second_call_enabled: enableSecondCall,
        second_call_date: format(date, 'yyyy-MM-dd'),
        second_call_time: secondCallTime,
      });
    }
  };

  const handleTimeChange = (time: string) => {
    setSecondCallTime(time);
    onUpdate({
      second_call_enabled: enableSecondCall,
      second_call_date: format(secondCallDate, 'yyyy-MM-dd'),
      second_call_time: time,
    });
  };

  const validateSecondCall = () => {
    if (!enableSecondCall) return { isValid: true, message: '' };
    
    const secondDateTime = new Date(`${format(secondCallDate, 'yyyy-MM-dd')}T${secondCallTime}`);
    const timeDiff = secondDateTime.getTime() - firstDateTime.getTime();
    const minDiff = timeDiff / (1000 * 60); // minutes
    
    if (secondDateTime <= firstDateTime) {
      return { 
        isValid: false, 
        message: 'A segunda convocatória deve ser posterior à primeira' 
      };
    }
    
    if (isSameDay(firstDateTime, secondDateTime) && minDiff < 30) {
      return { 
        isValid: false, 
        message: 'Deve haver pelo menos 30 minutos entre as convocatórias' 
      };
    }
    
    return { isValid: true, message: '' };
  };

  const validation = validateSecondCall();

  const handleNext = () => {
    if (enableSecondCall && !validation.isValid) {
      return;
    }
    
    onUpdate({
      second_call_enabled: enableSecondCall,
      second_call_date: enableSecondCall ? format(secondCallDate, 'yyyy-MM-dd') : null,
      second_call_time: enableSecondCall ? secondCallTime : null,
    });
    
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Segunda Convocatória</h2>
        <p className="text-muted-foreground">
          Configure uma segunda convocatória caso não seja atingido o quórum necessário
        </p>
      </div>

      {/* Legal Info */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Artigo 1431.º do Código Civil Português
              </p>
              <p className="text-blue-700 dark:text-blue-200 mt-1">
                Se não for possível reunir o quórum necessário (mais de 50% do valor total do prédio), 
                a assembleia pode funcionar em segunda convocatória com qualquer número de condóminos presentes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração</CardTitle>
          <CardDescription>
            Defina se deseja incluir uma segunda convocatória automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">
                Incluir Segunda Convocatória
              </Label>
              <p className="text-sm text-muted-foreground">
                Permitir assembleia com qualquer número de presenças se não houver quórum
              </p>
            </div>
            <Switch
              checked={enableSecondCall}
              onCheckedChange={handleEnableToggle}
            />
          </div>

          {enableSecondCall && (
            <>
              <div className="space-y-4">
                {/* First Meeting Summary */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Primeira Convocatória</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Data:</span> {format(firstMeetingDate, 'PPP', { locale: pt })}
                    </div>
                    <div>
                      <span className="font-medium">Hora:</span> {firstMeetingTime}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Quórum necessário:</span> Mais de 50% do valor total do prédio
                    </div>
                  </div>
                </div>

                {/* Second Call Configuration */}
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
                          onSelect={handleDateChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
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
                      onChange={(e) => handleTimeChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Validation Alert */}
                {!validation.isValid && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {validation.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Legal Requirements */}
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Requisitos para Segunda Convocatória
                      </p>
                      <ul className="text-green-800 dark:text-green-200 space-y-1">
                        <li>• Funciona com qualquer número de condóminos presentes</li>
                        <li>• Deve ser pelo menos 30 minutos após a primeira (mesmo dia)</li>
                        <li>• Pode ser noutro dia se preferir</li>
                        <li>• Mantém a mesma ordem do dia</li>
                        <li>• Decisões tomadas com os presentes são válidas</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {validation.isValid && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Resumo da Segunda Convocatória
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Data:</span> {format(secondCallDate, 'PPP', { locale: pt })}
                      </div>
                      <div>
                        <span className="font-medium">Hora:</span> {secondCallTime}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Quórum:</span> Qualquer número de presenças
                      </div>
                      <div className="col-span-2">
                        <Badge variant="success" className="w-fit">
                          Configuração válida
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button 
          onClick={handleNext} 
          variant="workflow" 
          size="lg"
          disabled={enableSecondCall && !validation.isValid}
        >
          Continuar
          {enableSecondCall && (
            <Badge variant="secondary" className="ml-2">
              2ª Convocatória Incluída
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SegundaConvocatoriaStep;