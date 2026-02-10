// ==================== CONFIGURATION ====================

const API_BASE = 'http://localhost:5000/api';
let currentPage = 1;
let currentCategory = '';
let currentSearch = '';
let cart = [];
let currentUser = null;
let allProducts = [];

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    checkUserAuth();
    loadProducts();
    attachEventListeners();
});

// ==================== EVENT LISTENERS ====================

function attachEventListeners() {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                closeLoginModal();
                updateAuthUI();
                showToast('Login successful!', 'success');
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    });

    // Register Form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                closeRegisterModal();
                updateAuthUI();
                showToast('Registration successful!', 'success');
            } else {
                showToast(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    });

    // Upload Form
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            showToast('Please login first', 'error');
            return;
        }

        const title = document.getElementById('productTitle').value;
        const description = document.getElementById('productDesc').value;
        const category = document.getElementById('productCategory').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const thumbnail = document.getElementById('productThumbnail').value;
        const fileUrl = document.getElementById('productFile').value;
        const tagsStr = document.getElementById('productTags').value;
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];

        try {
            const response = await fetch(`${API_BASE}/products/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    price,
                    thumbnail,
                    fileUrl,
                    tags
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Product submitted for review! You\'ll be notified when it\'s approved.', 'success');
                document.getElementById('uploadForm').reset();
                setTimeout(() => goToDashboard(), 1500);
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    });

    // Search and Filter
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        loadProducts();
    });

    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentCategory = e.target.value;
        currentPage = 1;
        loadProducts();
    });

    // Cart Button
    document.getElementById('cartBtn').addEventListener('click', goToCart);
}

// ==================== AUTH FUNCTIONS ====================

async function checkUserAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                currentUser = JSON.parse(user);
                updateAuthUI();
            } else {
                logout();
            }
        } catch (error) {
            logout();
        }
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');

    if (currentUser) {
        authButtons.classList.add('hidden');
        userMenu.classList.remove('hidden');
        document.getElementById('userAvatar').src = currentUser.profileImage || `https://ui-avatars.com/api/?name=${currentUser.username}`;
    } else {
        authButtons.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
}

function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.remove('hidden');
}

function closeRegisterModal() {
    document.getElementById('registerModal').classList.add('hidden');
    document.getElementById('registerForm').reset();
}

function switchToLogin() {
    closeRegisterModal();
    showLoginModal();
}

function switchToRegister() {
    closeLoginModal();
    showRegisterModal();
}

function toggleUserMenu() {
    document.getElementById('dropdownMenu').classList.toggle('hidden');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateAuthUI();
    goHome();
    showToast('Logged out successfully', 'success');
}

// ==================== PRODUCT FUNCTIONS ====================

