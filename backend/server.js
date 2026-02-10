const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webharbour', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
    console.log('MongoDB Error:', err);
});

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    isModerator: { type: Boolean, default: false },
});

// Product Schema
const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['app', 'game', 'software', 'pdf', 'movie'], required: true },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    thumbnail: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    downloads: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Review Schema
const reviewSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Purchase Schema
const purchaseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    price: { type: Number, required: true },
    transactionId: { type: String, unique: true, required: true },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);

// ==================== MIDDLEWARE ====================

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'webharbour-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields required' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'webharbour-secret-key', {
            expiresIn: '7d',
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcryptjs.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'webharbour-secret-key', {
            expiresIn: '7d',
        });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email, isModerator: user.isModerator },
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Get Current User
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// ==================== PRODUCT ROUTES ====================

// Get All Products (with filters)
app.get('/api/products', async (req, res) => {
    try {
        const { category, status, search, page = 1, limit = 12 } = req.query;
        let query = { status: 'approved' };

        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } },
            ];
        }

        const skip = (page - 1) * limit;
        const products = await Product.find(query)
            .populate('developer', 'username profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        res.json({
            products,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// Get Single Product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('developer', 'username profileImage bio')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'username profileImage' },
            });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const reviews = await Review.find({ product: req.params.id })
            .populate('user', 'username profileImage')
            .sort({ createdAt: -1 });

        res.json({ ...product.toObject(), reviews });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
});

// Upload Product (requires auth)
app.post('/api/products/upload', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, price, thumbnail, fileUrl, tags } = req.body;

        if (!title || !description || !category || !thumbnail || !fileUrl) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const validCategories = ['app', 'game', 'software', 'pdf', 'movie'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const product = new Product({
            title,
            description,
            category,
            price: price || 0,
            thumbnail,
            fileUrl,
            tags: tags || [],
            developer: req.userId,
            status: 'pending',
        });

        await product.save();

        res.status(201).json({
            message: 'Product uploaded for review',
            product,
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// Get User's Products
app.get('/api/user/products', authMiddleware, async (req, res) => {
    try {
        const products = await Product.find({ developer: req.userId }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// ==================== REVIEW ROUTES ====================

// Add Review
app.post('/api/reviews', authMiddleware, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        if (!productId || !rating || !comment) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const review = new Review({
            product: productId,
            user: req.userId,
            rating,
            comment,
        });

        await review.save();

        // Update product rating
        const reviews = await Review.find({ product: productId });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        product.rating = avgRating;
        await product.save();

        res.status(201).json({ message: 'Review added', review });
    } catch (error) {
        res.status(500).json({ message: 'Error adding review', error: error.message });
    }
});

// Get Reviews for Product
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'username profileImage')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
});

// ==================== PURCHASE ROUTES ====================

// Create Purchase
app.post('/api/purchases', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.price === 0) {
            return res.status(400).json({ message: 'This product is free' });
        }

        // Generate transaction ID (in real app, integrate Stripe, PayPal, etc.)
        const transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const purchase = new Purchase({
            user: req.userId,
            product: productId,
            price: product.price,
            transactionId,
            status: 'completed',
        });

        await purchase.save();

        product.downloads += 1;
        await product.save();

        res.status(201).json({
            message: 'Purchase successful',
            purchase,
            downloadUrl: product.fileUrl,
        });
    } catch (error) {
        res.status(500).json({ message: 'Purchase failed', error: error.message });
    }
});

// Get User's Purchases
app.get('/api/purchases', authMiddleware, async (req, res) => {
    try {
        const purchases = await Purchase.find({ user: req.userId })
            .populate('product')
            .sort({ createdAt: -1 });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching purchases', error: error.message });
    }
});

// ==================== ADMIN ROUTES ====================

// Get Pending Products (Moderators only)
app.get('/api/admin/pending', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.isModerator) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const products = await Product.find({ status: 'pending' })
            .populate('developer', 'username email')
            .sort({ createdAt: 1 });

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending products', error: error.message });
    }
});

// Approve/Reject Product (Moderators only)
app.post('/api/admin/products/:id/review', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.isModerator) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { status, rejectionReason } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                status,
                rejectionReason: status === 'rejected' ? rejectionReason : '',
            },
            { new: true }
        );

        res.json({ message: 'Product reviewed', product });
    } catch (error) {
        res.status(500).json({ message: 'Error reviewing product', error: error.message });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({ message: 'WebHarbour API is running' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
