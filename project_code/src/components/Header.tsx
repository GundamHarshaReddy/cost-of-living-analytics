import React from 'react';
import { TrendingUp, LayoutDashboard, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg group-hover:scale-105 transition-transform duration-200">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cost-of-Living Analytics
              </h1>
              <p className="text-sm text-gray-600">
                Affordability & Stress Assessment Platform
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className={`p-2 rounded-lg transition-colors ${
                location.pathname === '/' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Home"
            >
              <Home className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className={`p-2 rounded-lg transition-colors ${
                location.pathname === '/dashboard' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;