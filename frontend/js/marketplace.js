// Marketplace page functionality

let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.includes('marketplace.html')) {
        setupMarketplace();
    }

    if (window.location.pathname.includes('product.html')) {
        setupProductPage();
    }
});

function setupMarketplace() {
    // Get filters from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentFilters = {
        category: urlParams.get('category'),
        search: urlParams.get('search'),
        minPrice: urlParams.get('minPrice'),
        maxPrice: urlParams.get('maxPrice'),
        sortBy: urlParams.get('sortBy') || 'createdAt',
        order: urlParams.get('order') || 'desc'
    };

    currentPage = parseInt(urlParams.get('page')) || 1;

    // Setup filter controls
    setupFilterControls();

    // Load products
    loadProducts();

    // Setup search
    setupSearch();
}

function setupFilterControls() {
    // Category filter
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) {
        categorySelect.value = currentFilters.category || '';
        categorySelect.addEventListener('change', function () {
            currentFilters.category = this.value || undefined;
            currentPage = 1;
            updateFilters();
        });
    }

    // Price filters
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');

    if (minPriceInput) {
        minPriceInput.value = currentFilters.minPrice || '';
        minPriceInput.addEventListener('change', function () {
            currentFilters.minPrice = this.value || undefined;
            currentPage = 1;
            updateFilters();
        });
    }

    if (maxPriceInput) {
        maxPriceInput.value = currentFilters.maxPrice || '';
        maxPriceInput.addEventListener('change', function () {
            currentFilters.maxPrice = this.value || undefined;
            currentPage = 1;
            updateFilters();
        });
    }

    // Sort filter
    const sortSelect = document.getElementById('sort-filter');
    if (sortSelect) {
        sortSelect.value = currentFilters.sortBy;
        sortSelect.addEventListener('change', function () {
            currentFilters.sortBy = this.value;
            currentPage = 1;
            updateFilters();
        });
    }

    // Clear filters button
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            currentFilters = {};
            currentPage = 1;
            window.history.replaceState({}, '', 'marketplace.html');
            loadProducts();
            resetFilterControls();
        });
    }
}

function resetFilterControls() {
    const categorySelect = document.getElementById('category-filter');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const sortSelect = document.getElementById('sort-filter');

    if (categorySelect) categorySelect.value = '';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (sortSelect) sortSelect.value = 'createdAt';
}

function updateFilters() {
    const params = new URLSearchParams();

    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            params.set(key, value);
        }
    });

    if (currentPage > 1) {
        params.set('page', currentPage);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `marketplace.html?${queryString}` : 'marketplace.html';

    window.history.replaceState({}, '', newUrl);
    loadProducts();
}

