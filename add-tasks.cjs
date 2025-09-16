const knex = require('knex')({
  client: 'pg',
  connection: 'postgresql://mini-server@localhost:5432/gestor_condominos?sslmode=disable'
});

async function addTasks() {
  try {
    console.log('=== Agregando tareas a la BD ===');
    
    // Obtener un edificio y algunos miembros
    const buildings = await knex('buildings').select('id').limit(1);
    if (buildings.length === 0) {
      console.log('No hay edificios en la BD');
      process.exit(1);
    }
    
    const buildingId = buildings[0].id;
    console.log('Usando edificio:', buildingId);
    
    // Obtener algunos miembros para asignar tareas
    const members = await knex('members')
      .where('building_id', buildingId)
      .select('id', 'name')
      .limit(3);
    
    if (members.length === 0) {
      console.log('No hay miembros en el edificio');
      process.exit(1);
    }
    
    console.log('Miembros encontrados:', members.map(m => m.name));
    
    // Crear tareas
    const tasks = [
      {
        building_id: buildingId,
        title: 'Reparar puerta principal',
        description: 'La puerta principal del edificio necesita reparación urgente. El mecanismo de cierre está dañado.',
        status: 'pending',
        priority: 'high',
        category: 'maintenance',
        assignee_id: members[0]?.id || null,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        building_id: buildingId,
        title: 'Limpieza de áreas comunes',
        description: 'Programar limpieza profunda de pasillos y escaleras',
        status: 'in_progress',
        priority: 'medium',
        category: 'cleaning',
        assignee_id: members[1]?.id || null,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días desde ahora
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        building_id: buildingId,
        title: 'Revisión sistema eléctrico',
        description: 'Contratar electricista para revisión anual del sistema eléctrico del edificio',
        status: 'pending',
        priority: 'medium',
        category: 'maintenance',
        assignee_id: members[2]?.id || null,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días desde ahora
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        building_id: buildingId,
        title: 'Pintura de fachada',
        description: 'Solicitar presupuestos para pintura de la fachada principal',
        status: 'pending',
        priority: 'low',
        category: 'renovation',
        assignee_id: members[0]?.id || null,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde ahora
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        building_id: buildingId,
        title: 'Actualizar reglamento interno',
        description: 'Revisar y actualizar el reglamento interno del condominio',
        status: 'completed',
        priority: 'low',
        category: 'administrative',
        assignee_id: members[1]?.id || null,
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Hace 5 días
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Completado hace 2 días
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updated_at: new Date()
      }
    ];
    
    // Insertar tareas
    const insertedTasks = await knex('tasks').insert(tasks).returning('*');
    console.log(`\n✅ ${insertedTasks.length} tareas agregadas exitosamente`);
    
    // Mostrar resumen
    console.log('\nTareas creadas:');
    insertedTasks.forEach(task => {
      console.log(`  - ${task.title} (${task.status}, prioridad: ${task.priority})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addTasks();