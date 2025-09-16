const request = require('supertest');
const { app } = require('../../app.cjs');
const { db } = require('../../config/knex.cjs');
const userRepository = require('../../repositories/userRepository.cjs');
const { generateToken } = require('../../utils/auth.cjs');

describe('Auth Routes', () => {
  beforeEach(async () => {
    await db('refresh_tokens').del();
    await db('users').del();
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          phone: '123456789'
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined(); // Refresh token en cookie
    });

    it('debe validar campos requeridos', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Falta password y name
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe validar formato de email', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar email duplicado', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User'
      });

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'newpassword',
          name: 'New User'
        });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email ya está registrado');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe permitir login con credenciales válidas', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('debe rechazar credenciales inválidas', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'correctpassword',
        name: 'Test User'
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Credenciales inválidas');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debe retornar usuario actual con token válido', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      const token = generateToken({ userId: user.id });

      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.password_hash).toBeUndefined();
    });

    it('debe rechazar sin token', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar con token inválido', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token inválido');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('debe cerrar sesión correctamente', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      const token = generateToken({ userId: user.id });

      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', 'refreshToken=some-refresh-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken=;'); // Cookie limpiada
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('debe cambiar contraseña con credenciales correctas', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'oldpassword',
        name: 'Test User'
      });
      
      const token = generateToken({ userId: user.id });

      // Act
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verificar que puede hacer login con nueva contraseña
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });
      
      expect(loginResponse.status).toBe(200);
    });

    it('debe rechazar con contraseña actual incorrecta', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'correctpassword',
        name: 'Test User'
      });
      
      const token = generateToken({ userId: user.id });

      // Act
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Contraseña actual incorrecta');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('debe aceptar solicitud de reset', async () => {
      // Arrange
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      // Act
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // No debe revelar si el email existe o no
      expect(response.body.message).toContain('Si el email existe');
    });

    it('debe aceptar email inexistente sin revelar información', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Si el email existe');
    });
  });

  describe('GET /api/auth/sessions', () => {
    it('debe listar sesiones activas del usuario', async () => {
      // Arrange
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      const token = generateToken({ userId: user.id });

      // Act
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('debe requerir autenticación', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/sessions');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});