import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Truck, Phone, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';

interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  legalValidity: 'high' | 'medium' | 'low';
  cost: 'free' | 'low' | 'medium' | 'high';
  deliveryTime: string;
  trackable: boolean;
  features: string[];
  recommended?: boolean;
}

interface MetodoEnvioStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const MetodoEnvioStep: React.FC<MetodoEnvioStepProps> = ({ data, onUpdate, onPrevious, onNext }) => {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(data.deliveryMethods || []);

  const deliveryMethods: DeliveryMethod[] = [
    {
      id: 'burofax',
      name: 'Burofax',
      description: 'Certificado oficial com validade legal plena',
      icon: <Mail className="h-6 w-6" />,
      legalValidity: 'high',
      cost: 'medium',
      deliveryTime: '1-2 dias úteis',
      trackable: true,
      features: ['Validade legal plena', 'Certificado de entrega', 'Conteúdo verificado', 'Data e hora exata'],
      recommended: true
    },
    {
      id: 'correo_certificado',
      name: 'Correio Certificado',
      description: 'Envio postal com aviso de receção',
      icon: <Truck className="h-6 w-6" />,
      legalValidity: 'high',
      cost: 'low',
      deliveryTime: '2-3 dias úteis',
      trackable: true,
      features: ['Aviso de receção', 'Seguimento postal', 'Baixo custo', 'Ampla cobertura']
    },
    {
      id: 'email_certificado',
      name: 'Email Certificado',
      description: 'Correio eletrónico com certificação digital',
      icon: <Mail className="h-6 w-6" />,
      legalValidity: 'medium',
      cost: 'low',
      deliveryTime: 'Imediato',
      trackable: true,
      features: ['Entrega imediata', 'Certificado digital', 'Ecológico', 'Baixo custo']
    },
    {
      id: 'sms_certificado',
      name: 'SMS Certificado',
      description: 'Mensagem de texto com validade legal',
      icon: <MessageSquare className="h-6 w-6" />,
      legalValidity: 'medium',
      cost: 'low',
      deliveryTime: 'Imediato',
      trackable: true,
      features: ['Entrega imediata', 'Alto índice de leitura', 'Certificado de entrega', 'Económico']
    },
    {
      id: 'notificacion_app',
      name: 'Notificação App',
      description: 'Notificação push na aplicação móvel',
      icon: <Smartphone className="h-6 w-6" />,
      legalValidity: 'low',
      cost: 'free',
      deliveryTime: 'Imediato',
      trackable: true,
      features: ['Gratuito', 'Imediato', 'Interativo', 'Confirmação de leitura']
    },
    {
      id: 'llamada_telefonica',
      name: 'Chamada Telefónica',
      description: 'Notificação telefónica pessoal',
      icon: <Phone className="h-6 w-6" />,
      legalValidity: 'low',
      cost: 'low',
      deliveryTime: 'Imediato',
      trackable: false,
      features: ['Contacto direto', 'Confirmação imediata', 'Pessoal', 'Esclarecimento de dúvidas']
    }
  ];

  const handleMethodToggle = (methodId: string) => {
    const updated = selectedMethods.includes(methodId)
      ? selectedMethods.filter(id => id !== methodId)
      : [...selectedMethods, methodId];
    
    setSelectedMethods(updated);
    onUpdate({ deliveryMethods: updated });
  };

  const validateAndNext = () => {
    if (selectedMethods.length === 0) {
      alert('Deve selecionar pelo menos um método de envio');
      return;
    }
    
    // Update data before proceeding
    onUpdate({ deliveryMethods: selectedMethods });
    onNext();
  };

  const getLegalityColor = (validity: string) => {
    switch (validity) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'free': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const selectedMethodsCount = selectedMethods.length;
  const hasHighValidityMethod = selectedMethods.some(id => 
    deliveryMethods.find(m => m.id === id)?.legalValidity === 'high'
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Método de Envio</h2>
        <p className="text-muted-foreground">
          Selecione como notificar a convocatória aos proprietários
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Requisito Legal - Art. 1430.º CC
              </p>
              <p className="text-amber-700 dark:text-amber-200">
                A notificação deve ser realizada por um método que garanta a receção efetiva pelo proprietário.
                Recomenda-se combinar pelo menos um método de alta validade legal com outros métodos para maior eficácia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de selección */}
      {selectedMethodsCount > 0 && (
        <Card className={`border-2 ${hasHighValidityMethod ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {hasHighValidityMethod ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                )}
                <div>
                  <p className="font-medium">
                    {selectedMethodsCount} método{selectedMethodsCount > 1 ? 's' : ''} selecionado{selectedMethodsCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasHighValidityMethod 
                      ? 'Cumpre os requisitos legais de notificação' 
                      : 'Recomendamos adicionar um método de alta validade legal'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={hasHighValidityMethod ? 'success' : 'warning'}>
                {hasHighValidityMethod ? 'Válido legalmente' : 'Validade limitada'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métodos de envío */}
      <div className="grid md:grid-cols-2 gap-4">
        {deliveryMethods.map((method) => {
          const isSelected = selectedMethods.includes(method.id);
          
          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-glow border-primary' 
                  : 'hover:ring-1 hover:ring-muted-foreground'
              } ${method.recommended ? 'border-blue-300' : ''}`}
              onClick={() => handleMethodToggle(method.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {method.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{method.name}</span>
                        {method.recommended && (
                          <Badge variant="info" className="text-xs">Recomendado</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{method.description}</CardDescription>
                    </div>
                  </div>
                  {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Badges de características */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getLegalityColor(method.legalValidity)}>
                      Validade: {method.legalValidity === 'high' ? 'Alta' : method.legalValidity === 'medium' ? 'Média' : 'Básica'}
                    </Badge>
                    <Badge className={getCostColor(method.cost)}>
                      Custo: {method.cost === 'free' ? 'Grátis' : method.cost === 'low' ? 'Baixo' : method.cost === 'medium' ? 'Médio' : 'Alto'}
                    </Badge>
                    {method.trackable && (
                      <Badge variant="outline">Seguimento</Badge>
                    )}
                  </div>

                  {/* Información de entrega */}
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground">Tempo de entrega:</p>
                    <p>{method.deliveryTime}</p>
                  </div>

                  {/* Características */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Características:</p>
                    <ul className="text-sm space-y-1">
                      {method.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button 
          onClick={validateAndNext} 
          variant="workflow" 
          size="lg"
          disabled={selectedMethodsCount === 0}
        >
          Continuar
          {selectedMethodsCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
              {selectedMethodsCount} método{selectedMethodsCount > 1 ? 's' : ''}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MetodoEnvioStep;