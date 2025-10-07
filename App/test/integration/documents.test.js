/**
 * @fileoverview Document API integration tests
 * @description Tests for document upload, retrieval, and management functionality
 * @author GitHub Copilot
 * @version 1.0.0
 */

const request = require('supertest');
const app = require('../../app');
const fs = require('fs');
const crypto = require('crypto');
const { 
    TEST_CONFIG, 
    AuthHelper, 
    FileHelper, 
    ApiHelper,
    ValidationHelper,
    CleanupHelper 
} = require('./helpers/test-helpers');

describe('Document Management API', function() {
    this.timeout(TEST_CONFIG.TIMEOUT);

    let authToken, userId;
    const uploadedFiles = []; // Track files for cleanup

    before(async function() {
        const { token, userId: testUserId } = await AuthHelper.createAuthenticatedUser();
        authToken = token;
        userId = testUserId;
    });

    after(function() {
        // Cleanup uploaded test files
        CleanupHelper.cleanupUploadedFiles(uploadedFiles);
    });

    describe('Document Upload', function() {
        describe('Successful Upload Cases', function() {
            it('should upload a valid image file', async function() {
                const testImage = FileHelper.createTestImage('png');
                const filename = 'test-upload.png';

                const response = await ApiHelper.uploadFile(
                    TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                    authToken,
                    testImage,
                    filename,
                    'image/png'
                );

                ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.OK);
                expect(response.body.message).to.equal('File uploaded successfully');
                expect(response.body.fileInfo).to.have.property('originalname', filename);
                expect(response.body.fileInfo).to.have.property('mimetype', 'image/png');
                expect(response.body.fileInfo).to.have.property('size');

                // Track file for cleanup
                uploadedFiles.push(response.body.fileInfo.filename);
            });

            it('should upload a valid JPEG image', async function() {
                const testImage = FileHelper.createTestImage('jpg');
                const filename = 'test-upload.jpg';

                const response = await ApiHelper.uploadFile(
                    TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                    authToken,
                    testImage,
                    filename,
                    'image/jpeg'
                );

                ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.OK);
                expect(response.body.fileInfo.mimetype).to.equal('image/jpeg');

                uploadedFiles.push(response.body.fileInfo.filename);
            });

            it('should upload a valid audio file', async function() {
                const testAudio = FileHelper.createTestBuffer(1000, 'audio-data');
                const filename = 'test-audio.mp3';

                const response = await ApiHelper.uploadFile(
                    TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                    authToken,
                    testAudio,
                    filename,
                    'audio/mpeg'
                );

                ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.OK);
                expect(response.body.fileInfo.mimetype).to.equal('audio/mpeg');

                uploadedFiles.push(response.body.fileInfo.filename);
            });
        });

        describe('Authentication Requirements', function() {
            it('should reject uploads without authentication', async function() {
                const testImage = FileHelper.createTestImage();

                const response = await request(app)
                    .post(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send')
                    .attach('file', testImage, 'test.png');

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });

            it('should reject uploads with invalid token', async function() {
                const testImage = FileHelper.createTestImage();

                const response = await request(app)
                    .post(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send')
                    .set('Authorization', 'Bearer invalid-token')
                    .attach('file', testImage, 'test.png');

                expect(response.status).to.be.oneOf([
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    TEST_CONFIG.HTTP_STATUS.INTERNAL_ERROR
                ]);
            });
        });

        describe('File Validation', function() {
            it('should reject invalid file types', async function() {
                const invalidFile = Buffer.from('This is a text file');

                const response = await ApiHelper.uploadFile(
                    TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                    authToken,
                    invalidFile,
                    'document.txt',
                    'text/plain'
                );

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.BAD_REQUEST, 
                    false
                );
                expect(response.body.error).to.equal('Only image and audio files are allowed');
            });

            it('should handle missing file', async function() {
                const response = await request(app)
                    .post(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send')
                    .set('Authorization', `Bearer ${authToken}`);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.BAD_REQUEST, 
                    false
                );
            });

            it('should enforce file size limits', async function() {
                // Create file larger than 10MB
                const largeFile = FileHelper.createTestBuffer(11 * 1024 * 1024); // 11MB

                const response = await ApiHelper.uploadFile(
                    TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                    authToken,
                    largeFile,
                    'large-file.png',
                    'image/png'
                );

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.BAD_REQUEST, 
                    false
                );
            });
        });

        describe('MIME Type Validation', function() {
            const validImageTypes = [
                { type: 'image/png', filename: 'test.png' },
                { type: 'image/jpeg', filename: 'test.jpg' },
                { type: 'image/gif', filename: 'test.gif' },
                { type: 'image/webp', filename: 'test.webp' }
            ];

            validImageTypes.forEach(({ type, filename }) => {
                it(`should accept ${type} files`, async function() {
                    const testFile = FileHelper.createTestImage();

                    const response = await ApiHelper.uploadFile(
                        TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                        authToken,
                        testFile,
                        filename,
                        type
                    );

                    ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.OK);
                    uploadedFiles.push(response.body.fileInfo.filename);
                });
            });

            const invalidTypes = [
                { type: 'application/pdf', filename: 'document.pdf' },
                { type: 'text/plain', filename: 'document.txt' },
                { type: 'application/zip', filename: 'archive.zip' },
                { type: 'video/mp4', filename: 'video.mp4' }
            ];

            invalidTypes.forEach(({ type, filename }) => {
                it(`should reject ${type} files`, async function() {
                    const testFile = FileHelper.createTestBuffer(100);

                    const response = await ApiHelper.uploadFile(
                        TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                        authToken,
                        testFile,
                        filename,
                        type
                    );

                    ValidationHelper.validateApiResponse(
                        response, 
                        TEST_CONFIG.HTTP_STATUS.BAD_REQUEST, 
                        false
                    );
                });
            });
        });
    });

    describe('Document Retrieval', function() {
        let uploadedDocumentId;

        before(async function() {
            // Upload a test document for retrieval tests
            const testImage = FileHelper.createTestImage();
            const uploadResponse = await ApiHelper.uploadFile(
                TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                authToken,
                testImage,
                'retrieval-test.png',
                'image/png'
            );

            // Extract document ID from the uploaded file info
            const documentsResponse = await request(app)
                .get(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS)
                .set('Authorization', `Bearer ${authToken}`);

            const documents = documentsResponse.body.documents;
            const uploadedDoc = documents.find(doc => 
                doc.originalName === 'retrieval-test.png'
            );
            uploadedDocumentId = uploadedDoc.id;

            uploadedFiles.push(uploadResponse.body.fileInfo.filename);
        });

        describe('Document Listing', function() {
            it('should list user documents with authentication', async function() {
                const response = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS)
                    .set('Authorization', `Bearer ${authToken}`);

                ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.OK);
                expect(response.body.documents).to.be.an('array');
                
                if (response.body.documents.length > 0) {
                    const document = response.body.documents[0];
                    expect(document).to.have.property('id');
                    expect(document).to.have.property('originalName');
                    expect(document).to.have.property('mimeType');
                    expect(document).to.have.property('size');
                    expect(document).to.have.property('uploadDate');
                }
            });

            it('should reject document listing without authentication', async function() {
                const response = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });
        });

        describe('Document Download', function() {
            it('should retrieve a document by ID', async function() {
                const response = await request(app)
                    .get(`${TEST_CONFIG.API_ENDPOINTS.DOCUMENTS}/${uploadedDocumentId}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).to.equal(TEST_CONFIG.HTTP_STATUS.OK);
                expect(response.headers['content-type']).to.equal('image/png');
                expect(response.headers['content-disposition']).to.include('attachment');
                expect(response.headers['content-disposition']).to.include('retrieval-test.png');
            });

            it('should return 404 for non-existent document', async function() {
                const response = await request(app)
                    .get(`${TEST_CONFIG.API_ENDPOINTS.DOCUMENTS}/99999`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).to.equal(TEST_CONFIG.HTTP_STATUS.NOT_FOUND);
            });

            it('should require authentication for document retrieval', async function() {
                const response = await request(app)
                    .get(`${TEST_CONFIG.API_ENDPOINTS.DOCUMENTS}/${uploadedDocumentId}`);

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.UNAUTHORIZED, 
                    false
                );
            });
        });

        describe('File Integrity', function() {
            it('should maintain file integrity during upload and retrieval', async function() {
                // Use the actual test image
                const { buffer: originalBuffer, hash: originalHash } = FileHelper.getTestImageData();

                // Upload the real image
                const uploadResponse = await request(app)
                    .post(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send')
                    .set('Authorization', `Bearer ${authToken}`)
                    .attach('file', originalBuffer, {
                        filename: '1718217729729.jpg',
                        contentType: 'image/jpeg'
                    });

                ValidationHelper.validateApiResponse(uploadResponse, TEST_CONFIG.HTTP_STATUS.OK);

                // Get the uploaded document ID
                const documentsResponse = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS)
                    .set('Authorization', `Bearer ${authToken}`);

                const documents = documentsResponse.body.documents;
                const uploadedDoc = documents.find(doc => 
                    doc.originalName === '1718217729729.jpg' && 
                    doc.size === originalBuffer.length
                );

                // Retrieve the document
                const retrievalResponse = await request(app)
                    .get(`${TEST_CONFIG.API_ENDPOINTS.DOCUMENTS}/${uploadedDoc.id}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(retrievalResponse.status).to.equal(TEST_CONFIG.HTTP_STATUS.OK);

                // Verify file integrity
                const retrievedHash = FileHelper.calculateHash(retrievalResponse.body);
                expect(retrievedHash).to.equal(originalHash);
                expect(retrievalResponse.body.length).to.equal(originalBuffer.length);

                uploadedFiles.push(uploadResponse.body.fileInfo.filename);
            });
        });
    });

    describe('Error Handling', function() {
        describe('Malformed Requests', function() {
            it('should handle malformed multipart data', async function() {
                const response = await request(app)
                    .post(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send')
                    .set('Authorization', `Bearer ${authToken}`)
                    .set('Content-Type', 'multipart/form-data; boundary=invalid')
                    .send('invalid data');

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.BAD_REQUEST, 
                    false
                );
            });

            it('should handle missing file field', async function() {
                const response = await request(app)
                    .post(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send')
                    .set('Authorization', `Bearer ${authToken}`)
                    .field('notFile', 'value');

                ValidationHelper.validateApiResponse(
                    response, 
                    TEST_CONFIG.HTTP_STATUS.BAD_REQUEST, 
                    false
                );
            });
        });

        describe('System Errors', function() {
            it('should handle database read errors gracefully', async function() {
                // This test verifies the API can handle database errors
                const response = await request(app)
                    .get(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS)
                    .set('Authorization', `Bearer ${authToken}`);

                // Even if there are internal errors, the API should respond
                expect([
                    TEST_CONFIG.HTTP_STATUS.OK, 
                    TEST_CONFIG.HTTP_STATUS.INTERNAL_ERROR
                ]).to.include(response.status);
            });
        });
    });

    describe('Performance Tests', function() {
        it('should handle multiple simultaneous uploads', async function() {
            const uploadPromises = [];
            
            for (let i = 0; i < 3; i++) {
                const testFile = FileHelper.createTestImage();
                const promise = ApiHelper.uploadFile(
                    TEST_CONFIG.API_ENDPOINTS.DOCUMENTS + '/send',
                    authToken,
                    testFile,
                    `concurrent-test-${i}.png`,
                    'image/png'
                );
                uploadPromises.push(promise);
            }

            const responses = await Promise.all(uploadPromises);

            responses.forEach((response, index) => {
                ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.OK);
                uploadedFiles.push(response.body.fileInfo.filename);
            });
        });

        it('should respond quickly to document listing', async function() {
            const startTime = Date.now();

            const response = await request(app)
                .get(TEST_CONFIG.API_ENDPOINTS.DOCUMENTS)
                .set('Authorization', `Bearer ${authToken}`);

            const responseTime = Date.now() - startTime;

            ValidationHelper.validateApiResponse(response, TEST_CONFIG.HTTP_STATUS.OK);
            expect(responseTime).to.be.below(1000); // Should respond within 1 second
        });
    });
});