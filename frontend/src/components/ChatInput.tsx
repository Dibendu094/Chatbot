import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Sparkles, Mic, MicOff, Headphones } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  isEmpty?: boolean;
  currentChatId?: string | null;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading, isEmpty, currentChatId }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setInput(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
    }
    
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 z-20">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[rgb(var(--accent))] to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative flex items-end gap-1 bg-[rgb(var(--input-bg))] border border-[rgb(var(--border-color))] rounded-xl p-1.5 shadow-2xl transition-colors">
          
          {/* Dictation Mic Button (Existing) */}
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-lg transition-all duration-200 ${
              isListening 
                ? 'text-red-500 animate-pulse bg-red-500/10' 
                : 'text-[rgb(var(--sidebar-fg))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--foreground))]/5'
            }`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Advanced Voice Mode Button (New) */}
          <Link
            href={currentChatId ? `/voice?chatId=${currentChatId}` : '/voice'}
            className="p-2.5 rounded-lg text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200 flex items-center justify-center"
            title="Switch to Advanced Voice Mode"
          >
            <Headphones size={20} />
          </Link>

          {/* Main Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask Apex anything..."}
            disabled={loading}
            className="w-full bg-transparent text-[15px] text-[rgb(var(--foreground))] placeholder-[rgb(var(--sidebar-fg))] py-2.5 px-2 resize-none focus:outline-none max-h-[150px] disabled:opacity-50 self-center"
            style={{ minHeight: '40px' }}
          />

          {/* Send Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || loading}
            className={`p-2.5 rounded-lg flex-shrink-0 transition-all duration-200 ${
              input.trim() && !loading
                ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-fg))] hover:opacity-90 shadow-lg'
                : 'bg-[rgb(var(--border-color))] text-[rgb(var(--sidebar-fg))] cursor-not-allowed'
            }`}
          >
            {loading ? (
              <Sparkles className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
