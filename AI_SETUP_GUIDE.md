# Free AI API Setup Guide for ESG Resolve

This guide will help you configure free AI APIs to power the comprehensive ESG analysis and chatbot features.

## Supported Free AI APIs

### 1. Groq API (Recommended - Fast & Free)
- **Provider**: Groq
- **Model**: Llama 3.1 8B Instant
- **Free Tier**: 14,400 requests/day
- **Speed**: Very fast inference
- **Setup**: 
  1. Visit https://console.groq.com/
  2. Sign up for a free account
  3. Generate an API key
  4. Add to your `.env` file:
     ```
     GROQ_API_KEY=your_groq_api_key_here
     AI_MODEL=llama-3.1-8b-instant
     AI_BASE_URL=https://api.groq.com/openai/v1
     ```

### 2. OpenRouter API (Alternative)
- **Provider**: OpenRouter
- **Model**: Meta Llama 3.1 8B Instruct (Free)
- **Free Tier**: Limited free credits
- **Setup**:
  1. Visit https://openrouter.ai/
  2. Sign up and get API key
  3. Add to your `.env` file:
     ```
     OPENROUTER_API_KEY=your_openrouter_api_key_here
     ```

### 3. Hugging Face API (Backup)
- **Provider**: Hugging Face
- **Models**: Various free models available
- **Free Tier**: Rate limited but free
- **Setup**:
  1. Visit https://huggingface.co/
  2. Create account and generate token
  3. Add to your `.env` file:
     ```
     HUGGINGFACE_API_KEY=your_hf_token_here
     ```

## Backend Configuration

1. **Update your `.env` file** in the backend directory:
   ```env
   # AI Configuration
   GROQ_API_KEY=your_groq_api_key_here
   AI_MODEL=llama-3.1-8b-instant
   AI_BASE_URL=https://api.groq.com/openai/v1
   
   # Optional: Additional APIs
   OPENROUTER_API_KEY=your_openrouter_key_here
   HUGGINGFACE_API_KEY=your_hf_token_here
   ```

2. **Install required packages**:
   ```bash
   cd backend
   pip install openai requests python-dotenv
   ```

3. **Run migrations** (if needed):
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

## Frontend Configuration

No additional configuration needed for the frontend. The AI features will automatically detect available APIs.

## Testing the Setup

1. **Check AI Service Status**:
   - Visit `/ai-dashboard` in your application
   - Look for the AI status badge (should show "AI Active")

2. **Test Comprehensive Analysis**:
   - Complete an ESG assessment
   - Click "🤖 Generate AI Analysis" on the AI Dashboard
   - Wait for enhanced insights to appear

3. **Test AI Chatbot**:
   - Visit `/ai-chatbot`
   - Ask questions like "How can I improve my environmental score?"
   - Verify you get contextual, detailed responses

## Features Enabled by AI APIs

### 1. Comprehensive ESG Analysis
- **Detailed Scoring**: AI analyzes your data and provides nuanced scores
- **Industry Benchmarking**: Compares your performance to industry standards
- **Risk Assessment**: Identifies high, medium, and low priority risks
- **Actionable Recommendations**: Specific, cost-effective improvement suggestions

### 2. Enhanced Dashboard
- **AI Insights Cards**: Visual representation of AI analysis
- **Smart Recommendations**: Prioritized based on impact and cost
- **Risk Visualization**: Color-coded risk assessment
- **Performance Radar**: Multi-dimensional ESG performance view

### 3. Intelligent Chatbot
- **Context-Aware**: Knows your specific ESG scores and business profile
- **Implementation Guidance**: Step-by-step instructions for improvements
- **Cost Analysis**: Budget estimates and ROI calculations
- **Conversational Memory**: Remembers previous questions in the session

### 4. AI-Powered Reports
- **Executive Summaries**: AI-generated business insights
- **Investment Priorities**: Ranked improvement opportunities
- **Compliance Assessment**: Regulatory readiness evaluation
- **Stakeholder Communication**: Key messages for different audiences

## API Usage and Limits

### Groq API (Recommended)
- **Daily Limit**: 14,400 requests
- **Rate Limit**: 30 requests/minute
- **Model**: Llama 3.1 8B Instant
- **Response Time**: ~1-2 seconds
- **Cost**: Free

### OpenRouter API
- **Free Credits**: $1-5 worth of free credits
- **Rate Limit**: Varies by model
- **Models**: Multiple free options available
- **Cost**: Free tier available

### Usage Optimization Tips
1. **Cache Results**: The system caches AI responses to reduce API calls
2. **Batch Requests**: Multiple analyses are combined when possible
3. **Fallback Logic**: If AI fails, system provides rule-based responses
4. **Smart Prompting**: Optimized prompts reduce token usage

## Troubleshooting

### Common Issues

1. **"AI Offline" Status**:
   - Check your API keys in `.env`
   - Verify internet connection
   - Check API service status

2. **Slow Responses**:
   - Groq is fastest, try switching to it
   - Check your internet connection
   - Verify API rate limits

3. **Generic Responses**:
   - Ensure you have completed an ESG assessment
   - Check that snapshot data is available
   - Verify API key permissions

### Error Messages

- **"AI service temporarily unavailable"**: API key issue or service down
- **"Failed to generate AI analysis"**: Network or API limit issue
- **"Fallback response activated"**: AI failed, using rule-based backup

## Advanced Configuration

### Custom Models
You can modify the AI models in `backend/esgapp/free_ai_service.py`:

```python
# For Groq
AI_MODEL = "llama-3.1-70b-versatile"  # Larger model (slower but better)

# For OpenRouter
model = "meta-llama/llama-3.1-70b-instruct:free"  # If available
```

### Prompt Customization
Modify prompts in `free_ai_service.py` to customize AI behavior:
- Adjust scoring criteria
- Change recommendation focus
- Modify response style

## Security Notes

1. **API Key Security**:
   - Never commit API keys to version control
   - Use environment variables only
   - Rotate keys regularly

2. **Data Privacy**:
   - AI APIs may log requests (check provider policies)
   - Consider data sensitivity when using external APIs
   - Review terms of service for each provider

## Support

If you encounter issues:
1. Check the AI service status endpoint: `/api/ai/status/`
2. Review backend logs for error details
3. Test API keys directly with provider documentation
4. Use fallback mode if AI is unavailable

## Cost Monitoring

All recommended APIs offer free tiers, but monitor usage:
- **Groq**: 14,400 requests/day (very generous)
- **OpenRouter**: Check credit balance in dashboard
- **Hugging Face**: Monitor rate limits

The system is designed to work efficiently within free tier limits while providing comprehensive AI-powered ESG analysis.