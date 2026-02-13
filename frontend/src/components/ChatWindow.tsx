import React, { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import api from '@/lib/api';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  messages: any[];
  isStreaming: boolean;
  onSend: (message: string) => void;
  currentChatId?: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isStreaming, onSend, currentChatId }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [welcomeText, setWelcomeText] = useState("Where should we begin?");
  const [showScrollbar, setShowScrollbar] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only auto-scroll if we are near bottom or it's a new message
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Handle Scrollbar visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollbar(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowScrollbar(false);
      }, 1000);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
        if (container) container.removeEventListener('scroll', handleScroll);
        if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, []);

  // Fetch unique welcome message
  useEffect(() => {
    if (messages.length === 0) {
        api.get('/welcome').then(res => {
            if (res.data?.message?.content) {
                setWelcomeText(res.data.message.content);
            } else if (res.data?.message) {
                 setWelcomeText(res.data.message);
            }
        }).catch(err => console.error("Failed to fetch welcome:", err));
    }
  }, [messages.length]);

  // EMPTY STATE (Or Fresh Chat): Centered Welcome + Input
  if (messages.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full max-w-3xl flex flex-col items-center gap-8 z-10 animate-in fade-in zoom-in duration-500">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[rgb(var(--foreground))] to-[rgb(var(--sidebar-fg))] bg-clip-text text-transparent opacity-90 leading-tight text-center">
                    {welcomeText}
                </h2>
                <div className="w-full">
                    <ChatInput onSend={onSend} loading={isStreaming} currentChatId={currentChatId} />
                </div>
            </div>
        </div>
      );
  }

  // ACTIVE STATE: Messages + Sticky Input
  return (
    <div 
      ref={scrollContainerRef}
      className={`flex-1 overflow-y-auto w-full scroll-smooth chat-scrollbar relative ${showScrollbar ? 'scrollbar-visible' : 'scrollbar-hidden'}`}
    >
      <div className="flex flex-col min-h-full pb-4">
          <div className="flex-1 flex flex-col">
            {messages.map((msg, index) => (
              <MessageBubble 
                key={index} 
                message={msg} 
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))}
            
            {/* Typing Indicator */}
            {isStreaming && (
                <div className="w-full py-8">
                <div className="max-w-3xl mx-auto px-4 flex gap-4 md:gap-6">
                    <div className="flex items-center gap-1.5 mt-2 ml-2">
                        <div className="w-1.5 h-1.5 bg-[rgb(var(--foreground))] rounded-full typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-[rgb(var(--foreground))] rounded-full typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-[rgb(var(--foreground))] rounded-full typing-dot"></div>
                    </div>
                </div>
                </div>
            )}
          </div>

          <div className="sticky bottom-0 w-full z-20 p-4 bg-[rgb(var(--background))]/80 backdrop-blur-md transition-all">
             <ChatInput onSend={onSend} loading={isStreaming} currentChatId={currentChatId} />
          </div>
          <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
