const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const { auth, optionalAuth } = require('../middleware/auth');

// Get all products with filters
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            category,
            search,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 20,
            status = 'approved'
        } = req.query;

        // Build query
        let query = { status };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$text = { $search: search };
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // If user is admin, show all statuses
        if (req.user?.role === 'admin') {
            delete query.status;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const products = await Product.find(query)
            .populate('developer', 'username avatar')
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching products'
        });
    }
});

// Get single product
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('developer', 'username avatar createdAt')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'user',
                    select: 'username avatar'
                }
            });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Increment view count
        product.views = (product.views || 0) + 1;
        await product.save();

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching product'
        });
    }
});

// Get featured products
router.get('/featured/random', async (req, res) => {
    try {
        const products = await Product.aggregate([
            { $match: { status: 'approved', featured: true } },
            { $sample: { size: 10 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'developer',
                    foreignField: '_id',
                    as: 'developer'
                }
            },
            { $unwind: '$developer' },
            {
                $project: {
                    title: 1,
                    thumbnail: 1,
                    price: 1,
                    discountPrice: 1,
                    ratings: 1,
                    downloads: 1,
                    'developer.username': 1,
                    'developer.avatar': 1
                }
            }
        ]);

        res.json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Get featured error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching featured products'
        });
    }
});

// Get products by developer
router.get('/developer/:developerId', async (req, res) => {
    try {
        const products = await Product.find({
            developer: req.params.developerId,
            status: 'approved'
        }).populate('developer', 'username avatar');

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

// Add review
router.post('/:id/reviews', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            product: product._id,
            user: req.user._id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        // Create review
        const review = new Review({
            ...req.body,
            product: product._id,
            user: req.user._id
        });

        await review.save();

        // Add review to product
        product.reviews.push(review._id);

        // Update average rating
        const reviews = await Review.find({ product: product._id });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        product.ratings = {
            average: avgRating,
            count: reviews.length
        };

        await product.save();

        res.status(201).json({
            success: true,
            review
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding review'
        });
    }
});

// Search products
router.get('/search/suggestions', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                suggestions: []
            });
        }

        const suggestions = await Product.find(
            {
                $text: { $search: q },
                status: 'approved'
            },
            { score: { $meta: 'textScore' } }
        )
            .select('title thumbnail price')
            .sort({ score: { $meta: 'textScore' } })
            .limit(10);

        res.json({
            success: true,
            suggestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;