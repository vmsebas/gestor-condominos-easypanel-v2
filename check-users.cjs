const { db } = require('./server/config/knex.cjs');

async function checkUsers() {
  try {
    const users = await db('users').select('id', 'email', 'name', 'role', 'is_active', 'building_id');
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    
    // También vamos a verificar si existe alguna transacción para probar morosidad
    const transactions = await db('transactions')
      .select('id', 'member_id', 'amount', 'status', 'due_date', 'payment_status', 'transaction_type')
      .limit(5);
    console.log('\nSample transactions:');
    console.log(JSON.stringify(transactions, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();