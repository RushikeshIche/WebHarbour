const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// Apply auth and admin middleware to all routes
router.use(auth, adminMiddleware);

// Get pending products for review
router.get('/pending-products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const products = await Product.find({ status: 'pending' })
            .populate('developer', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments({ status: 'pending' });

        res.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get pending products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Approve product
router.put('/products/:id/approve', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        product.status = 'approved';
        product.approvedBy = req.user._id;
        product.approvedAt = new Date();

        await product.save();

        // TODO: Send notification to developer

        res.json({
            success: true,
            product,
            message: 'Product approved successfully'
        });
    } catch (error) {
        console.error('Approve product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Reject product
router.put('/products/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason must be at least 10 characters'
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        product.status = 'rejected';
        product.rejectionReason = reason.trim();
        product.approvedBy = req.user._id;
        product.approvedAt = new Date();

        await product.save();

        // TODO: Send notification to developer

        res.json({
            success: true,
            product,
            message: 'Product rejected'
        });
    } catch (error) {
        console.error('Reject product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password -verificationToken -resetPasswordToken -resetPasswordExpire')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'developer', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            user: user.toJSON(),
            message: `User role updated to ${role}`
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all orders
router.get('/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const orders = await Order.find()
            .populate('user', 'username email')
            .populate('product', 'title thumbnail price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments();

        // Calculate totals
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'completed',
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            orders,
            stats: {
                totalRevenue: totalRevenue[0]?.total || 0,
                dailyRevenue: dailyRevenue[0]?.total || 0,
                totalOrders: total
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get dashboard stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalProducts,
            pendingProducts,
            totalOrders,
            todayOrders,
            totalRevenue
        ] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Product.countDocuments({ status: 'pending' }),
            Order.countDocuments(),
            Order.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }),
            Order.aggregate([
                { $match: { paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        // Get recent activities
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('developer', 'username');

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'username')
            .populate('product', 'title');

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalProducts,
                pendingProducts,
                totalOrders,
                todayOrders,
                totalRevenue: totalRevenue[0]?.total || 0
            },
            recent: {
                products: recentProducts,
                orders: recentOrders
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Feature/unfeature product
router.put('/products/:id/feature', async (req, res) => {
    try {
        const { featured, featuredUntil } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        product.featured = featured || false;

        if (featured && featuredUntil) {
            product.featuredUntil = new Date(featuredUntil);
        } else {
            product.featuredUntil = null;
        }

        await product.save();

        res.json({
            success: true,
            product,
            message: featured ? 'Product featured' : 'Product unfeatured'
        });
    } catch (error) {
        console.error('Feature product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;