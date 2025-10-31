import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Eye, CheckCircle } from 'lucide-react';
import { generateActaCompletaPDF } from '@/lib/actaGenerator';
import { toast } from 'sonner';

interface RedaccionActaStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const RedaccionActaStep: React.FC<RedaccionActaStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  // Generar contenido del acta
  const actaContent = useMemo(() => {
    const meetingDate = data?.meeting_date
      ? new Date(data.meeting_date).toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      : 'Data não especificada';

    const assemblyType = data?.assembly_type === 'ordinary'
      ? 'Ordinária'
      : 'Extraordinária';

    const quorum = data?.quorum || {};
    const agendaItems = data?.agenda_items || [];

    return {
      header: {
        title: `ACTA N.º ${data?.minute_number || 'XX'}`,
        subtitle: `ASSEMBLEIA ${assemblyType.toUpperCase()} DE CONDÓMINOS`,
        building: data?.building_name || 'Nome do Edifício',
        date: meetingDate,
        time: data?.meeting_time || 'Hora não especificada',
        location: data?.location || 'Local não especificado'
      },
      attendance: {
        present: quorum.presentCount || 0,
        represented: quorum.representedCount || 0,
        percentage: quorum.percentage || 0,
        permilage: quorum.presentPermilage || 0,
        totalPermilage: quorum.totalPermilage || 0,
        isFirstCall: quorum.isFirstCallValid,
        isSecondCall: quorum.isSecondCallValid
      },
      agendaItems,
      conclusion: {
        closingTime: 'A definir',
        president: data?.president_name || 'A definir',
        secretary: data?.secretary_name || 'A definir'
      }
    };
  }, [data]);

  // Handler para gerar e descarregar PDF
  const handleDownloadPDF = () => {
    try {
      // Preparar dados completos para o PDF
      const pdfData = {
        // Header info
        minute_number: data?.minute_number || 'XX',
        assembly_type: data?.assembly_type || 'ordinary',
        building_name: data?.building_name || 'Nome do Edifício',
        building_address: data?.building_address || '',
        meeting_date: data?.meeting_date,
        meeting_time: data?.meeting_time || data?.time || '19:00',
        location: data?.location || 'Local não especificado',

        // Attendance/Quorum
        quorum: data?.quorum || {},
        attendance: data?.attendance || [],

        // Agenda items with voting results
        agenda_items: data?.agenda_items || [],

        // Mesa da assembleia
        president_name: data?.president_name || 'A definir',
        secretary_name: data?.secretary_name || 'A definir',

        // Signatures (if already exist from previous steps)
        president_signature: data?.president_signature,
        secretary_signature: data?.secretary_signature,
        member_signatures: data?.member_signatures || {},

        // Document integrity
        document_code: data?.document_code || data?.actaId || `DOC-${Date.now()}`,
        document_hash: data?.document_hash || 'Será gerado',

        // Timestamps
        signed_date: data?.signed_date,
        created_at: data?.created_at || new Date().toISOString()
      };

      // Gerar PDF (download = true)
      generateActaCompletaPDF(pdfData, true);
      toast.success('PDF descarregado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Verifique os dados.');
    }
  };

  // Handler para pré-visualizar PDF (abre em nova janela)
  const handlePreviewPDF = () => {
    try {
      const pdfData = {
        minute_number: data?.minute_number || 'XX',
        assembly_type: data?.assembly_type || 'ordinary',
        building_name: data?.building_name || 'Nome do Edifício',
        building_address: data?.building_address || '',
        meeting_date: data?.meeting_date,
        meeting_time: data?.meeting_time || data?.time || '19:00',
        location: data?.location || 'Local não especificado',
        quorum: data?.quorum || {},
        attendance: data?.attendance || [],
        agenda_items: data?.agenda_items || [],
        president_name: data?.president_name || 'A definir',
        secretary_name: data?.secretary_name || 'A definir',
        president_signature: data?.president_signature,
        secretary_signature: data?.secretary_signature,
        member_signatures: data?.member_signatures || {},
        document_code: data?.document_code || data?.actaId || `DOC-${Date.now()}`,
        document_hash: data?.document_hash || 'Será gerado',
        signed_date: data?.signed_date,
        created_at: data?.created_at || new Date().toISOString()
      };

      // Gerar PDF (download = false = preview)
      generateActaCompletaPDF(pdfData, false);
      toast.success('PDF aberto para pré-visualização');
    } catch (error) {
      console.error('Erro ao pré-visualizar PDF:', error);
      toast.error('Erro ao pré-visualizar PDF. Verifique os dados.');
    }
  };

  const handleContinue = () => {
    // Guardar la generación del acta
    onUpdate({
      acta_generated: true,
      acta_content: actaContent,
      generated_at: new Date().toISOString()
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">Geração da Acta</h2>
          <p className="text-muted-foreground">
            Vista prévia do documento oficial da assembleia
          </p>
        </div>
        {data?.minute_number && (
          <div className="text-right ml-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Acta #{data.minute_number}
            </Badge>
          </div>
        )}
      </div>

      {/* Ações */}
      <Alert className="mb-4">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Sobre os botões:</strong>
          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
            <li><strong>Pré-visualizar PDF:</strong> Abre a acta em formato PDF numa nova janela para verificação antes de assinar</li>
            <li><strong>Descarregar Rascunho:</strong> Faz download da acta como rascunho PDF (sem assinaturas ainda)</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex space-x-3">
        <Button variant="outline" className="flex-1" onClick={handlePreviewPDF}>
          <Eye className="mr-2 h-4 w-4" />
          Pré-visualizar PDF
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Descarregar Rascunho
        </Button>
      </div>

      {/* Vista Prévia da Acta */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="pt-6">
          <div className="prose dark:prose-invert max-w-none">
            {/* Cabeçalho */}
            <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
              <h1 className="text-2xl font-bold mb-2">{actaContent.header.title}</h1>
              <h2 className="text-xl mb-1">{actaContent.header.subtitle}</h2>
              <p className="text-sm text-muted-foreground">{actaContent.header.building}</p>
            </div>

            {/* Abertura */}
            <p className="mb-4">
              Aos <strong>{actaContent.header.date}</strong>, pelas <strong>{actaContent.header.time}</strong>,
              em <strong>{actaContent.header.location}</strong>, reuniram-se os condóminos do edifício{' '}
              <strong>{actaContent.header.building}</strong>, em Assembleia {actaContent.header.subtitle.split('ASSEMBLEIA ')[1]},
              devidamente convocados nos termos legais.
            </p>

            {/* Quórum */}
            <div className="my-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Verificação de Quórum</h3>
              <p className="mb-2">
                Verificou-se a presença de <strong>{actaContent.attendance.present} condóminos presentes</strong>
                {actaContent.attendance.represented > 0 && (
                  <> e <strong>{actaContent.attendance.represented} representados</strong></>
                )},
                que representam <strong>{actaContent.attendance.percentage}%</strong> do capital social
                (<strong>{actaContent.attendance.permilage}‰</strong> de um total de{' '}
                <strong>{actaContent.attendance.totalPermilage}‰</strong>).
              </p>
              <p>
                {actaContent.attendance.isFirstCall ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Quórum válido para primeira convocatória (superior a 50% dos coeficientes).
                  </span>
                ) : actaContent.attendance.isSecondCall ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    ✓ Quórum válido para segunda convocatória (superior a 25% dos coeficientes).
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ✗ Quórum insuficiente.
                  </span>
                )}
              </p>
            </div>

            {/* Mesa da Assembleia */}
            <div className="my-6">
              <h3 className="text-lg font-semibold mb-2">Mesa da Assembleia</h3>
              <p>
                Foi eleita a seguinte mesa:{' '}
                <strong>Presidente: {actaContent.conclusion.president}</strong> e{' '}
                <strong>Secretário: {actaContent.conclusion.secretary}</strong>.
              </p>
            </div>

            {/* Ordem do Dia */}
            <div className="my-6">
              <h3 className="text-lg font-semibold mb-3">Ordem do Dia e Deliberações</h3>
              {actaContent.agendaItems.length > 0 ? (
                <div className="space-y-4">
                  {actaContent.agendaItems.map((item: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">
                        Ponto {item.item_number}: {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      )}
                      {item.discussion && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">Discussão:</p>
                          <p className="text-sm">{item.discussion}</p>
                        </div>
                      )}
                      {item.notes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">Notas:</p>
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        </div>
                      )}

                      {/* Votação - Formato Legal Português */}
                      {item.type === 'votacion' && item.voting_result ? (
                        <div className="mt-3 p-3 rounded-md bg-gray-100 dark:bg-gray-700">
                          {item.voting_result.isUnanimous ? (
                            // Formato Unanimidade
                            <div>
                              <Badge variant="success" className="mb-2">
                                APROVADO POR UNANIMIDADE
                              </Badge>
                              <p className="text-sm">
                                Aprovado por unanimidade dos votos dos Condóminos e Representantes presentes,
                                representando <strong>{item.voting_result.totalVotingPermilage.toFixed(2)}‰</strong> do
                                valor total do capital investido.
                              </p>
                            </div>
                          ) : (
                            // Formato Votação Nominal
                            <div className="space-y-2">
                              <div className="mb-2">
                                <Badge
                                  variant={item.voting_result.passed ? 'success' : 'destructive'}
                                >
                                  {item.voting_result.passed ? 'APROVADO' : 'REJEITADO'}
                                </Badge>
                              </div>

                              {item.voting_result.votersInFavor.length > 0 && (
                                <div className="text-sm">
                                  <span className="font-medium">Votos a favor:</span>{' '}
                                  <strong>{item.voting_result.permilageInFavor.toFixed(2)}‰</strong>{' '}
                                  ({item.voting_result.votersInFavor.length} votos)
                                  <br />
                                  <span className="text-xs text-muted-foreground">
                                    {item.voting_result.votersInFavor.join(', ')}
                                  </span>
                                </div>
                              )}

                              {item.voting_result.votersAgainst.length > 0 && (
                                <div className="text-sm">
                                  <span className="font-medium">Votos contra:</span>{' '}
                                  <strong>{item.voting_result.permilageAgainst.toFixed(2)}‰</strong>{' '}
                                  ({item.voting_result.votersAgainst.length} votos)
                                  <br />
                                  <span className="text-xs text-muted-foreground">
                                    {item.voting_result.votersAgainst.join(', ')}
                                  </span>
                                </div>
                              )}

                              {item.voting_result.votersAbstained.length > 0 && (
                                <div className="text-sm">
                                  <span className="font-medium">Abstenções:</span>{' '}
                                  <strong>{item.voting_result.permilageAbstained.toFixed(2)}‰</strong>{' '}
                                  ({item.voting_result.votersAbstained.length} votos)
                                  <br />
                                  <span className="text-xs text-muted-foreground">
                                    {item.voting_result.votersAbstained.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : item.type === 'votacion' ? (
                        // Ponto de votação sem votos registados
                        <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            ⚠️ Ponto de votação sem votos registados
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum ponto da ordem do dia registado.</p>
              )}
            </div>

            {/* Encerramento */}
            <p className="mt-6">
              Nada mais havendo a tratar, foi encerrada a sessão pelas {actaContent.conclusion.closingTime},
              da qual se lavrou a presente acta que vai ser assinada pelo Presidente e Secretário da mesa.
            </p>

            {/* Assinaturas (placeholder) */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mt-16">
                  <p className="font-semibold">{actaContent.conclusion.president}</p>
                  <p className="text-sm text-muted-foreground">Presidente da Mesa</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mt-16">
                  <p className="font-semibold">{actaContent.conclusion.secretary}</p>
                  <p className="text-sm text-muted-foreground">Secretário da Mesa</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          A acta foi gerada automaticamente com base nos dados recolhidos durante a assembleia.
          Pode rever todos os pontos antes de prosseguir para as assinaturas.
        </AlertDescription>
      </Alert>

      {/* Botões de navegação */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={handleContinue} variant="workflow" size="lg">
          <FileText className="mr-2 h-4 w-4" />
          Prosseguir para Assinaturas
        </Button>
      </div>
    </div>
  );
};

export default RedaccionActaStep;
