import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    intent?: string;
  };
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full py-8 transition-all duration-300 animate-fade-in-up group hover:bg-[rgb(var(--foreground))]/[0.02]`}>
      <div className={`max-w-4xl mx-auto px-6 flex gap-6 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar/Icon Placeholder (Optional, can add icons later) */}
        {!isUser && (
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--foreground))] flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[rgb(var(--background))]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
        )}

        {/* Content Section */}
        <div className={`flex-1 overflow-hidden flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
             relative px-5 py-3 rounded-2xl text-[16px] transition-all
             ${isUser 
               ? 'bg-[rgb(var(--bubble-user))] text-[rgb(var(--bubble-user-fg))] shadow-md max-w-[85%] rounded-tr-none pr-12' 
               : 'bg-transparent text-[rgb(var(--foreground))] w-full'
             }
          `}>
             {/* Styled Copy Button for User Message */}
             {isUser && (
                <button 
                  onClick={handleCopy}
                  className="absolute right-2 top-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 text-[rgb(var(--bubble-user-fg))]/50 hover:text-[rgb(var(--bubble-user-fg))]"
                  title="Copy question"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
             )}
             <div className={`markdown-content ${!isUser && isStreaming ? 'streaming-cursor' : ''}`}>
               <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeString = String(children).replace(/\n$/, '');
                      
                      if (!inline && match) {
                         return (
                          <div className="my-6 rounded-2xl overflow-hidden border border-white/10 shadow-3xl bg-[#0a0a0a] w-full">
                            <div className="code-header bg-[#18181b] text-zinc-400 px-5 py-3 flex justify-between items-center text-xs font-mono border-b border-white/5">
                              <span className="font-semibold uppercase tracking-wider">{match[1]}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(codeString);
                                  setCopiedCode(true);
                                  setTimeout(() => setCopiedCode(false), 2000);
                                }}
                                className="flex items-center gap-2 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
                              >
                                {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-5 overflow-x-auto text-[14px] font-mono leading-relaxed text-zinc-300 scrollbar-thin">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                         );
                      }
                      return (
                        <code className={`bg-[rgb(var(--foreground))]/10 px-1.5 py-0.5 rounded-md text-[14px] font-mono font-medium ${className}`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    a({node, children, ...props}: any) {
                      return (
                        <a 
                          {...props} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[rgb(var(--accent))] hover:underline underline-offset-4 decoration-2 transition-all font-medium"
                        >
                          {children}
                        </a>
                      );
                    }
                  }}
               >
                  {message.content}
               </ReactMarkdown>
             </div>
          </div>
          
           {/* Intent Badge */}
           {!isUser && message.intent && (
              <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[rgb(var(--sidebar-fg))] opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent))]"></span>
                Processed via {message.intent}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
