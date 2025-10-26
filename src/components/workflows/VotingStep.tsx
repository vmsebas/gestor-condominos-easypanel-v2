/**
 * VotingStep.tsx - Passo de Votação com Nomes e Permilagem
 *
 * Implementa votação conforme Lei de Propriedade Horizontal:
 * - Art. 1430º CC: Maioria simples = >50% do valor total do prédio
 * - Art. 1432º CC: Maioria qualificada = 2/3 do valor total do prédio
 * - Apenas condóminos PRESENTES podem votar
 * - Regista NOMES dos votantes para cada opção
 * - Cálculo por PERMILAGEM (‰), não por número de pessoas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, Vote, User, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  fraction: string;
  permilage: number;
}

interface AgendaItem {
  item_number: number;
  title: string;
  description?: string;
  type: 'votacion' | 'informativo' | 'discussion';
  requiredMajority?: 'simple' | 'cualificada';
}

interface VoteRecord {
  itemNumber: number;
  votersInFavor: string[];  // Nomes dos votantes
  votersAgainst: string[];
  votersAbstained: string[];
  permilageInFavor: number;  // Permilagem total a favor
  permilageAgainst: number;
  permilageAbstained: number;
  totalVotingPermilage: number;
  passed: boolean;
  requiredMajority: 'simple' | 'cualificada';
}

interface VotingStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const VotingStep: React.FC<VotingStepProps> = ({ data, onUpdate, onPrevious, onNext }) => {
  // Carregar condóminos presentes
  const [presentMembers, setPresentMembers] = useState<Member[]>([]);

  // Carregar pontos da ordem do dia que requerem votação
  const [votingItems, setVotingItems] = useState<AgendaItem[]>([]);

  // Votos: { itemNumber: { memberId: 'favor' | 'contra' | 'abstencao' } }
  const [votes, setVotes] = useState<Record<number, Record<string, string>>>({});

  // Resultados calculados
  const [voteResults, setVoteResults] = useState<Record<number, VoteRecord>>({});

  // Carregar dados ao montar componente
  useEffect(() => {
    // Carregar condóminos presentes da folha de presenças
    if (data.attendees) {
      const present: Member[] = Object.entries(data.attendees)
        .filter(([_, attendance]: [string, any]) => attendance.present)
        .map(([memberId, attendance]: [string, any]) => {
          // Buscar info completa do membro
          const memberInfo = data.members?.find((m: any) => m.id === memberId);
          return {
            id: memberId,
            name: attendance.name || memberInfo?.name || 'Sem nome',
            fraction: memberInfo?.fraction || '-',
            permilage: parseFloat(memberInfo?.permilage || '0')
          };
        });

      setPresentMembers(present);
    }

    // Carregar pontos que requerem votação
    if (data.agenda_items) {
      const itemsToVote = data.agenda_items.filter(
        (item: AgendaItem) => item.type === 'votacion'
      );
      setVotingItems(itemsToVote);
    }

    // Carregar votos existentes se estiver editando
    if (data.voting_results) {
      setVotes(data.voting_results.votes || {});
      setVoteResults(data.voting_results.results || {});
    }
  }, [data]);

  // Calcular resultados quando votos mudarem
  useEffect(() => {
    const results: Record<number, VoteRecord> = {};

    votingItems.forEach((item) => {
      const itemVotes = votes[item.item_number] || {};

      const votersInFavor: string[] = [];
      const votersAgainst: string[] = [];
      const votersAbstained: string[] = [];
      let permilageInFavor = 0;
      let permilageAgainst = 0;
      let permilageAbstained = 0;

      // Calcular totais por opção
      Object.entries(itemVotes).forEach(([memberId, vote]) => {
        const member = presentMembers.find(m => m.id === memberId);
        if (!member) return;

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

      // Total de permilagem votante
      const totalVotingPermilage = permilageInFavor + permilageAgainst + permilageAbstained;

      // Determinar se passou
      const requiredMajority = item.requiredMajority || 'simple';
      let passed = false;

      if (requiredMajority === 'simple') {
        // Maioria simples: >50% dos votos (excluindo abstenções)
        const validVotes = permilageInFavor + permilageAgainst;
        passed = validVotes > 0 && permilageInFavor > (validVotes / 2);
      } else {
        // Maioria qualificada: ≥66.67% do total do prédio (1000‰)
        passed = permilageInFavor >= 666.67;
      }

      results[item.item_number] = {
        itemNumber: item.item_number,
        votersInFavor,
        votersAgainst,
        votersAbstained,
        permilageInFavor,
        permilageAgainst,
        permilageAbstained,
        totalVotingPermilage,
        passed,
        requiredMajority
      };
    });

    setVoteResults(results);
  }, [votes, presentMembers, votingItems]);

  // Handler para mudar voto
  const handleVoteChange = (itemNumber: number, memberId: string, vote: string) => {
    setVotes(prev => ({
      ...prev,
      [itemNumber]: {
        ...(prev[itemNumber] || {}),
        [memberId]: vote
      }
    }));
  };

  // Verificar se todos os pontos foram votados
  const allItemsVoted = votingItems.every(item => {
    const itemVotes = votes[item.item_number] || {};
    // Todos os presentes devem ter votado
    return presentMembers.every(member => itemVotes[member.id]);
  });

  // Guardar e continuar
  const handleContinue = () => {
    if (!allItemsVoted) {
      toast.error('Todos os condóminos presentes devem votar em todos os pontos');
      return;
    }

    // Actualizar dados do workflow
    onUpdate({
      voting_results: {
        votes,
        results: voteResults,
        completed_at: new Date().toISOString()
      }
    });

    toast.success('Votações registadas com sucesso');
    onNext();
  };

  if (presentMembers.length === 0) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro: Sem Condóminos Presentes</AlertTitle>
          <AlertDescription>
            É necessário registar a folha de presenças antes de proceder às votações.
            Por favor, volte ao passo anterior e registe os condóminos presentes.
          </AlertDescription>
        </Alert>
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (votingItems.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sem Pontos para Votar</AlertTitle>
          <AlertDescription>
            Não há pontos da ordem do dia que requeiram votação. Pode prosseguir para o próximo passo.
          </AlertDescription>
        </Alert>
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious}>
            Anterior
          </Button>
          <Button onClick={onNext} variant="workflow">
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">Votações</h2>
          <p className="text-muted-foreground">
            Registo detalhado de votos com nomes dos votantes e cálculo por permilagem
          </p>
        </div>
        {data?.minute_number && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            Acta #{data.minute_number}
          </Badge>
        )}
      </div>

      {/* Info de Condóminos Presentes */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <User className="h-5 w-5" />
            Condóminos Presentes ({presentMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {presentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">Fração {member.fraction}</p>
                </div>
                <Badge variant="secondary">
                  {member.permilage.toFixed(2)}‰
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Total Permilagem Presente:</strong> {presentMembers.reduce((sum, m) => sum + m.permilage, 0).toFixed(2)}‰
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pontos de Votação */}
      {votingItems.map((item) => {
        const result = voteResults[item.item_number];
        const itemVotes = votes[item.item_number] || {};
        const allVoted = presentMembers.every(m => itemVotes[m.id]);

        return (
          <Card key={item.item_number} className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Ponto {item.item_number}: {item.title}
                  </CardTitle>
                  {item.description && (
                    <CardDescription className="mt-2">{item.description}</CardDescription>
                  )}
                </div>
                <Badge variant={item.requiredMajority === 'cualificada' ? 'destructive' : 'default'}>
                  {item.requiredMajority === 'cualificada' ? 'Maioria Qualificada (2/3)' : 'Maioria Simples (>50%)'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tabela de Votação */}
              <div className="space-y-2">
                {presentMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Fração {member.fraction} • {member.permilage.toFixed(2)}‰
                      </p>
                    </div>
                    <RadioGroup
                      value={itemVotes[member.id] || ''}
                      onValueChange={(value) => handleVoteChange(item.item_number, member.id, value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="favor" id={`${item.item_number}-${member.id}-favor`} />
                        <Label htmlFor={`${item.item_number}-${member.id}-favor`} className="text-green-700 dark:text-green-300 font-medium cursor-pointer">
                          A Favor
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="contra" id={`${item.item_number}-${member.id}-contra`} />
                        <Label htmlFor={`${item.item_number}-${member.id}-contra`} className="text-red-700 dark:text-red-300 font-medium cursor-pointer">
                          Contra
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="abstencao" id={`${item.item_number}-${member.id}-abstencao`} />
                        <Label htmlFor={`${item.item_number}-${member.id}-abstencao`} className="text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                          Abstenção
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Resultados */}
              {result && allVoted && (
                <Alert className={result.passed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}>
                  <TrendingUp className={`h-4 w-4 ${result.passed ? 'text-green-600' : 'text-red-600'}`} />
                  <AlertTitle className={result.passed ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                    {result.passed ? '✅ APROVADO' : '❌ REJEITADO'}
                  </AlertTitle>
                  <AlertDescription className={result.passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="font-semibold text-green-700 dark:text-green-300">A Favor</p>
                          <p className="text-2xl font-bold">{result.permilageInFavor.toFixed(2)}‰</p>
                          <p className="text-xs">{result.votersInFavor.length} voto(s)</p>
                        </div>
                        <div>
                          <p className="font-semibold text-red-700 dark:text-red-300">Contra</p>
                          <p className="text-2xl font-bold">{result.permilageAgainst.toFixed(2)}‰</p>
                          <p className="text-xs">{result.votersAgainst.length} voto(s)</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">Abstenções</p>
                          <p className="text-2xl font-bold">{result.permilageAbstained.toFixed(2)}‰</p>
                          <p className="text-xs">{result.votersAbstained.length} voto(s)</p>
                        </div>
                      </div>

                      <Separator />

                      {result.votersInFavor.length > 0 && (
                        <div>
                          <p className="font-semibold text-xs text-green-700 dark:text-green-300">Votaram A FAVOR:</p>
                          <p className="text-sm">{result.votersInFavor.join(', ')}</p>
                        </div>
                      )}
                      {result.votersAgainst.length > 0 && (
                        <div>
                          <p className="font-semibold text-xs text-red-700 dark:text-red-300">Votaram CONTRA:</p>
                          <p className="text-sm">{result.votersAgainst.join(', ')}</p>
                        </div>
                      )}
                      {result.votersAbstained.length > 0 && (
                        <div>
                          <p className="font-semibold text-xs text-gray-700 dark:text-gray-300">ABSTENÇÕES:</p>
                          <p className="text-sm">{result.votersAbstained.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!allVoted && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Votação Incompleta</AlertTitle>
                  <AlertDescription>
                    Todos os condóminos presentes devem votar neste ponto.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Requisito Legal */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 text-sm">
            Requisitos Legais - Código Civil Português
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
          <p><strong>Art. 1430º CC - Maioria Simples:</strong> Deliberações tomadas por maioria dos votos dos condóminos presentes, desde que representem mais de metade do valor total do prédio.</p>
          <p><strong>Art. 1432º CC - Maioria Qualificada:</strong> Certas deliberações (obras, alterações estruturais) requerem 2/3 do valor total do prédio.</p>
          <p className="text-amber-700 dark:text-amber-300"><strong>Nota:</strong> O cálculo é feito por PERMILAGEM (‰), não por número de condóminos.</p>
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          variant="workflow"
          size="lg"
          disabled={!allItemsVoted}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {allItemsVoted ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Guardar Votações e Continuar
            </>
          ) : (
            'Votação Incompleta'
          )}
        </Button>
      </div>
    </div>
  );
};

export default VotingStep;
