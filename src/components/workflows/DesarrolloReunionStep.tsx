/**
 * DesarrolloReunionStep.tsx - Passo de Desenvolvimento da Reunião
 *
 * Foco: Registo de DISCUSSÃO e NOTAS de cada ponto
 * NÃO inclui votações (isso é feito no VotingStep)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface AgendaItem {
  id?: string;
  item_number: number;
  title: string;
  description?: string;
  type?: 'votacion' | 'informativo' | 'discussion';
  discussion?: string;
  notes?: string;
}

interface DesarrolloReunionStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

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
        type: item.type || 'discussion',
        discussion: item.discussion || '',
        notes: item.notes || ''
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

  const getItemStatus = (item: AgendaItem) => {
    const hasDiscussion = item.discussion && item.discussion.trim() !== '';
    const hasNotes = item.notes && item.notes.trim() !== '';

    if (hasDiscussion || hasNotes) {
      return { status: 'complete', icon: CheckCircle, color: 'text-green-600' };
    }
    return { status: 'pending', icon: AlertCircle, color: 'text-gray-400' };
  };

  const handleSave = () => {
    // Guardar cambios
    onUpdate({ agenda_items: agendaItems });
    setHasChanges(false);
    toast.success('Discussões guardadas com sucesso');
  };

  const handleContinue = () => {
    if (hasChanges) {
      handleSave();
    }
    onNext();
  };

  const getItemTypeLabel = (type?: string) => {
    switch (type) {
      case 'votacion':
        return 'Votação';
      case 'informativo':
        return 'Informativo';
      case 'discussion':
      default:
        return 'Discussão';
    }
  };

  const itemsWithDiscussion = agendaItems.filter(item =>
    (item.discussion && item.discussion.trim() !== '') ||
    (item.notes && item.notes.trim() !== '')
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">Desenvolvimento da Reunião</h2>
          <p className="text-muted-foreground">
            Registe a discussão e notas de cada ponto da ordem do dia
          </p>
        </div>
        {data?.minute_number && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            Acta #{data.minute_number}
          </Badge>
        )}
      </div>

      {/* Progress Card */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Progresso da Discussão
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {itemsWithDiscussion} de {agendaItems.length} pontos com notas registadas
                </p>
              </div>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="animate-pulse">
                <Save className="h-3 w-3 mr-1" />
                Alterações não guardadas
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <p className="font-semibold mb-1">Nota Importante:</p>
              <p>
                Neste passo registe apenas a <strong>discussão e notas</strong> de cada ponto.
                As <strong>votações</strong> serão registadas no próximo passo com nomes dos votantes e cálculo por permilagem.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agenda Items */}
      <div className="space-y-4">
        {agendaItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Nenhum ponto na ordem do dia. Volte e configure a ordem do dia na Convocatória.
              </p>
            </CardContent>
          </Card>
        ) : (
          agendaItems.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            const { status, icon: StatusIcon, color } = getItemStatus(item);

            return (
              <Card key={index} className={isExpanded ? 'ring-2 ring-primary/20' : ''}>
                <CardHeader className="cursor-pointer" onClick={() => toggleItem(index)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex flex-col items-center min-w-[40px]">
                        <span className="text-lg font-bold text-primary">{item.item_number}</span>
                        <StatusIcon className={`h-4 w-4 ${color} mt-1`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {getItemTypeLabel(item.type)}
                          </Badge>
                        </div>
                        {item.description && (
                          <CardDescription className="mt-1">{item.description}</CardDescription>
                        )}
                        {(item.discussion || item.notes) && !isExpanded && (
                          <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {item.discussion || item.notes}
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
                    {/* Discussion Field */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <label className="text-sm font-medium">Discussão</label>
                        <span className="text-xs text-muted-foreground">
                          (Resumo do que foi discutido)
                        </span>
                      </div>
                      <Textarea
                        placeholder="Descreva os principais pontos discutidos pelos condóminos neste ponto..."
                        value={item.discussion || ''}
                        onChange={(e) => updateItem(index, 'discussion', e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Notes Field */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <label className="text-sm font-medium">Notas Adicionais</label>
                        <span className="text-xs text-muted-foreground">
                          (Informações extra, observações)
                        </span>
                      </div>
                      <Textarea
                        placeholder="Adicione quaisquer notas ou observações relevantes..."
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {/* Type indicator */}
                    {item.type === 'votacion' && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Ponto de Votação:</strong> A votação detalhada (com nomes e permilagem)
                          será registada no próximo passo.
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Save Button (if changes) */}
      {hasChanges && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Tem alterações não guardadas
              </p>
              <Button onClick={handleSave} variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Guardar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          variant="workflow"
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Continuar para Votações
        </Button>
      </div>
    </div>
  );
};

export default DesarrolloReunionStep;
