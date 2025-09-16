const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  try {
    console.log('\n🔍 VERIFICANDO DATOS EN LA BASE DE DATOS...\n');
    
    // Buildings
    const buildings = await pool.query('SELECT id, name, address FROM buildings');
    console.log('🏢 EDIFICIOS:', buildings.rows.length);
    buildings.rows.forEach(b => console.log(`  - ID: ${b.id}, ${b.name} (${b.address})`));
    
    // Members - primero verificar estructura
    const memberColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'members' 
      ORDER BY ordinal_position
    `);
    console.log('\n👥 ESTRUCTURA TABLA MEMBERS:');
    console.log('  Columnas:', memberColumns.rows.map(c => c.column_name).join(', '));
    
    // Members datos
    const members = await pool.query('SELECT m.*, b.name as building_name FROM members m JOIN buildings b ON m.building_id = b.id ORDER BY b.id');
    console.log('\n👥 MIEMBROS:', members.rows.length);
    members.rows.forEach(m => console.log(`  - ${m.name} (${m.building_name})`));
    
    // Convocatorias
    const convocatorias = await pool.query('SELECT c.*, b.name as building_name FROM convocatorias c JOIN buildings b ON c.building_id = b.id ORDER BY c.date DESC');
    console.log('\n📋 CONVOCATORIAS:', convocatorias.rows.length);
    convocatorias.rows.forEach(c => console.log(`  - ${c.title} - ${new Date(c.date).toLocaleDateString()} (${c.building_name})`));
    
    // Actas
    const actas = await pool.query('SELECT m.*, b.name as building_name FROM minutes m JOIN buildings b ON m.building_id = b.id');
    console.log('\n📄 ACTAS:', actas.rows.length);
    actas.rows.forEach(a => console.log(`  - ${a.title || 'Sin título'} (${a.building_name})`));
    
    // Users
    const users = await pool.query('SELECT id, email, role, building_id FROM users');
    console.log('\n👤 USUARIOS:', users.rows.length);
    users.rows.forEach(u => console.log(`  - ${u.email} (${u.role}, Building ID: ${u.building_id})`));
    
    // Transactions
    const transactions = await pool.query('SELECT COUNT(*) as count FROM transactions');
    console.log('\n💰 TRANSACCIONES:', transactions.rows[0].count);
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

checkData();