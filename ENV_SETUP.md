# Study Assistant - Environment Configuration

## Required Environment Variables

Create a `.env.local` file in the root of the `study-assistant` directory with the following:

```bash
# Mistral API Configuration
# Get your API key from: https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key_here
```

## Getting Your Mistral API Key

1. Visit https://console.mistral.ai/
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

## Free Tier Limits

Mistral offers generous free tier limits:
- 500,000 tokens per minute
- Sufficient for most study assistant use cases
