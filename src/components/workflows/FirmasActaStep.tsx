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

  const allSigned = presidentSigned && secretarySigned && presidentName.trim() && secretaryName.trim() && presidentSignature && secretarySignature;

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

  const handleComplete = () => {
    if (!allSigned) {
      alert('Ambos o Presidente e o Secretário devem assinar a acta com assinatura digital');
      return;
    }

    // Guardar firmas digitales y actualizar status del acta
    onUpdate({
      president_name: presidentName,
      secretary_name: secretaryName,
      president_signature: presidentSignature, // BASE64 PNG
      secretary_signature: secretarySignature, // BASE64 PNG
      signatures: {
        president_name: presidentName,
        president_signed: true,
        president_signed_date: presidentSignedDate,
        president_signature: presidentSignature,
        secretary_name: secretaryName,
        secretary_signed: true,
        secretary_signed_date: secretarySignedDate,
        secretary_signature: secretarySignature,
        completed_at: new Date().toISOString()
      },
      status: 'signed', // Marcar acta como firmada
      signed_at: new Date().toISOString()
    });

    onNext();
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

      {/* Alert de validação */}
      {allSigned ? (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Acta Pronta para Finalizar
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Ambas as assinaturas foram confirmadas. A acta está conforme os requisitos legais (Art. 19.º LPH)
            e pode ser finalizada.
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
    </div>
  );
};

export default FirmasActaStep;
