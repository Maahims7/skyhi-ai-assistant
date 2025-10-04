import https from 'https';
import fs from 'fs';
import path from 'path';

// CORRECT URLs - using raw.githubusercontent.com directly
const models = [
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
        filename: 'face_landmark_68_model-weights_manifest.json'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
        filename: 'face_landmark_68_model-shard1'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
        filename: 'face_recognition_model-weights_manifest.json'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
        filename: 'face_recognition_model-shard1'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json',
        filename: 'ssd_mobilenetv1_model-weights_manifest.json'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1',
        filename: 'ssd_mobilenetv1_model-shard1'
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2',
        filename: 'ssd_mobilenetv1_model-shard2'
    }
];

const modelsDir = './backend/models';

if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(modelsDir, filename);
        const file = fs.createWriteStream(filePath);
        
        console.log(`⬇️ Downloading: ${filename}`);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${filename}`);
                    resolve();
                });
            } else {
                reject(new Error(`Failed: ${filename} - Status: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

async function downloadAllModels() {
    console.log('🚀 Downloading ADVANCED face recognition models...');
    
    for (const model of models) {
        try {
            await downloadFile(model.url, model.filename);
        } catch (error) {
            console.error(`❌ ${error.message}`);
        }
    }
    
    console.log('🎉 Download completed!');
}

downloadAllModels();