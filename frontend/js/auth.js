// Authentication-specific JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on login page
    if (window.location.pathname.includes('login.html')) {
        setupLoginPage();
    }
});

function setupLoginPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const isRegister = urlParams.get('register') === 'true';

    const container = document.getElementById('auth-container');
    if (!container) return;

    if (isRegister) {
        container.innerHTML = `
            <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-center">Create Account</h2>
                <form id="registerForm" onsubmit="handleRegister(event)">
                    <div class="mb-4">
                        <label class="form-label">Username</label>
                        <input type="text" id="username" class="form-input" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Email</label>
                        <input type="email" id="email" class="form-input" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Password</label>
                        <input type="password" id="password" class="form-input" required minlength="6">
                    </div>
                    <div class="mb-6">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" id="confirmPassword" class="form-input" required minlength="6">
                    </div>
                    <div class="mb-6">
                        <label class="flex items-center">
                            <input type="checkbox" id="developer" class="mr-2">
                            <span>I want to upload products (Developer account)</span>
                        </label>
                    </div>
                    <button type="submit" class="btn btn-primary w-full">
                        Create Account
                    </button>
                </form>
                <p class="text-center mt-4 text-gray-600">
                    Already have an account? 
                    <a href="login.html" class="text-blue-600 hover:underline">Login here</a>
                </p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
                <h2 class="text-2xl font-bold mb-6 text-center">Login to WebHarbour</h2>
                <form id="loginForm" onsubmit="handleLogin(event)">
                    <div class="mb-4">
                        <label class="form-label">Email</label>
                        <input type="email" id="loginEmail" class="form-input" required>
                    </div>
                    <div class="mb-6">
                        <label class="form-label">Password</label>
                        <input type="password" id="loginPassword" class="form-input" required>
                        <div class="text-right mt-2">
                            <a href="#" class="text-sm text-blue-600 hover:underline">Forgot password?</a>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary w-full">
                        Login
                    </button>
                </form>
                <p class="text-center mt-4 text-gray-600">
                    Don't have an account? 
                    <a href="login.html?register=true" class="text-blue-600 hover:underline">Sign up here</a>
                </p>
                <div class="mt-8">
                    <div class="text-center text-gray-500 mb-4">Or continue with</div>
                    <div class="grid grid-cols-2 gap-4">
                        <button class="px-4 py-3 border rounded-lg hover:bg-gray-50">
                            <i class="fab fa-google text-red-500 mr-2"></i> Google
                        </button>
                        <button class="px-4 py-3 border rounded-lg hover:bg-gray-50">
                            <i class="fab fa-github text-gray-800 mr-2"></i> GitHub
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    await Auth.login(email, password);
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const isDeveloper = document.getElementById('developer').checked;

    // Validation
    if (password !== confirmPassword) {
        Utils.showAlert('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        Utils.showAlert('Password must be at least 6 characters', 'error');
        return;
    }

    const userData = {
        username,
        email,
        password,
        role: isDeveloper ? 'developer' : 'user'
    };

    await Auth.register(userData);
}

// Expose functions to window
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;