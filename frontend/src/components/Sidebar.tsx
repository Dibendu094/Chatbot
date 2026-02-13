import React, { useEffect, useState } from 'react';
import { 
  PlusCircle, 
  MessageSquare, 
  Trash2, 
  PanelLeftClose, 
  PanelLeftOpen, 
  PenSquare, 
  Moon, 
  Sun,
  Edit2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  conversations: { id: string; title: string }[];
  currentChatId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat, 
  onRenameChat, 
  conversations,
  currentChatId
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Mobile Overlay/Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        ${isOpen ? 'w-[240px] translate-x-0' : 'w-[240px] md:w-[60px] -translate-x-full md:translate-x-0'}
        bg-[rgb(var(--sidebar-bg))] border-r border-[rgb(var(--border-color))]
        flex flex-col text-[rgb(var(--sidebar-fg))] transition-all duration-300 ease-in-out
      `}>
        
        {/* State 1: Expanded (Open) */}
        <div className={`flex flex-col h-full ${!isOpen ? 'md:hidden' : 'flex'}`}>
          {/* Brand Header */}
          <div className="p-3 mb-2 flex items-center justify-between group/header">
            <div className="flex items-center px-2 py-1.5 rounded-lg">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-[rgb(var(--foreground))]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                    <path d="M2 17L12 22L22 17" />
                    <path d="M2 12L12 17L22 12" />
                  </svg>
                </div>
            </div>
            
            <button 
                onClick={onToggle}
                className="p-2 hover:bg-[rgb(var(--bubble-user))] rounded-lg text-[rgb(var(--sidebar-fg))] hover:text-[rgb(var(--foreground))] transition-colors"
                title="Close sidebar"
            >
                <PanelLeftClose size={20} />
            </button>
          </div>

          {/* New Chat Button (Prominent) */}
          <div className="px-3 mb-4">
              <button
                onClick={onNewChat}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[rgb(var(--bubble-user))] text-[rgb(var(--foreground))] transition-all duration-200 group font-medium text-sm"
              >
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-md flex items-center justify-center text-[rgb(var(--foreground))] group-hover:bg-[rgb(var(--background))] transition-colors">
                        <PenSquare size={16} />
                   </div>
                   <span className="text-[15px]">New chat</span>
                </div>
              </button>
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto px-3 chat-scrollbar">
            <button 
              onClick={() => setIsHistoryVisible(!isHistoryVisible)}
              className="flex items-center gap-1.5 px-2 mb-3 hover:opacity-100 transition-opacity group/title"
            >
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-50 group-hover/title:opacity-100 transition-opacity">Your Chats</div>
              <div className="opacity-40 group-hover/title:opacity-100 transition-transform duration-200">
                {isHistoryVisible ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </div>
            </button>
            
            {isHistoryVisible && (
              <div className="space-y-1 animate-fade-in">
                {conversations.length === 0 ? (
                    <div className="px-3 py-2 text-sm opacity-50 italic text-center mt-10">No chats yet</div>
                ) : (
                    conversations.map((chat) => (
                        <div 
                            key={chat.id} 
                            onClick={() => { onSelectChat(chat.id); if(window.innerWidth < 768) onToggle(); }}
                            className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors text-sm
                                ${currentChatId === chat.id ? 'bg-[rgb(var(--bubble-user))] text-[rgb(var(--foreground))]' : 'hover:bg-[rgb(var(--bubble-user))] hover:text-[rgb(var(--foreground))]'}
                            `}
                        >
                            <MessageSquare size={16} className="opacity-70 flex-shrink-0" />
                            <span className="truncate flex-1 pr-16">{chat.title}</span>
                             <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[rgb(var(--bubble-user))] pl-2 rounded-l-lg shadow-[-8px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        const newTitle = prompt("Enter new chat title:", chat.title);
                                        if (newTitle && newTitle.trim()) onRenameChat(chat.id, newTitle.trim());
                                    }}
                                    className="p-1.5 rounded-md hover:bg-[rgb(var(--background))] hover:text-[rgb(var(--accent))] transition-colors"
                                    title="Rename chat"
                                >
                                    <Edit2 size={13} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                                    className="p-1.5 rounded-md hover:bg-[rgb(var(--background))] hover:text-red-400 transition-colors"
                                    title="Delete chat"
                                >
                                    <Trash2 size={13} />
                                </button>
                             </div>
                        </div>
                    ))
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[rgb(var(--border-color))] space-y-1">
              {mounted && (
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgb(var(--foreground))]/5 text-sm font-medium transition-colors text-[rgb(var(--sidebar-fg))]">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>
                  </button>
              )}
          </div>
        </div>

        {/* State 2: Collapsed (Desktop Only) */}
        <div className={`flex flex-col items-center py-4 flex-1 ${isOpen ? 'hidden' : 'hidden md:flex'}`}>
            <button onClick={onToggle} className="p-3 hover:bg-[rgb(var(--bubble-user))] rounded-lg text-[rgb(var(--sidebar-fg))] transition-colors">
                <PanelLeftOpen size={20} />
            </button>
            <button onClick={onNewChat} className="mt-4 p-3 hover:bg-[rgb(var(--bubble-user))] rounded-lg text-[rgb(var(--foreground))] transition-colors">
                <PenSquare size={20} />
            </button>
            <div className="mt-auto mb-4 flex flex-col items-center gap-2">
                {mounted && (
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 hover:bg-[rgb(var(--foreground))]/5 rounded-lg text-[rgb(var(--sidebar-fg))] transition-colors">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                )}
            </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
