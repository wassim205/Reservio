import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, EventStatus } from '@prisma/client';
import { EventsService } from './events.service';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    EventStatus: {
      DRAFT: 'DRAFT',
      PUBLISHED: 'PUBLISHED',
      CANCELLED: 'CANCELLED',
    },
    Prisma: {},
  };
});

describe('EventsService', () => {
  let service: EventsService;
  let mockPrisma: any;

  // Mock data
  const mockAdmin = {
    id: 'admin-123',
    fullname: 'Admin User',
    email: 'admin@example.com',
  };

  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const laterDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000); // 8 days from now

  const mockDraftEvent = {
    id: 'event-123',
    title: 'Test Event',
    description: 'A test event description',
    location: 'Test Location',
    startDate: futureDate,
    endDate: laterDate,
    capacity: 100,
    metadata: null,
    status: EventStatus.DRAFT,
    createdById: 'admin-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: mockAdmin,
  };

  const mockPublishedEvent = {
    ...mockDraftEvent,
    id: 'event-456',
    status: EventStatus.PUBLISHED,
  };

  const mockCancelledEvent = {
    ...mockDraftEvent,
    id: 'event-789',
    status: EventStatus.CANCELLED,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile();

    service = module.get<EventsService>(EventsService);
    mockPrisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============ CREATE ============
  describe('create', () => {
    const createEventDto = {
      title: 'New Event',
      description: 'Event description',
      location: 'Event Location',
      startDate: futureDate.toISOString(),
      endDate: laterDate.toISOString(),
      capacity: 50,
    };

    it('should create a new event with DRAFT status', async () => {
      mockPrisma.event.create.mockResolvedValue({
        ...mockDraftEvent,
        title: createEventDto.title,
      });

      const result = await service.create(createEventDto, 'admin-123');

      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createEventDto.title,
          description: createEventDto.description,
          location: createEventDto.location,
          capacity: createEventDto.capacity,
          createdById: 'admin-123',
          status: EventStatus.DRAFT,
        }),
        include: expect.any(Object),
      });
      expect(result.title).toBe(createEventDto.title);
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      const invalidDto = {
        ...createEventDto,
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Before start
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(service.create(invalidDto, 'admin-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto, 'admin-123')).rejects.toThrow(
        'End date must be after start date',
      );
    });

    it('should throw BadRequestException if start date is in the past', async () => {
      const invalidDto = {
        ...createEventDto,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(service.create(invalidDto, 'admin-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto, 'admin-123')).rejects.toThrow(
        'Start date cannot be in the past',
      );
    });

    it('should create event with optional metadata', async () => {
      const dtoWithMetadata = {
        ...createEventDto,
        metadata: { theme: 'tech', tags: ['conference', 'networking'] },
      };

      mockPrisma.event.create.mockResolvedValue({
        ...mockDraftEvent,
        metadata: dtoWithMetadata.metadata,
      });

      const result = await service.create(dtoWithMetadata, 'admin-123');

      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: dtoWithMetadata.metadata,
        }),
        include: expect.any(Object),
      });
      expect(result.metadata).toEqual(dtoWithMetadata.metadata);
    });
  });

  // ============ FIND ALL ============
  describe('findAll', () => {
    it('should return all events when no status filter', async () => {
      const allEvents = [
        mockDraftEvent,
        mockPublishedEvent,
        mockCancelledEvent,
      ];
      mockPrisma.event.findMany.mockResolvedValue(allEvents);

      const result = await service.findAll();

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: expect.any(Object),
        orderBy: { startDate: 'asc' },
      });
      expect(result).toHaveLength(3);
    });

    it('should return filtered events by DRAFT status', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockDraftEvent]);

      const result = await service.findAll(EventStatus.DRAFT);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { status: EventStatus.DRAFT },
        include: expect.any(Object),
        orderBy: { startDate: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(EventStatus.DRAFT);
    });

    it('should return filtered events by PUBLISHED status', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockPublishedEvent]);

      const result = await service.findAll(EventStatus.PUBLISHED);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { status: EventStatus.PUBLISHED },
        include: expect.any(Object),
        orderBy: { startDate: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(EventStatus.PUBLISHED);
    });

    it('should return empty array when no events exist', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ============ FIND PUBLISHED ============
  describe('findPublished', () => {
    it('should return only published events', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockPublishedEvent]);

      const result = await service.findPublished();

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { status: EventStatus.PUBLISHED },
        include: expect.any(Object),
        orderBy: { startDate: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(EventStatus.PUBLISHED);
    });

    it('should return empty array when no published events', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await service.findPublished();

      expect(result).toEqual([]);
    });
  });

  // ============ FIND ONE ============
  describe('findOne', () => {
    it('should return an event by ID', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockDraftEvent);

      const result = await service.findOne('event-123');

      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockDraftEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        'Event with ID nonexistent-id not found',
      );
    });
  });

  // ============ UPDATE ============
  describe('update', () => {
    const updateEventDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should update a draft event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockDraftEvent);
      mockPrisma.event.update.mockResolvedValue({
        ...mockDraftEvent,
        ...updateEventDto,
      });

      const result = await service.update('event-123', updateEventDto);

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: expect.objectContaining({
          title: updateEventDto.title,
          description: updateEventDto.description,
        }),
        include: expect.any(Object),
      });
      expect(result.title).toBe(updateEventDto.title);
    });

    it('should throw BadRequestException when updating a published event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);

      await expect(service.update('event-456', updateEventDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('event-456', updateEventDto)).rejects.toThrow(
        'Cannot edit a published or cancelled event',
      );
    });

    it('should throw BadRequestException when updating a cancelled event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockCancelledEvent);

      await expect(service.update('event-789', updateEventDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('event-789', updateEventDto)).rejects.toThrow(
        'Cannot edit a published or cancelled event',
      );
    });

    it('should throw BadRequestException if updated end date is before start date', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockDraftEvent);

      const invalidUpdate = {
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Before existing start
      };

      await expect(service.update('event-123', invalidUpdate)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('event-123', invalidUpdate)).rejects.toThrow(
        'End date must be after start date',
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateEventDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============ PUBLISH ============
  describe('publish', () => {
    it('should publish a draft event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockDraftEvent);
      mockPrisma.event.update.mockResolvedValue({
        ...mockDraftEvent,
        status: EventStatus.PUBLISHED,
      });

      const result = await service.publish('event-123');

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { status: EventStatus.PUBLISHED },
        include: expect.any(Object),
      });
      expect(result.status).toBe(EventStatus.PUBLISHED);
    });

    it('should throw BadRequestException when publishing a published event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);

      await expect(service.publish('event-456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publish('event-456')).rejects.toThrow(
        'Only draft events can be published',
      );
    });

    it('should throw BadRequestException when publishing a cancelled event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockCancelledEvent);

      await expect(service.publish('event-789')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publish('event-789')).rejects.toThrow(
        'Only draft events can be published',
      );
    });

    it('should throw BadRequestException when publishing event with past start date', async () => {
      const pastEvent = {
        ...mockDraftEvent,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };
      mockPrisma.event.findUnique.mockResolvedValue(pastEvent);

      await expect(service.publish('event-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publish('event-123')).rejects.toThrow(
        'Cannot publish an event with a past start date',
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.publish('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ CANCEL ============
  describe('cancel', () => {
    it('should cancel a draft event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockDraftEvent);
      mockPrisma.event.update.mockResolvedValue({
        ...mockDraftEvent,
        status: EventStatus.CANCELLED,
      });

      const result = await service.cancel('event-123');

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { status: EventStatus.CANCELLED },
        include: expect.any(Object),
      });
      expect(result.status).toBe(EventStatus.CANCELLED);
    });

    it('should cancel a published event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);
      mockPrisma.event.update.mockResolvedValue({
        ...mockPublishedEvent,
        status: EventStatus.CANCELLED,
      });

      const result = await service.cancel('event-456');

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 'event-456' },
        data: { status: EventStatus.CANCELLED },
        include: expect.any(Object),
      });
      expect(result.status).toBe(EventStatus.CANCELLED);
    });

    it('should throw BadRequestException when cancelling already cancelled event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockCancelledEvent);

      await expect(service.cancel('event-789')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel('event-789')).rejects.toThrow(
        'Event is already cancelled',
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.cancel('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============ REMOVE (DELETE) ============
  describe('remove', () => {
    it('should delete a draft event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockDraftEvent);
      mockPrisma.event.delete.mockResolvedValue(mockDraftEvent);

      await service.remove('event-123');

      expect(mockPrisma.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-123' },
      });
    });

    it('should delete a cancelled event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockCancelledEvent);
      mockPrisma.event.delete.mockResolvedValue(mockCancelledEvent);

      await service.remove('event-789');

      expect(mockPrisma.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-789' },
      });
    });

    it('should throw BadRequestException when deleting a published event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(mockPublishedEvent);

      await expect(service.remove('event-456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('event-456')).rejects.toThrow(
        'Cannot delete a published event. Cancel it first.',
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
