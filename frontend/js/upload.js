// Upload page functionality

let uploadedFiles = {
    mainFile: null,
    thumbnail: null,
    screenshots: []
};

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.includes('upload.html')) {
        setupUploadPage();
    }
});

function setupUploadPage() {
    // Check if user is logged in and is developer/admin
    const user = Auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    if (!Auth.isDeveloper()) {
        document.getElementById('upload-container').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
                <h2 class="text-2xl font-bold mb-4">Developer Account Required</h2>
                <p class="text-gray-600 mb-6">You need a developer account to upload products.</p>
                <button onclick="requestDeveloperAccess()" class="btn btn-primary">
                    Request Developer Access
                </button>
            </div>
        `;
        return;
    }

    // Setup form
    setupFormValidation();
    setupFileUploads();
}

function setupFormValidation() {
    const form = document.getElementById('upload-form');
    if (!form) return;

    form.addEventListener('submit', handleUploadSubmit);

    // Real-time price validation
    const priceInput = document.getElementById('price');
    if (priceInput) {
        priceInput.addEventListener('input', function () {
            const value = parseFloat(this.value);
            if (value < 0) {
                this.value = 0;
            }
        });
    }

    // Discount price validation
    const discountInput = document.getElementById('discount-price');
    if (discountInput) {
        discountInput.addEventListener('input', function () {
            const price = parseFloat(document.getElementById('price').value) || 0;
            const discount = parseFloat(this.value);

            if (discount > price) {
                this.value = price;
                Utils.showAlert('Discount price cannot be higher than regular price', 'warning');
            }
        });
    }
}

function setupFileUploads() {
    // Main file upload
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file size (100MB max)
            if (file.size > 100 * 1024 * 1024) {
                Utils.showAlert('File size must be less than 100MB', 'error');
                this.value = '';
                return;
            }

            uploadedFiles.mainFile = file;
            document.getElementById('file-name').textContent = file.name;
            document.getElementById('file-size').textContent = Utils.formatFileSize(file.size);
        });
    }

    // Thumbnail upload
    const thumbnailInput = document.getElementById('thumbnail-upload');
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            // Validate image
            if (!file.type.startsWith('image/')) {
                Utils.showAlert('Please upload an image file', 'error');
                this.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                Utils.showAlert('Image must be less than 5MB', 'error');
                this.value = '';
                return;
            }

            // Preview thumbnail
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('thumbnail-preview');
                preview.innerHTML = `<img src="${e.target.result}" class="w-full h-48 object-cover rounded-lg">`;
            };
            reader.readAsDataURL(file);

            uploadedFiles.thumbnail = file;
        });
    }

    // Screenshots upload
    const screenshotsInput = document.getElementById('screenshots-upload');
    if (screenshotsInput) {
        screenshotsInput.addEventListener('change', function (e) {
            const files = Array.from(e.target.files);

            // Validate files
            const validFiles = files.filter(file => {
                if (!file.type.startsWith('image/')) {
                    Utils.showAlert(`${file.name} is not an image file`, 'warning');
                    return false;
                }
                if (file.size > 5 * 1024 * 1024) {
                    Utils.showAlert(`${file.name} is too large (max 5MB)`, 'warning');
                    return false;
                }
                return true;
            });

            // Add to uploaded files (max 10)
            const remainingSlots = 10 - uploadedFiles.screenshots.length;
            const filesToAdd = validFiles.slice(0, remainingSlots);

            uploadedFiles.screenshots.push(...filesToAdd);
            updateScreenshotsPreview();

            if (validFiles.length > remainingSlots) {
                Utils.showAlert(`Maximum 10 screenshots allowed. ${remainingSlots} added.`, 'warning');
            }
        });
    }
}

function updateScreenshotsPreview() {
    const container = document.getElementById('screenshots-preview');
    if (!container) return;

    if (uploadedFiles.screenshots.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No screenshots uploaded</p>';
        return;
    }

    const previews = uploadedFiles.screenshots.map((file, index) => {
        return `
            <div class="relative">
                <img src="${URL.createObjectURL(file)}" 
                     class="w-32 h-32 object-cover rounded-lg">
                <button onclick="removeScreenshot(${index})" 
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');

    container.innerHTML = previews;
}

function removeScreenshot(index) {
    uploadedFiles.screenshots.splice(index, 1);
    updateScreenshotsPreview();
}

async function handleUploadSubmit(event) {
    event.preventDefault();

    // Validate required fields
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const category = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const discountPrice = document.getElementById('discount-price').value ?
        parseFloat(document.getElementById('discount-price').value) : null;

    if (!title || !description || !category || isNaN(price)) {
        Utils.showAlert('Please fill in all required fields', 'error');
        return;
    }

    if (!uploadedFiles.mainFile) {
        Utils.showAlert('Please upload the main file', 'error');
        return;
    }

    if (!uploadedFiles.thumbnail) {
        Utils.showAlert('Please upload a thumbnail image', 'error');
        return;
    }

    try {
        // Upload main file
        const fileUpload = await UploadAPI.uploadFile(uploadedFiles.mainFile, category);

        // Upload thumbnail
        const thumbnailUrl = await UploadAPI.uploadThumbnail(uploadedFiles.thumbnail);

        // Upload screenshots if any
        let screenshotUrls = [];
        if (uploadedFiles.screenshots.length > 0) {
            screenshotUrls = await UploadAPI.uploadScreenshots(uploadedFiles.screenshots);
        }

        // Prepare product data
        const productData = {
            title,
            description,
            category,
            price,
            discountPrice: discountPrice || undefined,
            fileUrl: fileUpload.fileUrl,
            fileSize: uploadedFiles.mainFile.size,
            thumbnail: thumbnailUrl,
            screenshots: screenshotUrls,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            version: document.getElementById('version').value || '1.0.0',
            license: document.getElementById('license').value || 'paid',
            compatibility: {
                os: document.getElementById('os').value,
                browser: document.getElementById('browser').value,
                minRam: document.getElementById('ram').value,
                processor: document.getElementById('processor').value
            },
            systemRequirements: document.getElementById('requirements').value
        };

        // Submit product
        const product = await UploadAPI.submitProduct(productData);

        // Reset form
        event.target.reset();
        uploadedFiles = { mainFile: null, thumbnail: null, screenshots: [] };
        document.getElementById('file-name').textContent = 'No file chosen';
        document.getElementById('file-size').textContent = '';
        document.getElementById('thumbnail-preview').innerHTML = '<p class="text-gray-500">No thumbnail</p>';
        document.getElementById('screenshots-preview').innerHTML = '<p class="text-gray-500">No screenshots uploaded</p>';

        // Show success message
        Utils.showAlert('Product submitted successfully! It will be reviewed by our team.', 'success');

    } catch (error) {
        console.error('Upload error:', error);
        // Error already shown by UploadAPI functions
    }
}

function requestDeveloperAccess() {
    Utils.showAlert('Developer access request sent to admin!', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// Expose functions to window
window.removeScreenshot = removeScreenshot;