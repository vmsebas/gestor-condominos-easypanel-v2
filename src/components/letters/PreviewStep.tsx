import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ChevronLeft, FileText, Loader2, Eye, Users, CheckSquare } from 'lucide-react';
import { getMembers } from '@/lib/api';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  apartment: string;
  email: string;
  whatsapp_number: string | null;
  email_consent: boolean;
  whatsapp_consent: boolean;
}

interface PreviewStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PreviewStep: React.FC<PreviewStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(data.recipients || []);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    loadMembers();
    generatePreviewContent();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const result = await getMembers({ building_id: data.buildingId });
      const membersData = result.data?.members || result.members || [];
      setMembers(membersData);
    } catch (error: any) {
      console.error('Erro ao carregar condóminos:', error);
      toast.error('Erro ao carregar lista de condóminos');
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewContent = () => {
    // Substituir variáveis por exemplos
    let preview = data.content || '';
    const currentDate = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

    preview = preview.replace(/\{\{building\.name\}\}/g, data.buildingName || 'Nome do Edifício');
    preview = preview.replace(/\{\{building\.address\}\}/g, data.buildingAddress || 'Morada do Edifício');
    preview = preview.replace(/\{\{building\.postalCode\}\}/g, '1000-001');
    preview = preview.replace(/\{\{building\.city\}\}/g, 'Lisboa');
    preview = preview.replace(/\{\{member\.name\}\}/g, '[Nome do Condómino]');
    preview = preview.replace(/\{\{member\.apartment\}\}/g, '[Fração]');
    preview = preview.replace(/\{\{member\.email\}\}/g, '[email]');
    preview = preview.replace(/\{\{current\.date\}\}/g, currentDate);
    preview = preview.replace(/\{\{current\.year\}\}/g, new Date().getFullYear().toString());
    preview = preview.replace(/\{\{admin\.name\}\}/g, 'Administrador');

    setPreviewContent(preview);
  };

  const toggleRecipient = (memberId: string) => {
    const newSelectedRecipients = selectedRecipients.includes(memberId)
      ? selectedRecipients.filter(id => id !== memberId)
      : [...selectedRecipients, memberId];

    setSelectedRecipients(newSelectedRecipients);
    onUpdate({ recipients: newSelectedRecipients });
  };

  const selectAll = () => {
    const allMemberIds = members.map(m => m.id);
    setSelectedRecipients(allMemberIds);
    onUpdate({ recipients: allMemberIds });
    toast.success(`${allMemberIds.length} condóminos seleccionados`);
  };

  const selectNone = () => {
    setSelectedRecipients([]);
    onUpdate({ recipients: [] });
  };

  const handleContinue = () => {
    if (selectedRecipients.length === 0) {
      toast.error('Por favor seleccione pelo menos um destinatário');
      return;
    }
    onNext();
  };

  const selectedCount = selectedRecipients.length;
  const totalCount = members.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">A carregar condóminos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview Panel */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview do Conteúdo
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Exemplo com variáveis substituídas
                  </CardDescription>
                </div>
                <Badge variant="secondary">{data.template_type?.replace(/_/g, ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Subject */}
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground">Assunto</Label>
                <p className="font-semibold mt-1">{data.subject}</p>
              </div>

              <Separator className="my-4" />

              {/* Content Preview */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {previewContent}
                </div>
              </div>

              <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <FileText className="inline h-3 w-3 mr-1" />
                  As variáveis serão substituídas pelos dados reais de cada condómino ao enviar
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipients Panel */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Seleccionar Destinatários
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {selectedCount} de {totalCount} seleccionados
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    disabled={selectedCount === totalCount}
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectNone}
                    disabled={selectedCount === 0}
                  >
                    Nenhum
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum condómino encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const isSelected = selectedRecipients.includes(member.id);
                    const hasEmail = !!member.email && member.email_consent;
                    const hasWhatsApp = !!member.whatsapp_number && member.whatsapp_consent;

                    return (
                      <div
                        key={member.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-primary/5 border-primary'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleRecipient(member.id)}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={`member-${member.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Fração {member.apartment}
                              </p>
                              {member.email && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {member.email}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {hasEmail && (
                                <Badge variant="outline" className="text-xs">
                                  Email
                                </Badge>
                              )}
                              {hasWhatsApp && (
                                <Badge variant="outline" className="text-xs">
                                  WhatsApp
                                </Badge>
                              )}
                              {!hasEmail && !hasWhatsApp && (
                                <Badge variant="destructive" className="text-xs">
                                  Sem contacto
                                </Badge>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warning if no recipients selected */}
      {selectedCount === 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              ⚠️ Seleccione pelo menos um destinatário para continuar
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedCount === 0}
        >
          Continuar para Envio ({selectedCount})
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <label className={className}>{children}</label>
);

export default PreviewStep;
