class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.finalTranscript = '';
        this.wakeWords = ['hey skyhi', 'hello skyhi', 'jarvis', 'skyhi', 'hey jarvis', 'activate skyhi', 'wake up skyhi'];
        this.contextMemory = [];
        this.init();
    }

    init() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.setupRecognition();
        } else {
            console.warn('Speech recognition not supported');
        }
    }

    setupRecognition() {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVisualizer(true);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVisualizer(false);
            
            // Restart if it was manually stopped
            if (window.skyhiApp.isListening) {
                this.recognition.start();
            }
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    this.finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Check for wake word with improved detection
            const fullTranscript = (this.finalTranscript + interimTranscript).toLowerCase();
            const wakeWordDetected = this.wakeWords.some(wakeWord => 
                fullTranscript.includes(wakeWord.toLowerCase())
            );

            if (wakeWordDetected && event.results[event.results.length - 1].isFinal) {
                this.processCommand(this.finalTranscript);
                this.finalTranscript = '';
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                window.skyhiApp.addChatMessage('SkyHi', 'Microphone access denied. Please allow microphone access.', 'error');
            }
        };
    }

    start() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    updateVisualizer(listening) {
        const visualizer = document.getElementById('voice-visualizer');
        if (listening) {
            visualizer.classList.remove('hidden');
        } else {
            visualizer.classList.add('hidden');
        }
    }

    processCommand(transcript) {
        // Remove wake words from command
        let command = transcript.toLowerCase();
        this.wakeWords.forEach(wakeWord => {
            command = command.replace(wakeWord.toLowerCase(), '').trim();
        });
        
        // Store in context memory
        this.addToContext('user', command);
        
        // Process the command
        if (window.skyhiApp) {
            window.skyhiApp.processVoiceCommand(command);
        }
    }

    // Context memory management
    addToContext(role, content) {
        this.contextMemory.push({ role, content, timestamp: new Date() });
        
        // Limit context size
        if (this.contextMemory.length > 20) {
            this.contextMemory = this.contextMemory.slice(-20);
        }
    }

    getContext() {
        return this.contextMemory.slice(-10); // Return last 10 interactions
    }

    // Toggle voice recognition
    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }
}