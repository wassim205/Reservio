import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { TicketsService } from './tickets.service';
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

@Controller('registrations')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * GET /registrations/:id/ticket
   * Download PDF ticket for a confirmed registration
   * - Only accessible by the registration owner (PARTICIPANT)
   * - Only available for CONFIRMED registrations
   */
  @Get(':id/ticket')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.PARTICIPANT)
  async downloadTicket(
    @Param('id') registrationId: string,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.ticketsService.generateTicketPdf(
      registrationId,
      req.user.sub,
    );

    // Set response headers for PDF download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${registrationId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
