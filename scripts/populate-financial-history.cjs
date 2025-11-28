#!/usr/bin/env node

/**
 * Script para poblar datos financieros históricos
 *
 * Basado en el análisis detallado de extractos bancarios 2021-2025
 *
 * Uso:
 *   node scripts/populate-financial-history.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:SecurePass123@host.docker.internal:5432/gestor_condominos',
  ssl: false
});

console.log('🔧 Iniciando población de datos financieros históricos...\n');

/**
 * CONFIGURACIÓN SEGÚN ANÁLISIS REAL
 */
const FINANCIAL_CONFIG = {
  // Quotas por período y permilagem
  periods: {
    2021: { quota_150: 26.13, quota_200: 34.84 },
    2022: { quota_150: 26.13, quota_200: 34.84 },
    2023: { quota_150: 26.13, quota_200: 34.84 },
    2024: { quota_150: 26.13, quota_200: 34.84 },
    2025: { quota_150: 32.66, quota_200: 43.54 }
  },

  // Estado real de cada condómino según análisis
  members: {
    'Vítor Manuel Sebastian Rodrigues': {
      permilage: 150,
      // 2021-2024: PAGADO (con atrasos que pagó en enero 2025)
      // 2025: Pagó 11 meses con quota antigua (26.13€)
      status_2021_2024: 'paid',
      status_2025: {
        paid_months: 11,
        paid_per_month: 26.13,
        expected_per_month: 32.66,
        note: 'Paga con quota antigua, debe regularizar'
      }
    },
    'João Manuel Fernandes Longo': {
      permilage: 200,
      // 2021-2024: PAGADO (algunos en numerario)
      // 2025: TODO PAGADO con quota nueva
      status_2021_2024: 'paid',
      status_2025: {
        paid_months: 12,
        paid_per_month: 43.54,
        expected_per_month: 43.54,
        note: 'Al día, quota correcta'
      }
    },
    'António Manuel Caroça Beirão': {
      permilage: 200,
      // 2021-2024: PAGADO (pago feb 2025 cerró 2024)
      // 2025: TODO PENDIENTE
      status_2021_2024: 'paid',
      status_2025: {
        paid_months: 0,
        paid_per_month: 0,
        expected_per_month: 43.54,
        note: 'Todo 2025 pendiente de pago'
      }
    },
    'Maria Albina Correia Sequeira': {
      permilage: 150,
      // 2021-2024: PAGADO (pagos marzo y agosto 2025 cerraron 2024)
      // 2025: TODO PENDIENTE
      status_2021_2024: 'paid',
      status_2025: {
        paid_months: 0,
        paid_per_month: 0,
        expected_per_month: 32.66,
        note: 'Todo 2025 pendiente de pago'
      }
    },
    'Cristina Maria Bertolo Gouveia': {
      permilage: 150,
      // 2021-2024: PAGADO (pago feb 2025 cerró atrasos + 2024)
      // 2025: TODO PENDIENTE
      status_2021_2024: 'paid',
      status_2025: {
        paid_months: 0,
        paid_per_month: 0,
        expected_per_month: 32.66,
        note: 'Todo 2025 pendiente de pago'
      }
    },
    'José Manuel Costa Ricardo': {
      permilage: 150,
      // 2021-2024: PAGADO (pago feb 2025 cerró atrasos multi-año + 2024)
      // 2025: TODO PENDIENTE
      status_2021_2024: 'paid',
      status_2025: {
        paid_months: 0,
        paid_per_month: 0,
        expected_per_month: 32.66,
        note: 'Todo 2025 pendiente de pago'
      }
    }
  }
};

/**
 * Obtener datos necesarios de la BD
 */
async function getBaseData() {
  console.log('📊 Obteniendo datos de la base de datos...');

  // Building
  const buildingResult = await pool.query(
    'SELECT id, name FROM buildings WHERE deleted_at IS NULL LIMIT 1'
  );
  if (buildingResult.rows.length === 0) {
    throw new Error('No se encontró ningún edificio');
  }
  const building = buildingResult.rows[0];

  // Members
  const membersResult = await pool.query(
    `SELECT id, name, permilage FROM members
     WHERE building_id = $1 AND deleted_at IS NULL
     ORDER BY name`,
    [building.id]
  );

  // Periods
  const periodsResult = await pool.query(
    `SELECT id, year FROM financial_periods
     WHERE building_id = $1
     ORDER BY year`,
    [building.id]
  );

  console.log(`   ✅ Edificio: ${building.name}`);
  console.log(`   ✅ Miembros: ${membersResult.rows.length}`);
  console.log(`   ✅ Períodos: ${periodsResult.rows.length}\n`);

  return {
    building,
    members: membersResult.rows,
    periods: periodsResult.rows
  };
}

