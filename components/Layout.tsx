
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onGoHome: () => void;
  onReviewPaper?: () => void;
  hasReviewData: boolean;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onGoHome, onReviewPaper, hasReviewData, title }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center cursor-pointer space-x-2" 
              onClick={onGoHome}
            >
              <div className="bg-indigo-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">EduQuestAI</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <span className="text-gray-300">|</span>
              <span className="text-xs font-black uppercase text-gray-400 tracking-tighter truncate max-w-[200px]">{title || "Intelligent Prep"}</span>
              <button onClick={onGoHome} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Dashboard</button>
              <button 
                onClick={onReviewPaper} 
                disabled={!hasReviewData}
                className={`font-medium flex items-center transition-colors ${
                  hasReviewData ? 'text-gray-600 hover:text-indigo-600' : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                Review Paper
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow bg-[#fcfdfe]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} EduQuestAI Pro. Smart Search-Grounded AI Prep.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
