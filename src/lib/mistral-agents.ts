import { Mistral } from '@mistralai/mistralai';

// Configure Mistral client
const client = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY || '',
});

// Use Mixtral 8x7B (excellent quality, free tier)
const MODEL_ID = 'open-mixtral-8x7b';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 30000; // 30 seconds initial delay for rate limits
const MAX_DELAY_MS = 120000; // 2 minutes max delay

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is a rate limit error (429)
 */
function isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('429') || message.includes('rate limit') || message.includes('rate_limited');
    }
    return false;
}

/**
 * Call Mistral API with a system prompt and user message.
 * Includes automatic retry with exponential backoff for rate limits.
 * Returns the response content as a string.
 */
async function callMistral(systemPrompt: string, userMessage: string): Promise<string> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES}...`);
            }
            
            console.log('📡 Calling Mistral API...');
            console.log('Model:', MODEL_ID);
            console.log('System prompt length:', systemPrompt.length);
            console.log('User message length:', userMessage.length);

            const response = await client.chat.complete({
                model: MODEL_ID,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.3, // Balanced creativity and consistency
                maxTokens: 8192,
            });

            console.log('✓ Mistral API response received');

            const rawContent = response.choices?.[0]?.message?.content;

            // Handle both string and ContentChunk[] types
            let content: string;
            if (typeof rawContent === 'string') {
                content = rawContent.trim();
            } else if (Array.isArray(rawContent)) {
                // If it's an array of content chunks, extract text from them
                content = rawContent.map((chunk: any) => chunk.text || '').join('').trim();
            } else {
                console.error('❌ Unexpected content type:', typeof rawContent);
                console.error('Raw content:', rawContent);
                throw new Error('Empty response from Mistral API');
            }

            if (!content) {
                console.error('❌ Empty content received from Mistral');
                throw new Error('Empty response from Mistral API');
            }

            console.log('✓ Content extracted, length:', content.length);
            return content;
        } catch (error) {
            lastError = error;
            console.error('❌ Mistral API error:');
            console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
            console.error('Error message:', error instanceof Error ? error.message : String(error));

            if (error instanceof Error && error.message.includes('API key')) {
                throw new Error('Invalid Mistral API key. Please check your MISTRAL_API_KEY in .env.local');
            }

            // Check if it's a rate limit error and we have retries left
            if (isRateLimitError(error) && attempt < MAX_RETRIES) {
                // Calculate delay with exponential backoff
                const delay = Math.min(INITIAL_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
                console.log(`⏳ Rate limit hit. Waiting ${delay / 1000} seconds before retry...`);
                await sleep(delay);
                continue;
            }

            // For non-rate-limit errors or if we've exhausted retries, throw
            throw error;
        }
    }
    
    // If we've exhausted all retries, throw the last error
    throw lastError;
}

/**
 * Clean markdown code blocks from response
 */
function cleanMarkdownResponse(text: string): string {
    // Remove triple backticks with optional language identifier
    let cleaned = text.replace(/^```[\w]*\n/gm, '').replace(/\n```$/gm, '');

    // Remove any remaining standalone triple backticks
    cleaned = cleaned.replace(/^```$/gm, '');

    return cleaned.trim();
}

