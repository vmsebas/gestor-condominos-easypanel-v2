const authService = require('../../services/authService.cjs');
const userRepository = require('../../repositories/userRepository.cjs');
const refreshTokenRepository = require('../../repositories/refreshTokenRepository.cjs');
const { db } = require('../../config/knex.cjs');
const { verifyToken } = require('../../utils/auth.cjs');

describe('AuthService', () => {
  beforeEach(async () => {
    await db('refresh_tokens').del();
    await db('users').del();
  });

  describe('login', () => {
    it('debe permitir login con credenciales válidas', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        is_active: true
      });

      // Act
      const result = await authService.login('test@example.com', 'password123');

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password_hash).toBeUndefined(); // No debe exponer el hash
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('debe rechazar login con contraseña incorrecta', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'correct-password',
        name: 'Test User'
      });

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debe rechazar login con usuario inexistente', async () => {
      // Act & Assert
      await expect(
        authService.login('nonexistent@example.com', 'password')
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debe rechazar login con usuario inactivo', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        is_active: false
      });

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Usuario inactivo');
    });

    it('debe rechazar login con cuenta bloqueada', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      await db('users').where('id', user.id).update({
        locked_until: new Date(Date.now() + 30 * 60 * 1000)
      });

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow(/Cuenta bloqueada/);
    });

    it('debe resetear intentos fallidos después de login exitoso', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      await db('users').where('id', user.id).update({
        failed_login_attempts: 3
      });

      // Act
      await authService.login('test@example.com', 'password123');
      const updatedUser = await userRepository.findById(user.id);

      // Assert
      expect(updatedUser.failed_login_attempts).toBe(0);
    });
  });

  describe('register', () => {
    it('debe registrar un nuevo usuario', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        phone: '123456789'
      };

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.role).toBe('member'); // Rol por defecto
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('debe rechazar registro con email duplicado', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User'
      });

      // Act & Assert
      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'newpassword',
          name: 'Another User'
        })
      ).rejects.toThrow('El email ya está registrado');
    });
  });

  describe('refreshAccessToken', () => {
    it('debe generar nuevo access token con refresh token válido', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      const { token } = await refreshTokenRepository.createToken(user.id);

      // Act
      const result = await authService.refreshAccessToken(token);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(user.id);
      
      // Verificar que el nuevo token es válido
      const decoded = verifyToken(result.accessToken);
      expect(decoded.userId).toBe(user.id);
    });

    it('debe rechazar refresh token inválido', async () => {
      // Act & Assert
      await expect(
        authService.refreshAccessToken('invalid-token')
      ).rejects.toThrow('Refresh token inválido o expirado');
    });

    it('debe rechazar refresh token de usuario inactivo', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        is_active: false
      });
      
      const { token } = await refreshTokenRepository.createToken(user.id);

      // Act & Assert
      await expect(
        authService.refreshAccessToken(token)
      ).rejects.toThrow('Usuario no encontrado o inactivo');
    });
  });

  describe('changePassword', () => {
    it('debe cambiar la contraseña con contraseña actual correcta', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'oldpassword',
        name: 'Test User'
      });

      // Act
      await authService.changePassword(user.id, 'oldpassword', 'newpassword');

      // Assert - Intentar login con nueva contraseña
      const result = await authService.login('test@example.com', 'newpassword');
      expect(result.user.email).toBe('test@example.com');
    });

    it('debe rechazar cambio con contraseña actual incorrecta', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'correctpassword',
        name: 'Test User'
      });

      // Act & Assert
      await expect(
        authService.changePassword(user.id, 'wrongpassword', 'newpassword')
      ).rejects.toThrow('Contraseña actual incorrecta');
    });
  });

  describe('resetPassword', () => {
    it('debe resetear contraseña con token válido', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'oldpassword',
        name: 'Test User'
      });
      
      const resetResult = await authService.requestPasswordReset('test@example.com');
      const resetToken = resetResult.resetToken;

      // Act
      await authService.resetPassword(resetToken, 'newpassword');

      // Assert - Intentar login con nueva contraseña
      const loginResult = await authService.login('test@example.com', 'newpassword');
      expect(loginResult.user.email).toBe('test@example.com');
    });

    it('debe rechazar reset con token inválido', async () => {
      // Act & Assert
      await expect(
        authService.resetPassword('invalid-token', 'newpassword')
      ).rejects.toThrow('Token de reset inválido o expirado');
    });
  });

  describe('logout', () => {
    it('debe revocar refresh token al hacer logout', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      const { token } = await refreshTokenRepository.createToken(user.id);

      // Act
      await authService.logout(token);

      // Assert - El token debe estar revocado
      const revokedToken = await refreshTokenRepository.findValidToken(token);
      expect(revokedToken).toBeNull();
    });
  });

  describe('logoutAllDevices', () => {
    it('debe revocar todos los refresh tokens del usuario', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      // Crear múltiples tokens
      await refreshTokenRepository.createToken(user.id, { deviceName: 'Device 1' });
      await refreshTokenRepository.createToken(user.id, { deviceName: 'Device 2' });
      await refreshTokenRepository.createToken(user.id, { deviceName: 'Device 3' });

      // Act
      await authService.logoutAllDevices(user.id);

      // Assert
      const activeTokens = await refreshTokenRepository.countActiveTokens(user.id);
      expect(activeTokens).toBe(0);
    });
  });
});