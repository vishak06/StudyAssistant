'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileText, HelpCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get results from URL params or sessionStorage
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
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Notes Box */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Notes Summary</h2>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {notes}
              </div>
            </div>
          </div>

          {/* Questions Box */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HelpCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Practice Questions</h2>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {questions}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Print Study Materials
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
          >
            Create New
          </Link>
        </div>
      </div>
    </main>
  );
}