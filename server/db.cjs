const knex = require('knex');
require('dotenv').config();

// Solo usar base de datos local
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ No database connection string found in environment variables!');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

// Initialize Knex
const knexInstance = knex({
  client: 'pg',
  connection: {
    connectionString,
    ssl: false // No SSL para base de datos local
  },
  pool: {
    min: 2,
    max: 10
  },
  searchPath: ['public'],
  debug: process.env.DEBUG === 'true'
});

module.exports = {
  knex: knexInstance
};