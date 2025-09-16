const userRepository = require('../../repositories/userRepository.cjs');
const { db } = require('../../config/knex.cjs');

describe('UserRepository', () => {
  // Limpiar tabla de usuarios antes de cada test
  beforeEach(async () => {
    await db('users').del();
  });

  describe('createUser', () => {
    it('debe crear un nuevo usuario con contraseña hasheada', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '123456789'
      };

      // Act
      const user = await userRepository.createUser(userData);

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe('password123'); // Debe estar hasheada
    });

    it('debe convertir email a minúsculas', async () => {
      // Arrange
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        name: 'Test User'
      };

      // Act
      const user = await userRepository.createUser(userData);

      // Assert
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('findByEmail', () => {
    it('debe encontrar un usuario por email', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      // Act
      const user = await userRepository.findByEmail('test@example.com');

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('debe retornar null si el usuario no existe', async () => {
      // Act
      const user = await userRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(user).toBeNull();
    });

    it('debe ser case-insensitive', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      // Act
      const user = await userRepository.findByEmail('TEST@EXAMPLE.COM');

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('incrementFailedAttempts', () => {
    it('debe incrementar los intentos fallidos', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      // Act
      await userRepository.incrementFailedAttempts(user.id);
      const updatedUser = await userRepository.findById(user.id);

      // Assert
      expect(updatedUser.failed_login_attempts).toBe(1);
    });

    it('debe bloquear la cuenta después de 5 intentos', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      // Act - Simular 5 intentos fallidos
      for (let i = 0; i < 5; i++) {
        await userRepository.incrementFailedAttempts(user.id);
      }
      
      const blockedUser = await userRepository.findById(user.id);

      // Assert
      expect(blockedUser.failed_login_attempts).toBe(5);
      expect(blockedUser.locked_until).toBeDefined();
      expect(new Date(blockedUser.locked_until)).toBeInstanceOf(Date);
      expect(new Date(blockedUser.locked_until).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('resetFailedAttempts', () => {
    it('debe resetear los intentos fallidos y desbloquear la cuenta', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      // Simular cuenta bloqueada
      await db('users').where('id', user.id).update({
        failed_login_attempts: 5,
        locked_until: new Date(Date.now() + 30 * 60 * 1000)
      });

      // Act
      await userRepository.resetFailedAttempts(user.id);
      const resetUser = await userRepository.findById(user.id);

      // Assert
      expect(resetUser.failed_login_attempts).toBe(0);
      expect(resetUser.locked_until).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('debe actualizar la contraseña y limpiar tokens de reset', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'oldpassword',
        name: 'Test User'
      });
      
      await userRepository.setResetPasswordToken(user.id, 'reset-token');

      // Act
      await userRepository.updatePassword(user.id, 'newpassword');
      const updatedUser = await userRepository.findById(user.id);

      // Assert
      expect(updatedUser.password_hash).toBeDefined();
      expect(updatedUser.reset_password_token).toBeNull();
      expect(updatedUser.reset_password_expires).toBeNull();
    });
  });

  describe('getStats', () => {
    it('debe retornar estadísticas correctas de usuarios', async () => {
      // Arrange
      await Promise.all([
        userRepository.createUser({
          email: 'admin@example.com',
          password: 'pass',
          name: 'Admin',
          role: 'admin',
          is_active: true,
          email_verified: true
        }),
        userRepository.createUser({
          email: 'member1@example.com',
          password: 'pass',
          name: 'Member 1',
          role: 'member',
          is_active: true,
          email_verified: false
        }),
        userRepository.createUser({
          email: 'member2@example.com',
          password: 'pass',
          name: 'Member 2',
          role: 'member',
          is_active: false,
          email_verified: true
        })
      ]);

      // Act
      const stats = await userRepository.getStats();

      // Assert
      expect(stats.total).toBe('3');
      expect(stats.active).toBe('2');
      expect(stats.verified).toBe('2');
      expect(stats.admins).toBe('1');
      expect(stats.members).toBe('2');
    });
  });
});