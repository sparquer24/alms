import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AdminSectionSkeleton } from '@/components/admin';
import { AdminBorderRadius } from '@/styles/admin-design-system';

const ResponsiveContainerFixed: any = ResponsiveContainer;
const BarChartFixed: any = BarChart;
const BarFixed: any = Bar;
const XAxisFixed: any = XAxis;
const YAxisFixed: any = YAxis;
const TooltipFixed: any = Tooltip;
const CartesianGridFixed: any = CartesianGrid;

export const TimelineChart: React.FC<{
  data: any[];
  colors: any;
  loading?: boolean;
}> = ({ data, colors, loading }) => {
  if (loading) return <AdminSectionSkeleton lines={5} height='300px' />;

  return (
    <div style={{ width: '100%', height: '350px' }}>
      <ResponsiveContainerFixed width='100%' height='100%'>
        <BarChartFixed data={data}>
          <CartesianGridFixed stroke={colors.border} />
          <XAxisFixed dataKey='week' stroke={colors.text.secondary} />
          <YAxisFixed stroke={colors.text.secondary} />
          <TooltipFixed
            contentStyle={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              color: colors.text.primary,
              borderRadius: AdminBorderRadius.md,
            }}
          />
          <BarFixed dataKey='count' fill={colors.status.info} radius={[8, 8, 0, 0]} />
        </BarChartFixed>
      </ResponsiveContainerFixed>
    </div>
  );
};

export default TimelineChart;
