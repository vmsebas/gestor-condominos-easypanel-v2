import { Pool, PoolClient } from 'pg';

// Configuración optimizada para Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false }
});

// Tipos para el cliente
export interface DatabaseClient {
  query: (text: string, params?: any[]) => Promise<any>;
  from: (table: string) => QueryBuilder;
  transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
}

// Query Builder simple compatible con la API existente
export class QueryBuilder {
  private table: string;
  private selectColumns = '*';
  private whereConditions: any[] = [];
  private orderByColumns: string[] = [];
  private limitValue?: number;
  private singleRow = false;
  private operation?: 'insert' | 'update' | 'delete';
  private insertData?: any[];
  private updateData?: any;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  insert(data: any | any[]) {
    this.operation = 'insert';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.whereConditions.push({ column, operator: '=', value });
    return this;
  }

  neq(column: string, value: any) {
    this.whereConditions.push({ column, operator: '!=', value });
    return this;
  }

  gt(column: string, value: any) {
    this.whereConditions.push({ column, operator: '>', value });
    return this;
  }

  gte(column: string, value: any) {
    this.whereConditions.push({ column, operator: '>=', value });
    return this;
  }

  lt(column: string, value: any) {
    this.whereConditions.push({ column, operator: '<', value });
    return this;
  }

  lte(column: string, value: any) {
    this.whereConditions.push({ column, operator: '<=', value });
    return this;
  }

  like(column: string, pattern: string) {
    this.whereConditions.push({ column, operator: 'LIKE', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.whereConditions.push({ column, operator: 'ILIKE', value: pattern });
    return this;
  }

  in(column: string, values: any[]) {
    this.whereConditions.push({ column, operator: 'IN', value: values });
    return this;
  }

  is(column: string, value: any) {
    this.whereConditions.push({ column, operator: 'IS', value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    const direction = options.ascending === false ? 'DESC' : 'ASC';
    this.orderByColumns.push(`${column} ${direction}`);
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.singleRow = true;
    this.limitValue = 1;
    return this;
  }

  private buildWhereClause(values: any[], paramCounter: { count: number }): string {
    if (this.whereConditions.length === 0) return '';

    const clauses = this.whereConditions.map(condition => {
      if (condition.operator === 'IN') {
        const placeholders = condition.value.map(() => {
          values.push(condition.value.shift());
          return `$${++paramCounter.count}`;
        });
        return `${condition.column} IN (${placeholders.join(', ')})`;
      } else if (condition.operator === 'IS') {
        return `${condition.column} IS ${condition.value}`;
      } else {
        values.push(condition.value);
        return `${condition.column} ${condition.operator} $${++paramCounter.count}`;
      }
    });

    return 'WHERE ' + clauses.join(' AND ');
  }

  private buildQuery(): { query: string; values: any[] } {
    const values: any[] = [];
    const paramCounter = { count: 0 };

    switch (this.operation) {
      case 'insert': {
        if (!this.insertData?.length) throw new Error('No data to insert');
        
        const firstRow = this.insertData[0];
        const columns = Object.keys(firstRow);
        
        let query = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES `;
        
        const valueRows = this.insertData.map(() => {
          const placeholders = columns.map(() => `$${++paramCounter.count}`);
          return `(${placeholders.join(', ')})`;
        });
        
        // Flatten all values
        this.insertData.forEach(row => {
          columns.forEach(col => values.push(row[col]));
        });
        
        query += valueRows.join(', ') + ' RETURNING *';
        return { query, values };
      }

      case 'update': {
        if (!this.updateData) throw new Error('No data to update');
        
        const columns = Object.keys(this.updateData);
        let query = `UPDATE ${this.table} SET `;
        
        const setClauses = columns.map(col => {
          values.push(this.updateData[col]);
          return `${col} = $${++paramCounter.count}`;
        });
        
        query += setClauses.join(', ');
        
        const whereClause = this.buildWhereClause(values, paramCounter);
        if (whereClause) query += ' ' + whereClause;
        
        query += ' RETURNING *';
        return { query, values };
      }

      case 'delete': {
        let query = `DELETE FROM ${this.table}`;
        
        const whereClause = this.buildWhereClause(values, paramCounter);
        if (whereClause) query += ' ' + whereClause;
        
        query += ' RETURNING *';
        return { query, values };
      }

      default: {
        let query = `SELECT ${this.selectColumns} FROM ${this.table}`;
        
        const whereClause = this.buildWhereClause(values, paramCounter);
        if (whereClause) query += ' ' + whereClause;
        
        if (this.orderByColumns.length > 0) {
          query += ' ORDER BY ' + this.orderByColumns.join(', ');
        }
        
        if (this.limitValue) {
          query += ` LIMIT ${this.limitValue}`;
        }
        
        return { query, values };
      }
    }
  }

  async execute() {
    const { query, values } = this.buildQuery();
    
    try {
      const result = await pool.query(query, values);
      
      if (this.operation === 'select' || !this.operation) {
        const data = this.singleRow ? result.rows[0] || null : result.rows;
        return { data, error: null, count: result.rowCount };
      } else {
        return { data: result.rows, error: null, count: result.rowCount };
      }
    } catch (error: any) {
      console.error('Database error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message, 
          code: error.code,
          details: error.detail 
        } 
      };
    }
  }

  // Para compatibilidad con async/await
  then(onFulfilled?: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

// Cliente principal
export class NeonDatabaseClient implements DatabaseClient {
  from(table: string) {
    return new QueryBuilder(table);
  }

  async query(text: string, params?: any[]) {
    try {
      const result = await pool.query(text, params);
      return { data: result.rows, error: null, count: result.rowCount };
    } catch (error: any) {
      console.error('Database error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message, 
          code: error.code 
        } 
      };
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async end() {
    await pool.end();
  }
}

// Instancia singleton
export const database = new NeonDatabaseClient();

// Función para verificar conexión
export async function checkDatabaseConnection() {
  try {
    const result = await database.query('SELECT NOW() as timestamp, current_database() as database');
    return {
      connected: true,
      timestamp: result.data?.[0]?.timestamp,
      database: result.data?.[0]?.database
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}