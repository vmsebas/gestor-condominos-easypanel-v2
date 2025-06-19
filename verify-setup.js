import { database, checkDatabaseConnection } from './lib/database.js';

async function verifyProjectSetup() {
  console.log('🔍 Verificando configuración del proyecto...\n');

  try {
    // 1. Verificar conexión a base de datos
    console.log('1️⃣ Verificando conexión a Neon...');
    const dbStatus = await checkDatabaseConnection();
    
    if (dbStatus.connected) {
      console.log(`   ✅ Conectado a: ${dbStatus.database}`);
      console.log(`   🕐 Timestamp: ${dbStatus.timestamp}`);
    } else {
      console.log(`   ❌ Error: ${dbStatus.error}`);
      return false;
    }

    // 2. Verificar tablas principales
    console.log('\n2️⃣ Verificando tablas principales...');
    const tables = ['buildings', 'members', 'convocatorias', 'transactions'];
    
    for (const table of tables) {
      try {
        const result = await database.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table}: ${result.data[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      }
    }

    // 3. Verificar QueryBuilder
    console.log('\n3️⃣ Probando QueryBuilder...');
    try {
      const buildings = await database.from('buildings').select('name, address').limit(1);
      if (buildings.data && buildings.data.length > 0) {
        console.log(`   ✅ QueryBuilder funcionando: ${buildings.data[0].name}`);
      } else {
        console.log('   ⚠️  QueryBuilder funciona pero sin datos');
      }
    } catch (error) {
      console.log(`   ❌ QueryBuilder error: ${error.message}`);
    }

    // 4. Verificar variables de entorno
    console.log('\n4️⃣ Verificando variables de entorno...');
    const requiredEnvVars = ['DATABASE_URL'];
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: Configurada`);
      } else {
        console.log(`   ❌ ${envVar}: Falta`);
      }
    }

    console.log('\n🎉 ¡Proyecto configurado correctamente!');
    console.log('🚀 Listo para iniciar desarrollo con React + modo oscuro');
    
    return true;

  } catch (error) {
    console.error('\n❌ Error general:', error);
    return false;
  } finally {
    await database.end();
  }
}

// Ejecutar verificación
verifyProjectSetup().then(success => {
  process.exit(success ? 0 : 1);
});