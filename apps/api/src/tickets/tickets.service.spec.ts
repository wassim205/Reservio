import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    registration: {
      findUnique: jest.fn(),
    },
  })),
}));

describe('TicketsService', () => {
  let service: TicketsService;
  let mockPrisma: {
    registration: {
      findUnique: jest.Mock;
    };
  };

  // Test data
  const mockUser = {
    id: 'user-123',
    fullname: 'Jean Dupont',
    email: 'jean@example.com',
  };

  const mockEvent = {
    title: 'Tech Conference 2026',
    location: 'Paris Convention Center',
    startDate: new Date('2026-03-15T09:00:00Z'),
    endDate: new Date('2026-03-15T18:00:00Z'),
  };

  const mockConfirmedRegistration = {
    id: 'reg-123',
    status: 'CONFIRMED',
    userId: 'user-123',
    eventId: 'event-123',
    user: mockUser,
    event: mockEvent,
    createdAt: new Date('2026-02-01T10:00:00Z'),
    updatedAt: new Date('2026-02-02T14:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketsService],
    }).compile();

    service = module.get<TicketsService>(TicketsService);

    // Access the mocked prisma client
    mockPrisma = (service as unknown as { prisma: typeof mockPrisma }).prisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTicketData', () => {
    it('should return ticket data for a confirmed registration', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(
        mockConfirmedRegistration,
      );

      const result = await service.getTicketData('reg-123', 'user-123');

      expect(result).toEqual({
        registrationId: 'reg-123',
        participantName: 'Jean Dupont',
        participantEmail: 'jean@example.com',
        eventTitle: 'Tech Conference 2026',
        eventLocation: 'Paris Convention Center',
        eventStartDate: mockEvent.startDate,
        eventEndDate: mockEvent.endDate,
        confirmedAt: mockConfirmedRegistration.updatedAt,
      });
    });

    it('should throw NotFoundException if registration does not exist', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(null);

      await expect(
        service.getTicketData('non-existent', 'user-123'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getTicketData('non-existent', 'user-123'),
      ).rejects.toThrow('Registration with ID non-existent not found');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(
        mockConfirmedRegistration,
      );

      await expect(
        service.getTicketData('reg-123', 'different-user'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.getTicketData('reg-123', 'different-user'),
      ).rejects.toThrow('You can only download tickets for your own registrations');
    });

    it('should throw BadRequestException if registration is PENDING', async () => {
      const pendingRegistration = {
        ...mockConfirmedRegistration,
        status: 'PENDING',
      };
      mockPrisma.registration.findUnique.mockResolvedValue(pendingRegistration);

      await expect(
        service.getTicketData('reg-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getTicketData('reg-123', 'user-123'),
      ).rejects.toThrow('Ticket is only available for confirmed registrations');
    });

    it('should throw BadRequestException if registration is CANCELLED', async () => {
      const cancelledRegistration = {
        ...mockConfirmedRegistration,
        status: 'CANCELLED',
      };
      mockPrisma.registration.findUnique.mockResolvedValue(
        cancelledRegistration,
      );

      await expect(
        service.getTicketData('reg-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getTicketData('reg-123', 'user-123'),
      ).rejects.toThrow('Ticket is only available for confirmed registrations');
    });
  });

  describe('generateTicketPdf', () => {
    it('should generate a PDF buffer for a confirmed registration', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(
        mockConfirmedRegistration,
      );

      const result = await service.generateTicketPdf('reg-123', 'user-123');

      // Verify it returns a Buffer
      expect(result).toBeInstanceOf(Buffer);

      // Verify PDF header (PDF files start with %PDF-)
      const pdfHeader = result.subarray(0, 5).toString();
      expect(pdfHeader).toBe('%PDF-');

      // Verify it has content
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw error if registration is not found', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(null);

      await expect(
        service.generateTicketPdf('non-existent', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if user is not the owner', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(
        mockConfirmedRegistration,
      );

      await expect(
        service.generateTicketPdf('reg-123', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error if registration is not confirmed', async () => {
      const pendingRegistration = {
        ...mockConfirmedRegistration,
        status: 'PENDING',
      };
      mockPrisma.registration.findUnique.mockResolvedValue(pendingRegistration);

      await expect(
        service.generateTicketPdf('reg-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
