"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import SettingsModal from "@/components/SettingsModal";
import axios from "axios";
import { Menu } from "lucide-react";

// Environment-based API URL logic
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Computed: Current Messages
  const currentMessages = currentChatId 
    ? conversations.find(c => c.id === currentChatId)?.messages || []
    : [];

  // Load History & Sync
  const isMounted = useRef(false);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem("apexConversations");
        if (stored) {
          const parsed = JSON.parse(stored);
          setConversations(parsed);
          
          // Logic to auto-select latest chat ONLY on first mount
          if (!isMounted.current && !currentChatId && parsed.length > 0) {
             setCurrentChatId(parsed[0].id); 
          }
        }
        isMounted.current = true;
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };

    // Initial Load
    loadHistory();

    // Listeners for robust sync across tabs/navigation
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "apexConversations") {
             try {
                const stored = localStorage.getItem("apexConversations");
                if(stored) setConversations(JSON.parse(stored));
             } catch(e) {}
        }
    };
    
    const handleFocus = () => loadHistory();
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') loadHistory();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // Run ONCE on mount (plus listeners)

  // Save History
  useEffect(() => {
    if (conversations.length > 0) {
        try {
           localStorage.setItem("apexConversations", JSON.stringify(conversations));
        } catch (e) {
           console.error("Failed to save history", e);
        }
    }
  }, [conversations]);

  const handleNewChat = () => {
    // Generate a new ID immediately so Voice Mode can link to it
    const newId = Math.random().toString(36).substr(2, 9);
    const newConv: Conversation = {
        id: newId,
        title: "New Conversation",
        messages: [],
        updatedAt: Date.now()
    };
    
    setConversations(prev => [newConv, ...prev]);
    setCurrentChatId(newId);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    let chatId = currentChatId;
    let newConversations = [...conversations];

    // If no current chat, create one
    if (!chatId) {
       chatId = generateId();
       const newConv: Conversation = {
           id: chatId,
           title: text.length > 30 ? text.substring(0, 30) + '...' : text, 
           messages: [],
           updatedAt: Date.now()
       };
       // Add to BEGINNING of list
       newConversations = [newConv, ...newConversations];
       setCurrentChatId(chatId);
    }

    // Find index of current conversation
    const convIndex = newConversations.findIndex(c => c.id === chatId);
    if (convIndex === -1) return; 

    // 1. Add User Message
    const userMsg: Message = { role: "user", content: text };
    newConversations[convIndex].messages.push(userMsg);
    newConversations[convIndex].updatedAt = Date.now();
    
    // Sort conversations by recent update
    newConversations.sort((a, b) => b.updatedAt - a.updatedAt);
    setConversations([...newConversations]); 
    setLoading(true);

    try {
      const historyContext = newConversations[convIndex].messages.slice(-10).map(({ role, content }) => ({ role, content }));

      const payload = {
        message: text,
        history: historyContext, 
        stream: true, // ALWAYS ENABLE STREAMING FOR BETTER UX
      };

      // USE FETCH FOR STREAMING SUPPORT
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let detectedIntent = '';

      // Initialize AI Message Placeholder
      const aiMsg: Message = {
        role: "assistant",
        content: "",
      };

      const freshIndex = newConversations.findIndex(c => c.id === chatId);
      if(freshIndex !== -1) {
          newConversations[freshIndex].messages.push(aiMsg);
          setConversations([...newConversations]);
          
          setLoading(false); // Stop general loading, switch to content streaming
      }

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.intent) {
                detectedIntent = data.intent;
              }
              if (data.content) {
                assistantContent += data.content;
                
                // Update specific message in state
                setConversations(prev => {
                  const updated = [...prev];
                  const cIndex = updated.findIndex(c => c.id === chatId);
                  if (cIndex !== -1) {
                    const mIndex = updated[cIndex].messages.length - 1;
                    updated[cIndex].messages[mIndex].content = assistantContent;
                    updated[cIndex].messages[mIndex].intent = detectedIntent;
                  }
                  return updated;
                });
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error while streaming. Please try again.",
      };
      
      const freshIndex = newConversations.findIndex(c => c.id === chatId);
      if(freshIndex !== -1) {
          newConversations[freshIndex].messages.push(errorMsg);
          setConversations([...newConversations]);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = (id: string) => {
      setConversations(prev => {
          const updated = prev.filter(c => c.id !== id);
          if (currentChatId === id) {
              setCurrentChatId(null);
          }
          return updated;
      });
  };

  const renameChat = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(chat => 
      chat.id === id ? { ...chat, title: newTitle } : chat
    ));
  };

  return (
    <div className="flex h-screen bg-[rgb(var(--background))] overflow-hidden relative font-sans text-[rgb(var(--foreground))] transition-colors duration-300">
      <Sidebar 
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChat} 
          onSelectChat={setCurrentChatId}
          onDeleteChat={deleteChat}
          onRenameChat={renameChat}
          conversations={conversations.map(c => ({ id: c.id, title: c.title }))}
          currentChatId={currentChatId}
      />

      <main className="flex-1 flex flex-col relative z-20 w-full">
        {/* Header (Mobile Only) */}
        {!sidebarOpen && (
             <div className="absolute top-4 left-4 z-50 md:hidden">
                 <button 
                   onClick={() => setSidebarOpen(true)}
                   className="p-2 bg-[rgb(var(--sidebar-bg))] border border-[rgb(var(--border-color))] rounded-lg text-[rgb(var(--foreground))] shadow-md hover:bg-[rgb(var(--bubble-user))] transition-colors"
                 >
                   <Menu size={20} />
                 </button>
             </div>
        )}
        
        <ChatWindow 
          messages={currentMessages} 
          isStreaming={loading} 
          onSend={handleSend}
          currentChatId={currentChatId}
        />
        
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-[rgb(var(--accent))]/5 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
      <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-[rgb(var(--accent))]/5 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
    </div>
  );
}
