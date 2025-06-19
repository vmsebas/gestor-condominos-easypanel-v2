import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Settings, MapPin, Home, Loader2, Mail, Phone, MapPin as MapPinIcon } from 'lucide-react';
import { useBuildings } from '@/hooks/useNeonData';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const Edificios: React.FC = () => {
  const { data: buildingsData, isLoading, error } = useBuildings();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">A carregar edifícios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>Erro ao carregar os edifícios: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edifícios</h1>
          <p className="text-muted-foreground mt-1">
            Configuração e gestão de edifícios
          </p>
        </div>
        <Button size="lg" variant="workflow">
          <Plus className="h-5 w-5 mr-2" />
          Novo Edifício
        </Button>
      </div>

      {buildingsData && buildingsData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildingsData.map((building) => (
            <Card key={building.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{building.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {building.address}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-32 text-muted-foreground">Código Postal</div>
                    <div>{building.postal_code} {building.city}</div>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-32 text-muted-foreground">Administrador</div>
                    <div>{building.administrator}</div>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-32 text-muted-foreground">Contacto</div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {building.admin_contact}
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-32 text-muted-foreground">Email</div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {building.admin_email}
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-32 text-muted-foreground">IBAN</div>
                    <div>{building.iban}</div>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-32 text-muted-foreground">Banco</div>
                    <div>{building.bank}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm text-muted-foreground">
                  <span>{building.number_of_units} unidades</span>
                  <span>Atualizado em {format(new Date(building.updated_at), 'PP', { locale: pt })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            Nenhum edifício encontrado
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Adicione um novo edifício para começar a gerir o seu condomínio
          </p>
        </div>
      )}
    </div>
  );

};

export default Edificios;