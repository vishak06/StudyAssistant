'use client';

import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, FileText, Loader2 } from 'lucide-react';

export default function Home() {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfClick = () => {
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
        // Store results and navigate
        const results = {
          notes: data.notes || 'No notes generated',
          questions: data.questions || 'No questions generated'
        };
        sessionStorage.setItem('studyResults', JSON.stringify(results));
        window.location.href = '/results';
      } else {
        const errorMsg = data.errorMessage || data.error || 'Failed to process PDF. Please try again.';
        console.error('Processing error:', errorMsg);
        sessionStorage.setItem('studyError', JSON.stringify({
          message: errorMsg,
          type: data.isError ? 'processing_required' : 'general'
        }));
        window.location.href = '/error';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error || 'An error occurred. Please try again.');
      console.error('Request error:', errorMsg);
      sessionStorage.setItem('studyError', JSON.stringify({
        message: errorMsg,
        type: 'general'
      }));
      window.location.href = '/error';
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
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
        sessionStorage.setItem('studyResults', JSON.stringify(results));
        window.location.href = '/results';
      } else {
        const errorMsg = data.errorMessage || data.error || 'Failed to process URL. Please try again.';
        console.error('Processing error:', errorMsg);
        sessionStorage.setItem('studyError', JSON.stringify({
          message: errorMsg,
          type: data.isError ? 'processing_required' : 'general'
        }));
        window.location.href = '/error';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error || 'An error occurred. Please try again.');
      console.error('Request error:', errorMsg);
      sessionStorage.setItem('studyError', JSON.stringify({
        message: errorMsg,
        type: 'general'
      }));
      window.location.href = '/error';
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
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
      <main className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center overflow-hidden">
        <div className="container mx-auto px-4 py-6">
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
                <button
                  onClick={handlePdfClick}
                  disabled={isProcessing || url.trim().length > 0}
                  className="group relative p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadedFile ? (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-full bg-blue-100">
                        <FileText className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Uploaded PDF</h3>
                      <p className="text-sm text-gray-600 break-all px-2">
                        {uploadedFile.name}
                      </p>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isProcessing) handlePdfProcess();
                          }}
                          disabled={isProcessing}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {isProcessing ? 'Processing...' : 'Submit'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isProcessing) clearFile();
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
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
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing || url.trim().length > 0}
                />
              </div>

              {/* URL Option */}
              <div>
                <div
                  onClick={() => !showUrlInput && !isProcessing && uploadedFile === null && setShowUrlInput(true)}
                  className={`group relative p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-300 hover:shadow-md transition-all duration-300 w-full ${(isProcessing || uploadedFile !== null) ? 'opacity-50 cursor-not-allowed' : !showUrlInput ? 'cursor-pointer' : ''}`}
                >
                  {showUrlInput ? (
                    <div className="flex flex-col items-center text-center space-y-3">
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
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isProcessing && url.trim()) handleUrlSubmit();
                          }}
                          disabled={!url.trim() || isProcessing}
                          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {isProcessing ? 'Processing...' : 'Submit'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isProcessing) {
                              setShowUrlInput(false);
                              setUrl('');
                            }
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
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
          </div>
        </div>
      </main>
    </>
  );
}