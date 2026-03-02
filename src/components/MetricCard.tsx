import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendType = 'neutral',
}) => {
  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const trendBackgrounds = {
    positive: 'bg-green-50 text-green-700',
    negative: 'bg-red-50 text-red-700',
    neutral: 'bg-gray-50 text-gray-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
           <p className={`mt-1 text-sm ${trendColors[trendType]}`}>{trend}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${trendBackgrounds[trendType] || trendBackgrounds.neutral}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default MetricCard;
