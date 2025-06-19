import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Eye, 
  EyeOff,
  TestTube,
  Shield
} from 'lucide-react';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

interface EmailConfigurationProps {
  onConfigured?: (configured: boolean) => void;
}

const EmailConfiguration: React.FC<EmailConfigurationProps> = ({ onConfigured }) => {
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'custom'>('gmail');
  const [config, setConfig] = useState<Partial<EmailConfig>>({});
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [providerExamples, setProviderExamples] = useState<Record<string, any>>({});

  useEffect(() => {
    loadProviderExamples();
  }, []);

  const loadProviderExamples = async () => {
    try {
      const response = await api.request('/email/providers');
      if (response.success) {
        setProviderExamples(response.data);
      }
    } catch (error) {
      console.error('Error loading provider examples:', error);
    }
  };

  const handleProviderChange = (newProvider: 'gmail' | 'outlook' | 'custom') => {
    setProvider(newProvider);
    const example = providerExamples[newProvider] || {};
    setConfig({
      ...example,
      user: '',
      password: '',
      from: ''
    });
    setTestResult(null);
  };

  const handleConfigChange = (field: keyof EmailConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigure = async () => {
    if (!config.user || !config.password) {
      toast.error('Email e password são obrigatórios');
      return;
    }

    setIsConfiguring(true);
    try {
      const configData = provider === 'custom' 
        ? { provider: 'custom', config }
        : { 
            provider, 
            config: { 
              email: config.user, 
              password: config.password 
            } 
          };

      const response = await api.request('/email/configure', {
        method: 'POST',
        body: JSON.stringify(configData)
      });

      if (response.success) {
        setIsConfigured(true);
        toast.success('Serviço de email configurado com sucesso!');
        if (onConfigured) onConfigured(true);
      } else {
        throw new Error(response.error || 'Erro na configuração');
      }
    } catch (error) {
      console.error('Error configuring email:', error);
      toast.error('Erro ao configurar email: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleTestConnection = async () => {
    if (!isConfigured) {
      toast.error('Configure o email primeiro');
      return;
    }

    setIsTesting(true);
    try {
      const response = await api.request('/email/test', {
        method: 'POST'
      });

      setTestResult(response);
      
      if (response.success) {
        toast.success('Conexão de email testada com sucesso!');
      } else {
        toast.error('Falha no teste de conexão: ' + response.error);
      }
    } catch (error) {
      console.error('Error testing email connection:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      setTestResult(errorResult);
      toast.error('Erro no teste: ' + errorResult.error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!isConfigured || !config.user) {
      toast.error('Configure o email primeiro');
      return;
    }

    try {
      const response = await api.request('/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: config.user,
          subject: 'Teste do Sistema Gestor Condominios',
          html: `
            <h2>Teste de Email</h2>
            <p>Este é um email de teste do sistema Gestor Condominios.</p>
            <p>Se recebeu este email, a configuração está funcionando corretamente.</p>
            <p>Data: ${new Date().toLocaleString('pt-PT')}</p>
          `
        })
      });

      if (response.success) {
        toast.success('Email de teste enviado com sucesso!');
      } else {
        toast.error('Erro ao enviar email de teste: ' + response.error);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Erro no envio do email de teste');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Configuração de Email</span>
          {isConfigured && (
            <Badge variant="success" className="ml-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configurado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure o serviço de email para envio de convocatórias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="test" disabled={!isConfigured}>Teste</TabsTrigger>
            <TabsTrigger value="help">Ajuda</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider">Provedor de Email</Label>
                <Select value={provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook/Hotmail</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {provider === 'custom' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="host">Servidor SMTP</Label>
                      <Input
                        id="host"
                        placeholder="smtp.exemplo.com"
                        value={config.host || ''}
                        onChange={(e) => handleConfigChange('host', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="port">Porta</Label>
                      <Input
                        id="port"
                        type="number"
                        placeholder="587"
                        value={config.port || ''}
                        onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="secure"
                      checked={config.secure || false}
                      onCheckedChange={(checked) => handleConfigChange('secure', checked)}
                    />
                    <Label htmlFor="secure">Conexão segura (SSL/TLS)</Label>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="user">Email</Label>
                <Input
                  id="user"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={config.user || ''}
                  onChange={(e) => handleConfigChange('user', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="password">
                  {provider === 'gmail' ? 'App Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={provider === 'gmail' ? 'App Password do Gmail' : 'Sua password'}
                    value={config.password || ''}
                    onChange={(e) => handleConfigChange('password', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {provider === 'gmail' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Para Gmail, use um App Password em vez da password normal
                  </p>
                )}
              </div>

              {provider === 'custom' && (
                <div>
                  <Label htmlFor="from">Email do remetente</Label>
                  <Input
                    id="from"
                    type="email"
                    placeholder="noreply@seudominio.com"
                    value={config.from || ''}
                    onChange={(e) => handleConfigChange('from', e.target.value)}
                  />
                </div>
              )}

              <Button 
                onClick={handleConfigure} 
                disabled={isConfiguring || !config.user || !config.password}
                className="w-full"
              >
                {isConfiguring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Email
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  variant="outline"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                
                <Button 
                  onClick={handleSendTestEmail}
                  disabled={!isConfigured}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email de Teste
                </Button>
              </div>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {testResult.success 
                      ? 'Conexão com o servidor de email está funcionando!'
                      : `Erro na conexão: ${testResult.error}`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Gmail:</strong> Para usar o Gmail, você precisa:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Ativar a verificação em 2 etapas na sua conta Google</li>
                    <li>Gerar um "App Password" nas configurações de segurança</li>
                    <li>Usar esse App Password aqui, não a sua password normal</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Outlook:</strong> Use o seu email e password normalmente.
                  Se tiver 2FA ativado, poderá precisar de uma password de aplicação.
                </AlertDescription>
              </Alert>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Personalizado:</strong> Configure com os detalhes do seu provedor de email.
                  Contacte o suporte técnico do seu provedor se não souber as configurações.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EmailConfiguration;