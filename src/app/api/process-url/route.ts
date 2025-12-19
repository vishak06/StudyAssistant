import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';

async function callAgent(agentId: string, userId: string, sessionId: string, message: string, apiKey: string, files?: string[]) {
  const body: Record<string, unknown> = {
    user_id: userId,
    agent_id: agentId,
    session_id: sessionId,
    message: message,
  };

  if (files && files.length > 0) {
    body.assets = files;
    console.log('Adding assets to request:', files);
  }

  console.log('Calling agent with body:', JSON.stringify(body, null, 2));

  const response = await fetch(LYZR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Agent ${agentId} failed: ${errorText}`);
  }

  return response.json();
}

function hasErrorInResponse(response: string): boolean {
  if (!response || response.trim().length === 0) {
    console.log('Error check: Empty response');
    return true;
  }
  
  const trimmedResponse = response.trim();
  const lowerResponse = response.toLowerCase();
  
  // If STATUS says "Ready for analysis", it's definitely NOT an error
  // Check this FIRST before other checks
  if (lowerResponse.includes('status:') && lowerResponse.includes('ready for analysis')) {
    console.log('Error check: Found STATUS: Ready for analysis - NO ERROR');
    return false;
  }
  
  // Check if STATUS field explicitly says "Error"
  if (/status:\s*error/i.test(response)) {
    console.log('Error check: Found STATUS: Error');
    return true;
  }
  
  // Check if it contains "Error – Needs OCR" or "Error – Transcript unavailable"
  if (lowerResponse.includes('error – needs ocr') || 
      lowerResponse.includes('error – transcript unavailable') ||
      lowerResponse.includes('error - needs ocr') ||
      lowerResponse.includes('error - transcript unavailable')) {
    console.log('Error check: Found OCR/Transcript error');
    return true;
  }
  
  // Check if the extracted text begins with "ERROR:"
  if (trimmedResponse.toUpperCase().startsWith('ERROR:')) {
    console.log('Error check: Starts with ERROR:');
    return true;
  }
  
  // Check for typical failure markers
  const failureMarkers = [
    'transcript unavailable',
    'captions not available',
    'requires ocr',
    'scanned pdf',
    'extraction failed'
  ];
  
  const foundMarker = failureMarkers.find(marker => lowerResponse.includes(marker));
  if (foundMarker) {
    console.log('Error check: Found failure marker:', foundMarker);
    return true;
  }
  
  console.log('Error check: No errors detected');
  return false;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting URL processing ===');
    
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    console.log('URL received:', url);

    if (!process.env.LYZR_API_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const apiKey = process.env.LYZR_API_KEY;
    const userId = "ed1fc9af-956d-41f2-80d3-f17b3544e53c";
    const sessionId = randomUUID(); // Generate unique session ID for each request
    console.log('Generated session ID:', sessionId);

    // Step 1: Input Router
    console.log('Step 1: Calling Input Router...');
    const inputRouterResult = await callAgent(
      "693a58b8bc73a1ed4a58e809",
      userId,
      sessionId,
      url,
      apiKey,
      [url]
    );
    console.log('Input Router completed');
    console.log('Input Router response:', inputRouterResult.response || inputRouterResult.message);

    // Step 2: Content Extractor
    console.log('Step 2: Calling Content Extractor...');
    const contentExtractorResult = await callAgent(
      "693a5901829cb256a64c4251",
      userId,
      sessionId,
      inputRouterResult.response || inputRouterResult.message || JSON.stringify(inputRouterResult),
      apiKey,
      [url]
    );
    console.log('Content Extractor completed');

    const extractorResponse = contentExtractorResult.response || contentExtractorResult.message || '';

    // Step 3: Check if Content Extractor indicates an error
    console.log('Step 3: Checking for errors...');
    console.log('Extractor response preview:', extractorResponse.substring(0, 200));
    const hasError = hasErrorInResponse(extractorResponse);
    console.log('Has error:', hasError);

    if (hasError) {
      // Route to Error Displayer
      console.log('Error detected in extraction, calling Error Displayer...');
      const errorDisplayerResult = await callAgent(
        "693a59eebc73a1ed4a58e823",
        userId,
        sessionId,
        extractorResponse,
        apiKey
      );
      console.log('Error Displayer completed');

      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: errorDisplayerResult.response || errorDisplayerResult.message || 'An error occurred while processing your URL. Please try a different URL.'
      });
    }

    // Step 4: Content Analyzer
    console.log('Step 4: Calling Content Analyzer...');
    const contentAnalyzerResult = await callAgent(
      "693a593a829cb256a64c4255",
      userId,
      sessionId,
      extractorResponse,
      apiKey
    );
    console.log('Content Analyzer completed');

    const analyzerResponse = contentAnalyzerResult.response || contentAnalyzerResult.message || '';

    // Step 5: Smart Note Generator
    console.log('Step 5: Calling Smart Note Generator...');
    const smartNoteResult = await callAgent(
      "693a5973829cb256a64c425e",
      userId,
      sessionId,
      analyzerResponse,
      apiKey
    );
    console.log('Smart Note Generator completed');

    // Step 6: Practice Question Generator
    console.log('Step 6: Calling Practice Question Generator...');
    const practiceQuestionResult = await callAgent(
      "693a59a4bc73a1ed4a58e818",
      userId,
      sessionId,
      analyzerResponse,
      apiKey
    );
    console.log('Practice Question Generator completed');

    const notes = smartNoteResult.response || smartNoteResult.message || 'Notes could not be generated';
    const questions = practiceQuestionResult.response || practiceQuestionResult.message || 'Questions could not be generated';

    console.log('=== Processing complete ===');
    
    return NextResponse.json({ 
      success: true,
      isError: false,
      notes: notes,
      questions: questions
    });
    
  } catch (error) {
    console.error('Error processing URL:', error);
    const errorMessage = error instanceof Error ? error.message : String(error || 'An unexpected error occurred. Please try again with a different URL.');
    console.error('Error message:', errorMessage);
    
    return NextResponse.json({ 
      success: false,
      isError: true,
      errorMessage: errorMessage
    }, { status: 500 });
  }
}