
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SetupScreen from './components/SetupScreen';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import ResultScreen from './components/ResultScreen';
import ReviewScreen from './components/ReviewScreen';
import InterviewSession from './components/InterviewSession';
import ModelSelector from './components/ModelSelector';
import { Topic, Question, ReviewData, UserPreferences, SyllabusData, AIConfig } from './types';
import { fetchDynamicSyllabus } from './services/aiService';

enum View {
  MODEL_SELECT,
  SETUP,
  LOADING,
  DASHBOARD,
  QUIZ,
  RESULT,
  REVIEW,
  INTERVIEW
}

// Add global type for window.aistudio
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.MODEL_SELECT);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>();
  const [isMockTest, setIsMockTest] = useState(false);
  const [lastResult, setLastResult] = useState<{ score: number; total: number } | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAndSelectKey = async () => {
    try {
      if (!window.aistudio?.hasSelectedApiKey || !window.aistudio?.openSelectKey) {
        console.warn("AI Studio key selection methods not available in this environment.");
        return true;
      }
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      return true;
    } catch (e) {
      console.error("Key selection error:", e);
      return false;
    }
  };

  const handleModelSelect = (config: AIConfig) => {
    setAiConfig(config);
    setCurrentView(View.SETUP);
  };

  const handleSetupComplete = async (userPrefs: UserPreferences) => {
    setError(null);
    const finalPrefs = { ...userPrefs, aiConfig: aiConfig || undefined };
    setPrefs(finalPrefs);
    
    // If using Google, ensure API Key is selected
    const isProModel = aiConfig?.model?.toLowerCase().includes('pro');
    if (aiConfig?.provider === 'google' && isProModel) {
      const keyReady = await checkAndSelectKey();
      if (!keyReady) {
        setError("API Key selection is required for Pro models.");
        setCurrentView(View.MODEL_SELECT);
        return;
      }
    }

    setCurrentView(View.LOADING);
    try {
      const data = await fetchDynamicSyllabus(finalPrefs);
      if (!data || !data.sections || data.sections.length === 0) {
        throw new Error("No syllabus sections were found for this criteria.");
      }
      setSyllabus(data);
      setCurrentView(View.DASHBOARD);
    } catch (err: any) {
      console.error("Research failed:", err);
      let errorMessage = err.message || "Failed to research syllabus. Please try again.";
      
      if (err.message?.includes("entity was not found") || err.message?.includes("API key")) {
        if (window.aistudio?.openSelectKey) {
          await window.aistudio.openSelectKey();
        }
        errorMessage = "API Key selection required for this model. Please select a valid paid project key.";
      }
      
      setError(errorMessage);
      setCurrentView(View.MODEL_SELECT);
    }
  };

  const handleStartPractice = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsMockTest(false);
    setCurrentView(View.QUIZ);
  };

  const handleStartMock = () => {
    setSelectedTopic(undefined);
    setIsMockTest(true);
    setCurrentView(View.QUIZ);
  };

  const [masteredTopics, setMasteredTopics] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('mastered_topics');
    if (saved) setMasteredTopics(JSON.parse(saved));

    const savedConfig = localStorage.getItem('edu_quest_ai_config');
    if (savedConfig) {
      try {
        const config: AIConfig = JSON.parse(savedConfig);
        setAiConfig(config);
        setCurrentView(View.SETUP);
      } catch (e) {
        console.error("Failed to load saved AI config", e);
      }
    }
  }, []);

  const handleQuizComplete = (score: number, questions: Question[], userAnswers: (number | null)[]) => {
    const total = questions.length;
    const percentage = (score / total) * 100;
    
    if (selectedTopic && percentage >= 80) {
      const newMastered = [...new Set([...masteredTopics, selectedTopic.id])];
      setMasteredTopics(newMastered);
      localStorage.setItem('mastered_topics', JSON.stringify(newMastered));
    }

    setLastResult({ score, total });
    setReviewData({ questions, userAnswers, score, total });
    setCurrentView(View.RESULT);
  };

  const handleGoHome = () => {
    setCurrentView(syllabus ? View.DASHBOARD : View.SETUP);
    setSelectedTopic(undefined);
    setIsMockTest(false);
  };

  return (
    <Layout 
      onGoHome={handleGoHome} 
      onReviewPaper={() => setCurrentView(View.REVIEW)} 
      hasReviewData={!!reviewData}
      title={syllabus?.title || (prefs?.subject ? `${prefs.examType}: ${prefs.subject}` : prefs?.examType)}
    >
      {error && (currentView === View.MODEL_SELECT || currentView === View.SETUP) && (
        <div className="max-w-xl mx-auto mb-4 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-red-700 text-sm font-bold">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {currentView === View.MODEL_SELECT && (
        <ModelSelector onSelect={handleModelSelect} />
      )}

      {currentView === View.SETUP && (
        <SetupScreen 
          onComplete={handleSetupComplete} 
          onChangeAI={() => setCurrentView(View.MODEL_SELECT)}
        />
      )}

      {currentView === View.LOADING && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 animate-in fade-in duration-500">
          <div className="relative">
             <div className="w-24 h-24 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">AI Research in Progress</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              We are using Google Search to research the official <span className="text-indigo-600 font-bold">{prefs?.examType}</span> {prefs?.className} curriculum for {new Date().getFullYear() - 1}-{new Date().getFullYear().toString().slice(-2)}.
            </p>
            <div className="flex justify-center gap-1.5 pt-2">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
            </div>
            <button 
              onClick={() => setCurrentView(View.SETUP)}
              className="mt-4 text-xs font-bold text-gray-400 hover:text-indigo-600 underline"
            >
              Cancel Research
            </button>
          </div>
        </div>
      )}

      {currentView === View.DASHBOARD && syllabus && prefs && (
        <Dashboard 
          syllabus={syllabus}
          masteredTopics={masteredTopics}
          prefs={prefs}
          onStartPractice={handleStartPractice} 
          onStartMock={handleStartMock} 
          onStartInterview={() => setCurrentView(View.INTERVIEW)}
        />
      )}

      {currentView === View.INTERVIEW && prefs && (
        <InterviewSession 
          prefs={prefs}
          onBack={handleGoHome}
        />
      )}

      {currentView === View.QUIZ && prefs && (
        <Quiz 
          topic={selectedTopic} 
          prefs={prefs}
          syllabus={syllabus}
          isMock={isMockTest} 
          onComplete={handleQuizComplete}
          onCancel={handleGoHome}
        />
      )}

      {currentView === View.RESULT && lastResult && (
        <ResultScreen 
          score={lastResult.score} 
          total={lastResult.total} 
          syllabus={syllabus}
          onRestart={() => setCurrentView(View.QUIZ)}
          onGoHome={handleGoHome}
          onReview={() => setCurrentView(View.REVIEW)}
        />
      )}

      {currentView === View.REVIEW && reviewData && (
        <ReviewScreen 
          questions={reviewData.questions}
          userAnswers={reviewData.userAnswers}
          onBack={() => setCurrentView(View.RESULT)}
        />
      )}
    </Layout>
  );
};

export default App;
