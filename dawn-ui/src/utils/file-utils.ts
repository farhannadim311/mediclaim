/**
 * Utility functions for file handling and base64 conversion
 */

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  base64: string;
}

/**
 * Convert a File to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Convert a File to FileInfo with base64 data
 */
export const fileToFileInfo = async (file: File): Promise<FileInfo> => {
  const base64 = await fileToBase64(file);
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    base64,
  };
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Check if file size is within limits
 */
export const isFileSizeValid = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Validate file type
 */
export const isValidFileType = (file: File, allowedTypes: string[] = []): boolean => {
  if (allowedTypes.length === 0) return true;
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
};

/**
 * Create a data URL for embedding files
 */
export const createFileDataUrl = (fileInfo: FileInfo): string => {
  return fileInfo.base64;
};

/**
 * Extract base64 data from data URL
 */
export const extractBase64FromDataUrl = (dataUrl: string): string => {
  const base64Index = dataUrl.indexOf(',');
  return base64Index !== -1 ? dataUrl.substring(base64Index + 1) : dataUrl;
};

/**
 * Get MIME type from data URL
 */
export const getMimeTypeFromDataUrl = (dataUrl: string): string => {
  const match = dataUrl.match(/data:([^;]+)/);
  return match ? match[1] : '';
};
