#!/usr/bin/env node

/**
 * Script para importar extracto bancario CSV a la base de datos
 *
 * Uso:
 *   node scripts/import-bank-csv.js <archivo.csv>
 *
 * Formato esperado del CSV:
 *   "Cuentas","Transferencias","Descripción","Beneficiario","Categoría","Fecha","Hora","Memoria","Importe","Moneda","Número de cheque","Etiquetas"
 *
 * Funcionalidades:
 *   - Inserta transacciones en la tabla 'transactions'
 *   - Identifica condóminos por nombre/beneficiario
 *   - Mapea categorías bancarias a categorías del sistema
 *   - Crea categorías automáticamente si no existen
 *   - Marca pagos de quotas con is_fee_payment=true
 *
 * NUEVO - Integración con Sistema de Períodos Financieros:
 *   - Cuando detecta un pago de quota (is_fee_payment=true):
 *     • Determina el año del pago (de transaction_date)
 *     • Busca/crea el período financiero correspondiente
 *     • Actualiza member_period_balance incrementando quota_paid_total
 *     • Recalcula balance y status (paid/partial/unpaid)
 *     • Actualiza member_account con totales acumulados históricos
 *   - Creación automática de períodos y balances si no existen
 *   - Cálculo automático de quotas según permilagem (150‰ o 200‰)
 *
 * Actualizado: 22 Noviembre 2025
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');

// Configuración de BD
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:SecurePass123@host.docker.internal:5432/gestor_condominos',
  ssl: false
});

// Mapeo de nombres de condóminos
const MEMBER_MAPPING = {
  'VITOR MANUEL SEBASTIAN RODRIGUES': { name: 'Vítor Manuel Sebastian Rodrigues', fraction: 'A - RC/DTO' },
  'VITOR RODRIGUES': { name: 'Vítor Manuel Sebastian Rodrigues', fraction: 'A - RC/DTO' },
  'JOAO MANUEL FERNANDES LONGO': { name: 'João Manuel Fernandes Longo', fraction: 'E - 2º DTO' },
  'Joao Longo': { name: 'João Manuel Fernandes Longo', fraction: 'E - 2º DTO' },
  'ANTONIO MANUEL CARACA BAIAO': { name: 'António Manuel Caroça Beirão', fraction: 'C - 1º DTO' },
  'Antonio Beirao': { name: 'António Manuel Caroça Beirão', fraction: 'C - 1º DTO' },
  'MARIA ALDINA SEQUEIRA': { name: 'Maria Albina Correia Sequeira', fraction: 'B - RC/ESQ' },
  'Aldina Sequeira': { name: 'Maria Albina Correia Sequeira', fraction: 'B - RC/ESQ' },
  'CRISTINA MARIA BERTOLO GOUVEIA': { name: 'Cristina Maria Bertolo Gouveia', fraction: 'D - 1º ESQ' },
  'Cristina Gouveia': { name: 'Cristina Maria Bertolo Gouveia', fraction: 'D - 1º ESQ' },
  'ALEXANDRE MARTINS DA SILVA': { name: 'Cristina Maria Bertolo Gouveia', fraction: 'D - 1º ESQ' }, // Paga por Cristina
  'JOSE MANUEL COSTA RICARDO': { name: 'José Manuel Costa Ricardo', fraction: 'F - 2º ESQ' },
  'Jose Ricardo': { name: 'José Manuel Costa Ricardo', fraction: 'F - 2º ESQ' },
  'CARLOTA LOPES BERTOLO GOUVEIA': { name: 'Cristina Maria Bertolo Gouveia', fraction: 'D - 1º ESQ' } // Paga por Cristina
};

// Mapeo de categorías del banco a nuestras categorías
const CATEGORY_MAPPING = {
  // Ingresos - Quotas
  'Quota > Fraçao A - RC/DTO': { name: 'Quota Condómino', type: 'income', parent: null },
  'Quota > Fraçao B - RC/ESQ': { name: 'Quota Condómino', type: 'income', parent: null },
  'Quota > Fraçao C - 1º DTO': { name: 'Quota Condómino', type: 'income', parent: null },
  'Quota > Fraçao D - 1º ESQ': { name: 'Quota Condómino', type: 'income', parent: null },
  'Quota > Fraçao E - 2º DTO': { name: 'Quota Condómino', type: 'income', parent: null },
  'Quota > Fraçao F - 2º ESQ': { name: 'Quota Condómino', type: 'income', parent: null },

  // Ingresos - Otros
  'Prestamos > Socios': { name: 'Prestamos de Sócios', type: 'income', parent: null },
  'Reembolsos Anulaciones': { name: 'Reembolsos', type: 'income', parent: null },
  'SEGUROS': { name: 'Reembolso Seguros', type: 'income', parent: null },
  'INICIO': { name: 'Saldo Inicial', type: 'income', parent: null },

  // Gastos - Servicios
  'Despesas de condomínio > LUZ': { name: 'Eletricidade', type: 'expense', parent: 'Despesas Condomínio' },
  'Despesas de condomínio > BANCO': { name: 'Despesas Bancárias', type: 'expense', parent: 'Despesas Condomínio' },
  'Despesas de condomínio > SEGUROS': { name: 'Seguros', type: 'expense', parent: 'Despesas Condomínio' },
  'GASTOS FINANCIEROS > BANCOS > Tarifa banco': { name: 'Despesas Bancárias', type: 'expense', parent: 'Despesas Condomínio' },

  // Gastos - Personal
  'Limpeza': { name: 'Limpeza', type: 'expense', parent: 'Despesas Condomínio' },
  'Administração': { name: 'Administração', type: 'expense', parent: 'Despesas Condomínio' },
  'Manutenção': { name: 'Manutenção e Conservação', type: 'expense', parent: 'Despesas Condomínio' }
};

/**
 * Parsear fecha del CSV (formato DD/MM/YYYY)
 */
function parseDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Identificar miembro por descripción o beneficiario
 */
function identifyMember(description, beneficiary) {
  const searchText = `${description} ${beneficiary}`.toUpperCase();

  for (const [key, value] of Object.entries(MEMBER_MAPPING)) {
    if (searchText.includes(key.toUpperCase())) {
      return value;
    }
  }

  return null;
}

/**
 * Obtener o crear categoría
 */
async function getOrCreateCategory(categoryName, buildingId) {
  const categoryInfo = CATEGORY_MAPPING[categoryName] || {
    name: categoryName || 'Outras',
    type: 'expense',
    parent: null
  };

  // Buscar categoría existente
  const existing = await pool.query(
    `SELECT id FROM transaction_categories
     WHERE name = $1 AND building_id = $2 AND deleted_at IS NULL`,
    [categoryInfo.name, buildingId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Crear nueva categoría
  const result = await pool.query(
    `INSERT INTO transaction_categories (
      id, building_id, name, type, transaction_type, is_active, created_at, updated_at
    ) VALUES (
      uuid_generate_v4(), $1, $2, 'financial', $3, true, NOW(), NOW()
    ) RETURNING id`,
    [buildingId, categoryInfo.name, categoryInfo.type]
  );

  return result.rows[0].id;
}

/**
 * Obtener ID del miembro por nombre
 */
async function getMemberId(memberName, buildingId) {
  const result = await pool.query(
    `SELECT id FROM members
     WHERE name ILIKE $1 AND building_id = $2 AND deleted_at IS NULL`,
    [memberName, buildingId]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}

/**
 * Actualizar balance del miembro en el período financiero correspondiente
 */
async function updateMemberBalance(memberId, buildingId, transactionDate, amount) {
  // 1. Obtener el año de la transacción
  const year = new Date(transactionDate).getFullYear();

  // 2. Buscar el período financiero
  const periodResult = await pool.query(
    'SELECT id FROM financial_periods WHERE building_id = $1 AND year = $2',
    [buildingId, year]
  );

  if (periodResult.rows.length === 0) {
    console.warn(`   ⚠️  Período financiero ${year} no existe, creándolo...`);

    // Crear período automáticamente
    await pool.query(`
      INSERT INTO financial_periods (
        id, building_id, year, start_date, end_date,
        is_closed, created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), $1, $2,
        make_date($2, 1, 1),
        make_date($2, 12, 31),
        false, NOW(), NOW()
      )`,
      [buildingId, year]
    );

    // Buscar de nuevo
    const newPeriodResult = await pool.query(
      'SELECT id FROM financial_periods WHERE building_id = $1 AND year = $2',
      [buildingId, year]
    );

    periodResult.rows = newPeriodResult.rows;
  }

  const periodId = periodResult.rows[0].id;

  // 3. Verificar si existe registro en member_period_balance
  const balanceExists = await pool.query(
    'SELECT id FROM member_period_balance WHERE member_id = $1 AND period_id = $2',
    [memberId, periodId]
  );

  if (balanceExists.rows.length === 0) {
    console.warn(`   ⚠️  Balance para miembro en período ${year} no existe, creándolo...`);

    // Obtener permilage del miembro para calcular quota esperada
    const memberInfo = await pool.query(
      'SELECT permilage FROM members WHERE id = $1',
      [memberId]
    );

    const permilage = parseFloat(memberInfo.rows[0].permilage || 0);

    // Obtener quotas del período
    const periodInfo = await pool.query(
      'SELECT monthly_quota_150, monthly_quota_200 FROM financial_periods WHERE id = $1',
      [periodId]
    );

    const quota150 = parseFloat(periodInfo.rows[0].monthly_quota_150 || 0);
    const quota200 = parseFloat(periodInfo.rows[0].monthly_quota_200 || 0);

    // Calcular quota esperada según permilage
    let monthlyQuota = 0;
    if (permilage >= 195 && permilage <= 205) {
      monthlyQuota = quota200; // 200‰
    } else if (permilage >= 145 && permilage <= 155) {
      monthlyQuota = quota150; // 150‰
    }

    const annualQuota = monthlyQuota * 12;

    // Crear registro
    await pool.query(`
      INSERT INTO member_period_balance (
        id, member_id, period_id, building_id,
        quota_expected_monthly, quota_expected_annual,
        quota_paid_total, balance, status,
        created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3,
        $4, $5,
        0, -$5, 'unpaid',
        NOW(), NOW()
      )`,
      [memberId, periodId, buildingId, monthlyQuota, annualQuota]
    );
  }

  // 4. Actualizar member_period_balance
  await pool.query(`
    UPDATE member_period_balance
    SET
      quota_paid_total = quota_paid_total + $1,
      balance = balance + $1,
      updated_at = NOW()
    WHERE member_id = $2 AND period_id = $3
  `, [amount, memberId, periodId]);

  // 5. Recalcular status
  await pool.query(`
    UPDATE member_period_balance
    SET status = CASE
      WHEN balance >= 0 THEN 'paid'
      WHEN balance < 0 AND quota_paid_total > 0 THEN 'partial'
      ELSE 'unpaid'
    END
    WHERE member_id = $1 AND period_id = $2
  `, [memberId, periodId]);

  // 6. Actualizar member_account
  await pool.query(`
    UPDATE member_account ma
    SET
      current_balance = (
        SELECT COALESCE(SUM(balance), 0)
        FROM member_period_balance
        WHERE member_id = $1
      ),
      total_paid_all_time = (
        SELECT COALESCE(SUM(quota_paid_total), 0)
        FROM member_period_balance
        WHERE member_id = $1
      ),
      has_overdue_debt = (
        SELECT COALESCE(SUM(balance), 0) < 0
        FROM member_period_balance
        WHERE member_id = $1
      ),
      overdue_amount = (
        SELECT CASE
          WHEN COALESCE(SUM(balance), 0) < 0
          THEN ABS(COALESCE(SUM(balance), 0))
          ELSE 0
        END
        FROM member_period_balance
        WHERE member_id = $1
      ),
      updated_at = NOW()
    WHERE member_id = $1
  `, [memberId]);

  console.log(`   💰 Balance actualizado: +${amount}€ para período ${year}`);
}

/**
 * Importar CSV
 */
async function importCSV(csvPath) {
  console.log('📁 Leyendo archivo CSV:', csvPath);

  // Leer archivo
  const fileContent = fs.readFileSync(csvPath, 'utf-8');

  // Parsear CSV
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ',',
    quote: '"'
  });

  console.log(`✅ ${records.length} transacciones encontradas`);

  // Obtener building_id (primer edificio)
  const buildingResult = await pool.query(
    'SELECT id, name FROM buildings WHERE deleted_at IS NULL LIMIT 1'
  );

  if (buildingResult.rows.length === 0) {
    throw new Error('❌ No se encontró ningún edificio en la base de datos');
  }

  const building = buildingResult.rows[0];
  console.log(`🏢 Edificio: ${building.name} (${building.id})`);

  // Procesar cada transacción
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      // Parsear datos
      const description = record['Descripción'] || record['Transferencias'] || '';
      const beneficiary = record['Beneficiario'] || '';
      const category = record['Categoría'] || '';
      const dateStr = record['Fecha'];
      const amountStr = record['Importe'].replace(',', '.');
      const amount = parseFloat(amountStr);
      const notes = record['Memoria'] || '';

      // Skip si no hay importe
      if (isNaN(amount) || amount === 0) {
        skipped++;
        continue;
      }

      // Parsear fecha
      const transactionDate = parseDate(dateStr);

      // Identificar miembro
      const member = identifyMember(description, beneficiary);
      const memberId = member ? await getMemberId(member.name, building.id) : null;

      // Obtener categoría
      const categoryId = await getOrCreateCategory(category, building.id);

      // Determinar tipo
      const type = amount > 0 ? 'income' : 'expense';
      const transactionType = amount > 0 ? 'income' : 'expense';

      // Determinar si es pago de quota
      const isFeePayment = category.startsWith('Quota >');

      // Insertar transacción
      await pool.query(
        `INSERT INTO transactions (
          id, building_id, member_id, category_id,
          transaction_date, date, type, transaction_type,
          description, amount, notes,
          is_fee_payment, is_confirmed,
          created_at, updated_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3,
          $4, $4, $5, $6,
          $7, $8, $9,
          $10, true,
          NOW(), NOW()
        )`,
        [
          building.id,
          memberId,
          categoryId,
          transactionDate,
          type,
          transactionType,
          description,
          Math.abs(amount),
          notes,
          isFeePayment
        ]
      );

      // Si es pago de quota y tiene miembro, actualizar balance del período
      if (isFeePayment && memberId && amount > 0) {
        await updateMemberBalance(memberId, building.id, transactionDate, Math.abs(amount));
      }

      imported++;

      if (imported % 10 === 0) {
        console.log(`⏳ Procesadas ${imported} transacciones...`);
      }

    } catch (error) {
      console.error(`❌ Error en transacción:`, error.message);
      console.error(`   Datos:`, record);
      errors++;
    }
  }

  console.log('\n📊 Resumen de importación:');
  console.log(`   ✅ Importadas: ${imported}`);
  console.log(`   ⏭️  Omitidas: ${skipped}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`   📝 Total procesadas: ${records.length}`);
}

// Ejecutar
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('❌ Uso: node import-bank-csv.js <archivo.csv>');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Archivo no encontrado: ${csvPath}`);
  process.exit(1);
}

importCSV(csvPath)
  .then(() => {
    console.log('\n✅ Importación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
