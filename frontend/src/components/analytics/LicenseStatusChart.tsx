'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import { AdminSectionSkeleton } from '@/components/admin';
import { AdminBorderRadius } from '@/styles/admin-design-system';
import { LicenseStatistics } from '@/types';

const ResponsiveContainerFixed: any = ResponsiveContainer;
const BarChartFixed: any = BarChart;
const BarFixed: any = Bar;
const XAxisFixed: any = XAxis;
const YAxisFixed: any = YAxis;
const TooltipFixed: any = Tooltip;
const CartesianGridFixed: any = CartesianGrid;
const CellFixed: any = Cell;
const LabelListFixed: any = LabelList;

export const LicenseStatusChart: React.FC<{
  stats: LicenseStatistics | null | undefined;
  colors: any;
  loading?: boolean;
}> = ({ stats, colors, loading }) => {
  const router = useRouter();

  if (loading) return <AdminSectionSkeleton lines={4} height='280px' />;

  const allSegments: Array<{ name: string; key: keyof LicenseStatistics; href: string; fill: string }> = [
    { name: 'Active', key: 'active', href: '/licenses?tab=all&status=ACTIVE', fill: colors.status.success },
    { name: 'Expiring Soon', key: 'expiringWithin30Days', href: '/licenses?tab=expiring&days=30', fill: colors.status.warning },
    { name: 'Expired', key: 'expired', href: '/licenses?tab=expired', fill: colors.status.error },
    { name: 'Suspended', key: 'suspended', href: '/licenses?tab=all&status=SUSPENDED', fill: colors.status.info },
    { name: 'Cancelled', key: 'cancelled', href: '/licenses?tab=all&status=CANCELLED', fill: colors.text.secondary },
  ];

  const data = allSegments
    .filter(seg => stats?.[seg.key] !== undefined)
    .map(seg => ({ name: seg.name, value: stats?.[seg.key] ?? 0, href: seg.href, fill: seg.fill }));

  return (
    <div style={{ width: '100%', height: '280px' }}>
      <ResponsiveContainerFixed width='100%' height='100%'>
        <BarChartFixed data={data} layout='vertical' margin={{ left: 8, right: 24 }}>
          <CartesianGridFixed stroke={colors.border} horizontal={false} />
          <XAxisFixed type='number' stroke={colors.text.secondary} allowDecimals={false} />
          <YAxisFixed dataKey='name' type='category' stroke={colors.text.secondary} width={100} />
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

export default LicenseStatusChart;
