
exports.up = function(knex) {
  return knex.schema.createTable('refresh_tokens', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Token info
    table.string('token', 500).notNullable().unique();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Device info
    table.string('device_id', 255);
    table.string('device_name', 255);
    table.string('ip_address', 45);
    table.text('user_agent');
    
    // Expiration
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);
    table.timestamp('revoked_at');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index('token');
    table.index('user_id');
    table.index('expires_at');
    table.index('is_revoked');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('refresh_tokens');
};
