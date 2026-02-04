import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { UsersService } from './users.service';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Role: { ADMIN: 'ADMIN', PARTICIPANT: 'PARTICIPANT' },
    Prisma: {
      PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
        code: string;
        constructor(message: string, { code }: { code: string }) {
          super(message);
          this.code = code;
        }
      },
    },
  };
});

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullname: 'Test User',
    role: Role.PARTICIPANT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRefreshToken = {
    id: 'token-123',
    token: 'refresh-token',
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockPrisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createUserData = {
      email: 'new@example.com',
      password: 'hashedPassword',
      fullname: 'New User',
    };

    it('should create a new user', async () => {
      const newUser = { ...mockUser, ...createUserData };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const result = await service.create(createUserData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: createUserData,
      });
      expect(result).toEqual(newUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      const { Prisma } = jest.requireMock('@prisma/client');
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002' },
      );
      mockPrisma.user.create.mockRejectedValue(prismaError);

      await expect(service.create(createUserData)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('Refresh Token Methods', () => {
    describe('createRefreshToken', () => {
      it('should create a refresh token', async () => {
        mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshToken);

        const result = await service.createRefreshToken({
          token: 'refresh-token',
          userId: 'user-123',
          expiresAt: mockRefreshToken.expiresAt,
        });

        expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
        expect(result).toEqual(mockRefreshToken);
      });
    });

    describe('findRefreshToken', () => {
      it('should find a refresh token', async () => {
        mockPrisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);

        const result = await service.findRefreshToken('refresh-token');

        expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
          where: { token: 'refresh-token' },
        });
        expect(result).toEqual(mockRefreshToken);
      });
    });

    describe('deleteRefreshToken', () => {
      it('should delete a refresh token', async () => {
        mockPrisma.refreshToken.delete.mockResolvedValue(mockRefreshToken);

        await service.deleteRefreshToken('refresh-token');

        expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
          where: { token: 'refresh-token' },
        });
      });
    });

    describe('deleteAllRefreshTokens', () => {
      it('should delete all refresh tokens for a user', async () => {
        mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

        await service.deleteAllRefreshTokens('user-123');

        expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
          where: { userId: 'user-123' },
        });
      });
    });
  });
});
