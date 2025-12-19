'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Upload, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('');
  const [isProcessingError, setIsProcessingError] = useState(false);

  useEffect(() => {
    const storedError = sessionStorage.getItem('studyError');
    if (storedError) {
      const errorData = JSON.parse(storedError);
      setErrorMessage(errorData.message || 'An error occurred while processing your request.');
      setErrorType(errorData.type || '');
      setIsProcessingError(errorData.type === 'processing_required');
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-100">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {isProcessingError ? 'Additional Processing Required' : 'Something Went Wrong'}
          </h1>

          {/* Error Message */}
          <div className={`${isProcessingError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-8`}>
            <p className="text-gray-700 text-center">
              {errorMessage || 'We encountered an issue while processing your file or URL. Please try again with a different input.'}
            </p>
          </div>

          {/* Suggestions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">What you can try:</h2>
            {isProcessingError ? (
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Upload a text-based PDF (not scanned images or photos)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Try a PDF with selectable text content</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>For image-based PDFs, consider converting to text first</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Ensure audio/video URLs contain transcriptions or captions</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Upload a different PDF file with clear, readable text</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Make sure the PDF is not password protected or corrupted</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Try a different URL with accessible content</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Ensure the URL points to a public webpage</span>
                </li>
              </ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Different File
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              <LinkIcon className="w-5 h-5 mr-2" />
              Try Different URL
            </Link>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
