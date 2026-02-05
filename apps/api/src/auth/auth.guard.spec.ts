import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'PARTICIPANT',
  };

  beforeEach(async () => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  // Helper to create mock ExecutionContext
  const createMockContext = (options: {
    cookies?: Record<string, string>;
    authHeader?: string;
  }): ExecutionContext => {
    const request = {
      cookies: options.cookies || {},
      headers: {
        authorization: options.authHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access with valid token from cookies', async () => {
      const context = createMockContext({
        cookies: { access_token: 'valid-token' },
      });
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
    });

    it('should allow access with valid token from Authorization header', async () => {
      const context = createMockContext({
        authHeader: 'Bearer valid-token',
      });
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
    });

    it('should prefer cookies over Authorization header', async () => {
      const context = createMockContext({
        cookies: { access_token: 'cookie-token' },
        authHeader: 'Bearer header-token',
      });
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      await guard.canActivate(context);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie-token', {
        secret: 'test-secret',
      });
    });

    it('should attach user payload to request', async () => {
      const request = {
        cookies: { access_token: 'valid-token' },
        headers: {},
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      await guard.canActivate(context);

      expect(request['user']).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const context = createMockContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing access token',
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const context = createMockContext({
        cookies: { access_token: 'invalid-token' },
      });
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired access token',
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const context = createMockContext({
        cookies: { access_token: 'expired-token' },
      });
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should ignore non-Bearer Authorization header', async () => {
      const context = createMockContext({
        authHeader: 'Basic some-basic-auth',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing access token',
      );
    });

    it('should handle empty cookies object', async () => {
      const context = createMockContext({
        cookies: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing access token',
      );
    });

    it('should use ACCESS_TOKEN_SECRET from config', async () => {
      const context = createMockContext({
        cookies: { access_token: 'valid-token' },
      });
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      await guard.canActivate(context);

      expect(configService.get).toHaveBeenCalledWith('ACCESS_TOKEN_SECRET');
    });
  });
});
