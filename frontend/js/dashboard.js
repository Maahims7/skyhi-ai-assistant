class Dashboard {
    constructor() {
        this.user = null;
        this.chatMessages = [];
        this.chatContext = [];
        this.tasks = [];
        this.weather = null;
        this.news = [];
        this.subscriptionLevel = 'FREE'; // FREE or PREMIUM
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    loadUserData() {
        const userData = localStorage.getItem('skyhi_user');
        if (userData) {
            this.user = JSON.parse(userData);
            this.updateWelcomeMessage();
            this.updateUserAvatar();
        }
    }

    updateWelcomeMessage() {
        const welcomeElement = document.getElementById('welcome-message');
        if (welcomeElement && this.user) {
            welcomeElement.textContent = `Welcome back, ${this.user.name}`;
        }
    }

    updateUserAvatar() {
        const avatarElement = document.getElementById('user-avatar');
        if (avatarElement && this.user) {
            avatarElement.style.backgroundImage = `url(${this.user.avatar})`;
        }
    }

    setupEventListeners() {
        // Chat input
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');
        
        if (chatInput && sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Voice toggle
        const voiceToggle = document.getElementById('voice-toggle');
        if (voiceToggle) {
            voiceToggle.addEventListener('click', () => this.toggleVoice());
        }

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.querySelector('span:last-child').textContent;
                this.handleQuickAction(action);
            });
        });

        // Utility buttons
        document.querySelectorAll('.utility-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const utility = e.currentTarget.textContent.trim();
                this.handleUtility(utility);
            });
        });
    }

    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addChatMessage(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        this.addChatMessage('Thinking...', 'assistant', true);

        try {
            // Check for special commands first
            const specialResponse = await this.handleSpecialCommands(message);
            
            if (specialResponse) {
                // Remove typing indicator
                this.removeTypingIndicator();
                
                // Add special command response
                this.addChatMessage(specialResponse, 'assistant');
                
                // Store conversation context
                this.addToContext('user', message);
                this.addToContext('assistant', specialResponse);
                return;
            }
            
            // Send to AI API
            const response = await fetch('http://localhost:3001/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('skyhi_token')}`
                },
                body: JSON.stringify({ 
                    message,
                    context: this.getChatContext()
                })
            });

            const data = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add AI response
            this.addChatMessage(data.response, 'assistant');
            
            // Store conversation context
            this.addToContext('user', message);
            this.addToContext('assistant', data.response);
            
        } catch (error) {
            console.error('Chat error:', error);
            this.removeTypingIndicator();
            this.addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }
    }

    addChatMessage(message, sender, isTyping = false) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            sender === 'user' 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`;
        
        if (isTyping) {
            messageContent.id = 'typing-indicator';
            messageContent.innerHTML = '<div class="flex space-x-1"><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div></div>';
        } else {
            messageContent.textContent = message;
        }
        
        messageDiv.appendChild(messageContent);
        chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.parentElement.remove();
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        
        if (isDark) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    }

    toggleVoice() {
        if (window.voiceRecognition) {
            window.voiceRecognition.toggle();
        }
    }

    handleQuickAction(action) {
        const message = this.getQuickActionMessage(action);
        if (message) {
            document.getElementById('chat-input').value = message;
            this.sendMessage();
        }
    }

    getQuickActionMessage(action) {
        const messages = {
            'Schedule': 'Show me my schedule for today',
            'Tasks': 'What are my pending tasks?',
            'Weather': 'What\'s the weather like today?',
            'News': 'Show me the latest news'
        };
        return messages[action];
    }

    // Handle special commands
    async handleSpecialCommands(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
            await this.loadWeather();
            return `The current weather is ${this.weather.temperature}°C and ${this.weather.description} in ${this.weather.location}.`;
        }
        
        if (lowerMessage.includes('news') || lowerMessage.includes('latest')) {
            await this.loadNews();
            if (this.news.length > 0) {
                return `Here are the latest news headlines:\n\n${this.news.slice(0, 3).map(article => `• ${article.title}`).join('\n')}`;
            }
        }
        
        if (lowerMessage.includes('joke') || lowerMessage.includes('funny')) {
            try {
                const response = await fetch('http://localhost:3001/api/integrations/jokes');
                const data = await response.json();
                return data.joke;
            } catch (error) {
                return "Why don't scientists trust atoms? Because they make up everything! 😄";
            }
        }
        
        if (lowerMessage.includes('fact') || lowerMessage.includes('interesting')) {
            try {
                const response = await fetch('http://localhost:3001/api/integrations/facts');
                const data = await response.json();
                return `Here's an interesting fact: ${data.fact}`;
            } catch (error) {
                return "Here's an interesting fact: A group of flamingos is called a 'flamboyance'! 🦩";
            }
        }
        
        if (lowerMessage.includes('calculate') || /\d+[\+\-\*\/]\d+/.test(message)) {
            try {
                const mathExpression = message.match(/\d+[\+\-\*\/]\d+/);
                if (mathExpression) {
                    const response = await fetch('http://localhost:3001/api/integrations/calculator', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ expression: mathExpression[0] })
                    });
                    const data = await response.json();
                    return `The result of ${data.expression} is ${data.result}`;
                }
            } catch (error) {
                return "I can help with calculations! Try asking me to calculate something like '25 * 4' or '100 + 50'.";
            }
        }
        
        return null; // No special command handled
    }

    handleUtility(utility) {
        const message = this.getUtilityMessage(utility);
        if (message) {
            document.getElementById('chat-input').value = message;
            this.sendMessage();
        }
    }

    getUtilityMessage(utility) {
        const messages = {
            'Calculator': 'Open calculator',
            'Converter': 'Open unit converter',
            'Speed Test': 'Run internet speed test',
            'Music': 'Play some music'
        };
        return messages[utility];
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadTasks(),
            this.loadWeather(),
            this.loadNews()
        ]);
    }

    async loadTasks() {
        try {
            const response = await fetch('http://localhost:3001/api/tasks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('skyhi_token')}`
                }
            });
            const tasks = await response.json();
            this.tasks = tasks;
            this.updateTasksWidget();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    async loadWeather() {
        try {
            const response = await fetch('http://localhost:3001/api/integrations/weather');
            const weather = await response.json();
            this.weather = weather;
            this.updateWeatherWidget();
        } catch (error) {
            console.error('Error loading weather:', error);
        }
    }

    async loadNews() {
        try {
            const response = await fetch('http://localhost:3001/api/integrations/news');
            const news = await response.json();
            this.news = news;
            this.updateNewsWidget();
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }

    updateTasksWidget() {
        const tasksList = document.getElementById('tasks-list');
        if (!tasksList) return;

        if (this.tasks.length === 0) {
            tasksList.innerHTML = '<p class="text-gray-400 text-sm">No tasks yet</p>';
            return;
        }

        tasksList.innerHTML = this.tasks.slice(0, 3).map(task => `
            <div class="flex items-center gap-2 text-sm">
                <input type="checkbox" ${task.completed ? 'checked' : ''} class="rounded">
                <span class="${task.completed ? 'line-through text-gray-400' : 'text-white'}">${task.title}</span>
            </div>
        `).join('');
    }

    updateWeatherWidget() {
        const weatherWidget = document.getElementById('weather-widget');
        if (!weatherWidget || !this.weather) return;

        weatherWidget.innerHTML = `
            <div class="text-center">
                <div class="flex items-center justify-center mb-2">
                    <span class="material-symbols-outlined text-2xl text-yellow-400 mr-2">wb_sunny</span>
                    <div class="text-2xl font-bold text-white">${this.weather.temperature}°C</div>
                </div>
                <div class="text-sm text-gray-400 capitalize">${this.weather.description}</div>
                <div class="text-xs text-gray-500 mt-1">${this.weather.location}, ${this.weather.country}</div>
                <div class="flex justify-between text-xs text-gray-500 mt-2">
                    <span>💧 ${this.weather.humidity}%</span>
                    <span>💨 ${this.weather.windSpeed} m/s</span>
                </div>
            </div>
        `;
    }

    updateNewsWidget() {
        const newsWidget = document.getElementById('news-widget');
        if (!newsWidget) return;

        if (this.news.length === 0) {
            newsWidget.innerHTML = '<p class="text-gray-400 text-sm">No news available</p>';
            return;
        }

        newsWidget.innerHTML = this.news.slice(0, 3).map(article => `
            <div class="text-sm">
                <a href="${article.url}" target="_blank" class="text-primary hover:underline">
                    ${article.title}
                </a>
                <div class="text-xs text-gray-500 mt-1">${article.source}</div>
            </div>
        `).join('');
    }

    loginUser(user) {
        this.user = user;
        this.updateWelcomeMessage();
        this.updateUserAvatar();
        
        // Hide login screen and show dashboard
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Load dashboard data
        this.loadDashboardData();
        
        // Add welcome message
        setTimeout(() => {
            this.addChatMessage(`Welcome back, ${user.name}! I'm SkyHi, your AI assistant. I can help you with weather, news, calculations, jokes, and much more. What can I do for you today?`, 'assistant');
        }, 1000);
    }

    // Context management for AI conversations
    getChatContext() {
        return this.chatContext.slice(-10); // Keep last 10 messages for context
    }

    addToContext(role, content) {
        this.chatContext.push({ role, content });
        
        // Limit context size to prevent memory issues
        if (this.chatContext.length > 20) {
            this.chatContext = this.chatContext.slice(-20);
        }
    }

    // Premium features
    async usePremiumFeature(feature, data) {
        if (this.subscriptionLevel !== 'PREMIUM') {
            this.showUpgradePrompt(feature);
            return null;
        }

        try {
            const response = await fetch('http://localhost:3001/api/ai/premium/advanced-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('skyhi_token')}`
                },
                body: JSON.stringify({
                    message: data.message,
                    context: this.getChatContext(),
                    features: [feature]
                })
            });

            if (response.status === 403) {
                this.showUpgradePrompt(feature);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Premium feature error:', error);
            return null;
        }
    }

    showUpgradePrompt(feature) {
        const upgradeMessage = `This feature (${feature}) requires a premium subscription. Upgrade to access advanced AI capabilities, code generation, creative writing, and more!`;
        this.addChatMessage(upgradeMessage, 'assistant');
        
        // Add upgrade button
        const chatContainer = document.getElementById('chat-messages');
        const upgradeDiv = document.createElement('div');
        upgradeDiv.className = 'flex justify-start';
        upgradeDiv.innerHTML = `
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <p class="text-sm mb-2">🚀 Upgrade to Premium</p>
                <button onclick="window.dashboard.upgradeToPremium()" class="bg-white text-purple-600 px-3 py-1 rounded text-sm font-bold hover:bg-gray-100 transition-colors">
                    Upgrade Now
                </button>
            </div>
        `;
        chatContainer.appendChild(upgradeDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    upgradeToPremium() {
        // In a real app, this would redirect to payment page
        this.subscriptionLevel = 'PREMIUM';
        this.addChatMessage('🎉 Welcome to SkyHi Premium! You now have access to advanced AI features, code generation, creative writing, and much more!', 'assistant');
    }

    // Advanced features
    async generateCode(prompt) {
        return await this.usePremiumFeature('code_generation', { message: `Generate code for: ${prompt}` });
    }

    async creativeWriting(prompt) {
        return await this.usePremiumFeature('creative_writing', { message: `Write creatively about: ${prompt}` });
    }

    async analyzeData(data) {
        return await this.usePremiumFeature('data_analysis', { message: `Analyze this data: ${data}` });
    }

    async emotionalSupport(message) {
        return await this.usePremiumFeature('emotional_support', { message });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
