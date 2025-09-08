'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, Send, X, MicOff, Play, Pause, Volume2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
  audioUrl?: string;
}

// Environment configuration - these will be set from .env
const ADK_API_BASE = process.env.NEXT_PUBLIC_ADK_API_BASE || 'http://localhost:8000';
const USER_ID = Math.floor(Math.random() * 1000) + 1; // Random user ID for this session

interface AIChatBubbleProps {
  adminUsername?: string; // if provided, will include admin context
}

export default function AIChatBubble({ adminUsername }: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you find the perfect homestay today?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dismissedPopup, setDismissedPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shakeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize shake animation every 10 seconds
  useEffect(() => {
    if (!dismissedPopup) {
      shakeIntervalRef.current = setInterval(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 1000);
      }, 10000);

      return () => {
        if (shakeIntervalRef.current) {
          clearInterval(shakeIntervalRef.current);
        }
      };
    }
  }, [dismissedPopup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (shakeIntervalRef.current) {
        clearInterval(shakeIntervalRef.current);
      }
    };
  }, []);

  const dismissPopup = () => {
    setShowPopup(false);
    setDismissedPopup(true);
    if (shakeIntervalRef.current) {
      clearInterval(shakeIntervalRef.current);
    }
  };

  // Enhanced function to convert markdown to HTML with better formatting
  const convertMarkdownToHtml = (text: string) => {
    let html = text;
    
    // Convert markdown links: [text](url) -> <a href="url" target="_blank">text</a>
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: 500;">$1</a>');
    
    // Convert bullet points: • item -> <li>item</li>
    html = html.replace(/^[•·*-]\s+(.+)$/gm, '<li style="margin: 4px 0;">$1</li>');
    
    // Wrap consecutive <li> elements in <ul>
    html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>(\s*<li[^>]*>[\s\S]*?<\/li>)*)/g, '<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">$1</ul>');

    // Convert line breaks to <br> tags
    html = html.replace(/\n/g, '<br>');
    
    // Convert double line breaks to paragraph breaks
    html = html.replace(/<br><br>/g, '</p><p style="margin: 12px 0;">');
    
    // Wrap in paragraph tags if not already wrapped
    if (!html.includes('<p>') && !html.includes('<ul>')) {
      html = `<p style="margin: 0;">${html}</p>`;
    } else if (html.includes('</p><p')) {
      html = `<p style="margin: 0;">${html}</p>`;
    }
    
    // Bold text: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text: *text* -> <em>text</em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return html;
  };

  // Send message to ADK server


