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

export const ApplicationStatusChart: React.FC<{
  approved: number;
  pending: number;
  rejected: number;
  colors: any;
  loading?: boolean;
}> = ({ approved, pending, rejected, colors, loading }) => {
  const router = useRouter();

  if (loading) return <AdminSectionSkeleton lines={3} height='260px' />;

  const data = [
    { name: 'Approved', value: approved, href: '/inbox?type=approved', fill: colors.status.success },
    { name: 'Pending', value: pending, href: '/inbox?type=pending', fill: colors.status.warning },
    // REJECT and RETURN are a single merged status (statusMap.ts: returned: ['REJECT', 'RETURN']).
    { name: 'Rejected', value: rejected, href: '/inbox?type=returned', fill: colors.status.error },
  ];

  if (approved + pending + rejected === 0) {
    return (
      <div
        style={{ width: '100%', height: '260px' }}
        className='flex items-center justify-center text-sm text-gray-400'
      >
        No applications in this period
      </div>
    );
  }

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
            {data.map(entry => (
              <CellFixed key={entry.name} fill={entry.fill} />
            ))}
            <LabelListFixed dataKey='value' position='right' fill={colors.text.primary} />
          </BarFixed>
        </BarChartFixed>
      </ResponsiveContainerFixed>
    </div>
  );
};

export default ApplicationStatusChart;
