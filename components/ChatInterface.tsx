
import React, { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, Terminal, Play, RotateCcw, Paperclip, X, FileText } from 'lucide-react';
import { ChatMessage, MessageRole, ContentType, Attachment } from '../types';
import { SUGGESTION_CHIPS } from '../constants';
import SimulationChart from './SimulationChart';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onSuggestionClick: (text: string) => void;
  onClearChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, isTyping, onSendMessage, onSuggestionClick, onClearChat 
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping, attachments.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachments.length > 0) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  // --- File Upload Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        // Extract base64 data part
        const base64Data = base64String.split(',')[1];
        
        const newAttachment: Attachment = {
          name: file.name,
          mimeType: file.type,
          data: base64Data
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Header */}
      <div className="h-10 border-b border-slate-100 flex items-center px-4 bg-slate-50 justify-between shrink-0">
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
              max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm flex flex-col gap-2
              ${msg.role === MessageRole.USER 
                ? 'bg-slate-800 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'}
            `}>
              
              {/* Attachments Display */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-1">
                  {msg.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-white/20 rounded px-2 py-1 text-[10px] border border-white/10">
                      <FileText className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Content Type Handling */}
              {msg.type === ContentType.TEXT && (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {msg.type === ContentType.CHART && msg.chartData && (
                <div className="w-full min-w-[250px]">
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
            <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-200 flex items-center gap-2">
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
      <div className="p-4 bg-white shrink-0">
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

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg pl-2 pr-1 py-1 text-xs">
                <FileText className="w-3 h-3 text-slate-500" />
                <span className="text-slate-700 font-medium max-w-[200px] truncate">{att.name}</span>
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileSelect}
             className="hidden"
             accept=".pdf,.txt,.csv,.md"
           />

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 pl-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Risk Agent..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 placeholder:text-slate-400"
            />
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Attach File"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button 
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isTyping}
                className={`p-2 rounded-lg transition-colors ${(!input.trim() && attachments.length === 0) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
