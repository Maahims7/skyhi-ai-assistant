class SkyHiApp {
    constructor() {
        this.currentUser = null;
        this.isListening = false;
        this.voiceRecognition = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initParticles();
        this.checkAuthentication();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Voice toggle
        document.getElementById('voice-toggle').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        // Chat input
        document.getElementById('send-message').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('button').querySelector('span:last-child').textContent;
                this.handleQuickAction(action);
            });
        });

        // Utilities
        document.querySelectorAll('.utility-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const utility = e.target.textContent;
                this.handleUtility(utility);
            });
        });
    }

    async checkAuthentication() {
        const token = localStorage.getItem('skyhi_token');
        if (token) {
            try {
                const user = await this.verifyToken(token);
                this.loginUser(user);
            } catch (error) {
                this.showLoginScreen();
            }
        } else {
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }

    loginUser(user) {
        this.currentUser = user;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('welcome-message').textContent = `Welcome back, ${user.name}`;
        document.getElementById('user-avatar').style.backgroundImage = `url('${user.avatar}')`;

        // Initialize dashboard components
        this.loadDashboardData();
    }

    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        html.classList.toggle('dark', !isDark);
        localStorage.setItem('skyhi_theme', isDark ? 'light' : 'dark');
    }

    async toggleVoiceRecognition() {
        if (!this.isListening) {
            await this.startVoiceRecognition();
        } else {
            this.stopVoiceRecognition();
        }
    }

    async startVoiceRecognition() {
        try {
            this.voiceRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.voiceRecognition.continuous = true;
            this.voiceRecognition.interimResults = true;
            this.voiceRecognition.lang = 'en-US';

            this.voiceRecognition.onstart = () => {
                this.isListening = true;
                document.getElementById('voice-visualizer').classList.remove('hidden');
                this.addChatMessage('SkyHi', 'I\'m listening...', 'system');
            };

            this.voiceRecognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript;
                    }
                }

                if (transcript.toLowerCase().includes('hey skyhi') || transcript.toLowerCase().includes('hello skyhi')) {
                    this.processVoiceCommand(transcript);
                }
            };

            this.voiceRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceRecognition();
            };

            this.voiceRecognition.start();
        } catch (error) {
            console.error('Voice recognition not supported:', error);
            this.addChatMessage('SkyHi', 'Voice recognition is not supported in your browser.', 'error');
        }
    }

    stopVoiceRecognition() {
        if (this.voiceRecognition) {
            this.voiceRecognition.stop();
        }
        this.isListening = false;
        document.getElementById('voice-visualizer').classList.add('hidden');
    }

    async processVoiceCommand(command) {
        this.addChatMessage('You', command, 'user');

        try {
            const response = await this.sendToAI(command);
            
            // Handle the new response format
            if (response.speak && response.text) {
            this.addChatMessage('SkyHi', response.text, 'assistant');
                
                // Use TTS for voice response
                if (window.speechSynthesis) {
                    this.speakResponse(response.speak);
                }
            } else {
                // Fallback for old format
                this.addChatMessage('SkyHi', response.response || response.text, 'assistant');
            }

            if (response.action) {
                await this.executeAction(response.action, response.data);
            }
        } catch (error) {
            this.addChatMessage('SkyHi', 'Sorry, I encountered an error processing your request.', 'error');
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (message) {
            this.addChatMessage('You', message, 'user');
            input.value = '';

            try {
                const response = await this.sendToAI(message);
                
                // Handle the new response format
                if (response.speak && response.text) {
                this.addChatMessage('SkyHi', response.text, 'assistant');
                } else {
                    // Fallback for old format
                    this.addChatMessage('SkyHi', response.response || response.text, 'assistant');
                }

                if (response.action) {
                    await this.executeAction(response.action, response.data);
                }
            } catch (error) {
                this.addChatMessage('SkyHi', 'Sorry, I encountered an error.', 'error');
            }
        }
    }

    addChatMessage(sender, message, type = 'user') {
        const chatContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');

        messageDiv.className = `flex items-start gap-3 ${type === 'user' ? 'justify-end' : ''}`;
        messageDiv.innerHTML = `
            ${type !== 'user' ? `
                <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-white text-sm">auto_awesome</span>
                </div>
            ` : ''}
            <div class="max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                type === 'user'
                    ? 'bg-primary text-white'
                    : type === 'error'
                    ? 'bg-red-500/20 text-red-300'
                    : 'glassmorphism text-white'
            }">
                <p class="text-sm font-semibold">${sender}</p>
                <p class="mt-1">${message}</p>
            </div>
            ${type === 'user' ? `
                <div class="w-8 h-8 rounded-full bg-cover bg-center flex-shrink-0" style="background-image: url('${this.currentUser?.avatar || ''}')"></div>
            ` : ''}
        `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async handleQuickAction(action) {
        let command = '';
        switch (action) {
            case 'Schedule':
                command = 'Schedule a meeting for tomorrow at 2 PM';
                break;
            case 'Tasks':
                command = 'Show my current tasks';
                break;
            case 'Weather':
                command = 'What\'s the weather like today?';
                break;
            case 'News':
                command = 'Show me the latest news';
                break;
        }

        document.getElementById('chat-input').value = command;
        this.sendMessage();
    }

    async handleUtility(utility) {
        switch (utility) {
            case 'Calculator':
                this.openCalculator();
                break;
            case 'Converter':
                this.openConverter();
                break;
            case 'Speed Test':
                this.runSpeedTest();
                break;
            case 'Music':
                this.openMusicPlayer();
                break;
        }
    }

    openCalculator() {
        // Implementation for calculator
        this.addChatMessage('SkyHi', 'Opening calculator...', 'system');
    }

    async runSpeedTest() {
        this.addChatMessage('SkyHi', 'Running internet speed test...', 'system');
        // Implementation for speed test
    }

    initParticles() {
        const container = document.getElementById('particle-container');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle absolute rounded-full';

            const size = Math.random() * 3 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.background = '#7f0df2';
            particle.style.opacity = '0.5';

            const duration = Math.random() * 20 + 10;
            particle.style.animation = `float ${duration}s infinite ease-in-out, particle-glow 3s infinite ease-in-out`;

            container.appendChild(particle);
        }
    }

    async loadDashboardData() {
        // Load weather
        this.loadWeather();

        // Load tasks
        this.loadTasks();

        // Load news
        this.loadNews();

        // Load calendar
        this.loadCalendar();
    }

    async loadWeather() {
        try {
            const weather = await SkyHiAPI.getWeather();
            document.getElementById('weather-widget').innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined">thermostat</span>
                    <span>${weather.temperature}°C</span>
                </div>
                <p class="text-sm mt-1">${weather.description}</p>
            `;
        } catch (error) {
            document.getElementById('weather-widget').innerHTML = 'Weather unavailable';
        }
    }

    async loadTasks() {
        try {
            const tasks = await SkyHiAPI.getTasks();
            const tasksList = document.getElementById('tasks-list');
            tasksList.innerHTML = tasks.slice(0, 3).map(task => `
                <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="text-sm ${task.completed ? 'line-through text-gray-500' : 'text-white'}">${task.title}</span>
                </div>
            `).join('');
        } catch (error) {
            document.getElementById('tasks-list').innerHTML = '<p class="text-sm text-gray-500">No tasks</p>';
        }
    }

    // Additional methods for API calls and action execution
    async sendToAI(message) {
        return await SkyHiAPI.sendChatMessage(message);
    }

    async executeAction(action, data) {
        // Implementation for various actions
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
            case 'search_news':
                await this.searchNews(action.target, data);
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
            case 'schedule':
                await this.scheduleEvent(data);
                break;
            case 'reminder':
                await this.setReminder(data);
                break;
            default:
                console.log('Unknown action:', action);
        }
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

    // Application opening functionality
    async openApplication(appName, data) {
        this.addChatMessage('SkyHi', `Opening ${appName}...`, 'system');
        
        // In a real implementation, this would use system APIs
        // For now, we'll simulate the action
        setTimeout(() => {
            this.addChatMessage('SkyHi', `${appName} has been launched successfully.`, 'system');
        }, 1000);
    }

    // Additional data loading methods
    async loadSchedule() {
        try {
            const response = await SkyHiAPI.getSchedule();
            this.addChatMessage('SkyHi', `Your schedule: ${JSON.stringify(response)}`, 'assistant');
        } catch (error) {
            this.addChatMessage('SkyHi', 'Unable to load schedule at this time.', 'error');
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

        this.addChatMessage('SkyHi', infoText, 'assistant');
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
            // Create a downloadable file
            const blob = new Blob(['Created by SkyHi AI Assistant'], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.addChatMessage('SkyHi', `✅ File "${fileName}" created and downloaded successfully!`, 'assistant');
        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to create file "${fileName}". ${error.message}`, 'error');
        }
    }

    async readClipboard() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text) {
                    this.addChatMessage('SkyHi', `📋 **Clipboard Contents:**\n\n${text}`, 'assistant');
                } else {
                    this.addChatMessage('SkyHi', '📋 Clipboard is empty.', 'assistant');
                }
            } else {
                this.addChatMessage('SkyHi', '📋 Clipboard access not available in this browser.', 'assistant');
            }
        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to read clipboard: ${error.message}`, 'error');
        }
    }

    async takeScreenshot() {
        try {
            // Use html2canvas if available, otherwise show message
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(document.body);
                const link = document.createElement('a');
                link.download = `screenshot-${new Date().getTime()}.png`;
                link.href = canvas.toDataURL();
                link.click();
                this.addChatMessage('SkyHi', '📸 Screenshot captured and downloaded!', 'assistant');
            } else {
                this.addChatMessage('SkyHi', '📸 Screenshot feature requires html2canvas library. Taking screenshot simulation...', 'assistant');
                setTimeout(() => {
                    this.addChatMessage('SkyHi', '📸 Screenshot simulation completed! (In a real implementation, this would capture the screen)', 'assistant');
                }, 1000);
            }
        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to take screenshot: ${error.message}`, 'error');
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

        this.addChatMessage('SkyHi', timeText, 'assistant');
    }

    async setAlarm(timeInfo, data) {
        try {
            // Parse time information (simplified)
            const alarmText = `⏰ **Alarm Set:**
• Time: ${timeInfo}
• Status: Active
• Note: This is a simulation. In a real implementation, this would set an actual system alarm.`;

            this.addChatMessage('SkyHi', alarmText, 'assistant');

            // Store alarm in localStorage for demo
            const alarms = JSON.parse(localStorage.getItem('skyhi_alarms') || '[]');
            alarms.push({
                id: Date.now(),
                time: timeInfo,
                created: new Date().toISOString(),
                active: true
            });
            localStorage.setItem('skyhi_alarms', JSON.stringify(alarms));

        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to set alarm: ${error.message}`, 'error');
        }
    }

    async webSearch(query, data) {
        try {
            // Open search in new tab
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');

            this.addChatMessage('SkyHi', `🔍 **Web Search:**\n\nSearching for "${query}" in Google...\n\n[Search opened in new tab]`, 'assistant');
        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to perform web search: ${error.message}`, 'error');
        }
    }

    async composeEmail() {
        try {
            // Open email client
            const emailUrl = `mailto:?subject=&body=`;
            window.open(emailUrl);

            this.addChatMessage('SkyHi', `📧 **Email Composer:**\n\nOpening default email client...`, 'assistant');
        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to open email composer: ${error.message}`, 'error');
        }
    }

    async calendarAction() {
        try {
            // Open calendar (Google Calendar)
            const calendarUrl = 'https://calendar.google.com/calendar/';
            window.open(calendarUrl, '_blank');

            this.addChatMessage('SkyHi', `📅 **Calendar:**\n\nOpening Google Calendar in new tab...`, 'assistant');
        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to open calendar: ${error.message}`, 'error');
        }
    }

    async musicControl(action, data) {
        try {
            const actionText = {
                'play': '▶️ Playing music',
                'pause': '⏸️ Pausing music',
                'next': '⏭️ Next song'
            };

            this.addChatMessage('SkyHi', `🎵 **Music Control:**\n\n${actionText[action] || 'Music control activated'}`, 'assistant');

            // In a real implementation, this would control actual music players
            setTimeout(() => {
                this.addChatMessage('SkyHi', `🎵 Music control simulation: ${action} command executed!`, 'assistant');
            }, 1000);

        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to control music: ${error.message}`, 'error');
        }
    }

    async searchNews(query, data) {
        try {
            const response = await fetch(`http://localhost:3001/api/integrations/news/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.articles && data.articles.length > 0) {
                const newsText = `📰 **News Search Results for "${query}":**\n\n${data.articles.slice(0, 3).map(article => 
                    `• **${article.title}**\n  ${article.description}\n  Source: ${article.source}\n  [Read more](${article.url})\n`
                ).join('\n')}`;
                
                this.addChatMessage('SkyHi', newsText, 'assistant');
            } else {
                this.addChatMessage('SkyHi', `📰 No news articles found for "${query}". Try a different search term.`, 'assistant');
            }
        } catch (error) {
            this.addChatMessage('SkyHi', `❌ Failed to search news: ${error.message}`, 'error');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.skyhiApp = new SkyHiApp();
});