/**
 * Calcular quota esperada según permilagem y año
 */
function getExpectedQuota(permilage, year) {
  const quotas = FINANCIAL_CONFIG.periods[year];
  if (!quotas) return 0;

  return permilage >= 200 ? quotas.quota_200 : quotas.quota_150;
}

/**
 * Crear balances por período
 */
async function createPeriodBalances(baseData) {
  console.log('💰 Creando balances por período para cada miembro...\n');

  let created = 0;
  let skipped = 0;

  for (const member of baseData.members) {
    const memberConfig = FINANCIAL_CONFIG.members[member.name];
    if (!memberConfig) {
      console.log(`   ⏭️  Saltando ${member.name} (no configurado)`);
      skipped++;
      continue;
    }

    for (const period of baseData.periods) {
      const monthlyQuota = getExpectedQuota(parseFloat(member.permilage), period.year);
      const annualQuota = monthlyQuota * 12;

      let quotaPaid, balance, status;

      if (period.year >= 2021 && period.year <= 2024) {
        // Años 2021-2024: PAGADO (según análisis)
        quotaPaid = annualQuota;
        balance = 0;
        status = 'paid';
      } else if (period.year === 2025) {
        // Año 2025: Según configuración específica
        const config2025 = memberConfig.status_2025;
        quotaPaid = config2025.paid_months * config2025.paid_per_month;
        balance = quotaPaid - annualQuota; // Negativo = deuda
        status = quotaPaid >= annualQuota ? 'paid' : (quotaPaid > 0 ? 'partial' : 'unpaid');
      }

      // Insertar balance
      try {
        await pool.query(
          `INSERT INTO member_period_balance (
            member_id, period_id, building_id,
            quota_expected_monthly, quota_expected_annual,
            quota_paid_total, balance, status,
            notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT (member_id, period_id) DO UPDATE SET
            quota_paid_total = $6,
            balance = $7,
            status = $8,
            updated_at = NOW()`,
          [
            member.id,
            period.id,
            baseData.building.id,
            monthlyQuota,
            annualQuota,
            quotaPaid,
            balance,
            status,
            memberConfig.status_2025?.note || 'Años históricos cerrados'
          ]
        );

        console.log(`   ✅ ${member.name.substring(0, 20).padEnd(20)} | ${period.year} | Quota: ${annualQuota.toFixed(2)}€ | Pagado: ${quotaPaid.toFixed(2)}€ | Balance: ${balance.toFixed(2)}€ | ${status.toUpperCase()}`);
        created++;
      } catch (error) {
        console.error(`   ❌ Error: ${member.name} - ${period.year}:`, error.message);
      }
    }
  }

  console.log(`\n   📊 Total: ${created} balances creados/actualizados, ${skipped} saltados\n`);
}

/**
 * Crear tracking mensual para 2025
 */
async function createMonthlyTracking2025(baseData) {
  console.log('📅 Creando tracking mensual detallado para 2025...\n');

  const period2025 = baseData.periods.find(p => p.year === 2025);
  if (!period2025) {
    console.log('   ⚠️  Período 2025 no encontrado, saltando tracking mensual\n');
    return;
  }

  let created = 0;

  for (const member of baseData.members) {
    const memberConfig = FINANCIAL_CONFIG.members[member.name];
    if (!memberConfig) continue;

    const config2025 = memberConfig.status_2025;
    const monthlyExpected = config2025.expected_per_month;

    for (let month = 1; month <= 12; month++) {
      const isPaid = month <= config2025.paid_months;
      const quotaPaid = isPaid ? config2025.paid_per_month : 0;
      const balance = quotaPaid - monthlyExpected;

      try {
        await pool.query(
          `INSERT INTO member_monthly_tracking (
            member_id, period_id, building_id,
            year, month,
            quota_expected, quota_paid, balance,
            is_paid, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT (member_id, period_id, year, month) DO UPDATE SET
            quota_paid = $7,
            balance = $8,
            is_paid = $9,
            updated_at = NOW()`,
          [
            member.id,
            period2025.id,
            baseData.building.id,
            2025,
            month,
            monthlyExpected,
            quotaPaid,
            balance,
            isPaid
          ]
        );

        created++;
      } catch (error) {
        console.error(`   ❌ Error: ${member.name} - mes ${month}:`, error.message);
      }
    }

    const paidMonths = config2025.paid_months;
    const pendingMonths = 12 - paidMonths;
    console.log(`   ✅ ${member.name.substring(0, 30).padEnd(30)} | Pagados: ${paidMonths}/12 meses | Pendientes: ${pendingMonths}`);
  }

  console.log(`\n   📊 Total: ${created} registros mensuales creados\n`);
}

