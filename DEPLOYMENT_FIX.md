# AI Service Deployment Fix

## Problem
Your deployed website is using old DeepSeek configuration instead of the new Groq configuration.

## Solution
Update these environment variables on your deployment platform:

### Required Environment Variables:
```
GROQ_API_KEY=your_groq_api_key_from_local_env
AI_MODEL=llama-3.1-8b-instant
AI_BASE_URL=https://api.groq.com/openai/v1
```

### For Vercel:
1. Go to your Vercel dashboard
2. Select your project  
3. Go to Settings → Environment Variables
4. Add the variables above with your actual API key

### For Heroku:
```bash
heroku config:set GROQ_API_KEY=your_actual_api_key
heroku config:set AI_MODEL=llama-3.1-8b-instant
heroku config:set AI_BASE_URL=https://api.groq.com/openai/v1
```

### For Railway:
1. Go to your Railway dashboard
2. Select your project
3. Go to Variables tab
4. Add the environment variables

## After updating:
1. Redeploy your application
2. Test the AI service status endpoint: `https://your-domain.com/api/ai/status/`
3. The status should show `service_operational: true`

## Your API Key:
Use the same GROQ_API_KEY value from your local `.env` file.