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
            this.addChatMessage('SkyHi', response.text, 'assistant');

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
                this.addChatMessage('SkyHi', response.text, 'assistant');

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
        switch (action) {
            case 'schedule':
                await this.scheduleEvent(data);
                break;
            case 'reminder':
                await this.setReminder(data);
                break;
            case 'weather':
                await this.loadWeather();
                break;
            case 'news':
                await this.loadNews();
                break;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.skyhiApp = new SkyHiApp();
});