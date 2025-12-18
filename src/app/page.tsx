'use client';

import { useState } from 'react';
import { Upload, Link as LinkIcon } from 'lucide-react';

export default function Home() {
  const [selectedOption, setSelectedOption] = useState<'pdf' | 'url' | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center">
      <div className="container mx-auto px-4 py-16">
        {/* Welcome Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Study Assistant</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Transform your learning materials into comprehensive notes and practice questions. 
            Simply upload a PDF or provide a URL, and let our AI-powered assistant generate 
            structured notes and targeted questions to enhance your study experience.
          </p>
        </div>

        {/* Options Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            Choose Your Input Method
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* PDF Upload Option */}
            <button
              onClick={() => setSelectedOption('pdf')}
              className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
                selectedOption === 'pdf'
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full transition-colors ${
                  selectedOption === 'pdf' ? 'bg-blue-500' : 'bg-blue-100 group-hover:bg-blue-200'
                }`}>
                  <Upload className={`w-12 h-12 ${
                    selectedOption === 'pdf' ? 'text-white' : 'text-blue-600'
                  }`} />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Upload PDF</h3>
                <p className="text-gray-600">
                  Upload your study materials in PDF format and get instant notes and questions
                </p>
              </div>
            </button>

            {/* URL Option */}
            <button
              onClick={() => setSelectedOption('url')}
              className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
                selectedOption === 'url'
                  ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full transition-colors ${
                  selectedOption === 'url' ? 'bg-purple-500' : 'bg-purple-100 group-hover:bg-purple-200'
                }`}>
                  <LinkIcon className={`w-12 h-12 ${
                    selectedOption === 'url' ? 'text-white' : 'text-purple-600'
                  }`} />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Provide URL</h3>
                <p className="text-gray-600">
                  Share a link to online content and receive comprehensive study materials
                </p>
              </div>
            </button>
          </div>

          {/* Continue Button */}
          {selectedOption && (
            <div className="mt-12 text-center">
              <button
                className={`px-8 py-4 rounded-lg text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  selectedOption === 'pdf'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                Continue with {selectedOption === 'pdf' ? 'PDF Upload' : 'URL'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}