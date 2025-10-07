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
                    context: this.getChatContext(),
                    mode: message.toLowerCase().includes('pro:') ? 'pro' : 'normal'
                })
            });

            const data = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Handle new response format
            if (data.speak && data.text) {
                this.addChatMessage(data.text, 'assistant');
                
                // Use TTS for voice response
                if (window.speechSynthesis) {
                    this.speakResponse(data.speak);
                }
            } else {
                // Fallback for old format
                this.addChatMessage(data.response || data.text, 'assistant');
            }
            
            // Store conversation context
            this.addToContext('user', message);
            this.addToContext('assistant', data.text || data.response);
            
            // Execute any actions
            if (data.action) {
                await this.executeAction(data.action, data.data);
            }
            
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
            'System Info': 'Show me system information',
            'Schedule': 'Show me my schedule for today',
            'Weather': 'What\'s the weather like today?',
            'Web Search': 'Search for artificial intelligence',
            'Clipboard': 'Read clipboard contents',
            'Screenshot': 'Take a screenshot'
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
            const data = await response.json();
            
            // Handle new API format
            if (data.articles) {
                this.news = data.articles;
            } else {
                // Fallback for old format
                this.news = data;
            }
            
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

    // Text-to-Speech functionality
    speakResponse(text) {
        if (window.speechSynthesis) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            // Try to use a more natural voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => 
                voice.name.includes('Google') || 
                voice.name.includes('Microsoft') ||
                voice.lang.startsWith('en')
            );
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        }
    }

    // Action execution
    async executeAction(action, data) {
        switch (action.type) {
            case 'open_app':
                await this.openApplication(action.target, data);
                break;
            case 'system_info':
                await this.getSystemInfo();
                break;
            case 'create_file':
                await this.createFile(action.target, data);
                break;
            case 'read_clipboard':
                await this.readClipboard();
                break;
            case 'screenshot':
                await this.takeScreenshot();
                break;
            case 'time_info':
                await this.getTimeInfo();
                break;
            case 'set_alarm':
                await this.setAlarm(action.target, data);
                break;
            case 'web_search':
                await this.webSearch(action.target, data);
                break;
            case 'compose_email':
                await this.composeEmail();
                break;
            case 'calendar_action':
                await this.calendarAction();
                break;
            case 'music_control':
                await this.musicControl(action.target, data);
                break;
            case 'fetch_news':
                await this.loadNews();
                break;
            case 'fetch_weather':
                await this.loadWeather();
                break;
            case 'fetch_schedule':
                await this.loadSchedule();
                break;
            case 'fetch_tasks':
                await this.loadTasks();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    // Application opening functionality
    async openApplication(appName, data) {
        this.addChatMessage(`Opening ${appName}...`, 'assistant');
        
        // In a real implementation, this would use system APIs
        // For now, we'll simulate the action
        setTimeout(() => {
            this.addChatMessage(`${appName} has been launched successfully.`, 'assistant');
        }, 1000);
    }

    // Additional data loading methods
    async loadSchedule() {
        try {
            const response = await fetch('http://localhost:3001/api/schedule', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('skyhi_token')}`
                }
            });
            const schedule = await response.json();
            this.addChatMessage(`Your schedule: ${JSON.stringify(schedule)}`, 'assistant');
        } catch (error) {
            this.addChatMessage('Unable to load schedule at this time.', 'assistant');
        }
    }

    // JARVIS-style System Control Features
    async getSystemInfo() {
        const systemInfo = {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            memory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown',
            cores: navigator.hardwareConcurrency || 'Unknown',
            online: navigator.onLine ? 'Online' : 'Offline',
            battery: await this.getBatteryInfo()
        };

        const infoText = `🖥️ **System Information:**
• Platform: ${systemInfo.platform}
• Language: ${systemInfo.language}
• Timezone: ${systemInfo.timezone}
• Screen: ${systemInfo.screenResolution}
• Memory: ${systemInfo.memory}
• CPU Cores: ${systemInfo.cores}
• Status: ${systemInfo.online}
• Battery: ${systemInfo.battery}`;

        this.addChatMessage(infoText, 'assistant');
    }

    async getBatteryInfo() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return `${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Not charging'})`;
            } catch (error) {
                return 'Unknown';
            }
        }
        return 'Not available';
    }

    async createFile(fileName, data) {
        try {
            const blob = new Blob(['Created by SkyHi AI Assistant'], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.addChatMessage(`✅ File "${fileName}" created and downloaded successfully!`, 'assistant');
        } catch (error) {
            this.addChatMessage(`❌ Failed to create file "${fileName}". ${error.message}`, 'assistant');
        }
    }

    async readClipboard() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text) {
                    this.addChatMessage(`📋 **Clipboard Contents:**\n\n${text}`, 'assistant');
                } else {
                    this.addChatMessage('📋 Clipboard is empty.', 'assistant');
                }
            } else {
                this.addChatMessage('📋 Clipboard access not available in this browser.', 'assistant');
            }
        } catch (error) {
            this.addChatMessage(`❌ Failed to read clipboard: ${error.message}`, 'assistant');
        }
    }

    async takeScreenshot() {
        try {
            this.addChatMessage('📸 Screenshot feature requires html2canvas library. Taking screenshot simulation...', 'assistant');
            setTimeout(() => {
                this.addChatMessage('📸 Screenshot simulation completed! (In a real implementation, this would capture the screen)', 'assistant');
            }, 1000);
        } catch (error) {
            this.addChatMessage(`❌ Failed to take screenshot: ${error.message}`, 'assistant');
        }
    }

    async getTimeInfo() {
        const now = new Date();
        const timeInfo = {
            time: now.toLocaleTimeString(),
            date: now.toLocaleDateString(),
            day: now.toLocaleDateString('en-US', { weekday: 'long' }),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: now.toISOString()
        };

        const timeText = `🕐 **Current Time & Date:**
• Time: ${timeInfo.time}
• Date: ${timeInfo.date}
• Day: ${timeInfo.day}
• Timezone: ${timeInfo.timezone}
• Timestamp: ${timeInfo.timestamp}`;

        this.addChatMessage(timeText, 'assistant');
    }

    async setAlarm(timeInfo, data) {
        try {
            const alarmText = `⏰ **Alarm Set:**
• Time: ${timeInfo}
• Status: Active
• Note: This is a simulation. In a real implementation, this would set an actual system alarm.`;

            this.addChatMessage(alarmText, 'assistant');

            const alarms = JSON.parse(localStorage.getItem('skyhi_alarms') || '[]');
            alarms.push({
                id: Date.now(),
                time: timeInfo,
                created: new Date().toISOString(),
                active: true
            });
            localStorage.setItem('skyhi_alarms', JSON.stringify(alarms));

        } catch (error) {
            this.addChatMessage(`❌ Failed to set alarm: ${error.message}`, 'assistant');
        }
    }

    async webSearch(query, data) {
        try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');

            this.addChatMessage(`🔍 **Web Search:**\n\nSearching for "${query}" in Google...\n\n[Search opened in new tab]`, 'assistant');
        } catch (error) {
            this.addChatMessage(`❌ Failed to perform web search: ${error.message}`, 'assistant');
        }
    }

    async composeEmail() {
        try {
            const emailUrl = `mailto:?subject=&body=`;
            window.open(emailUrl);

            this.addChatMessage(`📧 **Email Composer:**\n\nOpening default email client...`, 'assistant');
        } catch (error) {
            this.addChatMessage(`❌ Failed to open email composer: ${error.message}`, 'assistant');
        }
    }

    async calendarAction() {
        try {
            const calendarUrl = 'https://calendar.google.com/calendar/';
            window.open(calendarUrl, '_blank');

            this.addChatMessage(`📅 **Calendar:**\n\nOpening Google Calendar in new tab...`, 'assistant');
        } catch (error) {
            this.addChatMessage(`❌ Failed to open calendar: ${error.message}`, 'assistant');
        }
    }

    async musicControl(action, data) {
        try {
            const actionText = {
                'play': '▶️ Playing music',
                'pause': '⏸️ Pausing music',
                'next': '⏭️ Next song'
            };

            this.addChatMessage(`🎵 **Music Control:**\n\n${actionText[action] || 'Music control activated'}`, 'assistant');

            setTimeout(() => {
                this.addChatMessage(`🎵 Music control simulation: ${action} command executed!`, 'assistant');
            }, 1000);

        } catch (error) {
            this.addChatMessage(`❌ Failed to control music: ${error.message}`, 'assistant');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
