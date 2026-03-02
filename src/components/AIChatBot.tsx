import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  cityContext?: string;
  rentContext?: number;
  salaryContext?: number;
}

const AIChatBot: React.FC<AIChatBotProps> = ({ isOpen, onClose, cityContext, rentContext, salaryContext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Reset chat when city changes
  useEffect(() => {
    if (cityContext) {
      const savings = (salaryContext || 0) - (rentContext || 0);
      const greeting = `Hi! I see you're looking at ${cityContext}.\n\nThe average rent is ₹${(rentContext || 0).toLocaleString()} vs a salary of ₹${(salaryContext || 0).toLocaleString()}.\n\nThis leaves roughly ₹${savings.toLocaleString()} for other expenses. What specific questions do you have about living in ${cityContext}?`;
      
      setMessages([{ role: 'assistant', content: greeting }]);
    } else {
        setMessages([{ role: 'assistant', content: "Hi! I'm your AI Cost-of-Living assistant. Select a city to get specific insights." }]);
    }
  }, [cityContext, rentContext, salaryContext, isOpen]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: {
            city: cityContext,
            rent: rentContext,
            salary: salaryContext,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting right now. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50 transform transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-100' : 'bg-violet-100'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-5 h-5 text-indigo-600" />
              ) : (
                <Bot className="w-5 h-5 text-violet-600" />
              )}
            </div>
            <div
              className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-600" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about affordable housing..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatBot;
