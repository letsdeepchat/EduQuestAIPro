
import React, { useState, useEffect, useRef } from 'react';
import { Question, QuizState, Topic, UserPreferences, SyllabusData } from '../types';
import { generateQuestions, formatError } from '../services/aiService';

interface QuizProps {
  topic?: Topic;
  prefs: UserPreferences;
  syllabus?: SyllabusData | null;
  isMock?: boolean;
  onComplete: (score: number, questions: Question[], userAnswers: (number | null)[]) => void;
  onCancel: () => void;
}

const Quiz: React.FC<QuizProps> = ({ topic, prefs, syllabus, isMock, onComplete, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<QuizState | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalTimeLeft, setTotalTimeLeft] = useState(isMock ? 3600 : 900);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [isTimeBlinking, setIsTimeBlinking] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const questionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        const targetTopic = topic || { 
          id: 'full-mock', 
          name: `${prefs.examType} Mock Test`, 
          description: 'Comprehensive Exam Simulation', 
          section: 'Mock' 
        };
        
        let totalTargetCount = isMock ? 35 : 10;
        
        if (isMock && syllabus?.totalQuestions) {
          const match = syllabus.totalQuestions.match(/\d+/);
          if (match) {
            totalTargetCount = Math.min(parseInt(match[0], 10), 50); 
          }
        }

        // Initial batch of 10
        const initialCount = Math.min(totalTargetCount, 10);
        const initialQuestions = await generateQuestions(targetTopic, prefs, initialCount);

        setState({
          questions: initialQuestions,
          currentIndex: 0,
          score: 0,
          userAnswers: Array(initialQuestions.length).fill(null),
          isComplete: false,
          startTime: Date.now()
        });
        setLoading(false);

        // Background generation for the rest
        if (totalTargetCount > initialCount) {
          const remainingCount = totalTargetCount - initialCount;
          generateQuestions(targetTopic, prefs, remainingCount).then(moreQuestions => {
            setState(prev => {
              if (!prev || prev.isComplete) return prev;
              const newQuestions = [...prev.questions, ...moreQuestions];
              const newUserAnswers = [...prev.userAnswers, ...Array(moreQuestions.length).fill(null)];
              return {
                ...prev,
                questions: newQuestions,
                userAnswers: newUserAnswers
              };
            });
          }).catch(err => {
            console.error("Background question generation failed:", err);
            // We don't set error here because we already have initial questions
          });
        }
      } catch (err) {
        console.error(err);
        setError(formatError(err));
        setLoading(false);
      }
    }
    loadQuestions();
  }, [topic, prefs, isMock]);

  useEffect(() => {
    if (state && !state.isComplete) {
      timerRef.current = window.setInterval(() => {
        setTotalTimeLeft((prev) => {
          if (prev <= 1) { handleFinish(); return 0; }
          return prev - 1;
        });
      }, 1000);

      questionTimerRef.current = window.setInterval(() => {
        setQuestionSeconds(prev => {
          const next = prev + 1;
          if (next > 60) setIsTimeBlinking(true);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (questionTimerRef.current) window.clearInterval(questionTimerRef.current);
    };
  }, [state]);

  useEffect(() => {
    setQuestionSeconds(0);
    setIsTimeBlinking(false);
  }, [state?.currentIndex]);

  const handleFinish = () => {
    if (state) onComplete(state.score, state.questions, state.userAnswers);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAnswerSelect = (index: number) => {
    if (state!.userAnswers[state!.currentIndex] !== null && !isMock) return;
    const newState = { ...state! };
    newState.userAnswers[state!.currentIndex] = index;
    let newScore = 0;
    newState.userAnswers.forEach((ans, idx) => {
      if (ans === newState.questions[idx].correctAnswer) newScore++;
    });
    newState.score = newScore;
    setState(newState);
    if (!isMock) setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (state!.currentIndex < state!.questions.length - 1) {
      setState({ ...state!, currentIndex: state!.currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">Generating Questions...</h2>
          <p className="text-gray-500">Retrieving official patterns and trends for {prefs.examType}.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/20">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Generation Failed</h2>
          <p className="text-red-600 font-bold leading-relaxed">{error}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onCancel} 
            className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
          >
            Go Back
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state || state.questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4 font-bold">No questions were generated. Please try again.</p>
        <button onClick={onCancel} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Back</button>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentIndex];
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col px-6 py-4 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center mb-3 h-10 shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div>
            <h2 className="text-xs font-bold text-gray-800 leading-none mb-1 truncate max-w-[200px]">{topic?.name || 'Mock Exam'}</h2>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-bold text-indigo-600">Q {state.currentIndex + 1}/{state.questions.length}</span>
              <div className="h-0.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className={`px-2 py-0.5 rounded-lg border flex items-center gap-2 ${isTimeBlinking ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-gray-50 border-gray-100'}`}>
            <span className="text-[7px] font-black uppercase text-gray-400">Step</span>
            <span className={`text-[11px] font-mono font-bold ${isTimeBlinking ? 'text-red-600' : 'text-gray-700'}`}>{formatTime(questionSeconds)}</span>
          </div>
          <div className="px-2 py-0.5 rounded-lg border bg-indigo-50 border-indigo-100 flex items-center gap-2">
            <span className="text-[7px] font-black uppercase text-indigo-400">Test</span>
            <span className="text-[11px] font-mono font-bold text-indigo-700">{formatTime(totalTimeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-between min-h-0">
        <div className="shrink-0 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
              currentQuestion.difficulty.toLowerCase() === 'hard' ? 'bg-red-50 text-red-600 border border-red-100' :
              currentQuestion.difficulty.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
              'bg-green-50 text-green-600 border border-green-100'
            }`}>
              {currentQuestion.difficulty} Level
            </span>
            <button 
              onClick={() => alert("Thank you for reporting. Our academic team will review this question.")}
              className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Report Error
            </button>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
            {currentQuestion.text}
          </h3>
          {currentQuestion.imageUrl && (
            <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <img 
                src={currentQuestion.imageUrl} 
                alt="Question illustration" 
                className="w-full h-auto object-contain bg-gray-50"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        <div className="flex-grow flex items-center py-2 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = state.userAnswers[state.currentIndex] === idx;
              const isCorrect = idx === currentQuestion.correctAnswer;
              const showResult = !isMock && state.userAnswers[state.currentIndex] !== null;

              let style = "relative px-4 py-3 rounded-xl border-2 text-left transition-all flex items-center h-full min-h-[60px] ";
              if (isSelected) {
                if (showResult) style += isCorrect ? "bg-green-50 border-green-500 text-green-700" : "bg-red-50 border-red-500 text-red-700";
                else style += "bg-indigo-50 border-indigo-500 text-indigo-700";
              } else if (showResult && isCorrect) style += "bg-green-50 border-green-500 text-green-700";
              else style += "bg-white border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-700";

              return (
                <button key={idx} onClick={() => handleAnswerSelect(idx)} disabled={showResult} className={style}>
                  <span className={`w-5 h-5 rounded flex items-center justify-center font-bold mr-3 shrink-0 text-[10px] ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-xs font-semibold leading-snug">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${showExplanation ? 'max-h-20 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-2 rounded-r-lg">
            <p className="text-amber-900 font-medium italic text-[10px] leading-tight">"{currentQuestion.explanation}"</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center shrink-0">
          <div className="text-[7px] font-black text-gray-300 uppercase tracking-widest">{isMock ? 'Examination Mode' : 'Step Practice'}</div>
          <div className="flex space-x-2">
            {state.currentIndex > 0 && (
              <button onClick={() => setState({...state, currentIndex: state.currentIndex - 1})} className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-gray-600 text-[10px]">Previous</button>
            )}
            <button
              onClick={handleNext}
              disabled={state.userAnswers[state.currentIndex] === null}
              className={`px-5 py-2 rounded-lg font-bold text-white text-[10px] transition-all ${state.userAnswers[state.currentIndex] === null ? 'bg-gray-300' : 'bg-indigo-600 shadow-md hover:scale-105'}`}
            >
              {state.currentIndex === state.questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
