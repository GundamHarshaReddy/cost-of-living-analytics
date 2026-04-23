import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

interface AIChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  cityContext?: string;
  rentContext?: number;
  salaryContext?: number;
  onCitySelect?: (city: string) => void;
}

// Suggestion chips that change based on context
const getSuggestions = (city?: string): string[] => {
  if (city) {
    return [
      `📊 Full cost breakdown for ${city}`,
      '💰 Create a savings plan',
      '🏠 Compare with another city',
      '📈 How can I reduce expenses?',
    ];
  }
  return [
    '🏙️ Cheapest city to live in India?',
    '📊 Compare Mumbai vs Bangalore',
    '💰 Best city for savings?',
    '🏠 Where is rent lowest?',
  ];
};

const AIChatBot: React.FC<AIChatBotProps> = ({ isOpen, onClose, cityContext, rentContext, salaryContext, onCitySelect }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset chat when city changes
  useEffect(() => {
    if (cityContext) {
      const savings = (salaryContext || 0) - (rentContext || 0);
      const greeting = `### Welcome! 👋\n\nI see you're looking at **${cityContext}**.\n\n| Metric | Value |\n|--------|-------|\n| 🏠 Rent | ₹${(rentContext || 0).toLocaleString()} |\n| 💼 Salary | ₹${(salaryContext || 0).toLocaleString()} |\n| 💰 Disposable | ₹${savings.toLocaleString()} |\n\nWhat would you like to know about living in **${cityContext}**?`;
      setMessages([{ role: 'assistant', content: greeting }]);
    } else {
      setMessages([{ role: 'assistant', content: "### Hello! 👋\n\nI'm your **AI Cost-of-Living Advisor**. I can help you with:\n\n- 🏙️ City cost breakdowns\n- 📊 City comparisons\n- 💰 Personalized savings plans\n- 📈 Budget optimization\n\nSelect a city on the dashboard or ask me anything!" }]);
    }
    setShowSuggestions(true);
  }, [cityContext, rentContext, salaryContext]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Typing animation effect
  const animateTyping = useCallback((fullContent: string, messageIndex: number) => {
    const words = fullContent.split(' ');
    let currentWordIndex = 0;

    const interval = setInterval(() => {
      currentWordIndex += 2; // 2 words at a time for speed
      if (currentWordIndex >= words.length) {
        currentWordIndex = words.length;
        clearInterval(interval);
        setMessages(prev => prev.map((msg, idx) =>
          idx === messageIndex ? { ...msg, content: fullContent, isTyping: false } : msg
        ));
      } else {
        setMessages(prev => prev.map((msg, idx) =>
          idx === messageIndex ? { ...msg, content: words.slice(0, currentWordIndex).join(' '), isTyping: true } : msg
        ));
      }
      scrollToBottom();
    }, 30);

    return () => clearInterval(interval);
  }, [scrollToBottom]);

  const handleSend = useCallback(async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || input.trim();
    if (!messageToSend) return;

    const userMessage: Message = { role: 'user', content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      // Build history from existing messages (exclude typing state)
      const historyForApi = messages
        .filter(m => !m.isTyping)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          context: {
            city: cityContext,
            rent: rentContext,
            salary: salaryContext,
          },
          history: historyForApi,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      // Add message with typing animation
      setMessages(prev => {
        const newMessages = [...prev, { role: 'assistant' as const, content: '', isTyping: true }];
        // Start typing animation for the new message
        setTimeout(() => animateTyping(data.response, newMessages.length - 1), 50);
        return newMessages;
      });

      if (data.target_city && onCitySelect) {
        onCitySelect(data.target_city.toLowerCase());
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "⚠️ I'm having trouble connecting right now. Please check if the backend server is running and try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, cityContext, rentContext, salaryContext, onCitySelect, animateTyping]);

  const handleSuggestionClick = (suggestion: string) => {
    // Remove emoji prefix for cleaner API message
    const cleanMessage = suggestion.replace(/^[^\w]*/, '').trim();
    handleSend(cleanMessage);
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    // Re-trigger the greeting
    if (cityContext) {
      const savings = (salaryContext || 0) - (rentContext || 0);
      const greeting = `### Welcome back! 👋\n\nViewing **${cityContext}** — Rent: ₹${(rentContext || 0).toLocaleString()} | Salary: ₹${(salaryContext || 0).toLocaleString()} | Disposable: ₹${savings.toLocaleString()}\n\nHow can I help you today?`;
      setMessages([{ role: 'assistant', content: greeting }]);
    } else {
      setMessages([{ role: 'assistant', content: "### Fresh start! 🔄\n\nI'm ready to help with cost-of-living questions. What would you like to know?" }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-[420px] h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-200/50 flex flex-col overflow-hidden z-50 transform transition-all duration-300 ease-in-out animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Financial Advisor</h3>
            <span className="text-[10px] text-white/70 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>
              Powered by Llama 3.3
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            title="Clear chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white chat-scroll">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 animate-fade-in ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 text-white" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] p-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm shadow-sm'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100/80 rounded-2xl rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="markdown-chat">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom renderers for clean chat styling
                      h3: ({ children }) => (
                        <h3 className="text-base font-bold text-gray-900 mb-2 mt-1">{children}</h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-sm font-semibold text-gray-800 mb-1 mt-2">{children}</h4>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0 text-[13px] leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-2 space-y-1 text-[13px]">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-2 space-y-1 list-decimal list-inside text-[13px]">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-[13px] leading-relaxed pl-1">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-indigo-700">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-gray-600 not-italic text-[12px]">{children}</em>
                      ),
                      table: ({ children }) => (
                        <div className="my-2 overflow-x-auto">
                          <table className="w-full text-[12px] border-collapse rounded-lg overflow-hidden">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-indigo-50 text-indigo-700">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-3 py-1.5 text-left font-semibold text-[11px] uppercase tracking-wider border-b border-indigo-100">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3 py-1.5 border-b border-gray-100 text-[12px]">{children}</td>
                      ),
                      code: ({ children }) => (
                        <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[11px] font-mono">
                          {children}
                        </code>
                      ),
                      a: ({ href, children }) => (
                        <a href={href} className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {msg.isTyping && (
                    <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-blink rounded-sm" />
                  )}
                </div>
              ) : (
                <span className="text-[13px]">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100/80">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {showSuggestions && !isLoading && (
        <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-100 flex flex-wrap gap-1.5 animate-fade-in">
          {getSuggestions(cityContext).map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-2.5 py-1 text-[11px] bg-white text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 shadow-sm hover:shadow font-medium"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about cost of living..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 text-sm bg-gray-50/50 transition-all duration-200 placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatBot;
