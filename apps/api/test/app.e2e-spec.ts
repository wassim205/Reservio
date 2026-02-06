import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import cookieParser from 'cookie-parser';

// Helper to extract cookies from response headers
const getCookies = (response: request.Response): string[] => {
  const setCookie = response.headers['set-cookie'];
  if (!setCookie) return [];
  return Array.isArray(setCookie) ? setCookie : [setCookie];
};

describe('App E2E Tests', () => {
  let app: INestApplication<App>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AppController', () => {
    it('/ (GET) should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Auth Flow (E2E)', () => {
    const testUser = {
      email: `e2e-test-${Date.now()}@example.com`,
      password: 'Test123!',
      fullname: 'E2E Test User',
    };

    let accessToken: string;
    let refreshToken: string;
    let cookies: string[] = [];

    describe('POST /auth/register', () => {
      it('should register a new user and set cookies', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);

        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.fullname).toBe(testUser.fullname);
        expect(response.body.user.role).toBe('PARTICIPANT');
        expect(response.body.user.password).toBeUndefined();

        // Check cookies are set
        cookies = getCookies(response);
        expect(cookies).toBeDefined();
        expect(cookies.length).toBeGreaterThanOrEqual(2);

        // Extract tokens from cookies for later tests
        const accessCookie = cookies.find((c: string) =>
          c.startsWith('access_token='),
        );
        const refreshCookie = cookies.find((c: string) =>
          c.startsWith('refresh_token='),
        );
        expect(accessCookie).toBeDefined();
        expect(refreshCookie).toBeDefined();
      });

      it('should reject duplicate email', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(409);

        expect(response.body.message).toBe('User with this email already exists');
      });

      it('should validate required fields', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'invalid' })
          .expect(400);

        expect(response.body.message).toContain('password should not be empty');
      });
    });

    describe('POST /auth/login', () => {
      it('should login with valid credentials and set cookies', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200);

        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);

        cookies = getCookies(response);
        expect(cookies).toBeDefined();

        // Save tokens for subsequent tests
        const accessCookie = cookies.find((c: string) =>
          c.startsWith('access_token='),
        );
        const refreshCookie = cookies.find((c: string) =>
          c.startsWith('refresh_token='),
        );

        accessToken = accessCookie?.split(';')[0].split('=')[1] || '';
        refreshToken = refreshCookie?.split(';')[0].split('=')[1] || '';

        expect(accessToken).toBeTruthy();
        expect(refreshToken).toBeTruthy();
      });

      it('should reject invalid password', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          })
          .expect(401);

        expect(response.body.message).toBe('Invalid credentials');
      });

      it('should reject non-existent email', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'anypassword',
          })
          .expect(401);

        expect(response.body.message).toBe('Invalid credentials');
      });
    });

    describe('GET /auth/me', () => {
      it('should return current user with valid cookie', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Cookie', cookies)
          .expect(200);

        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.password).toBeUndefined();
      });

      it('should return current user with Authorization header', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.user.email).toBe(testUser.email);
      });

      it('should reject request without authentication', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .expect(401);

        expect(response.body.message).toBe('Missing access token');
      });

      it('should reject invalid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.message).toBe('Invalid or expired access token');
      });
    });

    describe('POST /auth/refresh', () => {
      it('should refresh tokens with valid refresh token cookie', async () => {
        // First login to get fresh cookies
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          });
        cookies = getCookies(loginResponse);

        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Cookie', cookies)
          .expect(200);

        expect(response.body.message).toBe('Tokens refreshed');

        // New cookies should be set
        const newCookies = getCookies(response);
        expect(newCookies).toBeDefined();

        // Update cookies for subsequent tests
        cookies = newCookies;
      });

      it('should reject request without refresh token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .expect(401);

        expect(response.body.message).toBe('Missing refresh token');
      });
    });

    describe('POST /auth/logout', () => {
      it('should logout and clear cookies', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Cookie', cookies)
          .expect(200);

        expect(response.body.message).toBe('Logged out successfully');

        // Cookies should be cleared (set to empty or past expiry)
        const clearedCookies = response.headers['set-cookie'];
        expect(clearedCookies).toBeDefined();
      });

      it('should succeed even without cookies (graceful handling)', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .expect(200);

        expect(response.body.message).toBe('Logged out successfully');
      });
    });

    describe('POST /auth/logout-all', () => {
      it('should require authentication', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/logout-all')
          .expect(401);

        expect(response.body.message).toBe('Missing access token');
      });

      it('should logout all sessions when authenticated', async () => {
        // First login to get fresh tokens
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200);

        const freshCookies = loginResponse.headers['set-cookie'];

        const response = await request(app.getHttpServer())
          .post('/auth/logout-all')
          .set('Cookie', freshCookies)
          .expect(200);

        expect(response.body.message).toBe('Logged out from all devices');
      });
    });
  });
});

