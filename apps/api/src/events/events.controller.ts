import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

// Request with JWT payload
interface AuthRequest {
  user: {
    sub: string;
    email: string;
    role: Role;
  };
}

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ============ PUBLIC ENDPOINTS ============

  // GET /events/published - Get all published events (public)
  @Get('published')
  async findPublished() {
    const events = await this.eventsService.findPublished();
    return { events };
  }

  // GET /events/:id - Get a single event by ID (public for published)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOne(id);
    return { event };
  }

  // ============ ADMIN-ONLY ENDPOINTS ============

  // GET /events - Get all events with optional status filter (admin only)
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(@Query('status') status?: EventStatus) {
    const events = await this.eventsService.findAll(status);
    return { events };
  }

  // POST /events - Create a new event (admin only)
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: AuthRequest,
  ) {
    const event = await this.eventsService.create(createEventDto, req.user.sub);
    return { event, message: 'Event created successfully' };
  }

  // PUT /events/:id - Update an event (admin only)
  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const event = await this.eventsService.update(id, updateEventDto);
    return { event, message: 'Event updated successfully' };
  }

  // POST /events/:id/publish - Publish an event (admin only)
  @Post(':id/publish')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async publish(@Param('id') id: string) {
    const event = await this.eventsService.publish(id);
    return { event, message: 'Event published successfully' };
  }

  // POST /events/:id/cancel - Cancel an event (admin only)
  @Post(':id/cancel')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    const event = await this.eventsService.cancel(id);
    return { event, message: 'Event cancelled successfully' };
  }

  // DELETE /events/:id - Delete an event (admin only)
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.eventsService.remove(id);
  }
}
