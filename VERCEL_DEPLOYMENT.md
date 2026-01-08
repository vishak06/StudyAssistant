# Vercel Deployment Guide - Mistral Migration

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

**CRITICAL:** You must add the Mistral API key to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `MISTRAL_API_KEY`
   - **Value**: Your Mistral API key (starts with your key format)
   - **Environment**: Production, Preview, Development (select all)

### 2. Dependencies Verification

The following dependencies are now required (already in `package.json`):

```json
{
  "@mistralai/mistralai": "^1.0.0",
  "pdf2json": "^3.1.4",
  "cheerio": "^1.0.0"
}
```

**Removed dependencies:**
- ❌ `lyzr-automata` (no longer needed)
- ❌ `pdf-parse` (replaced with pdf2json)
- ❌ `pdfjs-dist` (replaced with pdf2json)

### 3. Code Changes Summary

**Files Modified:**
- ✅ `src/lib/mistral-agents.ts` - New Mistral agent module
- ✅ `src/app/api/process-pdf/route.ts` - Updated to use Mistral
- ✅ `src/app/api/process-url/route.ts` - Updated to use Mistral
- ✅ `README.md` - Updated documentation
- ✅ `ENV_SETUP.md` - New setup guide

**Files Removed:**
- ❌ Any Lyzr-specific configuration files (if any)

### 4. Vercel Build Settings

No changes needed! The default Next.js build settings will work:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 5. API Key Security

**IMPORTANT:** 
- ✅ `.env.local` is in `.gitignore` (your API key won't be committed)
- ✅ API key is only accessed server-side in API routes
- ✅ Never expose `MISTRAL_API_KEY` to client-side code

### 6. Deployment Steps

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Migrate from Lyzr to Mistral AI"
   git push origin main
   ```

2. **Add Environment Variable in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `MISTRAL_API_KEY` with your key
   - Save changes

3. **Deploy:**
   - Vercel will auto-deploy on push, OR
   - Manually trigger deployment from Vercel dashboard

4. **Verify Deployment:**
   - Test PDF upload
   - Test URL processing
   - Check Vercel logs for any errors

### 7. Expected Behavior

**PDF Processing:**
- ✅ Extracts text using pdf2json (no DOMMatrix errors)
- ✅ Processes through 4 Mistral agents
- ✅ Generates comprehensive notes and questions

**URL Processing:**
- ✅ Fetches content using cheerio
- ✅ Processes through 4 Mistral agents
- ✅ Generates comprehensive notes and questions

### 8. Monitoring

After deployment, monitor:
- **Vercel Function Logs**: Check for any runtime errors
- **Mistral API Usage**: Monitor your Mistral console for API usage
- **Performance**: Mistral should be faster than Lyzr

### 9. Rollback Plan (If Needed)

If something goes wrong:
1. Revert to previous Git commit
2. Re-add `LYZR_API_KEY` to Vercel environment variables
3. Redeploy

### 10. Cost Considerations

**Mistral Free Tier:**
- 500,000 tokens/minute
- Much more generous than Lyzr's limits
- Monitor usage at https://console.mistral.ai/

## 🚀 Ready to Deploy!

Once you've:
- ✅ Added `MISTRAL_API_KEY` to Vercel
- ✅ Pushed code to Git
- ✅ Verified all dependencies are in package.json

You're ready to deploy! The migration is complete.

## Troubleshooting

**If deployment fails:**
1. Check Vercel build logs for errors
2. Verify `MISTRAL_API_KEY` is set correctly
3. Ensure all dependencies installed (`npm install`)
4. Check that no Lyzr imports remain in code

**If API calls fail:**
1. Verify Mistral API key is valid
2. Check Mistral API status
3. Review Vercel function logs
4. Ensure environment variable is accessible

## Support

- Mistral API Docs: https://docs.mistral.ai/
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
