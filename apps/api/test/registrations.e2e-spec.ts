import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaClient, Role, EventStatus } from '@prisma/client';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';

// Helper to extract cookies from response headers
const getCookies = (response: request.Response): string[] => {
  const setCookie = response.headers['set-cookie'];
  if (!setCookie) return [];
  return Array.isArray(setCookie) ? setCookie : [setCookie];
};

describe('Registrations E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const adminUser = {
    email: `admin-reg-e2e-${Date.now()}@example.com`,
    password: 'Admin123!',
    fullname: 'Admin Registration Test',
  };

  const participantUser = {
    email: `participant-reg-e2e-${Date.now()}@example.com`,
    password: 'Part123!',
    fullname: 'Participant Registration Test',
  };

  const participant2User = {
    email: `participant2-reg-e2e-${Date.now()}@example.com`,
    password: 'Part123!',
    fullname: 'Participant 2 Registration Test',
  };

  let adminCookies: string[];
  let participantCookies: string[];
  let participant2Cookies: string[];
  let adminId: string;
  let participantId: string;
  let testEventId: string;
  let registrationId: string;

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

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminUser.email,
        password: hashedPassword,
        fullname: adminUser.fullname,
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    // Register participant users
    const participantResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(participantUser);
    participantCookies = getCookies(participantResponse);
    participantId = participantResponse.body.user.id;

    const participant2Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(participant2User);
    participant2Cookies = getCookies(participant2Response);

    // Login as admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });
    adminCookies = getCookies(adminResponse);

    // Create a test event
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const event = await prisma.event.create({
      data: {
        title: 'E2E Test Event',
        description: 'Test event for registration e2e tests',
        location: 'Test Location',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        capacity: 5,
        status: EventStatus.PUBLISHED,
        createdById: adminId,
      },
    });
    testEventId = event.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.registration.deleteMany({
      where: { eventId: testEventId },
    });
    await prisma.event.deleteMany({
      where: { createdById: adminId },
    });
    await prisma.refreshToken.deleteMany({
      where: {
        user: {
          email: {
            in: [adminUser.email, participantUser.email, participant2User.email],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminUser.email, participantUser.email, participant2User.email],
        },
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('Participant Registration Flow', () => {
    it('POST /events/:eventId/register - participant can register for event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${testEventId}/register`)
        .set('Cookie', participantCookies)
        .expect(201);

      expect(response.body.registration).toBeDefined();
      expect(response.body.registration.status).toBe('PENDING');
      expect(response.body.registration.eventId).toBe(testEventId);
      expect(response.body.message).toBe(
        'Reservation request submitted successfully',
      );

      registrationId = response.body.registration.id;
    });

    it('POST /events/:eventId/register - cannot register twice', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${testEventId}/register`)
        .set('Cookie', participantCookies)
        .expect(409);

      expect(response.body.message).toContain('already have a pending');
    });

    it('GET /registrations/my - participant can see their registrations', async () => {
      const response = await request(app.getHttpServer())
        .get('/registrations/my')
        .set('Cookie', participantCookies)
        .expect(200);

      expect(response.body.registrations).toBeInstanceOf(Array);
      expect(response.body.registrations.length).toBeGreaterThan(0);
      expect(response.body.registrations[0].eventId).toBe(testEventId);
    });

    it('POST /events/:eventId/register - requires authentication', async () => {
      await request(app.getHttpServer())
        .post(`/events/${testEventId}/register`)
        .expect(401);
    });

    it('POST /events/:eventId/register - admin cannot register as participant', async () => {
      await request(app.getHttpServer())
        .post(`/events/${testEventId}/register`)
        .set('Cookie', adminCookies)
        .expect(403);
    });
  });

  describe('Admin Registration Management', () => {
    it('GET /events/:eventId/registrations - admin can view registrations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${testEventId}/registrations`)
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.registrations).toBeInstanceOf(Array);
      expect(response.body.registrations.length).toBeGreaterThan(0);
    });

    it('GET /events/:eventId/registrations - participant cannot view', async () => {
      await request(app.getHttpServer())
        .get(`/events/${testEventId}/registrations`)
        .set('Cookie', participantCookies)
        .expect(403);
    });

    it('POST /registrations/:id/confirm - admin can confirm registration', async () => {
      const response = await request(app.getHttpServer())
        .post(`/registrations/${registrationId}/confirm`)
        .set('Cookie', adminCookies)
        .expect(201);

      expect(response.body.registration.status).toBe('CONFIRMED');
      expect(response.body.message).toBe('Reservation confirmed successfully');
    });

    it('POST /registrations/:id/confirm - cannot confirm already confirmed', async () => {
      const response = await request(app.getHttpServer())
        .post(`/registrations/${registrationId}/confirm`)
        .set('Cookie', adminCookies)
        .expect(400);

      expect(response.body.message).toBe('Registration is already confirmed');
    });

    it('POST /registrations/:id/reject - admin can reject registration', async () => {
      const response = await request(app.getHttpServer())
        .post(`/registrations/${registrationId}/reject`)
        .set('Cookie', adminCookies)
        .expect(201);

      expect(response.body.registration.status).toBe('CANCELLED');
      expect(response.body.message).toBe('Reservation rejected successfully');
    });

    it('POST /registrations/:id/reject - cannot reject already cancelled', async () => {
      const response = await request(app.getHttpServer())
        .post(`/registrations/${registrationId}/reject`)
        .set('Cookie', adminCookies)
        .expect(400);

      expect(response.body.message).toBe(
        'This registration is already cancelled',
      );
    });

    it('POST /registrations/:id/confirm - participant cannot confirm', async () => {
      await request(app.getHttpServer())
        .post(`/registrations/${registrationId}/confirm`)
        .set('Cookie', participantCookies)
        .expect(403);
    });

    it('POST /registrations/:id/reject - participant cannot reject', async () => {
      await request(app.getHttpServer())
        .post(`/registrations/${registrationId}/reject`)
        .set('Cookie', participantCookies)
        .expect(403);
    });
  });

  describe('Capacity Management', () => {
    let smallEventId: string;
    let reg1Id: string;

    beforeAll(async () => {
      // Create a small capacity event with capacity of 2
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const event = await prisma.event.create({
        data: {
          title: 'Small Capacity Event',
          description: 'Event with capacity of 2',
          location: 'Test Location',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          capacity: 2,
          status: EventStatus.PUBLISHED,
          createdById: adminId,
        },
      });
      smallEventId = event.id;
    });

    afterAll(async () => {
      await prisma.registration.deleteMany({
        where: { eventId: smallEventId },
      });
      await prisma.event.delete({ where: { id: smallEventId } });
    });

    it('should allow registration when capacity available', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${smallEventId}/register`)
        .set('Cookie', participantCookies)
        .expect(201);

      reg1Id = response.body.registration.id;
    });

    it('should allow second registration when capacity available', async () => {
      await request(app.getHttpServer())
        .post(`/events/${smallEventId}/register`)
        .set('Cookie', participant2Cookies)
        .expect(201);
    });

    it('should confirm first registration', async () => {
      await request(app.getHttpServer())
        .post(`/registrations/${reg1Id}/confirm`)
        .set('Cookie', adminCookies)
        .expect(201);
    });

    it('should confirm second registration (still within capacity)', async () => {
      const regsResponse = await request(app.getHttpServer())
        .get(`/events/${smallEventId}/registrations`)
        .set('Cookie', adminCookies);

      const pendingReg = regsResponse.body.registrations.find(
        (r: { status: string }) => r.status === 'PENDING',
      );

      if (pendingReg) {
        await request(app.getHttpServer())
          .post(`/registrations/${pendingReg.id}/confirm`)
          .set('Cookie', adminCookies)
          .expect(201);
      }
    });
  });

  describe('Capacity Full Scenario', () => {
    let fullEventId: string;

    beforeAll(async () => {
      // Create event with capacity of 1 and pre-fill it
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const event = await prisma.event.create({
        data: {
          title: 'Full Capacity Event',
          description: 'Event with capacity of 1',
          location: 'Test Location',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          capacity: 1,
          status: EventStatus.PUBLISHED,
          createdById: adminId,
        },
      });
      fullEventId = event.id;

      // Create and confirm a registration to fill capacity
      const regResponse = await request(app.getHttpServer())
        .post(`/events/${fullEventId}/register`)
        .set('Cookie', participantCookies);

      await request(app.getHttpServer())
        .post(`/registrations/${regResponse.body.registration.id}/confirm`)
        .set('Cookie', adminCookies);
    });

    afterAll(async () => {
      await prisma.registration.deleteMany({
        where: { eventId: fullEventId },
      });
      await prisma.event.delete({ where: { id: fullEventId } });
    });

    it('should reject registration when event is full', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${fullEventId}/register`)
        .set('Cookie', participant2Cookies)
        .expect(400);

      expect(response.body.message).toContain('fully booked');
    });
  });

  describe('Participant Cancel Registration', () => {
    let cancelEventId: string;
    let cancelRegId: string;

    beforeAll(async () => {
      const futureDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
      const event = await prisma.event.create({
        data: {
          title: 'Cancel Test Event',
          description: 'Event for cancel tests',
          location: 'Test Location',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          capacity: 10,
          status: EventStatus.PUBLISHED,
          createdById: adminId,
        },
      });
      cancelEventId = event.id;

      // Create a registration
      const response = await request(app.getHttpServer())
        .post(`/events/${cancelEventId}/register`)
        .set('Cookie', participantCookies);
      cancelRegId = response.body.registration.id;
    });

    afterAll(async () => {
      await prisma.registration.deleteMany({
        where: { eventId: cancelEventId },
      });
      await prisma.event.delete({ where: { id: cancelEventId } });
    });

    it('DELETE /registrations/:id - participant can cancel own registration', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/registrations/${cancelRegId}`)
        .set('Cookie', participantCookies)
        .expect(200);

      expect(response.body.registration.status).toBe('CANCELLED');
      expect(response.body.message).toBe('Reservation cancelled successfully');
    });

    it('DELETE /registrations/:id - cannot cancel already cancelled', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/registrations/${cancelRegId}`)
        .set('Cookie', participantCookies)
        .expect(400);

      expect(response.body.message).toBe('This reservation is already cancelled');
    });

    it('participant can re-register after cancelling', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${cancelEventId}/register`)
        .set('Cookie', participantCookies)
        .expect(201);

      expect(response.body.registration.status).toBe('PENDING');
    });
  });

  describe('Event Validation', () => {
    it('cannot register for non-existent event', async () => {
      const response = await request(app.getHttpServer())
        .post('/events/nonexistent-id/register')
        .set('Cookie', participantCookies)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('cannot register for draft event', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const draftEvent = await prisma.event.create({
        data: {
          title: 'Draft Event',
          description: 'Draft event test',
          location: 'Test',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          capacity: 10,
          status: EventStatus.DRAFT,
          createdById: adminId,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/events/${draftEvent.id}/register`)
        .set('Cookie', participantCookies)
        .expect(400);

      expect(response.body.message).toContain('not published');

      await prisma.event.delete({ where: { id: draftEvent.id } });
    });

    it('cannot register for cancelled event', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const cancelledEvent = await prisma.event.create({
        data: {
          title: 'Cancelled Event',
          description: 'Cancelled event test',
          location: 'Test',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          capacity: 10,
          status: EventStatus.CANCELLED,
          createdById: adminId,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/events/${cancelledEvent.id}/register`)
        .set('Cookie', participantCookies)
        .expect(400);

      expect(response.body.message).toContain('cancelled');

      await prisma.event.delete({ where: { id: cancelledEvent.id } });
    });

    it('cannot register for past event', async () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const pastEvent = await prisma.event.create({
        data: {
          title: 'Past Event',
          description: 'Past event test',
          location: 'Test',
          startDate: pastDate,
          endDate: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000),
          capacity: 10,
          status: EventStatus.PUBLISHED,
          createdById: adminId,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/events/${pastEvent.id}/register`)
        .set('Cookie', participantCookies)
        .expect(400);

      expect(response.body.message).toContain('past');

      await prisma.event.delete({ where: { id: pastEvent.id } });
    });
  });
});
