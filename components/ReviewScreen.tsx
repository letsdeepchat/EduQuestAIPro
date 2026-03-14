
import React, { useRef, useState } from 'react';
import { Question } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReviewScreenProps {
  questions: Question[];
  userAnswers: (number | null)[];
  onBack: () => void;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ questions, userAnswers, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5, // Reduced scale for smaller size
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc'
      });
      
      // Use JPEG with 0.7 quality for significant compression
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable internal PDF compression
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Use JPEG format in addImage
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save('Review_Paper.pdf');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Review Paper</h1>
        <div className="flex gap-4">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
              isGenerating 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
          <button 
            onClick={onBack}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            Back to Results
          </button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6 p-4">
        {questions.map((q, idx) => {
          const userAnswer = userAnswers[idx];
          const isCorrect = userAnswer === q.correctAnswer;
          
          return (
            <div key={q.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="bg-indigo-50 text-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{q.text}</h3>
                </div>
                {userAnswer !== null ? (
                  isCorrect ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">Correct</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">Incorrect</span>
                  )
                ) : (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">Unanswered</span>
                )}
              </div>

              {q.imageUrl && (
                <div className="w-full max-w-md rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img 
                    src={q.imageUrl} 
                    alt="Question illustration" 
                    className="w-full h-auto object-contain bg-gray-50"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((option, optIdx) => {
                  let style = "p-4 rounded-xl border-2 flex items-center gap-3 ";
                  if (optIdx === q.correctAnswer) {
                    style += "border-green-500 bg-green-50 text-green-800";
                  } else if (optIdx === userAnswer && !isCorrect) {
                    style += "border-red-500 bg-red-50 text-red-800";
                  } else {
                    style += "border-gray-50 bg-gray-50 text-gray-600";
                  }

                  return (
                    <div key={optIdx} className={style}>
                      <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                        optIdx === q.correctAnswer ? 'bg-green-600 text-white' : 
                        (optIdx === userAnswer ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400')
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="font-medium text-sm">{option}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 border-l-4 border-amber-400">
                <p className="text-amber-900 font-bold text-xs uppercase mb-1">Explanation:</p>
                <p className="text-amber-800 text-sm italic">{q.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <button 
          onClick={onBack}
          className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl transition-all"
        >
          Return to Results
        </button>
      </div>
    </div>
  );
};

export default ReviewScreen;
