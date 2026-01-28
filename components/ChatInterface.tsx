
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../types';
import { Message } from './Message';
import { gemini } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface ChatInterfaceProps {
  session?: ChatSession;
  onUpdateMessages: (msgs: ChatMessage[]) => void;
  onStartNew: () => void;
  toggleSidebar: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  session,
  onUpdateMessages,
  onStartNew,
  toggleSidebar
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setAttachedImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;
    if (!session) {
      onStartNew();
      return;
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      parts: [
        ...(input.trim() ? [{ text: input.trim() }] : []),
        ...(attachedImage ? [{ inlineData: attachedImage }] : [])
      ],
      timestamp: Date.now()
    };

    const newMessages = [...session.messages, userMessage];
    onUpdateMessages(newMessages);
    const tempInput = input;
    const tempImage = attachedImage;
    
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    const modelMessageId = uuidv4();
    let currentModelText = '';

    try {
      const modelMessage: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        parts: [{ text: '' }],
        timestamp: Date.now(),
        isThinking: true
      };
      
      onUpdateMessages([...newMessages, modelMessage]);
      const stream = gemini.streamChat([...newMessages]);
      
      for await (const chunk of stream) {
        if (chunk) {
          currentModelText += chunk;
          onUpdateMessages([
            ...newMessages,
            { ...modelMessage, parts: [{ text: currentModelText }], isThinking: false }
          ]);
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      onUpdateMessages([...newMessages, { id: uuidv4(), role: 'model', parts: [{ text: "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring." }], timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#131314]">
        <div className="floating-icon mb-10">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#gemini_grad_hero)" />
              <defs>
                <linearGradient id="gemini_grad_hero" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4285F4" />
                  <stop offset="0.5" stopColor="#9B72CB" />
                  <stop offset="1" stopColor="#D96570" />
                </linearGradient>
              </defs>
            </svg>
        </div>
        <h2 className="text-5xl font-bold mb-6 tracking-tight">
            <span className="gemini-gradient">Salom, Men Neyroplan</span>
        </h2>
        <p className="text-gray-400 text-xl max-w-xl mb-12 font-light leading-relaxed">
            Sizga bugun qanday yordam bera olaman? G'oyalarni rejalashtirish, kod yozish yoki rasm tahlil qilishda men tayyorman.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
            {[
                { t: "Sayohat rejasi", d: "Yozgi ta'til uchun 5 kunlik reja tuzish" },
                { t: "Kod tahlili", d: "Murakkab JavaScript funksiyasini tushuntirish" },
                { t: "Rasm tahlili", d: "Rasmdagi obyektlar haqida ma'lumot berish" },
                { t: "Ijodiy yozish", d: "Elektron pochta yoki hikoya yozishga yordam" }
            ].map((hint, idx) => (
                <button 
                    key={idx}
                    onClick={() => { setInput(hint.d); onStartNew(); }}
                    className="p-5 bg-[#1e1f20] hover:bg-[#282a2d] rounded-2xl text-left transition-all border border-gray-800/50 group"
                >
                    <p className="text-gray-200 font-semibold mb-1 group-hover:text-blue-400 transition-colors">{hint.t}</p>
                    <p className="text-gray-500 text-sm">{hint.d}</p>
                </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131314] relative">
      <header className="sticky top-0 z-10 bg-[#131314]/80 backdrop-blur-xl p-4 flex items-center justify-between border-b border-gray-800/40">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-200 truncate max-w-[200px] md:max-w-md">{session.title}</h2>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Neyro Engine 3.0</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar">
        {session.messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && !session.messages[session.messages.length - 1]?.isThinking && (
           <div className="flex gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-800"></div>
              <div className="space-y-3 flex-1">
                 <div className="h-2 bg-gray-800 rounded w-1/4"></div>
                 <div className="h-2 bg-gray-800 rounded w-3/4"></div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {attachedImage && (
            <div className="relative w-24 h-24 ml-6 mb-2 group">
              <img 
                src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} 
                className="w-full h-full object-cover rounded-xl border-2 border-blue-500/50"
              />
              <button 
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          )}
          
          <div className="relative bg-[#1e1f20] rounded-[32px] border border-transparent focus-within:border-gray-700 transition-all p-2 pr-4 pl-6 flex items-center gap-2 shadow-2xl gemini-glow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Neyroplandan biror nima so'rang..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 placeholder-gray-500 py-4 resize-none max-h-48 custom-scrollbar text-base"
              rows={1}
            />

            <div className="flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
                title="Rasm tahlili"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </button>
              <button 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !attachedImage)}
                className={`p-3 rounded-full transition-all ${
                  isLoading || (!input.trim() && !attachedImage) ? 'text-gray-600 bg-transparent' : 'text-blue-400 hover:bg-gray-700 bg-gray-800/30 shadow-lg'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-gray-600 mt-2 uppercase tracking-widest font-bold">
              Neyroplan xatolik qilishi mumkin, muhim ma'lumotlarni tekshirib ko'ring.
          </p>
        </div>
      </div>
    </div>
  );
};
