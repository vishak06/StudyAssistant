import { NextRequest, NextResponse } from 'next/server';
import {
  extractContent,
  analyzeContent,
  generateNotes,
  generateQuestions,
} from '@/lib/mistral-agents';

/**
 * Try to extract text using pdf2json
 */
async function extractWithPdf2Json(fileBuffer: Buffer): Promise<string> {
  const PDFParser = (await import('pdf2json')).default;

  return new Promise<string>((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1);
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('PDF parsing timed out'));
    }, 30000);

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      clearTimeout(timeout);
      reject(new Error(errData.parserError || 'PDF parsing failed'));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      clearTimeout(timeout);
      try {
        const text = (pdfParser as any).getRawTextContent();
        resolve(text);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.parseBuffer(fileBuffer);
  });
}

/**
 * Fallback: Extract text using unpdf (serverless-friendly)
 */
async function extractWithUnpdf(fileBuffer: Buffer): Promise<string> {
  const { extractText } = await import('unpdf');
  const { text } = await extractText(fileBuffer);
  // text is an array of strings (one per page), join them
  return Array.isArray(text) ? text.join('\n') : text;
}

export async function POST(request: NextRequest) {
  // Get the abort signal from the request
  const signal = request.signal;
  
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

    // Convert file to buffer and extract text
    console.log('Extracting text from PDF...');
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Try pdf2json first, then fall back to pdf-parse if it fails
    let rawText = '';
    try {
      rawText = await extractWithPdf2Json(fileBuffer);
      console.log('✓ Text extracted using pdf2json');
    } catch (pdf2jsonError) {
      console.warn('⚠ pdf2json failed, trying unpdf as fallback...');
      console.warn('pdf2json error:', pdf2jsonError instanceof Error ? pdf2jsonError.message : String(pdf2jsonError));
      
      try {
        rawText = await extractWithUnpdf(fileBuffer);
        console.log('✓ Text extracted using unpdf (fallback)');
      } catch (unpdfError) {
        console.error('❌ Both PDF parsers failed');
        console.error('unpdf error:', unpdfError instanceof Error ? unpdfError.message : String(unpdfError));
        
        return NextResponse.json({
          success: false,
          isError: true,
          errorMessage: 'Unable to read this PDF file. It may be corrupted, password-protected, or contain only scanned images. Please try a different file.'
        });
      }
    }

    if (!rawText || rawText.trim().length < 100) {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: 'PDF appears to be empty or contains insufficient text content. Please try a different file.'
      });
    }

    console.log(`Extracted ${rawText.length} characters from PDF`);

    // Truncate content if too large for Mistral's context window
    // Mixtral 8x7B has ~32K token limit (~100K characters to be safe)
    const MAX_CONTENT_LENGTH = 100000;
    let processedText = rawText;
    
    if (rawText.length > MAX_CONTENT_LENGTH) {
      console.warn(`⚠ Content too large (${rawText.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
      processedText = rawText.substring(0, MAX_CONTENT_LENGTH);
      // Try to cut at a sentence/paragraph boundary
      const lastPeriod = processedText.lastIndexOf('.');
      const lastNewline = processedText.lastIndexOf('\n');
      const cutPoint = Math.max(lastPeriod, lastNewline);
      if (cutPoint > MAX_CONTENT_LENGTH * 0.9) {
        processedText = processedText.substring(0, cutPoint + 1);
      }
      console.log(`Truncated to ${processedText.length} characters`);
    }

    // AGENT 1: Extract and clean content
    console.log('===========================================');
    console.log('AGENT 1: Content Extractor');
    console.log('===========================================');
    const extractedContent = await extractContent(processedText, signal);
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
    const analysis = await analyzeContent(extractedContent, signal);
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
      generateNotes(analysis.analysis_report, signal),
      generateQuestions(analysis.analysis_report, signal),
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
    // Handle abort errors gracefully
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('🛑 PDF processing aborted by client');
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: 'Request cancelled',
      }, { status: 499 }); // 499 = Client Closed Request
    }
    
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