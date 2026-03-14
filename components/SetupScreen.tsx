
import React, { useState, useEffect } from 'react';
import { UserPreferences, ExamCategory } from '../types';

interface SetupScreenProps {
  onComplete: (prefs: UserPreferences) => void;
}

const LANGUAGES = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Gujarati", "Urdu", "Kannada", "Odia", "Punjabi", "Malayalam", 
  "Spanish", "French", "German", "Chinese", "Japanese", "Arabic", "Russian"
];

const CLASSES = [
  ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
  "Graduation",
  "Post-Graduation",
  "Interview Practice"
];

const EXAMS = [
  // School Level / Olympiads (1st - 10th)
  { id: 'SOF_IMO', name: 'SOF IMO (Math)', category: ExamCategory.OLYMPIAD, subjects: [], minClass: 1, maxClass: 12 },
  { id: 'SOF_NSO', name: 'SOF NSO (Science)', category: ExamCategory.OLYMPIAD, subjects: [], minClass: 1, maxClass: 12 },
  { id: 'SILVERZONE_IOM', name: 'SilverZone iOM (Math)', category: ExamCategory.OLYMPIAD, subjects: [], minClass: 1, maxClass: 12 },
  { id: 'CREST_CMO', name: 'CREST CMO (Math)', category: ExamCategory.OLYMPIAD, subjects: [], minClass: 1, maxClass: 12 },
  { id: 'NTSE', name: 'NTSE', category: ExamCategory.OLYMPIAD, subjects: ['Mental Ability (MAT)', 'SAT (Syllabus)'], minClass: 10, maxClass: 10 },
  { id: 'NSEJS', name: 'NSEJS (Junior Science)', category: ExamCategory.OLYMPIAD, subjects: [], minClass: 8, maxClass: 10 },
  { id: 'PRMO', name: 'PRMO/RMO (Math)', category: ExamCategory.OLYMPIAD, subjects: [], minClass: 8, maxClass: 12 },
  
  // 12th Level Entrance & Government Exams
  { id: 'JEE_MAIN', name: 'IIT-JEE Main', category: ExamCategory.ENTRANCE, subjects: ['Mathematics', 'Physics', 'Chemistry'], minClass: 11, maxClass: 12 },
  { id: 'JEE_ADV', name: 'IIT-JEE Advanced', category: ExamCategory.ENTRANCE, subjects: ['Mathematics', 'Physics', 'Chemistry'], minClass: 12, maxClass: 12 },
  { id: 'NEET', name: 'NEET (Medical)', category: ExamCategory.ENTRANCE, subjects: ['Biology', 'Physics', 'Chemistry'], minClass: 11, maxClass: 12 },
  { id: 'BITSAT', name: 'BITSAT', category: ExamCategory.ENTRANCE, subjects: ['Physics', 'Chemistry', 'Mathematics', 'English & LR'], minClass: 12, maxClass: 12 },
  { id: 'VITEEE', name: 'VITEEE', category: ExamCategory.ENTRANCE, subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'], minClass: 12, maxClass: 12 },
  { id: 'NDA', name: 'NDA & NA (Defense)', category: ExamCategory.ENTRANCE, subjects: ['Mathematics', 'General Ability'], minClass: 12, maxClass: 12 },
  { id: 'CLAT_UG', name: 'CLAT (Law)', category: ExamCategory.ENTRANCE, subjects: ['Legal Reasoning', 'Logical Reasoning', 'English', 'GK'], minClass: 12, maxClass: 12 },
  { id: 'CUET_UG', name: 'CUET (UG)', category: ExamCategory.ENTRANCE, subjects: ['General Test', 'Domain Specific'], minClass: 12, maxClass: 12 },
  { id: 'IPMAT', name: 'IPMAT (Management)', category: ExamCategory.ENTRANCE, subjects: ['Quantitative Ability', 'Verbal Ability'], minClass: 12, maxClass: 12 },
  { id: 'NIFT', name: 'NIFT Entrance', category: ExamCategory.ENTRANCE, subjects: ['GAT', 'CAT'], minClass: 12, maxClass: 12 },
  { id: 'NID', name: 'NID DAT', category: ExamCategory.ENTRANCE, subjects: [], minClass: 12, maxClass: 12 },
  { id: 'KVPY', name: 'KVPY', category: ExamCategory.OLYMPIAD, subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'], minClass: 11, maxClass: 12 },

  // 12th-Pass Government Job Exams (Competitive)
  { id: 'SSC_CHSL', name: 'SSC CHSL', category: ExamCategory.COMPETITIVE, subjects: ['English', 'Quant', 'Reasoning', 'GA'], minClass: 12, maxClass: 15 },
  { id: 'SSC_STENO', name: 'SSC Stenographer', category: ExamCategory.COMPETITIVE, subjects: ['English', 'Reasoning', 'GA'], minClass: 12, maxClass: 15 },
  { id: 'AF_AGNIVEER', name: 'IAF Agniveer Vayu', category: ExamCategory.COMPETITIVE, subjects: ['Physics', 'Math', 'English', 'RAGA'], minClass: 12, maxClass: 12 },
  { id: 'NAVY_SSR', name: 'Navy Agniveer SSR', category: ExamCategory.COMPETITIVE, subjects: ['Math', 'Physics', 'English', 'GK'], minClass: 12, maxClass: 12 },
  { id: 'RRB_NTPC_UG', name: 'RRB NTPC (UG Level)', category: ExamCategory.COMPETITIVE, subjects: ['Math', 'Reasoning', 'GA'], minClass: 12, maxClass: 15 },
  { id: 'RRB_ALP', name: 'RRB ALP & Technician', category: ExamCategory.COMPETITIVE, subjects: ['Math', 'Reasoning', 'Science', 'GA'], minClass: 12, maxClass: 15 },
  { id: 'CAPF_HC', name: 'CAPF Head Constable', category: ExamCategory.COMPETITIVE, subjects: ['English', 'Math', 'Reasoning', 'Clerical Aptitude'], minClass: 12, maxClass: 15 },
  { id: 'DELHI_POLICE', name: 'Delhi Police Constable', category: ExamCategory.COMPETITIVE, subjects: ['Reasoning', 'GK', 'Math', 'Computer'], minClass: 12, maxClass: 15 },
  { id: 'STATE_POLICE', name: 'State Police Constable', category: ExamCategory.COMPETITIVE, subjects: ['GK', 'Math', 'Reasoning', 'Language'], minClass: 12, maxClass: 15 },
  { id: 'SSC_MTS', name: 'SSC MTS', category: ExamCategory.COMPETITIVE, subjects: ['Math', 'Reasoning', 'English', 'GA'], minClass: 10, maxClass: 15 },
  { id: 'SSC_GD', name: 'SSC GD Constable', category: ExamCategory.COMPETITIVE, subjects: ['Math', 'Reasoning', 'GK', 'Language'], minClass: 10, maxClass: 15 },

  // Graduation Level / Competitive Exams
  { id: 'UPSC_CSE', name: 'UPSC CSE (IAS/IPS)', category: ExamCategory.COMPETITIVE, subjects: ['General Studies', 'CSAT'], minClass: 13, maxClass: 15 },
  { id: 'CAT', name: 'CAT (MBA)', category: ExamCategory.COMPETITIVE, subjects: ['VARC', 'DILR', 'QA'], minClass: 13, maxClass: 15 },
  { id: 'GATE', name: 'GATE', category: ExamCategory.COMPETITIVE, subjects: ['General Aptitude', 'Technical Subject'], minClass: 13, maxClass: 15 },
  { id: 'SSC_CGL', name: 'SSC CGL', category: ExamCategory.COMPETITIVE, subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'GK'], minClass: 13, maxClass: 15 },
  { id: 'SBI_PO', name: 'SBI/IBPS PO', category: ExamCategory.COMPETITIVE, subjects: ['Reasoning', 'Quant', 'English', 'GA'], minClass: 13, maxClass: 15 },
  { id: 'RBI_GRADE_B', name: 'RBI Grade B', category: ExamCategory.COMPETITIVE, subjects: ['Phase 1', 'Phase 2'], minClass: 13, maxClass: 15 },
  { id: 'GRE', name: 'GRE', category: ExamCategory.COMPETITIVE, subjects: ['Verbal', 'Quant', 'AWA'], minClass: 13, maxClass: 15 },
  { id: 'GMAT', name: 'GMAT', category: ExamCategory.COMPETITIVE, subjects: ['Quant', 'Verbal', 'Data Insights'], minClass: 13, maxClass: 15 },
  { id: 'JAM', name: 'IIT JAM', category: ExamCategory.COMPETITIVE, subjects: [], minClass: 13, maxClass: 15 },
  { id: 'CLAT_PG', name: 'CLAT (PG)', category: ExamCategory.COMPETITIVE, subjects: ['Constitutional Law', 'Other Law Subjects'], minClass: 13, maxClass: 15 },
  { id: 'XAT', name: 'XAT', category: ExamCategory.COMPETITIVE, subjects: ['Decision Making', 'VARC', 'QA', 'GK'], minClass: 13, maxClass: 15 },
  { id: 'SNAP', name: 'SNAP', category: ExamCategory.COMPETITIVE, subjects: [], minClass: 13, maxClass: 15 },
  { id: 'NMAT', name: 'NMAT', category: ExamCategory.COMPETITIVE, subjects: [], minClass: 13, maxClass: 15 },
  { id: 'CDS', name: 'CDS (Defense)', category: ExamCategory.COMPETITIVE, subjects: ['English', 'GK', 'Elementary Math'], minClass: 13, maxClass: 15 },
  { id: 'AFCAT', name: 'AFCAT', category: ExamCategory.COMPETITIVE, subjects: [], minClass: 13, maxClass: 15 },
  { id: 'NET', name: 'UGC NET', category: ExamCategory.COMPETITIVE, subjects: ['Paper 1', 'Paper 2'], minClass: 14, maxClass: 15 },
  { id: 'CSIR_NET', name: 'CSIR NET', category: ExamCategory.COMPETITIVE, subjects: [], minClass: 14, maxClass: 15 },
  { id: 'TISSNET', name: 'TISSNET', category: ExamCategory.COMPETITIVE, subjects: [], minClass: 13, maxClass: 15 },
  { id: 'NEET_PG', name: 'NEET PG', category: ExamCategory.COMPETITIVE, subjects: [], minClass: 14, maxClass: 15 }
];

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    language: 'English',
    className: 'Class 3',
    examType: 'SOF IMO (Math)',
    subject: undefined
  });

  const getClassLevel = (className: string) => {
    if (className === "Graduation") return 13;
    if (className === "Post-Graduation") return 14;
    if (className === "Interview Practice") return 15; // Treat as highest level to show all competitive exams
    return parseInt(className.replace("Class ", ""));
  };

  const currentLevel = getClassLevel(prefs.className);
  const filteredExams = EXAMS.filter(e => currentLevel >= e.minClass && currentLevel <= e.maxClass);

  const selectedExam = filteredExams.find(e => e.name === prefs.examType) || filteredExams[0];
  const showSubject = selectedExam && selectedExam.subjects.length > 0 && prefs.className !== "Interview Practice";

  useEffect(() => {
    // Reset exam type if current one is not valid for the new class
    if (!filteredExams.find(e => e.name === prefs.examType)) {
      setPrefs(p => ({ ...p, examType: filteredExams[0].name }));
    }
  }, [prefs.className]);

  useEffect(() => {
    if (prefs.className === "Interview Practice") {
      setPrefs(p => ({ ...p, subject: undefined }));
      return;
    }
    if (selectedExam && selectedExam.subjects.length > 0) {
      const combinedValue = `Combined (${selectedExam.subjects.join(', ')})`;
      // If no subject is selected, or the current subject is invalid for this exam
      if (!prefs.subject || (!selectedExam.subjects.includes(prefs.subject) && prefs.subject !== combinedValue)) {
        // Default to the first subject
        setPrefs(p => ({ ...p, subject: selectedExam.subjects[0] }));
      }
    } else {
      setPrefs(p => ({ ...p, subject: undefined }));
    }
  }, [prefs.examType, prefs.className]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-block p-5 bg-indigo-600 rounded-[2rem] shadow-2xl mb-4 border-4 border-white">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">EduQuestAI <span className="text-indigo-600">Pro</span></h1>
        <p className="text-gray-500 font-bold text-lg">Intelligent Prep for Class 1 to 12 & Competitive Exams</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 md:p-12 space-y-8">
        <div className="space-y-3">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Learning Language</label>
          <select 
            value={prefs.language}
            onChange={(e) => setPrefs({...prefs, language: e.target.value})}
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-gray-700 focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none"
          >
            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Class</label>
            <select 
              value={prefs.className}
              onChange={(e) => setPrefs({...prefs, className: e.target.value})}
              className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-gray-700 focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none"
            >
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Examination</label>
            <select 
              value={prefs.examType}
              onChange={(e) => setPrefs({...prefs, examType: e.target.value})}
              className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-gray-700 focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none"
            >
              {Object.values(ExamCategory).map(cat => {
                const catExams = filteredExams.filter(e => e.category === cat);
                if (catExams.length === 0) return null;
                return (
                  <optgroup key={cat} label={cat}>
                    {catExams.map(exam => (
                      <option key={exam.id} value={exam.name}>{exam.name}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        </div>

        {showSubject && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Focus Subject</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedExam.subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setPrefs({...prefs, subject: sub})}
                  className={`py-4 px-2 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    prefs.subject === sub 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <span className="uppercase tracking-widest">{sub}</span>
                </button>
              ))}
              {selectedExam.subjects.length > 1 && (
                <button
                  onClick={() => {
                    const combinedValue = `Combined (${selectedExam.subjects.join(', ')})`;
                    setPrefs({...prefs, subject: combinedValue});
                  }}
                  className={`py-4 px-2 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                    prefs.subject?.startsWith('Combined')
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <span className="uppercase tracking-widest text-[10px]">Combined</span>
                  <span className={`text-[8px] font-bold ${prefs.subject?.startsWith('Combined') ? 'text-indigo-200' : 'text-gray-400'}`}>
                    ({selectedExam.subjects.join(', ')})
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        <button 
          onClick={() => onComplete(prefs)}
          className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-700 transform hover:-translate-y-1 active:scale-95 transition-all mt-6"
        >
          Research My Syllabus
        </button>
      </div>

      <div className="mt-12 flex flex-col items-center space-y-3">
        <div className="flex items-center space-x-3 px-6 py-2 bg-white rounded-full shadow-sm border border-gray-100">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Real-time Web Grounding: Active</span>
        </div>
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter text-center max-w-xs leading-tight">
          Syllabus data is fetched dynamically to ensure 100% current year accuracy.
        </p>
      </div>
    </div>
  );
};

export default SetupScreen;
