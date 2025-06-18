"use client";

import React from 'react';
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

// Chart option configurations with consistent styling
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
        color: '#4B5563', // text-gray-600
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
        color: '#6B7280', // text-gray-500
      },
    },
    y: {
      grid: {
        color: 'rgba(203, 213, 225, 0.3)', // light grid lines
      },
      ticks: {
        font: {
          family: 'var(--font-geist-sans)',
          size: 12,
        },
        color: '#6B7280', // text-gray-500
        precision: 0, // Show only integers
      },
    },
  },
};

// Custom chart components
interface ApplicationStatusChartProps {
  statusData: {
    pending: number;
    approved: number;
    rejected: number;
    returned: number;
    verified: number;
  };
}

export const ApplicationStatusChart: React.FC<ApplicationStatusChartProps> = ({ statusData }) => {
  const data = {
    labels: ['Pending', 'Approved', 'Rejected', 'Returned', 'Verified'],
    datasets: [
      {
        label: 'Applications',
        data: [
          statusData.pending,
          statusData.approved,
          statusData.rejected,
          statusData.returned,
          statusData.verified
        ],
        backgroundColor: [
          'rgba(249, 168, 37, 0.7)', // pending - amber
          'rgba(52, 211, 153, 0.7)', // approved - green
          'rgba(239, 68, 68, 0.7)',  // rejected - red
          'rgba(96, 165, 250, 0.7)', // returned - blue
          'rgba(99, 102, 241, 0.7)', // verified - indigo
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
  };

  return (
    <div className="h-72">
      <Doughnut 
        data={data} 
        options={{
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            title: {
              display: true,
              text: 'Application Status Distribution',
              font: {
                size: 16,
                family: 'var(--font-geist-sans)',
                weight: 'bold',
              },
              color: '#1F2937', // text-gray-800
              padding: 20,
            },
          },
        }} 
      />
    </div>
  );
};

interface ApplicationTrendChartProps {
  trendData: {
    labels: string[];
    pending: number[];
    approved: number[];
    rejected: number[];
  };
}

export const ApplicationTrendChart: React.FC<ApplicationTrendChartProps> = ({ trendData }) => {
  const data = {
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
  };

  return (
    <div className="h-72">
      <Line 
        data={data} 
        options={{
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            title: {
              display: true,
              text: 'Application Trends (Last 7 Days)',
              font: {
                size: 16,
                family: 'var(--font-geist-sans)',
                weight: 'bold',
              },
              color: '#1F2937', // text-gray-800
              padding: 20,
            },
          },
        }} 
      />
    </div>
  );
};

interface ProcessingTimeChartProps {
  processingTimeData: {
    labels: string[];
    averageDays: number[];
  };
}

export const ProcessingTimeChart: React.FC<ProcessingTimeChartProps> = ({ processingTimeData }) => {
  const data = {
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
  };

  return (
    <div className="h-72">
      <Bar 
        data={data} 
        options={{
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            title: {
              display: true,
              text: 'Average Processing Time by License Type',
              font: {
                size: 16,
                family: 'var(--font-geist-sans)',
                weight: 'bold',
              },
              color: '#1F2937', // text-gray-800
              padding: 20,
            },
          },
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
                color: '#4B5563', // text-gray-600
              },
            },
          },
        }} 
      />
    </div>
  );
};
