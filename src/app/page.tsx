'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Link as LinkIcon, X, FileText, Loader2 } from 'lucide-react';

export default function Home() {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progress bar state (shown when submit clicked)
  const [progress, setProgress] = useState<number>(0);
  const [isProgressVisible, setIsProgressVisible] = useState<boolean>(false);
  const progressIntervalRef = useRef<number | null>(null);
  const progressStartTimeRef = useRef<number | null>(null);
  const PROGRESS_TICK_MS = 500;
  const PROGRESS_TARGET = 98; // target percent to reach over duration
  const PROGRESS_DURATION_MS = 135000; // 2 minutes 15 seconds

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  const startProgress = () => {
    setIsProgressVisible(true);
    setProgress(0);
    const ticks = PROGRESS_DURATION_MS / PROGRESS_TICK_MS;
    const increment = PROGRESS_TARGET / ticks;
    progressStartTimeRef.current = Date.now();
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        const next = Math.min(PROGRESS_TARGET, +(prev + increment).toFixed(3));
        if (next >= PROGRESS_TARGET && progressIntervalRef.current) {
          window.clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        return next;
      });
    }, PROGRESS_TICK_MS) as unknown as number;
  };

  const stopProgress = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsProgressVisible(false);
    setProgress(0);
  };

  const finalizeAndNavigateWithResults = (results: any) => {
    sessionStorage.setItem('studyResults', JSON.stringify(results));
    setProgress(100);
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setTimeout(() => {
      window.location.href = '/results';
    }, 300);
  };

  const finalizeAndNavigateWithError = (errorObj: any) => {
    sessionStorage.setItem('studyError', JSON.stringify(errorObj));
    setProgress(100);
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setTimeout(() => {
      window.location.href = '/error';
    }, 300);
  };

  const handlePdfClick = () => {
    // Close URL input if it's open
    if (showUrlInput) {
      setShowUrlInput(false);
      setUrl('');
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    }
  };

  const handlePdfProcess = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingStep('Uploading and extracting content...');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      // Simulate progress updates based on actual agent timing
      const progressTimer1 = setTimeout(() => {
        setProcessingStep('Analyzing content structure...');
      }, 40000);

      const progressTimer2 = setTimeout(() => {
        setProcessingStep('Generating smart notes...');
      }, 70000);

      const progressTimer3 = setTimeout(() => {
        setProcessingStep('Preparing practice questions...');
      }, 90000);
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      // Clear timers
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);

      const data = await response.json();

      if (data.success) {
        setProcessingStep('Complete!');
        // Store results and navigate when progress completes
        const results = {
          notes: data.notes || 'No notes generated',
          questions: data.questions || 'No questions generated'
        };
        finalizeAndNavigateWithResults(results);
      } else {
        const errorMsg = data.errorMessage || data.error || 'Failed to process PDF. Please try again.';
        console.error('Processing error:', errorMsg);
        finalizeAndNavigateWithError({
          message: errorMsg,
          type: data.isError ? 'processing_required' : 'general'
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error || 'An error occurred. Please try again.');
      console.error('Request error:', errorMsg);
      finalizeAndNavigateWithError({
        message: errorMsg,
        type: 'general'
      });
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) return;

    setIsProcessing(true);
    setProcessingStep('Fetching content from URL...');

    try {
      // Simulate progress updates based on actual agent timing
      const progressTimer1 = setTimeout(() => {
        setProcessingStep('Analyzing content structure...');
      }, 40000);

      const progressTimer2 = setTimeout(() => {
        setProcessingStep('Generating smart notes...');
      }, 70000);

      const progressTimer3 = setTimeout(() => {
        setProcessingStep('Preparing practice questions...');
      }, 90000);
      const response = await fetch('/api/process-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      // Clear timers
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);

      const data = await response.json();

      if (data.success) {
        setProcessingStep('Complete!');
        const results = {
          notes: data.notes || 'No notes generated',
          questions: data.questions || 'No questions generated'
        };
        finalizeAndNavigateWithResults(results);
      } else {
        const errorMsg = data.errorMessage || data.error || 'Failed to process URL. Please try again.';
        console.error('Processing error:', errorMsg);
        finalizeAndNavigateWithError({
          message: errorMsg,
          type: data.isError ? 'processing_required' : 'general'
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error || 'An error occurred. Please try again.');
      console.error('Request error:', errorMsg);
      finalizeAndNavigateWithError({
        message: errorMsg,
        type: 'general'
      });
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <main className="h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-4 py-8 md:py-6">
          {/* Welcome Section */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-blue-600">Study Assistant</span>
            </h1>
            <p className="text-base text-gray-600 leading-relaxed">
              Transform your learning materials into comprehensive notes and practice questions.
              Simply upload a PDF or provide a URL, and let our AI-powered assistant generate
              structured notes and targeted questions to enhance your study experience.
            </p>
          </div>

          {/* Options Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-6">
              Choose Your Input Method
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* PDF Upload Option */}
              <div>
                <div
                  onClick={() => {
                    if (!isProcessing) {
                      handlePdfClick();
                    }
                  }}
                  className={`group relative p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300 w-full h-[220px] flex items-center justify-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : !uploadedFile ? 'cursor-pointer' : ''}`}
                >
                  {uploadedFile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isProcessing) clearFile();
                      }}
                      disabled={isProcessing}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors disabled:opacity-50"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {uploadedFile ? (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-full bg-blue-100">
                        <FileText className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Uploaded PDF</h3>
                      <p className="text-sm text-gray-600 break-all px-2 line-clamp-2">
                        {uploadedFile.name}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                        <Upload className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Upload PDF</h3>
                      <p className="text-sm text-gray-600">
                        Upload your study materials in PDF format and get instant notes and questions
                      </p>
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
              </div>

              {/* URL Option */}
              <div>
                <div
                  onClick={() => {
                    if (!isProcessing) {
                      // Close file upload if a file is selected
                      if (uploadedFile) {
                        clearFile();
                      }
                      setShowUrlInput(true);
                    }
                  }}
                  className={`group relative p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-300 hover:shadow-md transition-all duration-300 w-full h-[220px] flex items-center justify-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : !showUrlInput ? 'cursor-pointer' : ''}`}
                >
                  {showUrlInput && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isProcessing) {
                          setShowUrlInput(false);
                          setUrl('');
                        }
                      }}
                      disabled={isProcessing}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors disabled:opacity-50"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showUrlInput ? (
                    <div className="flex flex-col items-center text-center space-y-3 w-full">
                      <div className="p-3 rounded-full bg-purple-100">
                        <LinkIcon className="w-10 h-10 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Enter URL</h3>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="https://example.com/article"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                        disabled={isProcessing}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                        <LinkIcon className="w-10 h-10 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Provide URL</h3>
                      <p className="text-sm text-gray-600">
                        Share a link to online content and receive comprehensive study materials
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Common Submit Button + Progress (absolute, slides down) */}
            <div className="flex justify-center mt-8 relative">
              <div className="relative">
                <button
                  onClick={() => {
                    if (isProcessing) return;
                    startProgress();
                    if (uploadedFile) {
                      handlePdfProcess();
                    } else if (url.trim()) {
                      handleUrlSubmit();
                    }
                  }}
                  disabled={(!uploadedFile && !url.trim()) || isProcessing}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed min-w-[200px] flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{processingStep || 'Processing...'}</span>
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>

                {/* Absolute progress bar that slides down from the button without affecting layout */}
                <div className={`absolute left-1/2 top-full transform -translate-x-1/2 w-[480px] max-w-[90vw] mt-2 mb-4 md:mb-0 transition-all duration-300 pointer-events-none ${isProgressVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
                  <div className="px-0">
                    <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}