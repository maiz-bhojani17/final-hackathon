import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User as UserIcon, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = {
  admin: [
    'How many active employees are in the company?',
    'What is our total payroll cost for this month?',
    'What is the company attendance policy and grace period?',
    'Who came late most often this month?'
  ],
  hr: [
    'Who came late most often this month?',
    'What is this month attendance rate?',
    'How many sick leaves does each employee get?',
    'Summarize our payroll tax calculation rules.'
  ],
  employee: [
    'How many sick leaves do I have left this year?',
    'Meri kitni casual chuttiyan baqi hain?',
    'What time does the office start and what is the grace period?',
    'What is my colleague salary?' // Confidentiality refusal test
  ]
};

const AiChatModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.employee?.firstName || user?.role?.toUpperCase()}! I am your HCM Lite AI Assistant. You can ask me about company policies, leave balances, attendance, or payroll calculations. How may I assist you?`,
      isAiGenerated: true
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const roleSuggestions = SUGGESTIONS[user?.role] || SUGGESTIONS.employee;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/ai/chat', {
        message: text,
        history
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.answer,
          isAiGenerated: true,
          toolCalled: res.data.toolCalled
        }
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'The AI assistant is momentarily unavailable. Please check your connection or policy rules.';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errMsg,
          isError: true,
          isAiGenerated: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171C18]/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white dark:bg-[#222922] rounded-xl shadow-modal border border-[#E1E4D9] dark:border-[#384238] flex flex-col h-[580px] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EDEFE6] dark:bg-[#303A30] text-[#626F47] dark:text-[#A3B18A] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xs text-[#252A24] dark:text-[#EEF1E9]">HCM Assistant</h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-[#697064] dark:text-[#B1B9AC] bg-[#EDEFE6] dark:bg-[#303A30] capitalize">
                  {user?.role}
                </span>
              </div>
              <p className="text-[11px] text-[#858A80] dark:text-[#929D8D]">Policy & operations assistant (supports Roman Urdu)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#858A80] hover:text-[#252A24] dark:text-[#929D8D] dark:hover:text-[#EEF1E9] hover:bg-[#E8EBE0] dark:hover:bg-[#2C352C] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F3EB]/50 dark:bg-[#171C18]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-[#29372D] text-[#F5F3EB] dark:bg-[#A3B18A] dark:text-[#171C18] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#29372D] text-[#F5F3EB] dark:bg-[#A3B18A] dark:text-[#171C18]'
                  : 'bg-white dark:bg-[#222922] text-[#252A24] dark:text-[#EEF1E9] border border-[#E1E4D9] dark:border-[#384238] shadow-sm'
              }`}>
                <p className="whitespace-pre-line">{msg.content}</p>

                {msg.isAiGenerated && (
                  <div className="mt-1.5 pt-1.5 border-t border-[#E1E4D9] dark:border-[#384238] flex items-center justify-between text-[10px] text-[#858A80] dark:text-[#929D8D]">
                    <span className="inline-flex items-center gap-1 text-[#626F47] dark:text-[#A3B18A] font-medium">
                      <ShieldCheck className="w-3 h-3" /> Policy Guardrails
                    </span>
                    {msg.toolCalled && (
                      <span className="font-mono text-[#858A80] dark:text-[#929D8D]">
                        tool: {msg.toolCalled}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-[#EDEFE6] dark:bg-[#303A30] text-[#252A24] dark:text-[#EEF1E9] flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-center text-[#697064] dark:text-[#B1B9AC] text-xs pl-1">
              <Bot className="w-4 h-4 text-[#626F47] dark:text-[#A3B18A] animate-spin" />
              <span className="text-[11px]">Processing with Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 bg-white dark:bg-[#222922] border-t border-[#E1E4D9] dark:border-[#384238] flex gap-1.5 overflow-x-auto no-scrollbar">
          {roleSuggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-md bg-[#EDEFE6] dark:bg-[#293229] hover:bg-[#E1E7D8] dark:hover:bg-[#303C30] text-[#252A24] dark:text-[#EEF1E9] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white dark:bg-[#222922] border-t border-[#E1E4D9] dark:border-[#384238] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or query in English / Roman Urdu..."
            className="flex-1 bg-[#F5F3EB]/60 dark:bg-[#1B211C] border border-[#E1E4D9] dark:border-[#384238] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#75866A] focus:outline-none text-[#252A24] dark:text-[#EEF1E9] placeholder:text-[#858A80] dark:placeholder:text-[#929D8D]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-[#29372D] text-[#F5F3EB] dark:bg-[#A3B18A] dark:text-[#171C18] rounded-lg disabled:opacity-40 transition-colors shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiChatModal;
