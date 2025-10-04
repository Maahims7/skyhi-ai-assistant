class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.finalTranscript = '';
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

            // Check for wake word
            if (this.finalTranscript.toLowerCase().includes('hey skyhi') || 
                this.finalTranscript.toLowerCase().includes('hello skyhi')) {
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
        const command = transcript.toLowerCase().replace(/hey skyhi|hello skyhi/gi, '').trim();
        window.skyhiApp.processVoiceCommand(command);
    }
}