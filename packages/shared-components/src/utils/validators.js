/**
 * Validation utilities for form validation
 */

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

export const validateFileSize = (file, maxSizeMB = 10) => {
  if (!file) return false;
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
};

export const validateFileType = (file, allowedTypes = []) => {
  if (!file || allowedTypes.length === 0) return true;
  return allowedTypes.some(type => file.type.includes(type) || file.name.endsWith(type));
};

export const ALLOWED_EVIDENCE_TYPES = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt',
  'png', 'jpg', 'jpeg', 'gif', 'csv'
];

export const MAX_FILE_SIZE_MB = 10;
