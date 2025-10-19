import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  ScrollText, 
  Calculator, 
  Users, 
  Building2,
  Mail,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Wrench,
  CheckSquare,
  FolderOpen
} from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  const navigationItems = [
    {
      title: 'Painel',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Vista geral do condomínio'
    },
    {
      title: 'Convocatórias',
      href: '/convocatorias',
      icon: FileText,
      description: 'Gestão de assembleias e convocatórias'
    },
    {
      title: 'Actas',
      href: '/actas',
      icon: ScrollText,
      description: 'Redacção e arquivo de actas'
    },
    {
      title: 'Finanças',
      href: '/finanzas',
      icon: Calculator,
      description: 'Gestão financeira e orçamentos'
    },
    {
      title: 'Membros',
      href: '/miembros',
      icon: Users,
      description: 'Proprietários e residentes'
    },
    {
      title: 'Edifícios',
      href: '/edificios',
      icon: Building2,
      description: 'Configuração de edifícios'
    },
    {
      title: 'Documentos',
      href: '/documentos',
      icon: FolderOpen,
      description: 'Gestão de documentos digitais'
    },
    {
      title: 'Comunicações',
      href: '/comunicaciones',
      icon: Mail,
      description: 'Cartas e comunicações'
    },
    {
      title: 'Relatórios',
      href: '/reportes',
      icon: BarChart3,
      description: 'Análises e relatórios'
    },
    {
      title: 'Manutenção',
      href: '/manutencao',
      icon: Wrench,
      description: 'Gestão de manutenção'
    },
    {
      title: 'Tarefas',
      href: '/tarefas',
      icon: CheckSquare,
      description: 'Gestão de tarefas e ações'
    }
  ];

  const secondaryItems = [
    {
      title: 'Configuração',
      href: '/configuracion',
      icon: Settings
    },
    {
      title: 'Ajuda',
      href: '/ayuda',
      icon: HelpCircle
    }
  ];

  return (
    <div className={cn(
      "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Gestor</h1>
              <p className="text-xs text-muted-foreground">Condominios</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="p-2"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && (
                    <div className="flex-1">
                      <div>{item.title}</div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  )}
                  {!collapsed && isActive && (
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="border-t border-border p-2">
        <div className="space-y-1">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && item.title}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-center text-xs text-muted-foreground">
            <p>Gestor Condominios v2.0</p>
            <p className="mt-1">Modo Escuro • Neon DB</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;