
import React from 'react';
import { SyllabusData } from '../types';

interface ResultScreenProps {
  score: number;
  total: number;
  syllabus?: SyllabusData | null;
  onRestart: () => void;
  onGoHome: () => void;
  onReview: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ score, total, syllabus, onRestart, onGoHome, onReview }) => {
  const percentage = (score / total) * 100;
  
  let message = "";
  let emoji = "";
  if (percentage === 100) { message = "Perfect Score! You're a Wizard!"; emoji = "🏆"; }
  else if (percentage >= 80) { message = "Excellent Job! Almost there!"; emoji = "🌟"; }
  else if (percentage >= 50) { message = "Good Effort! Keep practicing."; emoji = "💪"; }
  else { message = "Keep learning! You'll get better."; emoji = "📚"; }

  return (
    <div className="max-w-4xl mx-auto text-center space-y-12 py-10">
      <div className="space-y-4">
        <div className="text-7xl mb-4">{emoji}</div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{message}</h1>
        <p className="text-gray-500 text-lg font-medium">You completed the assessment successfully.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
              <div className="text-5xl font-black text-indigo-600">{score}/{total}</div>
              <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-3">Score</div>
            </div>
            <div className="text-center p-8 bg-purple-50 rounded-[2rem] border border-purple-100">
              <div className="text-5xl font-black text-purple-600">{Math.round(percentage)}%</div>
              <div className="text-xs font-black text-purple-400 uppercase tracking-widest mt-3">Accuracy</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">
              <span>Progress</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="w-full bg-gray-100 h-6 rounded-full overflow-hidden border-4 border-white shadow-inner">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {syllabus && (
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl space-y-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="text-lg font-black uppercase tracking-widest text-indigo-400 border-b border-white/10 pb-4">Exam Insights</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Questions</p>
                <p className="text-sm font-bold text-indigo-100">{syllabus.totalQuestions || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Negative Marking</p>
                <p className="text-sm font-bold text-indigo-100">{syllabus.negativeMarking || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Expected Cutoff</p>
                <p className="text-sm font-bold text-indigo-100">{syllabus.cutoff || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Rank & Percentile Analysis</p>
                <p className="text-[11px] font-medium leading-relaxed text-gray-300 italic">{syllabus.rankAnalysis || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <button 
          onClick={onRestart}
          className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
        >
          Try Again
        </button>
        <button 
          onClick={onReview}
          className="bg-amber-500 text-white px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-amber-600 transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
        >
          Review Questions
        </button>
        <button 
          onClick={onGoHome}
          className="bg-white text-gray-700 border-2 border-gray-100 px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-gray-50 transition-all hover:border-gray-200"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
