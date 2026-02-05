import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaClient, Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';

describe('Role-Based Access Control (E2E)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  // Test users
  const adminUser = {
    email: `admin-e2e-${Date.now()}@example.com`,
    password: 'Admin123!',
    fullname: 'E2E Admin User',
  };

  const participantUser = {
    email: `participant-e2e-${Date.now()}@example.com`,
    password: 'Part123!',
    fullname: 'E2E Participant User',
  };

  let adminCookies: string[];
  let participantCookies: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = new PrismaClient();

    // Create admin user directly in database (can't register as admin)
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    await prisma.user.create({
      data: {
        email: adminUser.email,
        password: hashedPassword,
        fullname: adminUser.fullname,
        role: Role.ADMIN,
      },
    });

    // Register participant user via API
    const participantResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(participantUser);
    participantCookies = participantResponse.headers['set-cookie'];

    // Login as admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });
    adminCookies = adminResponse.headers['set-cookie'];
  });

  afterAll(async () => {
    // Cleanup test users
    await prisma.refreshToken.deleteMany({
      where: {
        user: {
          email: { in: [adminUser.email, participantUser.email] },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminUser.email, participantUser.email] },
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('Role Verification', () => {
    it('admin user should have ADMIN role', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.user.role).toBe('ADMIN');
    });

    it('participant user should have PARTICIPANT role', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', participantCookies)
        .expect(200);

      expect(response.body.user.role).toBe('PARTICIPANT');
    });

    it('newly registered users should default to PARTICIPANT role', async () => {
      const newUser = {
        email: `newuser-${Date.now()}@example.com`,
        password: 'Test123!',
        fullname: 'New Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.user.role).toBe('PARTICIPANT');

      // Cleanup
      const newUserCookies = response.headers['set-cookie'];
      if (newUserCookies) {
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', newUserCookies);
      }
      await prisma.refreshToken.deleteMany({
        where: { user: { email: newUser.email } },
      });
      await prisma.user.delete({ where: { email: newUser.email } });
    });
  });

  describe('Protected Routes - Authentication Required', () => {
    it('should deny access to /auth/me without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Missing access token');
    });

    it('should deny access to /auth/logout-all without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .expect(401);

      expect(response.body.message).toBe('Missing access token');
    });

    it('should allow authenticated admin to access /auth/me', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', adminCookies)
        .expect(200);
    });

    it('should allow authenticated participant to access /auth/me', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', participantCookies)
        .expect(200);
    });
  });

  describe('Admin-Only Routes (when implemented)', () => {
    // These tests are placeholders for when you add admin-only endpoints
    // Example: GET /admin/users, DELETE /admin/users/:id, etc.

    it('should be ready for admin-only route testing', () => {
      // This is a placeholder test - replace with actual admin routes
      expect(adminCookies).toBeDefined();
      expect(participantCookies).toBeDefined();
    });

    // Example of how to test an admin-only route:
    // it('admin should access /admin/users', async () => {
    //   await request(app.getHttpServer())
    //     .get('/admin/users')
    //     .set('Cookie', adminCookies)
    //     .expect(200);
    // });

    // it('participant should be denied access to /admin/users', async () => {
    //   const response = await request(app.getHttpServer())
    //     .get('/admin/users')
    //     .set('Cookie', participantCookies)
    //     .expect(403);
    //
    //   expect(response.body.message).toContain('Access denied');
    // });
  });

  describe('Token Security', () => {
    it('should not include password in user response', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.user.password).toBeUndefined();
    });

    it('should set httpOnly cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password,
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // Check that cookies have httpOnly flag
      const hasHttpOnly = cookies.some((cookie: string) =>
        cookie.toLowerCase().includes('httponly'),
      );
      expect(hasHttpOnly).toBe(true);
    });

    it('should reject tampered tokens', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', ['access_token=tampered.invalid.token'])
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired access token');
    });
  });

  describe('Session Management', () => {
    it('admin can logout all sessions', async () => {
      // Login admin again to get fresh session
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password,
        })
        .expect(200);

      const freshCookies = loginResponse.headers['set-cookie'];

      // Logout all sessions
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Cookie', freshCookies)
        .expect(200);

      // Refresh admin cookies for other tests
      const newLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password,
        });
      adminCookies = newLogin.headers['set-cookie'];
    });

    it('participant can logout all their sessions', async () => {
      // Login participant again
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: participantUser.email,
          password: participantUser.password,
        })
        .expect(200);

      const freshCookies = loginResponse.headers['set-cookie'];

      // Logout all sessions
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Cookie', freshCookies)
        .expect(200);

      // Refresh participant cookies for other tests
      const newLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: participantUser.email,
          password: participantUser.password,
        });
      participantCookies = newLogin.headers['set-cookie'];
    });
  });

  describe('Role-Based Behavior Differences', () => {
    it('both admin and participant can access their own profile', async () => {
      const [adminResponse, participantResponse] = await Promise.all([
        request(app.getHttpServer())
          .get('/auth/me')
          .set('Cookie', adminCookies),
        request(app.getHttpServer())
          .get('/auth/me')
          .set('Cookie', participantCookies),
      ]);

      expect(adminResponse.status).toBe(200);
      expect(participantResponse.status).toBe(200);
      expect(adminResponse.body.user.role).toBe('ADMIN');
      expect(participantResponse.body.user.role).toBe('PARTICIPANT');
    });

    it('both roles can refresh their tokens', async () => {
      const [adminResponse, participantResponse] = await Promise.all([
        request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', adminCookies),
        request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', participantCookies),
      ]);

      expect(adminResponse.status).toBe(200);
      expect(participantResponse.status).toBe(200);

      // Update cookies with refreshed tokens
      adminCookies = adminResponse.headers['set-cookie'];
      participantCookies = participantResponse.headers['set-cookie'];
    });
  });
});
