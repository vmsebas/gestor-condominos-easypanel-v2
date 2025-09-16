const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'documents'),
    path.join(process.cwd(), 'uploads', 'images'),
    path.join(process.cwd(), 'uploads', 'images', 'avatars'),
    path.join(process.cwd(), 'uploads', 'temp')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call this when the module loads
ensureUploadDirs();

// Configure storage for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'documents'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'images', 'avatars'));
  },
  filename: (req, file, cb) => {
    const memberId = req.params.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${memberId}-${uniqueSuffix}${ext}`);
  }
});

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// File filter for avatars
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

// Create multer instances
const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB for documents
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for avatars
  }
});

// Memory storage for processing before saving
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// Helper function to delete old avatar when uploading new one
const deleteOldAvatar = async (avatarUrl) => {
  if (!avatarUrl) return;
  
  try {
    // Extract filename from URL
    const filename = path.basename(avatarUrl);
    const filepath = path.join(process.cwd(), 'uploads', 'images', 'avatars', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Error deleting old avatar:', error);
  }
};

// Helper function to get file URL
const getFileUrl = (req, filepath) => {
  const filename = path.basename(filepath);
  const dir = filepath.includes('avatars') ? 'images/avatars' : 'documents';
  
  // In production, use the full URL
  if (process.env.NODE_ENV === 'production') {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/uploads/${dir}/${filename}`;
  }
  
  // In development, use relative path
  return `/uploads/${dir}/${filename}`;
};

module.exports = {
  uploadDocument,
  uploadAvatar,
  uploadMemory,
  deleteOldAvatar,
  getFileUrl,
  ensureUploadDirs
};