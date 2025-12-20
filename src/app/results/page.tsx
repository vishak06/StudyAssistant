'use client';

import { useEffect, useState } from 'react';
import { FileText, HelpCircle, Loader2, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ResultsPage() {
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState<'notes' | 'questions' | null>(null);

  useEffect(() => {
    const storedResults = sessionStorage.getItem('studyResults');
    if (storedResults) {
      const results = JSON.parse(storedResults);
      setNotes(results.notes || 'No notes generated');
      setQuestions(results.questions || 'No questions generated');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600 text-lg">Loading your study materials...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen pt-1 py-3 overflow-hidden">
      <div className="w-full px-6 max-w-[98%] mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-3">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Your Study Materials</h1>
          <p className="text-gray-600 mt-2">Review your generated notes and practice questions</p>
        </div>

        {/* Content Grid - Full width with scroll */}
        <div className={`${fullscreenMode ? 'grid-cols-1' : 'grid md:grid-cols-2'} grid gap-6 flex-1`} style={{ minHeight: '500px' }}>
          {/* Notes Box */}
          {(!fullscreenMode || fullscreenMode === 'notes') && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-blue-100 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Notes Summary</h2>
                </div>
                <button
                  onClick={() => setFullscreenMode(fullscreenMode === 'notes' ? null : 'notes')}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  title={fullscreenMode === 'notes' ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {fullscreenMode === 'notes' ? (
                    <Minimize2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 text-gray-900">
                <div className="prose prose-sm max-w-none 
                [&_*]:text-gray-900
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-black
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-black
                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-black
                [&_p]:text-gray-900 [&_p]:mb-3 [&_p]:leading-relaxed
                [&_ul]:text-gray-900 [&_ul]:mb-3
                [&_ol]:text-gray-900 [&_ol]:mb-3
                [&_li]:text-gray-900 [&_li]:mb-2 [&_li]:leading-relaxed
                [&_strong]:text-black [&_strong]:font-bold
                [&_em]:text-gray-900 [&_em]:italic
                [&_code]:text-blue-900 [&_code]:bg-blue-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
                [&_pre]:bg-gray-900 [&_pre]:text-white [&_pre]:p-4 [&_pre]:rounded
                [&_hr]:my-8 [&_hr]:border-blue-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {notes}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Questions Box */}
          {(!fullscreenMode || fullscreenMode === 'questions') && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-purple-100 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Practice Questions</h2>
                </div>
                <button
                  onClick={() => setFullscreenMode(fullscreenMode === 'questions' ? null : 'questions')}
                  className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                  title={fullscreenMode === 'questions' ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {fullscreenMode === 'questions' ? (
                    <Minimize2 className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-purple-600" />
                  )}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 text-gray-900">
                <div className="prose prose-sm max-w-none 
                [&_*]:text-gray-900
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-black
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-black
                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-black
                [&_p]:text-gray-900 [&_p]:mb-3 [&_p]:leading-relaxed
                [&_ul]:text-gray-900 [&_ul]:mb-3
                [&_ol]:text-gray-900 [&_ol]:mb-3
                [&_li]:text-gray-900 [&_li]:mb-2 [&_li]:leading-relaxed
                [&_strong]:text-black [&_strong]:font-bold
                [&_em]:text-gray-900 [&_em]:italic
                [&_code]:text-purple-900 [&_code]:bg-purple-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
                [&_pre]:bg-gray-900 [&_pre]:text-white [&_pre]:p-4 [&_pre]:rounded
                [&_hr]:my-8 [&_hr]:border-purple-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {questions}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}