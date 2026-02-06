import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { RegistrationsService } from './registrations.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthRequest {
  user: {
    sub: string;
    email: string;
    role: Role;
  };
}

@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  // ============ PARTICIPANT ENDPOINTS ============

  // POST /events/:eventId/register - Request a reservation
  @Post('events/:eventId/register')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT)
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Param('eventId') eventId: string,
    @Request() req: AuthRequest,
  ) {
    const registration = await this.registrationsService.create(
      eventId,
      req.user.sub,
    );
    return {
      registration,
      message: 'Reservation request submitted successfully',
    };
  }

  // GET /registrations/my - Get current user's registrations
  @Get('registrations/my')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT)
  async getMyRegistrations(@Request() req: AuthRequest) {
    const registrations = await this.registrationsService.findByUser(
      req.user.sub,
    );
    return { registrations };
  }

  // DELETE /registrations/:id - Cancel own reservation
  @Delete('registrations/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT)
  async cancelRegistration(
    @Param('id') id: string,
    @Request() req: AuthRequest,
  ) {
    const registration = await this.registrationsService.cancelOwn(
      id,
      req.user.sub,
    );
    return { registration, message: 'Reservation cancelled successfully' };
  }

  // ============ ADMIN ENDPOINTS ============

  @Get('events/:eventId/registrations')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getEventRegistrations(@Param('eventId') eventId: string) {
    const registrations = await this.registrationsService.findByEvent(eventId);
    return { registrations };
  }

  @Post('registrations/:id/confirm')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async confirmRegistration(@Param('id') id: string) {
    const registration = await this.registrationsService.confirm(id);
    return { registration, message: 'Reservation confirmed successfully' };
  }

  @Post('registrations/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectRegistration(@Param('id') id: string) {
    const registration = await this.registrationsService.reject(id);
    return { registration, message: 'Reservation rejected successfully' };
  }
}
