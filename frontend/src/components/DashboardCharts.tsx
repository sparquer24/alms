"use client";

import React, { useMemo, memo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          family: 'var(--font-geist-sans)',
          size: 12,
        },
        color: '#4B5563',
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'var(--font-geist-sans)',
          size: 12,
        },
        color: '#6B7280',
      },
    },
    y: {
      grid: {
        color: 'rgba(203, 213, 225, 0.3)',
      },
      ticks: {
        font: {
          family: 'var(--font-geist-sans)',
          size: 12,
        },
        color: '#6B7280',
        precision: 0,
      },
    },
  },
};

// Reusable ChartWrapper component
interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
}

const ChartWrapper: React.FC<ChartWrapperProps> = memo(({ title, children }) => (
  <div className="h-72">
    <div className="text-center text-lg font-bold text-gray-800 mb-4" aria-label={title}>{title}</div>
    {children}
  </div>
));

// ApplicationStatusChart
interface ApplicationStatusChartProps {
  statusData: {
    pending: number;
    approved: number;
    rejected: number;
    returned: number;
    verified: number;
  };
}

export const ApplicationStatusChart: React.FC<ApplicationStatusChartProps> = memo(({ statusData }) => {
  const data = useMemo(() => ({
    labels: ['Pending', 'Approved', 'Rejected', 'Returned', 'Verified'],
    datasets: [
      {
        label: 'Applications',
        data: [
          statusData.pending,
          statusData.approved,
          statusData.rejected,
          statusData.returned,
          statusData.verified,
        ],
        backgroundColor: [
          'rgba(249, 168, 37, 0.7)',
          'rgba(52, 211, 153, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(96, 165, 250, 0.7)',
          'rgba(99, 102, 241, 0.7)',
        ],
        borderColor: [
          'rgb(249, 168, 37)',
          'rgb(52, 211, 153)',
          'rgb(239, 68, 68)',
          'rgb(96, 165, 250)',
          'rgb(99, 102, 241)',
        ],
        borderWidth: 1,
      },
    ],
  }), [statusData]);

  return (
    <ChartWrapper title="Application Status Distribution">
      <Doughnut data={data} options={commonOptions} />
    </ChartWrapper>
  );
});

// ApplicationTrendChart
interface ApplicationTrendChartProps {
  trendData: {
    labels: string[];
    pending: number[];
    approved: number[];
    rejected: number[];
  };
}

export const ApplicationTrendChart: React.FC<ApplicationTrendChartProps> = memo(({ trendData }) => {
  const data = useMemo(() => ({
    labels: trendData.labels,
    datasets: [
      {
        label: 'Pending',
        data: trendData.pending,
        borderColor: 'rgb(249, 168, 37)',
        backgroundColor: 'rgba(249, 168, 37, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Approved',
        data: trendData.approved,
        borderColor: 'rgb(52, 211, 153)',
        backgroundColor: 'rgba(52, 211, 153, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Rejected',
        data: trendData.rejected,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3,
      },
    ],
  }), [trendData]);

  return (
    <ChartWrapper title="Application Trends (Last 7 Days)">
      <Line data={data} options={commonOptions} />
    </ChartWrapper>
  );
});

// ProcessingTimeChart
interface ProcessingTimeChartProps {
  processingTimeData: {
    labels: string[];
    averageDays: number[];
  };
}

export const ProcessingTimeChart: React.FC<ProcessingTimeChartProps> = memo(({ processingTimeData }) => {
  const data = useMemo(() => ({
    labels: processingTimeData.labels,
    datasets: [
      {
        label: 'Avg. Processing Days',
        data: processingTimeData.averageDays,
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  }), [processingTimeData]);

  return (
    <ChartWrapper title="Average Processing Time by License Type">
      <Bar
        data={data}
        options={{
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              title: {
                display: true,
                text: 'Days',
                font: {
                  family: 'var(--font-geist-sans)',
                  size: 14,
                },
                color: '#4B5563',
              },
            },
          },
        }}
      />
    </ChartWrapper>
  );
});
