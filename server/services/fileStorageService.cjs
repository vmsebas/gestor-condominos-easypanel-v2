const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileStorageService {
  constructor() {
    this.baseUploadPath = path.join(process.cwd(), 'uploads');
    this.documentsPath = path.join(this.baseUploadPath, 'documents');
    this.imagesPath = path.join(this.baseUploadPath, 'images');
    this.avatarsPath = path.join(this.baseUploadPath, 'images', 'avatars');
    this.tempPath = path.join(this.baseUploadPath, 'temp');
    this.ensureUploadDirectories();
  }

  async ensureUploadDirectories() {
    const directories = [
      this.baseUploadPath,
      this.documentsPath,
      this.imagesPath,
      this.avatarsPath,
      this.tempPath
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch (error) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    
    // Sanitize filename to prevent path traversal and other attacks
    const sanitizedName = path.basename(originalName);
    const extension = path.extname(sanitizedName).toLowerCase();
    const baseName = path.basename(sanitizedName, extension);
    
    // Remove any dangerous characters and limit length
    const sanitizedBaseName = baseName
      .replace(/[^a-z0-9\-_]/gi, '_')
      .toLowerCase()
      .substring(0, 50); // Limit filename length
    
    // Validate extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif'];
    if (!allowedExtensions.includes(extension)) {
      throw new Error(`Tipo de ficheiro não permitido: ${extension}`);
    }
    
    return `${sanitizedBaseName}_${timestamp}_${randomString}${extension}`;
  }

  async saveFile(file) {
    const uniqueFilename = this.generateUniqueFilename(file.originalname);
    const filePath = path.join(this.documentsPath, uniqueFilename);
    
    // If using multer memory storage, file.buffer contains the file data
    if (file.buffer) {
      await fs.writeFile(filePath, file.buffer);
    } else if (file.path) {
      // If using multer disk storage, move the temp file
      await fs.rename(file.path, filePath);
    } else {
      throw new Error('Objeto de ficheiro inválido');
    }
    
    return {
      filename: uniqueFilename,
      filepath: filePath,
      size: file.size || file.buffer?.length
    };
  }

  async deleteFile(filepath) {
    try {
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, consider it deleted
        return true;
      }
      throw error;
    }
  }

  async fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getFileStream(filepath) {
    // Validate filepath is within allowed directories
    const normalizedPath = path.normalize(filepath);
    const resolvedPath = path.resolve(normalizedPath);
    
    // Check if the resolved path is within the uploads directory
    if (!resolvedPath.startsWith(this.baseUploadPath)) {
      throw new Error('Caminho de ficheiro inválido - violação de segurança');
    }
    
    const exists = await this.fileExists(resolvedPath);
    if (!exists) {
      throw new Error('Ficheiro não encontrado');
    }
    
    // Return a function that creates the stream when needed
    return () => require('fs').createReadStream(resolvedPath);
  }

  async getFileBuffer(filepath) {
    // Validate filepath is within allowed directories
    const normalizedPath = path.normalize(filepath);
    const resolvedPath = path.resolve(normalizedPath);
    
    // Check if the resolved path is within the uploads directory
    if (!resolvedPath.startsWith(this.baseUploadPath)) {
      throw new Error('Caminho de ficheiro inválido - violação de segurança');
    }
    
    const exists = await this.fileExists(resolvedPath);
    if (!exists) {
      throw new Error('Ficheiro não encontrado');
    }
    
    return fs.readFile(resolvedPath);
  }

  async getFileStats(filepath) {
    const exists = await this.fileExists(filepath);
    if (!exists) {
      throw new Error('Ficheiro não encontrado');
    }
    
    const stats = await fs.stat(filepath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }

  async copyFile(sourcePath, destinationPath) {
    await fs.copyFile(sourcePath, destinationPath);
    return destinationPath;
  }

  // Generate a temporary path for file operations
  generateTempPath(filename) {
    return path.join(this.tempPath, filename);
  }

  // Clean up old temporary files
  async cleanupTempFiles(olderThanHours = 24) {
    const tempDir = this.tempPath;
    
    try {
      await fs.access(tempDir);
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = olderThanHours * 60 * 60 * 1000;
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      // Temp directory doesn't exist or other error
      console.error('Error cleaning up temp files:', error);
    }
  }

  // Get file mime type from extension
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Validate file type and size
  validateFile(file, allowedTypes, maxSize) {
    const ext = path.extname(file.originalname).toLowerCase();
    const size = file.size || file.buffer?.length || 0;
    
    if (allowedTypes && !allowedTypes.includes(ext)) {
      throw new Error(`File type ${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    if (maxSize && size > maxSize) {
      throw new Error(`File size ${Math.round(size / 1024 / 1024)}MB exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    return true;
  }

  // Future methods for cloud storage migration
  async uploadToCloud(filepath, cloudPath) {
    // Placeholder for future S3/CloudStorage implementation
    throw new Error('Cloud storage not implemented yet');
  }

  async downloadFromCloud(cloudPath, localPath) {
    // Placeholder for future S3/CloudStorage implementation
    throw new Error('Cloud storage not implemented yet');
  }

  async deleteFromCloud(cloudPath) {
    // Placeholder for future S3/CloudStorage implementation
    throw new Error('Cloud storage not implemented yet');
  }
}

module.exports = new FileStorageService();