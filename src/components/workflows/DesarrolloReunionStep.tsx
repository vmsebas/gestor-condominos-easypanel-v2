/**
 * DesarrolloReunionStep.tsx - Passo de Desenvolvimento da Reunião
 *
 * Foco: Registo de DISCUSSÃO e NOTAS + VOTAÇÃO INLINE de cada ponto
 * Votações são feitas diretamente em cada ponto (modal popup)
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
  FileText,
  Vote
} from 'lucide-react';
import { toast } from 'sonner';
import VotingDialog from './VotingDialog';
import { saveMinuteItemVotes } from '@/lib/api';

interface AgendaItem {
  id?: string;
  item_number: number;
  title: string;
  description?: string;
  type?: 'votacion' | 'informativo' | 'discussion';
  requiredMajority?: 'simple' | 'cualificada';
  discussion?: string;
  notes?: string;
  // Campos de votação
  voting_result?: {
    votes: Record<string, string>;
    isUnanimous: boolean;
    votersInFavor: string[];
    votersAgainst: string[];
    votersAbstained: string[];
    permilageInFavor: number;
    permilageAgainst: number;
    permilageAbstained: number;
    totalVotingPermilage: number;
    passed: boolean;
  };
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
  const [votingItemIndex, setVotingItemIndex] = useState<number | null>(null);

  // Obter condóminos presentes para votação
  const presentMembers = data.members
    ? data.members.filter((m: any) => {
        const attendance = data.attendance?.[m.id];
        return attendance?.present || attendance?.represented;
      })
    : [];

  // Inicializar agenda items desde data
  useEffect(() => {
    if (data.agenda_items && Array.isArray(data.agenda_items)) {
      setAgendaItems(data.agenda_items.map((item: any) => ({
        id: item.id,
        item_number: item.item_number || 0,
        title: item.title || '',
        description: item.description || '',
        type: item.type || 'discussion',
        requiredMajority: item.requiredMajority || 'simple',
        discussion: item.discussion || '',
        notes: item.notes || '',
        voting_result: item.voting_result // Carregar votação existente
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

  const handleOpenVoting = (index: number) => {
    setVotingItemIndex(index);
  };

  const handleSaveVoting = async (votingResult: any) => {
    if (votingItemIndex === null) return;

    const currentItem = agendaItems[votingItemIndex];

    // Atualizar estado local
    const newItems = [...agendaItems];
    newItems[votingItemIndex] = {
      ...newItems[votingItemIndex],
      voting_result: votingResult
    };
    setAgendaItems(newItems);
    setVotingItemIndex(null);
    setHasChanges(true);

    // Guardar na base de dados se temos actaId e agendaItemId
    if (data.actaId && currentItem.id) {
      try {
        await saveMinuteItemVotes(data.actaId, currentItem.id, votingResult);
        toast.success(
          votingResult.isUnanimous
            ? 'Votação guardada na BD: Aprovado por unanimidade'
            : votingResult.passed
            ? 'Votação guardada na BD: Aprovado'
            : 'Votação guardada na BD: Rejeitado'
        );
      } catch (error) {
        console.error('Erro ao guardar votação na BD:', error);
        toast.error('Erro ao guardar votação na base de dados');
      }
    } else {
      // Apenas guardado localmente (workflow state)
      toast.success(
        votingResult.isUnanimous
          ? 'Votação guardada localmente: Aprovado por unanimidade'
          : votingResult.passed
          ? 'Votação guardada localmente: Aprovado'
          : 'Votação guardada localmente: Rejeitado'
      );
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

                    {/* Votação - Botão e Resultado */}
                    {item.type === 'votacion' && (
                      <div className="space-y-3">
                        {item.voting_result ? (
                          // Mostrar resultado da votação
                          <div className={`rounded-md p-4 border-2 ${
                            item.voting_result.passed
                              ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className={`h-5 w-5 ${item.voting_result.passed ? 'text-green-600' : 'text-red-600'}`} />
                                <span className={`font-semibold ${item.voting_result.passed ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                  {item.voting_result.isUnanimous
                                    ? 'Aprovado por Unanimidade'
                                    : item.voting_result.passed
                                    ? 'Aprovado'
                                    : 'Rejeitado'}
                                </span>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleOpenVoting(index)}>
                                Editar Votação
                              </Button>
                            </div>
                            {item.voting_result.isUnanimous ? (
                              <p className="text-sm text-green-700 dark:text-green-300">
                                Todos os condóminos presentes votaram a favor ({item.voting_result.totalVotingPermilage.toFixed(2)}‰)
                              </p>
                            ) : (
                              <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <p><strong>A Favor:</strong> {item.voting_result.permilageInFavor.toFixed(2)}‰ ({item.voting_result.votersInFavor.length} votos)</p>
                                <p><strong>Contra:</strong> {item.voting_result.permilageAgainst.toFixed(2)}‰ ({item.voting_result.votersAgainst.length} votos)</p>
                                <p><strong>Abstenções:</strong> {item.voting_result.permilageAbstained.toFixed(2)}‰ ({item.voting_result.votersAbstained.length} votos)</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Botão para votar
                          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Ponto de Votação:</strong> Clique em "Votar" para registar os votos
                              </p>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleOpenVoting(index)}
                                className="ml-4"
                              >
                                <Vote className="h-4 w-4 mr-2" />
                                Votar
                              </Button>
                            </div>
                          </div>
                        )}
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

      {/* VotingDialog Modal */}
      {votingItemIndex !== null && (
        <VotingDialog
          open={votingItemIndex !== null}
          onClose={() => setVotingItemIndex(null)}
          onSave={handleSaveVoting}
          agendaItem={agendaItems[votingItemIndex]}
          presentMembers={presentMembers}
          existingVotes={agendaItems[votingItemIndex]?.voting_result?.votes || {}}
        />
      )}
    </div>
  );
};

export default DesarrolloReunionStep;
