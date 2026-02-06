import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    fullname: 'Test User',
    role: Role.PARTICIPANT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRefreshToken = {
    id: 'token-123',
    token: 'valid-refresh-token',
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      createRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn(),
      deleteAllRefreshTokens: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-access-token'),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      fullname: 'New User',
    };

    it('should register a new user successfully', async () => {
      const newUser = {
        ...mockUser,
        email: registerDto.email,
        fullname: registerDto.fullname,
      };

      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      usersService.create.mockResolvedValue(newUser);
      usersService.createRefreshToken.mockResolvedValue(mockRefreshToken);

      const result = await authService.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword',
        fullname: registerDto.fullname,
      });
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if user already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.createRefreshToken.mockResolvedValue(mockRefreshToken);

      const result = await authService.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      usersService.findRefreshToken.mockResolvedValue(mockRefreshToken);
      usersService.findById.mockResolvedValue(mockUser);
      usersService.deleteRefreshToken.mockResolvedValue(undefined);
      usersService.createRefreshToken.mockResolvedValue(mockRefreshToken);

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(usersService.findRefreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(usersService.deleteRefreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      usersService.findRefreshToken.mockResolvedValue(null);

      await expect(authService.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
      };
      usersService.findRefreshToken.mockResolvedValue(expiredToken);

      await expect(authService.refreshTokens('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.deleteRefreshToken).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findRefreshToken.mockResolvedValue(mockRefreshToken);
      usersService.findById.mockResolvedValue(null);

      await expect(authService.refreshTokens('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      usersService.deleteRefreshToken.mockResolvedValue(undefined);

      const result = await authService.logout('refresh-token');

      expect(usersService.deleteRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      usersService.deleteAllRefreshTokens.mockResolvedValue(undefined);

      const result = await authService.logoutAll('user-123');

      expect(usersService.deleteAllRefreshTokens).toHaveBeenCalledWith(
        'user-123',
      );
      expect(result.message).toBe('Logged out from all devices successfully');
    });
  });
});
