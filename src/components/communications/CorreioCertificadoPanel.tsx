/**
 * Correio Certificado Panel
 * Component for managing certified mail sending (CTT Portugal)
 * Generates address labels and tracking control sheets
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Printer,
  Package
} from 'lucide-react';
import {
  generateAddressLabelsPDF,
  generateCertifiedMailControlSheet,
  calculateCertifiedMailCost
} from '@/lib/addressLabelGenerator';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  apartment?: string;
  fraction?: string;
  address?: string;
  secondary_address?: string;
  secondary_postal_code?: string;
  secondary_city?: string;
  secondary_country?: string;
}

interface CorreioCertificadoPanelProps {
  members: Member[];
  selectedMembers: Set<string>;
  buildingName: string;
  buildingAddress: string;
  onTrackingNumbersUpdate?: (trackingNumbers: Record<string, string>) => void;
}

const CorreioCertificadoPanel: React.FC<CorreioCertificadoPanelProps> = ({
  members,
  selectedMembers,
  buildingName,
  buildingAddress,
  onTrackingNumbersUpdate
}) => {
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [generatedLabels, setGeneratedLabels] = useState(false);
  const [generatedControlSheet, setGeneratedControlSheet] = useState(false);

  const selectedMembersList = members.filter(m => selectedMembers.has(m.id));
  const cost = calculateCertifiedMailCost(selectedMembersList.length);

  // Check if members have valid addresses
  const membersWithoutAddress = selectedMembersList.filter(
    m => !m.secondary_address && !m.address
  );

  const handleGenerateLabels = () => {
    try {
      generateAddressLabelsPDF(selectedMembersList, {
        buildingName,
        buildingAddress,
        senderName: 'Administração do Condomínio',
        senderAddress: buildingAddress
      }, true);

      setGeneratedLabels(true);
      toast.success(`Etiquetas geradas para ${selectedMembersList.length} condóminos`);
    } catch (error) {
      console.error('Error generating labels:', error);
      toast.error('Erro ao gerar etiquetas');
    }
  };

  const handleGenerateControlSheet = () => {
    try {
      generateCertifiedMailControlSheet(selectedMembersList, {
        buildingName,
        buildingAddress
      }, true);

      setGeneratedControlSheet(true);
      toast.success('Folha de controlo gerada com sucesso');
    } catch (error) {
      console.error('Error generating control sheet:', error);
      toast.error('Erro ao gerar folha de controlo');
    }
  };

  const handleTrackingNumberChange = (memberId: string, value: string) => {
    const updated = { ...trackingNumbers, [memberId]: value };
    setTrackingNumbers(updated);
    onTrackingNumbersUpdate?.(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">📮 Correio Certificado CTT</h3>
        <p className="text-sm text-muted-foreground">
          Validade legal plena segundo Art. 1430.º CC. Gere etiquetas de endereço e
          regista os números de seguimento.
        </p>
      </div>

      {/* Cost Estimate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimativa de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Envios selecionados</p>
              <p className="text-2xl font-bold">{selectedMembersList.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Custo estimado</p>
              <p className="text-2xl font-bold">€{cost.total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                (~€{cost.perUnit.toFixed(2)} por envio)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Warnings */}
      {membersWithoutAddress.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> {membersWithoutAddress.length} condómino(s) sem endereço registado:
            <ul className="list-disc list-inside mt-2 text-sm">
              {membersWithoutAddress.slice(0, 3).map(m => (
                <li key={m.id}>{m.name} - {m.fraction || m.apartment}</li>
              ))}
              {membersWithoutAddress.length > 3 && (
                <li>... e mais {membersWithoutAddress.length - 3}</li>
              )}
            </ul>
            <p className="mt-2 text-sm">
              Por favor, atualize os endereços antes de gerar as etiquetas.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Step-by-step Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passos para Envio Certificado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Generate Labels */}
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              generatedLabels ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {generatedLabels ? <CheckCircle className="h-5 w-5" /> : <span>1</span>}
            </div>
            <div className="flex-1">
              <p className="font-medium">Gerar Etiquetas de Endereço</p>
              <p className="text-sm text-muted-foreground mb-2">
                Formato CTT padrão (2 colunas x 7 linhas por página A4)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateLabels}
                disabled={selectedMembersList.length === 0 || membersWithoutAddress.length > 0}
              >
                <Printer className="mr-2 h-4 w-4" />
                Gerar e Imprimir Etiquetas
              </Button>
            </div>
          </div>

          {/* Step 2: Generate Control Sheet */}
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              generatedControlSheet ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {generatedControlSheet ? <CheckCircle className="h-5 w-5" /> : <span>2</span>}
            </div>
            <div className="flex-1">
              <p className="font-medium">Gerar Folha de Controlo</p>
              <p className="text-sm text-muted-foreground mb-2">
                Lista de todos os condóminos com espaço para números de seguimento
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateControlSheet}
                disabled={selectedMembersList.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                Gerar Folha de Controlo
              </Button>
            </div>
          </div>

          {/* Step 3: Mail at CTT */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
              <span>3</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">Enviar nos CTT</p>
              <p className="text-sm text-muted-foreground">
                Leve os envelopes com as etiquetas coladas e a folha de controlo aos CTT.
                Peça envio por <strong>Correio Certificado</strong> e registe os números de seguimento.
              </p>
            </div>
          </div>

          {/* Step 4: Register Tracking Numbers */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
              <span>4</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">Registar Números de Seguimento (Opcional)</p>
              <p className="text-sm text-muted-foreground mb-3">
                Registe os números de certificado para tracking futuro.
              </p>

              {selectedMembersList.length > 0 && selectedMembersList.length <= 5 ? (
                <div className="space-y-3 mt-3">
                  {selectedMembersList.map(member => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Label className="text-xs w-32 truncate">
                        {member.name}
                      </Label>
                      <Input
                        placeholder="RR000000000PT"
                        value={trackingNumbers[member.id] || ''}
                        onChange={(e) => handleTrackingNumberChange(member.id, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Para registar números de seguimento de {selectedMembersList.length} envios,
                    use a folha de controlo impressa e registe manualmente nos CTT.
                    Pode introduzir os números no sistema mais tarde.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTT Tracking Link */}
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-1">Acompanhamento de Envios</p>
          <p className="text-sm">
            Pode acompanhar o estado dos envios no site dos CTT:{' '}
            <a
              href="https://www.ctt.pt/particulares/receber/track-trace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              www.ctt.pt/track-trace
            </a>
          </p>
        </AlertDescription>
      </Alert>

      {/* Legal Note */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Validade Legal:</strong> O Correio Certificado CTT cumpre o requisito legal
          do Art. 1430.º CC de "notificação por método que garanta a receção". Os recibos de envio
          e confirmações de entrega têm valor legal pleno em Portugal.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CorreioCertificadoPanel;
