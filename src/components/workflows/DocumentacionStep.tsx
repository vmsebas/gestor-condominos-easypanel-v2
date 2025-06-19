import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, Download, Eye, Plus } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'presupuesto' | 'informe' | 'contrato' | 'otro';
  description?: string;
  size?: string;
  uploadDate: string;
}

interface DocumentacionStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const DocumentacionStep: React.FC<DocumentacionStepProps> = ({ data, onUpdate, onPrevious, onNext }) => {
  const [documents, setDocuments] = useState<Document[]>(data.documents || []);
  const [newDocument, setNewDocument] = useState({ name: '', type: 'otro', description: '' });

  const documentTypes = [
    { value: 'presupuesto', label: 'Orçamento', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'informe', label: 'Relatório técnico', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'contrato', label: 'Contrato', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { value: 'otro', label: 'Outro documento', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }
  ];

  const addDocument = () => {
    if (!newDocument.name.trim()) return;

    const document: Document = {
      id: Date.now().toString(),
      name: newDocument.name,
      type: newDocument.type as Document['type'],
      description: newDocument.description,
      uploadDate: new Date().toISOString(),
      size: '0 KB' // Simulated
    };

    const updatedDocuments = [...documents, document];
    setDocuments(updatedDocuments);
    onUpdate({ documents: updatedDocuments });
    setNewDocument({ name: '', type: 'otro', description: '' });
  };

  const removeDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    onUpdate({ documents: updatedDocuments });
  };

  const getTypeInfo = (type: string) => {
    return documentTypes.find(t => t.value === type) || documentTypes[3];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Documentación Adjunta</h2>
        <p className="text-muted-foreground">
          Adjunta presupuestos, informes y documentos necesarios para la junta
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Documentos recomendados
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">Para votaciones económicas:</p>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Presupuestos detallados</li>
                  <li>• Informes técnicos de obras</li>
                  <li>• Comparativas de precios</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">Para decisiones importantes:</p>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Contratos de servicios</li>
                  <li>• Normativas aplicables</li>
                  <li>• Actas de juntas anteriores</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos actuales */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos adjuntos ({documents.length})</CardTitle>
            <CardDescription>
              Estos documentos estarán disponibles para los propietarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => {
                const typeInfo = getTypeInfo(doc.type);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{doc.name}</p>
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Subido: {new Date(doc.uploadDate).toLocaleDateString()} • {doc.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario para agregar documento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Agregar Documento</span>
          </CardTitle>
          <CardDescription>
            Sube un nuevo documento o referencia uno existente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="docName">Nombre del documento</Label>
              <Input
                id="docName"
                placeholder="Ej: Presupuesto reparación fachada"
                value={newDocument.name}
                onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="docType">Tipo de documento</Label>
              <select
                id="docType"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={newDocument.type}
                onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="docDescription">Descripción (opcional)</Label>
            <Textarea
              id="docDescription"
              placeholder="Breve descripción del contenido del documento..."
              value={newDocument.description}
              onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Área de subida de archivo simulada */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Arrastra el archivo aquí o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground">
                Formatos soportados: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 10MB)
              </p>
            </div>
            <Button variant="outline" className="mt-4">
              Seleccionar archivo
            </Button>
          </div>

          <Button 
            onClick={addDocument} 
            className="w-full"
            disabled={!newDocument.name.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Documento
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={onNext} variant="workflow" size="lg">
          Continuar
          {documents.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
              {documents.length} docs
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DocumentacionStep;