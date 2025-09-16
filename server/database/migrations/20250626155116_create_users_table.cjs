
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // User info
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('phone', 50);
    
    // Role and permissions
    table.enum('role', ['super_admin', 'admin', 'manager', 'member']).defaultTo('member');
    table.jsonb('permissions').defaultTo('{}');
    
    // Status
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    
    // Security
    table.string('reset_password_token', 255);
    table.timestamp('reset_password_expires');
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until');
    
    // Associations (estas columnas serán foreign keys después de que se creen las tablas)
    table.uuid('building_id');
    table.uuid('member_id');
    
    // Timestamps
    table.timestamps(true, true);
    table.timestamp('last_login_at');
    table.timestamp('deleted_at');
    
    // Indexes
    table.index('email');
    table.index('role');
    table.index('building_id');
    table.index('is_active');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
