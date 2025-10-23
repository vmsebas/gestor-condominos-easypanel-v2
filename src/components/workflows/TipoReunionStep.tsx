import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, AlertCircle } from 'lucide-react';

interface TipoReunionStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const TipoReunionStep: React.FC<TipoReunionStepProps> = ({ data, onUpdate, onNext }) => {
  const handleTypeSelect = (type: 'ordinaria' | 'extraordinaria') => {
    // Map 'ordinaria' to 'ordinary' and 'extraordinaria' to 'extraordinary' for API
    const apiType = type === 'ordinaria' ? 'ordinary' : 'extraordinary';
    onUpdate({ assembly_type: apiType, meetingType: type });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tipo de Reunião</h2>
        <p className="text-muted-foreground">
          Selecione o tipo de assembleia de condóminos que vai convocar
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            data.meetingType === 'ordinaria' 
              ? 'ring-2 ring-primary shadow-glow' 
              : 'hover:ring-1 hover:ring-muted-foreground'
          }`}
          onClick={() => handleTypeSelect('ordinaria')}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Assembleia Ordinária</CardTitle>
                <CardDescription>Reunião anual obrigatória</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Requisito legal</p>
                  <p className="text-muted-foreground">
                    Deve realizar-se antes de 31 de dezembro (Art. 1430.º CC)
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Propósito:</strong> Prestação de contas, aprovação de orçamento e designação de cargos.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            data.meetingType === 'extraordinaria' 
              ? 'ring-2 ring-primary shadow-glow' 
              : 'hover:ring-1 hover:ring-muted-foreground'
          }`}
          onClick={() => handleTypeSelect('extraordinaria')}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <CardTitle className="text-xl">Assembleia Extraordinária</CardTitle>
                <CardDescription>Para assuntos específicos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Convocatória específica</p>
                  <p className="text-muted-foreground">
                    Por iniciativa do presidente ou condóminos (Art. 1431.º CC)
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Propósito:</strong> Tratar assuntos urgentes ou específicos que não podem aguardar pela assembleia ordinária.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.meetingType && (
        <div className="text-center pt-4">
          <Button 
            onClick={onNext} 
            size="lg" 
            variant="workflow"
            className="min-w-[200px]"
          >
            Continuar com {data.meetingType === 'ordinaria' ? 'Assembleia Ordinária' : 'Assembleia Extraordinária'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TipoReunionStep;