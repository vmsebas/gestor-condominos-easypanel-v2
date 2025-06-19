import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { format, addDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

interface FechaLugarStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const FechaLugarStep: React.FC<FechaLugarStepProps> = ({ data, onUpdate, onPrevious, onNext }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const minDate = format(addDays(new Date(), 15), 'yyyy-MM-dd');
  const suggestedDate = format(addDays(new Date(), 20), 'yyyy-MM-dd');

  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {};

    if (!data.meetingDate) {
      newErrors.meetingDate = 'A data da reunião é obrigatória';
    } else if (!isAfter(new Date(data.meetingDate), addDays(new Date(), 14))) {
      newErrors.meetingDate = 'A data deve ser pelo menos 15 dias depois de hoje';
    }

    if (!data.meetingTime) {
      newErrors.meetingTime = 'A hora da reunião é obrigatória';
    }

    if (!data.meetingLocation?.trim()) {
      newErrors.meetingLocation = 'O local da reunião é obrigatório';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  const calculateDaysFromToday = () => {
    if (data.meetingDate) {
      const today = new Date();
      const meetingDate = new Date(data.meetingDate);
      const diffTime = meetingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const daysFromToday = calculateDaysFromToday();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Fecha, Hora y Lugar</h2>
        <p className="text-muted-foreground">
          Establece cuándo y dónde se celebrará la junta de propietarios
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Requisito Legal - Art. 16 LPH
              </p>
              <p className="text-amber-700 dark:text-amber-200">
                La convocatoria debe realizarse con un mínimo de 15 días naturales de antelación para primera convocatoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Fecha de la Junta</CardTitle>
            </div>
            <CardDescription>
              Selecciona la fecha de celebración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meetingDate">Fecha de reunión *</Label>
              <Input
                id="meetingDate"
                type="date"
                min={minDate}
                value={data.meetingDate || ''}
                onChange={(e) => handleInputChange('meetingDate', e.target.value)}
                className={errors.meetingDate ? 'border-red-500' : ''}
              />
              {errors.meetingDate && (
                <p className="text-sm text-red-500 mt-1">{errors.meetingDate}</p>
              )}
            </div>

            {data.meetingDate && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">
                  {format(new Date(data.meetingDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p className={`text-sm mt-1 ${
                  daysFromToday >= 15 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {daysFromToday} dias desde hoje
                  {daysFromToday >= 15 ? ' ✓ Cumpre requisito legal' : ' ⚠️ Não cumpre o mínimo de 15 dias'}
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleInputChange('meetingDate', suggestedDate)}
              className="w-full"
            >
              Sugerir data (20 dias desde hoje)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Hora de la Junta</CardTitle>
            </div>
            <CardDescription>
              Define la hora de inicio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meetingTime">Hora de inicio *</Label>
              <Input
                id="meetingTime"
                type="time"
                value={data.meetingTime || ''}
                onChange={(e) => handleInputChange('meetingTime', e.target.value)}
                className={errors.meetingTime ? 'border-red-500' : ''}
              />
              {errors.meetingTime && (
                <p className="text-sm text-red-500 mt-1">{errors.meetingTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Horarios recomendados:</p>
              <div className="grid grid-cols-2 gap-2">
                {['18:00', '19:00', '20:00', '10:00'].map(time => (
                  <Button
                    key={time}
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('meetingTime', time)}
                    className="text-xs"
                  >
                    {time}h
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Lugar de Celebración</CardTitle>
          </div>
          <CardDescription>
            Especifica dónde se realizará la reunión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="meetingLocation">Dirección del lugar *</Label>
            <Textarea
              id="meetingLocation"
              placeholder="Ej: Salón de actos del edificio, Calle Principal 123, Local bajo..."
              value={data.meetingLocation || ''}
              onChange={(e) => handleInputChange('meetingLocation', e.target.value)}
              className={errors.meetingLocation ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.meetingLocation && (
              <p className="text-sm text-red-500 mt-1">{errors.meetingLocation}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={validateAndNext} variant="workflow" size="lg">
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default FechaLugarStep;