async function loadProducts(page = 1) {
    try {
        const params = new URLSearchParams({
            page,
            limit: 12,
            ...(currentCategory && { category: currentCategory }),
            ...(currentSearch && { search: currentSearch })
        });

        const response = await fetch(`${API_BASE}/products?${params}`);
        const data = await response.json();

        allProducts = data.products;
        renderProducts(data.products);
        renderPagination(data.pages, page);
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');

    if (products.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-400">No products found</p>';
        return;
    }

    container.innerHTML = products.map(product => `
    <div class="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-blue-500 cursor-pointer transform hover:scale-105 transition-all duration-300" onclick="viewProduct('${product._id}')">
      <div class="relative">
        <img src="${product.thumbnail}" alt="${product.title}" class="w-full h-40 object-cover">
        <span class="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">${product.category}</span>
        <span class="absolute bottom-2 left-2 bg-gray-900 text-white px-3 py-1 rounded-full text-sm">$${product.price.toFixed(2)}</span>
      </div>
      <div class="p-4">
        <h4 class="text-lg font-semibold mb-2 line-clamp-2">${product.title}</h4>
        <p class="text-gray-400 text-sm line-clamp-2 mb-4">${product.description}</p>
        <div class="flex justify-between items-center text-sm text-gray-400">
          <span><i class="fas fa-download"></i> ${product.downloads} downloads</span>
          <span><i class="fas fa-star text-yellow-400"></i> ${product.rating.toFixed(1)}</span>
        </div>
        <div class="mt-4 flex items-center space-x-2">
          <img src="${product.developer.profileImage || `https://ui-avatars.com/api/?name=${product.developer.username}`}" alt="${product.developer.username}" class="w-6 h-6 rounded-full">
          <span class="text-sm text-gray-400">${product.developer.username}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPagination(pages, currentPage) {
    const pagination = document.getElementById('pagination');

    if (pages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    if (currentPage > 1) {
        html += `<button onclick="loadProducts(${currentPage - 1})" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">Previous</button>`;
    }

    for (let i = Math.max(1, currentPage - 2); i <= Math.min(pages, currentPage + 2); i++) {
        if (i === currentPage) {
            html += `<button class="px-4 py-2 bg-blue-600 text-white rounded-lg">${i}</button>`;
        } else {
            html += `<button onclick="loadProducts(${i})" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">${i}</button>`;
        }
    }

    if (currentPage < pages) {
        html += `<button onclick="loadProducts(${currentPage + 1})" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">Next</button>`;
    }

    pagination.innerHTML = html;
}

async function viewProduct(productId) {
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`);
        const data = await response.json();

        const product = data;
        const reviews = data.reviews || [];

        const detailHtml = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
        <div>
          <img src="${product.thumbnail}" alt="${product.title}" class="w-full rounded-lg mb-4">
          <button onclick="addToCart('${product._id}', '${product.title}', ${product.price}, '${product.thumbnail}')" 
                  class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg mb-2">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
          ${product.price === 0 ? `<button onclick="downloadProduct('${product.fileUrl}', '${product.title}')" class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
            <i class="fas fa-download"></i> Download Free
          </button>` : ''}
        </div>

        <div class="col-span-2">
          <h1 class="text-4xl font-bold mb-4">${product.title}</h1>
          
          <div class="flex items-center space-x-4 mb-6">
            <img src="${product.developer.profileImage || `https://ui-avatars.com/api/?name=${product.developer.username}`}" alt="${product.developer.username}" class="w-12 h-12 rounded-full">
            <div>
              <p class="font-semibold">${product.developer.username}</p>
              <p class="text-gray-400 text-sm">${product.developer.bio || 'Developer'}</p>
            </div>
          </div>

          <div class="bg-gray-700 p-6 rounded-lg mb-6">
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p class="text-gray-400">Price</p>
                <p class="text-2xl font-bold">$${product.price.toFixed(2)}</p>
              </div>
              <div>
                <p class="text-gray-400">Downloads</p>
                <p class="text-2xl font-bold">${product.downloads}</p>
              </div>
              <div>
                <p class="text-gray-400">Rating</p>
                <p class="text-2xl font-bold"><i class="fas fa-star text-yellow-400"></i> ${product.rating.toFixed(1)}</p>
              </div>
            </div>
            <p class="text-sm text-gray-300"><span class="bg-blue-600 px-3 py-1 rounded-full">${product.category}</span></p>
          </div>

          <div class="mb-6">
            <h3 class="text-xl font-semibold mb-3">Description</h3>
            <p class="text-gray-300 leading-relaxed">${product.description}</p>
          </div>

          ${product.tags.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-3">Tags</h3>
              <div class="flex flex-wrap gap-2">
                ${product.tags.map(tag => `<span class="bg-gray-700 px-3 py-1 rounded-full text-sm">${tag}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <hr class="border-gray-700 my-6">

          <div>
            <h3 class="text-xl font-semibold mb-4">Reviews</h3>
            
            ${currentUser ? `
              <div class="bg-gray-700 p-4 rounded-lg mb-6">
                <h4 class="font-semibold mb-3">Leave a Review</h4>
                <form onsubmit="submitReview(event, '${product._id}')">
                  <div class="mb-3">
                    <select id="reviewRating" required class="w-full px-3 py-2 bg-gray-600 text-white rounded-lg">
                      <option value="">Select Rating</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Fair</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Very Good</option>
                      <option value="5">5 - Excellent</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <textarea id="reviewComment" required placeholder="Your review..." rows="3" class="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                  <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Submit Review</button>
                </form>
              </div>
            ` : ''}

            <div class="space-y-4">
              ${reviews.length > 0 ? reviews.map(review => `
                <div class="bg-gray-700 p-4 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2">
                      <img src="${review.user.profileImage || `https://ui-avatars.com/api/?name=${review.user.username}`}" alt="${review.user.username}" class="w-6 h-6 rounded-full">
                      <span class="font-semibold">${review.user.username}</span>
                    </div>
                    <span class="text-yellow-400"><i class="fas fa-star"></i> ${review.rating}/5</span>
                  </div>
                  <p class="text-gray-300">${review.comment}</p>
                </div>
              `).join('') : '<p class="text-gray-400">No reviews yet. Be the first!</p>'}
            </div>
          </div>
        </div>
      </div>
    `;

        document.getElementById('productDetail').innerHTML = detailHtml;
        document.getElementById('homeSection').classList.add('hidden');
        document.getElementById('productDetailSection').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Failed to load product', 'error');
    }
}

async function submitReview(event, productId) {
    event.preventDefault();

    if (!currentUser) {
        showToast('Please login to review', 'error');
        return;
    }

    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value;

    try {
        const response = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ productId, rating, comment })
        });

        if (response.ok) {
            showToast('Review submitted!', 'success');
            document.getElementById('reviewRating').value = '';
            document.getElementById('reviewComment').value = '';
            viewProduct(productId); // Reload product
        } else {
            showToast('Failed to submit review', 'error');
        }
    } catch (error) {
        showToast('Network error', 'error');
    }
}

// ==================== CART FUNCTIONS ====================

function addToCart(productId, title, price, thumbnail) {
    if (price === 0) {
        showToast('This product is free. Download directly!', 'info');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, title, price, thumbnail, quantity: 1 });
    }

    saveCart();
    updateCartCount();
    showToast(`${title} added to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    showToast('Item removed from cart', 'success');
    goToCart();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
    updateCartCount();
}

async function checkout() {
    if (!currentUser) {
        showToast('Please login to checkout', 'error');
        return;
    }

    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }

    try {
        for (const item of cart) {
            await fetch(`${API_BASE}/purchases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ productId: item.id })
            });
        }

        cart = [];
        saveCart();
        updateCartCount();
        showToast('Purchase successful!', 'success');
        goToPurchases();
    } catch (error) {
        showToast('Purchase failed', 'error');
    }
}

