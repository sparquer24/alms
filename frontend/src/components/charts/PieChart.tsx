import React from 'react';
import { Pie } from 'react-chartjs-2';

interface PieChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
  };
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <Pie data={data} options={{ maintainAspectRatio: false }} />
    </div>
  );
};

export default PieChart;
