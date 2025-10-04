const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const { JSDOM } = require('jsdom');

// Setup canvas for Node.js environment
const { document } = new JSDOM().window;
global.document = document;
global.Image = Image;
global.ImageData = ImageData;
global.HTMLCanvasElement = Canvas;
global.HTMLImageElement = Image;

class FaceRecognition {
    constructor() {
        this.isLoaded = false;
        this.MIN_CONFIDENCE = 0.6;
        this.FACE_MATCH_THRESHOLD = 0.5;
    }

    async loadModels() {
        try {
            console.log('Loading face recognition models...');
            
            // Load face detection models
            await faceapi.nets.ssdMobilenetv1.loadFromDisk('./backend/models');
            await faceapi.nets.faceLandmark68Net.loadFromDisk('./backend/models');
            await faceapi.nets.faceRecognitionNet.loadFromDisk('./backend/models');
            
            this.isLoaded = true;
            console.log('Face recognition models loaded successfully!');
        } catch (error) {
            console.error('Error loading face models:', error);
            throw new Error('Failed to load face recognition models');
        }
    }

    async detectFace(imageBuffer) {
        if (!this.isLoaded) {
            await this.loadModels();
        }

        try {
            const img = new Image();
            img.src = imageBuffer;
            
            // Detect faces in the image
            const detections = await faceapi
                .detectAllFaces(img)
                .withFaceLandmarks()
                .withFaceDescriptors();
            
            if (detections.length === 0) {
                throw new Error('No face detected in the image');
            }

            if (detections.length > 1) {
                throw new Error('Multiple faces detected. Please ensure only one face is visible.');
            }

            return detections[0].descriptor;
        } catch (error) {
            console.error('Face detection error:', error);
            throw error;
        }
    }

    calculateFaceDistance(descriptor1, descriptor2) {
        return faceapi.euclideanDistance(descriptor1, descriptor2);
    }

    isFaceMatch(descriptor1, descriptor2) {
        const distance = this.calculateFaceDistance(descriptor1, descriptor2);
        return distance <= this.FACE_MATCH_THRESHOLD;
    }
}

module.exports = new FaceRecognition();