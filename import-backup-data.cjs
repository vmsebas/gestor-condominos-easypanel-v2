#!/usr/bin/env node
/*
 * Restaura datos reales de la copia exportada situada en
 * ../gestor-condominos_OLD/exported-data.json. Ejecuta este script
 * una vez que la base de datos local PostgreSQL esté corriendo y la
 * variable DATABASE_URL apunte a ella.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('./server/config/database.cjs');

const BACKUP_PATH = process.env.BACKUP_JSON_PATH
  ? path.resolve(process.env.BACKUP_JSON_PATH)
  : path.resolve(__dirname, '../gestor-condominos_OLD/exported-data.json');

const DEFAULT_BUILDING_ID = process.env.DEFAULT_BUILDING_ID || '9cf64a8a-8570-4f16-94a5-dd48c694324c';

function handleConnectionFailure(error) {
  console.error('\n❌ No fue posible conectarse a PostgreSQL.');
  if (process.env.DATABASE_URL) {
    console.error(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
  }
  console.error('   Verifica que el servicio esté en ejecución y que las credenciales sean correctas.');
  if (error) {
    console.error(`   Detalles: ${error.message}`);
  }
}

function summarizeDataset(data) {
  console.log('📋 Datos encontrados en backup:');
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      console.log(`  - ${key}: ${value.length} registros`);
    }
  });
}

function normaliseAmount(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function importBackupData() {
  if (!fs.existsSync(BACKUP_PATH)) {
    console.error('❌ No se encontró el archivo de backup en:', BACKUP_PATH);
    console.error('    Actualiza BACKUP_JSON_PATH o coloca exported-data.json en la carpeta esperada.');
    process.exit(1);
  }

  const raw = fs.readFileSync(BACKUP_PATH, 'utf8');
  const backupData = JSON.parse(raw);

  summarizeDataset(backupData);

  let client;
  try {
    client = await pool.connect();
  } catch (connectionError) {
    handleConnectionFailure(connectionError);
    process.exit(1);
  }

  try {
    console.log('\n🧹 Limpiando tablas existentes (operación en transacción)...');

    await client.query('BEGIN');

    const tablesToClean = [
      'document_shares',
      'documents',
      'minutes',
      'convocatorias',
      'transactions',
      'members',
      'buildings',
      'users',
      'refresh_tokens',
      'user_sessions',
      'document_categories',
      'transaction_categories',
      'financial_periods',
      'fractions',
      'tasks'
    ];

    for (const table of tablesToClean) {
      try {
        await client.query(`DELETE FROM ${table}`);
        console.log(`  ✅ Tabla ${table} limpiada`);
      } catch (error) {
        console.log(`  ⚠️ No se pudo limpiar ${table}: ${error.message}`);
      }
    }

    console.log('\n📥 Importando datos reales...');

    // Buildings
    if (Array.isArray(backupData.buildings)) {
      for (const building of backupData.buildings) {
        await client.query(
          `INSERT INTO buildings (
            id, name, address, postal_code, city, number_of_units,
            administrator, admin_contact, admin_email, iban, bank,
            account_number, swift, phone, email, president_name,
            president_email, secretary_name, secretary_email,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            postal_code = EXCLUDED.postal_code,
            city = EXCLUDED.city,
            number_of_units = EXCLUDED.number_of_units,
            administrator = EXCLUDED.administrator,
            admin_contact = EXCLUDED.admin_contact,
            admin_email = EXCLUDED.admin_email,
            iban = EXCLUDED.iban,
            bank = EXCLUDED.bank,
            account_number = EXCLUDED.account_number,
            swift = EXCLUDED.swift,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            president_name = EXCLUDED.president_name,
            president_email = EXCLUDED.president_email,
            secretary_name = EXCLUDED.secretary_name,
            secretary_email = EXCLUDED.secretary_email,
            updated_at = EXCLUDED.updated_at
        `,
          [
            building.id,
            building.name,
            building.address,
            building.postal_code,
            building.city,
            building.number_of_units,
            building.administrator,
            building.admin_contact,
            building.admin_email,
            building.iban,
            building.bank,
            building.account_number,
            building.swift,
            building.phone,
            building.email,
            building.president_name,
            building.president_email,
            building.secretary_name,
            building.secretary_email,
            building.created_at,
            building.updated_at
          ]
        );
      }
      console.log(`  🏢 Buildings importados: ${backupData.buildings.length}`);
    }

    // Members
    if (Array.isArray(backupData.members)) {
      for (const member of backupData.members) {
        await client.query(
          `INSERT INTO members (
            id, name, apartment, building_id, fraction, votes,
            email, phone, profile_image, notes, old_annual_fee,
            old_monthly_fee, new_annual_fee, new_monthly_fee,
            permilage, is_active, nif, secondary_address,
            secondary_postal_code, secondary_city, secondary_country,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            apartment = EXCLUDED.apartment,
            building_id = EXCLUDED.building_id,
            fraction = EXCLUDED.fraction,
            votes = EXCLUDED.votes,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            profile_image = EXCLUDED.profile_image,
            notes = EXCLUDED.notes,
            old_annual_fee = EXCLUDED.old_annual_fee,
            old_monthly_fee = EXCLUDED.old_monthly_fee,
            new_annual_fee = EXCLUDED.new_annual_fee,
            new_monthly_fee = EXCLUDED.new_monthly_fee,
            permilage = EXCLUDED.permilage,
            is_active = EXCLUDED.is_active,
            nif = EXCLUDED.nif,
            secondary_address = EXCLUDED.secondary_address,
            secondary_postal_code = EXCLUDED.secondary_postal_code,
            secondary_city = EXCLUDED.secondary_city,
            secondary_country = EXCLUDED.secondary_country,
            updated_at = EXCLUDED.updated_at
        `,
          [
            member.id,
            member.name,
            member.apartment,
            member.building_id,
            member.fraction,
            member.votes,
            member.email,
            member.phone,
            member.profile_image,
            member.notes,
            normaliseAmount(member.old_annual_fee),
            normaliseAmount(member.old_monthly_fee),
            normaliseAmount(member.new_annual_fee),
            normaliseAmount(member.new_monthly_fee),
            normaliseAmount(member.permilage),
            member.is_active,
            member.nif,
            member.secondary_address,
            member.secondary_postal_code,
            member.secondary_city,
            member.secondary_country,
            member.created_at,
            member.updated_at
          ]
        );
      }
      console.log(`  👥 Members importados: ${backupData.members.length}`);
    }

    // Users
    if (Array.isArray(backupData.users)) {
      for (const user of backupData.users) {
        await client.query(
          `INSERT INTO users (
            id, email, password_hash, name, role, building_id, member_id,
            is_active, email_verified, last_login_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            building_id = EXCLUDED.building_id,
            member_id = EXCLUDED.member_id,
            is_active = EXCLUDED.is_active,
            email_verified = EXCLUDED.email_verified,
            last_login_at = EXCLUDED.last_login_at,
            updated_at = EXCLUDED.updated_at
        `,
          [
            user.id,
            user.email,
            user.password_hash,
            user.name || user.email?.split('@')[0] || 'user',
            user.role || 'member',
            user.building_id || DEFAULT_BUILDING_ID,
            user.member_id,
            user.is_active !== false,
            user.email_verified === true,
            user.last_login_at || user.last_login || null,
            user.created_at,
            user.updated_at
          ]
        );
      }
      console.log(`  👤 Users importados: ${backupData.users.length}`);
    }

    // Convocatorias
    if (Array.isArray(backupData.convocatorias)) {
      for (const conv of backupData.convocatorias) {
        await client.query(
          `INSERT INTO convocatorias (
            id, building_id, building_name, building_address, postal_code,
            assembly_number, assembly_type, date, time, location,
            second_call_enabled, second_call_time, second_call_date,
            administrator, secretary, legal_reference, minutes_created,
            agenda_items, city, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
          )
          ON CONFLICT (id) DO UPDATE SET
            building_id = EXCLUDED.building_id,
            building_name = EXCLUDED.building_name,
            building_address = EXCLUDED.building_address,
            postal_code = EXCLUDED.postal_code,
            assembly_number = EXCLUDED.assembly_number,
            assembly_type = EXCLUDED.assembly_type,
            date = EXCLUDED.date,
            time = EXCLUDED.time,
            location = EXCLUDED.location,
            second_call_enabled = EXCLUDED.second_call_enabled,
            second_call_time = EXCLUDED.second_call_time,
            second_call_date = EXCLUDED.second_call_date,
            administrator = EXCLUDED.administrator,
            secretary = EXCLUDED.secretary,
            legal_reference = EXCLUDED.legal_reference,
            minutes_created = EXCLUDED.minutes_created,
            agenda_items = EXCLUDED.agenda_items,
            city = EXCLUDED.city,
            updated_at = EXCLUDED.updated_at
        `,
          [
            conv.id,
            conv.building_id,
            conv.building_name,
            conv.building_address,
            conv.postal_code,
            conv.assembly_number,
            conv.assembly_type,
            conv.date,
            conv.time,
            conv.location,
            conv.second_call_enabled,
            conv.second_call_time,
            conv.second_call_date,
            conv.administrator,
            conv.secretary,
            conv.legal_reference,
            conv.minutes_created,
            conv.agenda_items ? JSON.stringify(conv.agenda_items) : null,
            conv.city,
            conv.created_at,
            conv.updated_at
          ]
        );
      }
      console.log(`  📋 Convocatorias importadas: ${backupData.convocatorias.length}`);
    }

    // Minutes
    if (Array.isArray(backupData.minutes)) {
      for (const minute of backupData.minutes) {
        let buildingId = minute.building_id;
        if (!buildingId && minute.convocatoria_id) {
          const { rows } = await client.query('SELECT building_id FROM convocatorias WHERE id = $1 LIMIT 1', [minute.convocatoria_id]);
          buildingId = rows[0]?.building_id || DEFAULT_BUILDING_ID;
        }

        await client.query(
          `INSERT INTO minutes (
            id, building_id, convocatoria_id, minute_number, meeting_date,
            meeting_time, end_time, location, assembly_type,
            building_address, building_name, postal_code, president_name,
            administrator_custom, secretary_name, secretary_custom,
            conclusions, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
          ON CONFLICT (id) DO UPDATE SET
            building_id = EXCLUDED.building_id,
            convocatoria_id = EXCLUDED.convocatoria_id,
            minute_number = EXCLUDED.minute_number,
            meeting_date = EXCLUDED.meeting_date,
            meeting_time = EXCLUDED.meeting_time,
            end_time = EXCLUDED.end_time,
            location = EXCLUDED.location,
            assembly_type = EXCLUDED.assembly_type,
            building_address = EXCLUDED.building_address,
            building_name = EXCLUDED.building_name,
            postal_code = EXCLUDED.postal_code,
            president_name = EXCLUDED.president_name,
            administrator_custom = EXCLUDED.administrator_custom,
            secretary_name = EXCLUDED.secretary_name,
            secretary_custom = EXCLUDED.secretary_custom,
            conclusions = EXCLUDED.conclusions,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
        `,
          [
            minute.id,
            buildingId || DEFAULT_BUILDING_ID,
            minute.convocatoria_id,
            minute.minute_number,
            minute.meeting_date,
            minute.meeting_time,
            minute.end_time,
            minute.location,
            minute.assembly_type,
            minute.building_address,
            minute.building_name,
            minute.postal_code,
            minute.president_name,
            minute.administrator_custom,
            minute.secretary_name,
            minute.secretary_custom,
            minute.conclusions,
            minute.status,
            minute.created_at,
            minute.updated_at
          ]
        );
      }
      console.log(`  📝 Minutes importadas: ${backupData.minutes.length}`);
    }

    // Transactions
    if (Array.isArray(backupData.transactions)) {
      for (const tx of backupData.transactions) {
        await client.query(
          `INSERT INTO transactions (
            id, building_id, period_id, category_id, transaction_date,
            transaction_type, description, amount, fraction_id, member_id,
            payment_method, reference_number, notes, receipt_url,
            is_recurring, recurring_months, year, is_fee_payment,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
          ON CONFLICT (id) DO UPDATE SET
            building_id = EXCLUDED.building_id,
            period_id = EXCLUDED.period_id,
            category_id = EXCLUDED.category_id,
            transaction_date = EXCLUDED.transaction_date,
            transaction_type = EXCLUDED.transaction_type,
            description = EXCLUDED.description,
            amount = EXCLUDED.amount,
            fraction_id = EXCLUDED.fraction_id,
            member_id = EXCLUDED.member_id,
            payment_method = EXCLUDED.payment_method,
            reference_number = EXCLUDED.reference_number,
            notes = EXCLUDED.notes,
            receipt_url = EXCLUDED.receipt_url,
            is_recurring = EXCLUDED.is_recurring,
            recurring_months = EXCLUDED.recurring_months,
            year = EXCLUDED.year,
            is_fee_payment = EXCLUDED.is_fee_payment,
            updated_at = EXCLUDED.updated_at
        `,
          [
            tx.id,
            tx.building_id || DEFAULT_BUILDING_ID,
            tx.period_id || tx.financial_period_id || null,
            tx.category_id,
            tx.transaction_date || tx.date,
            tx.transaction_type || tx.type,
            tx.description,
            normaliseAmount(tx.amount),
            tx.fraction_id,
            tx.member_id,
            tx.payment_method,
            tx.reference_number,
            tx.notes || tx.admin_notes,
            tx.receipt_url,
            tx.is_recurring === true,
            tx.recurring_months || null,
            tx.year,
            tx.is_fee_payment === true,
            tx.created_at,
            tx.updated_at
          ]
        );
      }
      console.log(`  💰 Transactions importadas: ${backupData.transactions.length}`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Importación completada. Resumen final:');
    const tablesToCheck = ['buildings', 'members', 'users', 'convocatorias', 'minutes', 'transactions'];
    for (const table of tablesToCheck) {
      try {
        const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
        console.log(`  - ${table}: ${rows[0].count}`);
      } catch (error) {
        console.log(`  - ${table}: error al contar (${error.message})`);
      }
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('⚠️ Error al revertir la transacción:', rollbackError.message);
    }

    const connectionErrors = ['EPERM', 'ECONNREFUSED', 'ENOTFOUND'];
    const aggregatedErrors = Array.isArray(error?.errors) ? error.errors : [];
    const hasConnectionIssue =
      connectionErrors.includes(error.code) ||
      aggregatedErrors.some((err) => connectionErrors.includes(err.code));

    if (hasConnectionIssue) {
      console.error('\n❌ No fue posible conectarse a PostgreSQL.');
      console.error('   Verifica que el servicio esté en ejecución y que DATABASE_URL sea correcta.');
      console.error('   Ejemplo local: postgresql://usuario:password@localhost:5432/gestor_condominos');
    } else {
      console.error('\n❌ Error durante la importación:', error.message);
    }

    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

importBackupData().catch((error) => {
  handleConnectionFailure(error);
  process.exit(1);
});
