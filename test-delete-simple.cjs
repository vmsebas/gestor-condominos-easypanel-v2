const axios = require('axios');

const API_URL = 'http://localhost:3002/api';
const EMAIL = 'admin@migestpro.com';
const PASSWORD = 'admin123';
const BUILDING_ID = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';

async function test() {
  console.log('🚀 Teste de eliminação de convocatoria via API\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });

    const accessToken = loginResponse.data.data.accessToken;
    console.log('✅ Login bem-sucedido!');
    console.log(`   Token: ${accessToken.substring(0, 20)}...\n`);

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Get convocatorias BEFORE delete
    console.log('2️⃣ Obtendo convocatorias ANTES da eliminação...');
    const beforeResponse = await axios.get(`${API_URL}/convocatorias`, {
      params: { buildingId: BUILDING_ID },
      headers
    });

    const beforeCount = beforeResponse.data.data.length;
    console.log(`   Total: ${beforeCount} convocatorias`);
    beforeResponse.data.data.forEach(c => {
      console.log(`   - ${c.assembly_number}: ${c.title || 'Sem título'} (deleted_at: ${c.deleted_at || 'null'})`);
    });

    // Find convocatoria 31
    const convocatoria31 = beforeResponse.data.data.find(c => c.assembly_number === '31');

    if (!convocatoria31) {
      console.log('\n❌ Convocatoria 31 não encontrada!');
      return;
    }

    console.log(`\n✅ Convocatoria 31 encontrada: ${convocatoria31.id}`);

    // Step 3: Delete convocatoria 31
    console.log('\n3️⃣ Eliminando convocatoria 31...');

    try {
      const deleteResponse = await axios.delete(`${API_URL}/convocatorias/${convocatoria31.id}`, {
        headers
      });

      console.log(`   Status: ${deleteResponse.status}`);
      console.log(`   Response:`, JSON.stringify(deleteResponse.data, null, 2));
    } catch (deleteError) {
      console.log(`   ❌ Erro: ${deleteError.response?.status} ${deleteError.response?.statusText}`);
      console.log(`   Mensagem:`, deleteError.response?.data);
    }

    // Step 4: Get convocatorias AFTER delete
    console.log('\n4️⃣ Obtendo convocatorias DEPOIS da eliminação...');

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const afterResponse = await axios.get(`${API_URL}/convocatorias`, {
      params: { buildingId: BUILDING_ID },
      headers
    });

    const afterCount = afterResponse.data.data.length;
    console.log(`   Total: ${afterCount} convocatorias`);
    afterResponse.data.data.forEach(c => {
      console.log(`   - ${c.assembly_number}: ${c.title || 'Sem título'} (deleted_at: ${c.deleted_at || 'null'})`);
    });

    // Step 5: Check if convocatoria 31 still exists
    const stillExists = afterResponse.data.data.find(c => c.assembly_number === '31');

    console.log('\n📊 RESULTADO:');
    console.log(`   Antes: ${beforeCount} convocatorias`);
    console.log(`   Depois: ${afterCount} convocatorias`);

    if (stillExists) {
      console.log('\n❌ PROBLEMA: Convocatoria 31 ainda aparece na lista!');
      console.log(`   ID: ${stillExists.id}`);
      console.log(`   deleted_at: ${stillExists.deleted_at}`);
    } else {
      console.log('\n✅ SUCESSO: Convocatoria 31 foi removida da lista!');
    }

    // Step 6: Verify in database
    console.log('\n5️⃣ Verificando na base de dados...');
    const { execSync } = require('child_process');

    const dbResult = execSync(
      `docker exec postgres-master psql -U postgres -d gestor_condominos -c "SELECT assembly_number, deleted_at IS NOT NULL as is_deleted FROM convocatorias WHERE assembly_number = '31';"`,
      { encoding: 'utf-8' }
    );

    console.log(dbResult);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

test();
