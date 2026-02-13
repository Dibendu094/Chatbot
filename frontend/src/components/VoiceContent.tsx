"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Globe, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import VoiceOrb from '@/components/VoiceOrb';

const VoiceContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get('chatId');

  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [emotion, setEmotion] = useState('Neutral');
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  
  // Use Ref for chatId to ensure persistence across renders/callbacks
  const chatIdRef = useRef<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Ref to track status for callbacks to avoid stale closures
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Initialize Chat ID from history or create new
  useEffect(() => {
      // 1. Prefer URL param
      if (urlChatId) {
          chatIdRef.current = urlChatId;
          return;
      }

      // 2. Fallback to localStorage logic
      try {
          const stored = localStorage.getItem("apexConversations");
          if (stored) {
              const conversations = JSON.parse(stored);
              if (conversations.length > 0) {
                  // Connect to the most recent conversation
                  chatIdRef.current = conversations[0].id;
                  return;
              }
          }
          // No conversations, create new ID (will be saved on first message)
          chatIdRef.current = Math.random().toString(36).substr(2, 9);
      } catch (e) {
          chatIdRef.current = Math.random().toString(36).substr(2, 9);
      }
  }, [urlChatId]);

  // Helper to save messages to localStorage (Sync with main chat history)
  const saveMessage = (role: 'user' | 'assistant', content: string) => {
    try {
      const stored = localStorage.getItem("apexConversations");
      let conversations = stored ? JSON.parse(stored) : [];
      let currentId = chatIdRef.current;

      // If we somehow still don't have an ID, make one
      if (!currentId) {
          currentId = Math.random().toString(36).substr(2, 9);
          chatIdRef.current = currentId;
      }

      const convIndex = conversations.findIndex((c: any) => c.id === currentId);
      
      if (convIndex !== -1) {
        // Append to existing
        conversations[convIndex].messages.push({ role, content });
        conversations[convIndex].updatedAt = Date.now();
        
        // Move to top
        const conv = conversations.splice(convIndex, 1)[0];
        conversations.unshift(conv);
      } else {
        // Create new if strictly needed (shouldn't happen if we initialized correctly, but safety first)
        const newConv = {
          id: currentId,
          title: content.length > 30 ? content.substring(0, 30) + '...' : content,
          messages: [{ role, content }],
          updatedAt: Date.now()
        };
        conversations.unshift(newConv);
      }

      localStorage.setItem("apexConversations", JSON.stringify(conversations));
    } catch (e) {
      console.error("Failed to save voice history", e);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      
      window.speechSynthesis.cancel();
      
      const utter = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          setTimeout(utter, 200);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Priority 1: Google Hindi (Best for mixed En/Hi smoothness on Chrome/Android)
        let selectedVoice = voices.find(v => v.lang === 'hi-IN' && v.name.includes('Google'));

        // Priority 2: Microsoft Natural Voices (Edge - "Swara" or "Neerja")
        if (!selectedVoice) {
            selectedVoice = voices.find(v => 
                v.name.includes('Natural') && 
                (v.lang === 'en-IN' || v.lang === 'hi-IN')
            );
        }

        // Priority 3: Any Hindi or Indian English voice
        if (!selectedVoice) {
             selectedVoice = voices.find(v => v.lang === 'hi-IN' || v.lang === 'en-IN');
        }

        // Priority 4: Fallback to any English female-sounding voice if possible
        if (!selectedVoice) {
             selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US')));
        }
        
        // Default fallback
        if (!selectedVoice) {
            selectedVoice = voices[0];
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          // Build semantic language tag if voice supports it
          utterance.lang = selectedVoice.lang; 
        }

        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          setStatus('speaking');
          if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
        };

        utterance.onend = () => {
          setStatus('listening');
          setTranscript('');
          // Fast restart for snappy feel
          setTimeout(() => {
            if (statusRef.current === 'listening' && recognitionRef.current) {
              try { 
                  recognitionRef.current.abort(); 
                  recognitionRef.current.start(); 
              } catch(e) {}
            }
          }, 50);
        };

        utterance.onerror = (e) => {
          console.error("Speech error:", e);
          setStatus('listening');
          setTimeout(() => {
              if (recognitionRef.current) try { recognitionRef.current.start(); } catch(e) {}
          }, 50);
        };
        
        window.speechSynthesis.speak(utterance);
      };

      setTimeout(utter, 50);
    }
  };

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/voice-stream`;
    
    socketRef.current = new WebSocket(wsUrl);
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      }
    }

    socketRef.current.onopen = () => {
        socketRef.current?.send(JSON.stringify({ type: 'start' }));
    };

    socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
            setTranscript(data.text);
            try {
                // Stop recognition immediately when we get a response to prevent self-listening
                if (recognitionRef.current) recognitionRef.current.abort();
            } catch(e) {}
            
            setEmotion(data.emotion || 'Neutral');
            setLanguage(data.language || 'EN');
            speakText(data.text);
            saveMessage('assistant', data.text); 
        } else if (data.type === 'status') {
            setStatus(data.status);
            if (data.status === 'thinking') {
                setTranscript(''); 
                if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
            }
        }
    };

    return () => {
        socketRef.current?.close();
        stopListening();
        if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    };
  }, []); 

  const startListening = async () => {
    try {
      // 1. Cleanup previous
      if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch(e) {}
      }

      // 2. Setup Stream
      if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          streamRef.current = stream;
      }
      
      setStatus('listening');

      // 3. Setup Audio Context (Visualizer)
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
      } else if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }

      const bufferLength = analyserRef.current!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (analyserRef.current && statusRef.current === 'listening') {
          analyserRef.current.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / bufferLength;
          setAudioLevel(average / 128);
          requestAnimationFrame(updateLevel);
        }
      };
      
      updateLevel();

      // 4. Setup Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // Turn-based is safer for "listen-speak-listen" loops
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-IN'; 

        recognitionRef.current.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
          
          if (event.results[0].isFinal) {
            // STOP immediately on final result to prevent double-sends
            recognitionRef.current.stop(); 
            socketRef.current?.send(JSON.stringify({ type: 'text_input', text: result }));
            setStatus('thinking');
            saveMessage('user', result);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setStatus('idle');
                alert("Microphone access denied.");
            }
            // For 'no-speech' or 'network', we rely on onend to restart
        };

        recognitionRef.current.onend = () => {
          // KEY FIX: If we are still 'listening' (and not 'thinking' or 'speaking'), 
          // it means we stopped due to silence or error. RESTART IMMEDIATELY.
          if (statusRef.current === 'listening' && !window.speechSynthesis.speaking) {
             setTimeout(() => {
                 try { 
                     // Double check status before restarting
                     if (statusRef.current === 'listening') recognitionRef.current.start(); 
                 } catch(e) {}
             }, 50); // Very short delay
          }
        };

        recognitionRef.current.start();
      }

    } catch (err) {
      console.error("Error accessing microphone:", err);
      // alert("Please allow microphone access."); // Don't spam alert
      setStatus('idle');
    }
  };

  const stopListening = () => {
    // 1. Stop Media Stream Tracks
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    // 2. Safe Audio Context Cleanup
    if (audioContextRef.current) {
        if (audioContextRef.current.state !== "closed") {
            try {
                audioContextRef.current.close();
            } catch (e) {
                console.warn("Error closing AudioContext:", e);
            }
        }
        audioContextRef.current = null;
    }

    // 3. Stop Recognition
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
        // Do NOT nullify recognitionRef here as we might reuse the instance logic 
        // effectively, but for safety in this flow let's rely on the startListening logic to recreate/reset.
    }
    
    setStatus('idle');
    setAudioLevel(0);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[100] flex flex-col items-center justify-between overflow-hidden">
      <div className="w-full p-6 flex justify-between items-center z-50">
        <button 
          onClick={() => {
            stopListening();
            router.back();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
        >
          <X size={20} />
          <span className="text-sm font-medium">Return to Chat</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-sm font-medium">{emotion}</span>
          </div>
        </div>

        <div className="w-12" /> {/* Spacer for balance */}
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
            <VoiceOrb status={status} audioLevel={audioLevel} />
        </AnimatePresence>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl text-center px-6 min-h-[80px] flex items-center justify-center">
            <AnimatePresence>
                {(status === 'listening' || transcript) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                >
                    <p className="text-xl md:text-2xl font-medium text-slate-300 line-clamp-2 italic">
                    {transcript || (status === 'listening' && "Apex is listening...")}
                    </p>
                    {status === 'listening' && !transcript && (
                        <div className="flex justify-center gap-1.5">
                            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-blue-500" />
                            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-blue-500" />
                            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>
                    )}
                </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      <div className="w-full max-w-lg p-10 flex flex-col items-center gap-8 mb-4">
        <div className="flex items-center justify-center">
            <button 
                onClick={status === 'idle' ? startListening : stopListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    status === 'idle' 
                    ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/20' 
                    : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'
                }`}
            >
                {status === 'idle' ? <Mic size={32} /> : <MicOff size={32} />}
            </button>
        </div>
      </div>

      <div className="absolute inset-0 z-[-1] opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.1),transparent)]" />
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
    </div>
  );
};

export default VoiceContent;
