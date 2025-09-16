const convocatoriaRepository = require('../../repositories/convocatoriaRepository.cjs');
const buildingRepository = require('../../repositories/buildingRepository.cjs');
const { db } = require('../../config/knex.cjs');

describe('ConvocatoriaRepository', () => {
  let testBuildingId;

  beforeAll(async () => {
    // Crear un edificio de prueba
    const building = await buildingRepository.create({
      name: 'Test Building',
      address: 'Test Street 123',
      postal_code: '1234-567',
      city: 'Test City',
      number_of_units: 10
    });
    testBuildingId = building.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db('minute_agenda_items').del();
    await db('convocatorias').del();
    await db('buildings').where('id', testBuildingId).del();
  });

  beforeEach(async () => {
    // Limpiar convocatorias antes de cada test
    await db('minute_agenda_items').del();
    await db('convocatorias').del();
  });

  describe('createWithAgenda', () => {
    it('debe crear una convocatoria con agenda items', async () => {
      // Arrange
      const convocatoriaData = {
        building_id: testBuildingId,
        building_name: 'Test Building',
        building_address: 'Test Street 123',
        assembly_type: 'ordinary',
        assembly_number: 'ORD-2025-001',
        date: new Date('2025-12-01'),
        time: '10:00',
        location: 'Sala de reuniones',
        administrator: 'John Doe',
        legal_reference: 'Art. 16 LPH'
      };

      const agendaItems = [
        { title: 'Apertura de la sesión', description: 'Bienvenida' },
        { title: 'Lectura del acta anterior', description: null },
        { title: 'Aprobación de presupuestos', description: 'Presupuesto 2026' }
      ];

      // Act
      const result = await convocatoriaRepository.createWithAgenda(convocatoriaData, agendaItems);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.assembly_type).toBe('ordinary');
      expect(result.agenda_items).toHaveLength(3);
      
      // Verificar que los agenda items se crearon en la BD
      const savedAgendaItems = await db('minute_agenda_items')
        .where('convocatoria_id', result.id)
        .orderBy('order_number');
      
      expect(savedAgendaItems).toHaveLength(3);
      expect(savedAgendaItems[0].title).toBe('Apertura de la sesión');
      expect(savedAgendaItems[2].order_number).toBe(3);
    });

    it('debe crear convocatoria sin agenda items', async () => {
      // Arrange
      const convocatoriaData = {
        building_id: testBuildingId,
        building_name: 'Test Building',
        building_address: 'Test Street 123',
        assembly_type: 'extraordinary',
        assembly_number: 'EXT-2025-001',
        date: new Date('2025-12-15'),
        time: '18:00',
        location: 'Patio común'
      };

      // Act
      const result = await convocatoriaRepository.createWithAgenda(convocatoriaData, []);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.assembly_type).toBe('extraordinary');
      expect(result.agenda_items).toHaveLength(0);
    });
  });

  describe('findAllWithAgenda', () => {
    it('debe encontrar convocatorias con sus agenda items', async () => {
      // Arrange
      await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'ordinary',
        date: new Date('2025-12-01'),
        time: '10:00'
      }, [
        { title: 'Item 1' },
        { title: 'Item 2' }
      ]);

      await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'extraordinary',
        date: new Date('2025-12-15'),
        time: '18:00'
      }, [
        { title: 'Urgent Item' }
      ]);

      // Act
      const result = await convocatoriaRepository.findAllWithAgenda({ buildingId: testBuildingId });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].agenda_items).toBeDefined();
      expect(result[0].agenda_items.length).toBeGreaterThan(0);
      expect(result[1].agenda_items).toBeDefined();
    });

    it('debe filtrar por tipo de asamblea', async () => {
      // Arrange
      await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'ordinary',
        date: new Date('2025-12-01'),
        time: '10:00'
      }, []);

      await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'extraordinary',
        date: new Date('2025-12-15'),
        time: '18:00'
      }, []);

      // Act
      const result = await convocatoriaRepository.findAllWithAgenda({ 
        buildingId: testBuildingId,
        assemblyType: 'ordinary'
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].assembly_type).toBe('ordinary');
    });
  });

  describe('updateWithAgenda', () => {
    it('debe actualizar convocatoria y reemplazar agenda items', async () => {
      // Arrange
      const convocatoria = await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'ordinary',
        date: new Date('2025-12-01'),
        time: '10:00'
      }, [
        { title: 'Old Item 1' },
        { title: 'Old Item 2' }
      ]);

      // Act
      const updatedData = {
        time: '15:00',
        location: 'Nueva ubicación'
      };
      
      const newAgendaItems = [
        { title: 'New Item 1' },
        { title: 'New Item 2' },
        { title: 'New Item 3' }
      ];

      await convocatoriaRepository.updateWithAgenda(convocatoria.id, updatedData, newAgendaItems);

      // Assert
      const updated = await convocatoriaRepository.findByIdWithAgenda(convocatoria.id);
      expect(updated.time).toBe('15:00');
      expect(updated.location).toBe('Nueva ubicación');
      expect(updated.agenda_items).toHaveLength(3);
      expect(updated.agenda_items[0].title).toBe('New Item 1');
    });
  });

  describe('getNextConvocatoria', () => {
    it('debe obtener la próxima convocatoria', async () => {
      // Arrange
      const today = new Date();
      const future1 = new Date();
      future1.setDate(today.getDate() + 10);
      const future2 = new Date();
      future2.setDate(today.getDate() + 20);
      const past = new Date();
      past.setDate(today.getDate() - 10);

      await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'ordinary',
        date: future2,
        time: '10:00'
      }, []);

      await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'ordinary',
        date: future1,
        time: '10:00'
      }, [{ title: 'Next meeting' }]);

      await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'ordinary',
        date: past,
        time: '10:00'
      }, []);

      // Act
      const result = await convocatoriaRepository.getNextConvocatoria(testBuildingId);

      // Assert
      expect(result).toBeDefined();
      expect(new Date(result.date).getTime()).toBe(future1.getTime());
      expect(result.agenda_items).toHaveLength(1);
      expect(result.agenda_items[0].title).toBe('Next meeting');
    });
  });

  describe('existsAssemblyNumber', () => {
    it('debe detectar números de asamblea duplicados', async () => {
      // Arrange
      await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'ordinary',
        assembly_number: 'ORD-2025-001',
        date: new Date('2025-12-01'),
        time: '10:00'
      }, []);

      // Act
      const exists = await convocatoriaRepository.existsAssemblyNumber(testBuildingId, 'ORD-2025-001');
      const notExists = await convocatoriaRepository.existsAssemblyNumber(testBuildingId, 'ORD-2025-002');

      // Assert
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('debe excluir ID específico al verificar duplicados', async () => {
      // Arrange
      const convocatoria = await convocatoriaRepository.createWithAgenda({
        building_id: testBuildingId,
        building_name: 'Test Building',
        assembly_type: 'ordinary',
        assembly_number: 'ORD-2025-001',
        date: new Date('2025-12-01'),
        time: '10:00'
      }, []);

      // Act
      const exists = await convocatoriaRepository.existsAssemblyNumber(
        testBuildingId, 
        'ORD-2025-001', 
        convocatoria.id
      );

      // Assert
      expect(exists).toBe(false);
    });
  });
});