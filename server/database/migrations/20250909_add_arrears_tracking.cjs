exports.up = async function(knex) {
  // Primero verificar si los campos existen antes de agregarlos
  const hasStatusColumn = await knex.schema.hasColumn('transactions', 'status');
  const hasDueDateColumn = await knex.schema.hasColumn('transactions', 'due_date');
  const hasPaymentDateColumn = await knex.schema.hasColumn('transactions', 'payment_date');
  const hasPaymentStatusColumn = await knex.schema.hasColumn('transactions', 'payment_status');
  
  // Agregar columnas faltantes a transactions
  if (!hasStatusColumn || !hasDueDateColumn || !hasPaymentDateColumn || !hasPaymentStatusColumn) {
    await knex.schema.alterTable('transactions', function(table) {
      if (!hasStatusColumn) {
        table.string('status').defaultTo('pending');
        // pending = pendiente de pago
        // paid = pagado
        // overdue = vencido
        // cancelled = cancelado
      }
      if (!hasDueDateColumn) {
        table.date('due_date');
      }
      if (!hasPaymentDateColumn) {
        table.date('payment_date');
      }
      if (!hasPaymentStatusColumn) {
        table.string('payment_status');
      }
    });
  }

  // Crear índices para mejorar rendimiento
  const indexExists = await knex.raw(`
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'transactions' 
    AND indexname = 'idx_transactions_status_due_date'
  `);
  
  if (indexExists.rows.length === 0) {
    await knex.raw(`
      CREATE INDEX idx_transactions_status_due_date 
      ON transactions(status, due_date) 
      WHERE status IN ('pending', 'overdue')
    `);
  }

  const arrearsIndexExists = await knex.raw(`
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'arrears' 
    AND indexname = 'idx_arrears_member_status'
  `);
  
  if (arrearsIndexExists.rows.length === 0) {
    await knex.raw(`
      CREATE INDEX idx_arrears_member_status 
      ON arrears(member_id, status)
    `);
  }

  // Crear tabla para historial de pagos si no existe
  const hasPaymentHistoryTable = await knex.schema.hasTable('payment_history');
  
  if (!hasPaymentHistoryTable) {
    await knex.schema.createTable('payment_history', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('transaction_id').references('id').inTable('transactions');
      table.uuid('member_id').references('id').inTable('members');
      table.uuid('building_id').references('id').inTable('buildings');
      table.decimal('amount', 10, 2).notNullable();
      table.date('payment_date').notNullable();
      table.string('payment_method');
      table.string('reference');
      table.text('notes');
      table.timestamps(true, true);
      
      table.index(['member_id', 'payment_date']);
      table.index(['building_id', 'payment_date']);
    });
  }

  // Crear tabla para configuración de morosidad por edificio
  const hasArrearsConfigTable = await knex.schema.hasTable('arrears_config');
  
  if (!hasArrearsConfigTable) {
    await knex.schema.createTable('arrears_config', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('building_id').references('id').inTable('buildings').unique();
      table.integer('grace_period_days').defaultTo(10); // Días de gracia antes de considerar moroso
      table.decimal('late_fee_percentage', 5, 2).defaultTo(0); // Porcentaje de recargo (0 = sin recargo)
      table.boolean('send_reminders').defaultTo(true);
      table.integer('reminder_frequency_days').defaultTo(7); // Cada cuántos días enviar recordatorios
      table.integer('max_reminders').defaultTo(3); // Máximo de recordatorios
      table.boolean('auto_generate_arrears').defaultTo(true); // Generar automáticamente registros de morosidad
      table.timestamps(true, true);
    });
  }

  console.log('✅ Migração de morosidade aplicada com sucesso');
};

exports.down = async function(knex) {
  // Eliminar índices
  await knex.raw('DROP INDEX IF EXISTS idx_transactions_status_due_date');
  await knex.raw('DROP INDEX IF EXISTS idx_arrears_member_status');
  
  // Eliminar tablas creadas
  await knex.schema.dropTableIfExists('arrears_config');
  await knex.schema.dropTableIfExists('payment_history');
  
  // Eliminar columnas agregadas
  const hasColumns = await knex.schema.hasColumn('transactions', 'status');
  if (hasColumns) {
    await knex.schema.alterTable('transactions', function(table) {
      table.dropColumn('status');
      table.dropColumn('due_date');
      table.dropColumn('payment_date');
      table.dropColumn('payment_status');
    });
  }
};