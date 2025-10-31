/**
 * VotingDialog.tsx - Modal de Votação Inline para DesarrolloReunionStep
 *
 * Permite votar diretamente em cada ponto sem precisar de passo separado
 * Suporta:
 * - Unanimidade (aprovado por todos)
 * - Votação nominal (nome por nome)
 * - Cálculo automático de permilagem
 *
 * Legal: Art. 1430º-1432º CC, LPH Dec-Lei 267/94
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Users, TrendingUp, Vote, AlertCircle } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  fraction: string;
  permilage: number;
}

interface VotingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (votingResult: VotingResult) => void;
  agendaItem: {
    item_number: number;
    title: string;
    description?: string;
    requiredMajority?: 'simple' | 'cualificada';
  };
  presentMembers: Member[];
  existingVotes?: Record<string, string>; // memberId → 'favor' | 'contra' | 'abstencao'
}

interface VotingResult {
  votes: Record<string, string>; // memberId → 'favor' | 'contra' | 'abstencao'
  isUnanimous: boolean;
  votersInFavor: string[]; // Nomes
  votersAgainst: string[];
  votersAbstained: string[];
  permilageInFavor: number;
  permilageAgainst: number;
  permilageAbstained: number;
  totalVotingPermilage: number;
  passed: boolean;
}

const VotingDialog: React.FC<VotingDialogProps> = ({
  open,
  onClose,
  onSave,
  agendaItem,
  presentMembers,
  existingVotes = {}
}) => {
  const [votes, setVotes] = useState<Record<string, string>>(existingVotes);

  useEffect(() => {
    setVotes(existingVotes);
  }, [existingVotes, open]);

  const handleVote = (memberId: string, vote: string) => {
    setVotes(prev => ({ ...prev, [memberId]: vote }));
  };

  const calculateResults = (): VotingResult => {
    const votersInFavor: string[] = [];
    const votersAgainst: string[] = [];
    const votersAbstained: string[] = [];
    let permilageInFavor = 0;
    let permilageAgainst = 0;
    let permilageAbstained = 0;

    presentMembers.forEach(member => {
      const vote = votes[member.id];
      if (vote === 'favor') {
        votersInFavor.push(member.name);
        permilageInFavor += member.permilage;
      } else if (vote === 'contra') {
        votersAgainst.push(member.name);
        permilageAgainst += member.permilage;
      } else if (vote === 'abstencao') {
        votersAbstained.push(member.name);
        permilageAbstained += member.permilage;
      }
    });

    const totalVotingPermilage = presentMembers.reduce((sum, m) => sum + m.permilage, 0);
    const isUnanimous = votersInFavor.length === presentMembers.length;

    // Calcular se passou segundo a maioria requerida
    let passed = false;
    if (agendaItem.requiredMajority === 'cualificada') {
      // Maioria qualificada: 2/3 (66.67%)
      passed = permilageInFavor >= (totalVotingPermilage * 2 / 3);
    } else {
      // Maioria simples: >50%
      passed = permilageInFavor > (totalVotingPermilage / 2);
    }

    return {
      votes,
      isUnanimous,
      votersInFavor,
      votersAgainst,
      votersAbstained,
      permilageInFavor,
      permilageAgainst,
      permilageAbstained,
      totalVotingPermilage,
      passed
    };
  };

  const results = calculateResults();
  const allVoted = presentMembers.every(m => votes[m.id]);
  const votedCount = presentMembers.filter(m => votes[m.id]).length;

  const handleSaveAsUnanimous = () => {
    // Marcar todos como "a favor"
    const unanimousVotes: Record<string, string> = {};
    presentMembers.forEach(m => {
      unanimousVotes[m.id] = 'favor';
    });
    setVotes(unanimousVotes);

    // Calcular resultado e guardar
    const unanimousResult: VotingResult = {
      votes: unanimousVotes,
      isUnanimous: true,
      votersInFavor: presentMembers.map(m => m.name),
      votersAgainst: [],
      votersAbstained: [],
      permilageInFavor: presentMembers.reduce((sum, m) => sum + m.permilage, 0),
      permilageAgainst: 0,
      permilageAbstained: 0,
      totalVotingPermilage: presentMembers.reduce((sum, m) => sum + m.permilage, 0),
      passed: true
    };
    onSave(unanimousResult);
  };

  const handleSaveVoting = () => {
    if (!allVoted) {
      alert('Todos os condóminos presentes devem votar');
      return;
    }
    onSave(results);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5" />
            <span>Votação: {agendaItem.title}</span>
          </DialogTitle>
          <DialogDescription>
            {agendaItem.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {presentMembers.length} Condóminos Presentes
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {votedCount} de {presentMembers.length} já votaram
                </p>
              </div>
            </div>
            <Badge variant={agendaItem.requiredMajority === 'cualificada' ? 'destructive' : 'default'}>
              {agendaItem.requiredMajority === 'cualificada' ? 'Maioria Qualificada (2/3)' : 'Maioria Simples (>50%)'}
            </Badge>
          </div>

          {/* Lista de Condóminos */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">VOTAÇÃO NOMINAL</h3>
            {presentMembers.map(member => (
              <div
                key={member.id}
                className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Fração {member.fraction} • {member.permilage.toFixed(2)}‰
                    </p>
                  </div>
                  {votes[member.id] && (
                    <Badge variant={
                      votes[member.id] === 'favor' ? 'success' :
                      votes[member.id] === 'contra' ? 'destructive' : 'secondary'
                    }>
                      {votes[member.id] === 'favor' ? 'A Favor' :
                       votes[member.id] === 'contra' ? 'Contra' : 'Abstenção'}
                    </Badge>
                  )}
                </div>

                <RadioGroup
                  value={votes[member.id] || ''}
                  onValueChange={(value) => handleVote(member.id, value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="favor" id={`${member.id}-favor`} />
                    <Label htmlFor={`${member.id}-favor`} className="cursor-pointer">
                      A Favor
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="contra" id={`${member.id}-contra`} />
                    <Label htmlFor={`${member.id}-contra`} className="cursor-pointer">
                      Contra
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="abstencao" id={`${member.id}-abstencao`} />
                    <Label htmlFor={`${member.id}-abstencao`} className="cursor-pointer">
                      Abstenção
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>

          {/* Resultado */}
          {allVoted && (
            <Alert className={results.passed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}>
              <TrendingUp className={`h-4 w-4 ${results.passed ? 'text-green-600' : 'text-red-600'}`} />
              <AlertTitle className={results.passed ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                {results.isUnanimous ? 'Aprovado por Unanimidade' : results.passed ? 'Aprovado' : 'Rejeitado'}
              </AlertTitle>
              <AlertDescription className={results.passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                {results.isUnanimous ? (
                  <p>
                    Todos os condóminos presentes votaram a favor, representando{' '}
                    <strong>{results.totalVotingPermilage.toFixed(2)}‰</strong> do valor total do prédio.
                  </p>
                ) : (
                  <div className="space-y-1 text-sm">
                    <p><strong>A Favor:</strong> {results.permilageInFavor.toFixed(2)}‰ ({results.votersInFavor.length} votos)</p>
                    <p><strong>Contra:</strong> {results.permilageAgainst.toFixed(2)}‰ ({results.votersAgainst.length} votos)</p>
                    <p><strong>Abstenções:</strong> {results.permilageAbstained.toFixed(2)}‰ ({results.votersAbstained.length} votos)</p>
                    <p className="mt-2">
                      <strong>Resultado:</strong>{' '}
                      {results.passed
                        ? `Aprovado com ${((results.permilageInFavor / results.totalVotingPermilage) * 100).toFixed(1)}% dos votos`
                        : `Rejeitado (necessário ${agendaItem.requiredMajority === 'cualificada' ? '66.7%' : '50%+'})`
                      }
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <div className="space-x-2">
              <Button
                variant="secondary"
                onClick={handleSaveAsUnanimous}
                className="space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Guardar como Unanimidade</span>
              </Button>
              <Button
                onClick={handleSaveVoting}
                disabled={!allVoted}
                variant="default"
              >
                Guardar Votação
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VotingDialog;
