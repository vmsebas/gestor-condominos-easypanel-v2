import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Info, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EditContentStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EditContentStep: React.FC<EditContentStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [subject, setSubject] = useState(data.subject || '');
  const [content, setContent] = useState(data.content || data.template_content || '');
  const [customVariables, setCustomVariables] = useState(data.customVariables || {});

  // Variáveis disponíveis organizadas por categoria
  const availableVariables = {
    'Edifício': [
      { key: '{{building.name}}', description: 'Nome do edifício' },
      { key: '{{building.address}}', description: 'Morada do edifício' },
      { key: '{{building.postalCode}}', description: 'Código postal' },
      { key: '{{building.city}}', description: 'Cidade' }
    ],
    'Condómino': [
      { key: '{{member.name}}', description: 'Nome do condómino' },
      { key: '{{member.apartment}}', description: 'Fração' },
      { key: '{{member.email}}', description: 'Email' },
      { key: '{{member.phone}}', description: 'Telefone' }
    ],
    'Data e Administração': [
      { key: '{{current.date}}', description: 'Data atual (DD/MM/AAAA)' },
      { key: '{{current.year}}', description: 'Ano atual' },
      { key: '{{admin.name}}', description: 'Nome do administrador' },
      { key: '{{admin.email}}', description: 'Email do administrador' }
    ],
    'Pagamentos (se aplicável)': [
      { key: '{{payment.amount}}', description: 'Montante em dívida' },
      { key: '{{payment.month}}', description: 'Mês de referência' },
      { key: '{{payment.dueDate}}', description: 'Data de vencimento' },
      { key: '{{payment.reference}}', description: 'Referência de pagamento' }
    ],
    'Obras (se aplicável)': [
      { key: '{{work.description}}', description: 'Descrição dos trabalhos' },
      { key: '{{work.company}}', description: 'Empresa responsável' },
      { key: '{{work.startDate}}', description: 'Data de início' },
      { key: '{{work.duration}}', description: 'Duração estimada' }
    ]
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubject = e.target.value;
    setSubject(newSubject);
    onUpdate({ subject: newSubject, content });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onUpdate({ subject, content: newContent });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + variable + content.substring(end);

    setContent(newContent);
    onUpdate({ subject, content: newContent });

    // Restaurar focus e posicionar cursor depois da variável
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);

    toast.success('Variável inserida');
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast.success('Variável copiada para área de transferência');
  };

  const handleContinue = () => {
    if (!subject.trim()) {
      toast.error('Por favor introduza um assunto');
      return;
    }
    if (!content.trim()) {
      toast.error('Por favor introduza o conteúdo da carta');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Template Seleccionado</CardTitle>
              <CardDescription className="mt-1">
                {data.template_name}
              </CardDescription>
            </div>
            <Badge variant="secondary">{data.template_type?.replace(/_/g, ' ')}</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Panel (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto da Carta *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={handleSubjectChange}
              placeholder="Ex: Aviso de Obras na Fachada"
              className="text-base"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content-textarea">Conteúdo da Carta *</Label>
              <span className="text-xs text-muted-foreground">
                {content.length} caracteres
              </span>
            </div>
            <Textarea
              id="content-textarea"
              value={content}
              onChange={handleContentChange}
              placeholder="Escreva o conteúdo da carta aqui. Use as variáveis do painel ao lado para inserir dados dinâmicos."
              className="min-h-[400px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              <Info className="inline h-3 w-3 mr-1" />
              Variáveis dinâmicas serão substituídas automaticamente ao enviar
            </p>
          </div>
        </div>

        {/* Variables Panel (1/3) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Variáveis Disponíveis</CardTitle>
              <CardDescription className="text-xs">
                Clique para inserir no cursor ou copiar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {Object.entries(availableVariables).map(([category, variables]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="px-4 py-2 text-xs font-medium">
                      {category}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-2">
                      <div className="space-y-1">
                        {variables.map((variable) => (
                          <div
                            key={variable.key}
                            className="group flex items-start justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => insertVariable(variable.key)}
                                className="text-xs font-mono text-left text-primary hover:underline truncate block w-full"
                              >
                                {variable.key}
                              </button>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {variable.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={() => copyVariable(variable.key)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
                Como Usar Variáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-blue-700 dark:text-blue-200">
              <p>
                1. Clique numa variável para inserir no cursor
              </p>
              <p>
                2. As variáveis serão substituídas pelos dados reais de cada condómino ao enviar
              </p>
              <p>
                3. Exemplo: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                  {'{{member.name}}'}
                </code> torna-se "João Silva"
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button onClick={handleContinue}>
          Continuar para Preview
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EditContentStep;
