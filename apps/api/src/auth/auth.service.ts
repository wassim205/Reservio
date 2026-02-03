import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

export interface TokenPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  private readonly refreshTokenExpiryDays = 7;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, fullname } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      fullname,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Find the refresh token in the database
    const storedToken = await this.usersService.findRefreshToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Delete expired token
      await this.usersService.deleteRefreshToken(refreshToken);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Get user
    const user = await this.usersService.findById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete the old refresh token (rotation)
    await this.usersService.deleteRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    // Delete the refresh token from the database
    await this.usersService.deleteRefreshToken(refreshToken);

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    // Delete all refresh tokens for the user
    await this.usersService.deleteAllRefreshTokens(userId);

    return { message: 'Logged out from all devices successfully' };
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = { sub: user.id, email: user.email };

    // Generate access token (short-lived)
    const access_token = await this.jwtService.signAsync(payload);

    // Generate refresh token (long-lived, stored in database)
    const refresh_token = this.generateRefreshToken();

    // Calculate expiry date for refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    // Store refresh token in database
    await this.usersService.createRefreshToken({
      token: refresh_token,
      userId: user.id,
      expiresAt,
    });

    return {
      access_token,
      refresh_token,
    };
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}
