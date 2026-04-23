import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface StressIndicatorProps {
  stressScore: number;
  stressLevel: 'Low' | 'Moderate' | 'High';
}

const StressIndicator: React.FC<StressIndicatorProps> = ({
  stressScore,
  stressLevel,
}) => {
  const getStressConfig = (level: string) => {
    switch (level) {
      case 'Low':
        return {
          bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
          borderColor: 'border-green-300',
          badgeColor: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          description: 'Your housing costs are manageable relative to income',
        };
      case 'Moderate':
        return {
          bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
          borderColor: 'border-amber-300',
          badgeColor: 'bg-amber-100 text-amber-800',
          icon: AlertCircle,
          iconColor: 'text-amber-600',
          description: 'Housing costs are significant but sustainable',
        };
      case 'High':
        return {
          bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
          borderColor: 'border-red-300',
          badgeColor: 'bg-red-100 text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          description: 'Housing costs are a major financial burden',
        };
      case 'Unknown':
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-100 text-gray-600',
          icon: AlertCircle, // Use a neutral icon like AlertCircle
          iconColor: 'text-gray-400',
          description: 'Data insufficient to calculate stress level',
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          badgeColor: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          iconColor: 'text-gray-600',
          description: 'Unable to calculate stress level',
        };
    }
  };

  const config = getStressConfig(stressLevel);
  const Icon = config.icon;

  return (
    <div
      className={`p-6 rounded-xl border-2 ${config.bgColor} ${config.borderColor} backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Affordability Stress Score
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl font-bold text-gray-900">
              {/* Only show N/A if explicitly NaN or if level is Unknown/invalid */}
              {typeof stressScore === 'number' && !isNaN(stressScore) && stressLevel !== 'Unknown'
                ? `${(stressScore * 100).toFixed(1)}%` 
                : 'N/A'}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${config.badgeColor}`}
            >
              {stressLevel || 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-gray-700">{config.description}</p>
        </div>
        <Icon className={`w-8 h-8 ${config.iconColor}`} />
      </div>

      {/* Progress bar */}
      <div className="mt-4 bg-white/50 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${
            stressLevel === 'Low'
              ? 'bg-green-500'
              : stressLevel === 'Moderate'
                ? 'bg-amber-500'
                : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(stressScore * 100, 100)}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-gray-600">
        <span>Low (0%)</span>
        <span>Moderate (30%)</span>
        <span>High (50%+)</span>
      </div>
    </div>
  );
};

export default StressIndicator;