// ==================== DASHBOARD FUNCTIONS ====================

async function loadDashboard() {
    if (!currentUser) {
        showToast('Please login first', 'error');
        goHome();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/user/products`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const products = await response.json();

        const totalProducts = products.length;
        const totalDownloads = products.reduce((sum, p) => sum + p.downloads, 0);
        const avgRating = products.length > 0 ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1) : 0;
        const pendingProducts = products.filter(p => p.status === 'pending').length;

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalDownloads').textContent = totalDownloads;
        document.getElementById('avgRating').textContent = avgRating;
        document.getElementById('pendingProducts').textContent = pendingProducts;

        const userProductsHtml = products.map(product => `
      <div class="bg-gray-800 rounded-lg overflow-hidden p-4">
        <img src="${product.thumbnail}" alt="${product.title}" class="w-full h-32 object-cover rounded-lg mb-3">
        <h4 class="font-semibold mb-2 line-clamp-1">${product.title}</h4>
        <p class="text-sm text-gray-400 mb-3">
          <span class="inline-block bg-${product.status === 'approved' ? 'green' : product.status === 'rejected' ? 'red' : 'yellow'}-600 px-2 py-1 rounded text-xs">${product.status}</span>
        </p>
        <p class="text-sm text-gray-400 mb-2">$${product.price.toFixed(2)} • ${product.downloads} downloads</p>
        ${product.rejectionReason ? `<p class="text-red-400 text-xs mb-2">Reason: ${product.rejectionReason}</p>` : ''}
      </div>
    `).join('');

        document.getElementById('userProductsContainer').innerHTML = userProductsHtml || '<p class="text-gray-400">No products yet. Create one!</p>';
    } catch (error) {
        showToast('Failed to load dashboard', 'error');
    }
}

async function loadPurchases() {
    if (!currentUser) {
        showToast('Please login first', 'error');
        goHome();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/purchases`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const purchases = await response.json();

        const purchasesHtml = purchases.map(purchase => `
      <div class="bg-gray-800 rounded-lg overflow-hidden">
        <img src="${purchase.product.thumbnail}" alt="${purchase.product.title}" class="w-full h-40 object-cover">
        <div class="p-4">
          <h4 class="font-semibold mb-2">${purchase.product.title}</h4>
          <p class="text-sm text-gray-400 mb-3">Price: $${purchase.price.toFixed(2)}</p>
          <p class="text-xs text-gray-500 mb-3">Purchased on ${new Date(purchase.createdAt).toLocaleDateString()}</p>
          <a href="${purchase.product.fileUrl}" target="_blank" class="w-full block text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
            <i class="fas fa-download"></i> Download
          </a>
        </div>
      </div>
    `).join('');

        document.getElementById('purchasesContainer').innerHTML = purchasesHtml || '<p class="text-gray-400">No purchases yet.</p>';
    } catch (error) {
        showToast('Failed to load purchases', 'error');
    }
}

