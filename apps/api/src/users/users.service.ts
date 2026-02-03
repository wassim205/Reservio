import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaClient, User, Prisma } from 'generated/prisma';

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
}
