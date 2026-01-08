import { NextRequest, NextResponse } from 'next/server';
import {
  extractContent,
  analyzeContent,
  generateNotes,
  generateQuestions,
} from '@/lib/mistral-agents';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting PDF processing with Mistral ===');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', file.name, file.size);

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: 'Server not configured - Missing MISTRAL_API_KEY'
      }, { status: 500 });
    }

    // Convert file to buffer and extract text using pdf2json
    console.log('Extracting text from PDF...');
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Use pdf2json for PDF parsing (works in Node.js without canvas dependencies)
    const PDFParser = (await import('pdf2json')).default;

    const rawText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(errData.parserError));
      });

      pdfParser.on('pdfParser_dataReady', () => {
        const text = (pdfParser as any).getRawTextContent();
        resolve(text);
      });

      pdfParser.parseBuffer(fileBuffer);
    });

    if (!rawText || rawText.trim().length < 100) {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: 'PDF appears to be empty or contains insufficient text content. Please try a different file.'
      });
    }

    console.log(`Extracted ${rawText.length} characters from PDF`);

    // AGENT 1: Extract and clean content
    console.log('===========================================');
    console.log('AGENT 1: Content Extractor');
    console.log('===========================================');
    const extractedContent = await extractContent(rawText);
    console.log('✓ Content Extractor completed');
    console.log('Extracted content length:', extractedContent.length);
    console.log('First 200 chars:', extractedContent.substring(0, 200));

    // Check for extraction errors
    if (extractedContent.includes('ERROR:') || extractedContent.includes('STATUS: Error')) {
      console.error('❌ Content extraction error detected');
      // Extract the error message
      const errorMatch = extractedContent.match(/ERROR: (.+?)(?:\n|$)/);
      const errorMessage = errorMatch
        ? errorMatch[1]
        : 'Content extraction failed. Please try a different file.';

      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: errorMessage
      });
    }

    // AGENT 2: Analyze content
    console.log('===========================================');
    console.log('AGENT 2: Content Analyzer');
    console.log('===========================================');
    const analysis = await analyzeContent(extractedContent);
    console.log('✓ Content Analyzer completed');
    console.log('Analysis suitable:', analysis.is_suitable);
    if (analysis.analysis_report) {
      console.log('Analysis report length:', analysis.analysis_report.length);
      console.log('First 200 chars:', analysis.analysis_report.substring(0, 200));
    }

    // Check if content is suitable
    if (!analysis.is_suitable) {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: analysis.error_message || 'This content is not suitable for creating study materials. Please try a different file.'
      });
    }

    // AGENT 3 & 4: Generate notes and questions in parallel
    console.log('===========================================');
    console.log('AGENT 3 & 4: Generating Notes and Questions');
    console.log('===========================================');
    const [notes, questions] = await Promise.all([
      generateNotes(analysis.analysis_report),
      generateQuestions(analysis.analysis_report),
    ]);
    console.log('✓ Notes generated:', notes.length, 'characters');
    console.log('✓ Questions generated:', questions.length, 'characters');

    console.log('===========================================');
    console.log('✅ PROCESSING COMPLETE');
    console.log('===========================================');

    return NextResponse.json({
      success: true,
      isError: false,
      notes: notes,
      questions: questions,
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'An unexpected error occurred. Please try again with a different file.';
    console.error('Error message:', errorMessage);

    return NextResponse.json({
      success: false,
      isError: true,
      errorMessage: errorMessage,
    }, { status: 500 });
  }
}