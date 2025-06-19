import React, { useState } from 'react';
import { Member } from '@/types/memberTypes';
import { useMembers, useMembersStats } from '@/hooks/useMembers';
import { useBuilding } from '@/hooks/useBuilding';
import { formatCurrency } from '@/utils/formatters';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  Home, 
  Euro, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

import MembersList from './MembersList';
import MemberCard from './MemberCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';

interface MembersContainerProps {
  className?: string;
}

const MembersContainer: React.FC<MembersContainerProps> = ({ className }) => {
  const { currentBuilding } = useBuilding();
  const { totalCount } = useMembers();
  const { stats, isLoading: statsLoading } = useMembersStats();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    trend?: 'up' | 'down' | 'stable';
    variant?: 'default' | 'success' | 'warning' | 'destructive';
  }> = ({ title, value, icon, description, trend, variant = 'default' }) => {
    const variantStyles = {
      default: 'text-foreground',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      destructive: 'text-red-600'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className={`text-2xl font-bold ${variantStyles[variant]}`}>
                {value}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <div className={`p-2 rounded-full bg-muted ${variantStyles[variant]}`}>
              {icon}
            </div>
          </div>
          {trend && (
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className={`h-3 w-3 mr-1 ${
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 
                'text-gray-500'
              }`} />
              <span className="text-muted-foreground">vs. período anterior</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir os seus membros.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary level="section">
      <div className={`space-y-6 ${className}`}>
        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <LoadingSpinner size="sm" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Total de Membros"
                value={stats?.total || totalCount || 0}
                icon={<Users className="h-5 w-5" />}
                description="Membros registados"
              />
              
              <StatCard
                title="Proprietários"
                value={stats?.owners || 0}
                icon={<UserCheck className="h-5 w-5" />}
                description="Proprietários ativos"
                variant="success"
              />
              
              <StatCard
                title="Residentes"
                value={stats?.residents || 0}
                icon={<Home className="h-5 w-5" />}
                description="Membros residentes"
                variant="default"
              />
              
              <StatCard
                title="Quota Total"
                value={formatCurrency(stats?.totalQuota || 0)}
                icon={<Euro className="h-5 w-5" />}
                description="Soma das quotas mensais"
                variant="success"
              />
            </>
          )}
        </div>

        {/* Conteúdo Principal */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lista de Membros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <MembersList onMemberSelect={setSelectedMember} />
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes do Membro */}
        <Dialog 
          open={!!selectedMember} 
          onOpenChange={(open) => !open && setSelectedMember(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Membro</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="mt-4">
                <MemberCard 
                  member={selectedMember} 
                  showActions={true}
                  compact={false}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default MembersContainer;