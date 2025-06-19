import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';

interface ChartData {
  name: string;
  value: number;
  fill?: string;
  [key: string]: any;
}

interface FinancialChartProps {
  data: ChartData[];
  type: 'bar' | 'pie' | 'line' | 'area';
  height?: number;
  showLegend?: boolean;
  colors?: string[];
  className?: string;
}

const FinancialChart: React.FC<FinancialChartProps> = ({
  data,
  type,
  height = 300,
  showLegend = true,
  colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'],
  className
}) => {
  const customTooltip = (props: any) => {
    const { active, payload, label } = props;
    
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const pieTooltip = (props: any) => {
    const { active, payload } = props;
    
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            Valor: {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip content={customTooltip} />
        {showLegend && <Legend />}
        <Bar 
          dataKey="value" 
          fill={colors[0]}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={height / 3}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill || colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip content={pieTooltip} />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip content={customTooltip} />
        {showLegend && <Legend />}
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip content={customTooltip} />
        {showLegend && <Legend />}
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={colors[0]}
          fill={colors[0]}
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className={className}>
      {renderChart()}
    </div>
  );
};

// Componentes específicos pré-configurados

export const RevenueExpenseChart: React.FC<{
  revenues: number;
  expenses: number;
  className?: string;
}> = ({ revenues, expenses, className }) => {
  const data = [
    { name: 'Receitas', value: revenues, fill: '#22c55e' },
    { name: 'Despesas', value: expenses, fill: '#ef4444' }
  ];

  return (
    <FinancialChart
      data={data}
      type="pie"
      height={250}
      className={className}
    />
  );
};

export const MonthlyTrendChart: React.FC<{
  monthlyData: Array<{ month: string; income: number; expenses: number; }>;
  className?: string;
}> = ({ monthlyData, className }) => {
  const data = monthlyData.map(item => ({
    name: item.month,
    Receitas: item.income,
    Despesas: item.expenses,
    Saldo: item.income - item.expenses
  }));

  return (
    <ResponsiveContainer width="100%" height={300} className={className}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip 
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Bar dataKey="Receitas" fill="#22c55e" radius={[2, 2, 0, 0]} />
        <Bar dataKey="Despesas" fill="#ef4444" radius={[2, 2, 0, 0]} />
        <Bar dataKey="Saldo" fill="#3b82f6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const CategoryChart: React.FC<{
  categories: Array<{ name: string; amount: number; }>;
  type?: 'pie' | 'bar';
  className?: string;
}> = ({ categories, type = 'pie', className }) => {
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
  
  const data = categories.map((cat, index) => ({
    name: cat.name,
    value: cat.amount,
    fill: colors[index % colors.length]
  }));

  return (
    <FinancialChart
      data={data}
      type={type}
      height={300}
      className={className}
      colors={colors}
    />
  );
};

export const BudgetExecutionChart: React.FC<{
  budget: number;
  executed: number;
  className?: string;
}> = ({ budget, executed, className }) => {
  const remaining = Math.max(0, budget - executed);
  const overBudget = Math.max(0, executed - budget);
  
  const data = [
    { name: 'Executado', value: Math.min(executed, budget), fill: '#3b82f6' },
    { name: 'Disponível', value: remaining, fill: '#22c55e' },
    ...(overBudget > 0 ? [{ name: 'Excesso', value: overBudget, fill: '#ef4444' }] : [])
  ];

  return (
    <FinancialChart
      data={data}
      type="pie"
      height={250}
      className={className}
    />
  );
};

export default FinancialChart;