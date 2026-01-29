'use client';

import { useEffect, useState } from 'react';
import { FileText, HelpCircle, Loader2, ArrowLeft, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

export default function ResultsPage() {
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState<'notes' | 'questions' | null>(null);
  const [notesFontSize, setNotesFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [questionsFontSize, setQuestionsFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  const increaseFontSize = (box: 'notes' | 'questions') => {
    if (box === 'notes') {
      setNotesFontSize(prev => prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'large');
    } else {
      setQuestionsFontSize(prev => prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'large');
    }
  };

  const decreaseFontSize = (box: 'notes' | 'questions') => {
    if (box === 'notes') {
      setNotesFontSize(prev => prev === 'large' ? 'medium' : prev === 'medium' ? 'small' : 'small');
    } else {
      setQuestionsFontSize(prev => prev === 'large' ? 'medium' : prev === 'medium' ? 'small' : 'small');
    }
  };

  const getFontSizeClass = (size: 'small' | 'medium' | 'large') => {
    switch(size) {
      case 'small': return 'text-sm';
      case 'medium': return 'text-base';
      case 'large': return 'text-lg';
    }
  };

  // Custom components for ReactMarkdown to fix rendering issues
  const markdownComponents: Components = {
    pre: ({ node, ...props }) => (
      <pre className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded overflow-x-auto my-4 block" {...props} />
    ),
    code: ({ node, className, children, ...props }: any) => {
      const isInline = !className?.includes('language-');
      if (isInline) {
        return (
          <code className="bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 px-2 py-1 rounded font-mono text-sm break-words" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm block whitespace-pre-wrap break-words" {...props}>
          {children}
        </code>
      );
    },
  };

  // Process markdown to fix common issues
  const processMarkdown = (text: string): string => {
    // Ensure code blocks are properly closed
    let processed = text;
    
    // Count opening and closing backticks
    const openingBackticks = (processed.match(/^```/gm) || []).length;
    const closingBackticks = (processed.match(/\n```$/gm) || []).length;
    
    // If there's a mismatch, close any open code blocks
    if (openingBackticks > closingBackticks) {
      const diff = openingBackticks - closingBackticks;
      for (let i = 0; i < diff; i++) {
        processed += '\n```\n';
      }
    }
    
    return processed;
  };

  useEffect(() => {
    const storedResults = sessionStorage.getItem('studyResults');
    if (storedResults) {
      const results = JSON.parse(storedResults);
      setNotes(results.notes || 'No notes generated');
      setQuestions(results.questions || 'No questions generated');
      setIsLoading(false);
    } else {
      // Redirect to home if no results found
      window.location.href = '/';
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading your study materials...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-6 pb-4 md:pt-1 md:pb-1">
      <div className="w-full px-4 md:px-6 max-w-[98%] mx-auto flex flex-col" style={{ height: 'calc(100vh - 2.5rem)' }}>
        {/* Header */}
        <div className="mb-3">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Study Materials</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Review your generated notes and practice questions</p>
        </div>

        {/* Content Grid - Full width with scroll */}
        <div className={`flex flex-col md:flex-row flex-1 relative transition-all duration-500 ${fullscreenMode === 'questions' ? 'gap-0 md:gap-0' : 'gap-6'}`} style={{ minHeight: '500px' }}>
          {/* Notes Box */}
          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-blue-100 dark:border-blue-900 flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
              fullscreenMode === 'notes' 
                ? 'flex-[1_1_100%] h-full' 
                : fullscreenMode === 'questions' 
                  ? 'flex-[0_0_0%] h-0 md:h-full scale-95 -translate-y-8 md:-translate-y-0 md:-translate-x-8 opacity-0 md:opacity-100' 
                  : 'flex-[1_1_50%] h-full md:h-full'
            }`}
            style={{ minWidth: fullscreenMode === 'questions' ? '0' : 'auto', minHeight: fullscreenMode === 'questions' ? '0' : 'auto' }}
          >
              <div className="flex items-center justify-between p-3 md:p-6 border-b border-blue-100 dark:border-blue-900 flex-shrink-0">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <FileText className="w-4 h-4 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">Notes Summary</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => decreaseFontSize('notes')}
                    disabled={notesFontSize === 'small'}
                    className="p-1.5 md:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Decrease font size"
                  >
                    <ZoomOut className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  </button>
                  <button
                    onClick={() => increaseFontSize('notes')}
                    disabled={notesFontSize === 'large'}
                    className="p-1.5 md:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Increase font size"
                  >
                    <ZoomIn className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  </button>
                  <button
                    onClick={() => setFullscreenMode(fullscreenMode === 'notes' ? null : 'notes')}
                    className="p-1.5 md:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                    title={fullscreenMode === 'notes' ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {fullscreenMode === 'notes' ? (
                      <Minimize2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Maximize2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 text-gray-900 dark:text-gray-100">
                <div className={`prose dark:prose-invert max-w-none break-words
                ${notesFontSize === 'small' ? '[&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_p]:text-sm [&_li]:text-sm [&_td]:text-sm [&_th]:text-sm' : ''}
                ${notesFontSize === 'medium' ? '[&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_p]:text-base [&_li]:text-base [&_td]:text-base [&_th]:text-base' : ''}
                ${notesFontSize === 'large' ? '[&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_p]:text-lg [&_li]:text-lg [&_td]:text-lg [&_th]:text-lg' : ''}
                [&_*]:text-gray-900 dark:[&_*]:text-gray-100
                [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-black dark:[&_h1]:text-white [&_h1]:break-words
                [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-black dark:[&_h2]:text-white [&_h2]:break-words
                [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-black dark:[&_h3]:text-white [&_h3]:break-words
                [&_p]:text-gray-900 dark:[&_p]:text-gray-100 [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:break-words
                [&_ul]:text-gray-900 dark:[&_ul]:text-gray-100 [&_ul]:mb-3
                [&_ol]:text-gray-900 dark:[&_ol]:text-gray-100 [&_ol]:mb-3
                [&_li]:text-gray-900 dark:[&_li]:text-gray-100 [&_li]:mb-2 [&_li]:leading-relaxed [&_li]:break-words
                [&_strong]:text-black dark:[&_strong]:text-white [&_strong]:font-bold
                [&_em]:text-gray-900 dark:[&_em]:text-gray-100 [&_em]:italic
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
                [&_th]:border [&_th]:border-gray-300 dark:[&_th]:border-gray-600 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-700 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold [&_th]:break-words
                [&_td]:border [&_td]:border-gray-300 dark:[&_td]:border-gray-600 [&_td]:px-4 [&_td]:py-2 [&_td]:break-words
                [&_hr]:my-8 [&_hr]:border-blue-200 dark:[&_hr]:border-blue-800`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {processMarkdown(notes)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

          {/* Questions Box */}
          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-purple-100 dark:border-purple-900 flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
              fullscreenMode === 'questions' 
                ? 'flex-[1_1_100%] h-full' 
                : fullscreenMode === 'notes' 
                  ? 'flex-[0_0_0%] h-0 md:h-full scale-95 translate-y-8 md:translate-y-0 md:translate-x-8 opacity-0 md:opacity-100' 
                  : 'flex-[1_1_50%] h-full md:h-full'
            }`}
            style={{ minWidth: fullscreenMode === 'notes' ? '0' : 'auto', minHeight: fullscreenMode === 'notes' ? '0' : 'auto' }}
          >
              <div className="flex items-center justify-between p-3 md:p-6 border-b border-purple-100 dark:border-purple-900 flex-shrink-0">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="p-1.5 md:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <HelpCircle className="w-4 h-4 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">Practice Questions</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => decreaseFontSize('questions')}
                    disabled={questionsFontSize === 'small'}
                    className="p-1.5 md:p-2 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Decrease font size"
                  >
                    <ZoomOut className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                  </button>
                  <button
                    onClick={() => increaseFontSize('questions')}
                    disabled={questionsFontSize === 'large'}
                    className="p-1.5 md:p-2 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Increase font size"
                  >
                    <ZoomIn className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                  </button>
                  <button
                    onClick={() => setFullscreenMode(fullscreenMode === 'questions' ? null : 'questions')}
                    className="p-1.5 md:p-2 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
                    title={fullscreenMode === 'questions' ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {fullscreenMode === 'questions' ? (
                      <Minimize2 className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Maximize2 className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 text-gray-900 dark:text-gray-100">
                <div className={`prose dark:prose-invert max-w-none break-words
                ${questionsFontSize === 'small' ? '[&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_p]:text-sm [&_li]:text-sm [&_td]:text-sm [&_th]:text-sm' : ''}
                ${questionsFontSize === 'medium' ? '[&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_p]:text-base [&_li]:text-base [&_td]:text-base [&_th]:text-base' : ''}
                ${questionsFontSize === 'large' ? '[&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_p]:text-lg [&_li]:text-lg [&_td]:text-lg [&_th]:text-lg' : ''}
                [&_*]:text-gray-900 dark:[&_*]:text-gray-100
                [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-black dark:[&_h1]:text-white [&_h1]:break-words
                [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-black dark:[&_h2]:text-white [&_h2]:break-words
                [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-black dark:[&_h3]:text-white [&_h3]:break-words
                [&_p]:text-gray-900 dark:[&_p]:text-gray-100 [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:break-words
                [&_ul]:text-gray-900 dark:[&_ul]:text-gray-100 [&_ul]:mb-3
                [&_ol]:text-gray-900 dark:[&_ol]:text-gray-100 [&_ol]:mb-3
                [&_li]:text-gray-900 dark:[&_li]:text-gray-100 [&_li]:mb-2 [&_li]:leading-relaxed [&_li]:break-words
                [&_strong]:text-black dark:[&_strong]:text-white [&_strong]:font-bold
                [&_em]:text-gray-900 dark:[&_em]:text-gray-100 [&_em]:italic
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
                [&_th]:border [&_th]:border-gray-300 dark:[&_th]:border-gray-600 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-700 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold [&_th]:break-words
                [&_td]:border [&_td]:border-gray-300 dark:[&_td]:border-gray-600 [&_td]:px-4 [&_td]:py-2 [&_td]:break-words
                [&_hr]:my-8 [&_hr]:border-purple-200 dark:[&_hr]:border-purple-800`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {processMarkdown(questions)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
        </div>
      </div>
    </main>
  );
}