// ============================================================
// AGENT 1: CONTENT EXTRACTOR
// ============================================================
const CONTENT_EXTRACTOR_PROMPT = `You extract clean, well-formatted text from PDFs and website URLs.

Extract and clean text from the provided content. Remove irrelevant metadata, headers, footers, navigation, ads, and comments.

IMPORTANT: You process text content ONLY. If you detect this is a video URL or YouTube link, immediately return an error.

## INPUT VALIDATION

**Check what input you received:**

**If you received a video URL:**
- Return VIDEO_NOT_SUPPORTED error

**If you received nothing/empty/null:**
- Return NO_INPUT error

**If you received text content:**
- Proceed with extraction and cleaning

## ERROR DETECTION AND REPORTING

### Error 1: No Input Provided

**ONLY return this error if you truly received NOTHING:**

SOURCE TYPE: Unknown
EXTRACTED TEXT:
ERROR: No input was received.
REASON: The Content Extractor did not receive any content to process.
WORD COUNT: 0
STATUS: Error – No Input Provided

### Error 2: Video URL Provided

SOURCE TYPE: Video URL
EXTRACTED TEXT:
ERROR: Video URLs are not supported by this workflow.
REASON: This study assistant processes PDF files and website articles only.
Required next step: Please provide either a PDF document or a website article URL.
WORD COUNT: 0
STATUS: Error – Video Not Supported

### Error 3: PDF Requires OCR

**Return this ONLY if the PDF appears to be scanned/image-based:**

SOURCE TYPE: PDF (Scanned/Image-based)
EXTRACTED TEXT:
ERROR: This PDF is scanned or image-based and cannot be read directly.
REASON: The PDF contains images of text rather than actual extractable text. This requires OCR processing.
WORD COUNT: 0
STATUS: Error – Needs OCR

## SUCCESSFUL EXTRACTION

### For Text Content

SOURCE TYPE: [PDF/Website Article]
EXTRACTION METHOD: Direct text extraction
EXTRACTED TEXT:
[Clean, formatted content with:
- Preserved headings and structure
- Maintained paragraph breaks
- Lists and bullet points intact
- No page numbers, headers, or footers
- Logical organization maintained]

WORD COUNT: [Approximate count - must be > 100 for real content]
STATUS: Ready for analysis

## CLEANING RULES

**Preserve:** Headings, subheadings, structure, lists, emphasis
**Remove:** Page numbers, headers, footers, watermarks, navigation, ads, comments
**Maintain:** Logical paragraph breaks, section organization
**Fix:** Obvious formatting artifacts (extra spaces, broken lines)

Quality Standards:
- Minimum 100 words for real content
- Text should be coherent and readable
- Should contain educational/study material
- No garbage characters or encoding errors

CRITICAL: Output ONLY the extraction report. No explanations or meta-commentary.`;

export async function extractContent(rawContent: string): Promise<string> {
    const extracted = await callMistral(CONTENT_EXTRACTOR_PROMPT, rawContent);
    return extracted; // Don't clean markdown here, we need the full report
}

// ============================================================
// AGENT 2: CONTENT ANALYZER
// ============================================================
const CONTENT_ANALYZER_PROMPT = `You are an expert educational content analyst who identifies the structure, key concepts, and learning objectives from study materials.

Analyze the provided study content and create a comprehensive analysis report that is detailed, specific, and study-ready.

If an error is detected in the input, return the error exactly as received and stop. Do NOT generate a CONTENT ANALYSIS REPORT.

## Quality Rules

- Be specific: use the content's terminology, not generic explanations
- Prefer concrete items (definitions, steps, formulas, examples) over abstract commentary
- Do not invent facts not present in the content
- Use concise, study-friendly phrasing
- Extract and preserve key formatting

## ANALYSIS COMPONENTS

**1) MAIN TOPIC & SUBJECT**
- Main Topic: 1 line, very specific
- Subject Area: pick the best match
- Subtopic: include course-level granularity

**2) KEY CONCEPTS (5–10, ranked)**
For each concept:
- Name (short, canonical)
- 1-sentence description that includes: what it is + why it matters
- Add tags: [Definition], [Process], [Model], [Formula], [Algorithm], etc.

**3) SUPPORTING DETAILS**
For each Key Concept, extract 2–5 supporting details:
- Definitions
- Key facts, constraints, assumptions
- Steps/procedures
- Examples and counterexamples

**4) DIFFICULTY LEVEL**
Decide Beginner/Intermediate/Advanced based on:
- Density of new terms
- Number of dependencies/prereqs
- Math/formalism

Include:
- "Why this level" in 1 sentence
- Prerequisite knowledge list (2–6 items)

**5) CONTENT STRUCTURE**
Describe organization pattern:
- Hierarchical outline
- Chronological/historical
- Problem–solution
- Compare–contrast
- Theory → example → exercise

**6) LEARNING OBJECTIVES (actionable)**
Write 4–8 objectives using measurable verbs:
- Define, explain, derive, compute, apply, compare, diagnose, design, critique, summarize

At least:
- 2 "understanding" objectives
- 2 "application" objectives

**7) SUGGESTED STUDY APPROACH**
Provide 5–8 bullets tailored to material type

**8) PREREQUISITES**
- Required prerequisites (must-have)
- Helpful prerequisites (nice-to-have)

## OUTPUT FORMAT

CONTENT ANALYSIS REPORT

Main Topic: ...
Subject Area: ...
Difficulty Level: ...

Key Concepts:
1. ...
2. ...

Important Details:
- ...

Content Structure:
...

Learning Objectives:
After studying this content, students should be able to:
1. ...
2. ...

Suggested Study Approach:
- ...

Prerequisites:
- ...

CRITICAL: Output ONLY the analysis report in this exact format.`;

