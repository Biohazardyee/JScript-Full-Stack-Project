/**
 * @fileoverview Document management routes
 * @description API endpoints for uploading, retrieving, and managing documents
 * @author GitHub Copilot
 * @version 1.0.0
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const utilities = require('../utilities/utilities');

const { 
    securityMiddleware, 
    generateId, 
    fileFilter, 
    writeDocumentsData, 
    readDocuments 
} = utilities;

const router = express.Router();

/**
 * Multer configuration for file uploads
 */
const UPLOAD_CONFIG = {
    dest: '../data/uploads/',
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
};

const upload = multer(UPLOAD_CONFIG);


/**
 * @route POST /documents/send
 * @description Upload a new document
 * @access Private (requires authentication)
 * @param {File} file - Document file to upload (max 10MB, images and audio only)
 * @returns {Object} Upload confirmation with file information
 */
router.post('/send', securityMiddleware, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Handle Multer-specific errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: 'File size exceeds the 10MB limit'
                });
            }
            return res.status(400).json({
                success: false,
                error: err.message
            });
        } else if (err) {
            // Handle other errors (including file filter errors)
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }
        
        try {
            // Validate file upload
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            // Read existing documents
            const documents = readDocuments();

            // Create new document record
            const newDocument = {
                id: generateId(documents),
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                fileName: req.file.filename,
                filePath: req.file.path,
                userId: req.user.id,
                uploadDate: new Date().toISOString(),
            }

            documents.push(newDocument);
            writeDocumentsData(documents);

            res.json({
                success: true,
                message: 'File uploaded successfully',
                fileInfo: req.file
            });

        } catch (error) {
            next(error);
        }
    });
});

// GET /documents/:id - Retrieve a document by ID
router.get('/:id', securityMiddleware, function(req, res, next) {
    try {
        const documentId = parseInt(req.params.id);
        
        if (isNaN(documentId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid document ID'
            });
        }

        const documents = readDocuments();
        const document = documents.find(doc => doc.id === documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        // Check if the file still exists
        const fs = require('fs');
        if (!fs.existsSync(document.filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found on disk'
            });
        }

        // Set appropriate headers for file download
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        
        // Send the file
        res.sendFile(path.resolve(document.filePath));

    } catch (error) {
        next(error);
    }
});

// GET /documents - List all documents for the authenticated user
router.get('/', securityMiddleware, function(req, res, next) {
    try {
        const documents = readDocuments();
        const userDocuments = documents
            .filter(doc => doc.userId === req.user.id)
            .map(doc => ({
                id: doc.id,
                originalName: doc.originalName,
                mimeType: doc.mimeType,
                size: doc.size,
                uploadDate: doc.uploadDate
            }));

        res.json({
            success: true,
            documents: userDocuments
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
module.exports = router;