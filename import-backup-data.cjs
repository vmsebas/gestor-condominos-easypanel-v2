const fs = require('fs');
const path = require('path');
const { pool } = require('./server/config/database.cjs');

async function importBackupData() {
  try {
    console.log('🔄 Iniciando importación de datos del backup...');
    
    // Leer el archivo de backup
    const backupPath = '/Users/mini-server/docker-apps/apps/gestor-condominos_OLD/exported-data.json';
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('📋 Datos encontrados en backup:');
    Object.keys(backupData).forEach(key => {
      if (Array.isArray(backupData[key])) {
        console.log(`  - ${key}: ${backupData[key].length} registros`);
      }
    });
    
    // Limpiar datos existentes (opcional - comentar si no se desea)
    console.log('🗑️ Limpiando datos existentes...');
    
    const tablesToClean = [
      'document_shares', 'documents', 'minutes', 'convocatorias', 
      'transactions', 'members', 'buildings', 'users', 'refresh_tokens',
      'user_sessions', 'document_categories', 'transaction_categories',
      'financial_periods', 'fractions', 'tasks'
    ];
    
    for (const table of tablesToClean) {
      try {
        await pool.query(`DELETE FROM ${table}`);
        console.log(`  ✅ Limpiada tabla: ${table}`);
      } catch (error) {
        console.log(`  ⚠️ No se pudo limpiar tabla ${table}: ${error.message}`);
      }
    }
    
    // Importar datos
    console.log('\n📥 Importando datos...');
    
    // 1. Buildings
    if (backupData.buildings && backupData.buildings.length > 0) {
      console.log('🏢 Importando buildings...');
      for (const building of backupData.buildings) {
        await pool.query(`
          INSERT INTO buildings (
            id, name, address, postal_code, city, number_of_units,
            administrator, admin_contact, admin_email, iban, bank,
            account_number, swift, phone, email, president_name,
            president_email, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
          )
        `, [
          building.id, building.name, building.address, building.postal_code,
          building.city, building.number_of_units, building.administrator,
          building.admin_contact, building.admin_email, building.iban,
          building.bank, building.account_number, building.swift,
          building.phone, building.email, building.president_name,
          building.president_email, building.created_at, building.updated_at
        ]);
      }
      console.log(`  ✅ Importados ${backupData.buildings.length} buildings`);
    }
    
    // 2. Members
    if (backupData.members && backupData.members.length > 0) {
      console.log('👥 Importando members...');
      for (const member of backupData.members) {
        await pool.query(`
          INSERT INTO members (
            id, name, apartment, building_id, fraction, votes, email, phone,
            profile_image, notes, old_annual_fee, old_monthly_fee,
            new_annual_fee, new_monthly_fee, permilage, is_active, nif,
            secondary_address, secondary_postal_code, secondary_city,
            secondary_country, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
          )
        `, [
          member.id, member.name, member.apartment, member.building_id,
          member.fraction, member.votes, member.email, member.phone,
          member.profile_image, member.notes, member.old_annual_fee,
          member.old_monthly_fee, member.new_annual_fee, member.new_monthly_fee,
          member.permilage, member.is_active, member.nif,
          member.secondary_address, member.secondary_postal_code,
          member.secondary_city, member.secondary_country,
          member.created_at, member.updated_at
        ]);
      }
      console.log(`  ✅ Importados ${backupData.members.length} members`);
    }
    
    // 3. Users
    if (backupData.users && backupData.users.length > 0) {
      console.log('👤 Importando users...');
      for (const user of backupData.users) {
        await pool.query(`
          INSERT INTO users (
            id, email, password_hash, name, role, building_id, member_id,
            is_active, email_verified, last_login_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
        `, [
          user.id, user.email, user.password_hash, user.name || user.email.split('@')[0],
          user.role, user.building_id, user.member_id, user.is_active,
          user.email_verified, user.last_login_at || user.last_login, user.created_at, user.updated_at
        ]);
      }
      console.log(`  ✅ Importados ${backupData.users.length} users`);
    }
    
    // 4. Convocatorias
    if (backupData.convocatorias && backupData.convocatorias.length > 0) {
      console.log('📋 Importando convocatorias...');
      for (const conv of backupData.convocatorias) {
        await pool.query(`
          INSERT INTO convocatorias (
            id, building_id, building_name, building_address, postal_code,
            assembly_number, assembly_type, date, time, location,
            second_call_enabled, second_call_time, second_call_date,
            administrator, secretary, legal_reference, minutes_created,
            agenda_items, city, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
          )
        `, [
          conv.id, conv.building_id, conv.building_name, conv.building_address,
          conv.postal_code, conv.assembly_number, conv.assembly_type,
          conv.date, conv.time, conv.location, conv.second_call_enabled,
          conv.second_call_time, conv.second_call_date, conv.administrator,
          conv.secretary, conv.legal_reference, conv.minutes_created,
          JSON.stringify(conv.agenda_items), conv.city, conv.created_at, conv.updated_at
        ]);
      }
      console.log(`  ✅ Importadas ${backupData.convocatorias.length} convocatorias`);
    }
    
    // 5. Minutes
    if (backupData.minutes && backupData.minutes.length > 0) {
      console.log('📝 Importando minutes...');
      for (const minute of backupData.minutes) {
        // Obtener building_id de la convocatoria relacionada
        let buildingId = null;
        if (minute.convocatoria_id) {
          const convocatoriaResult = await pool.query(
            'SELECT building_id FROM convocatorias WHERE id = $1',
            [minute.convocatoria_id]
          );
          if (convocatoriaResult.rows.length > 0) {
            buildingId = convocatoriaResult.rows[0].building_id;
          }
        }
        
        // Si no encontramos building_id, usar el primer building disponible
        if (!buildingId) {
          const firstBuildingResult = await pool.query('SELECT id FROM buildings LIMIT 1');
          if (firstBuildingResult.rows.length > 0) {
            buildingId = firstBuildingResult.rows[0].id;
          }
        }
        
        await pool.query(`
          INSERT INTO minutes (
            id, building_id, convocatoria_id, minute_number, meeting_date, meeting_time,
            end_time, location, assembly_type, building_address, building_name,
            postal_code, president_name, administrator_custom, secretary_name,
            secretary_custom, conclusions, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
        `, [
          minute.id, buildingId, minute.convocatoria_id, minute.minute_number,
          minute.meeting_date, minute.meeting_time, minute.end_time,
          minute.location, minute.assembly_type, minute.building_address,
          minute.building_name, minute.postal_code, minute.president_name,
          minute.administrator_custom, minute.secretary_name,
          minute.secretary_custom, minute.conclusions, minute.status,
          minute.created_at, minute.updated_at
        ]);
      }
      console.log(`  ✅ Importadas ${backupData.minutes.length} minutes`);
    }
    
    // 6. Transactions
    if (backupData.transactions && backupData.transactions.length > 0) {
      console.log('💰 Importando transactions...');
      for (const tx of backupData.transactions) {
        await pool.query(`
          INSERT INTO transactions (
            id, building_id, period_id, category_id, transaction_date,
            transaction_type, description, amount, fraction_id, member_id,
            payment_method, reference_number, notes, receipt_url,
            is_recurring, recurring_months, year, is_fee_payment,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
        `, [
          tx.id, tx.building_id, tx.period_id, tx.category_id,
          tx.transaction_date, tx.transaction_type, tx.description,
          tx.amount, tx.fraction_id, tx.member_id, tx.payment_method,
          tx.reference_number, tx.notes, tx.receipt_url, tx.is_recurring,
          tx.recurring_months ? JSON.stringify(tx.recurring_months) : null, tx.year, tx.is_fee_payment,
          tx.created_at, tx.updated_at
        ]);
      }
      console.log(`  ✅ Importadas ${backupData.transactions.length} transactions`);
    }
    
    // 7. Documents
    if (backupData.documents && backupData.documents.length > 0) {
      console.log('📄 Importando documents...');
      for (const doc of backupData.documents) {
        await pool.query(`
          INSERT INTO documents (
            id, building_id, member_id, name, original_name, file_path,
            file_size, mime_type, file_extension, category, subcategory,
            tags, description, version, parent_document_id, is_current_version,
            visibility, is_confidential, access_level, uploaded_by,
            uploaded_at, last_accessed_at, download_count, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
          )
        `, [
          doc.id, doc.building_id, doc.member_id, doc.name, doc.original_name,
          doc.file_path, doc.file_size, doc.mime_type, doc.file_extension,
          doc.category, doc.subcategory, JSON.stringify(doc.tags),
          doc.description, doc.version, doc.parent_document_id,
          doc.is_current_version, doc.visibility, doc.is_confidential,
          doc.access_level, doc.uploaded_by, doc.uploaded_at,
          doc.last_accessed_at, doc.download_count, doc.created_at, doc.updated_at
        ]);
      }
      console.log(`  ✅ Importados ${backupData.documents.length} documents`);
    }
    
    // 8. Tasks
    if (backupData.tasks && backupData.tasks.length > 0) {
      console.log('📋 Importando tasks...');
      for (const task of backupData.tasks) {
        await pool.query(`
          INSERT INTO tasks (
            id, building_id, title, description, category, priority,
            status, assignee_id, due_date, estimated_cost, actual_cost,
            provider_name, provider_contact, notes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )
        `, [
          task.id, task.building_id, task.title, task.description,
          task.category, task.priority, task.status, task.assignee_id,
          task.due_date, task.estimated_cost, task.actual_cost,
          task.provider_name, task.provider_contact, task.notes,
          task.created_at, task.updated_at
        ]);
      }
      console.log(`  ✅ Importadas ${backupData.tasks.length} tasks`);
    }
    
    console.log('\n🎉 Importación completada exitosamente!');
    
    // Verificar datos importados
    console.log('\n📊 Verificando datos importados:');
    const tables = ['buildings', 'members', 'users', 'convocatorias', 'minutes', 'transactions', 'documents', 'tasks'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  - ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`  - ${table}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Ejecutar importación
importBackupData();