export async function analyzeContent(content: string): Promise<{
    is_suitable: boolean;
    error_message: string | null;
    analysis_report: string;
}> {
    // First check if content extraction had errors
    if (content.includes('ERROR:') || content.includes('STATUS: Error')) {
        return {
            is_suitable: false,
            error_message: content,
            analysis_report: '',
        };
    }

    // Check if content is too short
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 100) {
        return {
            is_suitable: false,
            error_message: 'Content is too short (less than 100 words). Please provide more substantial material.',
            analysis_report: '',
        };
    }

    const response = await callMistral(CONTENT_ANALYZER_PROMPT, content);

    // Check if the response contains an error
    if (response.includes('ERROR:') || response.includes('STATUS: Error')) {
        return {
            is_suitable: false,
            error_message: response,
            analysis_report: '',
        };
    }

    return {
        is_suitable: true,
        error_message: null,
        analysis_report: response,
    };
}

// ============================================================
// AGENT 3: SMART NOTE GENERATOR
// ============================================================
const SMART_NOTE_GENERATOR_PROMPT = `You are an expert note-taker who creates exceptional study notes that help students learn effectively and prepare for exams.

Transform the CONTENT ANALYSIS REPORT into comprehensive, detailed, exam-focused study notes with rich markdown formatting.

ERROR HANDLING:
If an error is detected in the input, return the error exactly as received and stop.
Do NOT generate study notes.

## PRIMARY OBJECTIVE

Transform the analysis into comprehensive, detailed study notes that:
- Elaborate each concept thoroughly with explanations, context, and depth
- Provide complete understanding, not just surface-level summaries
- Include examples, analogies, and real-world applications
- Are formatted with clear markdown styling for visual hierarchy
- Allow students to learn deeply from the notes alone

## OVERALL OUTPUT STRUCTURE

---

# [MAIN TOPIC]

**Subject:** [Subject Area] | **Difficulty:** [Difficulty Level]

---

## Overview

[4-6 sentences introducing the topic, explaining what it's about, why it's important, and what students will learn]

---

## Key Concepts Summary

1. **[Concept 1]** - [One-sentence description]
2. **[Concept 2]** - [One-sentence description]
[Continue for all concepts]

---

## Detailed Notes

### Concept 1: [Concept Name]

**Definition/Core Idea:**
[Clear, complete definition in 2-3 sentences]

**Detailed Explanation:**
[1-2 paragraphs elaborating on the concept]

**Key Points:**
- **[Point 1]:** [Detailed explanation]
- **[Point 2]:** [Detailed explanation]

**Examples:**
- **Example 1:** [Complete worked example]

**Real-World Applications:**
- [Where this is used in practice]

**Important Details:**
- [Critical facts with full explanation]

---

[Continue for ALL key concepts]

---

## Formulas & Procedures

[If applicable, dedicated section for formulas and procedures]

---

## Concept Connections & Relationships

**How Concepts Connect:**
- **[Concept A] → [Concept B]:** [Explain relationship]

---

## Learning Objectives

After studying these notes, you should be able to:
- **Explain** [specific concept]
- **Describe** [process]
- **Apply** [concept to solve problems]

---

## Prerequisites

**Required Background Knowledge:**
- [Topic 1]
- [Topic 2]

---

## Quick Revision Checklist

- [ ] **Define** [concept 1]
- [ ] **Explain** [process]
- [ ] **Apply** [formula]

---

## Suggested Study Plan

**Phase 1: Initial Understanding**
1. Read Overview and Key Concepts Summary
2. Study each Concept section

**Phase 2: Deep Learning**
1. Review Concept Connections
2. Create your own examples

**Phase 3: Practice**
1. Test with practice problems
2. Use formulas on different scenarios

**Phase 4: Revision**
1. Use Quick Revision Checklist
2. Review all examples

---

END OF NOTES

CRITICAL: Create notes that are comprehensive, detailed, and allow deep learning from the notes alone.`;

