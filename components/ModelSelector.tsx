
import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider } from '../types';
import { Cpu, Globe, Shield, Sparkles, Zap, ChevronRight, Key } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModelSelectorProps {
  onSelect: (config: AIConfig) => void;
}

const PROVIDERS: { 
  id: AIProvider; 
  name: string; 
  icon: any; 
  color: string; 
  keyUrl: string;
  models: { id: string; name: string; desc: string }[] 
}[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    icon: Sparkles,
    color: 'text-blue-400',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', desc: 'Most capable model for complex reasoning and coding.' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Fastest model for quick research and generation.' },
      { id: 'gemini-2.5-flash-latest', name: 'Gemini 2.5 Flash', desc: 'Optimized for high-speed multimodal tasks.' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Stable high-performance model with large context.' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI GPT',
    icon: Zap,
    color: 'text-emerald-400',
    keyUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', desc: 'Flagship multimodal model, balanced and smart.' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Efficient and affordable for simple tasks.' },
      { id: 'o1-preview', name: 'o1 Preview', desc: 'Advanced reasoning model for difficult math/logic.' },
      { id: 'o1-mini', name: 'o1 Mini', desc: 'Fast reasoning model for technical workflows.' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: Cpu,
    color: 'text-orange-400',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', desc: 'Industry-leading intelligence and speed.' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', desc: 'Ultra-fast, highly capable small model.' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: 'Most powerful model for deep analysis.' }
    ]
  },
  {
    id: 'meta',
    name: 'Meta Llama',
    icon: Globe,
    color: 'text-blue-600',
    keyUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', desc: 'Open-weights giant, rivals GPT-4o.' },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', desc: 'Highly capable for most reasoning tasks.' },
      { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', desc: 'Fast and efficient for basic generation.' }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: Zap,
    color: 'text-yellow-500',
    keyUrl: 'https://console.mistral.ai/api-keys/',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', desc: 'Top-tier reasoning and multilingual support.' },
      { id: 'mistral-small-latest', name: 'Mistral Small', desc: 'Optimized for low latency and efficiency.' },
      { id: 'pixtral-12b', name: 'Pixtral 12B', desc: 'Multimodal model with vision capabilities.' }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: Cpu,
    color: 'text-cyan-400',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-v3', name: 'DeepSeek V3', desc: 'State-of-the-art MoE model for general tasks.' },
      { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'Specialized in reasoning and complex logic.' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', desc: 'Expert model for programming and math.' }
    ]
  }
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ onSelect }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('google');
  const [selectedModelId, setSelectedModelId] = useState<string>(PROVIDERS[0].models[0].id);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('edu_quest_ai_config');
    if (savedConfig) {
      try {
        const config: AIConfig = JSON.parse(savedConfig);
        setSelectedProvider(config.provider);
        setSelectedModelId(config.model);
        if (config.apiKey) setApiKey(config.apiKey);
        if (config.baseURL) setBaseURL(config.baseURL);
      } catch (e) {
        console.error("Failed to parse saved AI config", e);
      }
    }
  }, []);

  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    const p = PROVIDERS.find(p => p.id === provider);
    if (p) setSelectedModelId(p.models[0].id);
    
    // Try to load key for this specific provider if saved separately
    const savedKey = localStorage.getItem(`edu_quest_api_key_${provider}`);
    if (savedKey) setApiKey(savedKey);
    else if (provider === 'google') setApiKey('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isAiStudio = window.location.hostname.includes('run.app') || window.location.hostname.includes('aistudio');
    const needsKey = selectedProvider !== 'google' && !apiKey;
    
    if (needsKey && !isAiStudio) {
      alert('Please enter an API key for this provider.');
      return;
    }

    const config: AIConfig = {
      provider: selectedProvider,
      model: selectedModelId,
      apiKey: apiKey || undefined,
      baseURL: baseURL || undefined
    };

    // Save to localStorage
    localStorage.setItem('edu_quest_ai_config', JSON.stringify(config));
    if (apiKey) {
      localStorage.setItem(`edu_quest_api_key_${selectedProvider}`, apiKey);
    }

    onSelect(config);
  };

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find(m => m.id === selectedModelId);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Globe className="w-3 h-3" />
              Global Intelligence Engine
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-[0.9] uppercase">
              Configure <span className="text-indigo-500">AI Core</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-md font-medium leading-relaxed">
              Select your preferred AI tool and model architecture from the top 20 industry-leading options.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl">
            <div className="space-y-4">
              <label 
                htmlFor="provider-select"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"
              >
                <Zap className="w-3 h-3" />
                Select AI Tool
              </label>
              <div className="relative">
                <select
                  id="provider-select"
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold appearance-none focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#1a1a1a] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label 
                htmlFor="model-select"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"
              >
                <Cpu className="w-3 h-3" />
                Model Architecture
              </label>
              <div className="relative">
                <select
                  id="model-select"
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold appearance-none focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {currentProvider?.models.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
              {currentModel && (
                <p className="text-xs text-gray-500 italic mt-2 px-2">
                  {currentModel.desc}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-white/5 border border-white/10">
              <div className={cn("p-3 rounded-2xl bg-white/5", currentProvider?.color)}>
                {currentProvider && <currentProvider.icon className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-lg">{currentProvider?.name}</h3>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{currentModel?.name}</p>
              </div>
            </div>

            {/* Show API Key input for all providers */}
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="api-key-input"
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"
                  >
                    <Key className="w-3 h-3" />
                    API Access Key {selectedProvider === 'google' && "(Optional in AI Studio)"}
                  </label>
                  {currentProvider?.keyUrl && (
                    <a 
                      href={currentProvider.keyUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                    >
                      Get API Key
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="api-key-input"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${selectedProvider} API key`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showKey ? <Shield className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {(selectedProvider === 'meta' || selectedProvider === 'openai') && (
                <div className="space-y-4">
                  <label 
                    htmlFor="base-url-input"
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"
                  >
                    <Globe className="w-3 h-3" />
                    Custom Endpoint (Optional)
                  </label>
                  <input
                    id="base-url-input"
                    type="text"
                    value={baseURL}
                    onChange={(e) => setBaseURL(e.target.value)}
                    placeholder="https://api.groq.com/openai/v1"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}
              
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                Your key is only stored in your browser session and is never sent to our servers.
              </p>
            </div>

            {selectedProvider === 'google' && (
              <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure Integration</span>
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Google Gemini can use the platform's native key management or your manual key above.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              Initialize Core
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
