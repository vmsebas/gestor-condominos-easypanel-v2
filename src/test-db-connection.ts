import { pool } from '@/lib/database';

interface TableRow {
  table_name: string;
}

async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Current database time:', result.rows[0].current_time);
    
    // List all tables in the database
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📊 Database tables:');
    tables.rows.forEach((row: TableRow, index: number) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error connecting to the database:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
