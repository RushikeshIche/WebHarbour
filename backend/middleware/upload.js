const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
    'uploads/apps',
    'uploads/games',
    'uploads/software',
    'uploads/pdfs',
    'uploads/movies',
    'uploads/thumbnails',
    'uploads/screenshots'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'app': ['.apk', '.ipa', '.exe', '.dmg'],
        'game': ['.exe', '.dmg', '.zip', '.rar'],
        'software': ['.exe', '.dmg', '.msi', '.deb', '.rpm'],
        'pdf': ['.pdf'],
        'movie': ['.mp4', '.avi', '.mkv', '.mov', '.wmv']
    };

    const category = req.body.category;
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes[category] && allowedTypes[category].includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type for ${category}. Allowed: ${allowedTypes[category]?.join(', ')}`), false);
    }
};

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const category = req.body.category;
        cb(null, `uploads/${category}s`);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Thumbnail storage
const thumbnailStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/thumbnails');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'thumbnail-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Screenshots storage
const screenshotStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/screenshots');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'screenshot-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Upload instances
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 100 // 100MB max file size
    }
});

const uploadThumbnail = multer({
    storage: thumbnailStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for thumbnails'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB max
    }
});

const uploadScreenshots = multer({
    storage: screenshotStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for screenshots'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB max
    }
});

module.exports = { upload, uploadThumbnail, uploadScreenshots };