const sendToADKServer = async (mimeType: string, data: string) => {
  try {
    setIsLoading(true);
    
    const payload: any = {
      mime_type: mimeType,
      data: data,
      user_id: USER_ID,
      adminUsername: adminUsername || undefined // Always include adminUsername if available
    };

    // Always use the internal API route - this avoids mixed content issues
    const response = await fetch('/api/adk/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // include cookies for auth_token
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.response_text) {
      // Convert markdown to HTML for proper formatting
      const htmlContent = convertMarkdownToHtml(result.response_text);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: htmlContent,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } else {
      // Handle error case
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${result.error || 'Unknown error occurred'}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  } catch (error) {
    console.error('Error communicating with ADK server:', error);
    const errorResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Sorry, I\'m having trouble connecting to the server. Please try again later.',
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorResponse]);
  } finally {
    setIsLoading(false);
  }
};

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
      }
    }
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract only the base64 part (after the comma)
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendVoiceMessage = async () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const newMessage: Message = {
        id: Date.now().toString(),
        text: `Voice message (${recordingTime}s)`,
        isUser: true,
        timestamp: new Date(),
        isVoice: true,
        audioUrl,
      };

      setMessages(prev => [...prev, newMessage]);
      
      try {
        // Convert audio blob to base64 and send to ADK server
        const base64Audio = await blobToBase64(audioBlob);
        await sendToADKServer('audio/webm', base64Audio);
      } catch (error) {
        console.error('Error processing voice message:', error);
      }
      
      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  const sendTextMessage = async () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newMessage]);
      const messageText = inputText;
      setInputText('');
      
      // Send to ADK server
      await sendToADKServer('text/plain', messageText);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Popup Tooltip */}
        {showPopup && !dismissedPopup && !isOpen && (
          <div className="absolute bottom-16 right-0 mb-3 mr-1 bg-gray-800 text-white px-3 py-2 rounded-xl shadow-xl whitespace-nowrap animate-fade-in backdrop-blur-sm bg-opacity-90">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Let AI find your stay</span>
              <button
                onClick={dismissPopup}
                className="text-gray-300 hover:text-white transition-colors ml-1"
              >
                <X size={12} />
              </button>
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-3 w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-800"></div>
          </div>
        )}

        {/* Main Chat Bubble */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg 
            flex items-center justify-center transition-all duration-300 hover:scale-105
            border border-gray-700 backdrop-blur-sm
            ${isShaking ? 'animate-shake' : ''}
          `}
        >
          <Bot size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6">
          {/* Mobile: Full screen overlay, Desktop: Positioned window */}
          <div className="w-full h-full md:w-96 md:h-[500px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-slide-up border border-gray-100 backdrop-blur-sm">
            {/* Header */}
            <div className="bg-gray-50 text-gray-800 p-4 rounded-t-3xl md:rounded-t-3xl flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                  <Bot size={12} strokeWidth={1.5} className="text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-900">AI Assistant</h3>
                  <p className="text-xs text-gray-500">Find your perfect homestay</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] p-3 rounded-2xl text-sm transition-all duration-200
                      ${message.isUser 
                        ? 'bg-gray-900 text-white rounded-br-md shadow-sm' 
                        : 'bg-white text-gray-700 rounded-bl-md shadow-sm border border-gray-100'
                      }
                    `}
                  >
                    {message.isVoice ? (
                      <div className="flex items-center gap-2">
                        <Volume2 size={14} strokeWidth={1.5} />
                        <span>{message.text}</span>
                        {message.audioUrl && (
                          <button
                            onClick={() => {
                              const audio = new Audio(message.audioUrl);
                              audio.play();
                            }}
                            className="text-xs underline opacity-70 hover:opacity-100 transition-opacity"
                          >
                            Play
                          </button>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="prose prose-sm max-w-none"
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.5',
                          color: message.isUser ? 'white' : '#374151'
                        }}
                        dangerouslySetInnerHTML={{ __html: message.text }} 
                      />
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-700 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl md:rounded-b-3xl">
              {/* Voice Recording Preview */}
              {audioBlob && (
                <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={14} strokeWidth={1.5} className="text-gray-600" />
                    <span className="text-sm text-gray-700">Recording ({formatTime(recordingTime)})</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={playRecording}
                      className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                    >
                      {isPlaying ? <Pause size={14} strokeWidth={1.5} /> : <Play size={14} strokeWidth={1.5} />}
                    </button>
                    <button
                      onClick={sendVoiceMessage}
                      disabled={isLoading}
                      className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => setAudioBlob(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}

              {/* Recording Status */}
              {isRecording && (
                <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-700">Recording... {formatTime(recordingTime)}</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition-colors"
                  >
                    Stop
                  </button>
                </div>
              )}

              {/* Input Controls */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendTextMessage()}
                    placeholder="Type your message..."
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-sm bg-gray-50 transition-colors"
                    disabled={isRecording || isLoading}
                  />
                </div>
                
                {/* Voice Button - Enhanced and Highlighted */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group
                    ${isRecording 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200 animate-pulse' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-110 transform'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  `}
                >
                  {isRecording ? (
                    <div className="w-2.5 h-2.5 bg-white rounded-sm animate-pulse"></div>
                  ) : (
                    <Mic size={16} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                  )}
                  
                  {/* Subtle ring animation when not recording */}
                  {!isRecording && !isLoading && (
                    <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping"></div>
                  )}
                  
                  {/* Recording pulse ring */}
                  {isRecording && (
                    <div className="absolute -inset-1 rounded-full bg-red-500 opacity-30 animate-ping"></div>
                  )}
                </button>

                {/* Send Button */}
                <button
                  onClick={sendTextMessage}
                  disabled={!inputText.trim() || isRecording || isLoading}
                  className="w-9 h-9 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
                >
                  <Send size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(15px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }

        /* Custom styles for proper link rendering in messages */
        .prose a {
          color: #3b82f6 !important;
          text-decoration: underline !important;
          font-weight: 500 !important;
        }

        .prose a:hover {
          color: #2563eb !important;
        }

        .prose ul {
          margin: 8px 0 !important;
          padding-left: 20px !important;
        }

        .prose li {
          margin: 4px 0 !important;
        }

        .prose p {
          margin: 4px 0 !important;
        }
      `}</style>
    </>
  );
}