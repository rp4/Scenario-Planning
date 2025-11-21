import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Terminal, Play, RotateCcw } from 'lucide-react';
import { ChatMessage, MessageRole, ContentType } from '../types';
import { SUGGESTION_CHIPS } from '../constants';
import SimulationChart from './SimulationChart';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onSuggestionClick: (text: string) => void;
  onClearChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isTyping, onSendMessage, onSuggestionClick, onClearChat }) => {
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-t border-slate-200 shadow-2xl shadow-slate-400/10">
      
      {/* Header */}
      <div className="h-10 border-b border-slate-100 flex items-center px-4 bg-slate-50 justify-between">
        <div className="flex items-center">
          <Sparkles className="w-4 h-4 text-blue-500 mr-2" />
          <span className="text-xs font-semibold text-slate-600">Risk Agent</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-slate-400">Powered by Gemini 2.5</div>
          <button 
            onClick={onClearChat}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Start New Chat"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
              ${msg.role === MessageRole.USER 
                ? 'bg-slate-800 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'}
            `}>
              {/* Content Type Handling */}
              {msg.type === ContentType.TEXT && (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {msg.type === ContentType.CHART && msg.chartData && (
                <div className="w-[450px]">
                  <p className="mb-2">{msg.content}</p>
                  <SimulationChart data={msg.chartData} />
                  {msg.codeSnippet && (
                    <details className="mt-3 group">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-blue-600 flex items-center gap-1 list-none font-medium">
                        <Terminal className="w-3 h-3" /> View Python Code
                      </summary>
                      <div className="mt-2 bg-slate-900 text-slate-200 p-3 rounded text-xs font-mono overflow-x-auto border border-slate-800">
                        <pre>{msg.codeSnippet}</pre>
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white">
        {/* Chips */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => onSuggestionClick(chip)}
              className="flex items-center whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 hover:shadow-sm transition-all border border-blue-100"
            >
               {chip === "Run Monte Carlo Simulation" && <Play className="w-3 h-3 mr-1.5 fill-current" />}
               {chip}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Risk Agent to analyze risks..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;