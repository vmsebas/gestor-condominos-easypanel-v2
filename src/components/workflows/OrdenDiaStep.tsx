import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, GripVertical, FileText, Scale, Calculator, Users } from 'lucide-react';

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  type: 'informativo' | 'votacion' | 'economico' | 'administrativo';
  requiredMajority?: 'simple' | 'cualificada' | 'unanimidad';
  documents?: string[];
}

interface OrdenDiaStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const OrdenDiaStep: React.FC<OrdenDiaStepProps> = ({ data, onUpdate, onPrevious, onNext }) => {
  const [newItem, setNewItem] = useState<Partial<AgendaItem>>({ type: 'informativo' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const agendaItems: AgendaItem[] = data.agendaItems || [];

  const typeOptions = [
    { value: 'informativo', label: 'Informativo', icon: FileText, color: 'text-blue-600' },
    { value: 'votacion', label: 'Votação', icon: Scale, color: 'text-purple-600' },
    { value: 'economico', label: 'Económico', icon: Calculator, color: 'text-green-600' },
    { value: 'administrativo', label: 'Administrativo', icon: Users, color: 'text-orange-600' }
  ];

  const majorityOptions = [
    { value: 'simple', label: 'Maioria Simples', description: '>50% dos presentes' },
    { value: 'cualificada', label: 'Maioria Qualificada', description: '>2/3 do total de coeficientes' },
    { value: 'unanimidad', label: 'Unanimidade', description: '100% de acordo' }
  ];

  const defaultItems: Partial<AgendaItem>[] = data.meetingType === 'ordinaria' ? [
    {
      title: 'Leitura e aprovação da acta anterior',
      description: 'Revisão e aprovação da acta da assembleia anterior',
      type: 'votacion',
      requiredMajority: 'simple'
    },
    {
      title: 'Prestação de contas do exercício anterior',
      description: 'Apresentação do estado de contas e gastos do ano anterior',
      type: 'economico'
    },
    {
      title: 'Aprovação do orçamento',
      description: 'Votação do orçamento de receitas e despesas para o próximo exercício',
      type: 'economico',
      requiredMajority: 'simple'
    },
    {
      title: 'Designação de cargos',
      description: 'Eleição ou ratificação de Presidente, Secretário e Administrador',
      type: 'administrativo',
      requiredMajority: 'simple'
    }
  ] : [];

  const addItem = () => {
    if (!newItem.title?.trim()) {
      setErrors({ title: 'O título é obrigatório' });
      return;
    }

    const item: AgendaItem = {
      id: Date.now().toString(),
      title: newItem.title,
      description: newItem.description || '',
      type: newItem.type as AgendaItem['type'],
      requiredMajority: newItem.type === 'votacion' ? newItem.requiredMajority : undefined
    };

    const updatedItems = [...agendaItems, item];
    onUpdate({ agendaItems: updatedItems });
    setNewItem({ type: 'informativo' });
    setErrors({});
  };

  const removeItem = (id: string) => {
    const updatedItems = agendaItems.filter(item => item.id !== id);
    onUpdate({ agendaItems: updatedItems });
  };

  const addDefaultItems = () => {
    const itemsWithIds = defaultItems.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random(),
      title: item.title!,
      type: item.type as AgendaItem['type']
    } as AgendaItem));
    
    onUpdate({ agendaItems: [...agendaItems, ...itemsWithIds] });
  };

  const validateAndNext = () => {
    if (agendaItems.length === 0) {
      setErrors({ general: 'Deve adicionar pelo menos um ponto à ordem do dia' });
      return;
    }
    setErrors({});
    onNext();
  };

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option ? <option.icon className={`h-4 w-4 ${option.color}`} /> : null;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Orden del Día</h2>
        <p className="text-muted-foreground">
          Define los puntos que se tratarán en la junta de propietarios
        </p>
      </div>

      {data.meetingType === 'ordinaria' && agendaItems.length === 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Puntos obligatorios para Junta Ordinaria
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Puedes agregar automáticamente los puntos típicos de una junta ordinaria
                </p>
              </div>
              <Button onClick={addDefaultItems} variant="outline" className="border-blue-300">
                Agregar puntos típicos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de puntos actuales */}
      {agendaItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Puntos del Orden del Día ({agendaItems.length})</CardTitle>
            <CardDescription>
              Los puntos se presentarán en este orden durante la reunión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {agendaItems.map((item, index) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3 text-left">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(item.type)}
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {typeOptions.find(t => t.value === item.type)?.label}
                          </span>
                          {item.requiredMajority && (
                            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {majorityOptions.find(m => m.value === item.requiredMajority)?.label}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Formulario para agregar nuevo punto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Agregar Punto</span>
          </CardTitle>
          <CardDescription>
            Añade un nuevo punto al orden del día
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemTitle">Título del punto *</Label>
              <Input
                id="itemTitle"
                placeholder="Ej: Aprobación de obras de mejora"
                value={newItem.title || ''}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="itemType">Tipo de punto</Label>
              <Select
                value={newItem.type}
                onValueChange={(value) => setNewItem({ ...newItem, type: value as AgendaItem['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <option.icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="itemDescription">Descripción</Label>
            <Textarea
              id="itemDescription"
              placeholder="Descripción detallada del punto a tratar..."
              value={newItem.description || ''}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              rows={3}
            />
          </div>

          {newItem.type === 'votacion' && (
            <div>
              <Label htmlFor="majorityType">Tipo de mayoría requerida</Label>
              <Select
                value={newItem.requiredMajority}
                onValueChange={(value) => setNewItem({ ...newItem, requiredMajority: value as AgendaItem['requiredMajority'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mayoría" />
                </SelectTrigger>
                <SelectContent>
                  {majorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Punto
          </Button>
        </CardContent>
      </Card>

      {errors.general && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={validateAndNext} variant="workflow" size="lg">
          Continuar ({agendaItems.length} puntos)
        </Button>
      </div>
    </div>
  );
};

export default OrdenDiaStep;