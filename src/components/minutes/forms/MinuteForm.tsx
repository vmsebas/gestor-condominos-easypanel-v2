import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBuilding } from '@/hooks/useBuilding';
import membersService from '@/utils/db/membersService';
import { Minute, AgendaItem, VotingResult } from '@/types/minutesTypes';
import { Member } from '@/types/memberTypes';
import { formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Users, 
  FileText, 
  Vote,
  Clock,
  MapPin
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface MinuteFormProps {
  minute?: Minute;
  onSubmit: (data: Partial<Minute>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const agendaItemSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['discussion', 'voting', 'informative']),
  duration: z.number().optional(),
  presenter: z.string().optional(),
  voting: z.object({
    question: z.string().optional(),
    votesFor: z.number().optional(),
    votesAgainst: z.number().optional(),
    abstentions: z.number().optional(),
    result: z.enum(['approved', 'rejected', 'pending']).optional()
  }).optional()
});

const minuteFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  type: z.enum(['ordinary', 'extraordinary', 'urgent']),
  meetingDate: z.string().min(1, 'Data é obrigatória'),
  startTime: z.string().min(1, 'Hora de início é obrigatória'),
  endTime: z.string().optional(),
  location: z.string().min(1, 'Local é obrigatório'),
  description: z.string().optional(),
  attendees: z.array(z.string()),
  agendaItems: z.array(agendaItemSchema),
  decisions: z.string().optional(),
  nextActions: z.string().optional(),
  status: z.enum(['draft', 'approved', 'published']).default('draft')
});

type MinuteFormData = z.infer<typeof minuteFormSchema>;

const MinuteForm: React.FC<MinuteFormProps> = ({
  minute,
  onSubmit,
  onCancel,
  className
}) => {
  const { currentBuilding } = useBuilding();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const isEditing = !!minute;

  const form = useForm<MinuteFormData>({
    resolver: zodResolver(minuteFormSchema),
    defaultValues: {
      title: minute?.title || '',
      type: minute?.type || 'ordinary',
      meetingDate: minute?.meetingDate ? minute.meetingDate.split('T')[0] : '',
      startTime: minute?.startTime || '',
      endTime: minute?.endTime || '',
      location: minute?.location || '',
      description: minute?.description || '',
      attendees: minute?.attendees || [],
      agendaItems: minute?.agendaItems || [
        {
          title: 'Abertura da sessão',
          type: 'informative',
          description: 'Verificação do quórum e abertura da reunião'
        }
      ],
      decisions: minute?.decisions || '',
      nextActions: minute?.nextActions || '',
      status: minute?.status || 'draft'
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, control, watch } = form;
  
  const { fields: agendaFields, append: appendAgenda, remove: removeAgenda } = useFieldArray({
    control,
    name: 'agendaItems'
  });

  // Carregar membros
  useEffect(() => {
    const loadMembers = async () => {
      if (!currentBuilding?.id) return;

      try {
        setIsLoadingMembers(true);
        const data = await membersService.getMembers(currentBuilding.id);
        setMembers(data);
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [currentBuilding?.id]);

  const watchedValues = watch();

  const handleFormSubmit = async (data: MinuteFormData) => {
    try {
      const attendeesCount = data.attendees.length;
      
      await onSubmit({
        ...data,
        buildingId: currentBuilding?.id,
        attendeesCount,
        createdAt: minute?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  const addAgendaItem = () => {
    appendAgenda({
      title: '',
      type: 'discussion',
      description: ''
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      ordinary: 'Ordinária',
      extraordinary: 'Extraordinária',
      urgent: 'Urgente'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMeetingDuration = () => {
    if (watchedValues.startTime && watchedValues.endTime) {
      const start = new Date(`2000-01-01 ${watchedValues.startTime}`);
      const end = new Date(`2000-01-01 ${watchedValues.endTime}`);
      const diff = end.getTime() - start.getTime();
      const minutes = diff / (1000 * 60);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return null;
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="participants">Participantes</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="decisions">Decisões</TabsTrigger>
            </TabsList>

            {/* Informações Básicas */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Dados da Reunião
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Título */}
                  <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Ata *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Assembleia Geral Ordinária - Janeiro 2024"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Nome identificativo da reunião
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tipo e Data */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Reunião *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ordinary">Ordinária</SelectItem>
                              <SelectItem value="extraordinary">Extraordinária</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="meetingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Reunião *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Salão do edifício"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Horários */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Início *</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Fim</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormDescription>
                            {getMeetingDuration() && `Duração: ${getMeetingDuration()}`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Descrição */}
                  <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição geral da reunião (opcional)"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status (apenas para edição) */}
                  {isEditing && (
                    <FormField
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status da Ata</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="approved">Aprovada</SelectItem>
                              <SelectItem value="published">Publicada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Participantes */}
            <TabsContent value="participants" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participantes da Reunião
                    <Badge variant="secondary">
                      {watchedValues.attendees?.length || 0} selecionados
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={control}
                    name="attendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membros Presentes</FormLabel>
                        <FormDescription className="mb-4">
                          Selecione os membros que estiveram presentes na reunião
                        </FormDescription>
                        
                        {isLoadingMembers ? (
                          <LoadingSpinner />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                            {members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={field.value?.includes(member.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedAttendees = checked
                                      ? [...(field.value || []), member.id]
                                      : (field.value || []).filter(id => id !== member.id);
                                    field.onChange(updatedAttendees);
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{member.name}</p>
                                  <div className="flex items-center gap-2">
                                    {member.apartment && (
                                      <Badge variant="outline" className="text-xs">
                                        {member.apartment}
                                      </Badge>
                                    )}
                                    <Badge 
                                      variant={member.type === 'owner' ? 'default' : 'secondary'} 
                                      className="text-xs"
                                    >
                                      {member.type === 'owner' ? 'Proprietário' : 'Inquilino'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agenda */}
            <TabsContent value="agenda" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5" />
                      Ordem do Dia
                      <Badge variant="secondary">
                        {agendaFields.length} itens
                      </Badge>
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={addAgendaItem}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agendaFields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <Badge variant="outline">Item {index + 1}</Badge>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAgenda(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={control}
                              name={`agendaItems.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Título *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Ex: Aprovação do orçamento"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={control}
                              name={`agendaItems.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tipo</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="discussion">Discussão</SelectItem>
                                      <SelectItem value="voting">Votação</SelectItem>
                                      <SelectItem value="informative">Informativo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={control}
                            name={`agendaItems.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Detalhes do item da agenda"
                                    className="resize-none"
                                    rows={2}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Decisões */}
            <TabsContent value="decisions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Decisões e Ações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={control}
                    name="decisions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decisões Tomadas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Resume das principais decisões da reunião..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Principais deliberações e resoluções aprovadas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="nextActions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próximas Ações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ações a serem realizadas após a reunião..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Compromissos e tarefas para implementação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Resumo */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Resumo da Ata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reunião:</p>
                  <p className="font-medium">
                    {getTypeLabel(watchedValues.type)} - {watchedValues.title || 'Sem título'}
                  </p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Data e Hora:</p>
                  <p className="font-medium">
                    {watchedValues.meetingDate ? formatDate(watchedValues.meetingDate) : 'Não definida'}
                    {watchedValues.startTime && ` às ${watchedValues.startTime}`}
                  </p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Participantes:</p>
                  <p className="font-medium">{watchedValues.attendees?.length || 0} membros</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-muted-foreground text-sm">Itens da Agenda:</p>
                <p className="font-medium">{agendaFields.length} itens programados</p>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" variant="white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? 'Atualizar Ata' : 'Criar Ata'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MinuteForm;