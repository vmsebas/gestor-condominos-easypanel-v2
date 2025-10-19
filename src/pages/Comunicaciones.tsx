import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Plus, Send, FileText, Users, Clock, CheckCircle } from 'lucide-react';

interface Letter {
  id: string;
  type: 'incumprimento' | 'aviso' | 'informativa' | 'legal';
  title: string;
  recipient: string;
  status: 'draft' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  sentAt?: string;
}

const Comunicaciones: React.FC = () => {
  // A implementar com dados reais da base de dados
  const [letters] = useState<Letter[]>([]);

  // A implementar com dados reais da base de dados
  const templates: any[] = [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'sent':
        return <Badge variant="info">Enviada</Badge>;
      case 'delivered':
        return <Badge variant="success">Entregue</Badge>;
      case 'read':
        return <Badge variant="success">Lida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'incumprimento':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'aviso':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'informativa':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'legal':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incumprimento':
        return <Mail className="h-4 w-4" />;
      case 'aviso':
        return <MessageSquare className="h-4 w-4" />;
      case 'informativa':
        return <FileText className="h-4 w-4" />;
      case 'legal':
        return <FileText className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comunicações</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de cartas e comunicações oficiais
          </p>
        </div>
        <Button size="lg" variant="workflow">
          <Plus className="h-5 w-5 mr-2" />
          Nova Carta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{letters.length}</p>
                <p className="text-sm text-muted-foreground">Cartas enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{letters.filter(l => l.status === 'delivered').length}</p>
                <p className="text-sm text-muted-foreground">Entregues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{letters.filter(l => l.status === 'sent').length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Modelos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="letters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="letters">Cartas Enviadas</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
          <TabsTrigger value="bulk">Envio Massivo</TabsTrigger>
        </TabsList>

        <TabsContent value="letters">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Cartas</CardTitle>
              <CardDescription>
                Todas as comunicações enviadas aos proprietários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {letters.map((letter) => (
                  <div
                    key={letter.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getTypeColor(letter.type)}`}>
                        {getTypeIcon(letter.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{letter.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>Para: {letter.recipient}</span>
                          <span>•</span>
                          <span>Criada: {new Date(letter.createdAt).toLocaleDateString()}</span>
                          {letter.sentAt && (
                            <>
                              <span>•</span>
                              <span>Enviada: {new Date(letter.sentAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getTypeColor(letter.type)} border-0`}>
                        {letter.type === 'incumprimento' ? 'Incumprimento' :
                         letter.type === 'aviso' ? 'Aviso' :
                         letter.type === 'informativa' ? 'Informativa' :
                         letter.type === 'legal' ? 'Legal' : letter.type}
                      </Badge>
                      {getStatusBadge(letter.status)}
                      <Button variant="ghost" size="sm">
                        Ver carta
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Modelos de Cartas</CardTitle>
              <CardDescription>
                Modelos predefinidos para diferentes tipos de comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">
                          {template.usage} utilizações
                        </Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge className={`${getTypeColor(template.category)} border-0`}>
                          {template.category === 'incumprimento' ? 'Incumprimento' :
                           template.category === 'aviso' ? 'Aviso' :
                           template.category === 'informativa' ? 'Informativa' :
                           template.category === 'legal' ? 'Legal' : template.category}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Pré-visualizar
                          </Button>
                          <Button variant="default" size="sm">
                            Usar modelo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Envio Massivo</CardTitle>
              <CardDescription>
                Enviar comunicações a múltiplos proprietários simultaneamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                  Função de Envio Massivo
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Brevemente disponível - Envio simultâneo a múltiplos destinatários com personalização automática
                </p>
                <Button className="mt-4" variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Brevemente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Comunicaciones;