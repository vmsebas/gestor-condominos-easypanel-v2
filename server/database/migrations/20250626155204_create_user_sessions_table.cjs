
exports.up = function(knex) {
  return knex.schema.createTable('user_sessions', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Session info
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('session_token', 500).notNullable().unique();
    
    // Activity tracking
    table.jsonb('activity_log').defaultTo('[]');
    table.timestamp('last_activity_at').defaultTo(knex.fn.now());
    
    // Device and location
    table.string('ip_address', 45);
    table.text('user_agent');
    table.string('device_type', 50);
    table.string('browser', 50);
    table.string('os', 50);
    table.string('country', 2);
    table.string('city', 100);
    
    // Status
    table.boolean('is_active').defaultTo(true);
    table.timestamp('expires_at').notNullable();
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index('session_token');
    table.index('user_id');
    table.index('is_active');
    table.index('expires_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_sessions');
};
