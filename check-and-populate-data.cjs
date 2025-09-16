const { db: knex } = require('./server/config/knex.cjs');

async function checkAndPopulateData() {
  try {
    console.log('🔍 Verificando datos en la base de datos...\n');
    
    // Verificar edificios
    const buildings = await knex('buildings').select('*');
    console.log(`📢 Edificios encontrados: ${buildings.length}`);
    if (buildings.length > 0) {
      console.log('Edificios:', buildings.map(b => ({ id: b.id, name: b.name })));
    }
    
    // Verificar fracciones
    const fractions = await knex('fractions').select('*');
    console.log(`\n🏠 Fracciones encontradas: ${fractions.length}`);
    
    // Verificar miembros
    const members = await knex('members').select('*');
    console.log(`👥 Miembros encontrados: ${members.length}`);
    
    // Si no hay fracciones, crear algunas de ejemplo
    if (fractions.length === 0 && buildings.length > 0) {
      console.log('\n📝 Creando fracciones de ejemplo...');
      
      const buildingId = buildings[0].id;
      const fractionsToCreate = [
        { building_id: buildingId, unit_number: '1A', surface_area: 85, fraction_type: 'apartment', ownership_percentage: 12.5, is_active: true },
        { building_id: buildingId, unit_number: '1B', surface_area: 75, fraction_type: 'apartment', ownership_percentage: 11.0, is_active: true },
        { building_id: buildingId, unit_number: '2A', surface_area: 90, fraction_type: 'apartment', ownership_percentage: 13.5, is_active: true },
        { building_id: buildingId, unit_number: '2B', surface_area: 80, fraction_type: 'apartment', ownership_percentage: 12.0, is_active: true },
        { building_id: buildingId, unit_number: 'G1', surface_area: 15, fraction_type: 'garage', ownership_percentage: 2.5, is_active: true },
        { building_id: buildingId, unit_number: 'G2', surface_area: 15, fraction_type: 'garage', ownership_percentage: 2.5, is_active: true },
        { building_id: buildingId, unit_number: 'S1', surface_area: 10, fraction_type: 'storage', ownership_percentage: 1.5, is_active: true },
        { building_id: buildingId, unit_number: 'Loja', surface_area: 120, fraction_type: 'commercial', ownership_percentage: 18.0, is_active: true }
      ];
      
      for (const fraction of fractionsToCreate) {
        await knex('fractions').insert({
          ...fraction,
          id: knex.raw('gen_random_uuid()'),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      console.log(`✅ ${fractionsToCreate.length} fracciones creadas para el edificio "${buildings[0].name}"`);
      
      // Actualizar el número de unidades en el edificio
      await knex('buildings')
        .where('id', buildingId)
        .update({
          number_of_units: fractionsToCreate.length,
          total_units: fractionsToCreate.length,
          updated_at: new Date()
        });
      
      console.log('✅ Número de unidades actualizado en el edificio');
    }
    
    // Si el segundo edificio no tiene fracciones
    if (buildings.length > 1) {
      const secondBuildingId = buildings[1].id;
      const secondBuildingFractions = await knex('fractions')
        .where('building_id', secondBuildingId)
        .select('*');
      
      if (secondBuildingFractions.length === 0) {
        console.log(`\n📝 Creando fracciones para el segundo edificio...`);
        
        const fractionsToCreate = [
          { building_id: secondBuildingId, unit_number: 'T1', surface_area: 100, fraction_type: 'apartment', ownership_percentage: 20.0, is_active: true },
          { building_id: secondBuildingId, unit_number: 'T2', surface_area: 110, fraction_type: 'apartment', ownership_percentage: 22.0, is_active: true },
          { building_id: secondBuildingId, unit_number: 'T3', surface_area: 120, fraction_type: 'apartment', ownership_percentage: 24.0, is_active: true },
          { building_id: secondBuildingId, unit_number: 'T4', surface_area: 95, fraction_type: 'apartment', ownership_percentage: 19.0, is_active: true },
          { building_id: secondBuildingId, unit_number: 'P1', surface_area: 20, fraction_type: 'garage', ownership_percentage: 4.0, is_active: true }
        ];
        
        for (const fraction of fractionsToCreate) {
          await knex('fractions').insert({
            ...fraction,
            id: knex.raw('gen_random_uuid()'),
            created_at: new Date(),
            updated_at: new Date()
          });
        }
        
        console.log(`✅ ${fractionsToCreate.length} fracciones creadas para el edificio "${buildings[1].name}"`);
        
        // Actualizar el número de unidades
        await knex('buildings')
          .where('id', secondBuildingId)
          .update({
            number_of_units: fractionsToCreate.length,
            total_units: fractionsToCreate.length,
            updated_at: new Date()
          });
      }
    }
    
    // Verificar final
    const finalFractions = await knex('fractions').select('*');
    console.log(`\n🎯 Total de fracciones en la base de datos: ${finalFractions.length}`);
    
    // Mostrar resumen de fracciones por edificio
    const fractionsByBuilding = await knex('fractions')
      .select('building_id')
      .count('* as total')
      .groupBy('building_id');
    
    console.log('\n📊 Resumen de fracciones por edificio:');
    for (const item of fractionsByBuilding) {
      const building = buildings.find(b => b.id === item.building_id);
      console.log(`  - ${building?.name || 'Desconocido'}: ${item.total} fracciones`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAndPopulateData();