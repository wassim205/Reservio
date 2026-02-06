import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaClient, Role, EventStatus, RegistrationStatus } from '@prisma/client';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';

// Helper to extract cookies from response headers
const getCookies = (response: request.Response): string[] => {
  const setCookie = response.headers['set-cookie'];
  if (!setCookie) return [];
  return Array.isArray(setCookie) ? setCookie : [setCookie];
};

describe('Tickets E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const adminUser = {
    email: `admin-ticket-e2e-${Date.now()}@example.com`,
    password: 'Admin123!',
    fullname: 'Admin Ticket Test',
  };

  const participantUser = {
    email: `participant-ticket-e2e-${Date.now()}@example.com`,
    password: 'Part123!',
    fullname: 'Participant Ticket Test',
  };

  const participant2User = {
    email: `participant2-ticket-e2e-${Date.now()}@example.com`,
    password: 'Part123!',
    fullname: 'Participant 2 Ticket Test',
  };

  let adminCookies: string[];
  let participantCookies: string[];
  let participant2Cookies: string[];
  let adminId: string;
  let participantId: string;
  let participant2Id: string;
  let testEventId: string;
  let confirmedRegistrationId: string;
  let pendingRegistrationId: string;

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

    // Create participant user 1
    const hashedParticipantPassword = await bcrypt.hash(participantUser.password, 10);
    const participant = await prisma.user.create({
      data: {
        email: participantUser.email,
        password: hashedParticipantPassword,
        fullname: participantUser.fullname,
        role: Role.PARTICIPANT,
      },
    });
    participantId = participant.id;

    // Create participant user 2
    const hashedParticipant2Password = await bcrypt.hash(participant2User.password, 10);
    const participant2 = await prisma.user.create({
      data: {
        email: participant2User.email,
        password: hashedParticipant2Password,
        fullname: participant2User.fullname,
        role: Role.PARTICIPANT,
      },
    });
    participant2Id = participant2.id;

    // Login all users
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    adminCookies = getCookies(adminResponse);

    const participantResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: participantUser.email, password: participantUser.password });
    participantCookies = getCookies(participantResponse);

    const participant2Response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: participant2User.email, password: participant2User.password });
    participant2Cookies = getCookies(participant2Response);

    // Create a test event (PUBLISHED)
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const event = await prisma.event.create({
      data: {
        title: 'Ticket Test Event',
        description: 'Test event for ticket e2e tests',
        location: 'Paris Test Center',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        capacity: 10,
        status: EventStatus.PUBLISHED,
        createdById: adminId,
      },
    });
    testEventId = event.id;

    // Create a CONFIRMED registration for participant 1
    const confirmedRegistration = await prisma.registration.create({
      data: {
        userId: participantId,
        eventId: testEventId,
        status: RegistrationStatus.CONFIRMED,
      },
    });
    confirmedRegistrationId = confirmedRegistration.id;

    // Create a PENDING registration for participant 2
    const pendingRegistration = await prisma.registration.create({
      data: {
        userId: participant2Id,
        eventId: testEventId,
        status: RegistrationStatus.PENDING,
      },
    });
    pendingRegistrationId = pendingRegistration.id;
  });

  afterAll(async () => {
    // Cleanup: delete test data
    await prisma.registration.deleteMany({
      where: { eventId: testEventId },
    });
    await prisma.event.deleteMany({
      where: { id: testEventId },
    });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [adminId, participantId, participant2Id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, participantId, participant2Id] } },
    });

    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /registrations/:id/ticket', () => {
    describe('Success Cases', () => {
      it('should download PDF ticket for CONFIRMED registration', async () => {
        const response = await request(app.getHttpServer())
          .get(`/registrations/${confirmedRegistrationId}/ticket`)
          .set('Cookie', participantCookies)
          .expect(200);

        // Verify response headers
        expect(response.headers['content-type']).toBe('application/pdf');
        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.headers['content-disposition']).toContain('.pdf');

        // Verify it's a valid PDF (starts with %PDF-)
        const pdfHeader = response.body.slice(0, 5).toString();
        expect(pdfHeader).toBe('%PDF-');

        // Verify PDF has content
        expect(response.body.length).toBeGreaterThan(1000);
      });
    });

    describe('Authorization Errors', () => {
      it('should return 401 without authentication', async () => {
        const response = await request(app.getHttpServer())
          .get(`/registrations/${confirmedRegistrationId}/ticket`)
          .expect(401);

        expect(response.body.message).toContain('access token');
      });

      it('should return 403 for admin trying to download ticket', async () => {
        const response = await request(app.getHttpServer())
          .get(`/registrations/${confirmedRegistrationId}/ticket`)
          .set('Cookie', adminCookies)
          .expect(403);

        expect(response.body.message).toContain('PARTICIPANT');
      });

      it('should return 403 when trying to download another user ticket', async () => {
        // Participant 2 tries to download Participant 1's ticket
        const response = await request(app.getHttpServer())
          .get(`/registrations/${confirmedRegistrationId}/ticket`)
          .set('Cookie', participant2Cookies)
          .expect(403);

        expect(response.body.message).toContain('own registrations');
      });
    });

    describe('Validation Errors', () => {
      it('should return 404 for non-existent registration', async () => {
        const response = await request(app.getHttpServer())
          .get('/registrations/non-existent-id/ticket')
          .set('Cookie', participantCookies)
          .expect(404);

        expect(response.body.message).toContain('not found');
      });

      it('should return 400 for PENDING registration', async () => {
        const response = await request(app.getHttpServer())
          .get(`/registrations/${pendingRegistrationId}/ticket`)
          .set('Cookie', participant2Cookies)
          .expect(400);

        expect(response.body.message).toContain('confirmed');
      });

      it('should return 400 for CANCELLED registration', async () => {
        // Create a new event for this test to avoid unique constraint
        const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const cancelledTestEvent = await prisma.event.create({
          data: {
            title: 'Cancelled Test Event',
            description: 'Test event for cancelled registration test',
            location: 'Test Location',
            startDate: futureDate,
            endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
            capacity: 10,
            status: EventStatus.PUBLISHED,
            createdById: adminId,
          },
        });

        // Create a cancelled registration
        const cancelledReg = await prisma.registration.create({
          data: {
            userId: participantId,
            eventId: cancelledTestEvent.id,
            status: RegistrationStatus.CANCELLED,
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/registrations/${cancelledReg.id}/ticket`)
          .set('Cookie', participantCookies)
          .expect(400);

        expect(response.body.message).toContain('confirmed');

        // Cleanup
        await prisma.registration.delete({ where: { id: cancelledReg.id } });
        await prisma.event.delete({ where: { id: cancelledTestEvent.id } });
      });
    });

    describe('PDF Content Verification', () => {
      it('should generate PDF with correct content type and size', async () => {
        const response = await request(app.getHttpServer())
          .get(`/registrations/${confirmedRegistrationId}/ticket`)
          .set('Cookie', participantCookies)
          .expect(200);

        // Check content-length header
        expect(parseInt(response.headers['content-length'])).toBeGreaterThan(0);

        // PDF should be reasonable size (between 1KB and 100KB)
        expect(response.body.length).toBeGreaterThan(1000);
        expect(response.body.length).toBeLessThan(100000);
      });
    });
  });

  describe('Ticket Download Flow', () => {
    it('should allow download after registration is confirmed', async () => {
      // Create a new participant
      const newParticipant = {
        email: `flow-test-${Date.now()}@example.com`,
        password: 'Test123!',
        fullname: 'Flow Test User',
      };

      // Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newParticipant);
      const newParticipantCookies = registerResponse.headers['set-cookie'];
      const newParticipantId = registerResponse.body.user.id;

      // Create a registration (PENDING)
      const regResponse = await request(app.getHttpServer())
        .post(`/events/${testEventId}/register`)
        .set('Cookie', newParticipantCookies)
        .expect(201);
      const newRegistrationId = regResponse.body.registration.id;

      // Try to download ticket while PENDING (should fail)
      await request(app.getHttpServer())
        .get(`/registrations/${newRegistrationId}/ticket`)
        .set('Cookie', newParticipantCookies)
        .expect(400);

      // Admin confirms the registration
      await request(app.getHttpServer())
        .post(`/registrations/${newRegistrationId}/confirm`)
        .set('Cookie', adminCookies)
        .expect(201);

      // Now download should work
      const ticketResponse = await request(app.getHttpServer())
        .get(`/registrations/${newRegistrationId}/ticket`)
        .set('Cookie', newParticipantCookies)
        .expect(200);

      expect(ticketResponse.headers['content-type']).toBe('application/pdf');

      // Cleanup
      await prisma.registration.delete({ where: { id: newRegistrationId } });
      await prisma.refreshToken.deleteMany({ where: { userId: newParticipantId } });
      await prisma.user.delete({ where: { id: newParticipantId } });
    });
  });
});
