const express = require('express');
const axios = require('axios');
const router = express.Router();

// AI Service Configuration
const AI_SERVICES = {
    FREE: {
        name: 'Google Gemini 1.5 Flash',
        apiKey: process.env.GEMINI_API_KEY || 'AIzaSyC5ttzIJuJmjFGaWc2xh28A6xet7UYrhs4',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        maxTokens: 2000
    },
    PREMIUM: {
        name: 'Google Gemini 1.5 Flash Pro',
        apiKey: process.env.GEMINI_API_KEY || 'AIzaSyC5ttzIJuJmjFGaWc2xh28A6xet7UYrhs4',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        maxTokens: 4000
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
        const { message, context = [], mode = 'normal' } = req.body;
        const subscriptionLevel = getUserSubscriptionLevel(req);
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Processing chat with ${subscriptionLevel} AI service in ${mode} mode...`);

        // Check for Pro Chat Mode activation
        const isProMode = message.toLowerCase().includes('pro:') || message.toLowerCase().includes('switch to pro') || mode === 'pro';
        
        let response;
        let action = null;
        let data = null;
        
        if (isProMode) {
            response = await handleProChat(message, context);
        } else {
            response = await handleGeminiChat(message, context);
        }

        // Parse response for actions and generate proper format
        const parsedResponse = parseAIResponse(response, message);
        
        res.json({
            speak: parsedResponse.speak,
            text: parsedResponse.text,
            action: parsedResponse.action,
            data: parsedResponse.data,
            type: isProMode ? 'pro_conversation' : 'conversation',
            service: isProMode ? 'Google Gemini 1.5 Flash Pro' : 'Google Gemini 1.5 Flash',
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
            speak: "I'm having some trouble right now.",
            text: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
            action: null,
            data: null,
            type: 'conversation',
            service: 'Fallback',
            timestamp: new Date().toISOString()
        });
    }
});

// Google Gemini 2.5 Flash API Integration
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
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40
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
    
    // Greetings with time-based responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) {
            greeting = 'Good morning';
        } else if (hour < 17) {
            greeting = 'Good afternoon';
        } else {
            greeting = 'Good evening';
        }
        
        const responses = [
            `${greeting}! I'm SkyHi, your AI assistant. I'm here to help you with various tasks including scheduling, information gathering, calculations, and much more. What can I do for you today?`,
            `${greeting}! SkyHi at your service. I can help with system control, web searches, file operations, and much more. How may I assist you?`,
            `${greeting}! Welcome back. I'm ready to help with productivity tasks, system information, and intelligent assistance. What would you like to do?`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('commands')) {
        return "I'm SkyHi, your comprehensive JARVIS-style AI assistant! Here's what I can do:\n\n🎤 **Voice Commands**: Say 'Hey SkyHi', 'Jarvis', or 'Activate SkyHi'\n💬 **Dual Chat Modes**: Normal chat or 'pro:' for advanced reasoning\n\n🖥️ **System Control**:\n• 'Open [application]' - Launch applications\n• 'System info' - Get computer status\n• 'Create file [name]' - Create new files\n• 'Read clipboard' - Read clipboard contents\n• 'Screenshot' - Capture screen\n• 'What time is it?' - Get current time\n• 'Set alarm [time]' - Set reminders\n\n🌐 **Web & Communication**:\n• 'Search for [query]' - Web search\n• 'Send email' - Open email composer\n• 'Calendar' - Access calendar\n• 'Play music' - Control music\n\n📊 **Information & Tools**:\n• Weather information\n• Latest news\n• Calculator and conversions\n• Jokes and facts\n• Task management\n\n🚀 **Pro Mode**: Type 'pro:' for advanced features like code generation, creative writing, and data analysis!\n\nTry saying: 'Hey SkyHi, what's the weather?' or 'pro: generate a Python function'";
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

// Pro Chat Mode Handler (Gemini 2.5 Flash)
async function handleProChat(message, context) {
    try {
        if (!AI_SERVICES.PREMIUM.apiKey) {
            return generateProRuleBasedResponse(message);
        }

        const prompt = buildProPrompt(message, context);
        
        const response = await axios.post(
            `${AI_SERVICES.PREMIUM.endpoint}?key=${AI_SERVICES.PREMIUM.apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 4000,
                    temperature: 0.8,
                    topP: 0.9,
                    topK: 40
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
        console.error('Pro Chat API error:', error);
        return generateProRuleBasedResponse(message);
    }
}

// Parse AI response to extract actions and format properly
function parseAIResponse(response, originalMessage) {
    const lowerMessage = originalMessage.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    // Extract speak and text parts
    let speak = '';
    let text = response;
    let action = null;
    let data = null;
    
    // Check for system actions
    if (lowerMessage.includes('open') || lowerMessage.includes('launch')) {
        const appMatch = originalMessage.match(/open\s+(.+)|launch\s+(.+)/i);
        if (appMatch) {
            const appName = appMatch[1] || appMatch[2];
            action = {
                type: 'open_app',
                target: appName.trim()
            };
            data = { appName: appName.trim() };
            speak = `Opening ${appName.trim()} now.`;
        }
    }
    
    // Check for system info requests
    if (lowerMessage.includes('system info') || lowerMessage.includes('computer status') || lowerMessage.includes('system status')) {
        action = {
            type: 'system_info',
            target: 'system'
        };
        speak = "Checking system status.";
    }
    
    // Check for file operations
    if (lowerMessage.includes('create file') || lowerMessage.includes('new file')) {
        const fileMatch = originalMessage.match(/create file\s+(.+)|new file\s+(.+)/i);
        if (fileMatch) {
            const fileName = fileMatch[1] || fileMatch[2];
            action = {
                type: 'create_file',
                target: fileName.trim()
            };
            data = { fileName: fileName.trim() };
            speak = `Creating file ${fileName.trim()}.`;
        }
    }
    
    // Check for clipboard operations
    if (lowerMessage.includes('read clipboard') || lowerMessage.includes('what\'s in clipboard')) {
        action = {
            type: 'read_clipboard',
            target: 'clipboard'
        };
        speak = "Reading clipboard contents.";
    }
    
    // Check for screenshot requests
    if (lowerMessage.includes('screenshot') || lowerMessage.includes('capture screen')) {
        action = {
            type: 'screenshot',
            target: 'screen'
        };
        speak = "Taking screenshot.";
    }
    
    // Check for time/date requests
    if (lowerMessage.includes('what time') || lowerMessage.includes('current time') || lowerMessage.includes('what date')) {
        action = {
            type: 'time_info',
            target: 'datetime'
        };
        speak = "Getting current time and date.";
    }
    
    // Check for alarm/reminder requests
    if (lowerMessage.includes('set alarm') || lowerMessage.includes('remind me') || lowerMessage.includes('timer')) {
        const timeMatch = originalMessage.match(/set alarm\s+(.+)|remind me\s+(.+)|timer\s+(.+)/i);
        if (timeMatch) {
            const timeInfo = timeMatch[1] || timeMatch[2] || timeMatch[3];
            action = {
                type: 'set_alarm',
                target: timeInfo.trim()
            };
            data = { timeInfo: timeInfo.trim() };
            speak = `Setting alarm for ${timeInfo.trim()}.`;
        }
    }
    
    // Check for web search requests
    if (lowerMessage.includes('search for') || lowerMessage.includes('google') || lowerMessage.includes('look up')) {
        const searchMatch = originalMessage.match(/search for\s+(.+)|google\s+(.+)|look up\s+(.+)/i);
        if (searchMatch) {
            const searchQuery = searchMatch[1] || searchMatch[2] || searchMatch[3];
            action = {
                type: 'web_search',
                target: searchQuery.trim()
            };
            data = { query: searchQuery.trim() };
            speak = `Searching for ${searchQuery.trim()}.`;
        }
    }
    
    // Check for email requests
    if (lowerMessage.includes('send email') || lowerMessage.includes('compose email')) {
        action = {
            type: 'compose_email',
            target: 'email'
        };
        speak = "Opening email composer.";
    }
    
    // Check for calendar requests
    if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar') || lowerMessage.includes('meeting')) {
        action = {
            type: 'calendar_action',
            target: 'calendar'
        };
        speak = "Accessing calendar.";
    }
    
    // Check for music control
    if (lowerMessage.includes('play music') || lowerMessage.includes('pause music') || lowerMessage.includes('next song')) {
        const musicAction = lowerMessage.includes('play') ? 'play' : lowerMessage.includes('pause') ? 'pause' : 'next';
        action = {
            type: 'music_control',
            target: musicAction
        };
        data = { action: musicAction };
        speak = `${musicAction.charAt(0).toUpperCase() + musicAction.slice(1)}ing music.`;
    }
    
    // Check for news requests
    if (lowerMessage.includes('news') || lowerMessage.includes('latest')) {
        // Check if it's a specific news search
        const newsSearchMatch = originalMessage.match(/news about\s+(.+)|latest news on\s+(.+)|search news for\s+(.+)/i);
        if (newsSearchMatch) {
            const searchQuery = newsSearchMatch[1] || newsSearchMatch[2] || newsSearchMatch[3];
            action = {
                type: 'search_news',
                target: searchQuery.trim()
            };
            data = { query: searchQuery.trim() };
            speak = `Searching for news about ${searchQuery.trim()}.`;
        } else {
            action = {
                type: 'fetch_news',
                target: 'news'
            };
            speak = "Fetching the latest news for you.";
        }
    }
    
    // Check for weather requests
    if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
        action = {
            type: 'fetch_weather',
            target: 'weather'
        };
        speak = "Getting weather information.";
    }
    
    // Check for schedule requests
    if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
        action = {
            type: 'fetch_schedule',
            target: 'schedule'
        };
        speak = "Checking your schedule.";
    }
    
    // Check for task requests
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
        action = {
            type: 'fetch_tasks',
            target: 'tasks'
        };
        speak = "Loading your tasks.";
    }
    
    // Generate speak text if not set
    if (!speak) {
        // Extract first sentence or create short version
        const sentences = response.split(/[.!?]+/);
        speak = sentences[0] ? sentences[0].trim() : response.substring(0, 50) + '...';
        
        // Limit to 20 words for TTS
        const words = speak.split(' ');
        if (words.length > 20) {
            speak = words.slice(0, 20).join(' ') + '...';
        }
    }
    
    return {
        speak: speak,
        text: text,
        action: action,
        data: data
    };
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

// Build Pro Chat prompt for advanced reasoning
function buildProPrompt(message, context) {
    let prompt = `You are SkyHi, an advanced AI assistant powered by Gemini 2.5 Flash with exceptional reasoning capabilities. You excel at:

🧠 **Advanced Intelligence:**
- Complex code generation and debugging across multiple languages
- Creative writing, storytelling, and content generation
- Data analysis, pattern recognition, and business insights
- Technical documentation and architectural design
- Research synthesis and comprehensive summarization
- Problem-solving with step-by-step reasoning

🎯 **Your Approach:**
- Provide detailed, structured responses
- Use clear explanations and examples
- Break down complex problems into manageable steps
- Offer multiple perspectives and solutions
- Be thorough yet concise
- Maintain professional, helpful tone

User's request: ${message}

Provide a comprehensive response that demonstrates advanced AI capabilities. Structure your answer clearly and include relevant examples or code when appropriate.`;

    if (context.length > 0) {
        prompt += `\n\n📚 **Conversation Context:**\n${context.map(c => `${c.role}: ${c.content}`).join('\n')}`;
    }

    return prompt;
}

// Pro Chat rule-based responses
function generateProRuleBasedResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
        return `I can help you with code generation and debugging! I can write code in multiple languages, explain complex algorithms, debug issues, and provide best practices. What specific programming task would you like help with?`;
    }
    
    if (lowerMessage.includes('write') || lowerMessage.includes('creative')) {
        return `I excel at creative writing and content generation! I can help with stories, articles, marketing copy, technical documentation, and more. What type of content would you like me to create?`;
    }
    
    if (lowerMessage.includes('analyze') || lowerMessage.includes('data')) {
        return `I can perform comprehensive data analysis and provide insights! I can help interpret data, identify patterns, create visualizations, and draw meaningful conclusions. What data would you like me to analyze?`;
    }
    
    return `I'm SkyHi in Pro Mode, ready to provide advanced assistance with deep reasoning, code generation, creative writing, data analysis, and complex problem solving. How can I help you today?`;
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