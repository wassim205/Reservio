import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  // Helper to create mock ExecutionContext with user
  const createMockContext = (user?: { role: Role }): ExecutionContext => {
    const request = { user };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      const context = createMockContext({ role: Role.PARTICIPANT });
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when roles array is empty', () => {
      const context = createMockContext({ role: Role.PARTICIPANT });
      reflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow ADMIN access to ADMIN-only route', () => {
      const context = createMockContext({ role: Role.ADMIN });
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow PARTICIPANT access to PARTICIPANT-only route', () => {
      const context = createMockContext({ role: Role.PARTICIPANT });
      reflector.getAllAndOverride.mockReturnValue([Role.PARTICIPANT]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      const context = createMockContext({ role: Role.ADMIN });
      reflector.getAllAndOverride.mockReturnValue([
        Role.ADMIN,
        Role.PARTICIPANT,
      ]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny PARTICIPANT access to ADMIN-only route', () => {
      const context = createMockContext({ role: Role.PARTICIPANT });
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied: Requires one of these roles: ADMIN',
      );
    });

    it('should throw ForbiddenException when user has no role', () => {
      const request = { user: { sub: 'user-123', email: 'test@test.com' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied: No role found',
      );
    });

    it('should throw ForbiddenException when no user in request', () => {
      const context = createMockContext(undefined);
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied: No role found',
      );
    });

    it('should use ROLES_KEY to get metadata', () => {
      const context = createMockContext({ role: Role.ADMIN });
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        expect.any(Array),
      );
    });

    it('should check both handler and class for roles metadata', () => {
      const mockHandler = jest.fn();
      const mockClass = jest.fn();
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.ADMIN } }),
        }),
        getHandler: () => mockHandler,
        getClass: () => mockClass,
      } as unknown as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockHandler,
        mockClass,
      ]);
    });
  });

  describe('role hierarchy scenarios', () => {
    it('should not give ADMIN access to PARTICIPANT-only routes by default', () => {
      // Note: If you want ADMIN to access all routes, you'd need to modify the guard
      const context = createMockContext({ role: Role.ADMIN });
      reflector.getAllAndOverride.mockReturnValue([Role.PARTICIPANT]);

      // Current implementation: ADMIN cannot access PARTICIPANT-only routes
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access when route allows multiple roles including user role', () => {
      const context = createMockContext({ role: Role.PARTICIPANT });
      reflector.getAllAndOverride.mockReturnValue([
        Role.ADMIN,
        Role.PARTICIPANT,
      ]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
