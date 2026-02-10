// Admin panel functionality

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.includes('admin.html')) {
        checkAdminAccess();
        setupAdminPanel();
    }
});

function checkAdminAccess() {
    const user = Auth.getUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

async function setupAdminPanel() {
    if (!checkAdminAccess()) return;

    // Load admin sections
    await loadDashboardStats();
    await loadPendingProducts();

    // Setup navigation
    setupAdminNavigation();
}

function setupAdminNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const sections = document.querySelectorAll('.admin-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('data-target');

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Show target section
            sections.forEach(section => {
                section.classList.add('hidden');
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                }
            });

            // Load section data
            switch (targetId) {
                case 'dashboard':
                    loadDashboardStats();
                    break;
                case 'pending':
                    loadPendingProducts();
                    break;
                case 'products':
                    loadAllProducts();
                    break;
                case 'users':
                    loadAllUsers();
                    break;
                case 'orders':
                    loadAllOrders();
                    break;
            }
        });
    });
}

async function loadDashboardStats() {
    const container = document.getElementById('dashboard-stats');
    if (!container) return;

    try {
        const data = await AdminAPI.getDashboardStats();

        // Update stats cards
        document.getElementById('stat-total-users').textContent = data.stats.totalUsers;
        document.getElementById('stat-total-products').textContent = data.stats.totalProducts;
        document.getElementById('stat-pending-products').textContent = data.stats.pendingProducts;
        document.getElementById('stat-total-orders').textContent = data.stats.totalOrders;
        document.getElementById('stat-today-orders').textContent = data.stats.todayOrders;
        document.getElementById('stat-total-revenue').textContent =
            Utils.formatPrice(data.stats.totalRevenue);

        // Recent activities
        const activitiesContainer = document.getElementById('recent-activities');
        if (activitiesContainer) {
            const activities = [
                ...data.recent.products.map(p => ({
                    type: 'product',
                    title: `${p.title} uploaded by ${p.developer?.username}`,
                    time: Utils.formatDate(p.createdAt)
                })),
                ...data.recent.orders.map(o => ({
                    type: 'order',
                    title: `Order #${o.orderId} by ${o.user?.username}`,
                    time: Utils.formatDate(o.createdAt)
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

            activitiesContainer.innerHTML = activities.map(activity => `
                <div class="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center 
                                    ${activity.type === 'product' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}">
                            <i class="fas fa-${activity.type === 'product' ? 'upload' : 'shopping-cart'}"></i>
                        </div>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">${activity.title}</p>
                        <p class="text-xs text-gray-500">${activity.time}</p>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
                <p class="text-gray-600">Failed to load dashboard data</p>
            </div>
        `;
    }
}

async function loadPendingProducts() {
    const container = document.getElementById('pending-products-container');
    if (!container) return;

    try {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="spinner"></div>
                <p class="mt-2 text-gray-600">Loading pending products...</p>
            </div>
        `;

        const data = await AdminAPI.getPendingProducts();

        if (data.products.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-check-circle text-green-500 text-4xl mb-3"></i>
                    <p class="text-gray-600">No pending products to review</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.products.map(product => `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-start space-x-4">
                        <img src="${product.thumbnail}" 
                             alt="${product.title}"
                             class="w-24 h-24 object-cover rounded-lg">
                        <div>
                            <h3 class="font-bold text-lg">${product.title}</h3>
                            <p class="text-gray-600 text-sm mb-2">by ${product.developer?.username}</p>
                            <div class="flex items-center space-x-2">
                                <span class="badge badge-${product.category}">${product.category}</span>
                                <span class="text-gray-600">${Utils.formatPrice(product.price)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="badge badge-pending">Pending</span>
                        <p class="text-sm text-gray-500 mt-1">${Utils.formatDate(product.createdAt)}</p>
                    </div>
                </div>
                
                <p class="text-gray-700 mb-4 line-clamp-2">${product.description}</p>
                
                <div class="flex items-center justify-between">
                    <div class="space-x-2">
                        <button onclick="viewProductDetails('${product._id}')" 
                                class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            <i class="fas fa-eye mr-1"></i> View Details
                        </button>
                        <a href="${product.fileUrl}" target="_blank" 
                           class="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                            <i class="fas fa-download mr-1"></i> Download File
                        </a>
                    </div>
                    
                    <div class="space-x-2">
                        <button onclick="approveProduct('${product._id}')" 
                                class="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                            <i class="fas fa-check mr-1"></i> Approve
                        </button>
                        <button onclick="showRejectModal('${product._id}')" 
                                class="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                            <i class="fas fa-times mr-1"></i> Reject
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading pending products:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
                <p class="text-gray-600">Failed to load pending products</p>
            </div>
        `;
    }
}

async function viewProductDetails(productId) {
    try {
        const product = await ProductAPI.getProductById(productId);

        // Show modal with product details
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content max-w-4xl">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold">Product Details</h3>
                        <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <img src="${product.thumbnail}" 
                                 alt="${product.title}"
                                 class="w-full h-64 object-cover rounded-lg mb-4">
                            <h4 class="font-bold mb-2">Screenshots</h4>
                            <div class="grid grid-cols-3 gap-2">
                                ${product.screenshots?.map(screenshot => `
                                    <img src="${screenshot}" 
                                         class="w-full h-24 object-cover rounded">
                                `).join('') || 'No screenshots'}
                            </div>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold mb-2">${product.title}</h2>
                            <p class="text-gray-600 mb-4">by ${product.developer?.username}</p>
                            
                            <div class="mb-4">
                                <h4 class="font-bold mb-1">Description</h4>
                                <p class="text-gray-700">${product.description}</p>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <h4 class="font-bold mb-1">Category</h4>
                                    <p>${product.category}</p>
                                </div>
                                <div>
                                    <h4 class="font-bold mb-1">Price</h4>
                                    <p>${Utils.formatPrice(product.price)}</p>
                                </div>
                                <div>
                                    <h4 class="font-bold mb-1">Version</h4>
                                    <p>${product.version}</p>
                                </div>
                                <div>
                                    <h4 class="font-bold mb-1">File Size</h4>
                                    <p>${Utils.formatFileSize(product.fileSize)}</p>
                                </div>
                            </div>
                            
                            ${product.systemRequirements ? `
                                <div class="mb-4">
                                    <h4 class="font-bold mb-1">System Requirements</h4>
                                    <div class="bg-gray-50 p-3 rounded">
                                        ${product.systemRequirements}
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div class="flex space-x-3">
                                <button onclick="approveProduct('${product._id}')" 
                                        class="btn btn-success flex-1">
                                    <i class="fas fa-check mr-2"></i> Approve
                                </button>
                                <button onclick="showRejectModal('${product._id}')" 
                                        class="btn btn-danger flex-1">
                                    <i class="fas fa-times mr-2"></i> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        Utils.showAlert('Failed to load product details', 'error');
    }
}

async function approveProduct(productId) {
    if (!confirm('Are you sure you want to approve this product?')) return;

    try {
        await AdminAPI.approveProduct(productId);

        // Remove from pending list
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        if (productElement) {
            productElement.remove();
        }

        // Reload pending products
        await loadPendingProducts();

    } catch (error) {
        // Error already shown
    }
}

function showRejectModal(productId) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content max-w-md">
            <div class="p-6">
                <h3 class="text-xl font-bold mb-4">Reject Product</h3>
                <p class="text-gray-600 mb-4">Please provide a reason for rejection (min 10 characters):</p>
                
                <textarea id="rejection-reason" 
                          class="form-input mb-4" 
                          rows="4"
                          placeholder="Example: The file contains malware, low quality content, etc."></textarea>
                
                <div class="flex space-x-3">
                    <button onclick="closeModal()" class="btn btn-secondary flex-1">Cancel</button>
                    <button onclick="rejectProduct('${productId}')" 
                            class="btn btn-danger flex-1">
                        Reject Product
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function rejectProduct(productId) {
    const reason = document.getElementById('rejection-reason')?.value.trim();
    if (!reason || reason.length < 10) {
        Utils.showAlert('Please provide a reason with at least 10 characters', 'error');
        return;
    }

    try {
        await AdminAPI.rejectProduct(productId, reason);
        closeModal();
        await loadPendingProducts();

    } catch (error) {
        // Error already shown
    }
}

async function loadAllProducts() {
    const container = document.getElementById('all-products-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/products?limit=50`, {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            container.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Developer</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Downloads</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.products.map(product => `
                                <tr>
                                    <td>
                                        <div class="flex items-center">
                                            <img src="${product.thumbnail}" 
                                                 class="w-10 h-10 rounded mr-3">
                                            <span>${product.title}</span>
                                        </div>
                                    </td>
                                    <td>${product.developer?.username}</td>
                                    <td><span class="badge badge-${product.category}">${product.category}</span></td>
                                    <td>${Utils.formatPrice(product.price)}</td>
                                    <td><span class="badge badge-${product.status}">${product.status}</span></td>
                                    <td>${product.downloads}</td>
                                    <td>
                                        <div class="flex space-x-2">
                                            <button onclick="viewProductDetails('${product._id}')" 
                                                    class="text-blue-600 hover:text-blue-800">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button onclick="toggleProductFeature('${product._id}', ${!product.featured})" 
                                                    class="${product.featured ? 'text-yellow-600' : 'text-gray-600'} hover:text-yellow-800">
                                                <i class="fas fa-star"></i>
                                            </button>
                                            <button onclick="deleteProduct('${product._id}')" 
                                                    class="text-red-600 hover:text-red-800">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p class="text-red-600">Failed to load products</p>';
    }
}

async function loadAllUsers() {
    const container = document.getElementById('all-users-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            container.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Products</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.users.map(user => `
                                <tr>
                                    <td>
                                        <div class="flex items-center">
                                            <img src="${user.avatar}" 
                                                 class="w-8 h-8 rounded-full mr-3">
                                            <span>${user.username}</span>
                                        </div>
                                    </td>
                                    <td>${user.email}</td>
                                    <td>
                                        <select onchange="updateUserRole('${user._id}', this.value)" 
                                                class="form-input text-sm py-1">
                                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                                            <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>Developer</option>
                                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                        </select>
                                    </td>
                                    <td>${Utils.formatDate(user.createdAt)}</td>
                                    <td>${user.uploadedProducts?.length || 0}</td>
                                    <td>
                                        <button onclick="viewUserDetails('${user._id}')" 
                                                class="text-blue-600 hover:text-blue-800">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = '<p class="text-red-600">Failed to load users</p>';
    }
}

async function loadAllOrders() {
    const container = document.getElementById('all-orders-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        });

        const data = await response.json();

        if (data.success) {
            container.innerHTML = `
                <div class="mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="bg-white p-4 rounded-lg shadow">
                            <p class="text-sm text-gray-600">Total Revenue</p>
                            <p class="text-2xl font-bold">${Utils.formatPrice(data.stats.totalRevenue)}</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow">
                            <p class="text-sm text-gray-600">Daily Revenue</p>
                            <p class="text-2xl font-bold">${Utils.formatPrice(data.stats.dailyRevenue)}</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow">
                            <p class="text-sm text-gray-600">Total Orders</p>
                            <p class="text-2xl font-bold">${data.stats.totalOrders}</p>
                        </div>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>User</th>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.orders.map(order => `
                                <tr>
                                    <td class="font-mono">${order.orderId}</td>
                                    <td>${order.user?.username}</td>
                                    <td>${order.product?.title}</td>
                                    <td>${Utils.formatPrice(order.amount)}</td>
                                    <td><span class="badge ${order.paymentStatus === 'completed' ? 'badge-approved' : 'badge-pending'}">${order.paymentStatus}</span></td>
                                    <td>${Utils.formatDate(order.createdAt)}</td>
                                    <td>
                                        <button onclick="viewOrderDetails('${order._id}')" 
                                                class="text-blue-600 hover:text-blue-800">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<p class="text-red-600">Failed to load orders</p>';
    }
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Expose functions to window
window.viewProductDetails = viewProductDetails;
window.approveProduct = approveProduct;
window.showRejectModal = showRejectModal;
window.rejectProduct = rejectProduct;
window.closeModal = closeModal;