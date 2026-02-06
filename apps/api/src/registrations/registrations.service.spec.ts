import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, EventStatus, RegistrationStatus } from '@prisma/client';
import { RegistrationsService } from './registrations.service';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    event: {
      findUnique: jest.fn(),
    },
    registration: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    EventStatus: {
      DRAFT: 'DRAFT',
      PUBLISHED: 'PUBLISHED',
      CANCELLED: 'CANCELLED',
    },
    RegistrationStatus: {
      PENDING: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      CANCELLED: 'CANCELLED',
    },
  };
});

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let mockPrisma: any;

  // Mock data
  const mockUser = {
    id: 'user-123',
    fullname: 'Test User',
    email: 'user@example.com',
  };

  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const mockPublishedEvent = {
    id: 'event-123',
    title: 'Test Event',
    description: 'Test Description',
    location: 'Test Location',
    startDate: futureDate,
    endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
    capacity: 10,
    status: EventStatus.PUBLISHED,
    createdById: 'admin-123',
  };

  const mockDraftEvent = {
    ...mockPublishedEvent,
    id: 'event-draft',
    status: EventStatus.DRAFT,
  };

  const mockCancelledEvent = {
    ...mockPublishedEvent,
    id: 'event-cancelled',
    status: EventStatus.CANCELLED,
  };

  const mockPastEvent = {
    ...mockPublishedEvent,
    id: 'event-past',
    startDate: pastDate,
    endDate: pastDate,
  };

  const mockRegistration = {
    id: 'reg-123',
    status: RegistrationStatus.PENDING,
    userId: 'user-123',
    eventId: 'event-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    event: {
      id: 'event-123',
      title: 'Test Event',
      startDate: futureDate,
      location: 'Test Location',
    },
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistrationsService],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
    mockPrisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============ CREATE REGISTRATION ============
  describe('create', () => {
    it('should create a new registration with PENDING status', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);
      mockPrisma.registration.findUnique.mockResolvedValue(null);
      mockPrisma.registration.count.mockResolvedValue(5); // 5 existing registrations
      mockPrisma.registration.create.mockResolvedValue(mockRegistration);

      const result = await service.create('event-123', 'user-123');

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' },
      });
      expect(mockPrisma.registration.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          eventId: 'event-123',
          status: RegistrationStatus.PENDING,
        },
        include: expect.any(Object),
      });
      expect(result.status).toBe(RegistrationStatus.PENDING);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.create('nonexistent-event', 'user-123'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('nonexistent-event', 'user-123'),
      ).rejects.toThrow('Event with ID nonexistent-event not found');
    });

    it('should throw BadRequestException for cancelled events', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockCancelledEvent);

      await expect(
        service.create('event-cancelled', 'user-123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create('event-cancelled', 'user-123'),
      ).rejects.toThrow('Cannot register for a cancelled event');
    });

    it('should throw BadRequestException for draft events', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockDraftEvent);

      await expect(service.create('event-draft', 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create('event-draft', 'user-123')).rejects.toThrow(
        'Cannot register for an event that is not published',
      );
    });

    it('should throw BadRequestException for past events', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPastEvent);

      await expect(service.create('event-past', 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create('event-past', 'user-123')).rejects.toThrow(
        'Cannot register for a past event',
      );
    });

    it('should throw ConflictException if user has pending registration', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.PENDING,
      });

      await expect(service.create('event-123', 'user-123')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create('event-123', 'user-123')).rejects.toThrow(
        'You already have a pending reservation for this event',
      );
    });

    it('should throw ConflictException if user has confirmed registration', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CONFIRMED,
      });

      await expect(service.create('event-123', 'user-123')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create('event-123', 'user-123')).rejects.toThrow(
        'You already have a confirmed reservation for this event',
      );
    });

    it('should allow re-registration if previous registration was cancelled', async () => {
      const cancelledRegistration = {
        ...mockRegistration,
        status: RegistrationStatus.CANCELLED,
      };
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);
      mockPrisma.registration.findUnique.mockResolvedValue(
        cancelledRegistration,
      );
      mockPrisma.registration.update.mockResolvedValue({
        ...cancelledRegistration,
        status: RegistrationStatus.PENDING,
      });

      const result = await service.create('event-123', 'user-123');

      expect(mockPrisma.registration.update).toHaveBeenCalledWith({
        where: { id: cancelledRegistration.id },
        data: { status: RegistrationStatus.PENDING },
        include: expect.any(Object),
      });
      expect(result.status).toBe(RegistrationStatus.PENDING);
    });

    it('should throw BadRequestException if event is full', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);
      mockPrisma.registration.findUnique.mockResolvedValue(null);
      mockPrisma.registration.count.mockResolvedValue(10); // Full capacity

      await expect(service.create('event-123', 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create('event-123', 'user-123')).rejects.toThrow(
        'This event is fully booked. No seats remaining.',
      );
    });
  });

  // ============ CANCEL OWN REGISTRATION ============
  describe('cancelOwn', () => {
    it('should cancel own registration', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(mockRegistration);
      mockPrisma.registration.update.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CANCELLED,
      });

      const result = await service.cancelOwn('reg-123', 'user-123');

      expect(mockPrisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        data: { status: RegistrationStatus.CANCELLED },
        include: expect.any(Object),
      });
      expect(result.status).toBe(RegistrationStatus.CANCELLED);
    });

    it('should throw NotFoundException if registration does not exist', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(null);

      await expect(service.cancelOwn('nonexistent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancelOwn('nonexistent', 'user-123')).rejects.toThrow(
        'Registration not found',
      );
    });

    it('should throw BadRequestException if trying to cancel another user registration', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        userId: 'other-user-456',
      });

      await expect(service.cancelOwn('reg-123', 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelOwn('reg-123', 'user-123')).rejects.toThrow(
        'You can only cancel your own reservations',
      );
    });

    it('should throw BadRequestException if registration is already cancelled', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CANCELLED,
      });

      await expect(service.cancelOwn('reg-123', 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelOwn('reg-123', 'user-123')).rejects.toThrow(
        'This reservation is already cancelled',
      );
    });
  });

  // ============ FIND BY USER ============
  describe('findByUser', () => {
    it('should return all registrations for a user', async () => {
      const userRegistrations = [mockRegistration, { ...mockRegistration, id: 'reg-456' }];
      mockPrisma.registration.findMany.mockResolvedValue(userRegistrations);

      const result = await service.findByUser('user-123');

      expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  // ============ FIND BY EVENT ============
  describe('findByEvent', () => {
    it('should return all registrations for an event', async () => {
      const eventRegistrations = [mockRegistration, { ...mockRegistration, id: 'reg-456' }];
      mockPrisma.registration.findMany.mockResolvedValue(eventRegistrations);

      const result = await service.findByEvent('event-123');

      expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event-123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  // ============ CONFIRM REGISTRATION (ADMIN) ============
  describe('confirm', () => {
    it('should confirm a pending registration', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(mockRegistration);
      mockPrisma.registration.update.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CONFIRMED,
      });

      const result = await service.confirm('reg-123');

      expect(mockPrisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        data: { status: RegistrationStatus.CONFIRMED },
        include: expect.any(Object),
      });
      expect(result.status).toBe(RegistrationStatus.CONFIRMED);
    });

    it('should throw NotFoundException if registration does not exist', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(null);

      await expect(service.confirm('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if registration is not pending', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CONFIRMED,
      });

      await expect(service.confirm('reg-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirm('reg-123')).rejects.toThrow(
        'Registration is already confirmed',
      );
    });

    it('should throw BadRequestException if registration is cancelled', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CANCELLED,
      });

      await expect(service.confirm('reg-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirm('reg-123')).rejects.toThrow(
        'Cannot confirm a cancelled registration',
      );
    });
  });

  // ============ REJECT REGISTRATION (ADMIN) ============
  describe('reject', () => {
    it('should reject a registration', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(mockRegistration);
      mockPrisma.registration.update.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CANCELLED,
      });

      const result = await service.reject('reg-123');

      expect(mockPrisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        data: { status: RegistrationStatus.CANCELLED },
        include: expect.any(Object),
      });
      expect(result.status).toBe(RegistrationStatus.CANCELLED);
    });

    it('should throw NotFoundException if registration does not exist', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(null);

      await expect(service.reject('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if registration is already cancelled', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CANCELLED,
      });

      await expect(service.reject('reg-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.reject('reg-123')).rejects.toThrow(
        'This registration is already cancelled',
      );
    });
  });
});
