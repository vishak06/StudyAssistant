import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import {
  extractContent,
  analyzeContent,
  generateNotes,
  generateQuestions,
} from '@/lib/mistral-agents';

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script, style, and navigation elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();

    // Extract main content - try common content selectors
    let content = '';
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main',
      'body',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        if (content.trim().length > 200) {
          break;
        }
      }
    }

    // Fallback to body text if no content found
    if (!content || content.trim().length < 200) {
      content = $('body').text();
    }

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return content;
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting URL processing with Mistral ===');

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    console.log('URL received:', url);

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: 'Invalid URL format. Please provide a valid URL.',
      });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: 'Server not configured - Missing MISTRAL_API_KEY',
      }, { status: 500 });
    }

    // Fetch content from URL
    console.log('Fetching content from URL...');
    let rawText: string;
    try {
      rawText = await fetchUrlContent(url);
    } catch (error) {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: 'Failed to fetch content from URL. Please check the URL and try again.',
      });
    }

    if (!rawText || rawText.trim().length < 100) {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: 'URL content appears to be empty or contains insufficient text. Please try a different URL.',
      });
    }

    console.log(`Fetched ${rawText.length} characters from URL`);

    // AGENT 1: Extract and clean content
    console.log('Agent 1: Content Extractor...');
    const extractedContent = await extractContent(rawText);

    // Check for extraction errors
    if (extractedContent.includes('ERROR:') || extractedContent.includes('STATUS: Error')) {
      // Extract the error message
      const errorMatch = extractedContent.match(/ERROR: (.+?)(?:\n|$)/);
      const errorMessage = errorMatch
        ? errorMatch[1]
        : 'Content extraction failed. Please try a different URL.';

      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: errorMessage
      });
    }

    console.log(`Content extracted successfully`);

    // AGENT 2: Analyze content
    console.log('Agent 2: Content Analyzer...');
    const analysis = await analyzeContent(extractedContent);

    // Check if content is suitable
    if (!analysis.is_suitable) {
      return NextResponse.json({
        success: false,
        isError: true,
        errorMessage: analysis.error_message || 'This content is not suitable for creating study materials. Please try a different URL.',
      });
    }

    console.log('Content analysis complete');

    // AGENT 3 & 4: Generate notes and questions in parallel
    console.log('Agent 3 & 4: Generating notes and questions...');
    const [notes, questions] = await Promise.all([
      generateNotes(analysis.analysis_report),
      generateQuestions(analysis.analysis_report),
    ]);

    console.log('=== Processing complete ===');
    console.log(`Notes: ${notes.length} characters`);
    console.log(`Questions: ${questions.length} characters`);

    return NextResponse.json({
      success: true,
      isError: false,
      notes: notes,
      questions: questions,
    });

  } catch (error) {
    console.error('Error processing URL:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'An unexpected error occurred. Please try again with a different URL.';
    console.error('Error message:', errorMessage);

    return NextResponse.json({
      success: false,
      isError: true,
      errorMessage: errorMessage,
    }, { status: 500 });
  }
}