// ==================== NAVIGATION FUNCTIONS ====================

function goHome() {
    hideAllSections();
    document.getElementById('homeSection').classList.remove('hidden');
    loadProducts();
}

function scrollToProducts() {
    const element = document.getElementById('productsContainer');
    element.scrollIntoView({ behavior: 'smooth' });
}

function goToDashboard() {
    hideAllSections();
    document.getElementById('dashboardSection').classList.remove('hidden');
    loadDashboard();
    closeDropdown();
}

function goToUpload() {
    hideAllSections();
    document.getElementById('uploadSection').classList.remove('hidden');
    closeDropdown();
}

function goToPurchases() {
    hideAllSections();
    document.getElementById('purchasesSection').classList.remove('hidden');
    loadPurchases();
    closeDropdown();
}

function goToCart() {
    hideAllSections();
    document.getElementById('cartSection').classList.remove('hidden');
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartContainer');

    if (cart.length === 0) {
        container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-shopping-cart text-6xl text-gray-600 mb-4"></i>
        <p class="text-gray-400 mb-6">Your cart is empty</p>
        <button onclick="goHome()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
          Continue Shopping
        </button>
      </div>
    `;
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const cartHtml = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-2">
        ${cart.map(item => `
          <div class="bg-gray-700 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <img src="${item.thumbnail}" alt="${item.title}" class="w-20 h-20 object-cover rounded">
              <div>
                <h4 class="font-semibold">${item.title}</h4>
                <p class="text-gray-400">$${item.price.toFixed(2)} x ${item.quantity}</p>
              </div>
            </div>
            <button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-400">
              <i class="fas fa-trash text-xl"></i>
            </button>
          </div>
        `).join('')}
      </div>

      <div class="bg-gray-700 rounded-lg p-6 h-fit">
        <h3 class="text-xl font-semibold mb-4">Order Summary</h3>
        <div class="space-y-3 mb-6 pb-6 border-b border-gray-600">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Tax (10%)</span>
            <span>$${(total * 0.1).toFixed(2)}</span>
          </div>
        </div>
        <div class="flex justify-between text-lg font-bold mb-6">
          <span>Total</span>
          <span>$${(total * 1.1).toFixed(2)}</span>
        </div>
        <button onclick="checkout()" class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg mb-2">
          Checkout
        </button>
        <button onclick="goHome()" class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg">
          Continue Shopping
        </button>
      </div>
    </div>
  `;

    container.innerHTML = cartHtml;
}

function downloadProduct(fileUrl, title) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = title;
    link.click();
    showToast(`Downloading ${title}...`, 'success');
}

function hideAllSections() {
    document.getElementById('homeSection').classList.add('hidden');
    document.getElementById('productDetailSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('purchasesSection').classList.add('hidden');
    document.getElementById('cartSection').classList.add('hidden');
}

function closeDropdown() {
    document.getElementById('dropdownMenu').classList.add('hidden');
}

// ==================== UTILITY FUNCTIONS ====================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden', 'bg-red-600', 'bg-green-600', 'bg-blue-600');

    if (type === 'error') {
        toast.classList.add('bg-red-600');
    } else if (type === 'success') {
        toast.classList.add('bg-green-600');
    } else {
        toast.classList.add('bg-blue-600');
    }

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');

    if (e.target === loginModal) closeLoginModal();
    if (e.target === registerModal) closeRegisterModal();
});
