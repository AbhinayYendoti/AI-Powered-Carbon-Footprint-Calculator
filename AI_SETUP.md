# 🤖 AI-Powered Carbon Footprint Calculator Setup

This project now includes **real AI capabilities** powered by OpenAI's GPT models for intelligent, personalized recommendations and analysis.

## 🚀 What's New

### AI Features Added:
1. **Intelligent Recommendations**: AI-generated personalized action plans based on your carbon footprint data
2. **Smart Analysis**: AI-powered insights about your environmental impact
3. **Enhanced Chat**: Intelligent responses to your questions about carbon footprints
4. **Fallback System**: Graceful degradation when AI is unavailable

## 🔧 Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the key (it starts with `sk-`)

### 2. Configure Environment Variables

**Option A: Environment File (Recommended)**
```bash
# In the server directory, create a .env file:
cd server
echo "OPENAI_API_KEY=your-actual-api-key-here" > .env
```

**Option B: Direct Environment Variable**
```bash
# Windows (Command Prompt)
set OPENAI_API_KEY=your-actual-api-key-here

# Windows (PowerShell)
$env:OPENAI_API_KEY="your-actual-api-key-here"

# Linux/Mac
export OPENAI_API_KEY=your-actual-api-key-here
```

### 3. Start the Server
```bash
# From the project root
npm run dev:full
```

## 🎯 How It Works

### AI Recommendation Generation
- Analyzes your carbon footprint data (transport, home, diet, shopping)
- Compares against world averages and similar users
- Generates personalized, actionable recommendations
- Provides impact estimates, difficulty levels, and step-by-step actions

### AI Analysis
- Assesses your overall environmental impact
- Identifies biggest contributors to your carbon footprint
- Provides encouraging insights and improvement potential
- Compares your footprint to global averages

### Smart Chat
- Answers questions about carbon footprints
- Provides context-aware advice
- Suggests specific actions based on your data

## 🔄 Fallback System

If the OpenAI API is unavailable or not configured:
- **Recommendations**: Falls back to rule-based recommendations
- **Analysis**: Uses statistical analysis and predefined insights
- **Chat**: Uses predefined responses for common questions

## 💰 Cost Considerations

- OpenAI API costs approximately $0.002 per 1K tokens
- Typical recommendation generation: ~500-800 tokens
- Typical analysis: ~300-500 tokens
- Estimated cost per user: $0.001-0.003 per calculation

## 🛠️ Technical Details

### AI Models Used
- **GPT-3.5-turbo**: For recommendations and analysis
- **Temperature**: 0.7 for creative recommendations, 0.5 for analysis
- **Max Tokens**: 800 for recommendations, 500 for analysis

### Data Processing
- User data is anonymized before sending to OpenAI
- No personal information is stored or transmitted
- All AI responses are parsed and structured for the frontend

### Error Handling
- Graceful fallback to rule-based systems
- Comprehensive error logging
- User-friendly error messages

## 🧪 Testing the AI Features

1. **Start the calculator** and enter some data
2. **Click "Start Action Plan"** to see AI-generated recommendations
3. **Check the console** for AI processing logs
4. **Try the chat feature** with questions like "How can I reduce my transport emissions?"

## 🔒 Privacy & Security

- API keys are stored securely in environment variables
- No user data is permanently stored
- All AI interactions are temporary and not logged
- Fallback systems ensure functionality even without AI

## 🚀 Next Steps

To enhance the AI capabilities further:
1. **Add more context** to AI prompts (location, lifestyle, preferences)
2. **Implement user feedback** to improve recommendations
3. **Add seasonal adjustments** based on time of year
4. **Integrate with weather APIs** for location-specific advice
5. **Add progress tracking** to measure recommendation effectiveness

---

**Note**: The AI features work best with a valid OpenAI API key, but the application will function normally even without one thanks to the fallback systems. 