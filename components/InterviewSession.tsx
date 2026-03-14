
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { UserPreferences } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface InterviewSessionProps {
  prefs: UserPreferences;
  onBack: () => void;
}

const InterviewSession: React.FC<InterviewSessionProps> = ({ prefs, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAskMode, setIsAskMode] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const aiConfig = prefs.aiConfig;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = async (text: string) => {
    if (!isVoiceEnabled) return;
    
    const tryTTS = async (modelName: string) => {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    };

    try {
      let base64Audio;
      try {
        base64Audio = await tryTTS("gemini-2.5-flash-preview-tts");
      } catch (e) {
        console.warn("gemini-2.5-flash-preview-tts failed, trying gemini-2.5-flash:", e);
        base64Audio = await tryTTS("gemini-2.5-flash");
      }

      if (base64Audio) {
        const binaryString = window.atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        const bufferForDecoding = bytes.buffer.slice(0);
        
        try {
          const audioBuffer = await audioContext.decodeAudioData(bufferForDecoding);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start(0);
        } catch (decodeError) {
          const pcmData = new Int16Array(bytes.buffer);
          const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
          const channelData = audioBuffer.getChannelData(0);
          for (let i = 0; i < pcmData.length; i++) {
            channelData[i] = pcmData[i] / 32768.0;
          }
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start(0);
        }
      }
    } catch (err) {
      console.error("Advanced TTS failed, falling back to system voice:", err);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = prefs.language === 'English' ? 'en-US' : 
                        prefs.language === 'Hindi' ? 'hi-IN' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = prefs.language === 'English' ? 'en-US' : 
                                   prefs.language === 'Hindi' ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [prefs.language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  useEffect(() => {
    const initChat = async () => {
      if (!aiConfig) return;
      setIsLoading(true);

      const systemInstruction = `You are an expert interviewer for the ${prefs.examType} examination. 
      Your goal is to conduct a realistic personality test/interview in ${prefs.language}.
      
      Guidelines:
      1. Start by welcoming the candidate and asking a standard introductory question.
      2. Ask one question at a time.
      3. Base your questions on the typical pattern of ${prefs.examType} interviews.
      4. ACCURACY MATCHING: When the user provides a voice-to-text response, analyze it for:
         - Factual Accuracy: How correct is the information?
         - Communication Quality: Is the response structured well?
         - Relevance: Does it directly answer the question?
      5. Provide a "Response Accuracy Score" (out of 100%) and brief feedback after every response.
      6. MENTOR MODE: If the user asks a question (e.g., "How should I answer this?" or "What do you think about X?"), step out of the interviewer role briefly to provide expert guidance, then return to the interview.
      7. Keep the tone professional, encouraging, and formal.
      8. All your responses MUST be in ${prefs.language}.`;

      if (aiConfig.provider === 'google') {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
        const chat = ai.chats.create({
          model: aiConfig.model,
          config: { systemInstruction },
        });
        chatRef.current = chat;
      } else if (aiConfig.provider === 'openai') {
        chatRef.current = new OpenAI({ apiKey: aiConfig.apiKey, dangerouslyAllowBrowser: true });
      } else if (aiConfig.provider === 'anthropic') {
        chatRef.current = new Anthropic({ apiKey: aiConfig.apiKey, dangerouslyAllowBrowser: true });
      }
      
      setIsLoading(false);
    };

    initChat();
  }, [prefs.examType, prefs.language, aiConfig]);

  const startInterview = async () => {
    setHasStarted(true);
    setIsLoading(true);
    try {
      let text = "";
      if (aiConfig?.provider === 'google') {
        const response = await chatRef.current.sendMessage({ message: "Start the interview now." });
        text = response.text || "Welcome to the interview. Let's begin.";
      } else if (aiConfig?.provider === 'openai') {
        const response = await chatRef.current.chat.completions.create({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: `You are an expert interviewer for the ${prefs.examType} examination. All your responses MUST be in ${prefs.language}.` },
            { role: 'user', content: "Start the interview now." }
          ]
        });
        text = response.choices[0].message.content || "Welcome.";
      } else if (aiConfig?.provider === 'anthropic') {
        const response = await chatRef.current.messages.create({
          model: aiConfig.model,
          max_tokens: 1024,
          system: `You are an expert interviewer for the ${prefs.examType} examination. All your responses MUST be in ${prefs.language}.`,
          messages: [{ role: 'user', content: "Start the interview now." }]
        });
        text = (response.content[0] as any).text;
      }
      
      setMessages([{ role: 'model', text }]);
      await speak(text);
    } catch (err) {
      console.error("Chat start failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const finalMsg = isAskMode ? `[USER QUESTION/GUIDANCE REQUEST]: ${userMsg}` : userMsg;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      let text = "";
      if (aiConfig?.provider === 'google') {
        const response = await chatRef.current.sendMessage({ message: finalMsg });
        text = response.text || "I see. Let's move to the next question.";
      } else if (aiConfig?.provider === 'openai') {
        const history = messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));
        const response = await chatRef.current.chat.completions.create({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: `You are an expert interviewer for the ${prefs.examType} examination. All your responses MUST be in ${prefs.language}.` },
            ...history,
            { role: 'user', content: finalMsg }
          ]
        });
        text = response.choices[0].message.content || "I see.";
      } else if (aiConfig?.provider === 'anthropic') {
        const history = messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));
        const response = await chatRef.current.messages.create({
          model: aiConfig.model,
          max_tokens: 1024,
          system: `You are an expert interviewer for the ${prefs.examType} examination. All your responses MUST be in ${prefs.language}.`,
          messages: [...history, { role: 'user', content: finalMsg }] as any
        });
        text = (response.content[0] as any).text;
      }

      setMessages(prev => [...prev, { role: 'model', text }]);
      setIsAskMode(false);
      await speak(text);
    } catch (err) {
      console.error("Message failed:", err);
      setMessages(prev => [...prev, { role: 'model', text: "I apologize, I encountered a technical issue. Could you please repeat that?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="bg-indigo-600 p-6 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-black tracking-tight">AI Interview Practice</h2>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{prefs.examType} • {prefs.language}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-2 rounded-full transition-all ${isVoiceEnabled ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-200'}`}
            title={isVoiceEnabled ? "Mute AI Voice" : "Unmute AI Voice"}
          >
            {isVoiceEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            )}
          </button>
          <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Live AI Session</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 relative">
        {!hasStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8 bg-white/80 backdrop-blur-sm z-20">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">Ready for your Interview?</h3>
              <p className="text-gray-500 font-bold max-w-md mx-auto">
                The AI Board is ready to evaluate your profile. Click below to begin the session. Ensure your volume is up for the AI Voice Bot.
              </p>
            </div>
            <button 
              onClick={startInterview}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-700 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-4"
            >
              {isLoading ? 'Initializing...' : 'Begin Interview Session'}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[80%] p-6 rounded-[2rem] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-gray-100 flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-100 shrink-0">
        <div className="flex gap-4">
          <button 
            onClick={toggleRecording}
            disabled={!hasStarted}
            className={`p-5 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
            }`}
            title={isRecording ? "Stop Recording" : "Record Answer"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <button 
            onClick={() => setIsAskMode(!isAskMode)}
            disabled={!hasStarted}
            className={`p-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest ${
              isAskMode 
                ? 'bg-amber-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
            }`}
            title="Ask AI for Guidance"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="hidden md:block">Ask AI</span>
          </button>

          <input 
            type="text"
            value={input}
            disabled={!hasStarted}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={!hasStarted ? "Click 'Begin' to start..." : isAskMode ? "Ask AI for guidance or help..." : isRecording ? "Listening..." : `Type or record your response...`}
            className={`flex-1 p-5 bg-gray-50 border-2 rounded-2xl font-bold text-gray-700 focus:bg-white transition-all outline-none ${
              isAskMode ? 'border-amber-400 focus:border-amber-500' : 'border-gray-100 focus:border-indigo-500'
            }`}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !hasStarted}
            className="bg-indigo-600 text-white p-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 font-bold text-center mt-4 uppercase tracking-widest">
          {isAskMode ? "Mentor Mode: AI will provide guidance instead of interviewing." : isRecording ? "Recording active. Speak clearly." : "AI Interviewer will analyze your voice accuracy and content."}
        </p>
      </div>
    </div>
  );
};

export default InterviewSession;