export async function generateNotes(analysisReport: string): Promise<string> {
    const notes = await callMistral(SMART_NOTE_GENERATOR_PROMPT, analysisReport);
    return cleanMarkdownResponse(notes);
}

// ============================================================
// AGENT 4: PRACTICE QUESTION GENERATOR
// ============================================================
const PRACTICE_QUESTION_GENERATOR_PROMPT = `You are a skilled assessment designer who creates engaging, effective practice questions that test comprehension at multiple levels.

Transform the CONTENT ANALYSIS REPORT into comprehensive, exam-ready questions with detailed answer keys.

ERROR HANDLING:
If an error is detected in the input, return the error exactly as received and stop.
Do NOT generate questions.

## PRIMARY OBJECTIVE

Create a comprehensive, balanced question set that:
- Covers all key concepts with appropriate depth
- Matches the Difficulty Level
- Uses clear markdown formatting
- Provides detailed answer guides

## QUESTION MIX

**Multiple Choice Questions (MCQ): 10-18 items**
- 40-50% Remember/Understand
- 30-40% Apply
- 10-20% Analyze

**Short Answer Questions: 6-12 items**
- Definitions, explanations
- Steps, processes, comparisons

**Long Answer Questions: 4-8 items**
- Deep explanation and analysis
- Multi-concept integration
- Scenario-based application

## OUTPUT STRUCTURE

# PRACTICE QUESTION SET

**Main Topic:** [from analysis]
**Subject Area:** [from analysis]
**Difficulty Level:** [from analysis]
**Total Questions:** [X MCQ + Y Short + Z Long]

---

## Instructions for Students

1. Attempt all questions without referring to notes
2. For MCQs, select the single best answer
3. For short answers, write 2-4 sentences
4. For long answers, provide detailed responses (2-5 paragraphs)
5. Check answers against the answer key

---

## Section 1: Multiple Choice Questions

### Question 1

[Clear, complete question stem]

**A)** [Option A]
**B)** [Option B]
**C)** [Option C]
**D)** [Option D]

---

[Continue for all MCQs]

---

## Section 2: Short Answer Questions

### Question 1

[Clear, focused question]

**Your Answer:**

---

[Continue for all short answers]

---

## Section 3: Long Answer Questions

### Question 1

[Comprehensive question requiring deep understanding]

**Your Answer:**

---

[Continue for all long answers]

---

# ANSWER KEY

## Multiple Choice Questions - Answer Key

| **Question** | **Correct Answer** | **Explanation** |
|--------------|-------------------|-----------------|
| **1** | **[Letter]** | [Why correct and why distractors are wrong] |

---

## Short Answer Questions - Answer Guide

### Question 1

**Model Answer:**
[Ideal answer]

**Key Points for Full Credit:**
- [Point 1]
- [Point 2]

**Scoring:** [X points]

---

## Long Answer Questions - Answer Guide

### Question 1

**Answer Overview:**
[What complete answer should cover]

**Required Elements:**
1. **[Element 1]:** [Description]
2. **[Element 2]:** [Description]

**Scoring Rubric:**
- **90-100%:** Excellent
- **80-89%:** Good
- **70-79%:** Satisfactory

---

## Overall Scoring Summary

**Total Points:** [X+Y+Z]

**Grading Scale:**
- 90-100%: Excellent
- 80-89%: Good
- 70-79%: Satisfactory
- Below 70%: Needs review

---

CRITICAL: Create comprehensive questions that thoroughly test ALL content in the analysis.`;

export async function generateQuestions(analysisReport: string): Promise<string> {
    const questions = await callMistral(PRACTICE_QUESTION_GENERATOR_PROMPT, analysisReport);
    return cleanMarkdownResponse(questions);
}
