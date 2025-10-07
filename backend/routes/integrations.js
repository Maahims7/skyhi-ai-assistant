const express = require('express');
const axios = require('axios');
const router = express.Router();

// API Keys (in production, these should be in environment variables)
const API_KEYS = {
    OPENWEATHER: process.env.OPENWEATHER_API_KEY,
    NEWSAPI: process.env.NEWS_API_KEY || '74954ef9723e4f1297420b35f878d5b2',
    IPGEOLOCATION: process.env.IPGEOLOCATION_API_KEY
};

// Weather API
router.get('/weather', async (req, res) => {
    try {
        const { city = 'London', units = 'metric' } = req.query;
        
        if (API_KEYS.OPENWEATHER) {
            // Real weather data from OpenWeatherMap
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEYS.OPENWEATHER}&units=${units}`
            );
            
            const weather = {
                temperature: Math.round(response.data.main.temp),
                description: response.data.weather[0].description,
                humidity: response.data.main.humidity,
                windSpeed: response.data.wind.speed,
                location: response.data.name,
                country: response.data.sys.country,
                icon: response.data.weather[0].icon,
                feelsLike: Math.round(response.data.main.feels_like),
                pressure: response.data.main.pressure,
                visibility: response.data.visibility / 1000, // Convert to km
                timestamp: new Date().toISOString()
            };
            
            res.json(weather);
        } else {
            // Mock weather data when API key is not available
        const mockWeather = {
            temperature: 25,
            description: "Sunny",
            humidity: 65,
                windSpeed: 12,
                location: city,
                country: "Demo",
                icon: "01d",
                feelsLike: 27,
                pressure: 1013,
                visibility: 10,
                timestamp: new Date().toISOString()
        };

        res.json(mockWeather);
        }
    } catch (error) {
        console.error('Weather API error:', error);
        
        // Fallback to mock data
        const fallbackWeather = {
            temperature: 22,
            description: "Partly Cloudy",
            humidity: 60,
            windSpeed: 8,
            location: "Demo City",
            country: "Demo",
            icon: "02d",
            feelsLike: 24,
            pressure: 1013,
            visibility: 10,
            timestamp: new Date().toISOString()
        };
        
        res.json(fallbackWeather);
    }
});

// News API
router.get('/news', async (req, res) => {
    try {
        const { category = 'general', country = 'us', pageSize = 10, q } = req.query;
        
        if (API_KEYS.NEWSAPI) {
            // Real news data from NewsAPI
            let url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${API_KEYS.NEWSAPI}`;
            
            // If search query is provided, use everything endpoint
            if (q) {
                url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${API_KEYS.NEWSAPI}`;
            }
            
            const response = await axios.get(url);
            
            const news = response.data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source.name,
                author: article.author,
                content: article.content
            }));
            
            res.json({
                articles: news,
                totalResults: response.data.totalResults,
                status: response.data.status,
                source: 'NewsAPI',
                timestamp: new Date().toISOString()
            });
        } else {
            // Mock news data
            const mockNews = [
                {
                    title: "SkyHi AI Assistant Launches Revolutionary Features",
                    description: "The new AI assistant introduces advanced voice recognition and face authentication capabilities.",
                    url: "https://example.com/news1",
                    urlToImage: "https://via.placeholder.com/300x200?text=AI+News",
                    publishedAt: new Date().toISOString(),
                    source: "Tech News",
                    author: "AI Reporter",
                    content: "SkyHi AI Assistant has launched with revolutionary features including voice recognition, face authentication, and advanced AI capabilities."
                },
                {
                    title: "Weather Technology Advances with AI Integration",
                    description: "New weather prediction models using artificial intelligence show improved accuracy.",
                    url: "https://example.com/news2",
                    urlToImage: "https://via.placeholder.com/300x200?text=Weather+Tech",
                    publishedAt: new Date(Date.now() - 3600000).toISOString(),
                    source: "Weather Today",
                    author: "Weather Expert",
                    content: "Weather technology has advanced significantly with AI integration, providing more accurate predictions and better user experiences."
                },
                {
                    title: "Voice Recognition Technology Reaches New Heights",
                    description: "Latest developments in voice processing enable more natural human-AI interactions.",
                    url: "https://example.com/news3",
                    urlToImage: "https://via.placeholder.com/300x200?text=Voice+Tech",
                    publishedAt: new Date(Date.now() - 7200000).toISOString(),
                    source: "Voice Tech Weekly",
                    author: "Voice Specialist",
                    content: "Voice recognition technology has reached new heights, enabling more natural and intuitive human-AI interactions."
                }
            ];
            
            res.json({
                articles: mockNews,
                totalResults: mockNews.length,
                status: "ok",
                source: "Mock Data",
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('News API error:', error);
        
        // Enhanced error handling
        if (error.response && error.response.status === 429) {
            res.status(429).json({ 
                error: 'News API rate limit exceeded. Please try again later.',
                retryAfter: '1 hour'
            });
        } else if (error.response && error.response.status === 401) {
            res.status(401).json({ 
                error: 'News API key is invalid or expired.',
                suggestion: 'Please check your API key configuration.'
            });
        } else {
            res.status(500).json({ 
                error: 'News service temporarily unavailable',
                fallback: 'Using mock data'
            });
        }
    }
});

// News Search API
router.get('/news/search', async (req, res) => {
    try {
        const { q, language = 'en', sortBy = 'publishedAt', pageSize = 10 } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Search query (q) is required' });
        }
        
        if (API_KEYS.NEWSAPI) {
            const response = await axios.get(
                `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${language}&sortBy=${sortBy}&pageSize=${pageSize}&apiKey=${API_KEYS.NEWSAPI}`
            );
            
            const news = response.data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source.name,
                author: article.author,
                content: article.content
            }));
            
            res.json({
                articles: news,
                totalResults: response.data.totalResults,
                status: response.data.status,
                query: q,
                source: 'NewsAPI Search',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({ 
                error: 'News API key not configured',
                suggestion: 'Please configure your News API key'
            });
        }
    } catch (error) {
        console.error('News search error:', error);
        res.status(500).json({ error: 'News search service unavailable' });
    }
});

// Calculator API
router.post('/calculator', async (req, res) => {
    try {
        const { expression } = req.body;
        
        if (!expression) {
            return res.status(400).json({ error: 'Expression is required' });
        }
        
        // Simple calculator - in production, use a proper math parser
        const result = evaluateExpression(expression);
        
        res.json({
            expression: expression,
            result: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Calculator error:', error);
        res.status(400).json({ error: 'Invalid expression' });
    }
});

// Currency Converter API
router.get('/currency', async (req, res) => {
    try {
        const { from = 'USD', to = 'EUR', amount = 1 } = req.query;
        
        // Mock currency conversion - in production, use a real currency API
        const exchangeRates = {
            'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'INR': 75 },
            'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129, 'INR': 88 },
            'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 150, 'INR': 102 },
            'JPY': { 'USD': 0.009, 'EUR': 0.008, 'GBP': 0.007, 'INR': 0.68 },
            'INR': { 'USD': 0.013, 'EUR': 0.011, 'GBP': 0.010, 'JPY': 1.47 }
        };
        
        const rate = exchangeRates[from]?.[to] || 1;
        const convertedAmount = (amount * rate).toFixed(2);
        
        res.json({
            from: from,
            to: to,
            amount: parseFloat(amount),
            convertedAmount: parseFloat(convertedAmount),
            rate: rate,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Currency conversion error:', error);
        res.status(500).json({ error: 'Currency service unavailable' });
    }
});

// Internet Speed Test (Mock)
router.get('/speedtest', async (req, res) => {
    try {
        // Simulate speed test
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const speedTest = {
            download: Math.floor(Math.random() * 100) + 50, // 50-150 Mbps
            upload: Math.floor(Math.random() * 50) + 25,    // 25-75 Mbps
            ping: Math.floor(Math.random() * 50) + 10,      // 10-60 ms
            server: 'Speed Test Server #1',
            timestamp: new Date().toISOString()
        };
        
        res.json(speedTest);
    } catch (error) {
        console.error('Speed test error:', error);
        res.status(500).json({ error: 'Speed test unavailable' });
    }
});

// Jokes API
router.get('/jokes', async (req, res) => {
    try {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Why did the scarecrow win an award? He was outstanding in his field!",
            "Why don't eggs tell jokes? They'd crack each other up!",
            "What do you call a fake noodle? An impasta!",
            "Why did the math book look so sad? Because it had too many problems!",
            "What do you call a bear with no teeth? A gummy bear!",
            "Why don't skeletons fight each other? They don't have the guts!",
            "What do you call a fish wearing a bowtie? So-fish-ticated!",
            "Why did the coffee file a police report? It got mugged!",
            "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!"
        ];
        
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        
        res.json({
            joke: randomJoke,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Jokes API error:', error);
        res.status(500).json({ error: 'Jokes service unavailable' });
    }
});

// Fun Facts API
router.get('/facts', async (req, res) => {
    try {
        const facts = [
            "A group of flamingos is called a 'flamboyance'.",
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3000 years old and still perfectly edible.",
            "Octopuses have three hearts and blue blood.",
            "A single cloud can weigh more than a million pounds.",
            "Bananas are berries, but strawberries aren't.",
            "The human brain contains approximately 86 billion neurons.",
            "There are more possible games of chess than there are atoms in the observable universe.",
            "A jiffy is an actual unit of time - it's 1/100th of a second.",
            "Wombat poop is cube-shaped.",
            "The shortest war in history lasted only 38-45 minutes."
        ];
        
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        
        res.json({
            fact: randomFact,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Facts API error:', error);
        res.status(500).json({ error: 'Facts service unavailable' });
    }
});

// Helper function for calculator
function evaluateExpression(expression) {
    try {
        // Remove any potentially dangerous characters
        const cleanExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
        
        // Use Function constructor for safe evaluation
        return Function('"use strict"; return (' + cleanExpression + ')')();
    } catch (error) {
        throw new Error('Invalid mathematical expression');
    }
}

module.exports = router;