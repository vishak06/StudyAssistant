'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
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
    } else {
      // Redirect to home if no error data found
      window.location.href = '/';
    }
  }, []);

  return (
    <main className="h-screen flex items-center overflow-hidden">
      <div className="container mx-auto px-4 py-8 md:py-6 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-red-100">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-xl font-bold text-gray-900 text-center mb-3">
            {isProcessingError ? 'Additional Processing Required' : 'Something Went Wrong'}
          </h1>

          {/* Error Message */}
          <div className={`${isProcessingError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-6`}>
            <p className="text-gray-700 text-center">
              ERROR
            </p>
          </div>

          {/* Suggestions */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">What you can try:</h2>
            {isProcessingError ? (
              <ul className="space-y-1.5 text-sm text-gray-600">
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
                  <span>Ensure audio/video URLs are not uploaded</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-1.5 text-sm text-gray-600">
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

          {/* Back to Home Button */}
          <div className="flex justify-center">
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
