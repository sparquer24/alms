import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AdminSectionSkeleton } from '@/components/admin';
import { AdminBorderRadius } from '@/styles/admin-design-system';

const ResponsiveContainerFixed: any = ResponsiveContainer;
const PieChartFixed: any = PieChart;
const PieFixed: any = Pie;
const CellFixed: any = Cell;
const TooltipFixed: any = Tooltip;
const LegendFixed: any = Legend;

const COLORS = ['#6366F1', '#F59E42', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

export const RoleLoadChart: React.FC<{
  data: any[];
  colors: any;
  loading?: boolean;
}> = ({ data, colors, loading }) => {
  if (loading) return <AdminSectionSkeleton lines={5} height='400px' />;

  return (
    <div style={{ width: '100%', height: '350px' }}>
      <ResponsiveContainerFixed width='100%' height='100%'>
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
      </ResponsiveContainerFixed>
    </div>
  );
};

export default RoleLoadChart;
