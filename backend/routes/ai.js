const express = require('express');
const axios = require('axios');
const router = express.Router();

// AI Service Configuration
const AI_SERVICES = {
    FREE: {
        name: 'Google Gemini',
        apiKey: process.env.GEMINI_API_KEY,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        maxTokens: 1000
    },
    PREMIUM: {
        name: 'OpenAI GPT-4',
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        maxTokens: 2000
    }
};

// Check user subscription level
const getUserSubscriptionLevel = (req) => {
    // For demo purposes, return 'FREE' - in production, check user's subscription
    return 'FREE';
};

// Free AI Chat (Google Gemini)
router.post('/chat', async (req, res) => {
    try {
        const { message, context = [] } = req.body;
        const subscriptionLevel = getUserSubscriptionLevel(req);
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Processing chat with ${subscriptionLevel} AI service...`);

        let response;
        
        if (subscriptionLevel === 'PREMIUM' && AI_SERVICES.PREMIUM.apiKey) {
            response = await handleOpenAIChat(message, context);
        } else {
            response = await handleGeminiChat(message, context);
        }

        res.json({
            response: response,
            type: 'conversation',
            service: subscriptionLevel === 'PREMIUM' ? 'OpenAI GPT-4' : 'Google Gemini',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI chat error:', error);
        
        // Fallback response
        const fallbackResponses = [
            "I'm having trouble processing that right now. Could you try rephrasing your question?",
            "I'm experiencing some technical difficulties. Please try again in a moment.",
            "I'm here to help! Could you please ask your question again?"
        ];
        
        res.json({
            response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
            type: 'conversation',
            service: 'Fallback',
            timestamp: new Date().toISOString()
        });
    }
});

// Google Gemini API Integration (Free)
async function handleGeminiChat(message, context) {
    try {
        if (!AI_SERVICES.FREE.apiKey) {
            // Fallback to rule-based responses
            return generateRuleBasedResponse(message);
        }

        const prompt = buildPrompt(message, context);
        
        const response = await axios.post(
            `${AI_SERVICES.FREE.endpoint}?key=${AI_SERVICES.FREE.apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: AI_SERVICES.FREE.maxTokens,
                    temperature: 0.7
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API error:', error);
        return generateRuleBasedResponse(message);
    }
}

// OpenAI GPT-4 API Integration (Premium)
async function handleOpenAIChat(message, context) {
    try {
        if (!AI_SERVICES.PREMIUM.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const messages = [
            {
                role: 'system',
                content: 'You are SkyHi, a futuristic AI assistant with a friendly, helpful personality. You can help with various tasks including scheduling, information gathering, and general conversation.'
            },
            ...context,
            {
                role: 'user',
                content: message
            }
        ];

        const response = await axios.post(
            AI_SERVICES.PREMIUM.endpoint,
            {
                model: 'gpt-4',
                messages: messages,
                max_tokens: AI_SERVICES.PREMIUM.maxTokens,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${AI_SERVICES.PREMIUM.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
}

// Rule-based responses for when APIs are not available
function generateRuleBasedResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Weather queries
    if (lowerMessage.includes('weather')) {
        return "I can help you with weather information! The current weather shows 25°C and sunny. For detailed weather data, I can fetch real-time information from weather services.";
    }
    
    // News queries
    if (lowerMessage.includes('news') || lowerMessage.includes('latest')) {
        return "I can fetch the latest news for you! I have access to various news sources and can provide you with current events, technology news, and more.";
    }
    
    // Task management
    if (lowerMessage.includes('task') || lowerMessage.includes('schedule') || lowerMessage.includes('reminder')) {
        return "I can help you manage your tasks and schedule! I can create reminders, set up calendar events, and help you stay organized.";
    }
    
    // Calculator
    if (lowerMessage.includes('calculate') || lowerMessage.includes('math') || /\d+[\+\-\*\/]\d+/.test(message)) {
        return "I can help you with calculations! I have a built-in calculator that can handle basic math operations, currency conversions, and more.";
    }
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! I'm SkyHi, your AI assistant. I'm here to help you with various tasks including scheduling, information gathering, calculations, and much more. What can I do for you today?";
    }
    
    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('commands')) {
        return "I'm SkyHi, your comprehensive AI assistant! Here's what I can do:\n\n🌤️ **Weather**: Ask 'What's the weather?' or 'Tell me the temperature'\n📰 **News**: Ask 'Show me the latest news' or 'What's happening?'\n😄 **Jokes**: Ask 'Tell me a joke' or 'Make me laugh'\n🧠 **Facts**: Ask 'Tell me a fact' or 'Something interesting'\n🧮 **Calculator**: Ask 'Calculate 25 * 4' or 'What's 100 + 50?'\n💬 **Chat**: Just talk to me about anything!\n\n🎯 **Quick Actions**: Use the buttons on the right for instant access!\n🚀 **Premium Features**: Click 'Upgrade Now' for advanced AI capabilities!\n\nTry asking me anything!";
    }
    
    // Default response
    const responses = [
        "That's interesting! I'm SkyHi, your AI assistant. I can help you with various tasks like weather, news, scheduling, calculations, and more. What would you like to know?",
        "I understand you're asking about: " + message + ". I'm here to help! I can assist with weather, news, tasks, calculations, and general questions.",
        "I'm SkyHi, your AI assistant! I can help you with information, scheduling, calculations, and much more. Could you be more specific about what you need?",
        "I'm here to help! I can provide information on weather, news, help with tasks and scheduling, perform calculations, and engage in conversation. What can I do for you?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Build context-aware prompt
function buildPrompt(message, context) {
    let prompt = `You are SkyHi, a futuristic AI assistant with a friendly, helpful personality. You can help with various tasks including scheduling, information gathering, and general conversation.

User's message: ${message}

Please provide a helpful, concise response. If the user is asking about weather, news, tasks, or calculations, mention that you can help with those specific features.`;

    if (context.length > 0) {
        prompt += `\n\nPrevious conversation context:\n${context.map(c => `${c.role}: ${c.content}`).join('\n')}`;
    }

    return prompt;
}

// Premium Features
router.post('/premium/advanced-chat', async (req, res) => {
    try {
        const subscriptionLevel = getUserSubscriptionLevel(req);
        
        if (subscriptionLevel !== 'PREMIUM') {
            return res.status(403).json({ 
                error: 'Premium feature requires subscription',
                upgrade: true,
                message: 'This feature requires a premium subscription. Upgrade to access advanced AI capabilities.'
            });
        }

        const { message, context, features = [] } = req.body;
        
        // Advanced features for premium users
        const response = await handleAdvancedChat(message, context, features);
        
        res.json({
            response: response,
            type: 'premium_conversation',
            service: 'OpenAI GPT-4',
            features: features,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Premium AI chat error:', error);
        res.status(500).json({ error: 'Premium AI service unavailable' });
    }
});

async function handleAdvancedChat(message, context, features) {
    // Advanced prompt engineering for premium users
    let systemPrompt = 'You are SkyHi, an advanced AI assistant with premium capabilities. You have access to:';
    
    if (features.includes('code_generation')) {
        systemPrompt += '\n- Code generation and debugging assistance';
    }
    if (features.includes('creative_writing')) {
        systemPrompt += '\n- Creative writing and content generation';
    }
    if (features.includes('data_analysis')) {
        systemPrompt += '\n- Data analysis and insights';
    }
    if (features.includes('emotional_support')) {
        systemPrompt += '\n- Emotional intelligence and support';
    }
    
    systemPrompt += '\n\nProvide comprehensive, detailed responses with advanced insights.';
    
    const messages = [
        { role: 'system', content: systemPrompt },
        ...context,
        { role: 'user', content: message }
    ];

    const response = await axios.post(
        AI_SERVICES.PREMIUM.endpoint,
        {
            model: 'gpt-4',
            messages: messages,
            max_tokens: 3000,
            temperature: 0.7
        },
        {
            headers: {
                'Authorization': `Bearer ${AI_SERVICES.PREMIUM.apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.choices[0].message.content;
}

// Voice Processing
router.post('/voice/process', async (req, res) => {
    try {
        const { audioData, language = 'en-US' } = req.body;
        
        // In a real implementation, you would process the audio data
        // For now, we'll simulate voice processing
        const mockTranscription = "Hello SkyHi, what's the weather like today?";
        
        res.json({
            transcription: mockTranscription,
            confidence: 0.95,
            language: language,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Voice processing error:', error);
        res.status(500).json({ error: 'Voice processing unavailable' });
    }
});

// Text-to-Speech
router.post('/voice/synthesize', async (req, res) => {
    try {
        const { text, voice = 'en-US-Standard-A', speed = 1.0 } = req.body;
        
        // In a real implementation, you would use Google Cloud TTS or similar
        // For now, we'll return a mock response
        res.json({
            audioUrl: `data:audio/wav;base64,${Buffer.from('mock_audio_data').toString('base64')}`,
            duration: text.length * 0.1, // Rough estimate
            voice: voice,
            speed: speed,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: 'Text-to-speech unavailable' });
    }
});

module.exports = router;