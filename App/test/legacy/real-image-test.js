const request = require('supertest');
const app = require('../app');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { expect } = require('chai');

describe('Real Image Upload/Retrieval Test', () => {
    let authToken;
    let uploadedDocumentId;
    let originalFileHash;
    
    before(async function() {
        this.timeout(10000);
        
        // Login to get auth token
        const testEmail = 'imagetest@example.com';
        const testPassword = 'testpass123';
        
        try {
            await request(app)
                .post('/register')
                .send({
                    email: testEmail,
                    password: testPassword
                });
        } catch (error) {
            // User might already exist
        }
        
        const loginResponse = await request(app)
            .post('/login')
            .send({
                email: testEmail,
                password: testPassword
            });
        
        authToken = loginResponse.body.token;
        console.log('✅ Authentication ready');
        
        // Calculate hash of original image for corruption check
        const imagePath = path.join(__dirname, '../imgs/1718217729729.jpg');
        if (fs.existsSync(imagePath)) {
            const originalImageBuffer = fs.readFileSync(imagePath);
            originalFileHash = crypto.createHash('md5').update(originalImageBuffer).digest('hex');
            console.log('📁 Original image hash:', originalFileHash);
            console.log('📁 Original image size:', originalImageBuffer.length, 'bytes');
        } else {
            throw new Error('Test image not found at: ' + imagePath);
        }
    });

    it('should upload the real image from imgs folder', async function() {
        this.timeout(10000);
        
        const imagePath = path.join(__dirname, '../imgs/1718217729729.jpg');
        
        const response = await request(app)
            .post('/documents/send')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', imagePath);

        console.log('📤 Upload response:', response.status);
        console.log('📤 Upload body:', JSON.stringify(response.body, null, 2));
        
        expect(response.status).to.equal(200);
        expect(response.body.success).to.equal(true);
        expect(response.body.fileInfo.originalname).to.equal('1718217729729.jpg');
        expect(response.body.fileInfo.mimetype).to.equal('image/jpeg');
        
        // Get the document ID from the database
        const documentsPath = path.join(__dirname, '../data/documents.json');
        const documents = JSON.parse(fs.readFileSync(documentsPath, 'utf8'));
        
        // Find the most recent document (should be the one we just uploaded)
        uploadedDocumentId = documents[documents.length - 1].id;
        
        console.log('📤 Uploaded document ID:', uploadedDocumentId);
    });

    it('should retrieve the uploaded image without corruption', async function() {
        this.timeout(10000);
        
        if (!uploadedDocumentId) {
            throw new Error('No document ID available for retrieval test');
        }
        
        const response = await request(app)
            .get(`/documents/${uploadedDocumentId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .responseType('buffer'); // Important: get binary data

        console.log('📥 Retrieval response status:', response.status);
        console.log('📥 Content-Type:', response.headers['content-type']);
        console.log('📥 Content-Disposition:', response.headers['content-disposition']);
        console.log('📥 Retrieved file size:', response.body.length, 'bytes');
        
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('image/jpeg');
        expect(response.headers['content-disposition']).to.include('1718217729729.jpg');
        
        // Calculate hash of retrieved file
        const retrievedFileHash = crypto.createHash('md5').update(response.body).digest('hex');
        console.log('📥 Retrieved image hash:', retrievedFileHash);
        
        // Compare hashes to check for corruption
        expect(retrievedFileHash).to.equal(originalFileHash, 
            'File was corrupted during upload/retrieval process!');
        
        console.log('✅ SUCCESS: Image retrieved without corruption!');
        
        // Optional: Save retrieved file for manual verification
        const testOutputPath = path.join(__dirname, '../retrieved-test-image.jpg');
        fs.writeFileSync(testOutputPath, response.body);
        console.log('💾 Retrieved image saved to:', testOutputPath);
    });

    it('should list the uploaded document in user documents', async function() {
        const response = await request(app)
            .get('/documents')
            .set('Authorization', `Bearer ${authToken}`);

        console.log('📋 User documents:', JSON.stringify(response.body, null, 2));
        
        expect(response.status).to.equal(200);
        expect(response.body.success).to.equal(true);
        expect(response.body.documents).to.be.an('array');
        
        // Check if our uploaded document is in the list
        const ourDocument = response.body.documents.find(doc => 
            doc.originalName === '1718217729729.jpg');
        
        expect(ourDocument).to.exist;
        expect(ourDocument.mimeType).to.equal('image/jpeg');
        
        console.log('✅ Document properly listed in user documents');
    });
});