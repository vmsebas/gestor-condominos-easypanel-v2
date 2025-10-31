import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, FileSignature, User, Calendar, Pen } from 'lucide-react';
import SignaturePad from '@/components/ui/signature-pad';
import { upsertMinuteSignature } from '@/lib/api';
import { toast } from 'sonner';

interface FirmasActaStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const FirmasActaStep: React.FC<FirmasActaStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [presidentName, setPresidentName] = useState(data?.president_name || data?.signatures?.president_name || '');
  const [secretaryName, setSecretaryName] = useState(data?.secretary_name || data?.signatures?.secretary_name || '');
  const [presidentSignedDate, setPresidentSignedDate] = useState(
    data?.signatures?.president_signed_date || new Date().toISOString().split('T')[0]
  );
  const [secretarySignedDate, setSecretarySignedDate] = useState(
    data?.signatures?.secretary_signed_date || new Date().toISOString().split('T')[0]
  );

  const [presidentSigned, setPresidentSigned] = useState(data?.signatures?.president_signed || false);
  const [secretarySigned, setSecretarySigned] = useState(data?.signatures?.secretary_signed || false);

  // Digital signatures (base64 PNG)
  const [presidentSignature, setPresidentSignature] = useState<string>(data?.signatures?.president_signature || '');
  const [secretarySignature, setSecretarySignature] = useState<string>(data?.signatures?.secretary_signature || '');

  // Signature dialog states
  const [showPresidentSignDialog, setShowPresidentSignDialog] = useState(false);
  const [showSecretarySignDialog, setShowSecretarySignDialog] = useState(false);

  // Member signatures
  const [memberSignatures, setMemberSignatures] = useState<Record<string, { name: string; signature: string; signedAt: string }>>({});
  const [signingMemberId, setSigningMemberId] = useState<string | null>(null);

  // Get present members from attendance data
  const presentMembers = data?.attendance?.filter((a: any) => a.attendance_type === 'present') || [];

  const allRequiredSigned = presidentSigned && secretarySigned && presidentName.trim() && secretaryName.trim() && presidentSignature && secretarySignature;

  const handlePresidentSign = () => {
    if (!presidentName.trim()) {
      alert('Por favor, indique o nome do Presidente');
      return;
    }
    setShowPresidentSignDialog(true);
  };

  const handlePresidentSignatureSave = (signature: string) => {
    setPresidentSignature(signature);
    setPresidentSigned(true);
    setPresidentSignedDate(new Date().toISOString().split('T')[0]);
    setShowPresidentSignDialog(false);
  };

  const handleSecretarySign = () => {
    if (!secretaryName.trim()) {
      alert('Por favor, indique o nome do Secretário');
      return;
    }
    setShowSecretarySignDialog(true);
  };

  const handleSecretarySignatureSave = (signature: string) => {
    setSecretarySignature(signature);
    setSecretarySigned(true);
    setSecretarySignedDate(new Date().toISOString().split('T')[0]);
    setShowSecretarySignDialog(false);
  };

  const handleMemberSign = (memberId: string) => {
    setSigningMemberId(memberId);
  };

  const handleMemberSignatureSave = (signature: string) => {
    if (!signingMemberId) return;

    const member = presentMembers.find((m: any) => m.member_id === signingMemberId);
    if (!member) return;

    setMemberSignatures({
      ...memberSignatures,
      [signingMemberId]: {
        name: member.member_name,
        signature,
        signedAt: new Date().toISOString()
      }
    });

    setSigningMemberId(null);
  };

  const handleComplete = async () => {
    if (!allRequiredSigned) {
      alert('Ambos o Presidente e o Secretário devem assinar a acta com assinatura digital');
      return;
    }

    // Verificar se temos actaId
    if (!data?.actaId) {
      toast.error('Erro: ID da acta não encontrado. Não é possível guardar assinaturas.');
      return;
    }

    try {
      // 1. Guardar assinatura do Presidente na BD
      toast.info('A guardar assinatura do Presidente...');
      await upsertMinuteSignature(data.actaId, {
        signer_type: 'president',
        signer_name: presidentName,
        signature: presidentSignature
      });

      // 2. Guardar assinatura do Secretário na BD
      toast.info('A guardar assinatura do Secretário...');
      await upsertMinuteSignature(data.actaId, {
        signer_type: 'secretary',
        signer_name: secretaryName,
        signature: secretarySignature
      });

      // 3. Guardar assinaturas dos condóminos presentes que assinaram
      const memberSignatureCount = Object.keys(memberSignatures).length;
      if (memberSignatureCount > 0) {
        toast.info(`A guardar ${memberSignatureCount} assinaturas de condóminos...`);

        for (const [memberId, sigData] of Object.entries(memberSignatures)) {
          await upsertMinuteSignature(data.actaId, {
            signer_type: 'member',
            signer_name: sigData.name,
            signature: sigData.signature,
            member_id: memberId
          });
        }
      }

      toast.success(`✅ Assinaturas guardadas: Presidente + Secretário + ${memberSignatureCount} condóminos`);

      // 4. Gerar código único do documento (UUID da acta)
      const documentCode = data.actaId;
      const documentHash = await generateDocumentHash(data);

      // 5. Atualizar estado do workflow local
      onUpdate({
        president_name: presidentName,
        secretary_name: secretaryName,
        president_signature: presidentSignature, // BASE64 PNG
        secretary_signature: secretarySignature, // BASE64 PNG
        member_signatures: memberSignatures, // Assinaturas dos condóminos
        document_code: documentCode, // UUID único
        document_hash: documentHash, // SHA-256 hash
        signatures: {
          president_name: presidentName,
          president_signed: true,
          president_signed_date: presidentSignedDate,
          president_signature: presidentSignature,
          secretary_name: secretaryName,
          secretary_signed: true,
          secretary_signed_date: secretarySignedDate,
          secretary_signature: secretarySignature,
          member_signatures: memberSignatures,
          total_signatures: 2 + memberSignatureCount,
          completed_at: new Date().toISOString()
        },
        status: 'signed', // Marcar acta como firmada
        signed_at: new Date().toISOString()
      });

      // 6. Avançar para próximo passo
      onNext();

    } catch (error: any) {
      console.error('Erro ao guardar assinaturas:', error);
      toast.error('Erro ao guardar assinaturas na BD: ' + (error.response?.data?.error || error.message));
      // Não avançar se houver erro
    }
  };

  // Generate document hash for integrity verification
  const generateDocumentHash = async (documentData: any) => {
    try {
      const dataString = JSON.stringify({
        minute_number: documentData.minute_number,
        building_id: documentData.building_id,
        meeting_date: documentData.meeting_date,
        agenda_items: documentData.agenda_items,
        created_at: documentData.created_at || new Date().toISOString()
      });

      // Simple hash using SubtleCrypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashHex;
    } catch (error) {
      console.error('Erro ao gerar hash:', error);
      return `MANUAL-${Date.now()}`; // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Minute Number */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">Assinaturas e Aprovação</h2>
          <p className="text-muted-foreground">
            Assinatura do Presidente e Secretário para validação legal da acta
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

      {/* Resumo da Assembleia */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Resumo da Assembleia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Data da Reunião:</p>
              <p className="font-semibold">
                {data?.meeting_date
                  ? new Date(data.meeting_date).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Não especificada'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo de Assembleia:</p>
              <p className="font-semibold">
                {data?.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Quórum:</p>
              <p className="font-semibold">
                {data?.quorum?.percentage || '0'}% ({data?.quorum?.presentPermilage || '0'}‰)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Pontos da Ordem do Dia:</p>
              <p className="font-semibold">
                {data?.agenda_items?.length || 0} pontos tratados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assinatura do Presidente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Assinatura do Presidente da Mesa</span>
          </CardTitle>
          <CardDescription>
            O Presidente deve assinar a acta para validação legal (Art. 19.º LPH)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="president-name">Nome do Presidente</Label>
            <Input
              id="president-name"
              value={presidentName}
              onChange={(e) => setPresidentName(e.target.value)}
              placeholder="Nome completo do Presidente"
              disabled={presidentSigned}
            />
          </div>

          {presidentSigned && presidentSignature ? (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Assinatura do Presidente Confirmada
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="mt-2 space-y-2">
                  <p><strong>Nome:</strong> {presidentName}</p>
                  <p><strong>Data:</strong> {new Date(presidentSignedDate).toLocaleDateString('pt-PT')}</p>
                  <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded border-2 border-green-600 flex flex-col items-center">
                    <img
                      src={presidentSignature}
                      alt="Assinatura do Presidente"
                      className="max-w-full h-auto max-h-24 mb-2"
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      {presidentName} - Presidente da Mesa
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              onClick={handlePresidentSign}
              className="w-full"
              variant="default"
              disabled={!presidentName.trim()}
            >
              <Pen className="mr-2 h-4 w-4" />
              Assinar Digitalmente como Presidente
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Assinatura do Secretário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Assinatura do Secretário da Mesa</span>
          </CardTitle>
          <CardDescription>
            O Secretário deve assinar a acta para validação legal (Art. 19.º LPH)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretary-name">Nome do Secretário</Label>
            <Input
              id="secretary-name"
              value={secretaryName}
              onChange={(e) => setSecretaryName(e.target.value)}
              placeholder="Nome completo do Secretário"
              disabled={secretarySigned}
            />
          </div>

          {secretarySigned && secretarySignature ? (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Assinatura do Secretário Confirmada
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="mt-2 space-y-2">
                  <p><strong>Nome:</strong> {secretaryName}</p>
                  <p><strong>Data:</strong> {new Date(secretarySignedDate).toLocaleDateString('pt-PT')}</p>
                  <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded border-2 border-green-600 flex flex-col items-center">
                    <img
                      src={secretarySignature}
                      alt="Assinatura do Secretário"
                      className="max-w-full h-auto max-h-24 mb-2"
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      {secretaryName} - Secretário da Mesa
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              onClick={handleSecretarySign}
              className="w-full"
              variant="default"
              disabled={!secretaryName.trim()}
            >
              <Pen className="mr-2 h-4 w-4" />
              Assinar Digitalmente como Secretário
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Prévia da Acta - NOVO */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center space-x-2">
            <FileSignature className="h-5 w-5" />
            <span>Prévia da Acta para Aprovação</span>
          </CardTitle>
          <CardDescription>
            Leia o documento completo antes de assinar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700 max-h-96 overflow-y-auto">
            {/* Código Único do Documento */}
            <div className="mb-4 pb-4 border-b">
              <p className="text-xs text-muted-foreground mb-1">Código Único do Documento:</p>
              <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded font-mono">
                {data?.actaId || 'Gerado após criação'}
              </code>
            </div>

            {/* Cabeçalho */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">ACTA N.º {data?.minute_number}</h3>
              <p className="text-sm font-semibold mt-1">
                ASSEMBLEIA {data?.assembly_type === 'ordinary' ? 'ORDINÁRIA' : 'EXTRAORDINÁRIA'} DE CONDÓMINOS
              </p>
              <p className="text-sm mt-1">{data?.building_name}</p>
              <p className="text-xs text-muted-foreground">{data?.building_address}</p>
            </div>

            {/* Informação da Reunião */}
            <div className="mb-4 space-y-1 text-sm">
              <p><strong>Data:</strong> {data?.meeting_date ? new Date(data.meeting_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</p>
              <p><strong>Hora:</strong> {data?.meeting_time || 'N/A'}</p>
              <p><strong>Local:</strong> {data?.location || 'N/A'}</p>
              <p><strong>Quórum:</strong> {data?.quorum?.percentage || '0'}% ({data?.quorum?.presentPermilage || '0'}‰)</p>
            </div>

            {/* Ordem do Dia */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2">ORDEM DO DIA:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {data?.agenda_items?.map((item: any, idx: number) => (
                  <li key={idx} className="ml-2">
                    <strong>{item.title}</strong>
                    {item.voting_result && (
                      <span className={`ml-2 text-xs font-semibold ${item.voting_result.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {item.voting_result.isUnanimous ? ' [APROVADO POR UNANIMIDADE]' : item.voting_result.passed ? ' [APROVADO]' : ' [REJEITADO]'}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {/* Nota Legal */}
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              <p>Documento gerado pelo Sistema Gestor de Condomínios</p>
              <p>Lei n.º 8/2022 - Assinaturas digitais válidas</p>
            </div>
          </div>

          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">
              Leia Atentamente
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
              Por favor, leia todo o conteúdo da acta acima antes de assinar.
              As deliberações descritas tornam-se vinculativas para todos os condóminos após aprovação.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Assinaturas dos Condóminos Presentes - NOVO */}
      {presentMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Assinaturas dos Condóminos Presentes</span>
              <Badge variant="outline">{Object.keys(memberSignatures).length} de {presentMembers.length} assinaram</Badge>
            </CardTitle>
            <CardDescription>
              Os condóminos presentes podem assinar a acta após aprovação (Lei n.º 8/2022)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {presentMembers.map((member: any) => {
                const hasSigned = !!memberSignatures[member.member_id];
                return (
                  <div
                    key={member.member_id}
                    className={`p-4 rounded-lg border-2 ${
                      hasSigned
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{member.member_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Fração {member.apartment || 'N/A'} • {member.permilage}‰
                        </p>
                      </div>
                      {hasSigned ? (
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-300">Assinado</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(memberSignatures[member.member_id].signedAt).toLocaleTimeString('pt-PT')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleMemberSign(member.member_id)}
                          variant="outline"
                          size="sm"
                        >
                          <Pen className="mr-2 h-4 w-4" />
                          Assinar
                        </Button>
                      )}
                    </div>

                    {/* Mostrar assinatura se já assinou */}
                    {hasSigned && (
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                        <img
                          src={memberSignatures[member.member_id].signature}
                          alt={`Assinatura de ${member.member_name}`}
                          className="max-w-full h-auto max-h-16 border-2 border-green-600 rounded bg-white p-2"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {presentMembers.length > 0 && Object.keys(memberSignatures).length === 0 && (
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">
                  Assinaturas dos Condóminos (Opcional)
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  As assinaturas dos condóminos são <strong>opcionais</strong>, mas recomendadas para maior validade legal.
                  Os condóminos podem assinar após ler a acta completa.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alert de validação */}
      {allRequiredSigned ? (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Acta Pronta para Finalizar
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            <p>✅ Presidente e Secretário assinaram (obrigatório)</p>
            <p>📝 {Object.keys(memberSignatures).length} condóminos assinaram (opcional)</p>
            <p className="mt-2">A acta está conforme os requisitos legais (Art. 19.º LPH + Lei n.º 8/2022)</p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Assinaturas Pendentes</AlertTitle>
          <AlertDescription>
            É obrigatório que tanto o Presidente como o Secretário assinem a acta antes de finalizar
            (Art. 19.º LPH - Lei de Propriedade Horizontal).
          </AlertDescription>
        </Alert>
      )}

      {/* Requisito Legal */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Requisito Legal - Art. 19.º LPH</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>
            <strong>Lei de Propriedade Horizontal - Artigo 19.º:</strong>
          </p>
          <p>
            "A acta da reunião deve ser assinada pelo presidente e pelo secretário da mesa,
            que serão eleitos pelos condóminos presentes no início da assembleia."
          </p>
          <p className="mt-3 text-xs text-blue-600 dark:text-blue-300">
            A acta deve ser lavrada em livro próprio ou em folhas soltas devidamente numeradas,
            e deve conter o resumo dos assuntos tratados e das deliberações tomadas.
          </p>
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button
          onClick={handleComplete}
          variant="workflow"
          size="lg"
          disabled={!allSigned}
          className="bg-green-600 hover:bg-green-700"
        >
          {allSigned ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar e Guardar Acta
            </>
          ) : (
            'Faltam Assinaturas'
          )}
        </Button>
      </div>

      {/* Dialog para assinatura do Presidente */}
      <Dialog open={showPresidentSignDialog} onOpenChange={setShowPresidentSignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinatura Digital do Presidente</DialogTitle>
            <DialogDescription>
              {presidentName} - Assine usando o mouse ou toque (iPad/tablet)
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            onSave={handlePresidentSignatureSave}
            onCancel={() => setShowPresidentSignDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para assinatura do Secretário */}
      <Dialog open={showSecretarySignDialog} onOpenChange={setShowSecretarySignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinatura Digital do Secretário</DialogTitle>
            <DialogDescription>
              {secretaryName} - Assine usando o mouse ou toque (iPad/tablet)
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            onSave={handleSecretarySignatureSave}
            onCancel={() => setShowSecretarySignDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para assinatura dos Condóminos - NOVO */}
      <Dialog open={signingMemberId !== null} onOpenChange={(open) => !open && setSigningMemberId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinatura Digital do Condómino</DialogTitle>
            <DialogDescription>
              {signingMemberId ? presentMembers.find((m: any) => m.member_id === signingMemberId)?.member_name : ''} - Assine usando o mouse ou toque (iPad/tablet)
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Confirmação de Leitura:</strong> Ao assinar, confirmo que li o conteúdo completo da acta
              e concordo com as deliberações tomadas na assembleia.
            </p>
          </div>
          <SignaturePad
            onSave={handleMemberSignatureSave}
            onCancel={() => setSigningMemberId(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FirmasActaStep;
