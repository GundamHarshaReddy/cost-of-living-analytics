import React from 'react';
import { IndianRupee, Home as HomeIcon, Wallet, ArrowRight } from 'lucide-react';

interface CityData {
  city: string;
  cost_one_person_inr: number;
  rent_one_person_inr: number;
  monthly_salary_after_tax_inr: number;
  income_after_rent_inr: number;
  months_covered: number;
  stress_score: number;
  stress_level: 'Low' | 'Moderate' | 'High';
}

interface ComparisonTableProps {
  baseData: CityData;
  compareData: CityData;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ baseData, compareData }) => {
  const getBetterValueClass = (val1: number, val2: number, lowerIsBetter: boolean) => {
    if (val1 === val2) return 'text-gray-900';
    const isVal1Better = lowerIsBetter ? val1 < val2 : val1 > val2;
    return isVal1Better ? 'text-emerald-600 font-bold bg-emerald-50 rounded-lg' : 'text-rose-600';
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

  const compareRows = [
    {
      label: 'Monthly Cost of Living',
      icon: <IndianRupee className="w-4 h-4" />,
      baseVal: baseData.cost_one_person_inr,
      compVal: compareData.cost_one_person_inr,
      lowerIsBetter: true,
      formatter: formatCurrency,
    },
    {
      label: 'Rent Cost (1 BHK)',
      icon: <HomeIcon className="w-4 h-4" />,
      baseVal: baseData.rent_one_person_inr,
      compVal: compareData.rent_one_person_inr,
      lowerIsBetter: true,
      formatter: formatCurrency,
    },
    {
      label: 'Monthly Salary (Net)',
      icon: <Wallet className="w-4 h-4" />,
      baseVal: baseData.monthly_salary_after_tax_inr,
      compVal: compareData.monthly_salary_after_tax_inr,
      lowerIsBetter: false,
      formatter: formatCurrency,
    },
    {
      label: 'Income After Rent',
      icon: <ArrowRight className="w-4 h-4" />,
      baseVal: baseData.income_after_rent_inr,
      compVal: compareData.income_after_rent_inr,
      lowerIsBetter: false,
      formatter: formatCurrency,
    },
    {
      label: 'Stress Score',
      icon: null,
      baseVal: baseData.stress_score,
      compVal: compareData.stress_score,
      lowerIsBetter: true,
      formatter: (val: number) => val.toFixed(2),
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8 animate-fade-in-up">
      <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-indigo-600 pl-3">
        City Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
              <th className="py-4 px-4 text-lg font-bold text-indigo-900 text-center capitalize w-1/3">
                {baseData.city}
              </th>
              <th className="py-4 px-4 text-lg font-bold text-indigo-900 text-center capitalize w-1/3">
                {compareData.city}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {compareRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    {row.icon && <span className="text-indigo-500">{row.icon}</span>}
                    {row.label}
                  </div>
                </td>
                <td className={`py-4 px-4 text-center ${getBetterValueClass(row.baseVal, row.compVal, row.lowerIsBetter)}`}>
                  {row.formatter(row.baseVal)}
                </td>
                <td className={`py-4 px-4 text-center ${getBetterValueClass(row.compVal, row.baseVal, row.lowerIsBetter)}`}>
                  {row.formatter(row.compVal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
