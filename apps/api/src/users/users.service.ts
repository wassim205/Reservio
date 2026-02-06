import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaClient, Prisma, User, RefreshToken } from '@prisma/client';

interface CreateRefreshTokenInput {
  token: string;
  userId: string;
  expiresAt: Date;
}

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(createUserData: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: createUserData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('User with this email already exists');
        }
      }
      throw error;
    }
  }

  // Refresh Token Methods
  async createRefreshToken(
    data: CreateRefreshTokenInput,
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    try {
      await this.prisma.refreshToken.delete({
        where: { token },
      });
    } catch {
      // Token might not exist, ignore error
    }
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
