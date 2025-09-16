require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './server/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './server/database/seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  production: {
    client: 'postgresql', 
    connection: process.env.DATABASE_URL, // Solo usar base de datos local
    migrations: {
      directory: './server/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './server/database/seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  test: {
    client: 'postgresql',
    connection: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    migrations: {
      directory: './server/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './server/database/seeds'
    }
  }
};