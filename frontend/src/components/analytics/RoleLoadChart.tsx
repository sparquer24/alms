import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { AdminSectionSkeleton } from '@/components/admin';
import { AdminBorderRadius } from '@/styles/admin-design-system';

const ResponsiveContainerFixed: any = ResponsiveContainer;
const BarChartFixed: any = BarChart;
const BarFixed: any = Bar;
const XAxisFixed: any = XAxis;
const YAxisFixed: any = YAxis;
const TooltipFixed: any = Tooltip;
const CartesianGridFixed: any = CartesianGrid;
const LegendFixed: any = Legend;
const PieChartFixed: any = PieChart;
const PieFixed: any = Pie;
const CellFixed: any = Cell;

const COLORS = ['#6366F1', '#F59E42', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

export const RoleLoadChart: React.FC<{
  data: any[];
  colors: any;
  loading?: boolean;
}> = ({ data, colors, loading }) => {
  if (loading) return <AdminSectionSkeleton lines={5} height='400px' />;

  const hasBreakdown = data.some((d: any) => d.fresh !== undefined || d.renewal !== undefined);

  return (
    <div style={{ width: '100%', height: '350px' }}>
      <ResponsiveContainerFixed width='100%' height='100%'>
        {hasBreakdown ? (
          <BarChartFixed
            data={data}
            layout='vertical'
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGridFixed stroke={colors.border} />
            <XAxisFixed type='number' stroke={colors.text.secondary} />
            <YAxisFixed dataKey='name' type='category' stroke={colors.text.secondary} width={100} />
            <TooltipFixed
              contentStyle={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.text.primary,
                borderRadius: AdminBorderRadius.md,
              }}
            />
            <LegendFixed />
            <BarFixed dataKey='fresh' name='Fresh' stackId='a' fill={colors.status.info} />
            <BarFixed dataKey='renewal' name='Renewal' stackId='a' fill={colors.status.success} />
          </BarChartFixed>
        ) : (
          <PieChartFixed>
            <PieFixed
              data={data}
              dataKey='value'
              nameKey='name'
              cx='50%'
              cy='50%'
              outerRadius={100}
              fill='#8884d8'
              label={({ name, value }: any) => `${name}: ${value}`}
            >
              {data.map((entry, idx) => (
                <CellFixed key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </PieFixed>
            <TooltipFixed
              contentStyle={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.text.primary,
                borderRadius: AdminBorderRadius.md,
              }}
            />
            <LegendFixed />
          </PieChartFixed>
        )}
      </ResponsiveContainerFixed>
    </div>
  );
};

export default RoleLoadChart;
