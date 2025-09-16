const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class BackupService {
  async performBackup() {
    const backupDir = path.join(__dirname, '../../backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    
    try {
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });
      
      // Get database connection details from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }
      
      // Parse database URL
      const urlParts = new URL(dbUrl);
      const dbName = urlParts.pathname.substring(1);
      const host = urlParts.hostname;
      const port = urlParts.port || 5432;
      const username = urlParts.username;
      const password = urlParts.password;
      
      // Create pg_dump command
      const pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} -f ${filepath}`;
      
      // Execute backup
      await new Promise((resolve, reject) => {
        exec(pgDumpCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('Backup error:', stderr);
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });
      
      // Get file size
      const stats = await fs.stat(filepath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Backup completed: ${filename} (${fileSizeInMB} MB)`);
      
      // Clean old backups (keep last 30 days)
      await this.cleanOldBackups(backupDir, 30);
      
      return {
        success: true,
        filename,
        size: fileSizeInMB,
        path: filepath
      };
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }
  
  async cleanOldBackups(backupDir, daysToKeep) {
    try {
      const files = await fs.readdir(backupDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
      
      for (const file of files) {
        if (file.startsWith('backup-') && file.endsWith('.sql')) {
          const filepath = path.join(backupDir, file);
          const stats = await fs.stat(filepath);
          const age = now - stats.mtime.getTime();
          
          if (age > maxAge) {
            await fs.unlink(filepath);
            console.log(`🗑️ Deleted old backup: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
      // Don't throw - this is not critical
    }
  }
  
  async restoreBackup(backupFile) {
    try {
      // Get database connection details from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }
      
      // Parse database URL
      const urlParts = new URL(dbUrl);
      const dbName = urlParts.pathname.substring(1);
      const host = urlParts.hostname;
      const port = urlParts.port || 5432;
      const username = urlParts.username;
      const password = urlParts.password;
      
      // Create psql command
      const psqlCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${dbName} -f ${backupFile}`;
      
      // Execute restore
      await new Promise((resolve, reject) => {
        exec(psqlCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('Restore error:', stderr);
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });
      
      console.log(`✅ Backup restored from: ${backupFile}`);
      
      return {
        success: true,
        file: backupFile
      };
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }
  
  async listBackups() {
    const backupDir = path.join(__dirname, '../../backups');
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      const files = await fs.readdir(backupDir);
      
      const backups = [];
      for (const file of files) {
        if (file.startsWith('backup-') && file.endsWith('.sql')) {
          const filepath = path.join(backupDir, file);
          const stats = await fs.stat(filepath);
          
          backups.push({
            filename: file,
            path: filepath,
            size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
            created: stats.mtime
          });
        }
      }
      
      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created - a.created);
      
      return backups;
    } catch (error) {
      console.error('Error listing backups:', error);
      throw error;
    }
  }
}

module.exports = new BackupService();