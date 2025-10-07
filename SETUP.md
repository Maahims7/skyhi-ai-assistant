# SkyHi AI Assistant - Setup Guide

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory with:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/skyhi-ai-assistant
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # AI Services
   GEMINI_API_KEY=your-gemini-api-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   
   # External APIs
   OPENWEATHER_API_KEY=your-openweather-api-key-here
   NEWS_API_KEY=your-news-api-key-here
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Access the Application**
   Open your browser and go to `http://localhost:3001`

## 🔧 Features

### Core Capabilities
- **Voice Recognition**: Wake word detection ("Hey SkyHi", "Jarvis")
- **Face Recognition**: Secure login using facial authentication
- **Dual Chat Modes**: Normal and Pro Chat modes
- **Text-to-Speech**: Natural voice responses
- **System Actions**: Open applications, fetch data, etc.

### Chat Modes
- **Normal Chat**: Friendly, lightweight conversations
- **Pro Chat**: Advanced reasoning, code generation, creative writing
  - Activate with "pro:" or "switch to pro"

### Voice Commands
- "Hey SkyHi, what's the weather?"
- "Jarvis, show me the latest news"
- "SkyHi, open Visual Studio Code"
- "Pro: generate a Python function for sorting"

### Quick Actions
- Weather information
- News headlines
- Task management
- Schedule viewing
- Calculator
- Currency converter
- Speed test

## 🛠️ API Keys Setup

### Google Gemini (Free)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env` as `GEMINI_API_KEY`

### OpenAI GPT-4 (Premium)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env` as `OPENAI_API_KEY`

### Weather API (Optional)
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for free API key
3. Add to `.env` as `OPENWEATHER_API_KEY`

### News API (Optional)
1. Go to [NewsAPI](https://newsapi.org/)
2. Sign up for free API key
3. Add to `.env` as `NEWS_API_KEY`

## 🎯 Usage Examples

### Voice Interaction
1. Click the microphone button or say "Hey SkyHi"
2. Speak your command naturally
3. SkyHi will respond with voice and text

### Pro Chat Mode
1. Type "pro:" followed by your request
2. Or say "switch to pro" then your command
3. Get advanced AI assistance with deep reasoning

### System Actions
- "Open Visual Studio Code"
- "Show me the weather"
- "What's the latest news?"
- "Schedule a meeting for tomorrow"

## 🔒 Security Features

- **Face Recognition**: Secure biometric authentication
- **JWT Tokens**: Secure session management
- **Input Validation**: Safe command processing
- **Privacy Protection**: No data storage without consent

## 🐛 Troubleshooting

### Voice Recognition Not Working
- Ensure microphone permissions are granted
- Check browser compatibility (Chrome/Edge recommended)
- Try refreshing the page

### Face Recognition Issues
- Ensure good lighting
- Look directly at the camera
- Remove glasses if causing issues

### API Errors
- Check API keys in `.env` file
- Verify internet connection
- Check API service status

## 📱 Browser Compatibility

- **Chrome**: Full support
- **Edge**: Full support
- **Firefox**: Limited voice support
- **Safari**: Limited voice support

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper SSL certificates
4. Set up proper API rate limiting
5. Enable logging and monitoring

## 📞 Support

For issues or questions:
- Check the console for error messages
- Verify all environment variables are set
- Ensure all dependencies are installed
- Check API key validity and quotas
