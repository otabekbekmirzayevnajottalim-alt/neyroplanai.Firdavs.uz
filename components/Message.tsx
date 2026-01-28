
import React from 'react';
import { ChatMessage } from '../types';

interface MessageProps {
  message: ChatMessage;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex w-full gap-5 md:gap-8 ${isModel ? 'flex-row' : 'flex-row-reverse animate-in fade-in slide-in-from-bottom-4 duration-700'}`}>
      <div className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
        isModel ? 'bg-transparent' : 'bg-[#2f2f2f] border border-gray-700 shadow-xl'
      }`}>
        {isModel ? (
          <div className="floating-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#msg_grad_ai)" />
                <defs>
                <linearGradient id="msg_grad_ai" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4285F4" />
                    <stop offset="0.5" stopColor="#9B72CB" />
                    <stop offset="1" stopColor="#D96570" />
                </linearGradient>
                </defs>
            </svg>
          </div>
        ) : (
          <span className="text-xs font-bold text-gray-300">USER</span>
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[80%] ${isModel ? 'items-start' : 'items-end'}`}>
        {message.parts.map((part, i) => (
          <div key={i} className="w-full">
            {part.inlineData && (
              <div className="relative group inline-block">
                <img 
                    src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                    className="rounded-2xl border border-gray-800 max-h-96 w-auto mb-4 shadow-2xl hover:scale-[1.02] transition-transform duration-500"
                    alt="Asset"
                />
              </div>
            )}
            {part.text && (
              <div className={`
                p-5 md:p-6 rounded-[24px] text-sm md:text-base leading-relaxed tracking-normal
                ${isModel 
                  ? 'bg-transparent text-gray-200' 
                  : 'bg-[#2b2c2f] text-gray-100 shadow-lg border border-gray-800/50'}
              `}>
                {message.isThinking ? (
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex gap-2 items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-bounce"></div>
                        </div>
                        <span className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.3em]">Neyronlar ishlamoqda...</span>
                    </div>
                ) : (
                  <div className="whitespace-pre-wrap selection:bg-blue-500/30">{part.text}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
