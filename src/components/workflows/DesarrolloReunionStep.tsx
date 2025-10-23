import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Save,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgendaItem {
  id?: string;
  item_number: number;
  title: string;
  description?: string;
  votes_in_favor: number;
  votes_against: number;
  abstentions: number;
  discussion: string;
  decision: string;
}

interface DesarrolloReunionStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const DECISION_OPTIONS = [
  { value: 'APROVADO POR UNANIMIDADE', label: 'Aprovado por Unanimidade', color: 'success' },
  { value: 'APROVADO POR MAIORIA', label: 'Aprovado por Maioria', color: 'success' },
  { value: 'REJEITADO', label: 'Rejeitado', color: 'destructive' },
  { value: 'ADIADO', label: 'Adiado', color: 'warning' },
  { value: 'EM DISCUSSÃO', label: 'Em Discussão', color: 'default' }
];

const DesarrolloReunionStep: React.FC<DesarrolloReunionStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0])); // Primeiro item expandido
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar agenda items desde data
  useEffect(() => {
    if (data.agenda_items && Array.isArray(data.agenda_items)) {
      setAgendaItems(data.agenda_items.map((item: any) => ({
        id: item.id,
        item_number: item.item_number || 0,
        title: item.title || '',
        description: item.description || '',
        votes_in_favor: item.votes_in_favor || 0,
        votes_against: item.votes_against || 0,
        abstentions: item.abstentions || 0,
        discussion: item.discussion || '',
        decision: item.decision || ''
      })));
    }
  }, [data.agenda_items]);

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const updateItem = (index: number, field: keyof AgendaItem, value: any) => {
    const newItems = [...agendaItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setAgendaItems(newItems);
    setHasChanges(true);
  };

  const getTotalVotes = (item: AgendaItem) => {
    return item.votes_in_favor + item.votes_against + item.abstentions;
  };

  const getItemStatus = (item: AgendaItem) => {
    const hasVotes = getTotalVotes(item) > 0;
    const hasDecision = item.decision && item.decision.trim() !== '';

    if (hasVotes && hasDecision) {
      return { status: 'complete', icon: CheckCircle, color: 'text-green-600' };
    } else if (hasVotes || hasDecision) {
      return { status: 'partial', icon: AlertCircle, color: 'text-orange-600' };
    }
    return { status: 'pending', icon: AlertCircle, color: 'text-gray-400' };
  };

  const handleSave = () => {
    // Validar que todos los items tengan al menos decisión
    const incomplete = agendaItems.filter(item => !item.decision || item.decision.trim() === '');

    if (incomplete.length > 0) {
      toast.warning(`${incomplete.length} ponto(s) sem decisão registada`);
    }

    // Guardar cambios
    onUpdate({ agenda_items: agendaItems });
    setHasChanges(false);
    toast.success('Votações guardadas com sucesso');
  };

  const handleContinue = () => {
    if (hasChanges) {
      handleSave();
    }
    onNext();
  };

  const getDecisionBadgeVariant = (decision: string): any => {
    const option = DECISION_OPTIONS.find(opt => opt.value === decision);
    if (!option) return 'outline';

    switch (option.color) {
      case 'success': return 'success';
      case 'destructive': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Desenvolvimento da Reunião - Votação dos Pontos</CardTitle>
          <CardDescription>
            Registe os votos e decisões para cada ponto da ordem de trabalhos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {agendaItems.filter(item => item.decision && item.decision.trim() !== '').length} de {agendaItems.length} pontos com decisão registada
            </span>
            {hasChanges && (
              <Badge variant="outline" className="animate-pulse">
                <Save className="h-3 w-3 mr-1" />
                Alterações não guardadas
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agenda Items */}
      <div className="space-y-4">
        {agendaItems.map((item, index) => {
          const isExpanded = expandedItems.has(index);
          const { status, icon: StatusIcon, color } = getItemStatus(item);

          return (
            <Card key={index} className={isExpanded ? 'ring-2 ring-primary/20' : ''}>
              <CardHeader className="cursor-pointer" onClick={() => toggleItem(index)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex flex-col items-center min-w-[40px]">
                      <span className="text-lg font-bold text-primary">{item.item_number}</span>
                      <StatusIcon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      {item.description && (
                        <CardDescription className="mt-1">{item.description}</CardDescription>
                      )}
                      {item.decision && (
                        <div className="mt-2">
                          <Badge variant={getDecisionBadgeVariant(item.decision)}>
                            {item.decision}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4 border-t pt-4">
                  {/* Votação */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-2 text-green-600" />
                        Votos a Favor
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.votes_in_favor}
                        onChange={(e) => updateItem(index, 'votes_in_favor', parseInt(e.target.value) || 0)}
                        className="text-center text-lg font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <ThumbsDown className="h-4 w-4 mr-2 text-red-600" />
                        Votos Contra
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.votes_against}
                        onChange={(e) => updateItem(index, 'votes_against', parseInt(e.target.value) || 0)}
                        className="text-center text-lg font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <Minus className="h-4 w-4 mr-2 text-gray-600" />
                        Abstenções
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.abstentions}
                        onChange={(e) => updateItem(index, 'abstentions', parseInt(e.target.value) || 0)}
                        className="text-center text-lg font-semibold"
                      />
                    </div>
                  </div>

                  {/* Total de votos */}
                  {getTotalVotes(item) > 0 && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Total de Votos:</span>
                        <span className="text-lg font-bold">{getTotalVotes(item)}</span>
                      </div>
                    </div>
                  )}

                  {/* Decisão */}
                  <div className="space-y-2">
                    <Label>Decisão Final *</Label>
                    <Select
                      value={item.decision}
                      onValueChange={(value) => updateItem(index, 'decision', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a decisão..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DECISION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discussão */}
                  <div className="space-y-2">
                    <Label>Discussão / Observações</Label>
                    <Textarea
                      value={item.discussion}
                      onChange={(e) => updateItem(index, 'discussion', e.target.value)}
                      placeholder="Registar pontos importantes da discussão..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onPrevious}>
              Anterior
            </Button>

            <div className="flex space-x-3">
              {hasChanges && (
                <Button variant="outline" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Alterações
                </Button>
              )}
              <Button onClick={handleContinue} variant="workflow">
                Continuar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesarrolloReunionStep;
