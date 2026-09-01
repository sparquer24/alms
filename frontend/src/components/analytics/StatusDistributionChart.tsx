import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
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

export const StatusDistributionChart: React.FC<{
  data: any[];
  colors: any;
  loading?: boolean;
}> = ({ data, colors, loading }) => {
  if (loading) return <AdminSectionSkeleton lines={5} height='300px' />;

  const hasBreakdown = data.some((d: any) => d.fresh !== undefined || d.renewal !== undefined || d.cancel !== undefined);

  return (
    <div style={{ width: '100%', height: '350px' }}>
      <ResponsiveContainerFixed width='100%' height='100%'>
        <BarChartFixed data={data} layout='vertical'>
          <CartesianGridFixed stroke={colors.border} />
          <XAxisFixed type='number' stroke={colors.text.secondary} />
          <YAxisFixed dataKey='state' type='category' stroke={colors.text.secondary} />
          <TooltipFixed
            contentStyle={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              color: colors.text.primary,
              borderRadius: AdminBorderRadius.md,
            }}
          />
          {hasBreakdown ? (
            <>
              <LegendFixed />
              <BarFixed dataKey='fresh' name='Fresh' stackId='a' fill={colors.status.info} radius={[0, 0, 0, 0]} />
              <BarFixed dataKey='renewal' name='Renewal' stackId='a' fill={colors.status.success} radius={[0, 0, 0, 0]} />
              <BarFixed dataKey='cancel' name='Cancel' stackId='a' fill={colors.status.warning} radius={[0, 8, 8, 0]} />
            </>
          ) : (
            <BarFixed dataKey='count' fill={colors.status.success} radius={[0, 8, 8, 0]} />
          )}
        </BarChartFixed>
      </ResponsiveContainerFixed>
    </div>
  );
};

export default StatusDistributionChart;
