import { Router } from 'express';
import { Pool } from 'pg';

export function createTasksRouter(getPool: () => Promise<Pool>) {
  const router = Router();

  // Get all tasks
  router.get('/', async (req, res) => {
    try {
      const { buildingId, status, priority, assigneeId, minuteId } = req.query;
      const pool = await getPool();
      
      let query = `
        SELECT 
          t.*,
          m.name as assignee_name,
          min.title as minute_title,
          b.name as building_name
        FROM tasks t
        LEFT JOIN members m ON t.assignee_id = m.id
        LEFT JOIN minutes min ON t.minute_id = min.id
        LEFT JOIN buildings b ON t.building_id = b.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramCount = 0;

      if (buildingId) {
        paramCount++;
        query += ` AND t.building_id = $${paramCount}`;
        params.push(buildingId);
      }

      if (status) {
        paramCount++;
        query += ` AND t.status = $${paramCount}`;
        params.push(status);
      }

      if (priority) {
        paramCount++;
        query += ` AND t.priority = $${paramCount}`;
        params.push(priority);
      }

      if (assigneeId) {
        paramCount++;
        query += ` AND t.assignee_id = $${paramCount}`;
        params.push(assigneeId);
      }

      if (minuteId) {
        paramCount++;
        query += ` AND t.minute_id = $${paramCount}`;
        params.push(minuteId);
      }

      query += ' ORDER BY t.created_at DESC';

      const result = await pool.query(query, params);
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get task by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();
      
      const query = `
        SELECT 
          t.*,
          m.name as assignee_name,
          min.title as minute_title,
          b.name as building_name
        FROM tasks t
        LEFT JOIN members m ON t.assignee_id = m.id
        LEFT JOIN minutes min ON t.minute_id = min.id
        LEFT JOIN buildings b ON t.building_id = b.id
        WHERE t.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch task',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create new task
  router.post('/', async (req, res) => {
    try {
      const {
        building_id,
        minute_id,
        title,
        description,
        assignee_id,
        assignee_name,
        due_date,
        status = 'pending',
        priority = 'medium',
        category,
        created_by,
        notes
      } = req.body;

      if (!building_id || !title) {
        return res.status(400).json({
          success: false,
          error: 'Building ID and title are required'
        });
      }

      const pool = await getPool();
      
      const query = `
        INSERT INTO tasks (
          building_id, minute_id, title, description, 
          assignee_id, assignee_name, due_date, status, 
          priority, category, created_by, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        building_id,
        minute_id || null,
        title,
        description || null,
        assignee_id || null,
        assignee_name || null,
        due_date || null,
        status,
        priority,
        category || null,
        created_by || null,
        notes || null
      ];
      
      const result = await pool.query(query, values);
      
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create task',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update task
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
        UPDATE tasks 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Complete task
  router.put('/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;
      const { completed_by } = req.body;
      
      const pool = await getPool();
      
      const query = `
        UPDATE tasks 
        SET status = 'completed', completed_by = $1
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [completed_by || null, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error completing task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete task',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete task
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getPool();
      
      const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
      
      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete task',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get tasks by minute
  router.get('/minute/:minuteId', async (req, res) => {
    try {
      const { minuteId } = req.params;
      const pool = await getPool();
      
      const query = `
        SELECT 
          t.*,
          m.name as assignee_name,
          b.name as building_name
        FROM tasks t
        LEFT JOIN members m ON t.assignee_id = m.id
        LEFT JOIN buildings b ON t.building_id = b.id
        WHERE t.minute_id = $1
        ORDER BY t.created_at DESC
      `;
      
      const result = await pool.query(query, [minuteId]);
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching tasks by minute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get task statistics
  router.get('/stats/:buildingId', async (req, res) => {
    try {
      const { buildingId } = req.params;
      const pool = await getPool();
      
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
          COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status IN ('pending', 'in_progress')) as overdue_count,
          COUNT(*) as total_count
        FROM tasks
        WHERE building_id = $1
      `;
      
      const result = await pool.query(query, [buildingId]);
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error fetching task statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch task statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}