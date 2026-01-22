const multer = require('multer');
const mime = require('mime-types');

/**
 * Upload Middleware
 * Configures multer for file uploads with memory storage
 */

// Configure memory storage (files stored in buffer, then saved to PostgreSQL)
const storage = multer.memoryStorage();

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': ['.txt', '.csv'], // text/plain can be txt or csv
  'text/csv': '.csv',
  'application/csv': '.csv',
  'application/octet-stream': ['.csv', '.json', '.txt', '.zip'], // Generic binary can be various types
  
  // Images
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  
  // Additional formats
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/json': '.json',
  'text/xml': '.xml',
  'application/xml': '.xml'
};

// File filter function
const fileFilter = (req, file, cb) => {
  // Get file extension
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  
  // Check if MIME type is allowed
  const isAllowedMimeType = ALLOWED_FILE_TYPES.hasOwnProperty(file.mimetype);
  
  if (!isAllowedMimeType) {
    const error = new Error(
      `Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JPG, PNG, GIF, ZIP, JSON, XML`
    );
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    return cb(error, false);
  }
  
  // Validate file extension matches MIME type
  const allowedExtensions = ALLOWED_FILE_TYPES[file.mimetype];
  const extensionsArray = Array.isArray(allowedExtensions) ? allowedExtensions : [allowedExtensions];
  const normalizedExtensions = extensionsArray.map(ext => ext.replace('.', ''));
  
  const isValidExtension = normalizedExtensions.includes(fileExtension) ||
    (fileExtension === 'jpeg' && normalizedExtensions.includes('jpg'));
  
  if (!isValidExtension) {
    const error = new Error(
      `File extension .${fileExtension} does not match MIME type ${file.mimetype}. Expected: ${extensionsArray.join(', ')}`
    );
    error.code = 'FILE_EXTENSION_MISMATCH';
    error.statusCode = 400;
    return cb(error, false);
  }
  
  // File is valid
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

/**
 * Error handler for multer errors
 * Use this in your route error handling
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum file size is 10MB.',
          code: 'FILE_TOO_LARGE'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 files per upload.',
          code: 'TOO_MANY_FILES'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name in form data.',
          code: 'UNEXPECTED_FIELD'
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
          code: 'UPLOAD_ERROR'
        });
    }
  } else if (err && err.code === 'INVALID_FILE_TYPE') {
    // Custom file type error
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code
    });
  } else if (err && err.code === 'FILE_EXTENSION_MISMATCH') {
    // File extension mismatch error
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }
  
  // Pass other errors to the next error handler
  next(err);
};

/**
 * Validate uploaded file buffer
 * Additional validation after multer processing
 */
const validateFileBuffer = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (!file.buffer) {
    throw new Error('File buffer is empty');
  }
  
  if (file.size === 0) {
    throw new Error('File is empty');
  }
  
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File exceeds maximum size of 10MB');
  }
  
  return true;
};

/**
 * Get file info from uploaded file
 */
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    extension: file.originalname.toLowerCase().split('.').pop(),
    buffer: file.buffer
  };
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if file type is image
 */
const isImageFile = (mimeType) => {
  return mimeType && mimeType.startsWith('image/');
};

/**
 * Check if file type is document
 */
const isDocumentFile = (mimeType) => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  return documentTypes.includes(mimeType);
};

module.exports = {
  upload,
  handleMulterError,
  validateFileBuffer,
  getFileInfo,
  formatFileSize,
  isImageFile,
  isDocumentFile,
  ALLOWED_FILE_TYPES
};
