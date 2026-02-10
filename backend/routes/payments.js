const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
    try {
        const { productId } = req.body;

        const product = await Product.findById(productId);

        if (!product || product.status !== 'approved') {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available'
            });
        }

        // Check if user already purchased
        const user = await User.findById(req.user._id);
        if (user.purchasedProducts.includes(productId)) {
            return res.status(400).json({
                success: false,
                message: 'You have already purchased this product'
            });
        }

        // Calculate amount (in cents for Stripe)
        const amount = Math.round(product.discountPrice || product.price) * 100;

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                userId: req.user._id.toString(),
                productId: productId,
                productTitle: product.title
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount: amount / 100
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating payment'
        });
    }
});

// Handle payment success webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handleSuccessfulPayment(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            await handleFailedPayment(failedPayment);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

async function handleSuccessfulPayment(paymentIntent) {
    try {
        const { userId, productId } = paymentIntent.metadata;

        // Find or create order
        let order = await Order.findOne({ stripePaymentId: paymentIntent.id });

        if (!order) {
            order = new Order({
                orderId: 'ORD' + Date.now(),
                user: userId,
                product: productId,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                paymentMethod: paymentIntent.payment_method_types[0],
                paymentStatus: 'completed',
                stripePaymentId: paymentIntent.id,
                stripeCustomerId: paymentIntent.customer,
                receiptUrl: paymentIntent.charges.data[0]?.receipt_url
            });

            await order.save();

            // Update product downloads
            await Product.findByIdAndUpdate(productId, {
                $inc: { downloads: 1 }
            });

            // Add product to user's purchased products
            await User.findByIdAndUpdate(userId, {
                $addToSet: { purchasedProducts: productId }
            });

            // TODO: Send confirmation email
            // TODO: Notify developer of sale
        }
    } catch (error) {
        console.error('Handle successful payment error:', error);
    }
}

async function handleFailedPayment(paymentIntent) {
    try {
        await Order.findOneAndUpdate(
            { stripePaymentId: paymentIntent.id },
            { paymentStatus: 'failed' }
        );
    } catch (error) {
        console.error('Handle failed payment error:', error);
    }
}

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('product', 'title thumbnail price')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching orders'
        });
    }
});

// Get order details
router.get('/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username email')
            .populate('product', 'title thumbnail price description fileUrl');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check permission
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching order'
        });
    }
});

module.exports = router;