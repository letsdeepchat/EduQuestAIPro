
import React from 'react';
import { Topic, SyllabusData, UserPreferences } from '../types';

interface DashboardProps {
  syllabus: SyllabusData;
  masteredTopics: string[];
  prefs: UserPreferences;
  onStartPractice: (topic: Topic) => void;
  onStartMock: () => void;
  onStartInterview: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ syllabus, masteredTopics, prefs, onStartPractice, onStartMock, onStartInterview }) => {
  const scrollToSyllabus = () => {
    const el = document.getElementById('syllabus');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full -ml-40 -mb-40 blur-[80px]"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
              Curriculum Data: Real-Time Verified
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight text-white drop-shadow-sm">
              {syllabus.title}
            </h1>
            
            <p className="text-indigo-100 text-lg md:text-xl leading-relaxed font-bold opacity-80 max-w-xl">
              {syllabus.examInfo}
            </p>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-[1.5rem] hover:bg-white/15 transition-colors">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">Total Questions</p>
                <p className="text-xl font-black text-white">{syllabus.totalQuestions || 'N/A'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-[1.5rem] hover:bg-white/15 transition-colors">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">Total Marks</p>
                <p className="text-xl font-black text-white">{syllabus.totalMarks || 'N/A'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-[1.5rem] hover:bg-white/15 transition-colors">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">Negative Marking</p>
                <p className="text-xl font-black text-white">{syllabus.negativeMarking || 'N/A'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-[1.5rem] hover:bg-white/15 transition-colors">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">Cutoff Trends</p>
                <p className="text-xl font-black text-white">{syllabus.cutoff || 'N/A'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-[1.5rem] hover:bg-white/15 transition-colors col-span-2 sm:col-span-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1">Exam Pattern</p>
                <p className="text-[11px] font-bold text-white line-clamp-2">{syllabus.examPattern || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-[2rem] mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Rank & Percentile Analysis (3Y)</p>
              <p className="text-[12px] font-bold leading-relaxed text-indigo-100">{syllabus.rankAnalysis || 'N/A'}</p>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
              <button 
                onClick={onStartMock}
                className="bg-white text-indigo-900 px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-indigo-50 transition-all shadow-2xl hover:-translate-y-1 active:scale-95 group flex items-center gap-3"
              >
                Start Mock Test
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              
              {(syllabus.hasInterview || prefs.className === "Interview Practice") && (
                <button 
                  onClick={onStartInterview}
                  className="bg-emerald-500 text-white px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-emerald-600 transition-all shadow-2xl hover:-translate-y-1 active:scale-95 group flex items-center gap-3"
                >
                  AI Interview Practice
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </button>
              )}

              <button 
                onClick={scrollToSyllabus}
                className="bg-white/10 text-white backdrop-blur-xl border border-white/20 px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-white/20 transition-all"
              >
                Browse Syllabus
              </button>
            </div>
          </div>
          
          <div className="hidden lg:block shrink-0">
             <div className="bg-white/5 p-8 rounded-[3rem] backdrop-blur-2xl border border-white/10 shadow-2xl w-80 rotate-2 hover:rotate-0 transition-transform duration-500">
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 text-indigo-300">Researched Sources</h4>
                <div className="space-y-5">
                  {syllabus.sources?.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="w-5 h-5 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-400/30">
                        <svg className="w-2.5 h-2.5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </div>
                      <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-indigo-100 hover:text-white transition-colors line-clamp-2 leading-tight opacity-70 group-hover:opacity-100">{s.title}</a>
                    </div>
                  ))}
                  {(!syllabus.sources || syllabus.sources.length === 0) && (
                    <div className="text-xs text-indigo-200/50 italic font-bold">Researching verified educational databases...</div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Study Plan Section */}
      {syllabus.studyPlan && (
        <div className="bg-white rounded-[3rem] p-10 border border-indigo-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-lg shrink-0">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="space-y-3 text-center md:text-left">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Mastery Study Plan</h3>
              <p className="text-gray-600 font-bold text-lg leading-relaxed italic opacity-90">
                "{syllabus.studyPlan}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Syllabus Grid */}
      <div id="syllabus" className="space-y-20 pt-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
          <div className="w-16 h-1 bg-indigo-600 rounded-full mb-2"></div>
          <h2 className="text-5xl font-black text-gray-900 tracking-tight">Mastery Modules</h2>
          <p className="text-gray-500 font-bold text-lg leading-relaxed">
            Personalized learning path based on the actual {new Date().getFullYear() - 1}-{new Date().getFullYear().toString().slice(-2)} examination guidelines and high-yield chapters.
          </p>
        </div>

        <div className="space-y-24">
          {syllabus?.sections?.map((section) => (
            <div key={section.name} className="space-y-10">
              <div className="flex items-center gap-6 group">
                <div className="bg-white p-6 rounded-[2rem] text-5xl shadow-xl border border-gray-100 group-hover:scale-110 transition-transform duration-500">{section.icon}</div>
                <div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">{section.name}</h2>
                  <p className="text-indigo-500 font-black uppercase text-[11px] tracking-widest mt-1">{section.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section?.topics?.map((topic) => {
                  const isMastered = masteredTopics.includes(topic.id);
                  return (
                    <div 
                      key={topic.id} 
                      className={`bg-white group rounded-[3rem] p-10 border transition-all duration-500 flex flex-col justify-between h-full relative overflow-hidden ${
                        isMastered ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:border-indigo-400 hover:shadow-2xl'
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] -mr-8 -mt-8 transition-colors duration-500 ${
                        isMastered ? 'bg-green-100' : 'bg-indigo-50 group-hover:bg-indigo-600'
                      }`}></div>
                      
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-colors ${
                            isMastered ? 'bg-green-600 text-white' : 'bg-indigo-50 text-indigo-400 group-hover:bg-white group-hover:text-indigo-600'
                          }`}>
                            {isMastered ? 'Mastered' : 'Chapter'}
                          </span>
                          {isMastered && (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">{topic.name}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 font-bold opacity-80 italic">{topic.description}</p>
                      </div>

                      <button 
                        onClick={() => onStartPractice(topic)}
                        className={`relative z-10 mt-10 w-full py-5 rounded-2xl border-4 font-black transition-all shadow-sm flex items-center justify-center gap-3 text-sm group-hover:-translate-y-1 ${
                          isMastered 
                            ? 'border-green-100 text-green-600 hover:bg-green-600 hover:text-white hover:border-green-600' 
                            : 'border-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                        }`}
                      >
                        {isMastered ? 'Review Chapter' : 'Step-by-Step Practice'}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
