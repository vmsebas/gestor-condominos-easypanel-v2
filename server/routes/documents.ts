import { Router } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { SUPPORTED_FILE_TYPES } from '../../src/types/documentTypes.ts';

// Configuración de multer para upload de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const isValidType = Object.keys(SUPPORTED_FILE_TYPES).includes(file.mimetype);
    if (isValidType) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`));
    }
  }
});

export function createDocumentsRouter(getPool: () => Promise<Pool>) {
  const router = Router();

  // Get all documents with filters
  router.get('/', async (req, res) => {
    try {
      const {
        buildingId,
        category,
        tags,
        search_query,
        visibility,
        date_from,
        date_to,
        file_type,
        member_id,
        is_current_version = 'true',
        page = '1',
        limit = '20'
      } = req.query;

      const pool = await getPool();
      
      let query = `
        SELECT 
          d.*,
          b.name as building_name,
          m.name as member_name,
          dc.name as category_name,
          dc.color as category_color,
          dc.icon as category_icon
        FROM documents d
        LEFT JOIN buildings b ON d.building_id = b.id
        LEFT JOIN members m ON d.member_id = m.id
        LEFT JOIN document_categories dc ON d.category = dc.name AND d.building_id = dc.building_id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramCount = 0;

      if (buildingId) {
        paramCount++;
        query += ` AND d.building_id = $${paramCount}`;
        params.push(buildingId);
      }

      if (category) {
        paramCount++;
        query += ` AND d.category = $${paramCount}`;
        params.push(category);
      }

      if (tags && Array.isArray(tags)) {
        paramCount++;
        query += ` AND d.tags && $${paramCount}`;
        params.push(tags);
      }

      if (search_query) {
        paramCount++;
        query += ` AND d.search_vector @@ plainto_tsquery('spanish', $${paramCount})`;
        params.push(search_query);
      }

      if (visibility) {
        paramCount++;
        query += ` AND d.visibility = $${paramCount}`;
        params.push(visibility);
      }

      if (date_from) {
        paramCount++;
        query += ` AND d.created_at >= $${paramCount}`;
        params.push(date_from);
      }

      if (date_to) {
        paramCount++;
        query += ` AND d.created_at <= $${paramCount}`;
        params.push(date_to);
      }

      if (file_type) {
        paramCount++;
        query += ` AND d.file_extension = $${paramCount}`;
        params.push(file_type);
      }

      if (member_id) {
        paramCount++;
        query += ` AND d.member_id = $${paramCount}`;
        params.push(member_id);
      }

      if (is_current_version === 'true') {
        query += ` AND d.is_current_version = true`;
      }

      query += ` ORDER BY d.created_at DESC`;

      // Paginación
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit as string));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await pool.query(query, params);
      
      // Formatear el tamaño de archivo
      const documentsWithFormatting = result.rows.map(doc => ({
        ...doc,
        file_size_formatted: formatFileSize(doc.file_size)
      }));

      res.json({ success: true, data: documentsWithFormatting });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get document by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();
      
      const query = `
        SELECT 
          d.*,
          b.name as building_name,
          m.name as member_name,
          dc.name as category_name,
          dc.color as category_color,
          dc.icon as category_icon
        FROM documents d
        LEFT JOIN buildings b ON d.building_id = b.id
        LEFT JOIN members m ON d.member_id = m.id
        LEFT JOIN document_categories dc ON d.category = dc.name AND d.building_id = dc.building_id
        WHERE d.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      const document = result.rows[0];
      document.file_size_formatted = formatFileSize(document.file_size);
      
      res.json({ success: true, data: document });
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload new document
  router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const {
        building_id,
        member_id,
        name,
        category,
        subcategory,
        tags,
        description,
        visibility = 'building',
        is_confidential = false,
        access_level = 'read',
        uploaded_by
      } = req.body;

      if (!building_id || !name || !category) {
        // Eliminar archivo si faltan datos requeridos
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(400).json({
          success: false,
          error: 'Building ID, name, and category are required'
        });
      }

      const pool = await getPool();
      
      const query = `
        INSERT INTO documents (
          building_id, member_id, name, original_name, file_path, 
          file_size, mime_type, file_extension, category, subcategory,
          tags, description, visibility, is_confidential, access_level, uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;
      
      const values = [
        building_id,
        member_id || null,
        name,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        path.extname(req.file.originalname).toLowerCase().slice(1),
        category,
        subcategory || null,
        tags ? JSON.parse(tags) : [],
        description || null,
        visibility,
        is_confidential === 'true',
        access_level,
        uploaded_by || null
      ];
      
      const result = await pool.query(query, values);
      const document = result.rows[0];
      document.file_size_formatted = formatFileSize(document.file_size);
      
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // Eliminar archivo en caso de error
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Download document
  router.get('/:id/download', async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();
      
      const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      const document = result.rows[0];
      
      // Actualizar contador de descargas
      await pool.query(
        'UPDATE documents SET download_count = download_count + 1, last_accessed_at = NOW() WHERE id = $1',
        [id]
      );

      // Verificar que el archivo existe
      try {
        await fs.access(document.file_path);
      } catch {
        return res.status(404).json({
          success: false,
          error: 'File not found on disk'
        });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
      res.setHeader('Content-Type', document.mime_type);
      res.sendFile(path.resolve(document.file_path));
      
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update document metadata
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateFields = req.body;
      
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      const pool = await getPool();
      
      // Build dynamic update query
      const setClause: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updateFields).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      values.push(id);

      const query = `
        UPDATE documents 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }
      
      const document = result.rows[0];
      document.file_size_formatted = formatFileSize(document.file_size);
      
      res.json({ success: true, data: document });
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete document
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();
      
      const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING file_path', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Eliminar archivo del disco
      const filePath = result.rows[0].file_path;
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to delete file from disk:', error);
      }
      
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get document categories
  router.get('/categories/:buildingId', async (req, res) => {
    try {
      const { buildingId } = req.params;
      const pool = await getPool();
      
      const query = `
        SELECT * FROM document_categories 
        WHERE building_id = $1 
        ORDER BY sort_order, name
      `;
      
      const result = await pool.query(query, [buildingId]);
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching document categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch document categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get document statistics
  router.get('/stats/:buildingId', async (req, res) => {
    try {
      const { buildingId } = req.params;
      const pool = await getPool();
      
      const queries = await Promise.all([
        // Total documents and size
        pool.query(`
          SELECT 
            COUNT(*) as total_documents,
            COALESCE(SUM(file_size), 0) as total_size
          FROM documents 
          WHERE building_id = $1 AND is_current_version = true
        `, [buildingId]),
        
        // By category
        pool.query(`
          SELECT 
            category,
            COUNT(*) as count,
            COALESCE(SUM(file_size), 0) as size
          FROM documents 
          WHERE building_id = $1 AND is_current_version = true
          GROUP BY category
          ORDER BY count DESC
        `, [buildingId]),
        
        // Recent uploads (last 30 days)
        pool.query(`
          SELECT COUNT(*) as recent_uploads
          FROM documents 
          WHERE building_id = $1 
          AND created_at >= NOW() - INTERVAL '30 days'
        `, [buildingId]),
        
        // Popular documents
        pool.query(`
          SELECT d.*, b.name as building_name
          FROM documents d
          LEFT JOIN buildings b ON d.building_id = b.id
          WHERE d.building_id = $1 AND d.download_count > 0
          ORDER BY d.download_count DESC
          LIMIT 5
        `, [buildingId])
      ]);

      const stats = {
        total_documents: parseInt(queries[0].rows[0]?.total_documents || '0'),
        total_size: parseInt(queries[0].rows[0]?.total_size || '0'),
        by_category: queries[1].rows,
        recent_uploads: parseInt(queries[2].rows[0]?.recent_uploads || '0'),
        popular_documents: queries[3].rows
      };
      
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch document statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}