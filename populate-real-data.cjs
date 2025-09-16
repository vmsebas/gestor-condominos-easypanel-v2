const { db: knex } = require('./server/config/knex.cjs');

async function populateRealData() {
  const trx = await knex.transaction();
  
  try {
    console.log('🔍 Verificando y poblando datos reales en la base de datos...\n');
    
    // 1. Verificar edificios existentes
    const buildings = await trx('buildings').select('*');
    console.log(`📢 Edificios encontrados: ${buildings.length}`);
    
    if (buildings.length === 0) {
      console.log('❌ No hay edificios. Creando edificios...');
      
      const newBuildings = [
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Edificio Residencial Lisboa',
          address: 'Rua das Flores, 123',
          postal_code: '1200-001',
          city: 'Lisboa',
          number_of_units: 12,
          total_units: 12,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Condomínio Jardins',
          address: 'Avenida da Liberdade, 456',
          postal_code: '1250-145',
          city: 'Lisboa',
          number_of_units: 8,
          total_units: 8,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      for (const building of newBuildings) {
        await trx('buildings').insert(building);
      }
      
      console.log('✅ Edificios creados');
      const updatedBuildings = await trx('buildings').select('*');
      buildings.push(...updatedBuildings);
    }
    
    // 2. Verificar y crear miembros
    const members = await trx('members').select('*');
    console.log(`\n👥 Miembros encontrados: ${members.length}`);
    
    if (members.length === 0 && buildings.length > 0) {
      console.log('📝 Creando miembros reales...');
      
      const buildingId = buildings[0].id;
      
      const membersToCreate = [
        // Propietarios
        {
          building_id: buildingId,
          name: 'João Silva',
          email: 'joao.silva@email.com',
          phone: '+351912345678',
          apartment: '1A',
          type: 'owner',
          is_active: true,
          role: 'president',
          notes: 'Presidente do condomínio'
        },
        {
          building_id: buildingId,
          name: 'Maria Santos',
          email: 'maria.santos@email.com',
          phone: '+351923456789',
          apartment: '1B',
          type: 'owner',
          is_active: true,
          role: 'member',
          notes: null
        },
        {
          building_id: buildingId,
          name: 'António Ferreira',
          email: 'antonio.ferreira@email.com',
          phone: '+351934567890',
          apartment: '2A',
          type: 'owner',
          is_active: true,
          role: 'treasurer',
          notes: 'Tesoureiro do condomínio'
        },
        {
          building_id: buildingId,
          name: 'Ana Costa',
          email: 'ana.costa@email.com',
          phone: '+351945678901',
          apartment: '2B',
          type: 'owner',
          is_active: true,
          role: 'secretary',
          notes: 'Secretária do condomínio'
        },
        // Inquilinos
        {
          building_id: buildingId,
          name: 'Pedro Oliveira',
          email: 'pedro.oliveira@email.com',
          phone: '+351956789012',
          apartment: '3A',
          type: 'tenant',
          is_active: true,
          role: 'member',
          notes: 'Inquilino desde 2023'
        },
        {
          building_id: buildingId,
          name: 'Sofia Martins',
          email: 'sofia.martins@email.com',
          phone: '+351967890123',
          apartment: '3B',
          type: 'tenant',
          is_active: true,
          role: 'member',
          notes: null
        },
        {
          building_id: buildingId,
          name: 'Carlos Rodrigues',
          email: 'carlos.rodrigues@email.com',
          phone: '+351978901234',
          apartment: '4A',
          type: 'owner',
          is_active: true,
          role: 'member',
          notes: null
        },
        {
          building_id: buildingId,
          name: 'Isabel Pereira',
          email: 'isabel.pereira@email.com',
          phone: '+351989012345',
          apartment: '4B',
          type: 'owner',
          is_active: true,
          role: 'member',
          notes: null
        }
      ];
      
      // Agregar miembros para el segundo edificio si existe
      if (buildings.length > 1) {
        const secondBuildingId = buildings[1].id;
        
        const secondBuildingMembers = [
          {
            building_id: secondBuildingId,
            name: 'Manuel Almeida',
            email: 'manuel.almeida@email.com',
            phone: '+351910111213',
            apartment: 'T1',
            type: 'owner',
            is_active: true,
            role: 'president',
            notes: 'Presidente do Condomínio Jardins'
          },
          {
            building_id: secondBuildingId,
            name: 'Teresa Sousa',
            email: 'teresa.sousa@email.com',
            phone: '+351920222324',
            apartment: 'T2',
            type: 'owner',
            is_active: true,
            role: 'member',
            notes: null
          },
          {
            building_id: secondBuildingId,
            name: 'Ricardo Mendes',
            email: 'ricardo.mendes@email.com',
            phone: '+351930333435',
            apartment: 'T3',
            type: 'tenant',
            is_active: true,
            role: 'member',
            notes: 'Inquilino'
          },
          {
            building_id: secondBuildingId,
            name: 'Beatriz Lopes',
            email: 'beatriz.lopes@email.com',
            phone: '+351940444546',
            apartment: 'T4',
            type: 'owner',
            is_active: true,
            role: 'treasurer',
            notes: 'Tesoureira'
          }
        ];
        
        membersToCreate.push(...secondBuildingMembers);
      }
      
      // Insertar todos los miembros
      for (const member of membersToCreate) {
        await trx('members').insert({
          ...member,
          id: knex.raw('gen_random_uuid()'),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      console.log(`✅ ${membersToCreate.length} miembros creados`);
    }
    
    // 3. Verificar y crear transacciones
    const transactions = await trx('transactions').select('*');
    console.log(`\n💰 Transacciones encontradas: ${transactions.length}`);
    
    if (transactions.length === 0 && members.length > 0) {
      console.log('📝 Creando transacciones reales...');
      
      const buildingId = buildings[0].id;
      const currentDate = new Date();
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      
      const transactionsToCreate = [
        // Ingresos - Cuotas mensuales
        {
          building_id: buildingId,
          description: 'Cuota mensual - Septiembre 2025',
          amount: 1200.00,
          transaction_date: currentDate,
          transaction_type: 'monthly_quota',
          payment_method: 'Transferencia bancaria',
          is_confirmed: true,
          category_id: null,
          reference_number: 'QUOTA-202509'
        },
        {
          building_id: buildingId,
          description: 'Cuota mensual - Agosto 2025',
          amount: 1200.00,
          transaction_date: lastMonth,
          transaction_type: 'monthly_quota',
          payment_method: 'Transferencia bancaria',
          is_confirmed: true,
          category_id: null,
          reference_number: 'QUOTA-202508'
        },
        // Gastos
        {
          building_id: buildingId,
          description: 'Limpieza escaleras - Septiembre',
          amount: -250.00,
          transaction_date: currentDate,
          transaction_type: 'expense',
          payment_method: 'Transferencia',
          is_confirmed: true,
          category_id: null,
          reference_number: 'LIMP-202509'
        },
        {
          building_id: buildingId,
          description: 'Mantenimiento ascensor',
          amount: -180.00,
          transaction_date: currentDate,
          transaction_type: 'expense',
          payment_method: 'Transferencia',
          is_confirmed: true,
          category_id: null,
          reference_number: 'MANT-202509'
        },
        {
          building_id: buildingId,
          description: 'Electricidad zonas comunes',
          amount: -95.50,
          transaction_date: currentDate,
          transaction_type: 'expense',
          payment_method: 'Domiciliación',
          is_confirmed: true,
          category_id: null,
          reference_number: 'ELEC-202509'
        },
        {
          building_id: buildingId,
          description: 'Agua zonas comunes',
          amount: -45.00,
          transaction_date: currentDate,
          transaction_type: 'expense',
          payment_method: 'Domiciliación',
          is_confirmed: true,
          category_id: null,
          reference_number: 'AGUA-202509'
        }
      ];
      
      for (const transaction of transactionsToCreate) {
        await trx('transactions').insert({
          ...transaction,
          id: knex.raw('gen_random_uuid()'),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      console.log(`✅ ${transactionsToCreate.length} transacciones creadas`);
    }
    
    // 4. Verificar y crear actas/minutes
    const minutes = await trx('minutes').select('*');
    console.log(`\n📄 Actas encontradas: ${minutes.length}`);
    
    if (minutes.length === 0 && buildings.length > 0) {
      console.log('📝 Creando actas reales...');
      
      const buildingId = buildings[0].id;
      
      const minutesToCreate = [
        {
          building_id: buildingId,
          meeting_date: new Date('2025-09-01'),
          meeting_type: 'ordinary',
          title: 'Reunión Ordinaria - Septiembre 2025',
          content: 'Orden del día:\n1. Aprobación del acta anterior\n2. Estado de cuentas\n3. Mantenimiento del ascensor\n4. Limpieza de zonas comunes\n5. Ruegos y preguntas',
          attendees: 8,
          location: 'Sala de reuniones del edificio',
          status: 'approved',
          approved_date: new Date('2025-09-02'),
          notes: 'Reunión mensual ordinaria'
        },
        {
          building_id: buildingId,
          meeting_date: new Date('2025-08-01'),
          meeting_type: 'ordinary',
          title: 'Reunión Ordinaria - Agosto 2025',
          content: 'Orden del día:\n1. Aprobación del acta anterior\n2. Revisión de gastos del trimestre\n3. Propuesta de pintura de fachada\n4. Ruegos y preguntas',
          attendees: 6,
          location: 'Sala de reuniones del edificio',
          status: 'approved',
          approved_date: new Date('2025-08-03'),
          notes: null
        },
        {
          building_id: buildingId,
          meeting_date: new Date('2025-07-15'),
          meeting_type: 'extraordinary',
          title: 'Reunión Extraordinaria - Reparación urgente',
          content: 'Tema único: Aprobación de presupuesto para reparación urgente de la bomba de agua',
          attendees: 10,
          location: 'Portal del edificio',
          status: 'approved',
          approved_date: new Date('2025-07-16'),
          notes: 'Reunión urgente por avería'
        }
      ];
      
      for (const minute of minutesToCreate) {
        await trx('minutes').insert({
          ...minute,
          id: knex.raw('gen_random_uuid()'),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      console.log(`✅ ${minutesToCreate.length} actas creadas`);
    }
    
    // 5. Verificar y crear convocatorias
    const convocatorias = await trx('convocatorias').select('*');
    console.log(`\n📨 Convocatorias encontradas: ${convocatorias.length}`);
    
    if (convocatorias.length === 0 && buildings.length > 0) {
      console.log('📝 Creando convocatorias reales...');
      
      const buildingId = buildings[0].id;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      
      const convocatoriasToCreate = [
        {
          building_id: buildingId,
          title: 'Convocatoria Reunión Ordinaria - Octubre 2025',
          description: 'Se convoca a todos los propietarios a la reunión mensual ordinaria',
          meeting_date: futureDate,
          meeting_time: '19:00',
          location: 'Sala de reuniones del edificio',
          agenda: '1. Lectura y aprobación del acta anterior\n2. Informe económico del trimestre\n3. Propuestas de mejora\n4. Ruegos y preguntas',
          status: 'scheduled',
          created_by: 'João Silva',
          notification_sent: true,
          reminder_sent: false
        }
      ];
      
      for (const convocatoria of convocatoriasToCreate) {
        await trx('convocatorias').insert({
          ...convocatoria,
          id: knex.raw('gen_random_uuid()'),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      console.log(`✅ ${convocatoriasToCreate.length} convocatorias creadas`);
    }
    
    // 6. Crear tareas si no existen
    const tasks = await trx('tasks').select('*');
    console.log(`\n📋 Tareas encontradas: ${tasks.length}`);
    
    if (tasks.length === 0 && buildings.length > 0) {
      console.log('📝 Creando tareas reales...');
      
      const buildingId = buildings[0].id;
      
      const tasksToCreate = [
        {
          building_id: buildingId,
          title: 'Revisar contrato de limpieza',
          description: 'Revisar y renovar el contrato con la empresa de limpieza',
          status: 'pending',
          priority: 'high',
          due_date: new Date('2025-09-30'),
          assigned_to: 'João Silva'
        },
        {
          building_id: buildingId,
          title: 'Solicitar presupuesto pintura',
          description: 'Solicitar 3 presupuestos para pintura de zonas comunes',
          status: 'in_progress',
          priority: 'medium',
          due_date: new Date('2025-10-15'),
          assigned_to: 'António Ferreira'
        },
        {
          building_id: buildingId,
          title: 'Inspección anual ascensor',
          description: 'Coordinar inspección obligatoria anual del ascensor',
          status: 'pending',
          priority: 'high',
          due_date: new Date('2025-10-01'),
          assigned_to: 'Ana Costa'
        }
      ];
      
      for (const task of tasksToCreate) {
        await trx('tasks').insert({
          ...task,
          id: knex.raw('gen_random_uuid()'),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      console.log(`✅ ${tasksToCreate.length} tareas creadas`);
    }
    
    await trx.commit();
    
    // Resumen final
    console.log('\n========================================');
    console.log('📊 RESUMEN DE DATOS EN LA BASE DE DATOS:');
    console.log('========================================');
    
    const finalCounts = await knex.raw(`
      SELECT 
        (SELECT COUNT(*) FROM buildings) as buildings,
        (SELECT COUNT(*) FROM members) as members,
        (SELECT COUNT(*) FROM fractions) as fractions,
        (SELECT COUNT(*) FROM transactions) as transactions,
        (SELECT COUNT(*) FROM minutes) as minutes,
        (SELECT COUNT(*) FROM convocatorias) as convocatorias,
        (SELECT COUNT(*) FROM tasks) as tasks
    `);
    
    const counts = finalCounts.rows[0];
    console.log(`🏢 Edificios: ${counts.buildings}`);
    console.log(`👥 Miembros: ${counts.members}`);
    console.log(`🏠 Fracciones: ${counts.fractions}`);
    console.log(`💰 Transacciones: ${counts.transactions}`);
    console.log(`📄 Actas: ${counts.minutes}`);
    console.log(`📨 Convocatorias: ${counts.convocatorias}`);
    console.log(`📋 Tareas: ${counts.tasks}`);
    console.log('========================================\n');
    
    console.log('✅ Base de datos poblada con datos reales exitosamente');
    process.exit(0);
    
  } catch (error) {
    await trx.rollback();
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateRealData();