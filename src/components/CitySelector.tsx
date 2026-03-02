import React, { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface CitySelectorProps {
  onCityChange: (city: string) => void;
  selectedCity: string;
  isLoading: boolean;
}

const DEFAULT_CITIES = [
  'bangalore',
  'mumbai',
  'delhi',
  'pune',
  'hyderabad',
  'chennai',
  'gurgaon',
  'noida'
];

const CitySelector: React.FC<CitySelectorProps> = ({
  onCityChange,
  selectedCity,
  isLoading,
}) => {
  const [cities, setCities] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/cities');
        if (!response.ok) throw new Error('Failed to fetch cities');
        const data = await response.json();
        setCities(data.cities || DEFAULT_CITIES);
        setError(null);
      } catch (err) {
        console.warn('Backend unreachable, using default city list');
        setCities(DEFAULT_CITIES);
        setError(null); // Clear error since we have fallbacks
      }
    };

    fetchCities();
  }, []);

  return (
    <div className="relative w-full max-w-xs">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Select City
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || cities.length === 0}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-left font-medium text-gray-900 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-between capitalize"
      >
        <span className="truncate">{selectedCity || 'Choose a city...'}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isOpen && cities.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                onCityChange(city);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors capitalize ${
                selectedCity === city
                  ? 'bg-blue-100 text-blue-900 font-semibold'
                  : 'text-gray-900'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitySelector;