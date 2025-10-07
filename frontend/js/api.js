class SkyHiAPI {
    static baseURL = 'http://localhost:3001/api';

    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('skyhi_token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    static async verifyFace(imageData) {
        return await this.request('/auth/verify-face', {
            method: 'POST',
            body: JSON.stringify({ image: imageData }),
        });
    }

    static async sendChatMessage(message, context = []) {
        return await this.request('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ 
                message,
                context,
                mode: message.toLowerCase().includes('pro:') ? 'pro' : 'normal'
            }),
        });
    }

    static async getWeather() {
        return await this.request('/integrations/weather');
    }

    static async getTasks() {
        return await this.request('/tasks');
    }

    static async getNews() {
        return await this.request('/integrations/news');
    }

    static async scheduleEvent(eventData) {
        return await this.request('/schedule', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    }

    static async setReminder(reminderData) {
        return await this.request('/reminders', {
            method: 'POST',
            body: JSON.stringify(reminderData),
        });
    }

    static async getSchedule() {
        return await this.request('/schedule');
    }

    static async getCalendar() {
        return await this.request('/calendar');
    }

    static async getJokes() {
        return await this.request('/integrations/jokes');
    }

    static async getFacts() {
        return await this.request('/integrations/facts');
    }

    static async calculate(expression) {
        return await this.request('/integrations/calculator', {
            method: 'POST',
            body: JSON.stringify({ expression }),
        });
    }

    static async convertCurrency(from, to, amount) {
        return await this.request(`/integrations/currency?from=${from}&to=${to}&amount=${amount}`);
    }

    static async runSpeedTest() {
        return await this.request('/integrations/speedtest');
    }
}