import React, { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee,
  Home as HomeIcon,
  Wallet,
  TrendingDown,
  Calendar,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import Header from '../components/Header';
import CitySelector from '../components/CitySelector';
import MetricCard from '../components/MetricCard';
import StressIndicator from '../components/StressIndicator';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import AIChatBot from '../components/AIChatBot';
import ComparisonTable from '../components/ComparisonTable';

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const Home: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('bangalore');
  const [data, setData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Simulator State
  const [customSalary, setCustomSalary] = useState<number | null>(null);
  const [customRent, setCustomRent] = useState<number | null>(null);

  // Compare State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareCity, setCompareCity] = useState<string>('hyderabad');
  const [compareData, setCompareData] = useState<CityData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const fetchData = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);
    setCustomSalary(null); // Reset simulator on city change
    setCustomRent(null);
    try {
      const response = await fetch(`${API_BASE_URL}/city/${city}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${city}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedCity);
  }, [selectedCity, fetchData]);

  const fetchCompareData = useCallback(async (city: string) => {
    setCompareLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/city/${city}`);
      if (response.ok) {
        const result = await response.json();
        setCompareData(result);
      }
    } catch (err) {
      setCompareData(null);
    } finally {
      setCompareLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCompareMode) {
      fetchCompareData(compareCity);
    }
  }, [compareCity, isCompareMode, fetchCompareData]);

  const handleRetry = () => {
    fetchData(selectedCity);
  };

  // Dynamic calculations for Simulator
  const displaySalary = customSalary !== null ? customSalary : data?.monthly_salary_after_tax_inr || 0;
  const displayRent = customRent !== null ? customRent : data?.rent_one_person_inr || 0;
  const displayIncomeAfterRent = displaySalary - displayRent;
  const displayStressScore = displaySalary > 0 ? displayRent / displaySalary : 0;
  
  let displayStressLevel: 'Low' | 'Moderate' | 'High' = 'High';
  if (displayStressScore === 0) displayStressLevel = 'Moderate';
  else if (displayStressScore < 0.3) displayStressLevel = 'Low';
  else if (displayStressScore <= 0.5) displayStressLevel = 'Moderate';
  
  const displayMonthsCovered = data?.cost_one_person_inr ? Math.round((displaySalary / data.cost_one_person_inr) * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white py-16 px-4 mb-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=2613&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative max-w-4xl mx-auto z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Discover Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">Financial Freedom</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8 font-light">
            Real-time cost of living analytics and AI-powered insights for Indian cities.
          </p>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1"
          >
            <Sparkles className="w-5 h-5" />
            Talk to AI Advisor
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">
              City Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500 pl-4">
              Detailed breakdown for <span className="font-semibold text-indigo-600 capitalize">{selectedCity}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <CitySelector
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
              isLoading={loading}
            />
            <button
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isCompareMode ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isCompareMode ? 'Disable Compare' : 'Compare City'}
            </button>
            {isCompareMode && (
              <CitySelector
                selectedCity={compareCity}
                onCityChange={setCompareCity}
                isLoading={compareLoading}
              />
            )}
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} />
        ) : data ? (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Monthly Cost of Living"
                value={`₹${data.cost_one_person_inr.toLocaleString()}`}
                icon={IndianRupee}
                trend="Estimated for one person"
                trendType="neutral"
              />
              <MetricCard
                title="Rent Cost"
                value={`₹${displayRent.toLocaleString()}`}
                icon={HomeIcon}
                trend={customRent !== null ? "Custom Simulator Rent" : "1 BHK in City Centre"}
                trendType={customRent !== null ? "positive" : "neutral"}
              />
              <MetricCard
                title="Monthly Salary (Net)"
                value={`₹${displaySalary.toLocaleString()}`}
                icon={Wallet}
                trend={customSalary !== null ? "Custom Simulator Salary" : "Average after tax"}
                trendType={customSalary !== null ? "positive" : "positive"}
              />
              <MetricCard
                title="Income After Rent"
                value={`₹${displayIncomeAfterRent.toLocaleString()}`}
                icon={TrendingDown}
                trend="Disposable income"
                trendType={displayIncomeAfterRent > 0 ? 'positive' : 'negative'}
              />
            </div>

            {/* Simulator Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up">
               <h3 className="text-xl font-bold text-gray-900 mb-4">Interactive Simulator</h3>
               <p className="text-sm text-gray-500 mb-6">Adjust your expected salary and rent to see how it impacts your financial stress and savings.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjust Monthly Salary: ₹{displaySalary.toLocaleString()}
                    </label>
                    <input 
                      type="range" 
                      min="10000" 
                      max="300000" 
                      step="5000"
                      value={displaySalary}
                      onChange={(e) => setCustomSalary(Number(e.target.value))}
                      className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>₹10K</span>
                      <span>₹3L+</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjust Rent (1 BHK): ₹{displayRent.toLocaleString()}
                    </label>
                    <input 
                      type="range" 
                      min="5000" 
                      max="100000" 
                      step="1000"
                      value={displayRent}
                      onChange={(e) => setCustomRent(Number(e.target.value))}
                      className="w-full h-2 bg-violet-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>₹5K</span>
                      <span>₹1L+</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  Financial Runway Analysis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Months Covered</span>
                        <h4 className="text-4xl font-extrabold text-blue-900 mt-2">
                          {displayMonthsCovered}
                        </h4>
                      </div>
                      <p className="text-sm text-blue-700 mt-4 leading-relaxed">
                        Based on the salary versus cost of living, you could survive for this many months on one month's salary with zero expenses, or this is your savings potential ratio.
                      </p>
                    </div>
                  </div>
                   <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-100 flex flex-col justify-center items-center text-center">
                      <Sparkles className="w-10 h-10 text-violet-500 mb-3" />
                      <h4 className="text-lg font-semibold text-violet-900 mb-2">Need Personalized Advice?</h4>
                      <p className="text-sm text-violet-700 mb-4">
                        Our AI advisor can help you plan your budget based on these stats.
                      </p>
                      <button 
                        onClick={() => setIsChatOpen(true)}
                        className="text-violet-600 font-bold hover:text-violet-800 transition-colors text-sm underline"
                      >
                        Start Chatting &rarr;
                      </button>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <StressIndicator
                  stressScore={displayStressScore}
                  stressLevel={displayStressLevel}
                />
              </div>
            </div>

            {isCompareMode && compareData && (
              <ComparisonTable baseData={data} compareData={compareData} />
            )}
          </div>
        ) : null}
      </main>

      {/* Chat Bot Integration */}
      <AIChatBot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        cityContext={data?.city}
        rentContext={data?.rent_one_person_inr}
        salaryContext={data?.monthly_salary_after_tax_inr}
        onCitySelect={setSelectedCity}
      />

      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 z-40 ${
          isChatOpen ? 'bg-indigo-500 scale-0 opacity-0 pointer-events-none' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
        }`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

    </div>
  );
};

export default Home;
