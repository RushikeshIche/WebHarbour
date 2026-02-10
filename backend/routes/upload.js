const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { upload, uploadThumbnail, uploadScreenshots } = require('../middleware/upload');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// Upload product
router.post('/', auth, async (req, res) => {
    try {
        // Only developers and admins can upload
        if (req.user.role === 'user') {
            return res.status(403).json({
                success: false,
                message: 'Only developers and admins can upload products'
            });
        }

        const productData = req.body;

        // Validate required fields
        const required = ['title', 'description', 'category', 'price', 'fileUrl', 'fileSize', 'thumbnail'];
        for (const field of required) {
            if (!productData[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}`
                });
            }
        }

        // Create product
        const product = new Product({
            ...productData,
            developer: req.user._id,
            status: 'pending' // All uploads go through manual review
        });

        await product.save();

        res.status(201).json({
            success: true,
            product,
            message: 'Product uploaded successfully. It will be available after manual review.'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error uploading product'
        });
    }
});

// Upload file (for large files)
router.post('/file', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Create file URL
        const fileUrl = `/uploads/${req.body.category}s/${req.file.filename}`;

        res.json({
            success: true,
            fileUrl,
            fileName: req.file.filename,
            fileSize: req.file.size,
            originalName: req.file.originalname
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error uploading file'
        });
    }
});

// Upload thumbnail
router.post('/thumbnail', auth, uploadThumbnail.single('thumbnail'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No thumbnail uploaded'
            });
        }

        const thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;

        res.json({
            success: true,
            thumbnailUrl
        });
    } catch (error) {
        console.error('Thumbnail upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error uploading thumbnail'
        });
    }
});

// Upload screenshots
router.post('/screenshots', auth, uploadScreenshots.array('screenshots', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No screenshots uploaded'
            });
        }

        const screenshotUrls = req.files.map(file =>
            `/uploads/screenshots/${file.filename}`
        );

        res.json({
            success: true,
            screenshotUrls,
            count: req.files.length
        });
    } catch (error) {
        console.error('Screenshots upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error uploading screenshots'
        });
    }
});

// Get user's uploaded products
router.get('/my-uploads', auth, async (req, res) => {
    try {
        const products = await Product.find({ developer: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update product
router.put('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check permission
        if (product.developer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        // Update fields
        const updates = req.body;
        Object.keys(updates).forEach(key => {
            if (key !== '_id' && key !== 'developer' && key !== 'status') {
                product[key] = updates[key];
            }
        });

        // Reset to pending if admin hasn't approved yet
        if (product.status !== 'approved') {
            product.status = 'pending';
        }

        await product.save();

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating product'
        });
    }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check permission
        if (product.developer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        // Delete files
        if (product.fileUrl && product.fileUrl.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', product.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        if (product.thumbnail && product.thumbnail.startsWith('/uploads/')) {
            const thumbPath = path.join(__dirname, '..', product.thumbnail);
            if (fs.existsSync(thumbPath)) {
                fs.unlinkSync(thumbPath);
            }
        }

        // Delete product
        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting product'
        });
    }
});

module.exports = router;