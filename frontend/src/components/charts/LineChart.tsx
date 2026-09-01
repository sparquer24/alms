import React from 'react';
import { Line } from 'react-chartjs-2';

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    }[];
  };
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <Line data={data} options={{ maintainAspectRatio: false }} />
    </div>
  );
};

export default LineChart;
