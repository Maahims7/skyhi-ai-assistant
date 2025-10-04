import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, 'backend', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

// List of required model files with their URLs
const modelFiles = [
    {
        name: 'face_landmark_68_model-weights_manifest.json',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json'
    },
    {
        name: 'face_landmark_68_model-shard1',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1'
    },
    {
        name: 'face_recognition_model-weights_manifest.json',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json'
    },
    {
        name: 'face_recognition_model-shard1',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1'
    },
    {
        name: 'ssd_mobilenetv1_model-weights_manifest.json',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json'
    },
    {
        name: 'ssd_mobilenetv1_model-shard1',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1'
    },
    {
        name: 'ssd_mobilenetv1_model-shard2',
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2'
    }
];

console.log('📥 Downloading face recognition models...');

let downloadedCount = 0;

for (const file of modelFiles) {
    const filePath = path.join(modelsDir, file.name);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file.name} - Already exists`);
        downloadedCount++;
        continue;
    }

    try {
        console.log(`⬇️  Downloading ${file.name}...`);
        
        const response = await fetch(file.url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fs.writeFileSync(filePath, buffer);
        console.log(`✅ ${file.name} - Downloaded successfully`);
        downloadedCount++;
        
    } catch (error) {
        console.log(`❌ ${file.name} - Failed: ${error.message}`);
    }
}

console.log(`\n🎉 Download complete: ${downloadedCount}/${modelFiles.length} files`);
console.log(`📍 Models location: ${modelsDir}`);

if (downloadedCount === modelFiles.length) {
    console.log('🚀 All models downloaded successfully!');
} else {
    console.log('⚠️  Some models failed to download. Face recognition may not work properly.');
}