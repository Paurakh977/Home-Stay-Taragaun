'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Mic, Send, X, MicOff, Play, Pause, Volume2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
  audioUrl?: string;
}

export default function AIChatBubble() {
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
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

  const sendVoiceMessage = () => {
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
      setAudioBlob(null);
      setRecordingTime(0);
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'I received your voice message! I\'d be happy to help you find homestays. Could you tell me more about your preferences, such as location, dates, or specific amenities you\'re looking for?',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const sendTextMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Thanks for your message! I\'m here to help you find the perfect homestay. Let me search for options that match your requirements. What location are you interested in?',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
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
          <div className="absolute bottom-16 right-0 mb-2 mr-2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Let AI find your stay</span>
              <button
                onClick={dismissPopup}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* Main Chat Bubble */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg 
            flex items-center justify-center transition-all duration-300 hover:scale-110
            ${isShaking ? 'animate-shake' : ''}
          `}
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6">
          {/* Mobile: Full screen overlay, Desktop: Positioned window */}
          <div className="w-full h-full md:w-96 md:h-[500px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col animate-slide-up">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-2xl md:rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <p className="text-xs text-blue-100">Find your perfect homestay</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] p-3 rounded-2xl text-sm
                      ${message.isUser 
                        ? 'bg-blue-600 text-white rounded-br-md' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }
                    `}
                  >
                    {message.isVoice ? (
                      <div className="flex items-center gap-2">
                        <Volume2 size={16} />
                        <span>{message.text}</span>
                        {message.audioUrl && (
                          <button
                            onClick={() => {
                              const audio = new Audio(message.audioUrl);
                              audio.play();
                            }}
                            className="text-xs underline"
                          >
                            Play
                          </button>
                        )}
                      </div>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50">
              {/* Voice Recording Preview */}
              {audioBlob && (
                <div className="mb-3 p-3 bg-white rounded-lg border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-blue-600" />
                    <span className="text-sm">Recording ({formatTime(recordingTime)})</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={playRecording}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={sendVoiceMessage}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => setAudioBlob(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Recording Status */}
              {isRecording && (
                <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-700">Recording... {formatTime(recordingTime)}</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
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
                    onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                    placeholder="Type your message..."
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isRecording}
                  />
                </div>
                
                {/* Voice Button - Emphasized */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center transition-all
                    ${isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                      : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                    }
                  `}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* Send Button */}
                <button
                  onClick={sendTextMessage}
                  disabled={!inputText.trim() || isRecording}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center transition-all"
                >
                  <Send size={18} />
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
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}