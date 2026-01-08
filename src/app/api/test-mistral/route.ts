import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

export async function GET(request: NextRequest) {
    try {
        console.log('Testing Mistral API connection...');

        const apiKey = process.env.MISTRAL_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'MISTRAL_API_KEY not found in environment variables'
            });
        }

        console.log('API Key found, length:', apiKey.length);
        console.log('API Key starts with:', apiKey.substring(0, 10));

        const client = new Mistral({ apiKey });

        console.log('Calling Mistral API...');
        const response = await client.chat.complete({
            model: 'open-mixtral-8x7b',
            messages: [
                { role: 'user', content: 'Say "Hello, World!" and nothing else.' }
            ],
            temperature: 0.1,
            maxTokens: 50,
        });

        console.log('Response received!');
        const content = response.choices?.[0]?.message?.content;

        return NextResponse.json({
            success: true,
            message: 'Mistral API is working!',
            response: content,
            apiKeyLength: apiKey.length,
            apiKeyPrefix: apiKey.substring(0, 10)
        });

    } catch (error: any) {
        console.error('Mistral API test failed:');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error',
            errorType: error.constructor.name,
            details: error.toString()
        }, { status: 500 });
    }
}
