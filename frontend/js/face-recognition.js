class FaceRecognitionFrontend {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.isCapturing = false;
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user' 
                } 
            });
            this.video.srcObject = this.stream;
            
            // Wait for video to load
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve();
                };
            });

            console.log('Camera started successfully');
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw new Error('Cannot access camera. Please allow camera permissions.');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    captureFace() {
        if (!this.stream) {
            throw new Error('Camera not started');
        }

        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        // Draw current video frame to canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Convert to blob for upload
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.8);
        });
    }

    async verifyFace() {
        if (this.isCapturing) return;

        this.isCapturing = true;
        const statusElement = document.getElementById('login-status');
        
        try {
            statusElement.textContent = 'Capturing face...';
            
            // Capture face image
            const faceBlob = await this.captureFace();
            
            // Create form data for upload
            const formData = new FormData();
            formData.append('faceImage', faceBlob, 'face.jpg');

            statusElement.textContent = 'Verifying face...';

            // Send to backend for verification
            const response = await fetch('http://localhost:3001/api/auth/verify-face', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.verified) {
                statusElement.textContent = '✅ Face verified! Welcome back!';
                
                // Store user data and token
                localStorage.setItem('skyhi_token', result.token);
                localStorage.setItem('skyhi_user', JSON.stringify(result.user));
                
                // Login successful
                if (window.skyhiApp) {
                    window.skyhiApp.loginUser(result.user);
                }
            } else {
                statusElement.textContent = '❌ Face not recognized. Please register.';
                
                // Show registration option
                this.showRegistrationForm(result.unknownFaceId);
            }

        } catch (error) {
            console.error('Face verification error:', error);
            statusElement.textContent = `Error: ${error.message}`;
        } finally {
            this.isCapturing = false;
        }
    }

    showRegistrationForm(unknownFaceId) {
        const loginScreen = document.getElementById('login-screen');
        loginScreen.innerHTML = `
            <div class="w-full max-w-md p-8">
                <div class="text-center mb-8">
                    <div class="flex justify-center mb-4">
                        <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-3xl">person_add</span>
                        </div>
                    </div>
                    <h1 class="text-3xl font-bold text-white mb-2">Register New User</h1>
                    <p class="text-gray-400">Your face wasn't recognized. Please register.</p>
                </div>
                
                <div class="glassmorphism rounded-xl p-6">
                    <form id="register-form">
                        <input type="hidden" id="unknownFaceId" value="${unknownFaceId || ''}">
                        <div class="mb-4">
                            <label class="block text-white text-sm font-bold mb-2">Full Name</label>
                            <input type="text" id="register-name" required 
                                class="w-full bg-background-dark/50 border-2 border-primary/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-primary">
                        </div>
                        <div class="mb-6">
                            <label class="block text-white text-sm font-bold mb-2">Email</label>
                            <input type="email" id="register-email" required
                                class="w-full bg-background-dark/50 border-2 border-primary/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-primary">
                        </div>
                        <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                            Register & Continue
                        </button>
                    </form>
                    <button id="back-to-login" class="w-full mt-4 text-gray-400 hover:text-white transition-colors">
                        Back to Login
                    </button>
                </div>
            </div>
        `;

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registerNewUser();
        });

        document.getElementById('back-to-login').addEventListener('click', () => {
            location.reload();
        });
    }

    async registerNewUser() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const unknownFaceId = document.getElementById('unknownFaceId').value;
        const statusElement = document.createElement('div');
        statusElement.className = 'mt-4 text-center';

        try {
            statusElement.textContent = 'Registering...';
            document.getElementById('register-form').appendChild(statusElement);

            // Capture current face for registration
            const faceBlob = await this.captureFace();
            
            const formData = new FormData();
            formData.append('faceImage', faceBlob, 'face.jpg');
            formData.append('name', name);
            formData.append('email', email);
            formData.append('unknownFaceId', unknownFaceId);

            const response = await fetch('http://localhost:3001/api/auth/register-face', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                statusElement.textContent = '✅ Registration successful!';
                
                localStorage.setItem('skyhi_token', result.token);
                localStorage.setItem('skyhi_user', JSON.stringify(result.user));
                
                setTimeout(() => {
                    if (window.skyhiApp) {
                        window.skyhiApp.loginUser(result.user);
                    }
                }, 1000);
            } else {
                statusElement.textContent = `❌ ${result.error}`;
            }

        } catch (error) {
            console.error('Registration error:', error);
            statusElement.textContent = `Error: ${error.message}`;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.faceRecognition = new FaceRecognitionFrontend();
});