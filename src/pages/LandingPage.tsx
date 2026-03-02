import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Globe, ShieldCheck, Zap } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg group-hover:scale-105 transition-transform duration-200">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Cost-of-Living Analytics
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
              <Link
                to="/dashboard"
                className="bg-gray-900 text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 transition-all hover:shadow-lg"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-50 blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-50 blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6 border border-indigo-100">
              New: AI-Powered Financial Advisor 🤖
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Cost of Living</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Real-time analytics, salary vs. rent benchmarks, and AI-driven financial planning for every major city in India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/dashboard"
                className="group flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="text-gray-600 font-semibold hover:text-gray-900 px-8 py-4"
              >
                Learn more
              </a>
            </div>
          </motion.div>

          {/* Dashboard Preview Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-gray-50">
               {/* Placeholder for dashboard screenshot or mock UI */}
               <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-white flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                  <div className="relative z-10 text-center p-8">
                    <p className="text-gray-500 font-medium mb-2">Interactive Dashboard</p>
                    <h3 className="text-2xl font-bold text-gray-800">Explore Data for 50+ Cities</h3>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why use Cost-of-Living Analytics?</h2>
            <p className="text-gray-600 text-lg">We combine verified data sources with advanced AI to give you the most accurate financial picture.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="w-8 h-8 text-blue-600" />}
              title="City Comparisons"
              description="Compare rent, groceries, and lifestyle costs across Hyderabad, Bangalore, Mumbai, and more."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-indigo-600" />}
              title="AI Financial Advisor"
              description="Chat with our intelligent bot to get personalized savings plans and budget breakdowns."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8 text-teal-600" />}
              title="Real-Time Data"
              description="Our database is updated regularly to reflect current market rates and inflation trends."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500">© 2026 Cost-of-Living Analytics. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-600">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-gray-600">Terms</a>
            <a href="#" className="text-gray-400 hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-8 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300">
    <div className="mb-4 p-3 bg-white rounded-xl w-fit shadow-sm border border-gray-100">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
