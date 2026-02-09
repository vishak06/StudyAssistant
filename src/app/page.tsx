'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Link as LinkIcon, X, FileText, Loader2 } from 'lucide-react';

// IndexedDB helper functions for storing PDF files
const DB_NAME = 'StudyAssistantDB';
const STORE_NAME = 'pendingFiles';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function savePendingFile(file: File): Promise<void> {
  const db = await openDB();
  const arrayBuffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: 'pendingPdf', name: file.name, type: file.type, data: arrayBuffer });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPendingFile(): Promise<File | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get('pendingPdf');
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const file = new File([result.data], result.name, { type: result.type });
          resolve(file);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function clearPendingFile(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete('pendingPdf');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore errors
  }
}

export default function Home() {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasResumedRef = useRef(false);

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
      // Abort any ongoing request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
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

  const cancelProcessing = () => {
    // Abort the ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Clear pending state
    sessionStorage.removeItem('pendingUrl');
    clearPendingFile();
    // Stop progress and reset state
    stopProgress();
    setIsProcessing(false);
    setProcessingStep('');
  };

  const finalizeAndNavigateWithResults = (results: any) => {
    // Clear pending state on success
    sessionStorage.removeItem('pendingUrl');
    clearPendingFile();
    
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
    // Clear pending state on error
    sessionStorage.removeItem('pendingUrl');
    clearPendingFile();
    
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

  const handlePdfProcess = useCallback(async (fileToProcess?: File) => {
    const file = fileToProcess || uploadedFile;
    if (!file) return;

    setIsProcessing(true);
    setProcessingStep('Uploading and extracting content...');

    // Save file to IndexedDB for resume on reload
    await savePendingFile(file);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', file);

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
        signal: abortControllerRef.current.signal,
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
      // Don't show error if request was aborted (user cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request cancelled by user');
        return;
      }
      const errorMsg = error instanceof Error ? error.message : String(error || 'An error occurred. Please try again.');
      console.error('Request error:', errorMsg);
      finalizeAndNavigateWithError({
        message: errorMsg,
        type: 'general'
      });
    }
  }, [uploadedFile]);

  const handleUrlSubmit = useCallback(async (urlToProcess?: string) => {
    const targetUrl = urlToProcess || url;
    if (!targetUrl.trim()) return;

    setIsProcessing(true);
    setProcessingStep('Fetching content from URL...');

    // Save URL to sessionStorage for resume on reload
    sessionStorage.setItem('pendingUrl', targetUrl);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

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
        body: JSON.stringify({ url: targetUrl }),
        signal: abortControllerRef.current.signal,
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
      // Don't show error if request was aborted (user cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request cancelled by user');
        return;
      }
      const errorMsg = error instanceof Error ? error.message : String(error || 'An error occurred. Please try again.');
      console.error('Request error:', errorMsg);
      finalizeAndNavigateWithError({
        message: errorMsg,
        type: 'general'
      });
    }
  }, [url]);

  // Check for pending process on page load and resume
  useEffect(() => {
    const resumePendingProcess = async () => {
      if (hasResumedRef.current) return;
      hasResumedRef.current = true;

      // Check for pending URL first
      const pendingUrl = sessionStorage.getItem('pendingUrl');
      if (pendingUrl) {
        console.log('Resuming URL processing after reload:', pendingUrl);
        setUrl(pendingUrl);
        setShowUrlInput(true);
        startProgress();
        handleUrlSubmit(pendingUrl);
        return;
      }

      // Check for pending PDF file
      const pendingFile = await getPendingFile();
      if (pendingFile) {
        console.log('Resuming PDF processing after reload:', pendingFile.name);
        setUploadedFile(pendingFile);
        startProgress();
        handlePdfProcess(pendingFile);
      }
    };

    resumePendingProcess();
  }, [handlePdfProcess, handleUrlSubmit]);

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <main className="min-h-screen flex items-center overflow-auto">
        <div className="container mx-auto px-4 py-8 md:py-6">
          {/* Welcome Section */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to <span className="text-blue-600 dark:text-blue-400">Study Assistant</span>
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Transform your learning materials into comprehensive notes and practice questions.
              Simply upload a PDF or provide a URL, and let our AI-powered assistant generate
              structured notes and targeted questions to enhance your study experience.
            </p>
          </div>

          {/* Options Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center mb-6">
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
                  className={`group relative p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-blue-900/20 transition-all duration-300 w-full h-[220px] flex items-center justify-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : !uploadedFile ? 'cursor-pointer' : ''}`}
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
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                        <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uploaded PDF</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 break-all px-2 line-clamp-2">
                        {uploadedFile.name}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload PDF</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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
                  className={`group relative p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md dark:hover:shadow-purple-900/20 transition-all duration-300 w-full h-[220px] flex items-center justify-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : !showUrlInput ? 'cursor-pointer' : ''}`}
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
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                        <LinkIcon className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enter URL</h3>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="https://example.com/article"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                        disabled={isProcessing}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                        <LinkIcon className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Provide URL</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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
                <div className={`absolute left-1/2 top-full transform -translate-x-1/2 w-[480px] max-w-[90vw] mt-2 mb-4 md:mb-0 transition-all duration-300 ${isProgressVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {/* Cancel button */}
                    <button
                      onClick={cancelProcessing}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors flex-shrink-0"
                      aria-label="Cancel processing"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
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