import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Upload,
  Download,
  Search,
  Filter,
  FolderOpen,
  FileText,
  File,
  Image,
  Calculator,
  Scale,
  Users,
  Building2,
  Shield,
  Mail,
  Trash2,
  Eye,
  MoreHorizontal,
  Plus,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  Tag,
  Share,
  Edit,
  AlertCircle
} from 'lucide-react';
import { STORED_DOCUMENT_CATEGORY_CONFIG } from '@/types/documentTypes';
import { useBuildings, useDocuments, useUploadDocument, useUpdateDocument, useDeleteDocument, useMembers } from '@/hooks/useNeonData';
import { toast } from 'sonner';

// Dados mock removidos - agora usando dados reais da base de dados

const DocumentsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);

  // Dados reais
  const { data: buildings, isLoading: buildingsLoading, error: buildingsError } = useBuildings();
  const { data: members } = useMembers();
  
  // Estado do formulário de upload
  const [uploadForm, setUploadForm] = useState({
    building_id: '',
    name: '',
    category: 'general',
    tags: '',
    description: '',
    visibility: 'building',
    is_confidential: false,
    member_id: '', // Add member association
    file: null as File | null
  });

  // Get documents for selected building
  const { data: documents = [], isLoading: documentsLoading, error: documentsError } = useDocuments({
    buildingId: uploadForm.building_id || buildings?.[0]?.id,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchTerm || undefined,
  });
  
  // Mutations
  const uploadMutation = useUploadDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();

  // Auto-select first building when buildings load
  useEffect(() => {
    if (buildings && buildings.length > 0 && !uploadForm.building_id) {
      setUploadForm(prev => ({ ...prev, building_id: buildings[0].id }));
    }
  }, [buildings, uploadForm.building_id]);

  // Os documentos já vêm filtrados do servidor baseado nos parâmetros
  const filteredDocuments = documents;

  // Ordenar documentos
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
        break;
      case 'size':
        comparison = a.file_size - b.file_size;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Función para obtener icono del archivo
  const getFileIcon = (extension: string) => {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <Calculator className="h-8 w-8 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  // Función para obtener color de la categoría
  const getCategoryInfo = (category: string) => {
    return STORED_DOCUMENT_CATEGORY_CONFIG[category as keyof typeof STORED_DOCUMENT_CATEGORY_CONFIG] || 
           STORED_DOCUMENT_CATEGORY_CONFIG.general;
  };

  // Función para manejar drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadForm(prev => ({ ...prev, file: files[0] }));
      setIsUploadDialogOpen(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Função para fazer upload ou atualizar documento
  const handleUploadDocument = async () => {
    if (isEditMode) {
      // Update existing document (metadata only)
      if (!uploadForm.name || !uploadForm.building_id) {
        return;
      }

      try {
        const updateData = {
          name: uploadForm.name,
          category: uploadForm.category,
          description: uploadForm.description,
          visibility: uploadForm.visibility,
          is_confidential: uploadForm.is_confidential,
          tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : []
        };

        await updateMutation.mutateAsync({ id: editingDocument.id, data: updateData });
        
        toast.success('Documento atualizado!', {
          description: `"${uploadForm.name}" foi atualizado com sucesso.`
        });
        
        // Reset form and close dialog
        setUploadForm({
          building_id: uploadForm.building_id,
          name: '',
          category: 'general',
          tags: '',
          description: '',
          visibility: 'building',
          is_confidential: false,
          file: null
        });
        setIsEditMode(false);
        setEditingDocument(null);
        setIsUploadDialogOpen(false);
      } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        toast.error('Erro ao atualizar documento', {
          description: 'Ocorreu um erro ao atualizar o documento. Tente novamente.'
        });
      }
    } else {
      // Upload new document
      if (!uploadForm.file || !uploadForm.name || !uploadForm.building_id) {
        return;
      }

      // Criar FormData para upload real do ficheiro
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('building_id', uploadForm.building_id);
      formData.append('name', uploadForm.name);
      formData.append('category', uploadForm.category);
      formData.append('description', uploadForm.description);
      formData.append('visibility', uploadForm.visibility);
      formData.append('is_confidential', uploadForm.is_confidential.toString());
      formData.append('uploaded_by', 'Utilizador Atual');
      if (uploadForm.member_id) {
        formData.append('member_id', uploadForm.member_id);
      }

      try {
        await uploadMutation.mutateAsync(formData);
        
        toast.success('Documento carregado!', {
          description: `"${uploadForm.name}" foi carregado com sucesso.`
        });
        
        // Limpar formulário e fechar diálogo
        setUploadForm({
          building_id: uploadForm.building_id, // Manter building selecionado
          name: '',
          category: 'general',
          tags: '',
          description: '',
          visibility: 'building',
          is_confidential: false,
          member_id: '', // Reset member association
          file: null
        });
        setIsUploadDialogOpen(false);
      } catch (error) {
        console.error('Erro ao carregar documento:', error);
        toast.error('Erro ao carregar documento', {
          description: 'Ocorreu um erro ao carregar o documento. Tente novamente.'
        });
      }
    }
  };

  // Função para eliminar documento
  const handleDeleteDocument = async (documentId: number) => {
    if (confirm('Tem certeza que deseja eliminar este documento?')) {
      try {
        await deleteMutation.mutateAsync(documentId);
        toast.success('Documento eliminado', {
          description: 'O documento foi eliminado com sucesso.'
        });
      } catch (error) {
        console.error('Erro ao eliminar documento:', error);
        toast.error('Erro ao eliminar documento', {
          description: 'Ocorreu um erro ao eliminar o documento. Tente novamente.'
        });
      }
    }
  };

  // Função para transferir documento
  const handleDownloadDocument = (doc: any) => {
    console.log('A transferir documento:', doc.name);
    
    toast.success('Download iniciado', {
      description: `A transferir "${doc.name}"`
    });
    
    // Use the real file path served by the backend
    const downloadUrl = `${doc.file_path}`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = doc.original_name || doc.name;
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para pré-visualizar documento
  const handlePreviewDocument = (doc: any) => {
    console.log('A abrir pré-visualização:', doc.name);
    
    // Use the real file path served by the backend
    const previewUrl = `${doc.file_path}`;
    
    // Para PDFs e imagens, abrir em nova janela
    if (['pdf'].includes(doc.file_extension.toLowerCase())) {
      toast.info('A abrir pré-visualização', {
        description: `A abrir "${doc.name}" numa nova janela`
      });
      window.open(previewUrl, '_blank');
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(doc.file_extension.toLowerCase())) {
      toast.info('A abrir pré-visualização', {
        description: `A abrir "${doc.name}" numa nova janela`
      });
      window.open(previewUrl, '_blank');
    } else {
      toast.warning('Pré-visualização não disponível', {
        description: 'Use a opção "Transferir" para descarregar o ficheiro.'
      });
    }
  };

  // Função para partilhar documento
  const handleShareDocument = (doc: any) => {
    console.log('A partilhar documento:', doc.name);
    
    // Gerar link de partilha (em produção seria um token de acesso)
    const shareUrl = `${window.location.origin}/documents/shared/${doc.id}`;
    
    // Copiar para clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Link copiado!', {
        description: 'Link de partilha copiado para o clipboard.'
      });
    }).catch(() => {
      // Fallback se clipboard API não estiver disponível
      toast.info('Link de partilha', {
        description: shareUrl,
        duration: 10000
      });
    });
  };

  // Função para editar documento
  const handleEditDocument = (doc: any) => {
    console.log('A editar documento:', doc.name);
    
    toast.info('Modo de edição', {
      description: 'A abrir formulário de edição de documento.'
    });
    
    // Pré-preencher formulário com dados do documento
    setUploadForm({
      building_id: doc.building_id.toString(),
      name: doc.name,
      category: doc.category,
      tags: Array.isArray(doc.tags) ? doc.tags.join(', ') : '',
      description: doc.description || '',
      visibility: doc.visibility,
      is_confidential: doc.is_confidential,
      file: null // Não é possível editar o ficheiro, apenas metadata
    });
    
    // Set edit mode and document being edited
    setIsEditMode(true);
    setEditingDocument(doc);
    setIsUploadDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Gestão de Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Carregue, organize e faça a gestão de todos os documentos do condomínio
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Carregar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Editar Documento' : 'Carregar Novo Documento'}</DialogTitle>
                <DialogDescription>
                  {isEditMode 
                    ? 'Edite a informação do documento (o ficheiro não pode ser alterado)'
                    : 'Complete a informação e seleccione o ficheiro a carregar'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Formulario de upload */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="building">Edifício</Label>
                    <Select value={uploadForm.building_id} onValueChange={(value) => 
                      setUploadForm(prev => ({ ...prev, building_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar edifício" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildingsLoading && (
                          <SelectItem value="loading" disabled>
                            A carregar edifícios...
                          </SelectItem>
                        )}
                        {buildingsError && (
                          <SelectItem value="error" disabled>
                            Erro ao carregar edifícios
                          </SelectItem>
                        )}
                        {buildings?.map((building: any) => (
                          <SelectItem key={building.id} value={building.id.toString()}>
                            {building.name}
                          </SelectItem>
                        ))}
                        {!buildingsLoading && !buildings?.length && (
                          <SelectItem value="empty" disabled>
                            Não há edifícios disponíveis
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do documento</Label>
                    <Input
                      id="name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Apólice de seguro 2024"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={uploadForm.category} onValueChange={(value) => 
                      setUploadForm(prev => ({ ...prev, category: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STORED_DOCUMENT_CATEGORY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibilidade</Label>
                    <Select value={uploadForm.visibility} onValueChange={(value) => 
                      setUploadForm(prev => ({ ...prev, visibility: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="building">Apenas edifício</SelectItem>
                        <SelectItem value="members_only">Apenas membros</SelectItem>
                        <SelectItem value="admin_only">Apenas administradores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Member Association */}
                <div className="space-y-2">
                  <Label htmlFor="member">Membro Associado (Opcional)</Label>
                  <Select value={uploadForm.member_id} onValueChange={(value) => 
                    setUploadForm(prev => ({ ...prev, member_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar membro (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <span className="text-muted-foreground">Nenhum membro específico</span>
                      </SelectItem>
                      {members?.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{member.name}</span>
                            <span className="text-muted-foreground">({member.apartment})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Associe este documento a um membro específico se for relevante apenas para ele
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiquetas (separadas por vírgulas)</Label>
                  <Input
                    id="tags"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Ex: seguro, anual, 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição opcional do documento"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={uploadForm.is_confidential}
                    onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, is_confidential: checked }))}
                  />
                  <Label>Documento confidencial</Label>
                </div>

                {/* Área de drag and drop - only show in upload mode */}
                {!isEditMode && (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Arraste o ficheiro aqui</p>
                    <p className="text-sm text-muted-foreground">ou clique para seleccionar</p>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.rtf,.odt,.ods"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadForm(prev => ({ 
                            ...prev, 
                            file,
                            name: prev.name || file.name.split('.')[0] // Auto-populate name if empty
                          }));
                        }
                      }}
                    />
                    {uploadForm.file && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="font-medium">{uploadForm.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Show current file info in edit mode */}
                {isEditMode && editingDocument && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(editingDocument.file_extension)}
                      <div>
                        <p className="font-medium">Ficheiro actual: {editingDocument.original_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {editingDocument.file_size_formatted} • {editingDocument.file_extension.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => {
                    setIsUploadDialogOpen(false);
                    setIsEditMode(false);
                    setEditingDocument(null);
                  }}>
                    Cancelar
                  </Button>
                  <Button 
                    disabled={
                      isEditMode 
                        ? (!uploadForm.name || !uploadForm.building_id || updateMutation.isPending)
                        : (!uploadForm.file || !uploadForm.name || !uploadForm.building_id || uploadMutation.isPending)
                    }
                    onClick={handleUploadDocument}
                  >
                    {isEditMode 
                      ? (updateMutation.isPending ? 'A atualizar...' : 'Atualizar Documento')
                      : (uploadMutation.isPending ? 'A carregar...' : 'Carregar Documento')
                    }
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filtros e pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Procurar documentos..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(STORED_DOCUMENT_CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="size">Tamanho</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {documentsLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">A carregar documentos...</div>
        </div>
      )}

      {/* Error state */}
      {documentsError && (
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar documentos</h3>
          <p className="text-muted-foreground">
            {documentsError.message || 'Ocorreu um erro inesperado'}
          </p>
        </div>
      )}

      {/* Lista de documentos */}
      {!documentsLoading && !documentsError && viewMode === 'grid' ? (
        // Vista em grelha
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedDocuments.map((doc, index) => {
            const categoryInfo = getCategoryInfo(doc.category);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {getFileIcon(doc.file_extension)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Transferir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreviewDocument(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Pré-visualização
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareDocument(doc)}>
                            <Share className="h-4 w-4 mr-2" />
                            Partilhar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDocument(doc)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium truncate" title={doc.name}>
                          {doc.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate" title={doc.description}>
                          {doc.description || 'Sem descrição'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 flex-wrap">
                        <Badge style={{ backgroundColor: categoryInfo.color }} className="text-white">
                          {categoryInfo.label}
                        </Badge>
                        {doc.is_confidential && (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            <Shield className="h-3 w-3 mr-1" />
                            Confidencial
                          </Badge>
                        )}
                        {doc.member_id && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            <Users className="h-3 w-3 mr-1" />
                            Membro específico
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{doc.file_size_formatted}</span>
                        <span>{formatDate(doc.uploaded_at)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>
                          <Download className="h-4 w-4 inline mr-1" />
                          {doc.download_count}
                        </span>
                        <span className="text-muted-foreground">
                          {doc.uploaded_by}
                        </span>
                      </div>

                      {doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {doc.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{doc.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Botões de ação rápida */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePreviewDocument(doc)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                            className="h-8 px-2"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleShareDocument(doc)}
                            className="h-8 px-2"
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditDocument(doc)}
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // Vista em lista
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Carregado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Transferências</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDocuments.map((doc) => {
                const categoryInfo = getCategoryInfo(doc.category);
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(doc.file_extension)}
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {doc.description || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Badge style={{ backgroundColor: categoryInfo.color }} className="text-white">
                          {categoryInfo.label}
                        </Badge>
                        {doc.is_confidential && (
                          <Shield className="h-4 w-4 text-red-600" />
                        )}
                        {doc.member_id && (
                          <Users className="h-4 w-4 text-blue-600" title="Documento associado a membro específico" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{doc.file_size_formatted}</TableCell>
                    <TableCell>{doc.uploaded_by}</TableCell>
                    <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                    <TableCell>{doc.download_count}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Transferir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreviewDocument(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Pré-visualização
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareDocument(doc)}>
                            <Share className="h-4 w-4 mr-2" />
                            Partilhar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDocument(doc)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Estado vazio */}
      {!documentsLoading && !documentsError && sortedDocuments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Não há documentos</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Não foram encontrados documentos com os filtros aplicados'
              : 'Carregue o seu primeiro documento para começar'
            }
          </p>
          {(!searchTerm && selectedCategory === 'all') && (
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Carregar Primeiro Documento
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DocumentsPage;