async function loadProducts() {
    const container = document.getElementById('products-container');
    const loading = document.getElementById('products-loading');
    const empty = document.getElementById('products-empty');

    if (!container) return;

    // Show loading
    if (loading) loading.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
    container.innerHTML = '';

    try {
        const filters = { ...currentFilters, page: currentPage, limit: 12 };
        const data = await ProductAPI.getProducts(filters);

        // Hide loading
        if (loading) loading.classList.add('hidden');

        if (data.products.length === 0) {
            if (empty) empty.classList.remove('hidden');
            return;
        }

        // Render products
        data.products.forEach(product => {
            const productCard = ProductAPI.renderProductCard(product);
            container.innerHTML += productCard;
        });

        // Update pagination
        totalPages = data.pagination.pages;
        updatePagination(data.pagination);

    } catch (error) {
        console.error('Error loading products:', error);
        if (loading) loading.classList.add('hidden');
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-gray-600">Failed to load products. Please try again.</p>
            </div>
        `;
    }
}

function updatePagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container) return;

    if (pagination.pages <= 1) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    let html = '';

    // Previous button
    html += `
        <button onclick="changePage(${currentPage - 1})" 
                class="page-link ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.pages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button onclick="changePage(${i})" 
                    class="page-link ${i === currentPage ? 'active' : ''}">
                ${i}
            </button>
        `;
    }

    // Next button
    html += `
        <button onclick="changePage(${currentPage + 1})" 
                class="page-link ${currentPage === pagination.pages ? 'opacity-50 cursor-not-allowed' : ''}"
                ${currentPage === pagination.pages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    currentPage = page;
    updateFilters();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    // Set search value from filters
    if (currentFilters.search) {
        searchInput.value = currentFilters.search;
    }

    // Debounced search
    const debouncedSearch = Utils.debounce(function () {
        currentFilters.search = this.value.trim() || undefined;
        currentPage = 1;
        updateFilters();
    }, 500);

    searchInput.addEventListener('input', debouncedSearch);
}

// Product Detail Page
async function setupProductPage() {
    const productId = Utils.getQueryParam('id');
    if (!productId) {
        window.location.href = 'marketplace.html';
        return;
    }

    try {
        const product = await ProductAPI.getProductById(productId);
        renderProductPage(product);
        setupPurchaseButton(product);
        setupReviews(product);
    } catch (error) {
        document.getElementById('product-container').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
                <h2 class="text-2xl font-bold mb-2">Product Not Found</h2>
                <p class="text-gray-600 mb-6">${error.message}</p>
                <a href="marketplace.html" class="btn btn-primary">Browse Marketplace</a>
            </div>
        `;
    }
}

function renderProductPage(product) {
    const container = document.getElementById('product-container');
    if (!container) return;

    // Check if user has purchased this product
    const user = Auth.getUser();
    const hasPurchased = user && user.purchasedProducts &&
        user.purchasedProducts.includes(product._id);

    const priceDisplay = product.discountPrice ? `
        <div class="flex items-center space-x-4 mb-4">
            <span class="text-4xl font-bold text-green-600">${Utils.formatPrice(product.discountPrice)}</span>
            <span class="text-2xl text-gray-500 line-through">${Utils.formatPrice(product.price)}</span>
            <span class="bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                Save ${Math.round(100 - (product.discountPrice / product.price * 100))}%
            </span>
        </div>
    ` : `<div class="text-4xl font-bold text-green-600 mb-4">${Utils.formatPrice(product.price)}</div>`;

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Left Column -->
            <div>
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <span class="badge badge-${product.license}">${product.license}</span>
                            ${product.featured ? '<span class="badge badge-featured ml-2">Featured</span>' : ''}
                            <span class="badge badge-${product.status} ml-2">${product.status}</span>
                        </div>
                        <div class="text-gray-600">
                            <i class="fas fa-download mr-1"></i> ${product.downloads} downloads
                        </div>
                    </div>
                    
                    <h1 class="text-3xl font-bold mb-4">${product.title}</h1>
                    
                    <div class="flex items-center mb-6">
                        <div class="star-rating text-xl mr-4">
                            ${ProductAPI.renderStars(product.ratings?.average || 0)}
                        </div>
                        <span class="text-gray-600">(${product.ratings?.count || 0} reviews)</span>
                        <span class="mx-4 text-gray-300">•</span>
                        <span class="text-gray-600">Version ${product.version}</span>
                    </div>
                    
                    <div class="mb-6">
                        <img src="${product.thumbnail}" alt="${product.title}" 
                             class="w-full h-96 object-cover rounded-lg">
                    </div>
                    
                    <div class="prose max-w-none mb-6">
                        ${product.description.replace(/\n/g, '<br>')}
                    </div>
                    
                    ${product.systemRequirements ? `
                        <div class="mb-6">
                            <h3 class="text-xl font-bold mb-3">System Requirements</h3>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                ${product.systemRequirements.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Screenshots -->
                    ${product.screenshots && product.screenshots.length > 0 ? `
                        <div class="mb-6">
                            <h3 class="text-xl font-bold mb-3">Screenshots</h3>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                ${product.screenshots.map(screenshot => `
                                    <img src="${screenshot}" 
                                         class="w-full h-48 object-cover rounded-lg cursor-pointer"
                                         onclick="openImageModal('${screenshot}')">
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Reviews Section -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-bold mb-4">Reviews (${product.ratings?.count || 0})</h3>
                    <div id="reviews-container">
                        <!-- Reviews will be loaded here -->
                    </div>
                    ${user && !hasPurchased ? `
                        <p class="text-gray-600 text-center py-4">
                            Purchase this product to leave a review
                        </p>
                    ` : user ? `
                        <div class="mt-6">
                            <h4 class="font-bold mb-3">Add Your Review</h4>
                            <form onsubmit="submitReview(event, '${product._id}')">
                                <div class="mb-4">
                                    <label class="form-label">Rating</label>
                                    <div class="flex space-x-1" id="rating-stars">
                                        ${[1, 2, 3, 4, 5].map(i => `
                                            <i class="far fa-star text-2xl text-yellow-400 cursor-pointer"
                                               data-rating="${i}"
                                               onmouseover="hoverStar(${i})"
                                               onmouseout="resetStars()"
                                               onclick="setRating(${i})"></i>
                                        `).join('')}
                                    </div>
                                    <input type="hidden" id="review-rating" value="5">
                                </div>
                                <div class="mb-4">
                                    <label class="form-label">Title</label>
                                    <input type="text" id="review-title" class="form-input">
                                </div>
                                <div class="mb-4">
                                    <label class="form-label">Comment</label>
                                    <textarea id="review-comment" class="form-input" rows="4" required></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Submit Review</button>
                            </form>
                        </div>
                    ` : `
                        <p class="text-gray-600 text-center py-4">
                            <a href="login.html" class="text-blue-600 hover:underline">Login</a> to leave a review
                        </p>
                    `}
                </div>
            </div>
            
            <!-- Right Column -->
            <div>
                <div class="sticky top-6">
                    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                        ${priceDisplay}
                        
                        ${hasPurchased ? `
                            <div class="text-center mb-6">
                                <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                                <p class="text-lg font-semibold mb-2">You own this product</p>
                                <a href="${product.fileUrl}" 
                                   class="btn btn-success w-full mb-3"
                                   download>
                                    <i class="fas fa-download mr-2"></i> Download Now
                                </a>
                                <p class="text-sm text-gray-600">
                                    File size: ${Utils.formatFileSize(product.fileSize)}
                                </p>
                            </div>
                        ` : `
                            <div class="text-center mb-6">
                                <button id="purchase-btn" 
                                        class="btn btn-success w-full text-lg py-4"
                                        onclick="initiatePurchase('${product._id}')">
                                    <i class="fas fa-shopping-cart mr-2"></i> Purchase Now
                                </button>
                                <p class="text-sm text-gray-600 mt-2">
                                    Secure payment • Instant download • Money-back guarantee
                                </p>
                            </div>
                        `}
                        
                        <div class="border-t pt-6">
                            <h3 class="font-bold mb-3">About the Developer</h3>
                            <div class="flex items-center mb-4">
                                <img src="${product.developer.avatar}" 
                                     alt="${product.developer.username}"
                                     class="w-12 h-12 rounded-full mr-3">
                                <div>
                                    <p class="font-semibold">${product.developer.username}</p>
                                    <p class="text-sm text-gray-600">
                                        Member since ${Utils.formatDate(product.developer.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <a href="marketplace.html?developer=${product.developer._id}"
                               class="text-blue-600 hover:underline text-sm">
                                View all products by this developer
                            </a>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="font-bold mb-3">Product Details</h3>
                        <ul class="space-y-2">
                            <li class="flex justify-between">
                                <span class="text-gray-600">Category:</span>
                                <span class="font-semibold">${product.category}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="text-gray-600">Version:</span>
                                <span>${product.version}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="text-gray-600">License:</span>
                                <span>${product.license}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="text-gray-600">File size:</span>
                                <span>${Utils.formatFileSize(product.fileSize)}</span>
                            </li>
                            <li class="flex justify-between">
                                <span class="text-gray-600">Uploaded:</span>
                                <span>${Utils.formatDate(product.createdAt)}</span>
                            </li>
                            ${product.approvedAt ? `
                                <li class="flex justify-between">
                                    <span class="text-gray-600">Approved:</span>
                                    <span>${Utils.formatDate(product.approvedAt)}</span>
                                </li>
                            ` : ''}
                        </ul>
                        
                        ${product.tags && product.tags.length > 0 ? `
                            <div class="mt-4">
                                <h4 class="font-bold mb-2">Tags</h4>
                                <div class="flex flex-wrap gap-2">
                                    ${product.tags.map(tag => `
                                        <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                            ${tag}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

let selectedRating = 5;

function hoverStar(rating) {
    const stars = document.querySelectorAll('#rating-stars .fa-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

function resetStars() {
    const stars = document.querySelectorAll('#rating-stars .fa-star');
    stars.forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

function setRating(rating) {
    selectedRating = rating;
    document.getElementById('review-rating').value = rating;
    resetStars();
}

async function submitReview(event, productId) {
    event.preventDefault();

    const user = Auth.getUser();
    if (!user) {
        Utils.showAlert('Please login to submit a review', 'error');
        return;
    }

    const rating = selectedRating;
    const title = document.getElementById('review-title').value.trim();
    const comment = document.getElementById('review-comment').value.trim();

    if (!comment) {
        Utils.showAlert('Please enter a review comment', 'error');
        return;
    }

    try {
        await ProductAPI.addReview(productId, {
            rating,
            title,
            comment
        });

        // Reset form
        event.target.reset();
        selectedRating = 5;
        resetStars();

        // Reload reviews
        const product = await ProductAPI.getProductById(productId);
        setupReviews(product);

    } catch (error) {
        // Error already shown
    }
}

function setupReviews(product) {
    const container = document.getElementById('reviews-container');
    if (!container || !product.reviews || product.reviews.length === 0) {
        if (container) {
            container.innerHTML = '<p class="text-gray-600 text-center py-4">No reviews yet. Be the first!</p>';
        }
        return;
    }

    const reviewsHtml = product.reviews.map(review => `
        <div class="border-b pb-4 mb-4">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <img src="${review.user.avatar}" 
                         alt="${review.user.username}"
                         class="w-10 h-10 rounded-full mr-3">
                    <div>
                        <p class="font-semibold">${review.user.username}</p>
                        <div class="star-rating text-sm">
                            ${ProductAPI.renderStars(review.rating)}
                        </div>
                    </div>
                </div>
                <span class="text-sm text-gray-500">${Utils.formatDate(review.createdAt)}</span>
            </div>
            ${review.title ? `<h5 class="font-bold mb-2">${review.title}</h5>` : ''}
            <p class="text-gray-700">${review.comment}</p>
            <div class="mt-2 flex items-center">
                <button class="text-sm text-gray-500 hover:text-blue-600">
                    <i class="far fa-thumbs-up mr-1"></i> Helpful (${review.helpful || 0})
                </button>
                <button class="text-sm text-gray-500 hover:text-red-600 ml-4">
                    <i class="far fa-flag mr-1"></i> Report
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = reviewsHtml;
}

function setupPurchaseButton(product) {
    const purchaseBtn = document.getElementById('purchase-btn');
    if (!purchaseBtn) return;

    // Check if Stripe is available
    if (typeof Stripe === 'undefined') {
        // Load Stripe.js
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => setupStripe(product);
        document.head.appendChild(script);
    } else {
        setupStripe(product);
    }
}

let stripe = null;

async function setupStripe(product) {
    if (!stripe) {
        stripe = Stripe('pk_test_your_publishable_key'); // Replace with your key
    }

    const purchaseBtn = document.getElementById('purchase-btn');
    purchaseBtn.addEventListener('click', async () => {
        await initiatePurchase(product._id);
    });
}

async function initiatePurchase(productId) {
    try {
        const user = Auth.getUser();
        if (!user) {
            Utils.showAlert('Please login to make a purchase', 'warning');
            window.location.href = 'login.html';
            return;
        }

        // Create payment intent
        const paymentData = await PaymentAPI.createPaymentIntent(productId);

        // Show payment modal
        showPaymentModal(paymentData);

    } catch (error) {
        console.error('Purchase error:', error);
        // Error already shown
    }
}

function showPaymentModal(paymentData) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">Complete Purchase</h3>
                    <button onclick="closePaymentModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <p class="font-semibold">Amount to pay:</p>
                        <p class="text-2xl font-bold text-green-600">${Utils.formatPrice(paymentData.amount)}</p>
                    </div>
                    
                    <form id="payment-form">
                        <div class="mb-4">
                            <label class="form-label">Card Information</label>
                            <div id="card-element" class="p-3 border rounded-lg"></div>
                            <div id="card-errors" class="text-red-600 text-sm mt-2"></div>
                        </div>
                        
                        <button type="submit" id="submit-payment" class="btn btn-success w-full py-3">
                            Pay ${Utils.formatPrice(paymentData.amount)}
                        </button>
                    </form>
                </div>
                
                <div class="text-center text-sm text-gray-500">
                    <p>Secure payment processed by Stripe</p>
                    <p>Your card details are never stored on our servers</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Setup Stripe Elements
    const elements = stripe.elements();
    const card = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#32325d',
                '::placeholder': {
                    color: '#aab7c4'
                }
            }
        }
    });

    card.mount('#card-element');

    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitBtn = document.getElementById('submit-payment');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner spinner-sm"></div> Processing...';

        const { error, paymentIntent } = await stripe.confirmCardPayment(
            paymentData.clientSecret,
            {
                payment_method: {
                    card: card
                }
            }
        );

        if (error) {
            document.getElementById('card-errors').textContent = error.message;
            submitBtn.disabled = false;
            submitBtn.textContent = `Pay ${Utils.formatPrice(paymentData.amount)}`;
        } else if (paymentIntent.status === 'succeeded') {
            Utils.showAlert('Payment successful! Download will start automatically.', 'success');
            closePaymentModal();

            // Refresh page to show download button
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    });
}

function closePaymentModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function openImageModal(src) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <div class="p-4">
                <div class="flex justify-end mb-2">
                    <button onclick="closeImageModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <img src="${src}" class="w-full rounded-lg">
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeImageModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Expose functions to window
window.changePage = changePage;
window.hoverStar = hoverStar;
window.resetStars = resetStars;
window.setRating = setRating;
window.submitReview = submitReview;
window.initiatePurchase = initiatePurchase;
window.closePaymentModal = closePaymentModal;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;