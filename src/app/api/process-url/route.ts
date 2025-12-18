import { NextRequest, NextResponse } from 'next/server';

const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';

async function callAgent(agentId: string, userId: string, sessionId: string, message: string, apiKey: string, files?: string[]) {
  const body: Record<string, unknown> = {
    user_id: userId,
    agent_id: agentId,
    session_id: sessionId,
    message: message,
  };

  if (files && files.length > 0) {
    body.files = files;
  }

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

    // Step 1: Input Router
    console.log('Step 1: Calling Input Router...');
    const inputRouterResult = await callAgent(
      "693a58b8bc73a1ed4a58e809",
      "ed1fc9af-956d-41f2-80d3-f17b3544e53c",
      "cc232190-b089-4283-8ae8-d70026164a01",
      `Prepare study materials from this URL: ${url}`,
      apiKey,
      [url]
    );
    console.log('Input Router completed');

    // Step 2: Content Extractor
    console.log('Step 2: Calling Content Extractor...');
    const contentExtractorResult = await callAgent(
      "693a5901829cb256a64c4251",
      "5e250b6b-becb-42bd-9a4e-5350a8344b9e",
      "3527551e-a506-4af8-9cee-ffdedf56cbc5",
      inputRouterResult.response || inputRouterResult.message || JSON.stringify(inputRouterResult),
      apiKey
    );
    console.log('Content Extractor completed');

    // Step 3: Content Analyzer
    console.log('Step 3: Calling Content Analyzer...');
    const contentAnalyzerResult = await callAgent(
      "693a593a829cb256a64c4255",
      "8b46f613-f23c-4efc-bae7-6990ee93de3d",
      "81c95df6-ea09-4470-a338-1d275798d46c",
      contentExtractorResult.response || contentExtractorResult.message || JSON.stringify(contentExtractorResult),
      apiKey
    );
    console.log('Content Analyzer completed');

    // Step 4: Smart Note Generator
    console.log('Step 4: Calling Smart Note Generator...');
    const smartNoteResult = await callAgent(
      "693a5973829cb256a64c425e",
      "192778ac-62cb-4345-b726-9c1a8e87f718",
      "8f2fdd6b-acc1-458b-b45a-8260537bee24",
      contentAnalyzerResult.response || contentAnalyzerResult.message || JSON.stringify(contentAnalyzerResult),
      apiKey
    );
    console.log('Smart Note Generator completed');

    // Step 5: Practice Question Generator
    console.log('Step 5: Calling Practice Question Generator...');
    const practiceQuestionResult = await callAgent(
      "693a59a4bc73a1ed4a58e818",
      "0a9123fe-f1ac-4927-b35c-564bcb06f614",
      "12224f48-9901-4a9f-9fe7-ba63cde918d5",
      contentAnalyzerResult.response || contentAnalyzerResult.message || JSON.stringify(contentAnalyzerResult),
      apiKey
    );
    console.log('Practice Question Generator completed');

    // Step 6: Study Package Formatter (Final)
    console.log('Step 6: Calling Study Package Formatter...');
    const studyPackageResult = await callAgent(
      "693a59eebc73a1ed4a58e823",
      "25e59003-2a44-4077-a3f2-7bc639e41f17",
      "fcf82b86-18e4-4667-8074-09995f52aa86",
      `Notes: ${smartNoteResult.response || smartNoteResult.message || JSON.stringify(smartNoteResult)}\n\nQuestions: ${practiceQuestionResult.response || practiceQuestionResult.message || JSON.stringify(practiceQuestionResult)}`,
      apiKey
    );
    console.log('Study Package Formatter completed');

    // Extract notes and questions from final response
    const finalResponse = studyPackageResult.response || studyPackageResult.message || '';
    
    let notes = '';
    let questions = '';
    
    const lowerResponse = finalResponse.toLowerCase();
    
    if (lowerResponse.includes('notes:') && lowerResponse.includes('questions:')) {
      const notesIndex = lowerResponse.indexOf('notes:');
      const questionsIndex = lowerResponse.indexOf('questions:');
      
      if (notesIndex < questionsIndex) {
        notes = finalResponse.substring(notesIndex + 6, questionsIndex).trim();
        questions = finalResponse.substring(questionsIndex + 10).trim();
      } else {
        questions = finalResponse.substring(questionsIndex + 10, notesIndex).trim();
        notes = finalResponse.substring(notesIndex + 6).trim();
      }
    } else {
      notes = smartNoteResult.response || smartNoteResult.message || 'Notes could not be generated';
      questions = practiceQuestionResult.response || practiceQuestionResult.message || 'Questions could not be generated';
    }

    console.log('=== Processing complete ===');
    
    return NextResponse.json({ 
      success: true, 
      notes: notes,
      questions: questions,
      fullResponse: finalResponse
    });
    
  } catch (error) {
    console.error('Error processing URL:', error);
    
    return NextResponse.json({ 
      error: 'Failed to process URL', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}