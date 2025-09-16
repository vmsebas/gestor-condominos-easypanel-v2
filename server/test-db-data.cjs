const knex = require('knex');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['public'],
  pool: {
    min: 2,
    max: 10
  }
});

async function checkDatabaseContent() {
  try {
    console.log('=== VERIFICANDO CONTENIDO DE LA BASE DE DATOS ===\n');
    
    // Buildings
    const buildingsCount = await db('buildings').count('* as count').first();
    console.log(`📢 BUILDINGS: ${buildingsCount.count} registros`);
    const buildings = await db('buildings').select('*').limit(5);
    console.table(buildings);
    
    // Members
    const membersCount = await db('members').count('* as count').first();
    console.log(`\n📢 MEMBERS: ${membersCount.count} registros`);
    const members = await db('members').select('*').limit(5);
    console.table(members);
    
    // Convocatorias
    const convocatoriasCount = await db('convocatorias').count('* as count').first();
    console.log(`\n📢 CONVOCATORIAS: ${convocatoriasCount.count} registros`);
    const convocatorias = await db('convocatorias').select('*').limit(5);
    console.table(convocatorias);
    
    // Minutes (Actas)
    const minutesCount = await db('minutes').count('* as count').first();
    console.log(`\n📢 MINUTES/ACTAS: ${minutesCount.count} registros`);
    const minutes = await db('minutes').select('*').limit(5);
    console.table(minutes);
    
    // Transactions
    const transactionsCount = await db('transactions').count('* as count').first();
    console.log(`\n📢 TRANSACTIONS: ${transactionsCount.count} registros`);
    const transactions = await db('transactions').select('*').limit(5);
    console.table(transactions);
    
    // Users
    const usersCount = await db('users').count('* as count').first();
    console.log(`\n📢 USERS: ${usersCount.count} registros`);
    const users = await db('users').select('id', 'name', 'email', 'role', 'building_id').limit(5);
    console.table(users);
    
    // Building-Member relationships
    console.log('\n📢 RELACIONES BUILDING-MEMBER:');
    const buildingMembers = await db('buildings as b')
      .leftJoin('members as m', 'b.id', 'm.building_id')
      .select('b.id', 'b.name')
      .count('m.id as member_count')
      .groupBy('b.id', 'b.name');
    console.table(buildingMembers);
    
    // Check if there are any auth issues
    console.log('\n📢 VERIFICANDO TOKENS DE USUARIO:');
    const tokensCount = await db('user_tokens').count('* as count').first();
    console.log(`User tokens: ${tokensCount.count} registros`);
    
  } catch (error) {
    console.error('❌ ERROR al verificar base de datos:', error);
  } finally {
    await db.destroy();
  }
}

checkDatabaseContent();