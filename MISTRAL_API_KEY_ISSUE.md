# Mistral API Key Issue - Troubleshooting

## Current Issue

Getting error: `Unexpected token '<', '<!DOCTYPE'... is not valid JSON`

This error occurs when the Mistral API returns an HTML error page instead of JSON, typically due to authentication issues.

## Your API Key

- **Length**: 32 characters
- **Starts with**: `zBRIW6zfBW`

## Problem

Mistral API keys should typically start with one of these prefixes:
- `sk-` (secret key)
- `mistral-` (newer format)

Your key starts with `zBRIW6zfBW` which doesn't match the expected format.

## Solution

1. **Go to Mistral Console**: https://console.mistral.ai/api-keys/
2. **Create a new API key** or verify your existing one
3. **Copy the complete key** (it should start with a recognizable prefix)
4. **Update `.env.local`**:
   ```
   MISTRAL_API_KEY=your_complete_api_key_here
   ```

## How to Update

1. Open `.env.local` file
2. Replace the current `MISTRAL_API_KEY` value with your new key
3. Save the file
4. Restart the dev server

## Verify

After updating, the key should:
- Be longer than 32 characters (usually 40-50+)
- Start with `sk-` or similar prefix
- Work without returning HTML error pages