/**
 * Actualizar saldos de cuenta corriente
 */
async function updateAccountBalances(baseData) {
  console.log('🏦 Actualizando saldos de cuenta corriente...\n');

  for (const member of baseData.members) {
    // Calcular balance total (suma de todos los períodos)
    const balanceResult = await pool.query(
      `SELECT
        SUM(quota_expected_annual) as total_charged,
        SUM(quota_paid_total) as total_paid,
        SUM(balance) as current_balance
       FROM member_period_balance
       WHERE member_id = $1`,
      [member.id]
    );

    const { total_charged, total_paid, current_balance } = balanceResult.rows[0];

    const hasOverdueDebt = parseFloat(current_balance || 0) < 0;
    const overdueAmount = hasOverdueDebt ? Math.abs(parseFloat(current_balance || 0)) : 0;

    await pool.query(
      `UPDATE member_account
       SET
         current_balance = $1,
         total_charged_all_time = $2,
         total_paid_all_time = $3,
         has_overdue_debt = $4,
         overdue_amount = $5,
         updated_at = NOW()
       WHERE member_id = $6`,
      [
        current_balance || 0,
        total_charged || 0,
        total_paid || 0,
        hasOverdueDebt,
        overdueAmount,
        member.id
      ]
    );

    const status = hasOverdueDebt ? '❌ DEBE' : '✅ AL DÍA';
    console.log(`   ${status} ${member.name.substring(0, 30).padEnd(30)} | Saldo: ${parseFloat(current_balance || 0).toFixed(2)}€`);
  }

  console.log('\n');
}

/**
 * Generar resumen final
 */
async function generateSummary(baseData) {
  console.log('📊 RESUMEN FINANCIERO GENERAL\n');
  console.log('═'.repeat(80));

  // Por período
  for (const period of baseData.periods) {
    const summary = await pool.query(
      `SELECT
        COUNT(*) as num_members,
        SUM(quota_expected_annual) as total_expected,
        SUM(quota_paid_total) as total_paid,
        SUM(balance) as total_balance,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as members_paid,
        COUNT(CASE WHEN status = 'partial' THEN 1 END) as members_partial,
        COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as members_unpaid
       FROM member_period_balance
       WHERE period_id = $1`,
      [period.id]
    );

    const s = summary.rows[0];
    console.log(`\n📅 AÑO ${period.year}:`);
    console.log(`   Esperado:  ${parseFloat(s.total_expected || 0).toFixed(2)}€`);
    console.log(`   Recibido:  ${parseFloat(s.total_paid || 0).toFixed(2)}€`);
    console.log(`   Balance:   ${parseFloat(s.total_balance || 0).toFixed(2)}€`);
    console.log(`   Pagados:   ${s.members_paid}/${s.num_members} miembros`);
    console.log(`   Parciales: ${s.members_partial}/${s.num_members} miembros`);
    console.log(`   Impagos:   ${s.members_unpaid}/${s.num_members} miembros`);
  }

  console.log('\n' + '═'.repeat(80));

  // Deudores
  const debtors = await pool.query(
    `SELECT
      m.name,
      ma.current_balance,
      ma.overdue_amount
     FROM member_account ma
     INNER JOIN members m ON ma.member_id = m.id
     WHERE ma.has_overdue_debt = true
     ORDER BY ma.current_balance ASC`
  );

  if (debtors.rows.length > 0) {
    console.log('\n⚠️  DEUDORES:\n');
    debtors.rows.forEach(d => {
      console.log(`   ${d.name.padEnd(35)} | Deuda: ${parseFloat(d.overdue_amount).toFixed(2)}€`);
    });
  } else {
    console.log('\n✅ No hay deudores actualmente');
  }

  console.log('\n' + '═'.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    // 1. Obtener datos base
    const baseData = await getBaseData();

    // 2. Crear balances por período
    await createPeriodBalances(baseData);

    // 3. Crear tracking mensual para 2025
    await createMonthlyTracking2025(baseData);

    // 4. Actualizar cuentas corrientes
    await updateAccountBalances(baseData);

    // 5. Generar resumen
    await generateSummary(baseData);

    console.log('✅ Población de datos históricos completada exitosamente\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar
main();
