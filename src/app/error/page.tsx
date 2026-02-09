'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Map of known error types to user-friendly messages
const knownErrors: Record<string, string> = {
  'processing_required': 'The content could not be processed. Please ensure you are uploading a valid text-based PDF or URL.',
  'invalid_pdf': 'The PDF file is invalid or corrupted.',
  'invalid_url': 'The URL provided is invalid or inaccessible.',
  'rate_limit': 'Service is temporarily unavailable due to high demand. Please try again in a few minutes.',
  'api_error': 'An error occurred while communicating with the service. Please try again later.',
  'network_error': 'A network error occurred. Please check your connection and try again.',
  'file_too_large': 'The file is too large to process. Please try a smaller file.',
  'no_content': 'No readable content was found in the uploaded file.',
};

function getUserFriendlyMessage(rawMessage: string, errorType: string): string {
  // Check if we have a known error type
  if (errorType && knownErrors[errorType]) {
    return knownErrors[errorType];
  }
  
  // Check for rate limit errors in the message
  if (rawMessage.toLowerCase().includes('rate limit') || rawMessage.includes('429')) {
    return knownErrors['rate_limit'];
  }
  
  // Check for API errors
  if (rawMessage.toLowerCase().includes('api error') || rawMessage.includes('Status 4') || rawMessage.includes('Status 5')) {
    return knownErrors['api_error'];
  }
  
  // Return unknown error for any unrecognized error
  return 'An unknown error occurred. Please try again later.';
}

export default function ErrorPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('');
  const [isProcessingError, setIsProcessingError] = useState(false);

  useEffect(() => {
    const storedError = sessionStorage.getItem('studyError');
    if (storedError) {
      const errorData = JSON.parse(storedError);
      const rawMessage = errorData.message || '';
      const type = errorData.type || '';
      
      // Convert raw error to user-friendly message
      setErrorMessage(getUserFriendlyMessage(rawMessage, type));
      setErrorType(type);
      setIsProcessingError(type === 'processing_required');
    } else {
      // Redirect to home if no error data found
      window.location.href = '/';
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center overflow-auto">
      <div className="container mx-auto px-4 py-8 md:py-6 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-red-100 dark:border-red-900">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-red-600 dark:text-red-400 text-center mb-4">ERROR</h1>

          {/* Error Reason Box (from error displayer agent) */}
          <div className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 border rounded-lg p-4 mb-6">
            <p className="text-gray-800 dark:text-gray-200 text-center whitespace-pre-wrap">{errorMessage || 'An unknown error occurred.'}</p>
          </div>

          {/* Suggestions */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">What you can try:</h2>
            {isProcessingError ? (
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
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
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
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
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
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
