import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const LYZR_WORKFLOW_URL = 'https://lao.studio.lyzr.ai/run-dag/';
const LYZR_WORKFLOW_STATUS_URL = 'https://lao.studio.lyzr.ai/task-status/';

function cleanMarkdownResponse(text: string): string {
  // Remove triple backticks with optional language identifier
  let cleaned = text.replace(/^```[\w]*\n/gm, '').replace(/\n```$/gm, '');
  
  // Remove any remaining standalone triple backticks
  cleaned = cleaned.replace(/^```$/gm, '');
  
  return cleaned.trim();
}

async function callWorkflow(url: string, apiKey: string) {
  // generate per-run identifiers to avoid hardcoded ids
  const userId = randomUUID();
  const sessionId = randomUUID();

  const workflowPayload = {
    tasks: [
      {
        name: "agent_input_rout",
        tag: "Input Router",
        function: "call_lyzr_agent",
        params: {
          config: {
            user_id: userId,
            api_key: apiKey,
            session_id: sessionId,
            agent_id: "694636cf6363be71980e708c",
            api_url: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            agent_name: "Input Router"
          },
          message: url
        }
      },
      {
        name: "agent_content_ex",
        tag: "Content Extractor",
        function: "call_lyzr_agent",
        params: {
          config: {
            user_id: userId,
            api_key: apiKey,
            session_id: sessionId,
            agent_id: "694636fe2be72f04a7d631a9",
            api_url: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            agent_name: "Content Extractor"
          },
          message: url,
          agent_input_rout: {
            depends: "agent_input_rout"
          }
        }
      },
      {
        name: "agent_content_an",
        tag: "Content Analyzer",
        function: "call_lyzr_agent",
        params: {
          config: {
            user_id: userId,
            api_key: apiKey,
            session_id: sessionId,
            agent_id: "6946372b81c8a74f1ca94db5",
            api_url: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            agent_name: "Content Analyzer"
          },
          assets: [],
          agent_content_ex: {
            depends: "agent_content_ex"
          }
        }
      },
      {
        name: "conditional_twqv",
        tag: "Conditional",
        function: "gpt_conditional_block",
        params: {
          message: "",
          condition: "Is there an error?",
          openai_api_key: "",
          model: "gpt-3.5-turbo",
          temperature: 0,
          true: "agent_error_disp",
          false: "agent_content_an",
          agent_content_ex: {
            depends: "agent_content_ex"
          }
        }
      },
      {
        name: "agent_error_disp",
        tag: "Error Displayer",
        function: "call_lyzr_agent",
        params: {
          config: {
            user_id: userId,
            api_key: apiKey,
            session_id: sessionId,
            agent_id: "694639396363be71980e708d",
            api_url: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            agent_name: "Error Displayer"
          },
          assets: []
        }
      },
      {
        name: "agent_smart_note",
        tag: "Smart Note Generator",
        function: "call_lyzr_agent",
        params: {
          config: {
            user_id: userId,
            api_key: apiKey,
            session_id: sessionId,
            agent_id: "69463835cf278553868d5d4b",
            api_url: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            agent_name: "Smart Note Generator"
          },
          assets: [],
          agent_content_an: {
            depends: "agent_content_an"
          }
        }
      },
      {
        name: "agent_practice_q",
        tag: "Practice Question Generator",
        function: "call_lyzr_agent",
        params: {
          config: {
            user_id: userId,
            api_key: apiKey,
            session_id: sessionId,
            agent_id: "6946390581c8a74f1ca94db6",
            api_url: "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
            agent_name: "Practice Question Generator"
          },
          assets: [],
          agent_content_an: {
            depends: "agent_content_an"
          }
        }
      }
    ],
    default_inputs: {},
    flow_name: "Study Assistant",
    run_name: "QuickWay",
    edges: [
      {
        source: "conditional_twqv",
        target: "agent_error_disp",
        condition: "true"
      },
      {
        source: "conditional_twqv",
        target: "agent_content_an",
        condition: "false"
      }
    ],
    flow_data: {
      node_positions: {
        agent_input_rout: { x: -263, y: 314 },
        agent_content_ex: { x: 157, y: 312 },
        agent_content_an: { x: 1035, y: 520 },
        conditional_twqv: { x: 585, y: 289 },
        agent_error_disp: { x: 1015, y: 132 },
        agent_smart_note: { x: 1469.75, y: 379 },
        agent_practice_q: { x: 1472, y: 680 }
      }
    }
  };

  console.log('Calling workflow API...');
  
  const response = await fetch(LYZR_WORKFLOW_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(workflowPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Workflow failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function getWorkflowStatus(taskId: string, apiKey: string, maxAttempts = 60, intervalMs = 5000) {
  console.log(`Polling workflow status for task: ${taskId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`${LYZR_WORKFLOW_STATUS_URL}${taskId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get workflow status: ${response.status} ${errorText}`);
    }

    const statusData = await response.json();
    console.log(`Attempt ${attempt}: Workflow status:`, statusData.status);

    if (statusData.status === 'completed') {
      console.log('Workflow completed successfully');
      return statusData;
    } else if (statusData.status === 'failed' || statusData.status === 'error') {
      throw new Error(`Workflow failed with status: ${statusData.status}`);
    }

    // Wait before next poll
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Workflow timed out - maximum polling attempts reached');
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

    // Call the workflow with the URL
    console.log('Calling workflow with URL:', url);
    const workflowInitResponse = await callWorkflow(url, apiKey);
    console.log('Workflow initiated:', JSON.stringify(workflowInitResponse, null, 2));

    // Check if we got a task_id (async workflow)
    if (workflowInitResponse.task_id) {
      console.log('Workflow is async, polling for completion...');
      const workflowResult = await getWorkflowStatus(workflowInitResponse.task_id, apiKey);
      console.log('Workflow completed. Result:', JSON.stringify(workflowResult, null, 2));
      
      // Extract results from workflow output
      const results = workflowResult.results || {};
    
      // Check if workflow encountered an error (error displayer was triggered)
      if (results.agent_error_disp) {
        let errorMessage = 'An error occurred while processing your URL. Please try a different URL.';
        
        // Handle different response formats
        if (typeof results.agent_error_disp === 'string') {
          errorMessage = results.agent_error_disp;
        } else if (typeof results.agent_error_disp === 'object') {
          errorMessage = results.agent_error_disp.response || 
                        results.agent_error_disp.message || 
                        errorMessage;
        }
        
        return NextResponse.json({
          success: false,
          isError: true,
          errorMessage: errorMessage
        });
      }

      // Extract notes and questions from final agents
      // Results are returned as direct strings, not nested objects
      let notes = results.agent_smart_note || 'Notes could not be generated';
      let questions = results.agent_practice_q || 'Questions could not be generated';
      
      // If they're objects (for backward compatibility), extract the response/message
      if (typeof notes === 'object' && notes !== null) {
        notes = notes.response || notes.message || 'Notes could not be generated';
      }
      if (typeof questions === 'object' && questions !== null) {
        questions = questions.response || questions.message || 'Questions could not be generated';
      }
      
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
    } else {
      // Handle synchronous response (if workflow ever returns immediate results)
      throw new Error('Unexpected workflow response format - no task_id provided');
    }
    
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