import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  FileText,
  Search,
  Loader2,
  Power,
  PowerOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLetterTemplates } from '@/hooks/useLetters';
import { toast } from 'sonner';

interface TemplateManagerProps {
  templates: any[];
  isLoading: boolean;
  onUseTemplate: (template: any) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  isLoading,
  onUseTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'note',
    subject: '',
    content: '',
    variables: '',
    legal_basis: '',
    is_active: true
  });

  const {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleActive,
    isCreating,
    isUpdating,
    isDeleting,
    isDuplicating,
    isTogglingActive
  } = useLetterTemplates();

  // Filtrar templates
  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por tipo
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const type = template.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {} as Record<string, any[]>);

  // Tipo labels
  const typeLabels: Record<string, string> = {
    note: 'Nota',
    late_payment: 'Cobrança',
    meeting_notice: 'Assembleia',
    works_notice: 'Obras',
    rule_violation: 'Incumprimento',
    payment_reminder: 'Lembrete',
    budget_approval: 'Orçamento',
    extraordinary_expense: 'Despesa Extraordinária',
    no_debt_certificate: 'Certificado',
    convocatoria: 'Convocatória',
    urgent_assembly: 'Assembleia Urgente',
    other: 'Outros'
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      name: '',
      type: 'note',
      subject: '',
      content: '',
      variables: '',
      legal_basis: '',
      is_active: true
    });
    setShowCreateDialog(true);
  };

  const handleOpenEditDialog = (template: any) => {
    setFormData({
      name: template.name || '',
      type: template.type || 'note',
      subject: template.subject || '',
      content: template.content || '',
      variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
      legal_basis: template.legal_basis || '',
      is_active: template.is_active !== false
    });
    setEditingTemplate(template);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'note',
      subject: '',
      content: '',
      variables: '',
      legal_basis: '',
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      variables: formData.variables
        ? formData.variables.split(',').map(v => v.trim()).filter(Boolean)
        : []
    };

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
      } else {
        await createTemplate(data);
      }
      handleCloseDialog();
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      await duplicateTemplate(id, `${name} (Cópia)`);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive(id);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await deleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    } catch (error) {
      // Error already handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Templates agrupados por tipo */}
      {Object.keys(groupedTemplates).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar a sua busca' : 'Comece por criar o seu primeiro template'}
              </p>
              {!searchTerm && (
                <Button onClick={handleOpenCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedTemplates).map(([type, items]) => (
          <div key={type}>
            <h3 className="text-lg font-semibold mb-4">
              {typeLabels[type] || type}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((template) => (
                <Card key={template.id} className={`hover:shadow-md transition-all ${!template.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{template.name}</CardTitle>
                        {template.subject && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            <strong>Assunto:</strong> {template.subject}
                          </p>
                        )}
                        <CardDescription className="line-clamp-2 mt-2">
                          {template.content.substring(0, 100)}...
                        </CardDescription>
                      </div>
                      <div className="ml-2 flex flex-col gap-1">
                        {!template.is_active && (
                          <Badge variant="outline" className="text-xs">Inativo</Badge>
                        )}
                        {template.variables && template.variables.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {template.variables.length} vars
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUseTemplate(template)}
                          disabled={!template.is_active}
                        >
                          Usar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(template)}
                          title="Editar template"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(template.id, template.name)}
                          disabled={isDuplicating}
                          title="Duplicar template"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(template.id)}
                          disabled={isTogglingActive}
                          title={template.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {template.is_active ? (
                            <Power className="h-4 w-4 text-green-600" />
                          ) : (
                            <PowerOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTemplateToDelete(template)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Dialog Criar/Editar Template */}
      <Dialog open={showCreateDialog || !!editingTemplate} onOpenChange={(open) => {
        if (!open) handleCloseDialog();
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Edite os campos do template abaixo'
                : 'Preencha os campos para criar um novo template de carta'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aviso de Obras"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Nota</SelectItem>
                    <SelectItem value="late_payment">Cobrança</SelectItem>
                    <SelectItem value="meeting_notice">Assembleia</SelectItem>
                    <SelectItem value="works_notice">Obras</SelectItem>
                    <SelectItem value="rule_violation">Incumprimento</SelectItem>
                    <SelectItem value="payment_reminder">Lembrete</SelectItem>
                    <SelectItem value="budget_approval">Orçamento</SelectItem>
                    <SelectItem value="extraordinary_expense">Despesa Extraordinária</SelectItem>
                    <SelectItem value="no_debt_certificate">Certificado</SelectItem>
                    <SelectItem value="urgent_assembly">Assembleia Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: Aviso de Trabalhos no Edifício"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Digite o conteúdo da carta. Pode usar variáveis como {{member.name}}, {{building.name}}, etc."
                rows={8}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Dica: Use variáveis entre chaves duplas, ex: {'{{member.name}}'}, {'{{building.address}}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variables">Variáveis Disponíveis</Label>
              <Input
                id="variables"
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                placeholder="Ex: member.name, building.name, current.date (separadas por vírgula)"
              />
              <p className="text-xs text-muted-foreground">
                Liste as variáveis que este template usa, separadas por vírgula
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_basis">Base Legal (opcional)</Label>
              <Input
                id="legal_basis"
                value={formData.legal_basis}
                onChange={(e) => setFormData({ ...formData, legal_basis: e.target.value })}
                placeholder="Ex: Art. 16º da LPH, Decreto-Lei n.º 268/94"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="font-normal cursor-pointer">
                Template ativo (disponível para uso)
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isCreating || isUpdating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingTemplate ? 'Guardar Alterações' : 'Criar Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar o template <strong>"{templateToDelete?.name}"</strong>?
              <br /><br />
              <span className="text-red-600 font-medium">
                Esta ação é irreversível e o template será permanentemente eliminado.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A eliminar...
                </>
              ) : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateManager;
