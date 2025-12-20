import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
const LYZR_ASSET_UPLOAD_URL = 'https://agent-prod.studio.lyzr.ai/v3/assets/upload';

function cleanMarkdownResponse(text: string): string {
  // Remove triple backticks with optional language identifier
  let cleaned = text.replace(/^```[\w]*\n/gm, '').replace(/\n```$/gm, '');
  
  // Remove any remaining standalone triple backticks
  cleaned = cleaned.replace(/^```$/gm, '');
  
  return cleaned.trim();
}

async function uploadPdfToLyzr(fileBuffer: Buffer, filename: string, apiKey: string): Promise<string> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)]);
  form.append("files", blob, filename);

  console.log('Uploading file to Lyzr:', filename);
  const res = await fetch(LYZR_ASSET_UPLOAD_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: form as any,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Lyzr upload failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  console.log('Lyzr upload response:', JSON.stringify(data, null, 2));
  
  // The response has a results array with the asset info
  if (!data.results || !data.results[0] || !data.results[0].asset_id) {
    throw new Error(`No asset ID in Lyzr response. Response: ${JSON.stringify(data)}`);
  }
  
  const assetId = data.results[0].asset_id;
  console.log('File uploaded to Lyzr with asset ID:', assetId);
  return assetId;
}

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
  if (lowerResponse.includes('error - needs ocr') || 
      lowerResponse.includes('error - transcript unavailable') ||
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
    console.log('=== Starting PDF processing ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', file.name, file.size);

    if (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.LYZR_API_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const apiKey = process.env.LYZR_API_KEY;
    const userId = "ed1fc9af-956d-41f2-80d3-f17b3544e53c";
    const sessionId = randomUUID(); // Generate unique session ID for each request
    console.log('Generated session ID:', sessionId);

    // Convert file to buffer for Lyzr upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Lyzr and get asset ID
    console.log('Uploading to Lyzr...');
    const lyzrAssetId = await uploadPdfToLyzr(fileBuffer, file.name, apiKey);

    // Also upload to Vercel Blob as backup
    console.log('Uploading to Vercel Blob...');
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
    });
    console.log('File uploaded to Vercel Blob:', blob.url);

    // Step 1: Input Router
    console.log('Step 1: Calling Input Router...');
    const inputRouterResult = await callAgent(
      "694636cf6363be71980e708c",
      userId,
      sessionId,
      blob.url,
      apiKey,
      [lyzrAssetId]
    );
    console.log('Input Router completed');

    // Step 2: Content Extractor
    console.log('Step 2: Calling Content Extractor...');
    const contentExtractorResult = await callAgent(
      "694636fe2be72f04a7d631a9",
      userId,
      sessionId,
      inputRouterResult.response || inputRouterResult.message || JSON.stringify(inputRouterResult),
      apiKey,
      [lyzrAssetId]
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
        "694639396363be71980e708d",
        userId,
        sessionId,
        extractorResponse,
        apiKey
      );
      console.log('Error Displayer completed');

      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: errorDisplayerResult.response || errorDisplayerResult.message || 'An error occurred while processing your file. Please try uploading a different file.'
      });
    }

    // Step 4: Content Analyzer
    console.log('Step 4: Calling Content Analyzer...');
    const contentAnalyzerResult = await callAgent(
      "6946372b81c8a74f1ca94db5",
      userId,
      sessionId,
      extractorResponse,
      apiKey
    );
    console.log('Content Analyzer completed');

    const analyzerResponse = contentAnalyzerResult.response || contentAnalyzerResult.message || '';

    // Check if Content Analyzer indicates an error
    console.log('Checking Content Analyzer for errors...');
    console.log('Analyzer response preview:', analyzerResponse.substring(0, 200));
    
    if (analyzerResponse.toUpperCase().trim().startsWith('ERROR:')) {
      console.log('Error detected in analysis, calling Error Displayer...');
      const errorDisplayerResult = await callAgent(
        "693a59eebc73a1ed4a58e823",
        userId,
        sessionId,
        analyzerResponse,
        apiKey
      );
      console.log('Error Displayer completed');

      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: errorDisplayerResult.response || errorDisplayerResult.message || 'An error occurred while processing your file. Please try uploading a different file.'
      });
    }

    // Step 5: Smart Note Generator
    console.log('Step 5: Calling Smart Note Generator...');
    const smartNoteResult = await callAgent(
      "69463835cf278553868d5d4b",
      userId,
      sessionId,
      analyzerResponse,
      apiKey
    );
    console.log('Smart Note Generator completed');

    // Step 6: Practice Question Generator
    console.log('Step 6: Calling Practice Question Generator...');
    const practiceQuestionResult = await callAgent(
      "6946390581c8a74f1ca94db6",
      userId,
      sessionId,
      analyzerResponse,
      apiKey
    );
    console.log('Practice Question Generator completed');

    let notes = smartNoteResult.response || smartNoteResult.message || 'Notes could not be generated';
    let questions = practiceQuestionResult.response || practiceQuestionResult.message || 'Questions could not be generated';

    // Clean any markdown code block wrappers
    notes = cleanMarkdownResponse(notes);
    questions = cleanMarkdownResponse(questions);

    console.log('=== Processing complete ===');
    
    return NextResponse.json({ 
      success: true,
      isError: false,
      notes: notes,
      questions: questions
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : String(error || 'An unexpected error occurred. Please try again with a different file.');
    console.error('Error message:', errorMessage);
    
    return NextResponse.json({ 
      success: false,
      isError: true,
      errorMessage: errorMessage
    }, { status: 500 });
  }
}