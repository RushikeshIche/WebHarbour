// WebHarbour Main JavaScript File

const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;

// Utility Functions
class Utils {
    static showLoading() {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    }

    static hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    static showAlert(message, type = 'info', duration = 5000) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;

        const icon = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        }[type];

        alertDiv.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="ml-auto text-gray-500 hover:text-gray-700" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        const container = document.querySelector('nav') || document.body;
        container.insertAdjacentElement('afterend', alertDiv);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.remove();
                }
            }, duration);
        }

        return alertDiv;
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setQueryParam(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    }
}

// Auth Functions
class Auth {
    static async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            currentUser = null;
            this.updateAuthUI();
            return null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                this.updateAuthUI();
                return data.user;
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                currentUser = null;
                this.updateAuthUI();
                return null;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            currentUser = null;
            this.updateAuthUI();
            return null;
        }
    }

    static updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        if (!authButtons) return;

        if (currentUser) {
            authButtons.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="relative group">
                        <button class="flex items-center space-x-2">
                            <img src="${currentUser.avatar}" alt="${currentUser.username}" 
                                 class="w-8 h-8 rounded-full">
                            <span class="hidden md:inline">${currentUser.username}</span>
                            <i class="fas fa-chevron-down text-sm"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block z-50">
                            <a href="pages/dashboard.html" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                            </a>
                            <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-shopping-bag mr-2"></i>My Purchases
                            </a>
                            <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-upload mr-2"></i>My Uploads
                            </a>
                            ${currentUser.role === 'admin' ? `
                            <a href="pages/admin.html" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-cog mr-2"></i>Admin Panel
                            </a>
                            ` : ''}
                            <hr class="my-2">
                            <button onclick="Auth.logout()" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">
                                <i class="fas fa-sign-out-alt mr-2"></i>Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            authButtons.innerHTML = `
                <div class="flex space-x-3">
                    <a href="pages/login.html" class="px-4 py-2 text-blue-600 hover:text-blue-800">Login</a>
                    <a href="pages/login.html?register=true" 
                       class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Sign Up
                    </a>
                </div>
            `;
        }
    }

    static async login(email, password) {
        try {
            Utils.showLoading();
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                Utils.showAlert('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    static async register(userData) {
        try {
            Utils.showLoading();
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                Utils.showAlert('Registration successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        this.updateAuthUI();
        Utils.showAlert('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static getUser() {
        if (!currentUser) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                currentUser = JSON.parse(userStr);
            }
        }
        return currentUser;
    }

    static isAdmin() {
        return currentUser?.role === 'admin';
    }

    static isDeveloper() {
        return currentUser?.role === 'developer' || currentUser?.role === 'admin';
    }

    static async updateProfile(updates) {
        try {
            const token = this.getToken();
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                Utils.showAlert('Profile updated successfully!', 'success');
                return data.user;
            } else {
                throw new Error(data.message || 'Update failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        }
    }
}

// Product Functions
class ProductAPI {
    static async getFeaturedProducts(limit = 8) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/featured/random`);
            const data = await response.json();

            if (data.success) {
                return data.products.slice(0, limit);
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }
    }

    static async getProducts(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_BASE_URL}/products?${params}`);
            const data = await response.json();

            if (data.success) {
                return data;
            } else {
                return { products: [], pagination: { total: 0, pages: 0 } };
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            return { products: [], pagination: { total: 0, pages: 0 } };
        }
    }

    static async getProductById(id) {
        try {
            const token = Auth.getToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${API_BASE_URL}/products/${id}`, { headers });
            const data = await response.json();

            if (data.success) {
                return data.product;
            } else {
                throw new Error(data.message || 'Product not found');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    static async searchProducts(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/search/suggestions?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                return data.suggestions;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    static async addReview(productId, reviewData) {
        try {
            const token = Auth.getToken();
            if (!token) {
                throw new Error('Please login to add a review');
            }

            const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reviewData)
            });

            const data = await response.json();

            if (data.success) {
                Utils.showAlert('Review added successfully!', 'success');
                return data.review;
            } else {
                throw new Error(data.message || 'Failed to add review');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        }
    }

    static renderProductCard(product) {
        const discountBadge = product.discountPrice ? `
            <div class="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Save ${Math.round(100 - (product.discountPrice / product.price * 100))}%
            </div>
        ` : '';

        const priceDisplay = product.discountPrice ? `
            <div class="flex items-center space-x-2">
                <span class="text-2xl font-bold text-green-600">${Utils.formatPrice(product.discountPrice)}</span>
                <span class="text-lg text-gray-500 line-through">${Utils.formatPrice(product.price)}</span>
            </div>
        ` : `<div class="text-2xl font-bold text-green-600">${Utils.formatPrice(product.price)}</div>`;

        return `
            <div class="product-card">
                <div class="relative overflow-hidden">
                    ${discountBadge}
                    <img src="${product.thumbnail}" alt="${product.title}" 
                         class="w-full h-48 object-cover">
                </div>
                <div class="p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="badge badge-${product.license}">${product.license}</span>
                        ${product.featured ? '<span class="badge badge-featured">Featured</span>' : ''}
                    </div>
                    <h3 class="font-bold text-lg mb-2 truncate">${product.title}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${product.description.substring(0, 100)}...</p>
                    
                    <div class="flex items-center justify-between mb-4">
                        <div class="star-rating">
                            ${this.renderStars(product.ratings?.average || 0)}
                            <span class="text-gray-600 text-sm ml-2">(${product.ratings?.count || 0})</span>
                        </div>
                        <span class="text-gray-600 text-sm">
                            <i class="fas fa-download mr-1"></i>${product.downloads || 0}
                        </span>
                    </div>
                    
                    ${priceDisplay}
                    
                    <div class="mt-4 flex space-x-2">
                        <a href="pages/product.html?id=${product._id}" 
                           class="btn btn-primary flex-1 text-center">
                            View Details
                        </a>
                        <button onclick="ProductAPI.addToCart('${product._id}')" 
                                class="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    static renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    }
}

// Upload Functions
class UploadAPI {
    static async uploadFile(file, category) {
        try {
            Utils.showLoading();
            const token = Auth.getToken();

            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);

            const response = await fetch(`${API_BASE_URL}/upload/file`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                Utils.showAlert('File uploaded successfully!', 'success');
                return data;
            } else {
                throw new Error(data.message || 'File upload failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    static async uploadThumbnail(file) {
        try {
            Utils.showLoading();
            const token = Auth.getToken();

            const formData = new FormData();
            formData.append('thumbnail', file);

            const response = await fetch(`${API_BASE_URL}/upload/thumbnail`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                Utils.showAlert('Thumbnail uploaded!', 'success');
                return data.thumbnailUrl;
            } else {
                throw new Error(data.message || 'Thumbnail upload failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    static async uploadScreenshots(files) {
        try {
            Utils.showLoading();
            const token = Auth.getToken();

            const formData = new FormData();
            files.forEach(file => {
                formData.append('screenshots', file);
            });

            const response = await fetch(`${API_BASE_URL}/upload/screenshots`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                Utils.showAlert(`${data.count} screenshot(s) uploaded!`, 'success');
                return data.screenshotUrls;
            } else {
                throw new Error(data.message || 'Screenshots upload failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    static async submitProduct(productData) {
        try {
            Utils.showLoading();
            const token = Auth.getToken();

            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (data.success) {
                Utils.showAlert('Product submitted for review!', 'success');
                return data.product;
            } else {
                throw new Error(data.message || 'Product submission failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    static async getMyUploads() {
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_BASE_URL}/upload/my-uploads`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                return data.products;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching uploads:', error);
            return [];
        }
    }
}

// Payment Functions
class PaymentAPI {
    static async createPaymentIntent(productId) {
        try {
            Utils.showLoading();
            const token = Auth.getToken();

            const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });

            const data = await response.json();

            if (data.success) {
                return data;
            } else {
                throw new Error(data.message || 'Payment setup failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    static async getMyOrders() {
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_BASE_URL}/payments/my-orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                return data.orders;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    }
}

// Admin Functions
class AdminAPI {
    static async getPendingProducts() {
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_BASE_URL}/admin/pending-products`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                return data;
            } else {
                return { products: [], pagination: { total: 0 } };
            }
        } catch (error) {
            console.error('Error fetching pending products:', error);
            return { products: [], pagination: { total: 0 } };
        }
    }

    static async approveProduct(productId) {
        try {
            Utils.showLoading();
            const token = Auth.getToken();

            const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                Utils.showAlert('Product approved successfully!', 'success');
                return data.product;
            } else {
                throw new Error(data.message || 'Approval failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    static async rejectProduct(productId, reason) {
        try {
            Utils.showLoading();
            const token = Auth.getToken();

            const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            const data = await response.json();

            if (data.success) {
                Utils.showAlert('Product rejected', 'success');
                return data.product;
            } else {
                throw new Error(data.message || 'Rejection failed');
            }
        } catch (error) {
            Utils.showAlert(error.message, 'error');
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    static async getDashboardStats() {
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                return data;
            } else {
                throw new Error('Failed to fetch dashboard stats');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    await Auth.checkAuth();

    // Load featured products on homepage
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        await loadFeaturedProducts();
        await loadStats();
    }

    // Initialize search functionality
    initializeSearch();
});

async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;

    try {
        const products = await ProductAPI.getFeaturedProducts();

        if (products.length > 0) {
            container.innerHTML = products.map(product =>
                ProductAPI.renderProductCard(product)
            ).join('');
        } else {
            container.innerHTML = '<p class="text-center col-span-4 text-gray-600">No featured products available.</p>';
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        container.innerHTML = '<p class="text-center col-span-4 text-red-600">Failed to load featured products.</p>';
    }
}

async function loadStats() {
    // Update stats with dummy data (in real app, fetch from API)
    document.getElementById('total-products').textContent = '1,234';
    document.getElementById('total-developers').textContent = '567';
    document.getElementById('total-downloads').textContent = '89,012';
    document.getElementById('satisfaction-rate').textContent = '98%';
}

function initializeSearch() {
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
        searchInput.addEventListener('keypress', async function (e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query.length >= 2) {
                    window.location.href = `pages/marketplace.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

// Global functions for HTML onclick events
window.Auth = Auth;
window.ProductAPI = ProductAPI;
window.UploadAPI = UploadAPI;
window.PaymentAPI = PaymentAPI;
window.AdminAPI = AdminAPI;
window.Utils = Utils;

// Add to cart function
window.addToCart = function (productId) {
    if (!Auth.getUser()) {
        Utils.showAlert('Please login to add items to cart', 'warning');
        window.location.href = 'pages/login.html';
        return;
    }

    // TODO: Implement cart functionality
    Utils.showAlert('Added to cart!', 'success');
};