'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import { AdminSectionSkeleton } from '@/components/admin';
import { AdminBorderRadius } from '@/styles/admin-design-system';

const ResponsiveContainerFixed: any = ResponsiveContainer;
const BarChartFixed: any = BarChart;
const BarFixed: any = Bar;
const XAxisFixed: any = XAxis;
const YAxisFixed: any = YAxis;
const TooltipFixed: any = Tooltip;
const CartesianGridFixed: any = CartesianGrid;
const CellFixed: any = Cell;
const LabelListFixed: any = LabelList;

// Categorical identity colors (validated adjacent-safe order), distinct from
// the status palette used for outcome charts so "type" and "status" never share hues.
const TYPE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a'];

export const ApplicationTypeChart: React.FC<{
  fresh: number;
  renewal: number;
  cancel: number;
  colors: any;
  loading?: boolean;
}> = ({ fresh, renewal, cancel, colors, loading }) => {
  const router = useRouter();

  if (loading) return <AdminSectionSkeleton lines={3} height='260px' />;

  const data = [
    { name: 'Fresh', value: fresh, href: '/inbox?type=freshform' },
    { name: 'Renewal', value: renewal, href: '/inbox?type=renewal' },
    { name: 'Cancellation', value: cancel, href: '/inbox?type=cancel' },
  ];

  return (
    <div style={{ width: '100%', height: '260px' }}>
      <ResponsiveContainerFixed width='100%' height='100%'>
        <BarChartFixed data={data} layout='vertical' margin={{ left: 8, right: 24 }}>
          <CartesianGridFixed stroke={colors.border} horizontal={false} />
          <XAxisFixed type='number' stroke={colors.text.secondary} allowDecimals={false} />
          <YAxisFixed dataKey='name' type='category' stroke={colors.text.secondary} width={90} />
          <TooltipFixed
            contentStyle={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              color: colors.text.primary,
              borderRadius: AdminBorderRadius.md,
            }}
          />
          <BarFixed
            dataKey='value'
            radius={[0, 8, 8, 0]}
            cursor='pointer'
            onClick={(entry: any) => entry?.href && router.push(entry.href)}
          >
            {data.map((entry, i) => (
              <CellFixed key={entry.name} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
            ))}
            <LabelListFixed dataKey='value' position='right' fill={colors.text.primary} />
          </BarFixed>
        </BarChartFixed>
      </ResponsiveContainerFixed>
    </div>
  );
};

export default ApplicationTypeChart;
