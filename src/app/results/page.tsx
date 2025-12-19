'use client';

import { useEffect, useState } from 'react';
import { FileText, HelpCircle, Loader2, ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ResultsPage() {
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600 text-lg">Loading your study materials...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="w-full px-6 max-w-[98%] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Your Study Materials</h1>
          <p className="text-gray-600 mt-2">Review your generated notes and practice questions</p>
        </div>

        {/* Content Grid - Full width with scroll */}
        <div className="grid md:grid-cols-2 gap-6 mb-8" style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
          {/* Notes Box */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 flex flex-col h-full overflow-hidden">
            <div className="flex items-center space-x-3 p-6 border-b border-blue-100 flex-shrink-0">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Notes Summary</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-gray-900">
              <div className="prose prose-base max-w-none 
                [&_*]:text-gray-900
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-black
                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-black
                [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-black
                [&_p]:text-gray-900 [&_p]:mb-3 [&_p]:leading-relaxed
                [&_ul]:text-gray-900 [&_ul]:mb-3
                [&_ol]:text-gray-900 [&_ol]:mb-3
                [&_li]:text-gray-900 [&_li]:mb-2 [&_li]:leading-relaxed
                [&_strong]:text-black [&_strong]:font-bold
                [&_em]:text-gray-900 [&_em]:italic
                [&_code]:text-blue-900 [&_code]:bg-blue-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:font-mono
                [&_pre]:bg-gray-900 [&_pre]:text-white [&_pre]:p-4 [&_pre]:rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {notes}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Questions Box */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 flex flex-col h-full overflow-hidden">
            <div className="flex items-center space-x-3 p-6 border-b border-purple-100 flex-shrink-0">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HelpCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Practice Questions</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 text-gray-900">
              <div className="prose prose-base max-w-none 
                [&_*]:text-gray-900
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-black
                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-black
                [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-black
                [&_p]:text-gray-900 [&_p]:mb-3 [&_p]:leading-relaxed
                [&_ul]:text-gray-900 [&_ul]:mb-3
                [&_ol]:text-gray-900 [&_ol]:mb-3
                [&_li]:text-gray-900 [&_li]:mb-2 [&_li]:leading-relaxed
                [&_strong]:text-black [&_strong]:font-bold
                [&_em]:text-gray-900 [&_em]:italic
                [&_code]:text-purple-900 [&_code]:bg-purple-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:font-mono
                [&_pre]:bg-gray-900 [&_pre]:text-white [&_pre]:p-4 [&_pre]:rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {questions}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New
          </Link>
        </div>
      </div>
    </main>
  );
}